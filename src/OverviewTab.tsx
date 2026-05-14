/**
 * OverviewTab.tsx — dashboard điều hành hệ thống.
 */
import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  Plus,
  ReceiptText,
  School,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { fmtVND, formatDate, parseDMY, isStudentActive } from './helpers';
import { Grid2 } from './UIComponents';
import { Button } from './dsComponents';
import { StatBlock, StatGrid, TABLE_WRAP, fmtM } from './AppComponents';
import { groupByMonth } from './aggregations';
import type { Student, Payment, Expense, TeachingLog, TrainingSub, OperationsSub, FinanceSub } from './types';

const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const CA_MINS: Record<string, number> = {
  '7h30': 7 * 60 + 30,
  '9h': 9 * 60,
  '13h30': 13 * 60 + 30,
  '15h30': 15 * 60 + 30,
  '17h30': 17 * 60 + 30,
  '19h30': 19 * 60 + 30,
};

function norm(raw: unknown) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function isMonthBillable(student: Student, curMo: number, curYr: number): boolean {
  const monthStart = new Date(curYr, curMo - 1, 1).getTime();

  const startTs = parseDMY(student.startDate || '');
  if (startTs) {
    const startDate = new Date(startTs);
    const enrollMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime();
    if (monthStart < enrollMonth) return false;
  }

  const endRaw = String(student.endDate || '').trim();
  const endTs = parseDMY(endRaw);
  if (endTs && endRaw && endRaw !== '---') {
    const endDate = new Date(endTs);
    const leaveMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1).getTime();
    if (monthStart >= leaveMonth) return false;
  }

  return true;
}

