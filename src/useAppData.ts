/**
 * useAppData.ts — Data Hook
 * Lớp Toán NK · v28.0
 *
 * Tách toàn bộ fetch → transform → cache logic ra khỏi App.tsx.
 * App.tsx trước đây chứa 150+ dòng loadData inline.
 *
 * Trả về: { students, uClasses, payments, expenses, tlogs,
 *            teachers, leaveRequests, materials, summary,
 *            loading, gsOk, loadData }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import type { Student, Payment, Expense, TeachingLog, Teacher, LeaveRequest, Material, SummaryData } from './types';
import { fetchWithTimeout, formatDate, parseDMY, resolveTeacher, loadLocal } from './helpers';
import { buildChartData } from './measures';
import { RULES } from './rules';

interface UseAppDataOptions {
  scriptUrl:   string;
  teacherList: string[];
}

interface AppData {
  students:      Student[];
  uClasses:      any[];
  payments:      Payment[];
  expenses:      Expense[];
  tlogs:         any[];
  teachers:      Teacher[];
  leaveRequests: LeaveRequest[];
  materials:     Material[];
  summary:       SummaryData | null;
  loading:       boolean;
  gsOk:          boolean | null;
  loadData:      () => Promise<void>;
}

export function useAppData({ scriptUrl, teacherList }: UseAppDataOptions): AppData {
  const [students,      setStudents]      = useState<Student[]>([]);
  const [uClasses,      setUClasses]      = useState<any[]>([]);
  const [payments,      setPayments]      = useState<Payment[]>([]);
  const [expenses,      setExpenses]      = useState<Expense[]>([]);
  const [tlogs,         setTlogs]         = useState<any[]>([]);
  /* ── 3 domain này load từ localStorage ngay khi init ── */
  const [teachers,      setTeachers]      = useState<Teacher[]>(()      => loadLocal<Teacher[]>('ltn-teachers', []));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadLocal<LeaveRequest[]>('ltn-leaves', []));
  const [materials,     setMaterials]     = useState<Material[]>(()     => loadLocal<Material[]>('ltn-materials', []));
  const [summary,       setSummary]       = useState<SummaryData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [gsOk,          setGsOk]          = useState<boolean | null>(null);

  const loadingRef = useRef(false);
  const silentRef  = useRef(false);

  /* ── Transform raw JSON → typed objects ── */
  const transformStudents = useCallback((raw: any[]): Student[] =>
    raw.map(s => ({
      id:            String(s['Mã HS'] || ''),
      name:          String(s['Họ và tên học sinh'] || '---'),
      dob:           String(s['Ngày tháng năm sinh'] || ''),
      branch:        String(s['Cơ sở học tập'] || ''),
      grade:         String(s['Khối lớp hiện tại'] || ''),
      school:        String(s['Trường đang học'] || ''),
      teacher:       resolveTeacher(s['Giáo viên trực tiếp giảng dạy'], teacherList),
      parentName:    String(s['Họ và tên phụ huynh'] || ''),
      parentPhone:   String(s['Số điện thoại phụ huynh (Zalo)'] || ''),
      studentPhone:  String(s['Số điện thoại học sinh'] || ''),
      address:       String(s['Địa chỉ thường trú'] || ''),
      academicLevel: String(s['Học lực môn Toán hiện tại'] || ''),
      goal:          String(s['Mục tiêu điểm số học kỳ tới'] || ''),
      supportNeeded: String(s['Kiến thức em cần hỗ trợ thêm'] || ''),
      classId:       String(s['Mã Lớp'] || ''),
      startDate:     String(s['Ngày bắt đầu'] || ''),
      endDate:       String(s['Ngày kết thúc'] || ''),
      status:        String(s['Trạng thái'] || ''),
    }))
  , [teacherList]);

  const transformPayments = useCallback((raw: any[], hs: Student[]): Payment[] =>
    raw.map((p, i) => {
      const rawDate    = String(p['Ngày CT'] || '').replace(/\//g, '').replace(/\s.*/,'');
      const maHS       = String(p['Mã HS'] || 'X').trim();
      const fallbackId = `PT-${rawDate || '0'}-${maHS}-${i}`;
      const d          = p['Số hiệu CT'] || fallbackId;
      return {
        id:          String(d),
        date:        String(p['Ngày CT'] || ''),
        docNum:      String(d),
        studentId:   String(p['Mã HS'] || ''),
        studentName: hs.find(s => s.id === String(p['Mã HS'] || ''))?.name || '?',
        payer:       String(p['Người thanh toán'] || '---'),
        method:      String(p['Hình thức'] || '---'),
        description: String(p['Diễn giải'] || ''),
        amount:      Number(p['Số tiền']) || 0,
        note:        String(p['Ghi chú'] || ''),
      };
    })
  , []);

  const transformExpenses = useCallback((raw: any[]): Expense[] =>
    raw.map((e, i) => {
      const rawDate    = String(e['Ngày CT'] || '').replace(/\//g, '').replace(/\s.*/,'');
      const desc       = String(e['Nội dung chi'] || '').slice(0, 6).replace(/\s/g, '');
      const fallbackId = `PC-${rawDate || '0'}-${desc || 'X'}-${i}`;
      const d          = e['Số hiệu CT'] || fallbackId;
      return {
        id:          String(d),
        date:        String(e['Ngày CT'] || ''),
        docNum:      String(d),
        description: String(e['Nội dung chi'] || ''),
        category:    String(e['Hạng mục'] || ''),
        amount:      Number(e['Số tiền']) || 0,
        spender:     String(e['Người chi'] || ''),
      };
    })
  , []);

  const transformLogs = useCallback((raw: any[], attendanceLogs: any[]): any[] =>
    raw.map(l => {
      const dt    = l['Ngày'];
      const ci    = l['Mã Lớp'];
      const caVal = String(l['Ca dạy'] || '');
      const dtTs  = parseDMY(dt);
      const atts  = attendanceLogs.filter(a => {
        if (parseDMY(a['Ngày']) !== dtTs)   return false;
        if (a['Mã Lớp'] !== ci)             return false;
        if (caVal && a['Ca dạy'] && a['Ca dạy'] !== caVal) return false;
        return true;
      });
      return {
        rawDate:          String(dt || ''),
        date:             String(dt || ''),
        originalDate:     String(dt || ''),
        originalClassId:  String(ci || ''),
        originalCaDay:    String(l['Ca dạy'] || ''),
        classId:          String(ci || ''),
        content:          String(l['Nội dung bài dạy'] || '---'),
        homework:         String(l['Bài tập về nhà'] || '---'),
        teacherNote:      String(l['Ghi chú GV'] || ''),
        teacherName:      String(l['Giáo viên'] || '---'),
        caDay:            String(l['Ca dạy'] || ''),
        present: atts.filter((a: any) => a['Trạng thái'] === 'Có mặt').length,
        absent:  atts.filter((a: any) => a['Trạng thái'] === 'Vắng').length,
        late:    atts.filter((a: any) => a['Trạng thái'] === 'Muộn').length,
        attendanceList: atts,
      };
    }).sort((a: any, b: any) => parseDMY(b.date) - parseDMY(a.date))
  , []);

  /* ── Core fetch + apply cache on error ── */
  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silentRef.current) setLoading(true);

    try {
      const res = await fetchWithTimeout(scriptUrl, {
        method: 'POST',
        redirect: 'follow',
        timeout: RULES.network.fetchTimeout,
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'getData' }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'GAS error');

      const raw = data;

      // GAS v29 trả về: { hs, uCls, py, ex, logs, tv, hl, summary }
      // Fallback sang key cũ nếu có
      const rawStudents  = raw.hs       || raw.students      || [];
      const rawPayments  = raw.py       || raw.payments       || [];
      const rawExpenses  = raw.ex       || raw.expenses       || [];
      const rawLogs      = raw.logs     || raw.teachingLogs   || [];
      const rawClasses   = raw.uCls     || raw.classes        || [];
      const rawTeachers  = raw.tv       || raw.teachers       || [];
      const rawMaterials = raw.hl       || raw.materials      || [];

      // GAS v29 đã transform sẵn → dùng trực tiếp nếu có field 'id'
      // nếu là raw sheet (field tiếng Việt) → dùng transform cũ
      const hs = rawStudents.length > 0 && rawStudents[0].id
        ? rawStudents.map((s: any) => ({
            id:            String(s.id            || ''),
            name:          String(s.name          || '---'),
            dob:           String(s.dob           || ''),
            branch:        String(s.branch        || ''),
            grade:         String(s.grade         || ''),
            school:        String(s.school        || ''),
            teacher:       resolveTeacher(s.teacher, teacherList),
            parentName:    String(s.parentName    || ''),
            parentPhone:   String(s.parentPhone   || ''),
            studentPhone:  String(s.studentPhone  || ''),
            address:       String(s.address       || ''),
            academicLevel: String(s.academicLevel || ''),
            goal:          String(s.goal          || ''),
            supportNeeded: String(s.supportNeeded || ''),
            classId:       String(s.classId       || ''),
            startDate:     String(s.startDate     || ''),
            endDate:       String(s.endDate       || ''),
            status:        String(s.status        || 'active'),
            notes:         String(s.notes         || ''),
            facebookUrl:   String(s.facebookUrl   || ''),
          }))
        : transformStudents(rawStudents);

      const py = rawPayments.length > 0 && rawPayments[0].docNum
        ? rawPayments.map((p: any) => ({
            id:          String(p.docNum      || ''),
            date:        String(p.date        || ''),
            docNum:      String(p.docNum      || ''),
            studentId:   String(p.studentId   || ''),
            studentName: String(p.studentName || hs.find((s: any) => s.id === p.studentId)?.name || '?'),
            payer:       String(p.payer       || '---'),
            method:      String(p.method      || '---'),
            description: String(p.description || ''),
            amount:      Number(p.amount)     || 0,
            note:        String(p.note        || ''),
            thangHP:     Number(p.thangHP)    || 0,
            namHP:       Number(p.namHP)      || 0,
          }))
        : transformPayments(rawPayments, hs);

      const ex = rawExpenses.length > 0 && rawExpenses[0].docNum
        ? rawExpenses.map((e: any) => ({
            id:          String(e.docNum      || ''),
            date:        String(e.date        || ''),
            docNum:      String(e.docNum      || ''),
            description: String(e.description || ''),
            category:    String(e.category    || ''),
            amount:      Number(e.amount)     || 0,
            spender:     String(e.spender     || ''),
          }))
        : transformExpenses(rawExpenses);

      const logs = rawLogs.length > 0 && rawLogs[0].classId
        ? rawLogs.map((l: any) => ({
            rawDate:         String(l.rawDate         || l.date || ''),
            date:            String(l.date            || ''),
            originalDate:    String(l.originalDate    || l.date || ''),
            originalClassId: String(l.originalClassId || l.classId || ''),
            originalCaDay:   String(l.originalCaDay   || l.caDay || ''),
            classId:         String(l.classId         || ''),
            content:         String(l.content         || '---'),
            homework:        String(l.homework        || '---'),
            teacherNote:     String(l.teacherNote     || ''),
            teacherName:     resolveTeacher(l.teacherName, teacherList),
            caDay:           String(l.caDay           || ''),
            present:         Number(l.present)        || 0,
            absent:          Number(l.absent)         || 0,
            late:            Number(l.late)           || 0,
            attendanceList:  (l.attendanceList || []).map((a: any) => ({
              maHS:          String(a.maHS        || a.MaHS    || a['Mã HS']    || ''),
              'Mã HS':       String(a.maHS        || a.MaHS    || a['Mã HS']    || ''),
              tenHS:         String(a.tenHS       || ''),
              'Trạng thái':  String(a.trangThai   || a.TrangThai || a['Trạng thái'] || 'Có mặt'),
              'Ghi chú':     String(a.ghiChu      || a.GhiChu   || a['Ghi chú']   || ''),
            })),
          })).sort((a: any, b: any) => parseDMY(b.date) - parseDMY(a.date))
        : transformLogs(rawLogs, []);

      const clsMap = new Map<string, any>();
      rawClasses.forEach((c: any) => {
        // GAS v29 dùng key MaLop, app cũ dùng 'Mã Lớp'
        const maLop = c.MaLop || c['Ma Lop'] || c['Mã Lớp'] || '';
        if (!maLop || clsMap.has(maLop)) return;
        clsMap.set(maLop, {
          'Mã Lớp':    maLop,
          'Tên Lớp':   c.TenLop  || c['Tên Lớp']  || '',
          'Khối':      c.Khoi    || c['Khối']      || '',
          'Giáo viên': resolveTeacher(c.GiaoVien || c['Giáo viên'] || '', teacherList),
          'Cơ sở':     c.CoSo    || c['Cơ sở']    || '',
          'Buổi 1':    c.Buoi1   || c['Buổi 1']   || '',
          'Buổi 2':    c.Buoi2   || c['Buổi 2']   || '',
          'Buổi 3':    c.Buoi3   || c['Buổi 3']   || '',
        });
      });

      const newTeachers  = rawTeachers.map((t: any) => ({ ...t, classes: t.classes || [] }));
      const newMaterials2 = rawMaterials.map((m: any) => ({ ...m, tags: Array.isArray(m.tags) ? m.tags : (m.tags ? String(m.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []) }));

      const newLeaves     = (raw.leaveRequests || []).map((r: any) => ({ ...r }));

      setStudents(hs);
      setPayments(py);
      setExpenses(ex);
      setUClasses(Array.from(clsMap.values()));
      setTlogs(logs);

      if (newTeachers.length > 0) {
        setTeachers(newTeachers);
        try { localStorage.setItem('ltn-teachers', JSON.stringify(newTeachers)); } catch {}
      }
      if (newLeaves.length > 0) {
        setLeaveRequests(newLeaves);
        try { localStorage.setItem('ltn-leaves', JSON.stringify(newLeaves)); } catch {}
      }
      if (newMaterials2.length > 0) {
        setMaterials(newMaterials2);
        try { localStorage.setItem('ltn-materials', JSON.stringify(newMaterials2)); } catch {}
      }
      setSummary({
        totalRevenue: py.reduce((s, p) => s + p.amount, 0),
        totalExpense: ex.reduce((s, e) => s + e.amount, 0),
        chart:        buildChartData(py, ex),
      });
      setGsOk(true);

      try {
        localStorage.setItem('ltn-cache', JSON.stringify({
          hs, py, ex, uCls: Array.from(clsMap.values()), logs,
        }));
      } catch {}

    } catch (err: any) {
      setGsOk(false);
      toast.error(
        err.message?.includes('timeout')
          ? '⏱️ Kết nối quá lâu. Đang dùng cache.'
          : '⚠️ Lỗi tải dữ liệu. Đang dùng cache.'
      );
      try {
        const c = localStorage.getItem('ltn-cache');
        if (c) {
          const { hs, py, ex, uCls, logs } = JSON.parse(c);
          setStudents(hs || []);
          setPayments(py || []);
          setExpenses(ex || []);
          setUClasses(uCls || []);
          setTlogs(logs || []);
          setSummary({
            totalRevenue: (py || []).reduce((s: number, p: any) => s + p.amount, 0),
            totalExpense: (ex || []).reduce((s: number, e: any) => s + e.amount, 0),
            chart: [],
          });
        }
      } catch {}
    } finally {
      setLoading(false);
      loadingRef.current = false;
      silentRef.current  = false;
    }
  }, [scriptUrl, teacherList, transformStudents, transformPayments, transformExpenses, transformLogs]);

  /* ── Initial load ── */
  useEffect(() => { loadData(); }, [loadData]);

  /* ── Auto reload: online event + visibility + interval ── */
  const lastLoadTimeRef = useRef(0);
  useEffect(() => {
    const reload = () => {
      if (Date.now() - lastLoadTimeRef.current > RULES.network.silentReloadCooldown) {
        silentRef.current = true;
        loadData();
        lastLoadTimeRef.current = Date.now();
      }
    };
    const handleOnline = () => {
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

  /* ── Expose silentRef setter cho domain hooks ── */
  (loadData as any).__setSilent = () => { silentRef.current = true; };

  return {
    students, uClasses, payments, expenses, tlogs,
    teachers, leaveRequests, materials, summary,
    loading, gsOk, loadData,
    /* setters — cho useDomains optimistic updates */
    setStudents, setPayments, setExpenses,
    setTeachers, setMaterials, setLeaveRequests,
  };
}
