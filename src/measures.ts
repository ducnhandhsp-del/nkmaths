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

import type { Student, Payment, Expense, TeachingLog, ClassRecord } from './types';
import { RULES } from './rules';
import { isLessonOffLog, parseDMY } from './helpers';

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

/** Historical activity must use the lesson date, not today's inactive status. */
export const isStudentActiveOnDate = (
  student: Pick<Student, 'status' | 'startDate' | 'endDate'>,
  rawDate: string,
): boolean => {
  const dateTs = parseDMY(rawDate || '');
  if (!dateTs) return isStudentActive(student as Pick<Student, 'status' | 'endDate'>);

  const startTs = parseDMY(student.startDate || '');
  const endTs = parseDMY(student.endDate || '');
  const endRaw = String(student.endDate || '').trim();

  if (startTs && dateTs < startTs) return false;
  if (endTs && endRaw && endRaw !== '---') return dateTs <= endTs;
  return student.status !== 'inactive';
};

export interface Period {
  m: number;
  y: number;
}

export const periodKey = (period: Period): string => `${period.m}/${period.y}`;

export const parsePeriod = (raw: string): Period | null => {
  const s = String(raw || '').includes(' - ') ? String(raw || '').split(' - ')[1] : String(raw || '');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return { m: parseInt(s.split('/')[1], 10), y: parseInt(s.split('/')[2], 10) };
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return { m: parseInt(s.slice(5, 7), 10), y: parseInt(s.slice(0, 4), 10) };
  const ts = parseDMY(s);
  if (!ts) return null;
  const d = new Date(ts);
  return { m: d.getMonth() + 1, y: d.getFullYear() };
};

export const isSamePeriod = (raw: string, period: Period): boolean => {
  const parsed = parsePeriod(raw);
  return parsed?.m === period.m && parsed?.y === period.y;
};

export const isStudentActiveInMonth = (student: Pick<Student, 'status' | 'startDate' | 'endDate'>, period: Period): boolean => {
  const monthStart = new Date(period.y, period.m - 1, 1).getTime();
  const nextMonthStart = new Date(period.y, period.m, 1).getTime();
  const startTs = parseDMY(student.startDate || '');
  const endTs = parseDMY(student.endDate || '');
  const endRaw = String(student.endDate || '').trim();
  const inactiveStatus = student.status === 'inactive';

  if (startTs && startTs >= nextMonthStart) return false;
  if (inactiveStatus && (!endRaw || endRaw === '---' || !endTs)) return false;
  if (endTs && endRaw && endRaw !== '---' && endTs < monthStart) return false;
  return isStudentActive(student as Pick<Student, 'status' | 'endDate'>) || (!!startTs && (!endTs || endTs >= monthStart));
};

export const isStudentBillableInMonth = (student: Pick<Student, 'startDate' | 'endDate'>, period: Period): boolean => {
  const monthStart = new Date(period.y, period.m - 1, 1).getTime();
  const startTs = parseDMY(student.startDate || '');
  if (startTs) {
    const d = new Date(startTs);
    const startMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (monthStart < startMonth) return false;
  }

  const endRaw = String(student.endDate || '').trim();
  const endTs = parseDMY(endRaw);
  if (endTs && endRaw && endRaw !== '---') {
    const d = new Date(endTs);
    const leaveMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (monthStart > leaveMonth) return false;
  }

  return true;
};

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
    const period = getPaymentTuitionPeriod(p, curYr);
    if (!period) return;
    m.get(p.studentId)!.add(periodKey(period));
  });
  return m;
};

export const getPaymentTuitionPeriod = (payment: Payment, fallbackYear?: number): Period | null => {
  const m = Number((payment as any).thangHP);
  const y = Number((payment as any).namHP);
  if (m >= 1 && m <= 12 && y >= 2000) return { m, y };
  const period = parsePeriod(payment.date || '');
  if (period) return period;
  return m >= 1 && m <= 12 && fallbackYear ? { m, y: fallbackYear } : null;
};

export const hasExplicitPaymentTuitionPeriod = (payment: Payment): boolean => {
  const m = Number((payment as any).thangHP);
  const y = Number((payment as any).namHP);
  return m >= 1 && m <= 12 && y >= 2000;
};

export const getPaymentReceiptPeriod = (payment: Payment): Period | null => parsePeriod(payment.date || '');

