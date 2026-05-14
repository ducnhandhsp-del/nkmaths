/**
 * helpers.ts — Lớp Toán NK v23.0
 * BUG FIXES:
 *  - sanitizeInput: Xóa HTML-escaping (gây data corruption). Chỉ giữ formula-injection strip.
 *  - formatDate / toInputDate / parseDMY: Fix lệch ngày timezone khi GAS trả ISO UTC string.
 *  - isValidDateDMY: Validate giá trị thực (không chỉ regex).
 *  - parseCaDayToHours: Helper sort ca dạy.
 *  - resolveTeacher: nhận teacherList param thay vì hardcode.
 *  - sanitizeAttendance: helper riêng cho mảng điểm danh.
 */

export const SCRIPT_URL_DEFAULT =
  'https://script.google.com/macros/s/AKfycbwN9Fvcm8GVz7WZmGcYG4oiLM5hmOmlislu0w4OqS0Sr1QT2ttUZ0CbTIGN4J1Xz1BslQ/exec';

export const FEE_DEFAULT    = 600_000;
export const IPP            = 25;
export const FETCH_TIMEOUT  = 30000;

export const CA_DAY_OPTIONS  = ['7h30', '9h', '13h30', '15h30', '17h30', '19h30'] as const;
export const CA_DAY_DEFAULT: string[]    = ['7h30', '9h', '13h30', '15h30', '17h30', '19h30'];
export const TEACHER_LIST_DEFAULT: string[] = ['Lê Đức Nhân', 'Nguyễn Thị Kiên'];

/* ── Sanitization ────────────────────────────────────────────────────────────
   BUG FIX v23.0: Xóa HTML-escaping. React đã tự escape khi render.
   HTML-escaping ở đây gây corruption trong Google Sheets:
     "15/80 Đào Tấn"  →  "15&#x2F;80 Đào Tấn"
     "T2 18:00–19:30" →  bị encode, mất cấu trúc lịch học
   Chỉ giữ: strip leading =+-@ (formula injection) + trim.
─────────────────────────────────────────────────────────────────────────────── */
export const sanitizeInput = (value: any): any => {
  if (typeof value !== 'string') return value;
  return value.replace(/^[=+\-@]+/, '').trim();
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.entries(obj).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: Array.isArray(value)
      ? value.map((item: any) => typeof item === 'object' && item !== null ? sanitizeObject(item) : sanitizeInput(item))
      : typeof value === 'object' && value !== null
        ? sanitizeObject(value)
        : sanitizeInput(value),
  }), {} as T);
};

/** Sanitize attendance array riêng — không HTML-encode ghi chú học sinh */
export const sanitizeAttendance = (list: any[]): any[] => {
  if (!Array.isArray(list)) return [];
  return list.map(a => ({
    ...a,
    maHS:      typeof a.maHS      === 'string' ? a.maHS.replace(/^[=+\-@]+/, '').trim()      : a.maHS,
    tenHS:     typeof a.tenHS     === 'string' ? a.tenHS.replace(/^[=+\-@]+/, '').trim()     : a.tenHS,
    ghiChu:    typeof a.ghiChu    === 'string' ? a.ghiChu.replace(/^[=+\-@]+/, '').trim()    : '',
    trangThai: typeof a.trangThai === 'string' ? a.trangThai : 'Có mặt',
  }));
};

/** Validate phone (Vietnamese) */
export const isValidPhone = (phone: any): boolean => {
  if (!phone) return true;
  const cleaned = String(phone).replace(/\s/g, '');
  return /^0\d{9}$/.test(cleaned);
};

/**
 * isValidDateDMY — BUG FIX v23.0
 * Trước: chỉ test regex → "99/99/9999" hay "31/02/2024" vẫn pass.
 * Sau: validate giá trị thực qua Date constructor.
 */
