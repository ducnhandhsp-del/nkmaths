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
import { parseDMY, isStudentActive } from './helpers';
import { ActionableKpi, ActionableKpiGrid, EmptyState, MoneyText, PageToolbar } from './uiSystem';
import type { Student, Payment, TeachingLog, TrainingSub, OperationsSub, FinanceSub } from './types';

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

function getClassId(c: Record<string, any>) {
  return String(c['Mã Lớp'] || c['Mã lớp'] || c['MÃ£ Lá»›p'] || c['MÃƒÂ£ LÃ¡Â»â€ºp'] || c.MaLop || c['Ma Lop'] || c.classId || '').trim();
}

function getClassName(c: Record<string, any>) {
  return String(c['Tên Lớp'] || c['Tên lớp'] || c['TÃªn Lá»›p'] || c['TÃƒÂªn LÃ¡Â»â€ºp'] || c.TenLop || c.name || getClassId(c)).trim();
}

function getClassTeacher(c: Record<string, any>) {
  return String(c.GiaoVien || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || c['GiÃƒÂ¡o viÃƒÂªn'] || c.MaGV || c.teacherName || c.teacherId || '').trim();
}

function getClassSlots(c: Record<string, any>) {
  return [
    c['Buổi 1'] || c['Buá»•i 1'] || c['BuÃ¡Â»â€¢i 1'] || c.Buoi1,
    c['Buổi 2'] || c['Buá»•i 2'] || c['BuÃ¡Â»â€¢i 2'] || c.Buoi2,
    c['Buổi 3'] || c['Buá»•i 3'] || c['BuÃ¡Â»â€¢i 3'] || c.Buoi3,
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

function studentStartedInMonth(s: Student, mo: number, yr: number) {
  const ts = parseDMY(s.startDate || '');
  if (!ts) return false;
  const d = new Date(ts);
  return d.getMonth() + 1 === mo && d.getFullYear() === yr;
}

function attendanceStatusOf(a: any) {
  return a.trangThai || a['Trạng thái'] || a['Tráº¡ng thÃ¡i'] || a.TrangThai || '';
}

function normalizeAttendanceStatus(raw: unknown): 'present' | 'absent' | 'excused' {
  const s = String(raw || '').trim();
  if (s === 'Vắng') return 'absent';
  if (s === 'Có phép' || s === 'Nghỉ có phép') return 'excused';
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n === 'vang' || n === 'absent') return 'absent';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'excused';
  return 'present';
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
    if (log.caDay && slot.caDay && log.caDay !== slot.caDay) return false;
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
  isPaid,
  onAddStudent,
  onAddDiary,
  onAddIncome,
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
  const unpaidStudents = useMemo(
    () => billableStudents.filter(s => !isPaid(s.id, curMo, curYr)),
    [billableStudents, curMo, curYr, isPaid],
  );
  const debtAmount = unpaidStudents.length * baseTuition;

  const activeClasses = useMemo(
    () => uClasses.filter(c => !['inactive', 'nghi', 'da nghi', 'dong'].includes(norm(c.status || c.TrangThai))),
    [uClasses],
  );
  const classesWithSchedule = useMemo(() => activeClasses.filter(c => getClassSlots(c).length > 0), [activeClasses]);
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

  const newStudentsThisMonth = useMemo(
    () => students.filter(s => studentStartedInMonth(s, curMo, curYr)),
    [students, curMo, curYr],
  );

  const frequentAbsentees = useMemo(() => {
    const map = new Map<string, { student: Student; absent: number }>();
    activeStudents.forEach(s => map.set(s.id, { student: s, absent: 0 }));
    tlogs.filter(log => logInMonth(log, curMo, curYr)).forEach(log => {
      (log.attendanceList || []).forEach((a: any) => {
        const id = String(a.maHS || a['Mã HS'] || a['MÃ£ HS'] || a.MaHS || '').trim();
        const row = map.get(id);
        if (!row) return;
        if (normalizeAttendanceStatus(attendanceStatusOf(a)) === 'absent') row.absent++;
      });
    });
    return [...map.values()].filter(row => row.absent >= 3).sort((a, b) => b.absent - a.absent);
  }, [activeStudents, tlogs, curMo, curYr]);

  const workItems = useMemo(() => {
    const classIds = new Set(activeClasses.map(getClassId).filter(Boolean));
    const unassigned = activeStudents.filter(s => !s.classId || s.classId === '---' || !classIds.has(s.classId)).length;
    const missingTeacher = activeClasses.filter(c => !getClassTeacher(c) || getClassTeacher(c) === '---').length;
    const missingSchedule = activeClasses.filter(c => getClassSlots(c).length === 0).length;

    return [
      dueUnrecordedToday.length > 0 && { id: 'attendance', tone: '#6366f1', title: `${dueUnrecordedToday.length} buổi chưa điểm danh`, sub: 'Mở Chuyên cần để kiểm tra', onClick: () => goOperations('attendance') },
      unpaidStudents.length > 0 && { id: 'debt', tone: '#e11d48', title: `${unpaidStudents.length} học sinh nợ phí T${curMo}`, sub: <><MoneyText value={debtAmount} tone="danger" /> cần thu</>, onClick: () => goFinance('debt') },
      unassigned > 0 && { id: 'unassigned', tone: '#f59e0b', title: `${unassigned} học sinh chờ xếp lớp`, sub: 'Cần gán lớp học', onClick: () => goTraining('students') },
      newStudentsThisMonth.length > 0 && { id: 'new-students', tone: '#10b981', title: `${newStudentsThisMonth.length} học sinh mới đăng ký`, sub: `Trong T${curMo}/${curYr}`, onClick: () => goTraining('students') },
      frequentAbsentees.length > 0 && { id: 'absence', tone: '#f97316', title: `${frequentAbsentees.length} học sinh nghỉ nhiều`, sub: 'Từ 3 lượt vắng trong tháng', onClick: () => goOperations('attendance') },
      soonSlots.length > 0 && { id: 'soon', tone: '#0ea5e9', title: `${soonSlots.length} lớp sắp bắt đầu`, sub: 'Trong 90 phút tới', onClick: () => goOperations('schedule') },
      missingTeacher > 0 && { id: 'teacher', tone: '#ef4444', title: `${missingTeacher} lớp thiếu giáo viên`, sub: 'Cần phân công giáo viên', onClick: () => goTraining('classes') },
      missingSchedule > 0 && { id: 'schedule', tone: '#f97316', title: `${missingSchedule} lớp thiếu lịch học`, sub: 'Cần bổ sung Buổi 1/2/3', onClick: () => goTraining('classes') },
    ].filter(Boolean) as { id: string; tone: string; title: string; sub: React.ReactNode; onClick: () => void }[];
  }, [activeClasses, activeStudents, curMo, curYr, debtAmount, dueUnrecordedToday.length, frequentAbsentees.length, goTraining, goOperations, goFinance, newStudentsThisMonth.length, soonSlots.length, unpaidStudents.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        @media(max-width:767px){
          .overview-quick-actions{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important}
          .overview-quick-actions button{width:100%!important}
          .overview-kpi-grid > div{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .overview-panel{min-height:0!important;padding:12px!important}
          .overview-panel .ltn-empty-state{min-height:70px!important}
        }
      `}</style>

      <PageToolbar
        title={(
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1a1d2e', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Tổng quan</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>Điều hành hôm nay · {todayLabel} · Tháng {curMo}/{curYr}</p>
          </div>
        )}
        actions={(
          <>
            <span style={{ border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 900 }}>
              {todaySlots.length} lớp hôm nay
            </span>
            <span style={{ border: '1px solid #fee2e2', background: dueUnrecordedToday.length ? '#fff1f2' : '#f0fdf4', color: dueUnrecordedToday.length ? '#be123c' : '#047857', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 900 }}>
              {dueUnrecordedToday.length} chưa điểm danh
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
            label="Lớp hôm nay"
            sub={`${classesWithSchedule.length}/${activeClasses.length} lớp có lịch`}
            tone="info"
            onClick={() => goOperations('schedule')}
            actionLabel="Xem"
          />
          <ActionableKpi
            icon={TrendingUp}
            value={<MoneyText value={monthRevenue} compact tone="success" />}
            label="Doanh thu tháng này"
            sub="Từ phiếu thu tháng này"
            tone="success"
            onClick={() => goFinance('ledger')}
            actionLabel="Xem"
          />
          <ActionableKpi
            icon={AlertTriangle}
            value={<MoneyText value={debtAmount} compact tone={debtAmount > 0 ? 'danger' : 'success'} />}
            label="Công nợ"
            sub={`${unpaidStudents.length}/${billableStudents.length} học sinh cần thu`}
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
            <EmptyState icon={CalendarCheck} text="Không có lớp hôm nay" sub="Bạn có thể kiểm tra lịch dạy trong tab Vận hành." compact />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaySlots.slice(0, 5).map(slot => {
                const startsAt = new Date(slot.date);
                const minutes = slotMinute(slot.caDay);
                startsAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                const isFuture = startsAt > new Date();
                const statusLabel = slot.logged ? 'Đã ghi' : isFuture ? 'Sắp tới' : 'Chưa ghi';
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