export const getUniquePaidStudentIdsByReceiptPeriod = (payments: Payment[], period: Period): Set<string> => {
  const ids = new Set<string>();
  payments.forEach(payment => {
    const receiptPeriod = getPaymentReceiptPeriod(payment);
    const studentId = String(payment.studentId || '').trim();
    if (!studentId || Number(payment.amount) <= 0) return;
    if (receiptPeriod?.m === period.m && receiptPeriod?.y === period.y) ids.add(studentId);
  });
  return ids;
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
    const period = getPaymentReceiptPeriod(p);
    return period?.m === mo && period?.y === yr;
  }).reduce((sum, p) => sum + p.amount, 0);

/** Tổng chi trong tháng/năm */
export const calcMonthlyExpense = (expenses: Expense[], mo: number, yr: number): number =>
  expenses.filter(e => {
    const period = parsePeriod(e.date || '');
    return period?.m === mo && period?.y === yr;
  }).reduce((sum, e) => sum + e.amount, 0);

/* ─────────────────────────────────────────────
   CHUYÊN CẦN — attendance measures
───────────────────────────────────────────── */

export interface AttendanceSummary {
  present: number;
  absent:  number;
  late:    number;
  excused: number;
  total:   number;
  pct:     number | null;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export const attendanceStudentId = (entry: any): string =>
  String(entry?.maHS || entry?.['Mã HS'] || entry?.['MÃ£ HS'] || entry?.MaHS || '').trim();

export const normalizeAttendanceStatus = (raw: unknown): AttendanceStatus => {
  const s = String(raw || '').trim();
  if (s === 'Vắng' || s === 'Váº¯ng') return 'absent';
  if (s === 'Có phép' || s === 'CÃ³ phÃ©p' || s === 'Nghỉ có phép' || s === 'Nghá»‰ cÃ³ phÃ©p') return 'excused';
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n === 'vang' || n === 'absent') return 'absent';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'excused';
  return 'present';
};

/** Tính chuyên cần của một học sinh từ tất cả teaching logs */
export const calcStudentAttendance = (
  tlogs: TeachingLog[],
  studentId: string,
  period?: Period,
): AttendanceSummary => {
  let present = 0, absent = 0, late = 0, excused = 0;
  tlogs.forEach(log => {
    if (isLessonOffLog(log)) return;
    if (period && !isSamePeriod(log.rawDate || log.date || '', period)) return;
    (log.attendanceList || []).forEach((a: any) => {
      const id = attendanceStudentId(a);
      if (id !== studentId) return;
      const status = normalizeAttendanceStatus(a.trangThai || a['Trạng thái'] || a['Tráº¡ng thÃ¡i'] || a.TrangThai || '');
      if (status === 'absent') absent++;
      else if (status === 'excused') excused++;
      else present++;
    });
  });
  const total = present + absent + late + excused;
  const pct   = total > 0 ? Math.round((present / total) * 100) : null;
  return { present, absent, late, excused, total, pct };
};

export const calcStudentAbsenceStreak = (
  tlogs: TeachingLog[],
  studentId: string,
  classId?: string,
  period?: Period,
): number => {
  const logs = [...tlogs]
    .filter(log => !isLessonOffLog(log))
    .filter(log => !classId || log.classId === classId)
    .filter(log => !period || isSamePeriod(log.rawDate || log.date || '', period))
    .sort((a, b) => parseDMY(b.rawDate || b.date || '') - parseDMY(a.rawDate || a.date || ''));

  let streak = 0;
  for (const log of logs) {
    const entry = (log.attendanceList || []).find((a: any) => attendanceStudentId(a) === studentId);
    if (!entry) continue;
    const rawStatus = (entry as any).trangThai || (entry as any)['Trạng thái'] || (entry as any)['TrÃ¡ÂºÂ¡ng thÃƒÂ¡i'] || (entry as any).TrangThai || '';
    const status = normalizeAttendanceStatus(rawStatus);
    if (status === 'absent') streak++;
    else break;
  }
  return streak;
};

export const getAttendanceRisk = (summary: Pick<AttendanceSummary, 'absent' | 'pct'> & { streak?: number }): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } => {
  const streak = summary.streak || 0;
  if (summary.absent >= RULES.attendance.absentAlertThreshold + 2 || streak >= 3) return { label: 'Vắng nhiều', tone: 'danger' };
  if (summary.absent >= RULES.attendance.absentAlertThreshold || streak >= 2) return { label: 'Cần theo dõi', tone: 'warning' };
  if (summary.pct === null) return { label: 'Chưa có dữ liệu', tone: 'neutral' };
  return { label: 'Ổn định', tone: 'success' };
};

