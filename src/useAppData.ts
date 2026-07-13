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

import type { Student, Payment, Expense, Teacher, LeaveRequest, Material, CacheMeta, DataSyncState } from './types';
import { fetchWithTimeout, parseDMY, formatDate, resolveTeacher, loadLocal, normalizePaymentMethod, fixVietnameseText } from './helpers';
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
    createdAt:     String(s.createdAt   || s.CreatedAt || ''),
    updatedAt:     String(s.updatedAt   || s.UpdatedAt || ''),
  }));
}

function txPayments(raw: any[], hs: Student[]): Payment[] {
  return raw.map((p, i) => {
    const rawDate    = String(p.NgayThu || p['Ngày thu'] || p['Ngày CT'] || p.date || '').replace(/\//g, '').replace(/\s.*/,'');
    const maHS       = String(p.MaHS || p['Mã HS'] || p.studentId || 'X').trim();
    const fallbackId = `PT-${rawDate || '0'}-${maHS}-${i}`;
    const d          = p.MaPhieuThu || p['Mã phiếu thu'] || p['Số hiệu CT'] || p.docNum || fallbackId;
    return {
      id:          String(d),
      // B4 FIX: formatDate normalises any GAS date format (ISO / DD/MM/YYYY / ISO+T)
      // to DD/MM/YYYY so filteredLedger regex filter never misses a record.
      date:        formatDate(String(p.NgayThu || p['Ngày thu'] || p['Ngày CT'] || p.date || '')),
      docNum:      String(d),
      studentId:   maHS,
      studentName: String(p.studentName || hs.find(s => s.id === maHS)?.name || '?'),
      payer:       String(p.NguoiNop || p['Người nộp'] || p['Người thanh toán'] || p.payer  || '---'),
      method:      normalizePaymentMethod(p.HinhThuc || p['Hình thức'] || p.method || '---'),
      description: String(p.DienGiai || p['Diễn giải']        || p.description || ''),
      amount:      Number(p.SoTien || p['Số tiền']          || p.amount) || 0,
      note:        String(p.GhiChu || p['Ghi chú']          || p.note   || ''),
      thangHP:     Number(p.ThangHP || p.thangHP) || 0,
      namHP:       Number(p.NamHP || p.namHP)   || 0,
      maLop:       String(p.MaLop || p.maLop || p.classId || p['Mã Lớp'] || p['Mã lớp'] || p['Ma Lop'] || ''),
      createdAt:   String(p.createdAt || p.CreatedAt || ''),
      updatedAt:   String(p.updatedAt || p.UpdatedAt || ''),
    };
  });
}

function txExpenses(raw: any[]): any[] {
  return raw.map((e, i) => {
    const rawDate    = String(e.NgayChi || e['Ngày chi'] || e['Ngày CT'] || e.date || '').replace(/\//g, '').replace(/\s.*/,'');
    const desc       = String(e.NoiDung || e['Nội dung'] || e['Nội dung chi'] || e.description || '').slice(0, 6).replace(/\s/g, '');
    const fallbackId = `PC-${rawDate || '0'}-${desc || 'X'}-${i}`;
    const d          = e.MaPhieuChi || e['Mã phiếu chi'] || e['Số hiệu CT'] || e.docNum || fallbackId;
    return {
      id:          String(d),
      // B4 FIX: same as txPayments — normalise to DD/MM/YYYY
      date:        formatDate(String(e.NgayChi || e['Ngày chi'] || e['Ngày CT'] || e.date || '')),
      docNum:      String(d),
      description: String(e.NoiDung || e['Nội dung'] || e['Nội dung chi'] || e.description || ''),
      category:    String(e.HangMuc || e['Hạng mục']     || e.category    || ''),
      amount:      Number(e.SoTien || e['Số tiền']      || e.amount) || 0,
      spender:     String(e.NguoiChi || e['Người chi']    || e.spender || ''),
      createdAt:   String(e.createdAt || e.CreatedAt || ''),
      updatedAt:   String(e.updatedAt || e.UpdatedAt || ''),
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
  if (s === 'Có mặt' || s === 'Vắng' || s === 'Có phép' || s === 'Nghỉ có phép') {
    return s === 'Nghỉ có phép' ? 'Có phép' : s;
  }
  // Normalize NFC + lowercase để so sánh không phân biệt dấu
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n === 'co mat' || n === 'comat' || n === 'muon' || n === 'late') return 'Có mặt';
  if (n === 'vang')                    return 'Vắng';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'Có phép';
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
        loaiDiemDanh: String(a.loaiDiemDanh || a.LoaiDiemDanh || a.attendanceType || 'regular') === 'extra' ? 'extra' : 'regular',
        LoaiDiemDanh: String(a.loaiDiemDanh || a.LoaiDiemDanh || a.attendanceType || 'regular') === 'extra' ? 'extra' : 'regular',
      };
    });

    return {
      id:              String(l.id || l.maBuoi || l.MaBuoi || ''),
      maBuoi:         String(l.maBuoi || l.MaBuoi || l.id || ''),
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
      maGV:            String(l.maGV || l.MaGV || l.teacherId || ''),
      caDay:           caVal,
      lessonType:      String(l.lessonType || l.LoaiBuoiHoc || l.loaiBuoiHoc || 'regular'),
      LoaiBuoiHoc:     String(l.lessonType || l.LoaiBuoiHoc || l.loaiBuoiHoc || 'regular'),
      // Cả 'Trạng thái' lẫn trangThai đều đã normalize → dùng trực tiếp không cần fallback thêm
      present: atts.filter((a: any) => a['Trạng thái'] === 'Có mặt').length,
      absent:  atts.filter((a: any) => a['Trạng thái'] === 'Vắng').length,
      late:    0,
      excused: atts.filter((a: any) => a['Trạng thái'] === 'Có phép').length,
      attendanceList: atts,
      createdAt: String(l.createdAt || l.CreatedAt || ''),
      updatedAt: String(l.updatedAt || l.UpdatedAt || ''),
    };
  }).sort((a: any, b: any) => parseDMY(b.date) - parseDMY(a.date));
}

