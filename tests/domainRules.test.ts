import assert from 'node:assert/strict';

import {
  buildDataHealthReport,
  buildPaidMap,
  calcStudentAttendance,
  calcStudentAbsenceStreak,
  getAttendanceRisk,
  getClassSessionTarget,
  getPaymentTuitionPeriod,
  getTuitionCycleState,
  getTuitionSessionProgress,
  getTuitionStatus,
  isPaidFn,
  isStudentBillableInMonth,
  lessonCountByClassPeriod,
  normalizeAttendanceStatus,
} from '../src/measures';
import type { Payment, Student, TeachingLog } from '../src/types';

const baseStudent: Student = {
  id: 'HS001',
  name: 'Nguyen Van A',
  dob: '',
  branch: '',
  grade: '10',
  school: '',
  teacher: '',
  parentName: '',
  parentPhone: '',
  studentPhone: '',
  address: '',
  academicLevel: '',
  goal: '',
  supportNeeded: '',
  classId: '10A',
  startDate: '15/06/2026',
  endDate: '',
  status: 'active',
};

assert.equal(isStudentBillableInMonth(baseStudent, { m: 5, y: 2026 }), false, 'before start month is not billable');
assert.equal(isStudentBillableInMonth(baseStudent, { m: 6, y: 2026 }), true, 'start month is billable');
assert.equal(isStudentBillableInMonth({ ...baseStudent, endDate: '10/08/2026' }, { m: 8, y: 2026 }), false, 'leave month is not billable');

const payments: Payment[] = [
  {
    id: 'PT1',
    date: '28/06/2026',
    docNum: 'PT1',
    description: '',
    studentId: 'HS001',
    studentName: 'Nguyen Van A',
    payer: '',
    method: 'Chuyen khoan',
    amount: 600000,
    note: '',
    thangHP: 5,
    namHP: 2026,
  },
];

assert.deepEqual(getPaymentTuitionPeriod(payments[0]), { m: 5, y: 2026 }, 'tuition period prefers thangHP/namHP');
assert.equal(isPaidFn(buildPaidMap(payments, 2026))('HS001', 5, 2026), true, 'paid map uses tuition period');
assert.equal(isPaidFn(buildPaidMap(payments, 2026))('HS001', 6, 2026), false, 'paid map does not confuse receipt month with tuition month');

assert.equal(normalizeAttendanceStatus('Vắng'), 'absent');
assert.equal(normalizeAttendanceStatus('Nghỉ có phép'), 'excused');
assert.equal(normalizeAttendanceStatus('Có mặt'), 'present');

const logs: TeachingLog[] = [
  {
    rawDate: '01/06/2026',
    date: '01/06/2026',
    originalDate: '01/06/2026',
    originalClassId: '10A',
    originalCaDay: '15h30',
    classId: '10A',
    content: '',
    homework: '',
    teacherNote: '',
    teacherName: '',
    caDay: '15h30',
    present: 0,
    absent: 0,
    late: 0,
    attendanceList: [{ maHS: 'HS001', trangThai: 'Vắng' }],
  },
  {
    rawDate: '03/06/2026',
    date: '03/06/2026',
    originalDate: '03/06/2026',
    originalClassId: '10A',
    originalCaDay: '15h30',
    classId: '10A',
    content: '',
    homework: '',
    teacherNote: '',
    teacherName: '',
    caDay: '15h30',
    present: 0,
    absent: 0,
    late: 0,
    attendanceList: [{ maHS: 'HS001', trangThai: 'Có phép' }],
  },
];

const attendance = calcStudentAttendance(logs, 'HS001', { m: 6, y: 2026 });
assert.equal(attendance.absent, 1, 'absence count is month scoped');
assert.equal(attendance.excused, 1, 'excused count is month scoped');
assert.equal(getAttendanceRisk({ ...attendance, streak: 2 }).tone, 'warning', 'streak 2 is warning');

const previousMonthAbsenceLogs: TeachingLog[] = [
  { ...logs[0], rawDate: '25/05/2026', date: '25/05/2026', attendanceList: [{ maHS: 'HS001', trangThai: 'Vắng' }] },
  { ...logs[0], rawDate: '28/05/2026', date: '28/05/2026', attendanceList: [{ maHS: 'HS001', trangThai: 'Vắng' }] },
  { ...logs[0], rawDate: '02/06/2026', date: '02/06/2026', attendanceList: [{ maHS: 'HS001', trangThai: 'Có mặt' }] },
];
assert.equal(
  calcStudentAbsenceStreak(previousMonthAbsenceLogs, 'HS001', '10A', { m: 6, y: 2026 }),
  0,
  'absence streak is scoped to the selected month',
);

const twoSlotClass = { 'Mã Lớp': '10A', 'Buổi 1': 'T2 15h30', 'Buổi 2': 'T5 15h30' };
const threeSlotClass = { 'Mã Lớp': '10B', 'Buổi 1': 'T2 15h30', 'Buổi 2': 'T4 15h30', 'Buổi 3': 'T6 15h30' };
assert.equal(getClassSessionTarget(twoSlotClass), 8, '2 sessions/week target is 8');
assert.equal(getClassSessionTarget(threeSlotClass), 12, '3 sessions/week target is 12');