/** Màu chuyên cần dựa trên % */
export const attendanceColor = (pct: number | null): string => {
  if (pct === null) return '#94a3b8';
  if (pct >= RULES.attendance.goodAttendancePct) return '#10b981';
  if (pct >= RULES.attendance.avgAttendancePct)  return '#f97316';
  return '#ef4444';
};

export const classIdOf = (classRecord: Partial<ClassRecord> | Record<string, any> | null | undefined): string =>
  String(classRecord?.['Mã Lớp'] || classRecord?.['MÃ£ Lá»›p'] || classRecord?.['Mã lớp'] || classRecord?.MaLop || classRecord?.classId || '').trim();

export const classScheduleSlots = (classRecord: Partial<ClassRecord> | Record<string, any> | null | undefined): string[] =>
  [classRecord?.['Buổi 1'], classRecord?.['Buá»•i 1'], classRecord?.Buoi1, classRecord?.['Buổi 2'], classRecord?.['Buá»•i 2'], classRecord?.Buoi2, classRecord?.['Buổi 3'], classRecord?.['Buá»•i 3'], classRecord?.Buoi3]
    .map(v => String(v || '').trim())
    .filter(Boolean);

export const getClassSessionTarget = (classRecord: Partial<ClassRecord> | Record<string, any> | null | undefined): number => {
  const slots = classScheduleSlots(classRecord).length;
  if (slots >= 3) return RULES.finance.threeSessionsPerWeekDueAt;
  if (slots >= 2) return RULES.finance.twoSessionsPerWeekDueAt;
  if (slots === 1) return RULES.finance.oneSessionPerWeekDueAt;
  return 0;
};

export const lessonCountByClassPeriod = (tlogs: TeachingLog[], period: Period): Map<string, number> => {
  const sets = new Map<string, Set<string>>();
  tlogs.forEach(log => {
    if (isLessonOffLog(log)) return;
    const classId = String(log.classId || '').trim();
    if (!classId || !isSamePeriod(log.rawDate || log.date || '', period)) return;
    if (!sets.has(classId)) sets.set(classId, new Set());
    sets.get(classId)!.add(`${log.rawDate || log.date || ''}|${log.caDay || ''}`);
  });
  const counts = new Map<string, number>();
  sets.forEach((set, key) => counts.set(key, set.size));
  return counts;
};

const lessonDateTs = (log: Pick<TeachingLog, 'rawDate' | 'date'>): number =>
  parseDMY(log.rawDate || log.date || '') || 0;

const paymentDateTs = (payment: Pick<Payment, 'date'>): number =>
  parseDMY(payment.date || '') || 0;

export const countUniqueClassLessons = (
  tlogs: TeachingLog[],
  classId: string,
  opts: { fromTs?: number; fromExclusive?: boolean; toTs?: number } = {},
): number => {
  const fromTs = opts.fromTs || 0;
  const toTs = opts.toTs || Number.POSITIVE_INFINITY;
  const lessons = new Set<string>();
  tlogs.forEach(log => {
    if (isLessonOffLog(log)) return;
    if (String(log.classId || '').trim() !== classId) return;
    const ts = lessonDateTs(log);
    if (!ts) return;
    if (opts.fromExclusive ? ts <= fromTs : ts < fromTs) return;
    if (ts > toTs) return;
    lessons.add(`${log.rawDate || log.date || ''}|${log.caDay || ''}`);
  });
  return lessons.size;
};

const lessonUniqueKey = (log: TeachingLog): string =>
  String(log.maBuoi || log.id || `${log.rawDate || log.date || ''}|${log.classId || ''}|${log.caDay || ''}`).trim();

const attendanceStatusOf = (entry: any): AttendanceStatus =>
  normalizeAttendanceStatus(
    entry?.trangThai
    || entry?.['Trạng thái']
    || entry?.['Tráº¡ng thÃ¡i']
    || entry?.['TrÃ¡ÂºÂ¡ng thÃƒÂ¡i']
    || entry?.TrangThai
    || entry?.status
    || '',
  );