export const isValidDateDMY = (date: string): boolean => {
  if (!date) return true;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return false;
  const [d, m, y] = date.split('/').map(Number);
  if (m < 1 || m > 12 || y < 1900 || y > 2100) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

/* ── Debounce ── */
export function debounce<T extends (...args: any[]) => any>(
  func: T, wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => { timeout = null; func(...args); }, wait);
  };
}

/* ── Tailwind helpers ── */
export const cn = (...args: (string | false | undefined | null)[]) =>
  args.filter(Boolean).join(' ');

export const card     = 'bg-white rounded-2xl border border-slate-200/80 shadow-sm';
export const TH       = 'px-4 py-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap';
export const TD       = 'px-4 py-4 text-[15px] text-slate-700 font-medium';
export const BTN_P    = 'flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-semibold text-base uppercase transition-all disabled:opacity-40 disabled:pointer-events-none';
export const BTN_S    = 'flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl font-semibold text-base border border-slate-200 uppercase transition-all';
export const BTN_I    = 'flex items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors min-h-[40px] min-w-[40px]';
export const BTN_D    = 'flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-semibold text-base uppercase transition-all';
export const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-base font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-300 transition-all bg-white';
export const selCls   = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-base font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white cursor-pointer appearance-none';
export const taCls    = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-base font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-300 resize-none bg-white';

/* ── Format helpers ── */
export const fmtVND = (n: number | undefined | null): string => {
  const safe = typeof n === 'number' && isFinite(n) ? n : 0;
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + 'đ';
};

export function normalizePaymentMethod(raw: any): string {
  const value = String(raw || '').trim();
  if (!value || value === '---') return '---';
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  if (['bank', 'transfer', 'bank_transfer', 'chuyen khoan', 'ck'].includes(normalized)) return 'Chuyển khoản';
  if (['cash', 'tien mat', 'tm'].includes(normalized)) return 'Tiền mặt';
  return value;
}

/**
 * formatDate — BUG FIX v23.0: xử lý ISO UTC string từ GAS đúng timezone.
 *
 * Vấn đề: GAS trả Date object dưới dạng "2026-03-12T17:00:00.000Z"
 *   (UTC midnight của 13/03 tại UTC+7).
 * Code cũ: slice(0,10) → "2026-03-12" → hiển thị lệch -1 ngày.
 * Fix: nếu có phần time trong string, dùng new Date() + local date parts.
 */
export const formatDate = (raw: any): string => {
  if (!raw && raw !== 0) return '---';
  raw = String(raw);

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

  // ISO with time (GAS Date objects) → local date
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
  }

  // Plain YYYY-MM-DD → parse components directly (no UTC offset)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${d}/${m}/${y}`;
  }

  // HH:MM - DD/MM/YYYY
  if (raw.includes(' - ')) return raw.split(' - ')[1];

  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
  } catch {}
  return raw;
};

/**
 * parseDMY — BUG FIX v23.0
 * Plain YYYY-MM-DD: dùng local Date constructor (tránh UTC midnight shift).
 * ISO with time:    dùng new Date() trực tiếp (timestamp đúng cho so sánh).
 */
export const parseDMY = (raw: any): number => {
  if (!raw) return 0;
  raw = String(raw);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
  }

  if (raw.includes(' - ')) return parseDMY(raw.split(' - ')[1]);

  try {
    const t = new Date(raw).getTime();
    if (!isNaN(t)) return t;
  } catch {}
  return 0;
};

/**
 * parseCaDayToHours — Parse ca dạy → giờ (số thực) để sort tăng dần.
 * "7h30" → 7.5,  "9h" → 9,  "13h30" → 13.5,  "19h30" → 19.5
 */
export const parseCaDayToHours = (ca: string): number => {
  if (!ca) return 99;
  const m = String(ca).match(/(\d+)h(\d*)/i);
  if (!m) return 99;
  return parseInt(m[1]) + (parseInt(m[2] || '0') / 60);
};