function parseTimeLabel(raw: string) {
  const match = raw.match(/(\d{1,2})[h:](\d{0,2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  return `${hour}h${minute ? String(minute).padStart(2, '0') : ''}`;
}

function parseSlot(raw: unknown) {
  const value = String(raw || '').trim();
  if (!value) return null;
  const day = value.split(/\s+/)[0];
  if (!DAYS_VN.includes(day)) return null;
  const caDay = parseTimeLabel(value);
  return { day, caDay, raw: value };
}

function slotMinute(caDay: string) {
  if (CA_MINS[caDay] != null) return CA_MINS[caDay];
  const match = caDay.match(/(\d{1,2})h(\d{0,2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + (match[2] ? Number(match[2]) : 0);
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDateValue(raw: unknown) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const ts = parseDMY(value.includes(' - ') ? value.split(' - ')[1] : value);
  return ts ? new Date(ts) : null;
}

function dateTs(...values: unknown[]) {
  for (const value of values) {
    const date = parseDateValue(value);
    if (date) return date.getTime();
  }
  return 0;
}

function dateLabel(...values: unknown[]) {
  for (const value of values) {
    const raw = String(value || '').trim();
    if (raw) return raw;
  }
  return '';
}

function timeAgo(raw: string) {
  const ts = dateTs(raw);
  if (!ts) return raw || '---';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 2) return 'vừa xong';
  if (m < 60) return `${m}p trước`;
  if (h < 24) return `${h}h trước`;
  if (d < 7) return `${d} ngày trước`;
  return formatDate(raw);
}

function getClassId(c: Record<string, any>) {
  return String(c['Mã Lớp'] || c['MÃ£ Lá»›p'] || c['MÃƒÂ£ LÃ¡Â»â€ºp'] || c.MaLop || c['Ma Lop'] || c.classId || '').trim();
}

function getClassName(c: Record<string, any>) {
  return String(c['Tên Lớp'] || c['TÃªn Lá»›p'] || c.TenLop || c.name || getClassId(c)).trim();
}

function getClassTeacher(c: Record<string, any>) {
  return String(c.GiaoVien || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || c.MaGV || c.teacherName || c.teacherId || '').trim();
}

function getClassSlots(c: Record<string, any>) {
  return [
    c['Buổi 1'] || c['Buá»•i 1'] || c['BuÃ¡Â»â€¢i 1'],
    c['Buổi 2'] || c['Buá»•i 2'] || c['BuÃ¡Â»â€¢i 2'],
    c['Buổi 3'] || c['Buá»•i 3'] || c['BuÃ¡Â»â€¢i 3'],
  ].filter(Boolean);
}

function logInMonth(log: TeachingLog, mo: number, yr: number) {
  const d = parseDateValue(log.rawDate || log.date);
  return !!d && d.getMonth() + 1 === mo && d.getFullYear() === yr;
}

function paymentInReceiptMonth(p: Payment, mo: number, yr: number) {
  const d = parseDateValue(p.date);
  return !!d && d.getMonth() + 1 === mo && d.getFullYear() === yr;
}

function expenseInMonth(e: Expense, mo: number, yr: number) {
  const d = parseDateValue(e.date);
  return !!d && d.getMonth() + 1 === mo && d.getFullYear() === yr;
}

function findMatchingLog(slot: TodaySlot, logs: TeachingLog[]) {
  return logs.find(log => {
    if (String(log.classId || '') !== slot.classId) return false;
    const d = parseDateValue(log.rawDate || log.date);
    if (!d || !sameDay(d, slot.date)) return false;
    if (log.caDay && slot.caDay && log.caDay !== slot.caDay) return false;
    return true;
  });
}

interface TodaySlot {
  date: Date;
  isoDate: string;
  classId: string;
  className: string;
  caDay: string;
  teacher: string;
  logged: boolean;
}

function Panel({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...TABLE_WRAP,
        padding: 14,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</p>
      {action && onAction && (
        <button onClick={onAction} style={{ border: 'none', background: 'transparent', color: '#4f46e5', fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: 0 }}>
          {action}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ padding: '18px 10px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 7 }}>
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#64748b' }}>{title}</p>
      <p style={{ margin: '3px 0 0', fontSize: 12 }}>{sub}</p>
    </div>
  );
}

interface Props {
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  tlogs: TeachingLog[];
  uClasses: Record<string, any>[];
  curMo: number;
  curYr: number;
  goTraining: (sub?: TrainingSub) => void;
  goOperations: (sub?: OperationsSub) => void;
  goFinance: (sub?: FinanceSub) => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onAddStudent: () => void;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export default function OverviewTab({
  students,
  payments,
  expenses,
  tlogs,
  uClasses,
  curMo,
  curYr,
  goTraining,
  goOperations,
  goFinance,
  isPaid,
  onAddStudent,
  onAddDiary,
  onAddIncome,
  onAddExpense,
}: Props) {
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);
  const billableStudents = useMemo(
    () => activeStudents.filter(s => isMonthBillable(s, curMo, curYr)),
    [activeStudents, curMo, curYr],
  );
  const billablePaid = useMemo(
    () => billableStudents.filter(s => isPaid(s.id, curMo, curYr)).length,
    [billableStudents, curMo, curYr, isPaid],
  );
  const paidPct = billableStudents.length ? Math.round((billablePaid / billableStudents.length) * 100) : 0;

  const activeClasses = useMemo(
    () => uClasses.filter(c => !['inactive', 'nghi', 'da nghi', 'dong'].includes(norm(c.status || c.TrangThai))),
    [uClasses],
  );
  const classesWithSchedule = useMemo(() => activeClasses.filter(c => getClassSlots(c).length > 0), [activeClasses]);

  const monthPayments = useMemo(() => payments.filter(p => paymentInReceiptMonth(p, curMo, curYr)), [payments, curMo, curYr]);
  const monthExpenses = useMemo(() => expenses.filter(e => expenseInMonth(e, curMo, curYr)), [expenses, curMo, curYr]);
  const monthRevenue = useMemo(() => monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [monthPayments]);
  const monthExpense = useMemo(() => monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [monthExpenses]);
  const monthProfit = monthRevenue - monthExpense;

  const todaySlots = useMemo(() => {
    const today = new Date();
    const dayCode = DAYS_VN[today.getDay()];
    const slots: TodaySlot[] = [];

    activeClasses.forEach(c => {
      const classId = getClassId(c);
      getClassSlots(c).forEach(rawSlot => {
        const parsed = parseSlot(rawSlot);
        if (!parsed || parsed.day !== dayCode || !classId) return;
        const slot: TodaySlot = {
          date: today,
          isoDate: toISO(today),
          classId,
          className: getClassName(c),
          caDay: parsed.caDay,
          teacher: getClassTeacher(c),
          logged: false,
        };
        slot.logged = !!findMatchingLog(slot, tlogs);
        slots.push(slot);
      });
    });

    return slots.sort((a, b) => slotMinute(a.caDay) - slotMinute(b.caDay) || a.classId.localeCompare(b.classId));
  }, [activeClasses, tlogs]);

  const workItems = useMemo(() => {
    const classIds = new Set(activeClasses.map(getClassId).filter(Boolean));
    const unassigned = activeStudents.filter(s => !s.classId || s.classId === '---' || !classIds.has(s.classId)).length;
    const missingTeacher = activeClasses.filter(c => !getClassTeacher(c) || getClassTeacher(c) === '---').length;
    const missingSchedule = activeClasses.filter(c => getClassSlots(c).length === 0).length;
    const unpaid = billableStudents.filter(s => !isPaid(s.id, curMo, curYr)).length;
    const now = new Date();
    const unrecordedToday = todaySlots.filter(slot => {
      const startsAt = new Date(slot.date);
      const minutes = slotMinute(slot.caDay);
      startsAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return !slot.logged && startsAt <= now;
    }).length;
    const missingPaymentCodes = monthPayments.filter(p => !p.studentId || !p.maLop).length;

    return [
      unassigned > 0 && { id: 'unassigned', tone: '#f59e0b', title: `${unassigned} học sinh chưa có lớp`, sub: 'Cần gán lớp học', onClick: () => goTraining('students') },
      missingTeacher > 0 && { id: 'teacher', tone: '#ef4444', title: `${missingTeacher} lớp thiếu giáo viên`, sub: 'Cần phân công giáo viên', onClick: () => goTraining('classes') },
      missingSchedule > 0 && { id: 'schedule', tone: '#f97316', title: `${missingSchedule} lớp thiếu lịch học`, sub: 'Cần bổ sung Buổi 1/2/3', onClick: () => goTraining('classes') },
      unpaid > 0 && { id: 'debt', tone: '#e11d48', title: `${unpaid} học sinh chưa đóng T${curMo}`, sub: 'Theo học sinh billable tháng này', onClick: () => goFinance('debt') },
      unrecordedToday > 0 && { id: 'log', tone: '#6366f1', title: `${unrecordedToday} buổi hôm nay chưa ghi`, sub: 'Cần ghi buổi học', onClick: () => goOperations('schedule') },
      missingPaymentCodes > 0 && { id: 'codes', tone: '#64748b', title: `${missingPaymentCodes} phiếu thu thiếu mã`, sub: 'Thiếu MaHS hoặc MaLop', onClick: () => goFinance('ledger') },
    ].filter(Boolean) as { id: string; tone: string; title: string; sub: string; onClick: () => void }[];
  }, [activeClasses, activeStudents, billableStudents, curMo, curYr, goTraining, goOperations, goFinance, isPaid, monthPayments, todaySlots]);

  const recentLessons = useMemo(() => {
    return tlogs
      .map((l, i) => {
        const label = dateLabel(l.updatedAt, l.createdAt, l.rawDate, l.date);
        const ts = dateTs(l.updatedAt, l.createdAt, l.rawDate, l.date);
        return ts ? { ...l, _label: label, _ts: ts + i / 1000 } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b._ts - a._ts)
      .slice(0, 5) as (TeachingLog & { _label: string; _ts: number })[];
  }, [tlogs]);

  const recentFinance = useMemo(() => {
    const rows = [
      ...payments.map((p, i) => ({
        id: `p-${p.docNum || p.id || i}`,
        type: 'Thu' as const,
        amount: Number(p.amount) || 0,
        title: p.studentName || p.payer || p.description || 'Phiếu thu',
        sub: p.docNum || p.note || '',
        label: dateLabel(p.updatedAt, p.createdAt, p.date),
        ts: dateTs(p.updatedAt, p.createdAt, p.date) + i / 1000,
      })),
      ...expenses.map((e, i) => ({
        id: `e-${e.docNum || e.id || i}`,
        type: 'Chi' as const,
        amount: Number(e.amount) || 0,
        title: e.description || e.category || 'Phiếu chi',
        sub: e.docNum || e.spender || '',
        label: dateLabel(e.updatedAt, e.createdAt, e.date),
        ts: dateTs(e.updatedAt, e.createdAt, e.date) + i / 1000,
      })),
    ];
    return rows.filter(r => r.ts > 0).sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [payments, expenses]);

  const monthChart = useMemo(() => groupByMonth(payments, expenses, students, isPaid, 6), [payments, expenses, students, isPaid]);
  const maxChart = Math.max(...monthChart.map(m => Math.max(m.revenue, m.expense)), 1);
  const hasChartData = monthChart.some(m => m.revenue > 0 || m.expense > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Panel style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Tổng quan</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>Điều hành lớp học hôm nay · Tháng {curMo}/{curYr}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button size="sm" intent="primary" icon={<CalendarCheck size={14} />} onClick={() => onAddDiary()}>Ghi buổi học</Button>
            <Button size="sm" intent="secondary" icon={<Plus size={14} />} onClick={onAddStudent}>Thêm học sinh</Button>
            <Button size="sm" intent="success" icon={<ReceiptText size={14} />} onClick={onAddIncome}>Thêm phiếu thu</Button>
            <Button size="sm" intent="neutral" icon={<WalletCards size={14} />} onClick={onAddExpense}>Thêm phiếu chi</Button>
          </div>
        </div>
      </Panel>

      <StatGrid>
        <StatBlock
          icon={Users}
          value={activeStudents.length}
          label="Học sinh đang học"
          sub={`${students.length} tổng hồ sơ`}
          gradient="linear-gradient(135deg,#6366f1,#4f46e5)"
          onClick={() => goTraining('students')}
          actionLabel="Xem"
        />
        <StatBlock
          icon={School}
          value={activeClasses.length}
          label="Số lớp hiện có"
          sub={`${classesWithSchedule.length} lớp có lịch học`}
          gradient="linear-gradient(135deg,#0ea5e9,#0284c7)"
          onClick={() => goTraining('classes')}
          actionLabel="Xem"
        />
        <StatBlock
          icon={CheckCircle2}
          value={`${paidPct}%`}
          label="Tỉ lệ đóng phí tháng này"
          sub={`${billablePaid}/${billableStudents.length} học sinh đã đóng`}
          gradient="linear-gradient(135deg,#10b981,#059669)"
          onClick={() => goFinance('debt')}
          actionLabel="Xem"
        />
        <StatBlock
          icon={DollarSign}
          value={fmtM(monthRevenue)}
          label="Doanh thu tháng này"
          sub="Từ phiếu thu tháng này"
          gradient="linear-gradient(135deg,#f59e0b,#d97706)"
          onClick={() => goFinance('report')}
          actionLabel="Xem"
        />
      </StatGrid>

      <Grid2 gap={14}>
        <Panel>
          <SectionTitle title="Hôm nay" action="Vận hành →" onAction={() => goOperations('schedule')} />
          {todaySlots.length === 0 ? (
            <EmptyState icon={<CalendarCheck size={18} color="#94a3b8" />} title="Không có lớp hôm nay" sub="Bạn có thể kiểm tra lịch dạy trong tab Vận hành." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaySlots.slice(0, 5).map(slot => (
                <div key={`${slot.classId}-${slot.caDay}`} onClick={() => goOperations('schedule')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid #eef2f7', borderRadius: 9, cursor: 'pointer', background: '#fff' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: slot.logged ? '#ecfdf5' : '#fffbeb', color: slot.logged ? '#047857' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {slot.logged ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{slot.className || slot.classId} · {slot.caDay || '---'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                      {slot.teacher || 'Chưa có giáo viên'} · {slot.logged ? 'Đã ghi buổi học' : 'Chưa ghi buổi học'}
                    </p>
                  </div>
                  {!slot.logged && (
                    <button
                      onClick={e => { e.stopPropagation(); onAddDiary(slot.classId, slot.isoDate, slot.caDay); }}
                      style={{ border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                    >
                      Ghi
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <SectionTitle title="Việc cần xử lý" />
          {workItems.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={18} color="#94a3b8" />} title="Không có việc cần xử lý" sub="Dữ liệu hiện tại đang ổn định." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workItems.slice(0, 5).map(item => (
                <button key={item.id} onClick={item.onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid #eef2f7', borderRadius: 9, background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: item.tone, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{item.title}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: '#64748b' }}>{item.sub}</span>
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </Grid2>

      <Grid2 gap={14}>
        <Panel>
          <SectionTitle title="Buổi học gần đây" action="Xem tất cả →" onAction={() => goOperations('lessons')} />
          {recentLessons.length === 0 ? (
            <EmptyState icon={<BookOpen size={18} color="#94a3b8" />} title="Chưa có buổi học nào được ghi nhận." sub="Các buổi mới ghi sẽ xuất hiện tại đây." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentLessons.map((log, i) => (
                <div key={`${log.classId}-${log.date}-${log.caDay}-${i}`} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i === recentLessons.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {log.classId} · {log.content || 'Buổi học'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                      {timeAgo(log._label)} · {log.present || 0} có mặt · {log.absent || 0} vắng{(log.excused || 0) > 0 ? ` · ${log.excused} có phép` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <SectionTitle title="Thu / chi gần đây" action="Xem tài chính →" onAction={() => goFinance('report')} />
          {recentFinance.length === 0 ? (
            <EmptyState icon={<ReceiptText size={18} color="#94a3b8" />} title="Chưa có giao dịch thu/chi gần đây." sub="Phiếu thu và phiếu chi mới sẽ xuất hiện tại đây." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentFinance.map((row, i) => (
                <div key={row.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i === recentFinance.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: row.type === 'Thu' ? '#ecfdf5' : '#fff1f2', color: row.type === 'Thu' ? '#059669' : '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {row.type === 'Thu' ? <TrendingUp size={15} /> : <DollarSign size={15} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {row.type} {fmtVND(row.amount)} · {row.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                      {timeAgo(row.label)}{row.sub ? ` · ${row.sub}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </Grid2>

      <Panel>
        <SectionTitle title="Báo cáo nhanh tháng này" action="Tài chính →" onAction={() => goFinance('report')} />
        <Grid2 gap={14}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {[
              { label: 'Thu tháng này', value: fmtM(monthRevenue), color: '#059669' },
              { label: 'Chi tháng này', value: fmtM(monthExpense), color: '#e11d48' },
              { label: 'Lợi nhuận', value: `${monthProfit >= 0 ? '+' : ''}${fmtM(monthProfit)}`, color: monthProfit >= 0 ? '#4f46e5' : '#f97316' },
              { label: 'Đóng phí', value: `${paidPct}%`, color: '#0ea5e9' },
            ].map(item => (
              <div key={item.label} style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: '10px 12px', background: '#fff' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#64748b' }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 12, background: '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Thu / chi 6 tháng gần nhất</p>
            {!hasChartData ? (
              <EmptyState icon={<AlertTriangle size={18} color="#94a3b8" />} title="Chưa đủ dữ liệu để vẽ biểu đồ." sub="Khi có phiếu thu/chi, biểu đồ sẽ tự cập nhật." />
            ) : (
              <>
                <div style={{ height: 112, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  {monthChart.map(item => {
                    const revHeight = Math.max(3, Math.round((item.revenue / maxChart) * 92));
                    const expHeight = Math.max(3, Math.round((item.expense / maxChart) * 92));
                    return (
                      <div key={item.label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{ height: 92, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
                          <span title={`Thu: ${fmtVND(item.revenue)}`} style={{ width: 10, height: item.revenue > 0 ? revHeight : 0, borderRadius: '4px 4px 0 0', background: '#10b981', display: 'block' }} />
                          <span title={`Chi: ${fmtVND(item.expense)}`} style={{ width: 10, height: item.expense > 0 ? expHeight : 0, borderRadius: '4px 4px 0 0', background: '#f43f5e', display: 'block' }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />Thu</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#f43f5e' }} />Chi</span>
                </div>
              </>
            )}
          </div>
        </Grid2>
      </Panel>
    </div>
  );
}