export const countUniqueStudentAttendances = (
  tlogs: TeachingLog[],
  studentId: string,
  opts: { fromTs?: number; fromExclusive?: boolean; toTs?: number } = {},
): number => {
  const sid = String(studentId || '').trim();
  if (!sid) return 0;
  const fromTs = opts.fromTs || 0;
  const toTs = opts.toTs || Number.POSITIVE_INFINITY;
  const lessons = new Set<string>();

  tlogs.forEach(log => {
    if (isLessonOffLog(log)) return;
    const ts = lessonDateTs(log);
    if (!ts) return;
    if (opts.fromExclusive ? ts <= fromTs : ts < fromTs) return;
    if (ts > toTs) return;

    const present = (log.attendanceList || []).some((entry: any) => (
      attendanceStudentId(entry) === sid && attendanceStatusOf(entry) === 'present'
    ));
    if (!present) return;

    const key = lessonUniqueKey(log);
    if (key) lessons.add(key);
  });

  return lessons.size;
};

export interface SessionProgress {
  done: number;
  target: number;
  due: boolean;
  overdue: boolean;
}

export const getTuitionSessionProgress = (
  student: Pick<Student, 'classId'>,
  classes: Array<Partial<ClassRecord> | Record<string, any>>,
  lessonCounts: Map<string, number>,
): SessionProgress => {
  const classId = String(student.classId || '').trim();
  const classRecord = classes.find(c => classIdOf(c) === classId);
  const target = getClassSessionTarget(classRecord);
  const done = lessonCounts.get(classId) || 0;
  return {
    done,
    target,
    due: target > 0 && done === target,
    overdue: target > 0 && done > target,
  };
};

export type TuitionStatus = 'inactive' | 'not_started' | 'paid' | 'not_due' | 'due' | 'overdue' | 'no_schedule' | 'needs_review';

export type MonthlyTuitionStatus = 'inactive' | 'not_billable' | 'paid' | 'unpaid' | 'overdue';

export interface MonthlyTuitionState {
  student: Student;
  period: Period;
  billable: boolean;
  inactive: boolean;
  paid: boolean;
  payments: Payment[];
  payment?: Payment;
  status: MonthlyTuitionStatus;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  isEnrollmentMonth: boolean;
}

export const isEnrollmentMonth = (student: Pick<Student, 'startDate'>, period: Period): boolean => {
  const startTs = parseDMY(student.startDate || '');
  if (!startTs) return false;
  const d = new Date(startTs);
  return d.getMonth() + 1 === period.m && d.getFullYear() === period.y;
};

export const getMonthlyTuitionState = ({
  student,
  period,
  payments = [],
  baseTuition = 0,
  pastDue = false,
}: {
  student: Student;
  period: Period;
  payments?: Payment[];
  baseTuition?: number;
  pastDue?: boolean;
}): MonthlyTuitionState => {
  const inactive = !isStudentActiveInMonth(student, period);
  const billable = !inactive && isStudentBillableInMonth(student, period);
  const periodPayments = payments.filter(payment => {
    if (payment.studentId !== student.id) return false;
    const paymentPeriod = getPaymentTuitionPeriod(payment);
    return paymentPeriod?.m === period.m && paymentPeriod?.y === period.y;
  });
  const paidAmount = periodPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const paid = periodPayments.length > 0;
  const status: MonthlyTuitionStatus = inactive
    ? 'inactive'
    : !billable
      ? 'not_billable'
      : paid
        ? 'paid'
        : pastDue
          ? 'overdue'
          : 'unpaid';
  const outstandingAmount = status === 'unpaid' || status === 'overdue' ? baseTuition : 0;
  return {
    student,
    period,
    billable,
    inactive,
    paid,
    payments: periodPayments,
    payment: periodPayments[0],
    status,
    amount: paid ? paidAmount : outstandingAmount,
    paidAmount,
    outstandingAmount,
    isEnrollmentMonth: isEnrollmentMonth(student, period),
  };
};

export const getTuitionStatus = ({
  inactive,
  paid,
  pastDue,
  sessionDue,
  sessionOverdue,
}: {
  inactive: boolean;
  paid: boolean;
  pastDue: boolean;
  sessionDue?: boolean;
  sessionOverdue?: boolean;
}): TuitionStatus => {
  if (inactive) return 'inactive';
  if (paid) return 'paid';
  if (sessionOverdue) return 'overdue';
  if (sessionDue) return 'due';
  if (pastDue) return 'due';
  return 'not_due';
};

