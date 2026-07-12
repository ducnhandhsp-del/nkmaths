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
  getUniquePaidStudentIdsByReceiptPeriod,
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
assert.equal(isStudentBillableInMonth({ ...baseStudent, endDate: '10/08/2026' }, { m: 8, y: 2026 }), true, 'leave month is still billable');
assert.equal(isStudentBillableInMonth({ ...baseStudent, endDate: '10/08/2026' }, { m: 9, y: 2026 }), false, 'months after leave month are not billable');
assert.equal(
  getMonthlyTuitionState({
    student: { ...baseStudent, status: 'inactive', endDate: '' },
    period: { m: 8, y: 2026 },
    payments: [],
    baseTuition: 600000,
  }).status,
  'inactive',
  'inactive student without endDate is not billable',
);

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

const makeCycleLog = (date: string, id: string, options: {
  classId?: string;
  status?: string;
  lessonType?: string;
  attendanceType?: string;
} = {}): TeachingLog => ({
  rawDate: date,
  date,
  originalDate: date,
  originalClassId: options.classId || '10A',
  originalCaDay: '15h30',
  classId: options.classId || '10A',
  caDay: '15h30',
  content: 'Bài học',
  homework: '',
  teacherNote: '',
  teacherName: '',
  maBuoi: id,
  lessonType: options.lessonType || 'regular',
  present: 1,
  absent: 0,
  late: 0,
  excused: 0,
  attendanceList: [{
    maHS: 'HS001',
    trangThai: options.status || 'Có mặt',
    LoaiDiemDanh: options.attendanceType || 'regular',
  }],
});

const julyCycleLogs = Array.from({ length: 9 }, (_, index) =>
  makeCycleLog(`${String(index + 1).padStart(2, '0')}/07/2026`, `JULY-${index + 1}`),
);

const midMonthPaidState = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [{ ...payments[0], date: '28/06/2026', thangHP: 6, namHP: 2026 }],
  tlogs: julyCycleLogs.slice(0, 7),
  baseTuition: 600000,
});
assert.equal(midMonthPaidState.status, 'due', 'A: seven attendances after a late-June payment are already in the collection window');
assert.deepEqual(midMonthPaidState.sessionProgress, { done: 7, target: 8, due: false, overdue: false }, 'A: new cycle counts only attendance after the latest payment');

const firstCycleSeven = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [],
  tlogs: [
    ...Array.from({ length: 7 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `FIRST-${index + 1}`)),
    makeCycleLog('14/06/2026', 'BEFORE-START'),
  ],
  baseTuition: 600000,
});
assert.equal(firstCycleSeven.status, 'due', 'B: seven attendances since start date are in the collection window');
assert.equal(firstCycleSeven.done, 7, 'B: attendance before startDate is ignored');
assert.equal(getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [],
  tlogs: Array.from({ length: 3 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `BEFORE-COLLECTION-${index + 1}`)),
  baseTuition: 600000,
}).status, 'not_due', 'B: three of eight attendances remain not due');
const halfCycleCollectionState = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [],
  tlogs: Array.from({ length: 4 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `COLLECTION-${index + 1}`)),
  baseTuition: 600000,
});
assert.equal(halfCycleCollectionState.collectionThreshold, 4, 'B: collection starts at half of an eight-session cycle');
assert.equal(halfCycleCollectionState.status, 'due', 'B: fourth attendance starts collection');
assert.equal(getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [],
  tlogs: [...Array.from({ length: 8 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `DUE-${index + 1}`))],
  baseTuition: 600000,
}).status, 'due', 'B: eighth attendance is due');
assert.equal(getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [],
  tlogs: [...Array.from({ length: 9 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `OVERDUE-${index + 1}`))],
  baseTuition: 600000,
}).status, 'overdue', 'B: ninth attendance is overdue');

const prepaidCycleState = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [{ ...payments[0], date: '28/06/2026', thangHP: 7, namHP: 2026 }],
  tlogs: [makeCycleLog('28/06/2026', 'PAYMENT-DAY'), makeCycleLog('01/07/2026', 'AFTER-PAYMENT')],
  baseTuition: 600000,
});
assert.equal(prepaidCycleState.done, 1, 'C: tuition-period label does not change cycle; payment-day lessons are excluded safely');
assert.equal(prepaidCycleState.status, 'not_due', 'C: prepaid tuition starts one new attendance cycle');

const adjustedPaymentState = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: [{ ...payments[0], date: '28/06/2026', amount: 300000 }],
  tlogs: [],
  baseTuition: 600000,
});
assert.equal(adjustedPaymentState.status, 'paid', 'D: any positive payment closes one cycle in the MVP');
assert.equal(adjustedPaymentState.amount, 300000, 'D: paid state exposes the actual receipt amount');
assert.equal(adjustedPaymentState.paidAmount, 300000, 'D: actual paid amount is available to admin and portal');
assert.equal(adjustedPaymentState.adjustedPayment, true, 'D: non-standard amount is marked for UI review');
assert.equal(adjustedPaymentState.outstandingAmount, 0, 'D: adjusted payment does not create automatic remaining debt');

const crossClassExtra = makeCycleLog('01/07/2026', 'EXTRA-1', { classId: '10B', lessonType: 'extra', attendanceType: 'extra' });
const crossClassState = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass, threeSlotClass],
  payments: [],
  tlogs: [crossClassExtra, { ...crossClassExtra }],
  baseTuition: 600000,
});
assert.equal(crossClassState.done, 1, 'E: present extra attendance in another class counts once by MaBuoi + MaHS');