const lessonCounts = lessonCountByClassPeriod(logs, { m: 6, y: 2026 });
assert.deepEqual(
  getTuitionSessionProgress(baseStudent, [twoSlotClass], lessonCounts),
  { done: 2, target: 8, due: false, overdue: false },
  'session progress counts unique class lessons in period',
);

const fullTwoSlotProgress = getTuitionSessionProgress(baseStudent, [twoSlotClass], new Map([['10A', 8]]));
assert.deepEqual(fullTwoSlotProgress, { done: 8, target: 8, due: true, overdue: false }, '2 sessions/week reaches tuition due at 8 lessons');
assert.equal(
  getTuitionStatus({ inactive: false, paid: false, pastDue: false, sessionDue: fullTwoSlotProgress.due, sessionOverdue: fullTwoSlotProgress.overdue }),
  'due',
  'unpaid tuition is due when session target is reached',
);
const overdueTwoSlotProgress = getTuitionSessionProgress(baseStudent, [twoSlotClass], new Map([['10A', 9]]));
assert.deepEqual(overdueTwoSlotProgress, { done: 9, target: 8, due: false, overdue: true }, '2 sessions/week is overdue after passing 8 lessons');
assert.equal(
  getTuitionStatus({ inactive: false, paid: false, pastDue: false, sessionDue: overdueTwoSlotProgress.due, sessionOverdue: overdueTwoSlotProgress.overdue }),
  'overdue',
  'unpaid tuition is overdue only after passing the session target',
);
assert.equal(
  getTuitionStatus({ inactive: false, paid: true, pastDue: false, sessionDue: false, sessionOverdue: true }),
  'paid',
  'paid tuition stays paid even after passing the session target',
);
assert.equal(
  getTuitionStatus({ inactive: false, paid: false, pastDue: true, sessionDue: false }),
  'due',
  'calendar due date does not override session-based overdue logic',
);

const cycleLogs: TeachingLog[] = Array.from({ length: 9 }, (_, i) => ({
  rawDate: `${String(i + 1).padStart(2, '0')}/06/2026`,
  date: `${String(i + 1).padStart(2, '0')}/06/2026`,
  originalDate: `${String(i + 1).padStart(2, '0')}/06/2026`,
  originalClassId: '10A',
  originalCaDay: i % 2 === 0 ? '15h30' : '17h30',
  classId: '10A',
  caDay: i % 2 === 0 ? '15h30' : '17h30',
  content: '',
  homework: '',
  teacherNote: '',
  teacherName: '',
  maGV: '',
  present: 0,
  absent: 0,
  late: 0,
  excused: 0,
  attendanceList: [],
}));
const cycleStudent: Student = { ...baseStudent, startDate: '01/06/2026' };
assert.deepEqual(
  getTuitionCycleState({ student: cycleStudent, classes: [twoSlotClass], payments: [], tlogs: cycleLogs, baseTuition: 600000 }).sessionProgress,
  { done: 9, target: 8, due: false, overdue: true },
  'cycle counts lessons since start when there is no payment',
);
const cyclePaid = getTuitionCycleState({
  student: cycleStudent,
  classes: [twoSlotClass],
  payments: [{ ...payments[0], date: '09/06/2026', thangHP: 6, namHP: 2026 }],
  tlogs: cycleLogs,
  baseTuition: 600000,
});
assert.equal(cyclePaid.status, 'paid', 'payment closes the overdue cycle');
assert.deepEqual(cyclePaid.sessionProgress, { done: 0, target: 8, due: false, overdue: false }, 'cycle resets to 0 after payment date');
const cycleAfterNextLesson = getTuitionCycleState({
  student: cycleStudent,
  classes: [twoSlotClass],
  payments: [{ ...payments[0], date: '09/06/2026', thangHP: 6, namHP: 2026 }],
  tlogs: [...cycleLogs, { ...cycleLogs[0], rawDate: '10/06/2026', date: '10/06/2026', originalDate: '10/06/2026', caDay: '15h30', originalCaDay: '15h30' }],
  baseTuition: 600000,
});
assert.equal(cycleAfterNextLesson.status, 'not_due', 'new cycle is not due after one lesson');
assert.deepEqual(cycleAfterNextLesson.sessionProgress, { done: 1, target: 8, due: false, overdue: false }, 'next lesson starts the new cycle at 1/8');

const health = buildDataHealthReport({
  students: [{ ...baseStudent, classId: 'MISSING' }],
  classes: [twoSlotClass],
  payments: [{ ...payments[0], studentId: 'HS999' }],
  tlogs: [{ ...logs[0], attendanceList: [] }],
});
assert.equal(health.totalIssues, 3, 'data health counts unknown class, unknown payment student, and missing attendance');
assert.equal(health.tone, 'danger', 'data health is danger when payment/student or class relation is broken');

console.log('domain rules ok');
