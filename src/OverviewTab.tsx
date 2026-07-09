/**
 * OverviewTab.tsx - dashboard dieu hanh hang ngay.
 */
import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MessageCircle,
  Plus,
  ReceiptText,
  School,
  TrendingUp,
  Users,
} from 'lucide-react';
import { fixVietnameseText, normalizeCaDayLabel, parseDMY, isStudentActive, isLessonOffLog } from './helpers';
import {
  calcStudentAbsenceStreak,
  calcStudentAttendance,
  getAttendanceRisk,
  getPaymentReceiptPeriod,
  getTuitionCycleState,
  normalizeAttendanceStatus,
} from './measures';
import { ActionableKpi, ActionableKpiGrid, EmptyState, MoneyText, PageToolbar } from './uiSystem';
import type { Student, Payment, TeachingLog, TrainingSub, OperationsSub, FinanceSub } from './types';

const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const CA_MINS: Record<string, number> = {
  '7h30': 7 * 60 + 30,
  '9h15': 9 * 60 + 15,
  '14h': 14 * 60,
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

function parseTimeLabel(raw: string) {
  const match = raw.match(/(\d{1,2})[h:](\d{0,2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  return normalizeCaDayLabel(`${hour}h${minute ? String(minute).padStart(2, '0') : ''}`);
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

function getClassId(c: Record<string, any>) {
  return fixVietnameseText(c['Mã Lớp'] || c['Mã lớp'] || c['MÃ£ Lá»›p'] || c['MÃƒÂ£ LÃ¡Â»â€ºp'] || c.MaLop || c['Ma Lop'] || c.classId || '');
}

function getClassName(c: Record<string, any>) {
  return getClassId(c);
}

function getClassTeacher(c: Record<string, any>) {
  return fixVietnameseText(c.GiaoVien || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || c['GiÃƒÂ¡o viÃƒÂªn'] || c.MaGV || c.teacherName || c.teacherId || '');
}

function getClassSlots(c: Record<string, any>) {
  return [
    c['Buổi 1'] || c['Buá»•i 1'] || c['BuÃ¡Â»â€¢i 1'] || c.Buoi1,
    c['Buổi 2'] || c['Buá»•i 2'] || c['BuÃ¡Â»â€¢i 2'] || c.Buoi2,
    c['Buổi 3'] || c['Buá»•i 3'] || c['BuÃ¡Â»â€¢i 3'] || c.Buoi3,
  ].filter(Boolean).map(fixVietnameseText);
}

function paymentInReceiptMonth(p: Payment, mo: number, yr: number) {
  const period = getPaymentReceiptPeriod(p);
  return period?.m === mo && period?.y === yr;
}

function studentStartedInMonth(s: Student, mo: number, yr: number) {
  const ts = parseDMY(s.startDate || '');
  if (!ts) return false;
  const d = new Date(ts);
  return d.getMonth() + 1 === mo && d.getFullYear() === yr;
}

function dateInMonth(raw: unknown, mo: number, yr: number) {
  const d = parseDateValue(raw);
  return !!d && d.getMonth() + 1 === mo && d.getFullYear() === yr;
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

function findMatchingLog(slot: TodaySlot, logs: TeachingLog[]) {
  return logs.find(log => {
    if (String(log.classId || '') !== slot.classId) return false;
    const d = parseDateValue(log.rawDate || log.date);
    if (!d || !sameDay(d, slot.date)) return false;
    if (log.caDay && slot.caDay && normalizeCaDayLabel(log.caDay) !== normalizeCaDayLabel(slot.caDay)) return false;
    return true;
  });
}

const PANEL_STYLE: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  boxShadow: '0 2px 16px rgba(79,70,229,0.08)',
  overflow: 'hidden',
};

function Panel({ children, style, onClick, className }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; className?: string }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...PANEL_STYLE,
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

function QuickAction({
  label,
  icon,
  tone = 'primary',
  primary,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'success' | 'neutral' | 'zalo';
  primary?: boolean;
  onClick: () => void;
}) {
  const cfg = {
    primary: { bg: '#4f46e5', color: 'white', border: '#4f46e5' },
    success: { bg: '#10b981', color: 'white', border: '#10b981' },
    neutral: { bg: '#f8fafc', color: '#334155', border: '#e8eaf3' },
    zalo: { bg: '#06b6d4', color: 'white', border: '#06b6d4' },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: primary ? 44 : 40,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: primary ? '10px 15px' : '9px 13px',
        borderRadius: 12,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: primary ? '0 8px 22px rgba(79,70,229,0.24)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function InsightItem({
  icon,
  label,
  value,
  sub,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
        width: '100%',
        border: '1px solid #eef2f7',
        borderRadius: 12,
        background: '#fff',
        padding: '10px 11px',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${tone}14`, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{value}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</p>
      </div>
    </button>
  );
}

interface Props {
  students: Student[];
  payments: Payment[];
  tlogs: TeachingLog[];
  uClasses: Record<string, any>[];
  curMo: number;
  curYr: number;
  baseTuition: number;
  goTraining: (sub?: TrainingSub) => void;
  goOperations: (sub?: OperationsSub) => void;
  goFinance: (sub?: FinanceSub) => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onAddStudent: () => void;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
  onAddIncome: () => void;
}

export default function OverviewTab({
  students,
  payments,
  tlogs,
  uClasses,
  curMo,
  curYr,
  baseTuition,
  goTraining,
  goOperations,
  goFinance,
  onAddStudent,
  onAddDiary,
  onAddIncome,
}: Props) {
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);
  const tuitionStates = useMemo(() => activeStudents.map(student => getTuitionCycleState({
    student,
    classes: uClasses,
    payments,
    tlogs,
    baseTuition,
  })), [activeStudents, baseTuition, payments, tlogs, uClasses]);
  const billableStudents = useMemo(
    () => tuitionStates.filter(state => state.billable).map(state => state.student),
    [tuitionStates],
  );
  const billablePaid = useMemo(
    () => tuitionStates.filter(state => state.status === 'paid').length,
    [tuitionStates],
  );
  const unpaidStudents = useMemo(
    () => tuitionStates.filter(state => state.outstandingAmount > 0).map(state => state.student),
    [tuitionStates],
  );
  const debtAmount = useMemo(
    () => tuitionStates.reduce((sum, state) => sum + state.outstandingAmount, 0),
    [tuitionStates],
  );

  const activeClasses = useMemo(
    () => uClasses.filter(c => !['inactive', 'nghi', 'da nghi', 'dong'].includes(norm(c.status || c.TrangThai))),
    [uClasses],
  );
  const monthPayments = useMemo(() => payments.filter(p => paymentInReceiptMonth(p, curMo, curYr)), [payments, curMo, curYr]);
  const monthRevenue = useMemo(() => monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [monthPayments]);

  const todayLabel = useMemo(() => {
    const today = new Date();
    return `${DAYS_VN[today.getDay()]}, ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }, []);

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

  const dueUnrecordedToday = useMemo(() => {
    const now = new Date();
    return todaySlots.filter(slot => {
      const startsAt = new Date(slot.date);
      const minutes = slotMinute(slot.caDay);
      startsAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return !slot.logged && startsAt <= now;
    });
  }, [todaySlots]);

  const soonSlots = useMemo(() => {
    const now = new Date();
    const soonMs = 90 * 60 * 1000;
    return todaySlots.filter(slot => {
      if (slot.logged) return false;
      const startsAt = new Date(slot.date);
      const minutes = slotMinute(slot.caDay);
      startsAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      const diff = startsAt.getTime() - now.getTime();
      return diff > 0 && diff <= soonMs;
    });
  }, [todaySlots]);

  const recordedToday = useMemo(() => todaySlots.filter(slot => slot.logged).length, [todaySlots]);

  const newStudentsThisMonth = useMemo(
    () => students.filter(s => studentStartedInMonth(s, curMo, curYr)),
    [students, curMo, curYr],
  );

  const monthLoggedLessons = useMemo(
    () => tlogs.filter(log => !isLessonOffLog(log) && dateInMonth(log.rawDate || log.date, curMo, curYr)).length,
    [tlogs, curMo, curYr],
  );

  const monthlyAttendancePct = useMemo(() => {
    let present = 0;
    let total = 0;
    tlogs.forEach(log => {
      if (isLessonOffLog(log) || !dateInMonth(log.rawDate || log.date, curMo, curYr)) return;
      (log.attendanceList || []).forEach((entry: any) => {
        const status = normalizeAttendanceStatus(entry.trangThai || entry['Trạng thái'] || entry.TrangThai || '');
        total++;
        if (status === 'present') present++;
      });
    });
    return total > 0 ? Math.round((present / total) * 100) : null;
  }, [tlogs, curMo, curYr]);

  const frequentAbsentees = useMemo(() => {
    const period = { m: curMo, y: curYr };
    return activeStudents
      .map(student => {
        const attendance = calcStudentAttendance(tlogs, student.id, period);
        const streak = calcStudentAbsenceStreak(tlogs, student.id, student.classId, period);
        return { student, absent: attendance.absent, streak, risk: getAttendanceRisk({ ...attendance, streak }) };
      })
      .filter(row => row.risk.tone === 'danger' || row.risk.tone === 'warning')
      .sort((a, b) => b.absent - a.absent || b.streak - a.streak);
  }, [activeStudents, tlogs, curMo, curYr]);

  const workItems = useMemo(() => {
    const classIds = new Set(activeClasses.map(getClassId).filter(Boolean));
    const unassigned = activeStudents.filter(s => !s.classId || s.classId === '---' || !classIds.has(s.classId)).length;
    const missingTeacher = activeClasses.filter(c => !getClassTeacher(c) || getClassTeacher(c) === '---').length;
    const missingSchedule = activeClasses.filter(c => getClassSlots(c).length === 0).length;

    return [
      dueUnrecordedToday.length > 0 && { id: 'attendance', tone: '#6366f1', title: `${dueUnrecordedToday.length} buổi đã tới giờ chưa ghi`, sub: 'Mở điểm danh để ghi ngay', onClick: () => goOperations('attendance') },
      unpaidStudents.length > 0 && { id: 'debt', tone: '#e11d48', title: `${unpaidStudents.length} học sinh có học phí tới hạn`, sub: <><MoneyText value={debtAmount} tone="danger" /> cần thu theo chu kỳ</>, onClick: () => goFinance('debt') },
      unassigned > 0 && { id: 'unassigned', tone: '#f59e0b', title: `${unassigned} học sinh chờ xếp lớp`, sub: 'Cần gán lớp học', onClick: () => goTraining('students') },
      missingTeacher > 0 && { id: 'teacher', tone: '#ef4444', title: `${missingTeacher} lớp thiếu giáo viên`, sub: 'Cần phân công giáo viên', onClick: () => goTraining('classes') },
      missingSchedule > 0 && { id: 'schedule', tone: '#f97316', title: `${missingSchedule} lớp thiếu lịch học`, sub: 'Cần bổ sung Buổi 1/2/3', onClick: () => goTraining('classes') },
      frequentAbsentees.length > 0 && { id: 'absence', tone: '#f97316', title: `${frequentAbsentees.length} học sinh nghỉ nhiều`, sub: 'Vắng nhiều hoặc vắng liên tiếp trong tháng', onClick: () => goOperations('attendance') },
      soonSlots.length > 0 && { id: 'soon', tone: '#0ea5e9', title: `${soonSlots.length} buổi sắp bắt đầu`, sub: 'Trong 90 phút tới', onClick: () => goOperations('schedule') },
    ].filter(Boolean) as { id: string; tone: string; title: string; sub: React.ReactNode; onClick: () => void }[];
  }, [activeClasses, activeStudents, curMo, debtAmount, dueUnrecordedToday.length, frequentAbsentees.length, goTraining, goOperations, goFinance, soonSlots.length, unpaidStudents.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        @media(max-width:767px){
          .overview-quick-actions{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important}
          .overview-quick-actions button{width:100%!important}
          .overview-kpi-grid > div{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .overview-insights{grid-template-columns:1fr 1fr!important}
          .overview-panel{min-height:0!important;padding:12px!important}
          .overview-panel .ltn-empty-state{min-height:70px!important}
        }
      `}</style>

      <PageToolbar
        title={(
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1a1d2e', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Tổng quan</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>{todayLabel}</p>
          </div>
        )}
        actions={(
          <>
            <span style={{ border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 900 }}>
              {todaySlots.length} buổi hôm nay
            </span>
            <span style={{ border: '1px solid #fee2e2', background: dueUnrecordedToday.length ? '#fff1f2' : '#f0fdf4', color: dueUnrecordedToday.length ? '#be123c' : '#047857', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 900 }}>
              {dueUnrecordedToday.length} cần ghi
            </span>
          </>
        )}
      />

      <div className="overview-kpi-grid">
        <ActionableKpiGrid>
          <ActionableKpi
            icon={Users}
            value={activeStudents.length}
            label="Học sinh đang học"
            sub={`${students.length} tổng hồ sơ`}
            tone="primary"
            onClick={() => goTraining('students')}
            actionLabel="Xem"
          />
          <ActionableKpi
            icon={School}
            value={todaySlots.length}
            label="Buổi hôm nay"
            sub={`${recordedToday} đã ghi · ${dueUnrecordedToday.length} cần ghi`}
            tone="info"
            onClick={() => goOperations('schedule')}
            actionLabel="Xem"
          />
          <ActionableKpi
            icon={TrendingUp}
            value={<MoneyText value={monthRevenue} compact tone="success" />}
            label="Đã thu trong tháng"
            sub="Theo ngày phiếu thu"
            tone="success"
            onClick={() => goFinance('ledger')}
            actionLabel="Xem"
          />
          <ActionableKpi
            icon={AlertTriangle}
            value={<MoneyText value={debtAmount} compact tone={debtAmount > 0 ? 'danger' : 'success'} />}
            label="Học phí tới hạn"
            sub={debtAmount > 0 ? `${unpaidStudents.length}/${billableStudents.length} học sinh cần thu` : 'Không có học sinh tới hạn'}
            tone={debtAmount > 0 ? 'danger' : 'success'}
            onClick={() => goFinance('debt')}
            actionLabel="Xem"
          />
        </ActionableKpiGrid>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <Panel className="overview-panel" style={{ minHeight: 210 }}>
          <SectionTitle title="Việc cần xử lý" />
          {workItems.length === 0 ? (
            <EmptyState icon={CheckCircle2} text="Không có việc cần xử lý" sub="Dữ liệu hiện tại đang ổn định." compact />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workItems.slice(0, 6).map(item => (
                <button key={item.id} onClick={item.onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', border: '1px solid #eef2f7', borderRadius: 10, background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
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

        <Panel className="overview-panel" style={{ minHeight: 210 }}>
          <SectionTitle title="Lịch dạy hôm nay" action="Vận hành →" onAction={() => goOperations('schedule')} />
          {todaySlots.length === 0 ? (
            <EmptyState icon={CalendarCheck} text="Không có buổi học hôm nay" sub="Bạn có thể kiểm tra lịch dạy trong tab Vận hành." compact />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaySlots.slice(0, 5).map(slot => {
                const startsAt = new Date(slot.date);
                const minutes = slotMinute(slot.caDay);
                startsAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                const isFuture = startsAt > new Date();
                const statusLabel = slot.logged ? 'Đã ghi' : isFuture ? 'Sắp tới' : 'Cần ghi';
                const statusBg = slot.logged ? '#ecfdf5' : isFuture ? '#eef2ff' : '#fffbeb';
                const statusColor = slot.logged ? '#047857' : isFuture ? '#4f46e5' : '#b45309';
                return (
                  <div key={`${slot.classId}-${slot.caDay}`} onClick={() => goOperations('schedule')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid #eef2f7', borderRadius: 10, cursor: 'pointer', background: '#fff' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: statusBg, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {slot.logged ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{slot.className || slot.classId} · {slot.caDay || '---'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                        {slot.teacher || 'Chưa có giáo viên'} · {statusLabel}
                      </p>
                    </div>
                    <span style={{ border: `1px solid ${slot.logged ? '#bbf7d0' : isFuture ? '#c7d2fe' : '#fde68a'}`, background: statusBg, color: statusColor, borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                      {statusLabel}
                    </span>
                    {!slot.logged && !isFuture && (
                      <button
                        onClick={e => { e.stopPropagation(); onAddDiary(slot.classId, slot.isoDate, slot.caDay); }}
                        style={{ border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', borderRadius: 8, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                      >
                        Ghi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel className="overview-panel">
        <SectionTitle title="Thông tin nổi bật" />
        <div className="overview-insights" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <InsightItem
            icon={<Users size={17} />}
            label="Học sinh mới"
            value={newStudentsThisMonth.length}
            sub={`Theo ngày bắt đầu T${curMo}/${curYr}`}
            tone="#10b981"
            onClick={() => goTraining('students')}
          />
          <InsightItem
            icon={<ReceiptText size={17} />}
            label="Phiếu thu"
            value={monthPayments.length}
            sub="Theo ngày thu trong tháng"
            tone="#0ea5e9"
            onClick={() => goFinance('ledger')}
          />
          <InsightItem
            icon={<CalendarCheck size={17} />}
            label="Buổi đã ghi"
            value={monthLoggedLessons}
            sub="Bỏ qua buổi nghỉ"
            tone="#6366f1"
            onClick={() => goOperations('lessons')}
          />
          <InsightItem
            icon={<CheckCircle2 size={17} />}
            label="Chuyên cần"
            value={monthlyAttendancePct == null ? '---' : `${monthlyAttendancePct}%`}
            sub="Có mặt / tổng lượt"
            tone="#f97316"
            onClick={() => goOperations('attendance')}
          />
        </div>
      </Panel>

      <Panel className="overview-panel overview-quick-panel">
        <SectionTitle title="Thao tác nhanh" />
        <div className="overview-quick-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <QuickAction label="Điểm danh" primary tone="primary" icon={<CalendarCheck size={15} />} onClick={() => onAddDiary()} />
          <QuickAction label="Thu học phí" tone="success" icon={<ReceiptText size={15} />} onClick={onAddIncome} />
          <QuickAction label="Thêm học sinh" tone="neutral" icon={<Plus size={15} />} onClick={onAddStudent} />
          <QuickAction label="Nhắc phí Zalo" tone="zalo" icon={<MessageCircle size={15} />} onClick={() => goFinance('debt')} />
        </div>
      </Panel>
    </div>
  );
}