export interface TuitionPeriodState {
  student: Student;
  period: Period;
  billable: boolean;
  inactive: boolean;
  paid: boolean;
  payment?: Payment;
  status: TuitionStatus;
  sessionProgress: SessionProgress;
  amount: number;
  outstandingAmount: number;
}

export interface TuitionCycleState {
  student: Student;
  classRecord?: Partial<ClassRecord> | Record<string, any>;
  target: number;
  collectionThreshold: number;
  done: number;
  status: TuitionStatus;
  lastPayment?: Payment;
  cycleStartDate: string;
  cycleStartTs: number;
  amount: number;
  paidAmount: number;
  adjustedPayment: boolean;
  outstandingAmount: number;
  sessionProgress: SessionProgress;
  billable: boolean;
  inactive: boolean;
  asOfTs?: number;
}

export interface TuitionCycleItem {
  cycleIndex: number;
  startAttendanceIndex: number;
  endAttendanceIndex: number;
  done: number;
  target: number;
  collectionThreshold: number;
  payment?: Payment;
  paid: boolean;
  status: TuitionStatus;
  amount: number;
  paidAmount: number;
  adjustedPayment: boolean;
  outstandingAmount: number;
}

export interface TuitionAccountState {
  student: Student;
  classRecord?: Partial<ClassRecord> | Record<string, any>;
  target: number;
  collectionThreshold: number;
  attendanceCount: number;
  cycles: TuitionCycleItem[];
  currentCycle: TuitionCycleItem;
  paidCycleCount: number;
  dueCycles: TuitionCycleItem[];
  overdueCycles: TuitionCycleItem[];
  unpaidCollectibleCycles: TuitionCycleItem[];
  oldestUnpaidCollectibleCycle?: TuitionCycleItem;
  totalOutstandingAmount: number;
  lastPayment?: Payment;
  status: TuitionStatus;
  billable: boolean;
  inactive: boolean;
  reviewReasons: string[];
  asOfTs?: number;
}

export interface TuitionAccountSummary {
  dueAmount: number;
  overdueAmount: number;
  totalOutstandingAmount: number;
  dueCycleCount: number;
  overdueCycleCount: number;
  collectibleCycleCount: number;
  dueStudentCount: number;
  overdueStudentCount: number;
  collectibleStudentCount: number;
  reviewStudentCount: number;
}

export const summarizeTuitionAccounts = (accounts: TuitionAccountState[]): TuitionAccountSummary => {
  const dueStudents = new Set<string>();
  const overdueStudents = new Set<string>();
  const collectibleStudents = new Set<string>();
  const reviewStudents = new Set<string>();
  let dueAmount = 0;
  let overdueAmount = 0;
  let dueCycleCount = 0;
  let overdueCycleCount = 0;
  accounts.forEach(account => {
    const studentId = String(account.student.id || '').trim();
    account.dueCycles.forEach(cycle => {
      dueAmount += cycle.outstandingAmount;
      dueCycleCount += 1;
    });
    account.overdueCycles.forEach(cycle => {
      overdueAmount += cycle.outstandingAmount;
      overdueCycleCount += 1;
    });
    if (studentId && account.dueCycles.length > 0) dueStudents.add(studentId);
    if (studentId && account.overdueCycles.length > 0) overdueStudents.add(studentId);
    if (studentId && account.unpaidCollectibleCycles.length > 0) collectibleStudents.add(studentId);
    if (studentId && (account.status === 'needs_review' || account.reviewReasons.length > 0)) reviewStudents.add(studentId);
  });
  return {
    dueAmount,
    overdueAmount,
    totalOutstandingAmount: dueAmount + overdueAmount,
    dueCycleCount,
    overdueCycleCount,
    collectibleCycleCount: dueCycleCount + overdueCycleCount,
    dueStudentCount: dueStudents.size,
    overdueStudentCount: overdueStudents.size,
    collectibleStudentCount: collectibleStudents.size,
    reviewStudentCount: reviewStudents.size,
  };
};

const paymentOrderTs = (payment: Payment): number =>
  parseDMY(payment.createdAt || payment.updatedAt || '') || 0;