function txClasses(raw: any[], tl: string[]): any[] {
  const map = new Map<string, any>();
  raw.forEach((c: any) => {
    const maLop = fixVietnameseText(c.MaLop || c['Ma Lop'] || c['Mã Lớp'] || c['MÃ£ Lá»›p'] || c['MÃƒÂ£ LÃ¡Â»â€ºp'] || '');
    if (!maLop || map.has(maLop)) return;
    map.set(maLop, {
      'Mã Lớp':    maLop,
      MaGV:        c.MaGV    || c.maGV       || c.teacherId || '',
      teacherId:    c.teacherId || c.MaGV || c.maGV || '',
      GiaoVien:     resolveTeacher(fixVietnameseText(c.GiaoVien || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || c['GiÃƒÂ¡o viÃƒÂªn'] || ''), tl),
      'Tên Lớp':   fixVietnameseText(c.TenLop  || c['Tên Lớp'] || c['TÃªn Lá»›p'] || c['TÃƒÂªn LÃ¡Â»â€ºp'] || ''),
      'Khối':      fixVietnameseText(c.Khoi    || c['Khối']      || ''),
      'Giáo viên': resolveTeacher(fixVietnameseText(c.GiaoVien || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || c['GiÃƒÂ¡o viÃƒÂªn'] || ''), tl),
      'Cơ sở':     fixVietnameseText(c.CoSo    || c['Cơ sở'] || c['CÆ¡ sá»Ÿ'] || ''),
      'Buổi 1':    fixVietnameseText(c.Buoi1   || c['Buổi 1'] || c['Buá»•i 1'] || c['BuÃ¡Â»â€¢i 1'] || ''),
      'Buổi 2':    fixVietnameseText(c.Buoi2   || c['Buổi 2'] || c['Buá»•i 2'] || c['BuÃ¡Â»â€¢i 2'] || ''),
      'Buổi 3':    fixVietnameseText(c.Buoi3   || c['Buổi 3'] || c['Buá»•i 3'] || c['BuÃ¡Â»â€¢i 3'] || ''),
    });
  });
  return Array.from(map.values());
}

