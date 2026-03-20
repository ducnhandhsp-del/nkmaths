/**
 * useAppData.ts — Data Hook
 * Lớp Toán NK · v29.0
 *
 * PHASE 1 FIXES:
 *  [S1] Xoá __setSilent hack — silentRef được return trực tiếp
 *  [S2] Transform functions chuyển ra module level (pure functions) →
 *       loadData chỉ còn phụ thuộc [scriptUrl], không re-create khi teacherList thay đổi
 *  [S3] Không còn race condition vì silentRef là cùng 1 instance Ref xuyên suốt
 *  [L2] Dùng field-existence check thay vì length > 0 để có thể xóa sạch teachers/materials
 *  [L3] summary chuyển thành useMemo → tự cập nhật ngay sau optimistic payment/expense
 *  [D2] ltn-cache gộp teachers + materials → 1 nguồn cache thống nhất
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';

import type { Student, Payment, Expense, Teacher, LeaveRequest, Material } from './types';
import { fetchWithTimeout, parseDMY, formatDate, resolveTeacher, loadLocal } from './helpers';
import { buildChartData } from './measures';
import { RULES } from './rules';

/* ═══════════════════════════════════════════════════════════════════
   MODULE-LEVEL PURE TRANSFORM FUNCTIONS
   FIX S2: không còn là hook callbacks → không còn là dependency của loadData
   teacherList truyền vào qua tham số, không qua closure
═══════════════════════════════════════════════════════════════════ */

function txStudents(raw: any[], tl: string[]): Student[] {
  return raw.map(s => ({
    id:            String(s['Mã HS']      || s.id            || ''),
    name:          String(s['Họ và tên học sinh'] || s.name  || '---'),
    dob:           String(s['Ngày tháng năm sinh'] || s.dob  || ''),
    branch:        String(s['Cơ sở học tập']  || s.branch    || ''),
    grade:         String(s['Khối lớp hiện tại'] || s.grade  || ''),
    school:        String(s['Trường đang học'] || s.school    || ''),
    teacher:       resolveTeacher(s['Giáo viên trực tiếp giảng dạy'] || s.teacher || '', tl),
    parentName:    String(s['Họ và tên phụ huynh']  || s.parentName   || ''),
    parentPhone:   String(s['Số điện thoại phụ huynh (Zalo)'] || s.parentPhone || ''),
    studentPhone:  String(s['Số điện thoại học sinh'] || s.studentPhone || ''),
    address:       String(s['Địa chỉ thường trú'] || s.address || ''),
    academicLevel: String(s['Học lực môn Toán hiện tại'] || s.academicLevel || ''),
    goal:          String(s['Mục tiêu điểm số học kỳ tới'] || s.goal || ''),
    supportNeeded: String(s['Kiến thức em cần hỗ trợ thêm'] || s.supportNeeded || ''),
    classId:       String(s['Mã Lớp'] || s.classId    || ''),
    startDate:     String(s['Ngày bắt đầu'] || s.startDate || ''),
    endDate:       String(s['Ngày kết thúc'] || s.endDate   || ''),
    status:        String(s['Trạng thái']   || s.status     || 'active'),
    notes:         String(s.notes       || ''),
    facebookUrl:   String(s.facebookUrl || ''),
  }));
}

