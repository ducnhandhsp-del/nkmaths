/**
 * aggregations.ts — Gold Layer
 * Lớp Toán NK · v28.0
 *
 * Tập trung toàn bộ GROUP BY / aggregation logic.
 * Trước đây duplicate ở OverviewTab, FinanceTab, ReportsTab,
 * ClassesTab mỗi nơi tự .reduce() riêng → kết quả có thể lệch nhau.
 *
 * Pure functions, không phụ thuộc React — testable độc lập.
 */

import type { Student, Payment, Expense, TeachingLog } from './types';
import { isStudentActive } from './measures';
import { parseDMY } from './helpers';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

export interface ClassStat {
  classId:      string;
  totalStudents: number;
  activeStudents: number;
  paidCount:    number;
  unpaidCount:  number;
  totalSessions: number;
  totalPresent: number;
  totalAbsent:  number;
}

export interface TeacherStat {
  teacher:       string;
  classCount:    number;
  studentCount:  number;
  sessionCount:  number;
  revenue:       number;
}

export interface MonthStat {
  mo:      number;
  yr:      number;
  label:   string;
  revenue: number;
  expense: number;
  net:     number;
  paidCount: number;
}

export interface GradeDebtStat {
  grade:       string;
  total:       number;
  paid:        number;
  unpaid:      number;
  debtAmount:  number;
}

/* ─────────────────────────────────────────────
   GROUP BY CLASS
───────────────────────────────────────────── */

/**
 * Tổng hợp stats theo lớp.
 * Dùng ở: OverviewTab, ClassesTab, ReportsTab.
 */
export const groupByClass = (
  students:  Student[],
  tlogs:     TeachingLog[],
  isPaid:    (sid: string, mo: number, yr: number) => boolean,
  mo:        number,
  yr:        number,
): Record<string, ClassStat> => {
  const map: Record<string, ClassStat> = {};

  students.forEach(s => {
    if (!map[s.classId]) {
      map[s.classId] = {
        classId: s.classId, totalStudents: 0, activeStudents: 0,
        paidCount: 0, unpaidCount: 0, totalSessions: 0, totalPresent: 0, totalAbsent: 0,
      };
    }
    const stat = map[s.classId];
    stat.totalStudents++;
    if (isStudentActive(s)) {
      stat.activeStudents++;
      if (isPaid(s.id, mo, yr)) stat.paidCount++;
      else stat.unpaidCount++;
    }
  });

  tlogs.forEach(log => {
    if (!map[log.classId]) return;
    map[log.classId].totalSessions++;
    map[log.classId].totalPresent += log.present || 0;
    map[log.classId].totalAbsent  += log.absent  || 0;
  });

  return map;
};

/* ─────────────────────────────────────────────
   GROUP BY TEACHER
───────────────────────────────────────────── */

/**
 * Tổng hợp stats theo giáo viên.
 * Dùng ở: TeachersTab, ReportsTab.
 */
export const groupByTeacher = (
  students:  Student[],
  uClasses:  any[],
  tlogs:     TeachingLog[],
  payments:  Payment[],
): Record<string, TeacherStat> => {
  const map: Record<string, TeacherStat> = {};

  const ensure = (teacher: string) => {
    if (!map[teacher]) {
      map[teacher] = { teacher, classCount: 0, studentCount: 0, sessionCount: 0, revenue: 0 };
    }
  };

  uClasses.forEach(c => {
    const t = c['Giáo viên'] || '---';
    ensure(t);
    map[t].classCount++;
  });

  students.filter(isStudentActive).forEach(s => {
    const t = s.teacher || '---';
    ensure(t);
    map[t].studentCount++;
  });

  tlogs.forEach(log => {
    const t = log.teacherName || '---';
    ensure(t);
    map[t].sessionCount++;
  });

  payments.forEach(p => {
    const s = students.find(st => st.id === p.studentId);
    if (!s) return;
    const t = s.teacher || '---';
    ensure(t);
    map[t].revenue += p.amount;
  });

  return map;
};

/* ─────────────────────────────────────────────
   GROUP BY MONTH
───────────────────────────────────────────── */

/**
 * Tổng hợp thu/chi theo từng tháng trong 12 tháng gần nhất.
 * Dùng ở: ReportsTab, FinanceTab overview.
 */
export const groupByMonth = (
  payments:  Payment[],
  expenses:  Expense[],
  students:  Student[],
  isPaid:    (sid: string, mo: number, yr: number) => boolean,
  monthCount = 12,
): MonthStat[] => {
  const now    = new Date();
  const result: MonthStat[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mo   = d.getMonth() + 1;
    const yr   = d.getFullYear();
    const label = `T${mo}/${yr.toString().slice(2)}`;

    const toDate = (raw: string): { mo: number; yr: number } | null => {
      const s = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const p = s.split('/');
        return { mo: parseInt(p[1]), yr: parseInt(p[2]) };
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const dt = new Date(s.slice(0, 10));
        if (!isNaN(dt.getTime())) return { mo: dt.getMonth() + 1, yr: dt.getFullYear() };
      }
      return null;
    };

    const revenue = payments
      .filter(p => { const dt = toDate(p.date || ''); return dt?.mo === mo && dt?.yr === yr; })
      .reduce((s, p) => s + p.amount, 0);

    const expense = expenses
      .filter(e => { const dt = toDate(e.date || ''); return dt?.mo === mo && dt?.yr === yr; })
      .reduce((s, e) => s + e.amount, 0);

    const paidCount = students.filter(s => isStudentActive(s) && isPaid(s.id, mo, yr)).length;

    result.push({ mo, yr, label, revenue, expense, net: revenue - expense, paidCount });
  }

  return result;
};

/* ─────────────────────────────────────────────
   GROUP BY GRADE (debt analysis)
───────────────────────────────────────────── */

/**
 * Tổng hợp nợ học phí theo khối lớp.
 * Dùng ở: ReportsTab — phân tích nợ.
 */
export const groupDebtByGrade = (
  students:    Student[],
  isPaid:      (sid: string, mo: number, yr: number) => boolean,
  mo:          number,
  yr:          number,
  baseTuition: number,
): GradeDebtStat[] => {
  const map: Record<string, GradeDebtStat> = {};

  students.filter(isStudentActive).forEach(s => {
    const grade = s.grade || 'Khác';
    if (!map[grade]) map[grade] = { grade, total: 0, paid: 0, unpaid: 0, debtAmount: 0 };
    map[grade].total++;
    if (isPaid(s.id, mo, yr)) {
      map[grade].paid++;
    } else {
      map[grade].unpaid++;
      map[grade].debtAmount += baseTuition;
    }
  });

  return Object.values(map).sort((a, b) => b.unpaid - a.unpaid);
};