export const getTuitionAccountState = ({
  student,
  classes,
  payments = [],
  tlogs = [],
  baseTuition = 0,
  asOfTs,
}: {
  student: Student;
  classes: Array<Partial<ClassRecord> | Record<string, any>>;
  payments?: Payment[];
  tlogs?: TeachingLog[];
  baseTuition?: number;
  asOfTs?: number;
}): TuitionAccountState => {
  const snapshotTs = Number(asOfTs) > 0 ? Number(asOfTs) : 0;
  const startTs = parseDMY(student.startDate || '') || 0;
  const endTs = parseDMY(student.endDate || '') || 0;
  const hasEndDate = endTs > 0;
  const endedAtSnapshot = hasEndDate && (!snapshotTs || endTs <= snapshotTs);
  const inactiveWithoutEndDate = student.status === 'inactive' && !hasEndDate;
  const inactive = inactiveWithoutEndDate || endedAtSnapshot;
  const notStartedAtSnapshot = snapshotTs > 0 && startTs > snapshotTs;
  const classId = String(student.classId || '').trim();
  const classRecord = classes.find(c => classIdOf(c) === classId);
  const target = getClassSessionTarget(classRecord);
  const collectionThreshold = target > 0 ? Math.ceil(target / 2) : 0;
  const attendanceToTs = [endedAtSnapshot ? endTs : 0, snapshotTs]
    .filter(ts => ts > 0)
    .reduce((earliest, ts) => Math.min(earliest, ts), Number.POSITIVE_INFINITY);
  const attendanceCount = target > 0 && !notStartedAtSnapshot
    ? countUniqueStudentAttendances(tlogs, student.id, {
        fromTs: startTs,
        toTs: Number.isFinite(attendanceToTs) ? attendanceToTs : undefined,
      })
    : 0;
  const orderedPayments = payments
    .map((payment, index) => ({
      payment,
      index,
      receiptTs: paymentDateTs(payment),
      orderTs: paymentOrderTs(payment),
    }))
    .filter(row => (
      row.payment.studentId === student.id
      && Number(row.payment.amount) > 0
      && row.receiptTs > 0
      && (!snapshotTs || row.receiptTs <= snapshotTs)
      && (!startTs || row.receiptTs >= startTs)
    ))
    .sort((a, b) => (
      a.receiptTs - b.receiptTs
      || a.orderTs - b.orderTs
      || a.index - b.index
    ));
  const reviewReasons: string[] = [];
  for (let index = 1; index < orderedPayments.length; index += 1) {
    const previous = orderedPayments[index - 1];
    const current = orderedPayments[index];
    if (previous.receiptTs === current.receiptTs && (!previous.orderTs || previous.orderTs === current.orderTs)) {
      reviewReasons.push('same_day_receipt_order');
      break;
    }
  }

  const attendanceCycleIndex = target > 0
    ? Math.max(1, Math.ceil(attendanceCount / target))
    : 1;
  const cycleCount = Math.max(1, attendanceCycleIndex, orderedPayments.length);
  const cycles: TuitionCycleItem[] = Array.from({ length: cycleCount }, (_, offset) => {
    const cycleIndex = offset + 1;
    const startAttendanceIndex = offset * target + 1;
    const endAttendanceIndex = cycleIndex * target;
    const done = target > 0
      ? Math.max(0, Math.min(target, attendanceCount - offset * target))
      : 0;
    const payment = orderedPayments[offset]?.payment;
    const paid = !!payment;
    let status: TuitionStatus;
    if (notStartedAtSnapshot) status = 'not_started';
    else if (target <= 0) status = inactive ? 'inactive' : 'no_schedule';
    else if (paid) status = 'paid';
    else if (inactiveWithoutEndDate) status = 'inactive';
    else if (inactive && cycleIndex === attendanceCycleIndex && done < target) status = done > 0 ? 'needs_review' : 'inactive';
    else if (cycleIndex < attendanceCycleIndex) status = 'overdue';
    else if (cycleIndex === attendanceCycleIndex && done >= collectionThreshold) status = 'due';
    else status = 'not_due';
    const paidAmount = payment ? Number(payment.amount) || 0 : 0;
    const adjustedPayment = !!payment && baseTuition > 0 && paidAmount !== baseTuition;
    const outstandingAmount = status === 'due' || status === 'overdue' ? baseTuition : 0;
    return {
      cycleIndex,
      startAttendanceIndex,
      endAttendanceIndex,
      done,
      target,
      collectionThreshold,
      payment,
      paid,
      status,
      amount: paid ? paidAmount : outstandingAmount,
      paidAmount,
      adjustedPayment,
      outstandingAmount,
    };
  });
  const currentCycle = cycles[attendanceCycleIndex - 1] || cycles[0];
  const dueCycles = cycles.filter(cycle => cycle.status === 'due');
  const overdueCycles = cycles.filter(cycle => cycle.status === 'overdue');
  const unpaidCollectibleCycles = cycles.filter(cycle => cycle.status === 'due' || cycle.status === 'overdue');
  const totalOutstandingAmount = unpaidCollectibleCycles.reduce((sum, cycle) => sum + cycle.outstandingAmount, 0);
  const lastPayment = orderedPayments[orderedPayments.length - 1]?.payment;
  const status: TuitionStatus = notStartedAtSnapshot
    ? 'not_started'
    : inactiveWithoutEndDate
      ? 'inactive'
    : target <= 0
      ? inactive ? 'inactive' : 'no_schedule'
      : overdueCycles.length > 0
        ? 'overdue'
        : dueCycles.length > 0
          ? 'due'
          : currentCycle.status;
  const billable = target > 0 && (status === 'not_due' || status === 'paid' || status === 'due' || status === 'overdue');
  return {
    student,
    classRecord,
    target,
    collectionThreshold,
    attendanceCount,
    cycles,
    currentCycle,
    paidCycleCount: cycles.filter(cycle => cycle.paid).length,
    dueCycles,
    overdueCycles,
    unpaidCollectibleCycles,
    oldestUnpaidCollectibleCycle: unpaidCollectibleCycles[0],
    totalOutstandingAmount,
    lastPayment,
    status,
    billable,
    inactive,
    reviewReasons,
    asOfTs: snapshotTs || undefined,
  };
};