function txTeachers(raw: any[]): Teacher[] {
  return raw.map((t: any, i: number) => ({
    id:             String(t.MaGV           || t.id || t.teacherId || `GV${Date.now()}-${i}`),
    name:           String(t.HoTen          || t.TenGV || t.GiaoVien || t.name || t.teacherName || ''),
    phone:          String(t.SDT            || t.SDTGV || t.SoDienThoai || t.phone || ''),
    email:          String(t.Email          || t.email          || ''),
    gender:         t.gender                || 'male',
    dob:            t.dob ? formatDate(String(t.dob)) : '',
    address:        String(t.address        || ''),
    idNumber:       String(t.idNumber       || ''),
    // FIX CRITICAL: GAS readGiaoVien returns {subject, degree, salary} NOT {specialization, qualification, baseSalary}
    specialization: String(t.ChuyenMon      || t.specialization || t.subject || 'Toán'),
    qualification:  String(t.qualification  || t.degree  || ''),
    experience:     Number(t.experience)    || 0,
    baseSalary:     Number(t.LuongCoBan     || t.baseSalary || t.salary)  || 0,
    hourlyRate:     Number(t.DonGiaMoiBuoi  || t.DonGia || t.hourlyRate)    || 0,
    allowance:      Number(t.PhuCap         || t.allowance)     || 0,
    status:         String(t.TrangThai      || t.status         || 'active'),
    notes:          String(t.GhiChu         || t.notes          || ''),
    createdAt:      String(t.CreatedAt      || t.createdAt      || ''),
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

const CACHE_VERSION = 2;

type CachePayload = {
  hs: Student[];
  py: Payment[];
  ex: Expense[];
  uCls: any[];
  logs: any[];
  teachers?: Teacher[];
  materials?: Material[];
  leaveRequests?: LeaveRequest[];
  meta?: CacheMeta;
};

const emptyCachePayload = (): CachePayload => ({
  hs: [],
  py: [],
  ex: [],
  uCls: [],
  logs: [],
});

const hasCacheData = (cache: CachePayload | null): cache is CachePayload =>
  !!cache && [cache.hs, cache.py, cache.ex, cache.uCls, cache.logs, cache.teachers, cache.materials, cache.leaveRequests]
    .some(v => Array.isArray(v) && v.length > 0);

const readCacheSnapshot = (): CachePayload | null => {
  try {
    const raw = localStorage.getItem('ltn-cache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const metaRaw = parsed.meta || {};
    return {
      ...emptyCachePayload(),
      ...parsed,
      hs: Array.isArray(parsed.hs) ? parsed.hs : [],
      py: Array.isArray(parsed.py) ? parsed.py : [],
      ex: Array.isArray(parsed.ex) ? parsed.ex : [],
      uCls: Array.isArray(parsed.uCls) ? parsed.uCls : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : undefined,
      materials: Array.isArray(parsed.materials) ? parsed.materials : undefined,
      leaveRequests: Array.isArray(parsed.leaveRequests) ? parsed.leaveRequests : undefined,
      meta: {
        cachedAt: String(metaRaw.cachedAt || parsed.cachedAt || ''),
        source: 'cache',
        version: Number(metaRaw.version || parsed.version || 1),
      },
    };
  } catch {
    return null;
  }
};

const buildCachePayload = ({
  hs,
  py,
  ex,
  cls,
  logs,
  teachers,
  materials,
  leaveRequests,
  meta,
}: {
  hs: Student[];
  py: Payment[];
  ex: Expense[];
  cls: any[];
  logs: any[];
  teachers: Teacher[];
  materials: Material[];
  leaveRequests: LeaveRequest[];
  meta: CacheMeta;
}): CachePayload => ({
  hs,
  py,
  ex,
  uCls: cls,
  logs,
  teachers,
  materials,
  leaveRequests,
  meta,
});

type LoadMode = 'foreground' | 'background';
type LoadReason = 'boot' | 'manual' | 'mutation' | 'retry' | 'visibility' | 'interval';

type LoadDataOptions = {
  mode?: LoadMode;
  reason?: LoadReason;
  /** Backward compatibility for existing domain callers. */
  silent?: boolean;
  timeout?: number;
};

export function useAppData({ scriptUrl, teacherList, adminToken }: { scriptUrl: string; teacherList: string[]; adminToken: string }) {
  const initialCacheRef = useRef<CachePayload | null>(readCacheSnapshot());
  const initialCache = initialCacheRef.current;
  const hasInitialData = hasCacheData(initialCache);

  const [students,      setStudents]      = useState<Student[]>(() => initialCache?.hs || []);
  const [uClasses,      setUClasses]      = useState<any[]>(() => initialCache?.uCls || []);
  const [payments,      setPayments]      = useState<Payment[]>(() => initialCache?.py || []);
  const [expenses,      setExpenses]      = useState<any[]>(() => initialCache?.ex || []);
  const [tlogs,         setTlogs]         = useState<any[]>(() => initialCache?.logs || []);
  const [teachers,      setTeachers]      = useState<Teacher[]>(() => initialCache?.teachers || loadLocal<Teacher[]>('ltn-teachers', []));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => initialCache?.leaveRequests || loadLocal<LeaveRequest[]>('ltn-leaves', []));
  const [materials,     setMaterials]     = useState<Material[]>(() => initialCache?.materials || loadLocal<Material[]>('ltn-materials', []));
  const [loading,       setLoading]       = useState(!hasInitialData);
  const [gsOk,          setGsOk]          = useState<boolean | null>(null);
  const [cacheMeta,     setCacheMeta]     = useState<CacheMeta | null>(() => initialCache?.meta || null);
  const [syncState,     setSyncState]     = useState<DataSyncState>(hasInitialData ? 'cache' : 'syncing');
  const [initialLoadError, setInitialLoadError] = useState('');

  /* FIX L3: summary là useMemo — tự cập nhật ngay khi payments/expenses thay đổi (kể cả optimistic) */
  const summary = useMemo(() => ({
    totalRevenue: payments.reduce((s, p) => s + (Number(p.amount) > 0 ? Number(p.amount) : 0), 0),
    totalExpense: expenses.reduce((s, e: any) => s + (Number(e.amount) > 0 ? Number(e.amount) : 0), 0),
    chart:        buildChartData(payments, expenses),
  }), [payments, expenses]);

  const loadingRef      = useRef(false);
  const dataReadyRef    = useRef(hasInitialData);
  const queuedLoadRef   = useRef<LoadDataOptions | null>(null);
  const initialRetryRef = useRef(0);
  const loadDataRef     = useRef<(options?: LoadDataOptions) => Promise<void>>(async () => {});
  /* FIX S1+S3: silentRef là Ref object — return trực tiếp để useDomains set mà không cần hack */
  const silentRef       = useRef(false);
  /* FIX D4: return để useDomains reset cooldown sau manual save */
  const lastLoadTimeRef = useRef(0);
  /* FIX D5: useDomains set ref này trong withSave — auto-reload check trước khi chạy */
  const isSavingRef     = useRef(false);

  /* FIX S2: teacherListRef → loadData đọc teacherList qua ref, không qua closure */
  const teacherListRef = useRef(teacherList);
  useEffect(() => { teacherListRef.current = teacherList; }, [teacherList]);

  const applyCache = useCallback((cache: CachePayload, source: CacheMeta['source'] = 'cache') => {
    setStudents(cache.hs || []);
    setPayments(cache.py || []);
    setExpenses(cache.ex || []);
    setUClasses(cache.uCls || []);
    setTlogs(cache.logs || []);
    if (cache.teachers) setTeachers(cache.teachers);
    if (cache.materials) setMaterials(cache.materials);
    if (cache.leaveRequests) setLeaveRequests(cache.leaveRequests);
    setCacheMeta(cache.meta ? { ...cache.meta, source } : null);
    dataReadyRef.current = hasCacheData(cache);
  }, []);

  /* ── Core fetch ── */
  /* FIX S2: teacherList đọc qua ref; loadData chỉ re-create khi URL/token admin đổi */
  const loadData = useCallback(async (options: LoadDataOptions = {}) => {
    const reason = options.reason ?? 'manual';
    if (loadingRef.current) {
      // StrictMode may invoke the boot effect twice. Only user/domain requests
      // need one trailing revalidation after the active request completes.
      if (reason !== 'boot' && reason !== 'retry') queuedLoadRef.current = options;
      return;
    }

    if (reason === 'manual') initialRetryRef.current = 0;
    loadingRef.current = true;
    const legacySilent = options.silent ?? silentRef.current;
    const mode = options.mode ?? ((legacySilent || dataReadyRef.current) ? 'background' : 'foreground');
    const foreground = mode === 'foreground' && !dataReadyRef.current;
    if (foreground) setLoading(true);
    setSyncState('syncing');
    setInitialLoadError('');

    const tl = teacherListRef.current; // đọc teacherList hiện tại qua ref (luôn up-to-date)
    const timeout = options.timeout ?? (foreground ? RULES.network.initialFetchTimeout : RULES.network.fetchTimeout);

    try {
      const res = await fetchWithTimeout(scriptUrl, {
        method:   'POST',
        redirect: 'follow',
        timeout,
        headers:  { 'Content-Type': 'text/plain' },
        body:     JSON.stringify({ action: 'getData', adminToken }),
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
      setSyncState('fresh');
      dataReadyRef.current = true;
      initialRetryRef.current = 0;
      const meta: CacheMeta = {
        cachedAt: new Date().toISOString(),
        source: 'gas',
        version: CACHE_VERSION,
      };
      setCacheMeta(meta);

      /* FIX D2: cache gộp tất cả → 1 nguồn thống nhất */
      try {
        localStorage.setItem('ltn-cache', JSON.stringify(buildCachePayload({
          hs, py, ex, cls, logs,
          teachers: newTeachers,
          materials: newMaterials,
          leaveRequests: newLeaves,
          meta,
        })));
        /* Backward compat: vẫn giữ key riêng */
        if (newTeachers.length  > 0) localStorage.setItem('ltn-teachers',  JSON.stringify(newTeachers));
        if (newMaterials.length > 0) localStorage.setItem('ltn-materials', JSON.stringify(newMaterials));
        if (newLeaves.length    > 0) localStorage.setItem('ltn-leaves',    JSON.stringify(newLeaves));
      } catch {}

    } catch (err: any) {
      setGsOk(false);
      const fallbackCache = readCacheSnapshot();
      const canUseFallback = mode === 'background' || dataReadyRef.current;
      const hasFallback = canUseFallback && (hasCacheData(fallbackCache) || dataReadyRef.current);
      if (hasFallback) {
        if (fallbackCache) applyCache(fallbackCache, 'cache');
        setSyncState('cache');
        if (reason !== 'boot' && reason !== 'visibility' && reason !== 'interval') {
          toast('Đang dùng dữ liệu lưu gần nhất.', { icon: 'i' });
        }
      } else {
        if (fallbackCache?.meta) setCacheMeta({ ...fallbackCache.meta, source: 'cache' });
        setSyncState('error');
        setInitialLoadError(
          err.message?.includes('timeout')
            ? 'Google Apps Script phản hồi chậm. Hệ thống đang tự tải lại để đảm bảo dữ liệu mới trước khi làm việc.'
            : 'Chưa tải được dữ liệu mới từ Google Sheets. Hệ thống sẽ tự tải lại sau ít giây.'
        );
      }
    } finally {
      if (dataReadyRef.current) setLoading(false);
      loadingRef.current = false;
      silentRef.current  = false;

      const queued = queuedLoadRef.current;
      queuedLoadRef.current = null;
      if (queued && !isSavingRef.current) {
        window.setTimeout(() => {
          void loadDataRef.current({ ...queued, mode: 'background' });
        }, 0);
      }
    }
  }, [adminToken, applyCache, scriptUrl]);
  loadDataRef.current = loadData;

  /* ── Initial load ── */
  useEffect(() => {
    const mode: LoadMode = dataReadyRef.current ? 'background' : 'foreground';
    void loadData({
      mode,
      reason: 'boot',
      timeout: mode === 'foreground' ? RULES.network.initialFetchTimeout : RULES.network.fetchTimeout,
    });
  }, [loadData]);

  /* ── Initial retry: bounded backoff when no usable cache exists ── */
  useEffect(() => {
    if (!loading || syncState !== 'error' || dataReadyRef.current) return;
    const retryIndex = initialRetryRef.current;
    if (retryIndex >= RULES.network.initialLoadRetryDelays.length) return;
    const delay = RULES.network.initialLoadRetryDelays[retryIndex];
    const timer = window.setTimeout(() => {
      if (!navigator.onLine || document.visibilityState !== 'visible') return;
      initialRetryRef.current = retryIndex + 1;
      void loadData({
        mode: 'foreground',
        reason: 'retry',
        timeout: RULES.network.initialFetchTimeout,
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [loading, syncState, loadData]);

  /* ── Auto reload: online + visibility + interval ── */
  useEffect(() => {
    if (!RULES.network.autoReloadEnabled) return;
    const reload = () => {
      /* FIX D5: không auto-reload khi đang save để tránh state bị replace giữa chừng */
      if (isSavingRef.current) return;
      if (Date.now() - lastLoadTimeRef.current > RULES.network.silentReloadCooldown) {
        silentRef.current = true;
        void loadData({ mode: 'background', reason: 'visibility' });
        lastLoadTimeRef.current = Date.now();
      }
    };
    const handleOnline = () => {
      if (isSavingRef.current) return; // FIX D5
      silentRef.current = true;
      void loadData({ mode: 'background', reason: 'visibility' });
      lastLoadTimeRef.current = Date.now();
    };
    const handleVis = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) reload();
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVis);
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine && !isSavingRef.current) {
        silentRef.current = true;
        void loadData({ mode: 'background', reason: 'interval' });
        lastLoadTimeRef.current = Date.now();
      }
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
    loading, gsOk, loadData, cacheMeta, syncState, initialLoadError,
    setStudents, setUClasses, setPayments, setExpenses, setTlogs,
    setTeachers, setMaterials, setLeaveRequests,
    /* FIX S1+S3+D4: refs return trực tiếp */
    silentRef,
    lastLoadTimeRef,
    /* FIX D5: useDomains write vào đây trong withSave */
    isSavingRef,
  };
}