const leavingStudent = { ...baseStudent, status: 'inactive', endDate: '20/06/2026' };
const leavingState = getTuitionCycleState({
  student: leavingStudent,
  classes: [twoSlotClass],
  payments: [],
  tlogs: [
    ...Array.from({ length: 4 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `LEAVE-${index + 1}`)),
    makeCycleLog('21/06/2026', 'AFTER-END'),
  ],
  baseTuition: 600000,
});
assert.equal(leavingState.done, 4, 'F: attendance after endDate is ignored');
assert.equal(leavingState.status, 'needs_review', 'F: leaving mid-cycle requires manual review instead of automatic debt');
assert.equal(leavingState.outstandingAmount, 0, 'F: manual-review state does not create automatic debt');

const phaseTwoSnapshot = [
  leavingState,
  getTuitionCycleState({
    student: baseStudent,
    classes: [twoSlotClass],
    payments: [],
    tlogs: Array.from({ length: 8 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `PHASE2-DUE-${index + 1}`)),
    baseTuition: 600000,
  }),
];
const phaseTwoCollectible = phaseTwoSnapshot.filter(state => state.status === 'due' || state.status === 'overdue');
assert.equal(phaseTwoCollectible.length, 1, 'phase 2: manual-review records are excluded from the collectible list');
assert.equal(phaseTwoCollectible.reduce((sum, state) => sum + state.outstandingAmount, 0), 600000, 'phase 2: only due/overdue states contribute to current debt');
assert.equal(phaseTwoSnapshot.filter(state => state.status === 'needs_review').length, 1, 'phase 2: manual-review records remain separately auditable');

const juneEndTs = new Date(2026, 5, 30, 23, 59, 59, 999).getTime();
const historicalLogs = [
  ...Array.from({ length: 8 }, (_, index) => makeCycleLog(`${String(index + 15).padStart(2, '0')}/06/2026`, `HISTORY-JUNE-${index + 1}`)),
  makeCycleLog('01/07/2026', 'HISTORY-JULY-1'),
];
const historicalPayments = [{ ...payments[0], date: '02/07/2026', thangHP: 7, namHP: 2026 }];
const juneSnapshot = getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: historicalPayments,
  tlogs: historicalLogs,
  baseTuition: 600000,
  asOfTs: juneEndTs,
});
assert.equal(juneSnapshot.status, 'due', 'phase 3: a later receipt does not close an earlier month-end snapshot');
assert.equal(juneSnapshot.done, 8, 'phase 3: attendance after the snapshot is excluded');
assert.equal(juneSnapshot.outstandingAmount, 600000, 'phase 3: historical due amount is reconstructed at the cutoff');
assert.equal(getTuitionCycleState({
  student: baseStudent,
  classes: [twoSlotClass],
  payments: historicalPayments,
  tlogs: historicalLogs,
  baseTuition: 600000,
}).status, 'paid', 'phase 3: current snapshot still includes the later receipt');
assert.equal(getTuitionCycleState({
  student: { ...baseStudent, status: 'inactive', endDate: '20/07/2026' },
  classes: [twoSlotClass],
  payments: [],
  tlogs: historicalLogs,
  baseTuition: 600000,
  asOfTs: juneEndTs,
}).status, 'due', 'phase 3: a student who leaves after the cutoff is active at the cutoff');
const notStartedHistoricalState = getTuitionCycleState({
  student: { ...baseStudent, startDate: '01/07/2026' },
  classes: [twoSlotClass],
  payments: [],
  tlogs: historicalLogs,
  baseTuition: 600000,
  asOfTs: juneEndTs,
});
assert.equal(notStartedHistoricalState.status, 'not_started', 'phase 3: a future enrollment has a distinct historical status');
assert.equal(notStartedHistoricalState.outstandingAmount, 0, 'phase 3: a student who has not started by the cutoff has no debt');

assert.equal(getTuitionCycleState({
  student: baseStudent,
  classes: [],
  payments: [],
  tlogs: [],
  baseTuition: 600000,
}).status, 'no_schedule', 'student without a valid class schedule cannot create automatic debt');
assert.equal(getTuitionCycleState({
  student: { ...baseStudent, status: 'inactive', endDate: '' },
  classes: [],
  payments: [],
  tlogs: [],
  baseTuition: 600000,
}).status, 'inactive', 'inactive student without a reliable endDate never creates automatic cycle debt');

const receiptPaidIds = getUniquePaidStudentIdsByReceiptPeriod([
  { ...payments[0], studentId: 'HS001', date: '02/07/2026', amount: 600000 },
  { ...payments[0], studentId: 'HS001', date: '10/07/2026', amount: 100000 },
  { ...payments[0], studentId: 'HS002', date: '10/07/2026', amount: 500000 },
  { ...payments[0], studentId: '', date: '10/07/2026', amount: 600000 },
  { ...payments[0], studentId: 'HS003', date: '30/06/2026', amount: 600000 },
], { m: 7, y: 2026 });
assert.deepEqual([...receiptPaidIds].sort(), ['HS001', 'HS002'], 'release: receipt-month paid counts are unique by studentId');

const health = buildDataHealthReport({
  students: [{ ...baseStudent, classId: 'MISSING' }],
  classes: [twoSlotClass],
  payments: [{ ...payments[0], studentId: 'HS999' }],
  tlogs: [{ ...logs[0], attendanceList: [] }],
});
assert.equal(health.totalIssues, 3, 'data health counts unknown class, unknown payment student, and missing attendance');
assert.equal(health.tone, 'danger', 'data health is danger when payment/student or class relation is broken');

console.log('domain rules ok');