export const getTuitionCycleState = ({
  student,
  classes,
  payments = [],
  tlogs = [],
  baseTuition = 0,
  asOfTs,
}: {
  student: Student;
  classes: Array<Partial<ClassRecord> | Record<string, any>>;
  payments?: Payment[];
  tlogs?: TeachingLog[];
  baseTuition?: number;
  asOfTs?: number;
}): TuitionCycleState => {
  const account = getTuitionAccountState({ student, classes, payments, tlogs, baseTuition, asOfTs });
  const current = account.currentCycle;
  const startTs = parseDMY(student.startDate || '') || 0;
  const done = current.done;
  const target = account.target;
  const sessionProgress = {
    done,
    target,
    due: target > 0 && done === target,
    overdue: current.status === 'overdue',
  };
  const paidAmount = current.paidAmount;
  return {
    student,
    classRecord: account.classRecord,
    target,
    collectionThreshold: account.collectionThreshold,
    done,
    status: account.status,
    lastPayment: account.lastPayment,
    cycleStartDate: student.startDate || '',
    cycleStartTs: startTs,
    amount: account.status === 'paid' ? paidAmount : account.totalOutstandingAmount,
    paidAmount,
    adjustedPayment: current.adjustedPayment,
    outstandingAmount: account.totalOutstandingAmount,
    sessionProgress,
    billable: account.billable,
    inactive: account.inactive,
    asOfTs: account.asOfTs,
  };
};

export const getTuitionPeriodState = ({
  student,
  period,
  classes,
  payments = [],
  isPaid,
  lessonCounts = new Map<string, number>(),
  baseTuition = 0,
  pastDue = false,
}: {
  student: Student;
  period: Period;
  classes: Array<Partial<ClassRecord> | Record<string, any>>;
  payments?: Payment[];
  isPaid?: (sid: string, mo: number, yr: number) => boolean;
  lessonCounts?: Map<string, number>;
  baseTuition?: number;
  pastDue?: boolean;
}): TuitionPeriodState => {
  const inactive = !isStudentActiveInMonth(student, period);
  const billable = !inactive && isStudentBillableInMonth(student, period);
  const payment = payments.find(p => {
    if (p.studentId !== student.id) return false;
    const paymentPeriod = getPaymentTuitionPeriod(p);
    return paymentPeriod?.m === period.m && paymentPeriod?.y === period.y;
  });
  const paid = !!payment || !!isPaid?.(student.id, period.m, period.y);
  const sessionProgress = getTuitionSessionProgress(student, classes, lessonCounts);
  const status = !billable
    ? (inactive ? 'inactive' : 'not_due')
    : getTuitionStatus({
      inactive,
      paid,
      pastDue,
      sessionDue: sessionProgress.due,
      sessionOverdue: sessionProgress.overdue,
    });
  const amount = billable ? baseTuition : 0;
  return {
    student,
    period,
    billable,
    inactive,
    paid,
    payment,
    status,
    sessionProgress,
    amount,
    outstandingAmount: billable && !paid && !inactive ? amount : 0,
  };
};