/** Parse tháng từ diễn giải học phí */
export const parseMonthFromDesc = (desc: any): number | null => {
  if (!desc) return null;
  const d = String(desc).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const m1 = d.match(/th[aá]ng\s*0?(\d{1,2})/);
  if (m1) { const v = parseInt(m1[1]); if (v >= 1 && v <= 12) return v; }
  const m2 = d.match(/\bT0?(\d{1,2})\b/i);
  if (m2) { const v = parseInt(m2[1]); if (v >= 1 && v <= 12) return v; }
  const m3 = d.match(/\b0?(\d{1,2})\/20\d{2}\b/);
  if (m3) { const v = parseInt(m3[1]); if (v >= 1 && v <= 12) return v; }
  return null;
};

/**
 * resolveTeacher — v23.1
 *
 * Chuẩn hóa tên giáo viên từ bất kỳ cách gọi nào về tên đầy đủ chính thức,
 * ngăn tình trạng 1 GV xuất hiện thành nhiều dòng trong thống kê.
 *
 * Bảng alias mặc định (không phân biệt hoa/thường, không dấu):
 *   Lê Đức Nhân  ← "Thầy Nhân", "GV Nhân", "Nhân", "LDN", "le duc nhan", …
 *   Nguyễn Thị Kiên ← "Cô Kiên", "GV Kiên", "Kiên", "NTK", "nguyen thi kien", …
 *
 * Nếu truyền teacherList (từ Settings), hàm sẽ ưu tiên match vào danh sách đó.
 * Khi thêm GV mới vào teacherList, alias engine tự hoạt động dựa trên họ/tên cuối.
 */

/** Bảng alias tĩnh — mở rộng tại đây khi có thêm GV */
const TEACHER_ALIASES: { canonical: string; patterns: RegExp[] }[] = [
  {
    canonical: 'Lê Đức Nhân',
    patterns: [
      /\bnhan\b/i,          // "Nhân", "nhan"
      /th[aâ]y\s*nhan/i,   // "Thầy Nhân", "Thay Nhan"
      /gv\.?\s*nhan/i,      // "GV Nhân", "GV. Nhân"
      /le\s*duc\s*nhan/i,   // "Le Duc Nhan"
      /l[eê]\s*đ[uư][c\s]*nh[aâ]n/i, // "Lê Đức Nhân"
      /\bldn\b/i,            // viết tắt "LDN"
    ],
  },
  {
    canonical: 'Nguyễn Thị Kiên',
    patterns: [
      /\bkien\b/i,           // "Kiên", "kien"
      /c[oô]\s*kien/i,       // "Cô Kiên", "Co Kien"
      /gv\.?\s*kien/i,       // "GV Kiên"
      /nguyen\s*thi\s*kien/i,// "Nguyen Thi Kien"
      /nguy[eê]n\s*th[iị]\s*ki[eê]n/i, // "Nguyễn Thị Kiên"
      /\bntk\b/i,            // viết tắt "NTK"
    ],
  },
];

const _norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const resolveTeacher = (raw: any, teacherList?: string[]): string => {
  if (!raw) return '---';
  const s    = String(raw).trim();
  if (!s || s === '---') return '---';
  const norm = _norm(s);

  // 1. Ưu tiên match chính xác (sau khi normalize) với teacherList từ Settings
  if (teacherList && teacherList.length > 0) {
    // Exact match trước
    const exact = teacherList.find(t => _norm(t) === norm);
    if (exact) return exact;

    // Alias match: kiểm tra từng pattern của canonical trong teacherList
    for (const t of teacherList) {
      // Lấy họ cuối (tên) của GV trong list
      const lastName = _norm(t).split(' ').pop() || '';
      if (lastName.length >= 2 && norm.includes(lastName)) return t;
    }
  }

  // 2. Kiểm tra bảng alias tĩnh (xử lý mọi biến thể đã biết)
  for (const entry of TEACHER_ALIASES) {
    if (entry.patterns.some(re => re.test(norm))) return entry.canonical;
  }

  // 3. Fallback: trả về chuỗi gốc (không xử lý được)
  return s;
};

