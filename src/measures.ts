/**
 * measures.ts — Semantic Layer
 * Lớp Toán NK · v28.0
 *
 * Nơi duy nhất định nghĩa mọi "measure" / KPI / derived field.
 * Pure functions, không phụ thuộc React — testable độc lập.
 *
 * Trước đây:
 *   - fmtVND trong helpers.ts, fmtM trong AppComponents.tsx (2 formatter khác nhau)
 *   - isStudentActive trong helpers.ts
 *   - attendancePct tính inline trong StudentDetailModal
 *   - debtStatus tính inline trong FinanceTab
 */

import type { Student, Payment, Expense, TeachingLog } from './types';
import { RULES } from './rules';
import { parseDMY } from './helpers';

/* ─────────────────────────────────────────────
   FORMATTERS — một nơi duy nhất
───────────────────────────────────────────── */

/**
 * Định dạng tiền VNĐ đầy đủ: 1500000 → "1 500 000đ"
 * (dùng non-breaking space làm separator)
 */
export const formatVND = (n: number): string =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + 'đ';

/**
 * Định dạng tiền rút gọn: 1500000 → "1.5tr", 2000000000 → "2tỷ"
 * Thay thế cả fmtM (AppComponents) lẫn fmtVND tuỳ context.
 */
export const formatMoneyShort = (amount: number): string => {
  if (amount === 0) return '0';
  const m = amount / 1_000_000;
  if (m >= 1000) return `${Math.round(m / 1000)}tỷ`;
  if (m % 1 === 0) return `${m}tr`;
  return `${parseFloat(m.toFixed(1))}tr`;
};

/* ─────────────────────────────────────────────
   HỌC SINH — derived fields
───────────────────────────────────────────── */

/** Học sinh đang hoạt động (chưa nghỉ) */
export const isStudentActive = (s: Pick<Student, 'status' | 'endDate'>): boolean =>
  s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === '');

/** Danh sách học sinh đang hoạt động */
export const getActiveStudents = (students: Student[]): Student[] =>
  students.filter(isStudentActive);

/** Màu badge học lực */
export const getLevelColor = (level: string) =>
  RULES.academic.levelColor[level] ?? RULES.academic.levelColorDefault;

/* ─────────────────────────────────────────────
   HỌC PHÍ — payment measures
───────────────────────────────────────────── */

/**
 * Xây paidMap: studentId → Set<"mo/yr">
 * Dùng để check isPaid(sid, mo, yr) trong O(1).
 */
export const buildPaidMap = (
  payments: Payment[],
  curYr: number,
): Map<string, Set<string>> => {
  const m = new Map<string, Set<string>>();
  payments.forEach(p => {
    if (!m.has(p.studentId)) m.set(p.studentId, new Set());
    let mo: number | null = (p as any).thangHP ? Number((p as any).thangHP) : null;
    if (!mo) {
      const raw = p.date || '';
      const s   = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) mo = parseInt(s.split('/')[1]);
      else if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s.slice(0, 10)); if (!isNaN(d.getTime())) mo = d.getMonth() + 1;
      }
    }
    if (!mo || mo < 1 || mo > 12) return;
    let yr: number = (p as any).namHP ? Number((p as any).namHP) : curYr;
    if (!(p as any).namHP) {
      const raw = p.date || '';
      const s   = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s))  yr = parseInt(s.split('/')[2]);
      else if (/^\d{4}-\d{2}-\d{2}/.test(s)) yr = parseInt(s.slice(0, 4));
    }
    m.get(p.studentId)!.add(`${mo}/${yr}`);
  });
  return m;
};

/** Kiểm tra học sinh đã đóng học phí tháng/năm chưa */
export const isPaidFn = (
  paidMap: Map<string, Set<string>>,
) => (sid: string, mo: number, yr: number): boolean =>
  paidMap.get(sid)?.has(`${mo}/${yr}`) ?? false;

/** Số học sinh đã đóng học phí tháng hiện tại */
export const countPaidStudents = (
  activeStudents: Student[],
  isPaid: (sid: string, mo: number, yr: number) => boolean,
  mo: number,
  yr: number,
): number => activeStudents.filter(s => isPaid(s.id, mo, yr)).length;

/** Tỷ lệ đóng học phí (%) */
export const calcPaidPct = (paidCount: number, totalActive: number): number =>
  totalActive > 0 ? Math.round((paidCount / totalActive) * 100) : 0;

/** Tổng thu trong tháng/năm */
export const calcMonthlyRevenue = (payments: Payment[], mo: number, yr: number): number =>
  payments.filter(p => {
    const raw = p.date || '';
    const s   = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const parts = s.split('/');
      return parseInt(parts[1]) === mo && parseInt(parts[2]) === yr;
    }
    return false;
  }).reduce((sum, p) => sum + p.amount, 0);

/** Tổng chi trong tháng/năm */
export const calcMonthlyExpense = (expenses: Expense[], mo: number, yr: number): number =>
  expenses.filter(e => {
    const raw = e.date || '';
    const s   = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const parts = s.split('/');
      return parseInt(parts[1]) === mo && parseInt(parts[2]) === yr;
    }
    return false;
  }).reduce((sum, e) => sum + e.amount, 0);

/* ─────────────────────────────────────────────
   CHUYÊN CẦN — attendance measures
───────────────────────────────────────────── */

export interface AttendanceSummary {
  present: number;
  absent:  number;
  late:    number;
  total:   number;
  pct:     number | null;
}

/** Tính chuyên cần của một học sinh từ tất cả teaching logs */
export const calcStudentAttendance = (
  tlogs: TeachingLog[],
  studentId: string,
): AttendanceSummary => {
  let present = 0, absent = 0, late = 0;
  tlogs.forEach(log =>
    (log.attendanceList || []).forEach((a: any) => {
      if ((a.maHS || a['Mã HS']) !== studentId) return;
      const st = a['Trạng thái'] || '';
      if (st === 'Có mặt') present++;
      else if (st === 'Vắng') absent++;
      else if (st === 'Muộn') late++;
    })
  );
  const total = present + absent + late;
  const pct   = total > 0 ? Math.round((present / total) * 100) : null;
  return { present, absent, late, total, pct };
};

/** Màu chuyên cần dựa trên % */
export const attendanceColor = (pct: number | null): string => {
  if (pct === null) return '#94a3b8';
  if (pct >= RULES.attendance.goodAttendancePct) return '#10b981';
  if (pct >= RULES.attendance.avgAttendancePct)  return '#f97316';
  return '#ef4444';
};

/* ─────────────────────────────────────────────
   CHART DATA — transforms cho biểu đồ
───────────────────────────────────────────── */

export interface ChartPoint { month: string; Thu: number; Chi: number; }

/** Build chart data 12 tháng gần nhất từ payments + expenses */
export const buildChartData = (payments: Payment[], expenses: Expense[]): ChartPoint[] => {
  const now  = new Date();
  const cmap: Record<string, ChartPoint> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    cmap[k]  = { month: k, Thu: 0, Chi: 0 };
  }
  const toKey = (raw: string): string | null => {
    if (!raw) return null;
    let s = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const p = s.split('/');
      return `${parseInt(p[1])}/${p[2].slice(2)}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s.slice(0, 10));
      if (!isNaN(d.getTime())) return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    }
    return null;
  };
  payments.forEach(p => { const k = toKey(p.date); if (k && cmap[k]) cmap[k].Thu += p.amount / 1e6; });
  expenses.forEach(e => { const k = toKey(e.date); if (k && cmap[k]) cmap[k].Chi += e.amount / 1e6; });
  return Object.values(cmap);
};