/* ─────────────────────────────────────────────
   DATA HEALTH — đọc nhanh các lệch dữ liệu nguồn
───────────────────────────────────────────── */

export type DataHealthTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface DataHealthIssue {
  key: string;
  label: string;
  count: number;
  tone: DataHealthTone;
  detail: string;
}

export interface DataHealthReport {
  issues: DataHealthIssue[];
  totalIssues: number;
  tone: DataHealthTone;
}

export const buildDataHealthReport = ({
  students,
  classes,
  payments,
  tlogs,
}: {
  students: Student[];
  classes: Array<Partial<ClassRecord> | Record<string, any>>;
  payments: Payment[];
  tlogs: TeachingLog[];
}): DataHealthReport => {
  const classIds = new Set(classes.map(classIdOf).filter(Boolean));
  const studentIds = new Set(students.map(s => String(s.id || '').trim()).filter(Boolean));
  const activeStudents = students.filter(isStudentActive);

  const missingClass = activeStudents.filter(s => !String(s.classId || '').trim()).length;
  const unknownClass = activeStudents.filter(s => {
    const classId = String(s.classId || '').trim();
    return !!classId && !classIds.has(classId);
  }).length;
  const classWithoutSchedule = classes.filter(c => classIdOf(c) && classScheduleSlots(c).length === 0).length;
  const paymentWithoutStudent = payments.filter(p => !studentIds.has(String(p.studentId || '').trim())).length;
  const paymentWithoutPeriod = payments.filter(p => !hasExplicitPaymentTuitionPeriod(p)).length;
  const lessonWithoutAttendance = tlogs.filter(log => !isLessonOffLog(log) && (!Array.isArray(log.attendanceList) || log.attendanceList.length === 0)).length;

  const issues: DataHealthIssue[] = [
    {
      key: 'missing-class',
      label: 'HS chưa có lớp',
      count: missingClass,
      tone: missingClass > 0 ? 'warning' : 'success',
      detail: 'Học sinh đang học nhưng classId trống.',
    },
    {
      key: 'unknown-class',
      label: 'HS sai lớp',
      count: unknownClass,
      tone: unknownClass > 0 ? 'danger' : 'success',
      detail: 'classId của học sinh không tồn tại trong danh sách lớp.',
    },
    {
      key: 'class-no-schedule',
      label: 'Lớp thiếu lịch',
      count: classWithoutSchedule,
      tone: classWithoutSchedule > 0 ? 'warning' : 'success',
      detail: 'Lớp chưa có Buổi 1/Buổi 2/Buổi 3.',
    },
    {
      key: 'payment-no-student',
      label: 'Phiếu thu lệch HS',
      count: paymentWithoutStudent,
      tone: paymentWithoutStudent > 0 ? 'danger' : 'success',
      detail: 'Phiếu thu có mã học sinh không tồn tại.',
    },
    {
      key: 'payment-no-period',
      label: 'Phiếu thu thiếu kỳ',
      count: paymentWithoutPeriod,
      tone: paymentWithoutPeriod > 0 ? 'warning' : 'success',
      detail: 'Không đọc được tháng/năm học phí từ phiếu thu.',
    },
    {
      key: 'lesson-no-attendance',
      label: 'Buổi thiếu điểm danh',
      count: lessonWithoutAttendance,
      tone: lessonWithoutAttendance > 0 ? 'warning' : 'success',
      detail: 'Nhật ký buổi học chưa có attendanceList.',
    },
  ];
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);
  const tone: DataHealthTone = issues.some(issue => issue.tone === 'danger')
    ? 'danger'
    : totalIssues > 0
      ? 'warning'
      : 'success';

  return { issues, totalIssues, tone };
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
      // B2 FIX: parse component trực tiếp — tránh UTC midnight shift
      return `${parseInt(s.slice(5, 7))}/${s.slice(2, 4)}`;
    }
    return null;
  };
  payments.forEach(p => { const k = toKey(p.date); if (k && cmap[k]) cmap[k].Thu += p.amount / 1e6; });
  expenses.forEach(e => { const k = toKey(e.date); if (k && cmap[k]) cmap[k].Chi += e.amount / 1e6; });
  return Object.values(cmap);
};