/** VietQR URL */
export const makeVietQR = (bankId: string, accountNo: string, amount: number, addInfo: string, accountName: string) =>
  `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

export const loadSettings = () => {
  try { const s = localStorage.getItem('ltn-settings'); return s ? JSON.parse(s) : null; } catch { return null; }
};
export const saveSettings = (obj: object) => {
  try { localStorage.setItem('ltn-settings', JSON.stringify(obj)); } catch {}
};

export const getFinanceMonths = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { m: d.getMonth() + 1, y: d.getFullYear(), label: `T${d.getMonth() + 1}` };
  });
};
export const FINANCE_MONTHS = getFinanceMonths();

export const MONTHS_VI = [
  'Học phí tháng 1','Học phí tháng 2','Học phí tháng 3',
  'Học phí tháng 4','Học phí tháng 5','Học phí tháng 6',
  'Học phí tháng 7','Học phí tháng 8','Học phí tháng 9',
  'Học phí tháng 10','Học phí tháng 11','Học phí tháng 12',
];

export const BANK_DEFAULT = { bankId: 'VCB', accountNo: '1234567890', accountName: 'LOP TOAN NK' };

/**
 * isStudentActive — REFACTOR v24.1
 * Tách ra helpers.ts để dùng chung toàn project.
 * Trước đây được define inline trong App.tsx render body → tạo function mới mỗi render
 * → các useMemo/useCallback phụ thuộc vào isActive không stable.
 */
export const isStudentActive = (s: { status: string; endDate?: string }): boolean =>
  s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === '');

export const localDateStr = (): string => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

/**
 * toInputDate — BUG FIX v23.0: Xử lý ISO UTC string đúng timezone.
 * GAS trả "2026-03-12T17:00:00.000Z" → code cũ → "2026-03-12" (sai ngày).
 * Fix: dùng local date parts qua new Date().
 */
export const toInputDate = (raw: any): string => {
  if (!raw) return localDateStr();
  raw = String(raw);
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return `${y}-${m}-${d}`;
  }
  if (raw.includes(' - ')) return toInputDate(raw.split(' - ')[1]);
  try {
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) {
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    }
  } catch {}
  return localDateStr();
};

export const capitalizeName = (name: string): string => {
  if (!name) return name;
  return name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> => {
  const { timeout = FETCH_TIMEOUT, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timeout - vui lòng thử lại');
    throw err;
  }
};

/** formatBytes — tính dung lượng localStorage key */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/** getCacheSize — đọc kích thước key ltn-cache */
export const getCacheSize = (): string => {
  try {
    const val = localStorage.getItem('ltn-cache');
    if (!val) return '0 KB';
    return formatBytes(new Blob([val]).size);
  } catch { return '—'; }
};

/**
 * loadLocal<T> — đọc dữ liệu từ localStorage an toàn.
 * Trả về fallback nếu key không tồn tại hoặc JSON parse lỗi.
 *
 * Dùng cho: ltn-teachers, ltn-materials, ltn-leaves
 * (các domain chưa có GAS sheet riêng, bridge bằng localStorage)
 */
export const loadLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/**
 * saveLocal — ghi dữ liệu vào localStorage an toàn.
 * Silent fail nếu storage đầy hoặc bị block (private mode).
 */
export const saveLocal = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full hoặc bị block — không crash app
  }
};

/**
 * exportCSV — xuất dữ liệu dạng CSV với BOM UTF-8.
 * Excel mở trực tiếp, hiển thị đúng tiếng Việt.
 *
 * @param filename  Tên file không cần đuôi, VD: "cong-no-t3-2026"
 * @param headers   Mảng tên cột
 * @param rows      Mảng dòng dữ liệu
 */
export const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]): void => {
  const esc = (v: string | number): string => {
    const s = String(v ?? '');
    return (s.includes(',') || s.includes('\n') || s.includes('"'))
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `${filename}.csv` });
  a.click();
  URL.revokeObjectURL(url);
};
