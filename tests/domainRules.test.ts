import assert from 'node:assert/strict';

import {
  buildDataHealthReport,
  buildPaidMap,
  calcMonthlyRevenue,
  calcStudentAttendance,
  calcStudentAbsenceStreak,
  countUniqueStudentAttendances,
  getAttendanceRisk,
  getClassSessionTarget,
  getMonthlyTuitionState,
  getPaymentTuitionPeriod,
  getTuitionCycleState,
  getTuitionSessionProgress,
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
  'class lesson progress still counts unique class lessons for class-level stats',
);
const makeupAttendanceLogs: TeachingLog[] = [
  {
    ...logs[0],
    maBuoi: 'B1',
    rawDate: '16/06/2026',
    date: '16/06/2026',
    classId: '10A',
    originalClassId: '10A',
    attendanceList: [{ maHS: 'HS001', trangThai: 'Váº¯ng' }],
  },
  {
    ...logs[0],
    maBuoi: 'B2',
    rawDate: '17/06/2026',
    date: '17/06/2026',
    classId: '10B',
    originalClassId: '10B',
    attendanceList: [{ maHS: 'HS001', trangThai: 'CÃ³ máº·t', LoaiDiemDanh: 'extra' }],
  },
  {
    ...logs[0],
    maBuoi: 'B2',
    rawDate: '17/06/2026',
    date: '17/06/2026',
    classId: '10B',
    originalClassId: '10B',
    attendanceList: [{ maHS: 'HS001', trangThai: 'CÃ³ máº·t', LoaiDiemDanh: 'extra' }],
  },
];
assert.equal(
  countUniqueStudentAttendances(makeupAttendanceLogs, 'HS001'),
  1,
  'tuition attendance counts present makeup in another class once and ignores absence',
);
assert.deepEqual(
  getTuitionCycleState({ student: baseStudent, classes: [twoSlotClass, threeSlotClass], payments: [], tlogs: makeupAttendanceLogs, baseTuition: 600000 }).sessionProgress,
  { done: 1, target: 8, due: false, overdue: false },
  'tuition cycle counts student attendance rows, not host class lessons',
);

const fullTwoSlotProgress = getTuitionSessionProgress(baseStudent, [twoSlotClass], new Map([['10A', 8]]));
assert.deepEqual(fullTwoSlotProgress, { done: 8, target: 8, due: true, overdue: false }, '2 sessions/week reaches tuition due at 8 lessons');
const overdueTwoSlotProgress = getTuitionSessionProgress(baseStudent, [twoSlotClass], new Map([['10A', 9]]));
assert.deepEqual(overdueTwoSlotProgress, { done: 9, target: 8, due: false, overdue: true }, '2 sessions/week is overdue after passing 8 lessons');

const enrollmentPayment: Payment = { ...payments[0], date: '20/06/2026', thangHP: 6, namHP: 2026, amount: 300000 };
const enrollmentState = getMonthlyTuitionState({
  student: baseStudent,
  period: { m: 6, y: 2026 },
  payments: [enrollmentPayment],
  baseTuition: 600000,
  pastDue: true,
});
assert.equal(
  enrollmentState.status,
  'paid',
  'enrollment month is closed when it has a tuition-period payment even if amount is below base tuition',
);
assert.equal(enrollmentState.outstandingAmount, 0, 'partial enrollment payment does not create automatic carry-over debt');
assert.equal(enrollmentState.amount, 300000, 'paid enrollment month shows the actual paid amount');

const nextMonthState = getMonthlyTuitionState({
  student: baseStudent,
  period: { m: 7, y: 2026 },
  payments: [enrollmentPayment],
  baseTuition: 600000,
  pastDue: false,
});
assert.equal(nextMonthState.status, 'unpaid', 'next month is independent from the paid enrollment month');
assert.equal(nextMonthState.outstandingAmount, 600000, 'next month uses base tuition when unpaid');

const prepaidJuly: Payment = { ...payments[0], date: '28/06/2026', thangHP: 7, namHP: 2026, amount: 600000 };
assert.equal(calcMonthlyRevenue([prepaidJuly], 6, 2026), 600000, 'cash revenue follows receipt date for prepaid tuition');
assert.equal(
  getMonthlyTuitionState({
    student: baseStudent,
    period: { m: 7, y: 2026 },
    payments: [prepaidJuly],
    baseTuition: 600000,
    pastDue: false,
  }).status,
  'paid',
  'debt status follows tuition period for prepaid tuition',
);
assert.equal(
  getMonthlyTuitionState({
    student: baseStudent,
    period: { m: 6, y: 2026 },
    payments: [prepaidJuly],
    baseTuition: 600000,
    pastDue: false,
  }).status,
  'unpaid',
  'prepaid next-month tuition does not mark the receipt month as paid',
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
cycleLogs.forEach((log, index) => {
  log.maBuoi = `CYCLE-${index + 1}`;
  log.attendanceList = [{ maHS: 'HS001', trangThai: 'CÃ³ máº·t' }];
});
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