function txPayments(raw: any[], hs: Student[]): Payment[] {
  return raw.map((p, i) => {
    const rawDate    = String(p['Ngày CT'] || p.date || '').replace(/\//g, '').replace(/\s.*/,'');
    const maHS       = String(p['Mã HS'] || p.studentId || 'X').trim();
    const fallbackId = `PT-${rawDate || '0'}-${maHS}-${i}`;
    const d          = p['Số hiệu CT'] || p.docNum || fallbackId;
    return {
      id:          String(d),
      // B4 FIX: formatDate normalises any GAS date format (ISO / DD/MM/YYYY / ISO+T)
      // to DD/MM/YYYY so filteredLedger regex filter never misses a record.
      date:        formatDate(String(p['Ngày CT'] || p.date || '')),
      docNum:      String(d),
      studentId:   maHS,
      studentName: String(p.studentName || hs.find(s => s.id === maHS)?.name || '?'),
      payer:       String(p['Người thanh toán'] || p.payer  || '---'),
      method:      String(p['Hình thức']        || p.method || '---'),
      description: String(p['Diễn giải']        || p.description || ''),
      amount:      Number(p['Số tiền']          || p.amount) || 0,
      note:        String(p['Ghi chú']          || p.note   || ''),
      thangHP:     Number(p.thangHP) || 0,
      namHP:       Number(p.namHP)   || 0,
    };
  });
}

function txExpenses(raw: any[]): any[] {
  return raw.map((e, i) => {
    const rawDate    = String(e['Ngày CT'] || e.date || '').replace(/\//g, '').replace(/\s.*/,'');
    const desc       = String(e['Nội dung chi'] || e.description || '').slice(0, 6).replace(/\s/g, '');
    const fallbackId = `PC-${rawDate || '0'}-${desc || 'X'}-${i}`;
    const d          = e['Số hiệu CT'] || e.docNum || fallbackId;
    return {
      id:          String(d),
      // B4 FIX: same as txPayments — normalise to DD/MM/YYYY
      date:        formatDate(String(e['Ngày CT'] || e.date || '')),
      docNum:      String(d),
      description: String(e['Nội dung chi'] || e.description || ''),
      category:    String(e['Hạng mục']     || e.category    || ''),
      amount:      Number(e['Số tiền']      || e.amount) || 0,
      spender:     String(e['Người chi']    || e.spender || ''),
    };
  });
}

/**
 * normAttStatus — chuẩn hóa trạng thái điểm danh về dạng có dấu.
 * GAS cũ hoặc nhập tay có thể lưu 'Co mat', 'Vang', 'Muon' (không dấu).
 * Nếu không normalize, TuitionTab và absStats đếm thiếu vì so sánh strict === 'Có mặt'.
 */
function normAttStatus(raw: string): string {
  const s = (raw || '').trim();
  // Đã đúng dấu — trả về luôn (fast path)
  if (s === 'Có mặt' || s === 'Vắng' || s === 'Muộn') return s;
  // Normalize NFC + lowercase để so sánh không phân biệt dấu
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n === 'co mat' || n === 'comat') return 'Có mặt';
  if (n === 'vang')                    return 'Vắng';
  if (n === 'muon')                    return 'Muộn';
  // Fallback: trả về 'Có mặt' nếu không nhận ra (tránh đếm sai)
  return s || 'Có mặt';
}

function txLogs(raw: any[], tl: string[]): any[] {
  return raw.map(l => {
    const dt    = l['Ngày'] || l.date || '';
    const ci    = l['Mã Lớp'] || l.classId || '';
    const caVal = String(l['Ca dạy'] || l.caDay || '');

    /* attendanceList đã được GAS nhúng sẵn trong mỗi log record */
    const atts = (l.attendanceList || []).map((a: any) => {
      const status = normAttStatus(a.trangThai || a.TrangThai || a['Trạng thái'] || '');
      return {
        maHS:         String(a.maHS || a.MaHS || a['Mã HS'] || ''),
        'Mã HS':      String(a.maHS || a.MaHS || a['Mã HS'] || ''),
        tenHS:        String(a.tenHS || ''),
        trangThai:    status,
        'Trạng thái': status,
        'Ghi chú':    String(a.ghiChu || a.GhiChu || a['Ghi chú'] || ''),
      };
    });

    return {
      rawDate:         String(l.rawDate || dt),
      date:            String(dt),
      originalDate:    String(l.originalDate    || dt),
      originalClassId: String(l.originalClassId || ci),
      originalCaDay:   String(l.originalCaDay   || caVal),
      classId:         String(ci),
      content:         String(l['Nội dung bài dạy'] || l.content    || '---'),
      homework:        String(l['Bài tập về nhà']   || l.homework   || '---'),
      teacherNote:     String(l['Ghi chú GV']       || l.teacherNote || ''),
      teacherName:     resolveTeacher(l['Giáo viên'] || l.teacherName || '---', tl),
      caDay:           caVal,
      // Cả 'Trạng thái' lẫn trangThai đều đã normalize → dùng trực tiếp không cần fallback thêm
      present: atts.filter((a: any) => a['Trạng thái'] === 'Có mặt').length,
      absent:  atts.filter((a: any) => a['Trạng thái'] === 'Vắng').length,
      late:    atts.filter((a: any) => a['Trạng thái'] === 'Muộn').length,
      attendanceList: atts,
    };
  }).sort((a: any, b: any) => parseDMY(b.date) - parseDMY(a.date));
}

function txClasses(raw: any[], tl: string[]): any[] {
  const map = new Map<string, any>();
  raw.forEach((c: any) => {
    const maLop = c.MaLop || c['Ma Lop'] || c['Mã Lớp'] || '';
    if (!maLop || map.has(maLop)) return;
    map.set(maLop, {
      'Mã Lớp':    maLop,
      'Tên Lớp':   c.TenLop  || c['Tên Lớp']  || '',
      'Khối':      c.Khoi    || c['Khối']      || '',
      'Giáo viên': resolveTeacher(c.GiaoVien || c['Giáo viên'] || '', tl),
      'Cơ sở':     c.CoSo    || c['Cơ sở']    || '',
      'Buổi 1':    c.Buoi1   || c['Buổi 1']   || '',
      'Buổi 2':    c.Buoi2   || c['Buổi 2']   || '',
      'Buổi 3':    c.Buoi3   || c['Buổi 3']   || '',
    });
  });
  return Array.from(map.values());
}

function txTeachers(raw: any[]): Teacher[] {
  return raw.map((t: any, i: number) => ({
    id:             String(t.id             || `GV${Date.now()}-${i}`),
    name:           String(t.name           || ''),
    phone:          String(t.phone          || ''),
    email:          String(t.email          || ''),
    gender:         t.gender                || 'male',
    // FIX CRITICAL: GAS readGiaoVien returns {subject, degree, salary} NOT {specialization, qualification, baseSalary}
    specialization: String(t.specialization || t.subject || 'Toán'),
    qualification:  String(t.qualification  || t.degree  || ''),
    experience:     Number(t.experience)    || 0,
    baseSalary:     Number(t.baseSalary     || t.salary)  || 0,
    hourlyRate:     Number(t.hourlyRate)    || 0,
    allowance:      Number(t.allowance)     || 0,
    status:         String(t.status         || 'active'),
    notes:          String(t.notes          || ''),
    createdAt:      String(t.createdAt      || ''),
    classes: Array.isArray(t.classes)
      ? t.classes
      : (t.classes ? String(t.classes).split(',').map((c: string) => c.trim()).filter(Boolean) : []),
  }));
}

function txMaterials(raw: any[]): Material[] {
  return raw.map((m: any) => ({
    ...m,
    // FIX CRITICAL: GAS readHocLieu returns {title} but Material type uses {name}
    name: String(m.name || m.title || ''),
    title: String(m.title || m.name || ''),
    tags: Array.isArray(m.tags)
      ? m.tags
      : (m.tags ? String(m.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
  }));
}

/* ═══════════════════════════════════════════════════════════════════
   HOOK
═══════════════════════════════════════════════════════════════════ */

export function useAppData({ scriptUrl, teacherList }: { scriptUrl: string; teacherList: string[] }) {
  const [students,      setStudents]      = useState<Student[]>([]);
  const [uClasses,      setUClasses]      = useState<any[]>([]);
  const [payments,      setPayments]      = useState<Payment[]>([]);
  const [expenses,      setExpenses]      = useState<any[]>([]);
  const [tlogs,         setTlogs]         = useState<any[]>([]);
  const [teachers,      setTeachers]      = useState<Teacher[]>(() => loadLocal<Teacher[]>('ltn-teachers', []));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadLocal<LeaveRequest[]>('ltn-leaves', []));
  const [materials,     setMaterials]     = useState<Material[]>(() => loadLocal<Material[]>('ltn-materials', []));
  const [loading,       setLoading]       = useState(true);
  const [gsOk,          setGsOk]          = useState<boolean | null>(null);

  /* FIX L3: summary là useMemo — tự cập nhật ngay khi payments/expenses thay đổi (kể cả optimistic) */
  const summary = useMemo(() => ({
    totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
    totalExpense: expenses.reduce((s, e: any) => s + e.amount, 0),
    chart:        buildChartData(payments, expenses),
  }), [payments, expenses]);

  const loadingRef      = useRef(false);
  /* FIX S1+S3: silentRef là Ref object — return trực tiếp để useDomains set mà không cần hack */
  const silentRef       = useRef(false);
  /* FIX D4: return để useDomains reset cooldown sau manual save */
  const lastLoadTimeRef = useRef(0);
  /* FIX D5: useDomains set ref này trong withSave — auto-reload check trước khi chạy */
  const isSavingRef     = useRef(false);

  /* FIX S2: teacherListRef → loadData đọc teacherList qua ref, không qua closure */
  const teacherListRef = useRef(teacherList);
  useEffect(() => { teacherListRef.current = teacherList; }, [teacherList]);

  /* ── Core fetch ── */
  /* FIX S2: dependency chỉ còn [scriptUrl] — teacherList thay đổi KHÔNG re-create loadData */
  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silentRef.current) setLoading(true);

    const tl = teacherListRef.current; // đọc teacherList hiện tại qua ref (luôn up-to-date)

    try {
      const res = await fetchWithTimeout(scriptUrl, {
        method:   'POST',
        redirect: 'follow',
        timeout:  RULES.network.fetchTimeout,
        headers:  { 'Content-Type': 'text/plain' },
        body:     JSON.stringify({ action: 'getData' }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'GAS error');

      const raw = data;
      const rawStudents  = raw.hs  || raw.students    || [];
      const rawPayments  = raw.py  || raw.payments     || [];
      const rawExpenses  = raw.ex  || raw.expenses     || [];
      const rawLogs      = raw.logs || raw.teachingLogs || [];
      const rawClasses   = raw.uCls || raw.classes     || [];
      const rawTeachers  = raw.tv  || raw.teachers     || [];
      const rawMaterials = raw.hl  || raw.materials    || [];

      const hs   = txStudents(rawStudents, tl);
      const py   = txPayments(rawPayments, hs);
      const ex   = txExpenses(rawExpenses);
      const logs = txLogs(rawLogs, tl);
      const cls  = txClasses(rawClasses, tl);

      const newTeachers  = txTeachers(rawTeachers);
      const newMaterials = txMaterials(rawMaterials);
      const newLeaves    = (raw.leaveRequests || []).map((r: any) => ({ ...r }));

      setStudents(hs);
      setPayments(py);
      setExpenses(ex);
      setUClasses(cls);
      setTlogs(logs);

      /* FIX L2: field-existence check → đồng bộ được xóa sạch khi GAS trả mảng rỗng thực sự */
      if ('tv' in raw || 'teachers' in raw) {
        setTeachers(newTeachers);
      }
      if ('leaveRequests' in raw) {
        setLeaveRequests(newLeaves);
      }
      if ('hl' in raw || 'materials' in raw) {
        setMaterials(newMaterials);
      }

      setGsOk(true);

      /* FIX D2: cache gộp tất cả → 1 nguồn thống nhất */
      try {
        localStorage.setItem('ltn-cache', JSON.stringify({
          hs, py, ex, uCls: cls, logs,
          teachers:  newTeachers,
          materials: newMaterials,
        }));
        /* Backward compat: vẫn giữ key riêng */
        if (newTeachers.length  > 0) localStorage.setItem('ltn-teachers',  JSON.stringify(newTeachers));
        if (newMaterials.length > 0) localStorage.setItem('ltn-materials', JSON.stringify(newMaterials));
        if (newLeaves.length    > 0) localStorage.setItem('ltn-leaves',    JSON.stringify(newLeaves));
      } catch {}

    } catch (err: any) {
      setGsOk(false);
      toast.error(
        err.message?.includes('timeout')
          ? '⏱️ Kết nối quá lâu. Đang dùng cache.'
          : '⚠️ Lỗi tải dữ liệu. Đang dùng cache.'
      );
      /* FIX D2: restore cả teachers/materials từ unified cache */
      try {
        const c = localStorage.getItem('ltn-cache');
        if (c) {
          const cached = JSON.parse(c);
          setStudents(cached.hs       || []);
          setPayments(cached.py       || []);
          setExpenses(cached.ex       || []);
          setUClasses(cached.uCls     || []);
          setTlogs(cached.logs        || []);
          if (cached.teachers)  setTeachers(cached.teachers);
          if (cached.materials) setMaterials(cached.materials);
        }
      } catch {}
    } finally {
      setLoading(false);
      loadingRef.current = false;
      silentRef.current  = false;
    }
  }, [scriptUrl]); // FIX S2: chỉ phụ thuộc scriptUrl

  /* ── Initial load ── */
  useEffect(() => { loadData(); }, [loadData]);

  /* ── Auto reload: online + visibility + interval ── */
  useEffect(() => {
    const reload = () => {
      /* FIX D5: không auto-reload khi đang save để tránh state bị replace giữa chừng */
      if (isSavingRef.current) return;
      if (Date.now() - lastLoadTimeRef.current > RULES.network.silentReloadCooldown) {
        silentRef.current = true;
        loadData();
        lastLoadTimeRef.current = Date.now();
      }
    };
    const handleOnline = () => {
      if (isSavingRef.current) return; // FIX D5
      silentRef.current = true;
      loadData();
      lastLoadTimeRef.current = Date.now();
    };
    const handleVis = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) reload();
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVis);
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) reload();
    }, RULES.network.autoReloadInterval);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVis);
      clearInterval(iv);
    };
  }, [loadData]);

  return {
    students, uClasses, payments, expenses, tlogs,
    teachers, leaveRequests, materials, summary,
    loading, gsOk, loadData,
    setStudents, setUClasses, setPayments, setExpenses, setTlogs,
    setTeachers, setMaterials, setLeaveRequests,
    /* FIX S1+S3+D4: refs return trực tiếp */
    silentRef,
    lastLoadTimeRef,
    /* FIX D5: useDomains write vào đây trong withSave */
    isSavingRef,
  };
}
