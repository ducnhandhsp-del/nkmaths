/**
 * OperationsTab.tsx
 * Module Van hanh: Lich day, Buoi hoc, Chuyen can.
 * Chi chuan hoa UI/render, giu nguyen handler va logic nghiep vu hien co.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarX, CheckCircle, Edit3, Eye, Phone, Plus } from 'lucide-react';
import { getLessonOffReason, isLessonOffLog, normalizeCaDayLabel, normalizeScheduleCaText, parseCaDayToHours, parseDMY } from './helpers';
import { attendanceStudentId, calcStudentAbsenceStreak, getAttendanceRisk, normalizeAttendanceStatus as normalizeAttendanceStatusCore } from './measures';
import { Button, Pager, Select } from './dsComponents';
import { ActionableKpi, ActionableKpiGrid, DataTable, DateText, EmptyState, MobileCompactCard, PageToolbar, StatusBadge, ToolbarTabs } from './uiSystem';
import FilterMenu from './FilterMenu';
import type { Student, TeachingLog, LeaveRequest, OperationsSub } from './types';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_FULL: Record<string, string> = {
  T2: 'Thứ 2',
  T3: 'Thứ 3',
  T4: 'Thứ 4',
  T5: 'Thứ 5',
  T6: 'Thứ 6',
  T7: 'Thứ 7',
  CN: 'Chủ nhật',
};
const CA_SLOTS = ['7h30', '9h15', '14h', '15h30', '17h30', '19h30'];
const CA_MINS = [7 * 60 + 30, 9 * 60 + 15, 14 * 60, 15 * 60 + 30, 17 * 60 + 30, 19 * 60 + 30];

type ScheduleStatus = 'future' | 'inProgress' | 'logged' | 'pending' | 'cancelled';

interface ScheduledSlot {
  date: Date;
  isoDate: string;
  classId: string;
  className: string;
  caDay: string;
  caIdx: number;
  teacher: string;
  facility: string;
  status?: string;
}

interface ScheduleRow extends Record<string, unknown> {
  id: string;
  slot: ScheduledSlot;
  tlog?: TeachingLog;
  status: ScheduleStatus;
}

interface AttendanceRow extends Record<string, unknown> {
  id: string;
  name: string;
  classId: string;
  grade: string;
  parentPhone: string;
  absent: number;
  excused: number;
  present: number;
  streak: number;
}

interface Props {
  sub: OperationsSub;
  setSub: (sub: OperationsSub) => void;
  filtD: TeachingLog[];
  pgD: number;
  setPgD: (p: number) => void;
  qD: string;
  setQD: (v: string) => void;
  dCls: string;
  setDCls: (v: string) => void;
  uClasses: Record<string, string>[];
  IPP: number;
  students: Student[];
  tlogs: TeachingLog[];
  leaveRequests: LeaveRequest[];
  onViewDiary: (log: TeachingLog) => void;
  onEditDiary: (log: TeachingLog) => void;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
  onMarkLessonOff: (classId: string, date: string, caDay: string, reason: string, teacherName?: string) => Promise<void>;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

type LessonOffDraft = {
  row: ScheduleRow;
  reason: string;
};

const norm = (raw: unknown) =>
  String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

function readFirst(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
  }
  return '';
}

function getClassId(c: Record<string, any>) {
  return readFirst(c, ['Mã Lớp', 'MaLop', 'Ma Lop', 'classId', 'id']);
}

function getClassName(c: Record<string, any>) {
  return getClassId(c);
}

function getTeacher(c: Record<string, any>) {
  return readFirst(c, ['Giáo viên', 'GiaoVien', 'Giao Vien', 'teacherName', 'teacher']) || '—';
}

function getFacility(c: Record<string, any>) {
  return readFirst(c, ['Cơ sở', 'CoSo', 'Co So', 'branch', 'room']) || '—';
}

function getClassSchedules(c: Record<string, any>) {
  const raw = [
    readFirst(c, ['Buổi 1', 'Buoi1', 'Buoi 1']),
    readFirst(c, ['Buổi 2', 'Buoi2', 'Buoi 2']),
    readFirst(c, ['Buổi 3', 'Buoi3', 'Buoi 3']),
  ];
  return raw.filter(Boolean);
}

function normalizeScheduleText(v: string) {
  return normalizeScheduleCaText(v);
}

function parseBuoi(v: string) {
  if (!v) return null;
  const text = normalizeScheduleText(v);
  const dayMatch = text.match(/^(T[2-7]|CN)\b/i);
  if (!dayMatch) return null;
  const day = dayMatch[1].toUpperCase();
  if (!DAYS.includes(day)) return null;
  const timeText = text.slice(dayMatch[0].length).replace(/^[:\-–—.\s]+/, '').trim();
  const hourMatch = timeText.match(/(\d{1,2})\s*[h:]/i);
  if (!hourMatch) return null;
  const hour = parseInt(hourMatch[1], 10);
  const minuteMatch = timeText.match(/[h:]\s*(\d{1,2})/i);
  const minute = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  const total = hour * 60 + minute;
  let best = 0;
  let bestDiff = Infinity;
  CA_MINS.forEach((caMinute, index) => {
    const diff = Math.abs(total - caMinute);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = index;
    }
  });
  return { day, caIdx: best };
}

function monthKey(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function addMonthsToKey(key: string, delta: number) {
  const [m, y] = key.split('/').map(Number);
  const d = new Date(y || new Date().getFullYear(), (m || new Date().getMonth() + 1) - 1 + delta, 1);
  return monthKey(d);
}

function getMonthDates(key: string): Date[] {
  const [m, y] = key.split('/').map(Number);
  const year = y || new Date().getFullYear();
  const month = (m || new Date().getMonth() + 1) - 1;
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => new Date(year, month, i + 1));
}

function inMonthKey(raw: string, key: string) {
  const ts = parseDMY(raw || '');
  if (!ts) return false;
  return monthKey(new Date(ts)) === key;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getSlotStart(slot: ScheduledSlot) {
  const mins = CA_MINS[slot.caIdx] ?? 0;
  const startsAt = new Date(slot.date);
  startsAt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return startsAt;
}

function getScheduleStatus(slot: ScheduledSlot, tlog: TeachingLog | undefined, now: Date): ScheduleStatus {
  const rawStatus = norm(slot.status);
  if (rawStatus.includes('huy') || rawStatus.includes('cancel')) return 'cancelled';
  if (tlog) return 'logged';
  const startsAt = getSlotStart(slot);
  const endsAt = new Date(startsAt);
  endsAt.setMinutes(endsAt.getMinutes() + 120);
  if (now >= startsAt && now <= endsAt) return 'inProgress';
  return startsAt > now ? 'future' : 'pending';
}

function findMatchingTlog(slot: ScheduledSlot, tlogs: TeachingLog[]): TeachingLog | undefined {
  return tlogs.find(log => {
    if (log.classId !== slot.classId) return false;
    const raw = log.rawDate || log.date || '';
    let logDate: Date | null = null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/').map(Number);
      logDate = new Date(y, m - 1, d);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
      logDate = new Date(y, m - 1, d);
    } else {
      const ts = parseDMY(raw);
      if (ts) logDate = new Date(ts);
    }
    if (!logDate || !sameDay(logDate, slot.date)) return false;
    if (log.caDay && slot.caDay && normalizeCaDayLabel(log.caDay) !== normalizeCaDayLabel(slot.caDay)) return false;
    return true;
  });
}

function scheduleStatusLabel(status: ScheduleStatus) {
  if (status === 'logged') return 'Đã ghi';
  if (status === 'pending') return 'Có thể ghi';
  if (status === 'inProgress') return 'Có thể ghi';
  if (status === 'cancelled') return 'Đã hủy';
  return 'Chưa tới giờ';
}

function scheduleStatusTone(status: ScheduleStatus): 'success' | 'warning' | 'info' | 'neutral' {
  if (status === 'logged') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'inProgress') return 'info';
  return 'neutral';
}

function ScheduleBadge({ status, log }: { status: ScheduleStatus; log?: TeachingLog }) {
  if (log && isLessonOffLog(log)) {
    return (
      <StatusBadge
        domain="lesson"
        status="lesson-off"
        label="Đã nghỉ"
        tone="neutral"
        dot={false}
      />
    );
  }
  return (
    <StatusBadge
      domain="lesson"
      status={status}
      label={scheduleStatusLabel(status)}
      tone={scheduleStatusTone(status)}
      dot={false}
    />
  );
}

function getAttendanceStatus(a: any) {
  return a.trangThai || a['Trạng thái'] || a.TrangThai || '';
}

function normalizeAttendanceStatus(raw: string) {
  return normalizeAttendanceStatusCore(raw);
}

const attendanceIdOf = (a: any) => attendanceStudentId(a);

function lessonAttendanceSummary(log: TeachingLog) {
  if (isLessonOffLog(log)) return { present: 0, absent: 0, excused: 0, total: 0 };
  const present = Number(log.present || 0);
  const absent = Number(log.absent || 0);
  const excused = Number(log.excused || 0);
  return { present, absent, excused, total: present + absent + excused };
}

function lessonAttendanceLabel(log: TeachingLog) {
  if (isLessonOffLog(log)) return 'Lớp nghỉ';
  const a = lessonAttendanceSummary(log);
  return a.total > 0 ? `${a.present}/${a.total}` : 'Chưa điểm danh';
}

function lessonStatus(log: TeachingLog): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  if (isLessonOffLog(log)) return { label: 'Lớp nghỉ', tone: 'neutral' };
  return lessonAttendanceSummary(log).total > 0
    ? { label: 'Đã điểm danh', tone: 'success' }
    : { label: 'Chưa điểm danh', tone: 'warning' };
}

function fmtWeekDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lessonOffReasonLabel(log: TeachingLog) {
  return getLessonOffReason(log) || 'Chưa ghi lý do nghỉ';
}

function lessonTypeLabel(log: TeachingLog) {
  const type = String(log.lessonType || log.LoaiBuoiHoc || 'regular').trim().toLowerCase();
  if (type === 'extra' || type === 'review' || type === 'on_tap' || type === 'on tap' || type === 'them_buoi' || type === 'them buoi') return 'Tăng cường';
  return '';
}


function attendanceWarning(row: AttendanceRow): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  return getAttendanceRisk({ absent: row.absent, pct: attendanceRate(row), streak: row.streak });
}

function attendanceRate(row: AttendanceRow) {
  const total = row.present + row.absent + row.excused;
  if (!total) return null;
  return Math.round((row.present / total) * 100);
}

export default function OperationsTab({
  sub,
  setSub,
  pgD,
  setPgD,
  dCls,
  setDCls,
  uClasses,
  IPP,
  students,
  tlogs,
  onViewDiary,
  onAddDiary,
  onMarkLessonOff,
}: Props) {
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceMonth, setAttendanceMonth] = useState(() => monthKey(new Date()));
  const [scheduleMonth, setScheduleMonth] = useState(() => monthKey(new Date()));
  const [lessonMonth, setLessonMonth] = useState(() => monthKey(new Date()));
  const [scheduleClass, setScheduleClass] = useState('');
  const [schedulePage, setSchedulePage] = useState(1);
  const [lessonFocus, setLessonFocus] = useState<'all' | 'noAttendance'>('all');
  const [attendanceFocus, setAttendanceFocus] = useState<'all' | 'warning'>('all');
  const [lessonOffDraft, setLessonOffDraft] = useState<LessonOffDraft | null>(null);
  const [lessonOffSaving, setLessonOffSaving] = useState(false);
  const scheduleListRef = useRef<HTMLDivElement>(null);
  const lessonListRef = useRef<HTMLDivElement>(null);
  const attendanceListRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const scheduleDates = useMemo(() => getMonthDates(scheduleMonth), [scheduleMonth]);
  const classOptions = useMemo(() => {
    const seen = new Set<string>();
    const items = uClasses
      .map(c => getClassId(c))
      .filter(Boolean)
      .filter(id => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(id => ({ value: id, label: id }));
    return [{ value: '', label: 'Lớp' }, ...items];
  }, [uClasses]);
  const lessonMonthOptions = useMemo(() => {
    const keys = new Set<string>([monthKey(new Date())]);
    tlogs.forEach(log => {
      const ts = parseDMY(log.rawDate || log.date || '');
      if (ts) keys.add(monthKey(new Date(ts)));
    });
    return [...keys]
      .sort((a, b) => {
        const [am, ay] = a.split('/').map(Number);
        const [bm, by] = b.split('/').map(Number);
        return (by || 0) - (ay || 0) || (bm || 0) - (am || 0);
      })
      .map(value => {
        const [m, y] = value.split('/');
        return { value, label: `T${Number(m)}/${y}` };
      });
  }, [tlogs]);

  const filteredLessons = useMemo(() => [...tlogs]
    .filter(log => inMonthKey(log.rawDate || log.date || '', lessonMonth))
    .filter(log => !dCls || log.classId === dCls)
    .filter(log => lessonFocus !== 'noAttendance' || (!isLessonOffLog(log) && lessonAttendanceSummary(log).total === 0))
    .sort((a, b) => {
      const byDate = parseDMY(b.rawDate || b.date || '') - parseDMY(a.rawDate || a.date || '');
      if (byDate !== 0) return byDate;
      const byTime = parseCaDayToHours(b.caDay || '') - parseCaDayToHours(a.caDay || '');
      if (byTime !== 0) return byTime;
      return String(a.classId || '').localeCompare(String(b.classId || ''), 'vi');
    }),
  [dCls, lessonFocus, lessonMonth, tlogs]);

  const pagedLessons = useMemo(() => filteredLessons.slice((pgD - 1) * IPP, pgD * IPP), [IPP, filteredLessons, pgD]);

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    const now = new Date();
    const slots: ScheduledSlot[] = [];
    scheduleDates.forEach(date => {
      const dayCode = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
      uClasses.forEach(c => {
        const classId = getClassId(c);
        if (!classId) return;
        const teacher = getTeacher(c);
        if (scheduleClass && classId !== scheduleClass) return;
        getClassSchedules(c).forEach(schedule => {
          const parsed = parseBuoi(schedule);
          if (!parsed || parsed.day !== dayCode) return;
          slots.push({
            date,
            isoDate: toISO(date),
            classId,
            className: getClassName(c),
            caDay: CA_SLOTS[parsed.caIdx],
            caIdx: parsed.caIdx,
            teacher,
            facility: getFacility(c),
            status: readFirst(c, ['status', 'TrangThai', 'Trạng thái']),
          });
        });
      });
    });
    return slots
      .map(slot => {
        const tlog = findMatchingTlog(slot, tlogs);
        return {
          id: `${slot.classId}-${slot.isoDate}-${slot.caDay}`,
          slot,
          tlog,
          status: getScheduleStatus(slot, tlog, now),
        };
      })
      .sort((a, b) => a.slot.date.getTime() - b.slot.date.getTime() || a.slot.caIdx - b.slot.caIdx || a.slot.classId.localeCompare(b.slot.classId, 'vi'));
  }, [scheduleClass, scheduleDates, tlogs, uClasses]);

  const actionableScheduleRows = useMemo(() => {
    const nowTs = Date.now();
    return scheduleRows
      .filter(row => row.status === 'pending' || row.status === 'inProgress')
      .sort((a, b) => Math.abs(getSlotStart(a.slot).getTime() - nowTs) - Math.abs(getSlotStart(b.slot).getTime() - nowTs))
      .slice(0, 6);
  }, [scheduleRows]);

  const displayScheduleRows = useMemo(() => {
    const nowTs = Date.now();
    const rank = (row: ScheduleRow) => {
      if (row.status === 'inProgress') return 0;
      if (row.status === 'pending') return 1;
      if (row.status === 'future') return 2;
      if (row.status === 'logged') return 3;
      return 4;
    };
    return [...scheduleRows].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      const ta = getSlotStart(a.slot).getTime();
      const tb = getSlotStart(b.slot).getTime();
      if (ra <= 1) return Math.abs(ta - nowTs) - Math.abs(tb - nowTs);
      if (ra === 3) return tb - ta;
      return ta - tb;
    });
  }, [scheduleRows]);

  useEffect(() => {
    setSchedulePage(1);
  }, [scheduleMonth, scheduleClass]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(displayScheduleRows.length / IPP));
    if (schedulePage > maxPage) setSchedulePage(maxPage);
  }, [IPP, displayScheduleRows.length, schedulePage]);

  const pagedScheduleRows = useMemo(() => {
    const start = (schedulePage - 1) * IPP;
    return displayScheduleRows.slice(start, start + IPP);
  }, [IPP, displayScheduleRows, schedulePage]);

  const attendanceStats = useMemo<AttendanceRow[]>(() => {
    const map = new Map<string, AttendanceRow>();
    students
      .filter(s => s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === ''))
      .forEach(s => map.set(s.id, {
        id: s.id,
        name: s.name,
        classId: s.classId,
        grade: s.grade,
        parentPhone: s.parentPhone || '',
        absent: 0,
        excused: 0,
        present: 0,
        streak: 0,
      }));

    tlogs.forEach(log => {
      if (isLessonOffLog(log)) return;
      if (!inMonthKey(log.rawDate || log.date || '', attendanceMonth)) return;
      (log.attendanceList || []).forEach((a: any) => {
      const row = map.get(attendanceIdOf(a));
      if (!row) return;
      const status = normalizeAttendanceStatus(getAttendanceStatus(a));
      if (status === 'absent') row.absent++;
      else if (status === 'excused') row.excused++;
      else row.present++;
      });
    });

    const [m, y] = attendanceMonth.split('/').map(Number);
    students.forEach(student => {
      const row = map.get(student.id);
      if (!row) return;
      row.streak = calcStudentAbsenceStreak(tlogs, student.id, student.classId, { m, y });
    });
    return [...map.values()];
  }, [attendanceMonth, students, tlogs]);

  const attendanceClassOptions = useMemo(() => {
    const items = [...new Set(attendanceStats.map(r => r.classId).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(value => ({ value, label: value }));
    return [{ value: '', label: 'Lớp' }, ...items];
  }, [attendanceStats]);

  const filteredAttendance = useMemo(() => {
    return attendanceStats
      .filter(r => !attendanceClass || r.classId === attendanceClass)
      .filter(r => attendanceFocus !== 'warning' || ['warning', 'danger'].includes(attendanceWarning(r).tone))
      .sort((a, b) => {
        return b.absent - a.absent || b.streak - a.streak;
      });
  }, [attendanceClass, attendanceFocus, attendanceStats]);

  const openScheduleRow = (row: ScheduleRow) => {
    if (row.status === 'future' || row.status === 'cancelled') return;
    if (row.tlog) onViewDiary(row.tlog);
    else onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay);
  };

  const markScheduleOff = useCallback((row: ScheduleRow) => {
    if (row.tlog || row.status === 'cancelled') return;
    setLessonOffDraft({ row, reason: '' });
  }, []);

  const closeLessonOffModal = () => {
    if (lessonOffSaving) return;
    setLessonOffDraft(null);
  };

  const submitLessonOff = async () => {
    if (!lessonOffDraft || lessonOffSaving) return;
    const { row, reason } = lessonOffDraft;
    setLessonOffSaving(true);
    try {
      await onMarkLessonOff(
        row.slot.classId,
        row.slot.isoDate,
        row.slot.caDay,
        reason,
        row.slot.teacher && row.slot.teacher !== '—' ? row.slot.teacher : '',
      );
      setLessonOffDraft(null);
    } finally {
      setLessonOffSaving(false);
    }
  };

  const scheduleColumns = useMemo(() => [
    {
      key: 'date',
      label: 'Ngày',
      width: '10%',
      render: (_: unknown, row: ScheduleRow) => {
        return <DateText value={row.slot.isoDate} />;
      },
    },
    {
      key: 'weekday',
      label: 'Thứ',
      align: 'center' as const,
      width: '8%',
      render: (_: unknown, row: ScheduleRow) => {
        const dayCode = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][row.slot.date.getDay()];
        return <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{DAY_FULL[dayCode]}</span>;
      },
    },
    {
      key: 'time',
      label: 'Giờ',
      align: 'center' as const,
      width: '8%',
      render: (_: unknown, row: ScheduleRow) => (
        <span style={{ fontSize: 13, fontWeight: 900, color: row.slot.caDay ? '#b45309' : '#94a3b8', whiteSpace: 'nowrap' }}>
          {row.slot.caDay || '—'}
        </span>
      ),
    },
    {
      key: 'class',
      label: 'Lớp',
      align: 'center' as const,
      width: '8%',
      render: (_: unknown, row: ScheduleRow) => (
        <StatusBadge domain="general" status="class" label={row.slot.classId || '—'} tone="violet" dot={false} />
      ),
    },
    { key: 'status', label: 'Trạng thái', align: 'center' as const, width: '13%', render: (_: unknown, row: ScheduleRow) => <ScheduleBadge status={row.status} log={row.tlog} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '14%',
      render: (_: unknown, row: ScheduleRow) => {
        const locked = row.status === 'future' || row.status === 'cancelled';
        return (
          <div onClick={event => event.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {row.tlog ? (
              <Button intent="primary" variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => onViewDiary(row.tlog!)}>Xem</Button>
            ) : row.status === 'cancelled' ? (
              <span title="Buổi học đã hủy nên không thể ghi buổi." style={{ minHeight: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: 999, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
                Đã hủy
              </span>
            ) : (
              <>
                {!locked && (
                  <Button intent="success" variant="outline" size="sm" icon={<Plus size={13} />} onClick={() => onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay)}>
                    Ghi buổi
                  </Button>
                )}
                <Button intent="warning" variant="outline" size="sm" icon={<CalendarX size={13} />} onClick={() => markScheduleOff(row)}>
                  Nghỉ
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], [markScheduleOff, onAddDiary, onViewDiary]);

  const lessonColumns = useMemo(() => [
    { key: 'date', label: 'Ngày học', width: '11%', render: (_: unknown, log: TeachingLog) => <DateText value={log.date} /> },
    { key: 'classId', label: 'Lớp', align: 'center' as const, width: '7%', render: (_: unknown, log: TeachingLog) => <StatusBadge domain="general" status="class" label={log.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'caDay',
      label: 'Giờ',
      align: 'center' as const,
      width: '7%',
      render: (_: unknown, log: TeachingLog) => (
        <span style={{ fontSize: 13, fontWeight: 900, color: log.caDay ? '#b45309' : '#94a3b8', whiteSpace: 'nowrap' }}>
          {log.caDay || '—'}
        </span>
      ),
    },
    {
      key: 'content',
      label: 'Nội dung',
      width: '42%',
      render: (_: unknown, log: TeachingLog) => {
        const isOff = isLessonOffLog(log);
        const typeLabel = lessonTypeLabel(log);
        return (
          <div style={{ minWidth: 0 }}>
            {typeLabel && (
              <span style={{ display: 'inline-flex', marginBottom: 3 }}>
                <StatusBadge domain="general" status="lesson-type" label={typeLabel} tone="info" dot={false} />
              </span>
            )}
            <span style={{ display: 'block', maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: log.content ? '#0f172a' : '#94a3b8' }}>
              {log.content || 'Chưa nhập nội dung'}
            </span>
            {isOff && (
              <span style={{ display: 'block', maxWidth: 520, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 800, color: '#64748b' }}>
                Lý do: {lessonOffReasonLabel(log)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'homework',
      label: 'Bài tập rèn luyện',
      width: '22%',
      render: (_: unknown, log: TeachingLog) => {
        const homework = String(log.homework || '').trim();
        const hasHomework = homework && homework !== '---';
        return (
          <span style={{ display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: hasHomework ? '#475569' : '#94a3b8' }}>
            {hasHomework ? homework : '—'}
          </span>
        );
      },
    },
    {
      key: 'attendance',
      label: 'Điểm danh',
      width: '11%',
      render: (_: unknown, log: TeachingLog) => {
        const label = lessonAttendanceLabel(log);
        return label !== 'Chưa điểm danh' ? (
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 900 }}>
            {label}
          </span>
        ) : <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800 }}>Chưa điểm danh</span>;
      },
    },
  ], []);

  const attendanceColumns = useMemo(() => [
    {
      key: 'studentId',
      label: 'Mã HS',
      width: '10%',
      render: (_: unknown, row: AttendanceRow) => (
        <span style={{ display: 'block', fontSize: 12, fontWeight: 900, color: row.id ? '#4f46e5' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.id || '—'}
        </span>
      ),
    },
    {
      key: 'studentName',
      label: 'Học sinh',
      width: '18%',
      render: (_: unknown, row: AttendanceRow) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</p>
        </div>
      ),
    },
    { key: 'classId', label: 'Lớp', align: 'center' as const, width: '12%', render: (_: unknown, row: AttendanceRow) => <StatusBadge domain="general" status="class" label={row.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'stats',
      label: 'Vắng',
      align: 'center' as const,
      width: '10%',
      render: (_: unknown, row: AttendanceRow) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 46, minHeight: 24, borderRadius: 999, background: row.absent ? '#fff1f2' : '#ecfdf5', border: `1px solid ${row.absent ? '#fecdd3' : '#bbf7d0'}`, color: row.absent ? '#e11d48' : '#059669', fontSize: 12, fontWeight: 950, whiteSpace: 'nowrap' }}>
          {row.absent}
        </span>
      ),
    },
    {
      key: 'rate',
      label: 'Tỷ lệ',
      align: 'center' as const,
      width: '10%',
      render: (_: unknown, row: AttendanceRow) => {
        const rate = attendanceRate(row);
        return <span style={{ fontSize: 13, fontWeight: 900, color: rate === null ? '#94a3b8' : rate >= 80 ? '#059669' : rate >= 60 ? '#d97706' : '#e11d48' }}>{rate === null ? '—' : `${rate}%`}</span>;
      },
    },
    {
      key: 'warning',
      label: 'Cảnh báo',
      align: 'center' as const,
      width: '14%',
      render: (_: unknown, row: AttendanceRow) => {
        const meta = attendanceWarning(row);
        return <StatusBadge domain="attendance" status={meta.label} label={meta.label} tone={meta.tone} />;
      },
    },
    {
      key: 'contact',
      label: 'Liên hệ',
      align: 'center' as const,
      width: '10%',
      render: (_: unknown, row: AttendanceRow) => {
        const phone = String(row.parentPhone || '').replace(/\D/g, '');
        return phone.length >= 9 ? (
          <a href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} style={{ color: '#0068FF', fontSize: 12, fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Phone size={13} /> Zalo
          </a>
        ) : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
      },
    },
  ], []);

  const recentLessons = useMemo(() => [...tlogs]
    .filter(log => !scheduleClass || log.classId === scheduleClass)
    .sort((a, b) => {
      const byDate = parseDMY(b.rawDate || b.date) - parseDMY(a.rawDate || a.date);
      if (byDate !== 0) return byDate;
      return parseCaDayToHours(b.caDay || '') - parseCaDayToHours(a.caDay || '');
    })
    .slice(0, 8), [scheduleClass, tlogs]);

  const warningAttendanceRows = useMemo(() => attendanceStats
    .filter(row => !scheduleClass || row.classId === scheduleClass)
    .map(row => ({ ...row, warning: attendanceWarning(row) }))
    .filter(row => row.warning.tone === 'danger' || row.warning.tone === 'warning')
    .sort((a, b) => b.absent - a.absent || b.streak - a.streak || a.name.localeCompare(b.name, 'vi'))
    .slice(0, 10), [attendanceStats, scheduleClass]);

  const weeklyLoggedCount = scheduleRows.filter(row => row.status === 'logged' && !isLessonOffLog(row.tlog)).length;
  const weeklyNoAttendanceCount = scheduleRows.filter(row => row.tlog && !isLessonOffLog(row.tlog) && lessonAttendanceSummary(row.tlog).total === 0).length;

  const recentLessonColumns = useMemo(() => [
    { key: 'date', label: 'Ngày học', width: '14%', render: (_: unknown, log: TeachingLog) => <DateText value={log.date} /> },
    { key: 'classId', label: 'Lớp', width: '16%', render: (_: unknown, log: TeachingLog) => <StatusBadge domain="general" status="class" label={log.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'content',
      label: 'Nội dung',
      width: '28%',
      render: (_: unknown, log: TeachingLog) => {
        const label = isLessonOffLog(log)
          ? `${log.content || 'Lớp nghỉ'} · ${lessonOffReasonLabel(log)}`
          : (log.content || 'Chưa nhập nội dung');
        return (
          <span style={{ display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: log.content ? '#0f172a' : '#94a3b8' }}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'attendance',
      label: 'Điểm danh',
      width: '20%',
      render: (_: unknown, log: TeachingLog) => {
        const label = lessonAttendanceLabel(log);
        return label !== 'Chưa điểm danh' ? (
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 900 }}>
            {label}
          </span>
        ) : <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800 }}>Chưa điểm danh</span>;
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center' as const,
      width: '12%',
      render: (_: unknown, log: TeachingLog) => {
        const st = lessonStatus(log);
        return <StatusBadge domain="lesson" status={st.label} label={st.label} tone={st.tone} />;
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '10%',
      render: (_: unknown, log: TeachingLog) => (
        <div onClick={event => event.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Button intent="primary" variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => onViewDiary(log)}>Xem</Button>
        </div>
      ),
    },
  ], [onViewDiary]);

  const warningColumns = useMemo(() => [
    {
      key: 'student',
      label: 'Học sinh',
      width: '30%',
      render: (_: unknown, row: AttendanceRow & { warning: ReturnType<typeof attendanceWarning> }) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{row.id || '—'}</p>
        </div>
      ),
    },
    { key: 'classId', label: 'Lớp', align: 'center' as const, width: '18%', render: (_: unknown, row: AttendanceRow & { warning: ReturnType<typeof attendanceWarning> }) => <StatusBadge domain="general" status="class" label={row.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'issue',
      label: 'Tình trạng',
      width: '32%',
      render: (_: unknown, row: AttendanceRow & { warning: ReturnType<typeof attendanceWarning> }) => (
        <div>
          <StatusBadge domain="attendance" status={row.warning.label} label={row.warning.label} tone={row.warning.tone} />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', fontWeight: 800 }}>
            Vắng {row.absent} buổi{row.streak ? ` · liên tiếp ${row.streak}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Liên hệ',
      align: 'center' as const,
      width: '20%',
      render: (_: unknown, row: AttendanceRow & { warning: ReturnType<typeof attendanceWarning> }) => {
        const phone = String(row.parentPhone || '').replace(/\D/g, '');
        return phone.length >= 9 ? (
          <a href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} style={{ color: '#0068FF', fontSize: 12, fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Phone size={13} /> Zalo PH
          </a>
        ) : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
      },
    },
  ], []);

  const title = 'Vận hành';
  const opsTabs: { id: OperationsSub; label: string }[] = [
    { id: 'schedule', label: 'Lịch dạy' },
    { id: 'lessons', label: 'Buổi học' },
    { id: 'attendance', label: 'Chuyên cần' },
  ];
  const currentMonth = monthKey(new Date());
  const [scheduleMonthNumber, scheduleYear] = scheduleMonth.split('/');
  const scheduleMonthLabel = `T${Number(scheduleMonthNumber)}/${scheduleYear}`;

  const focusScheduleList = () => {
    setSub('schedule');
    scrollTo(scheduleListRef);
  };
  const focusLoggedLessons = () => {
    setSub('lessons');
    setLessonFocus('all');
    setLessonMonth(scheduleMonth);
    setDCls(scheduleClass);
    setPgD(1);
    scrollTo(lessonListRef);
  };
  const focusNoAttendanceLessons = () => {
    setSub('lessons');
    setLessonFocus('noAttendance');
    setLessonMonth(scheduleMonth);
    setDCls(scheduleClass);
    setPgD(1);
    scrollTo(lessonListRef);
  };
  const focusAttendanceWarnings = () => {
    setSub('attendance');
    setAttendanceFocus('warning');
    setAttendanceMonth(scheduleMonth);
    setAttendanceClass(scheduleClass);
    scrollTo(attendanceListRef);
  };

  const toolbarFilters = (
    <div className="ops-toolbar-filters">
      {sub === 'schedule' && (
        <>
          <div className="ops-period-control">
            <button type="button" className="ops-period-button" onClick={() => setScheduleMonth(value => addMonthsToKey(value, -1))}>‹</button>
            <span className="ops-period-label">{scheduleMonthLabel}</span>
            <button type="button" className="ops-period-button" onClick={() => setScheduleMonth(value => addMonthsToKey(value, 1))}>›</button>
          </div>
          {scheduleMonth !== currentMonth && (
            <div className="ops-desktop-only">
              <Button size="sm" intent="neutral" variant="outline" onClick={() => setScheduleMonth(currentMonth)}>Tháng này</Button>
            </div>
          )}
          <div className="ops-desktop-only">
            <Select value={scheduleClass} onChange={setScheduleClass} options={classOptions} size="md" style={{ width: 108, minWidth: 96 }} />
          </div>
          <FilterMenu label="Lọc" activeCount={scheduleClass ? 1 : 0} className="ops-mobile-only">
            <Select value={scheduleClass} onChange={setScheduleClass} options={classOptions} size="sm" />
          </FilterMenu>
        </>
      )}
      {sub === 'lessons' && (
        <>
          <Select
            value={lessonMonth}
            onChange={value => { setLessonMonth(value); setPgD(1); }}
            options={lessonMonthOptions}
            size="md"
            style={{ width: 108, minWidth: 96 }}
          />
          <div className="ops-desktop-only">
            <Select
              value={dCls}
              onChange={value => { setDCls(value); setPgD(1); }}
              options={classOptions}
              size="md"
              style={{ width: 108, minWidth: 96 }}
            />
          </div>
          <div className="ops-desktop-only">
            <Select
              value={lessonFocus}
              onChange={value => { setLessonFocus(value as typeof lessonFocus); setPgD(1); }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'noAttendance', label: 'Chưa điểm danh' },
              ]}
              size="md"
              style={{ width: 124, minWidth: 116 }}
            />
          </div>
          <FilterMenu label="Lọc" activeCount={(dCls ? 1 : 0) + (lessonFocus !== 'all' ? 1 : 0)} className="ops-mobile-only">
            <Select value={dCls} onChange={value => { setDCls(value); setPgD(1); }} options={classOptions} size="sm" />
            <Select
              value={lessonFocus}
              onChange={value => { setLessonFocus(value as typeof lessonFocus); setPgD(1); }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'noAttendance', label: 'Chưa điểm danh' },
              ]}
              size="sm"
            />
          </FilterMenu>
        </>
      )}
      {sub === 'attendance' && (
        <>
          <Select
            value={attendanceMonth}
            onChange={setAttendanceMonth}
            options={lessonMonthOptions}
            size="md"
            style={{ width: 108, minWidth: 96 }}
          />
          <div className="ops-desktop-only">
            <Select value={attendanceClass} onChange={setAttendanceClass} options={attendanceClassOptions} size="md" style={{ width: 108, minWidth: 96 }} />
          </div>
          <div className="ops-desktop-only">
            <Select
              value={attendanceFocus}
              onChange={value => setAttendanceFocus(value as typeof attendanceFocus)}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'warning', label: 'Cần theo dõi' },
              ]}
              size="md"
              style={{ width: 124, minWidth: 116 }}
            />
          </div>
          <FilterMenu label="Lọc" activeCount={(attendanceClass ? 1 : 0) + (attendanceFocus !== 'all' ? 1 : 0)} className="ops-mobile-only">
            <Select value={attendanceClass} onChange={setAttendanceClass} options={attendanceClassOptions} size="sm" />
            <Select
              value={attendanceFocus}
              onChange={value => setAttendanceFocus(value as typeof attendanceFocus)}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'warning', label: 'Cần theo dõi' },
              ]}
              size="sm"
            />
          </FilterMenu>
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        .ops-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .ops-mobile-only{display:none}
        .ops-period-control{display:flex;align-items:center;gap:4px;border:1px solid #e2e8f0;padding:3px 7px;border-radius:8px;background:white}
        .ops-period-button{width:28px;height:28px;border:0;background:transparent;cursor:pointer;border-radius:6px;color:#64748b;font-size:18px;line-height:1}
        .ops-period-button:hover{background:#f1f5f9;color:#0f172a}
        .ops-period-label{font-size:12px;font-weight:900;color:#0f172a;min-width:76px;text-align:center;white-space:nowrap}
        @media(max-width:767px){
          .ops-toolbar-filters{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
          .ops-period-control{justify-content:space-between}
          .ops-toolbar-filters > *{width:100%!important;min-width:0!important}
          .ops-desktop-only{display:none!important}
          .ops-mobile-only{display:block}
        }
      `}</style>
      <PageToolbar
        title={title}
        hideActionsOnMobile
        actions={(
          <Button intent="success" size="sm" icon={<Plus size={13} />} onClick={() => onAddDiary()}>
            Ghi buổi học
          </Button>
        )}
      >
        <ToolbarTabs
          tabs={opsTabs}
          active={sub}
          onChange={next => {
            if (next === 'lessons') setLessonFocus('all');
            if (next === 'attendance') setAttendanceFocus('all');
            setSub(next);
          }}
        />
        {toolbarFilters}
      </PageToolbar>

      {sub === 'schedule' && (
        <ActionableKpiGrid>
          <ActionableKpi icon={BookOpen} value={scheduleRows.length} label="Buổi trong tháng" sub={scheduleMonthLabel} tone="primary" onClick={focusScheduleList} actionLabel="Xem lịch" />
          <ActionableKpi icon={CheckCircle} value={weeklyLoggedCount} label="Đã ghi buổi" sub={`${weeklyLoggedCount}/${scheduleRows.length || 0} buổi`} tone="success" onClick={focusLoggedLessons} actionLabel="Mở buổi học" />
          <ActionableKpi icon={Edit3} value={weeklyNoAttendanceCount} label="Chưa điểm danh" sub="Buổi đã ghi nhưng chưa có điểm danh" tone={weeklyNoAttendanceCount ? 'warning' : 'neutral'} onClick={focusNoAttendanceLessons} actionLabel="Lọc buổi" />
          <ActionableKpi icon={AlertTriangle} value={warningAttendanceRows.length} label="Cảnh báo chuyên cần" sub={warningAttendanceRows.length ? 'Cần theo dõi' : 'Đang ổn'} tone={warningAttendanceRows.length ? 'danger' : 'success'} onClick={focusAttendanceWarnings} actionLabel="Xem cảnh báo" />
        </ActionableKpiGrid>
      )}

      {sub === 'schedule' && (
        <div ref={scheduleListRef}>
          <style>{`
            .ops-schedule-desktop{display:block}.ops-schedule-mobile{display:none}
            @media(max-width:767px){.ops-schedule-desktop{display:none!important}.ops-schedule-mobile{display:grid!important}}
            .ops-action-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;margin-bottom:10px}
            .ops-action-card{border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;text-align:left}
            .ops-action-card:hover{border-color:#a7f3d0;background:#f0fdf4}
            .ops-action-main{min-width:0}
            .ops-action-title{margin:0;font-size:13px;font-weight:950;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .ops-action-sub{margin:3px 0 0;font-size:11px;font-weight:800;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          `}</style>
          {actionableScheduleRows.length > 0 && (
            <div className="ops-action-strip" aria-label="Buổi chưa ghi gần nhất">
              {actionableScheduleRows.map(row => {
                const dayCode = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][row.slot.date.getDay()];
                return (
                  <div key={`action-${row.id}`} role="button" tabIndex={0} className="ops-action-card" onClick={() => openScheduleRow(row)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openScheduleRow(row); }}>
                    <span className="ops-action-main">
                      <p className="ops-action-title">{row.slot.classId} · {row.slot.caDay}</p>
                      <p className="ops-action-sub">{DAY_FULL[dayCode]} · {fmtWeekDate(row.slot.date)} · {scheduleStatusLabel(row.status)}</p>
                    </span>
                    <Button intent="success" variant="outline" size="sm" icon={<Plus size={13} />} onClick={event => { event.stopPropagation(); onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay); }}>
                      Ghi
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="ops-schedule-desktop">
            <DataTable
              columns={scheduleColumns}
              data={pagedScheduleRows}
              rowKey="id"
              emptyText="Không có lịch dạy trong tháng này"
              emptySub="Thử đổi tháng/năm hoặc lớp."
              onRowClick={openScheduleRow}
              scrollX={false}
              density="compact"
              footer={<Pager page={schedulePage} total={displayScheduleRows.length} perPage={IPP} setPage={setSchedulePage} showTotal />}
            />
          </div>
          <div className="ops-schedule-mobile" style={{ gap: 6, padding: 6 }}>
            {displayScheduleRows.length === 0 ? (
              <EmptyState text="Không có lịch dạy trong tháng này" sub="Thử đổi tháng/năm hoặc lớp." compact />
            ) : pagedScheduleRows.map(row => {
              const dayCode = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][row.slot.date.getDay()];
              const locked = row.status === 'future' || row.status === 'cancelled';
              return (
                <MobileCompactCard
                  key={row.id}
                  title={`${row.slot.caDay} · ${row.slot.classId}`}
                  subtitle={`${DAY_FULL[dayCode]} · ${fmtWeekDate(row.slot.date)}`}
                  badge={<ScheduleBadge status={row.status} log={row.tlog} />}
                  tone={scheduleStatusTone(row.status)}
                  onClick={() => openScheduleRow(row)}
                  meta={[
                    { key: 'teacher', label: row.slot.teacher || 'Chưa rõ GV', tone: row.slot.teacher && row.slot.teacher !== '—' ? 'neutral' as const : 'warning' as const },
                    { key: 'facility', label: row.slot.facility || 'Chưa rõ cơ sở', tone: row.slot.facility && row.slot.facility !== '—' ? 'info' as const : 'warning' as const },
                  ]}
                  actions={(
                    <div onClick={event => event.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                      {row.tlog ? (
                        <Button intent="primary" variant="outline" size="sm" onClick={() => onViewDiary(row.tlog!)}>Xem</Button>
                      ) : row.status === 'cancelled' ? (
                        <span title="Buổi học đã hủy nên không thể ghi buổi." style={{ minHeight: 34, display: 'inline-flex', alignItems: 'center', padding: '7px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 900, fontSize: 12 }}>
                          Không ghi
                        </span>
                      ) : (
                        <>
                          {!locked && (
                            <Button intent="success" variant="outline" size="sm" onClick={() => onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay)}>
                              Ghi buổi
                            </Button>
                          )}
                          <Button intent="warning" variant="outline" size="sm" onClick={() => markScheduleOff(row)}>
                            Nghỉ
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                />
              );
            })}
            {displayScheduleRows.length > IPP && (
              <Pager page={schedulePage} total={displayScheduleRows.length} perPage={IPP} setPage={setSchedulePage} showTotal />
            )}
          </div>
        </div>
      )}

      {sub === 'lessons' && (
        <div ref={lessonListRef}>
          <style>{`
            .ops-lessons-desktop{display:block}.ops-lessons-mobile{display:none}
            @media(max-width:767px){.ops-lessons-desktop{display:none!important}.ops-lessons-mobile{display:grid!important}}
          `}</style>
          {lessonFocus === 'noAttendance' && (
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid #fde68a', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#92400e' }}>Đang lọc buổi đã ghi nhưng chưa điểm danh</span>
              <Button intent="warning" variant="outline" size="sm" onClick={() => setLessonFocus('all')}>Bỏ lọc</Button>
            </div>
          )}
          <div className="ops-lessons-desktop">
            <DataTable
              columns={lessonColumns}
              data={pagedLessons}
              rowKey={(log) => `${log.classId}-${log.rawDate || log.date}-${log.caDay}`}
              emptyText="Chưa có buổi học phù hợp"
              emptySub="Thử đổi tháng hoặc lớp."
              onRowClick={onViewDiary}
              scrollX={false}
              density="compact"
              footer={<Pager page={pgD} total={filteredLessons.length} perPage={IPP} setPage={setPgD} showTotal />}
            />
          </div>
          <div className="ops-lessons-mobile" style={{ gap: 6, padding: 6 }}>
            {pagedLessons.length === 0 ? (
              <EmptyState text="Chưa có buổi học phù hợp" sub="Thử đổi tháng hoặc lớp." compact />
            ) : pagedLessons.map(log => {
              const st = lessonStatus(log);
              const homework = String(log.homework || '').trim();
              const isOff = isLessonOffLog(log);
              const typeLabel = lessonTypeLabel(log);
              return (
                <MobileCompactCard
                  key={`${log.classId}-${log.rawDate || log.date}-${log.caDay}`}
                  title={`${log.classId || '—'} · ${log.caDay || '—'}`}
                  subtitle={<DateText value={log.date} />}
                  value={lessonAttendanceLabel(log)}
                  badge={<StatusBadge domain="lesson" status={st.label} label={st.label} tone={st.tone} />}
                  tone={st.tone}
                  onClick={() => onViewDiary(log)}
                  meta={[
                    ...(typeLabel ? [{ key: 'lessonType', label: typeLabel, tone: 'info' as const }] : []),
                    { key: 'content', label: log.content || 'Chưa nhập nội dung', tone: log.content ? 'neutral' as const : 'warning' as const },
                    isOff
                      ? { key: 'reason', label: `Lý do: ${lessonOffReasonLabel(log)}`, tone: 'neutral' as const }
                      : { key: 'homework', label: homework && homework !== '---' ? homework : 'Chưa có BTVN', tone: homework && homework !== '---' ? 'info' as const : 'neutral' as const },
                  ]}
                />
              );
            })}
            <Pager page={pgD} total={filteredLessons.length} perPage={IPP} setPage={setPgD} showTotal />
          </div>
        </div>
      )}

      {sub === 'attendance' && (
        <div ref={attendanceListRef}>
          <style>{`
            .ops-attendance-desktop{display:block}.ops-attendance-mobile{display:none}
            @media(max-width:767px){.ops-attendance-desktop{display:none!important}.ops-attendance-mobile{display:grid!important}}
          `}</style>
          {attendanceFocus === 'warning' && (
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#be123c' }}>Đang lọc học sinh có cảnh báo chuyên cần</span>
              <Button intent="danger" variant="outline" size="sm" onClick={() => setAttendanceFocus('all')}>Bỏ lọc</Button>
            </div>
          )}
          <div className="ops-attendance-desktop">
            <DataTable
              columns={attendanceColumns}
              data={filteredAttendance}
              rowKey="id"
              emptyText="Chưa có dữ liệu chuyên cần phù hợp"
              emptySub="Thử đổi tháng hoặc lớp."
              scrollX={false}
              density="compact"
            />
          </div>
          <div className="ops-attendance-mobile" style={{ gap: 6, padding: 6 }}>
            {filteredAttendance.length === 0 ? (
              <EmptyState text="Chưa có dữ liệu chuyên cần phù hợp" sub="Thử đổi bộ lọc chuyên cần." compact />
            ) : filteredAttendance.map(row => {
              const warning = attendanceWarning(row);
              const rate = attendanceRate(row);
              const phone = String(row.parentPhone || '').replace(/\D/g, '');
              return (
                <MobileCompactCard
                  key={`${row.id}-attendance-mobile`}
                  title={row.name}
                  subtitle={`${row.id || '—'} · ${row.classId || 'Chưa có lớp'}`}
                  value={rate === null ? '—' : `${rate}%`}
                  badge={<StatusBadge domain="attendance" status={warning.label} label={warning.label} tone={warning.tone} />}
                  tone={warning.tone}
                  meta={[
                    { key: 'absent', label: `Vắng ${row.absent}`, tone: row.absent ? 'warning' as const : 'success' as const },
                    { key: 'streak', label: row.streak ? `Liên tiếp ${row.streak}` : 'Không liên tiếp', tone: row.streak ? 'danger' as const : 'neutral' as const },
                    { key: 'excused', label: `Có phép ${row.excused}`, tone: row.excused ? 'info' as const : 'neutral' as const },
                  ]}
                  actions={phone.length >= 9 ? (
                    <a href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" style={{ minHeight: 34, borderRadius: 999, border: '1px solid #bfdbfe', background: '#eef6ff', color: '#0068FF', padding: '7px 10px', fontSize: 12, fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginLeft: 'auto' }}>
                      <Phone size={13} /> Zalo PH
                    </a>
                  ) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {lessonOffDraft && (
        <div
          className="ltn-form-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.52)', backdropFilter: 'blur(3px)' }}
          onClick={closeLessonOffModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận nghỉ buổi"
            onClick={event => event.stopPropagation()}
            style={{ width: 'min(420px, 100%)', borderRadius: 18, background: 'white', boxShadow: '0 24px 70px rgba(15,23,42,.26)', border: '1px solid #e2e8f0', overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 38, height: 38, borderRadius: 13, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarX size={18} />
              </span>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Xác nhận nghỉ buổi</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 750, color: '#64748b', lineHeight: 1.45 }}>
                  {lessonOffDraft.row.slot.classId} · {lessonOffDraft.row.slot.caDay} · <DateText value={lessonOffDraft.row.slot.isoDate} />
                </p>
              </div>
            </div>
            <div style={{ padding: 18, display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Lý do nghỉ</span>
                <textarea
                  autoFocus
                  value={lessonOffDraft.reason}
                  onChange={event => setLessonOffDraft(prev => prev ? { ...prev, reason: event.target.value } : prev)}
                  placeholder="VD: GV bận, lớp nghỉ theo lịch trường, mưa lớn..."
                  rows={3}
                  style={{ width: '100%', minHeight: 86, resize: 'vertical', border: '1px solid #dbe4f0', borderRadius: 12, padding: '10px 12px', outline: 'none', color: '#0f172a', fontSize: 14, fontWeight: 650, lineHeight: 1.5 }}
                />
              </label>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 700, lineHeight: 1.45 }}>
                Buổi nghỉ sẽ được lưu như một nhật ký đặc biệt, không có danh sách điểm danh và không tính học sinh là vắng/có phép.
              </p>
            </div>
            <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button intent="neutral" variant="outline" size="sm" onClick={closeLessonOffModal} disabled={lessonOffSaving}>Hủy</Button>
              <Button intent="warning" size="sm" icon={<CalendarX size={13} />} loading={lessonOffSaving} onClick={submitLessonOff}>
                Xác nhận nghỉ
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
