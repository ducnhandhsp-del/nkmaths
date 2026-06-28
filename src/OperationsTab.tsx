/**
 * OperationsTab.tsx
 * Module Van hanh: Lich day, Buoi hoc, Chuyen can.
 * Chi chuan hoa UI/render, giu nguyen handler va logic nghiep vu hien co.
 */
import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle, Edit3, Eye, Phone, Plus } from 'lucide-react';
import { parseDMY } from './helpers';
import { Button, Pager, Select } from './dsComponents';
import { ActionableKpi, ActionableKpiGrid, DataTable, DateText, EmptyState, MobileCard, PageToolbar, StatusBadge, ToolbarTabs } from './uiSystem';
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
const CA_SLOTS = ['7h30', '9h', '13h30', '15h30', '17h30', '19h30'];
const CA_MINS = [7 * 60 + 30, 9 * 60, 13 * 60 + 30, 15 * 60 + 30, 17 * 60 + 30, 19 * 60 + 30];

type ScheduleStatus = 'future' | 'inProgress' | 'logged' | 'pending' | 'cancelled';
type AttendanceFocus = 'all' | 'present' | 'absent' | 'excused' | 'streak';

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
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

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
  return readFirst(c, ['Tên Lớp', 'TenLop', 'Ten Lop', 'className', 'name']) || getClassId(c);
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

function parseBuoi(v: string) {
  if (!v) return null;
  const parts = v.trim().split(/\s+/);
  const day = parts[0];
  if (!DAYS.includes(day)) return null;
  const timeText = parts.slice(1).join(' ');
  const hourMatch = timeText.match(/(\d+)[h:]/);
  if (!hourMatch) return null;
  const hour = parseInt(hourMatch[1], 10);
  const minuteMatch = timeText.match(/[h:](\d{2})/);
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
    if (log.caDay && slot.caDay && log.caDay !== slot.caDay) return false;
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

function ScheduleBadge({ status }: { status: ScheduleStatus }) {
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
  const s = String(raw || '').trim();
  if (s === 'Vắng') return 'absent';
  if (s === 'Có phép' || s === 'Nghỉ có phép') return 'excused';
  const n = norm(s);
  if (n === 'vang' || n === 'absent') return 'absent';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'excused';
  return 'present';
}

const attendanceIdOf = (a: any) => a.maHS || a['Mã HS'] || a.MaHS || '';

function lessonAttendanceSummary(log: TeachingLog) {
  const present = Number(log.present || 0);
  const absent = Number(log.absent || 0);
  const excused = Number(log.excused || 0);
  return { present, absent, excused, total: present + absent + excused };
}

function lessonStatus(log: TeachingLog): { label: string; tone: 'success' | 'warning' } {
  return lessonAttendanceSummary(log).total > 0
    ? { label: 'Đã điểm danh', tone: 'success' }
    : { label: 'Chưa điểm danh', tone: 'warning' };
}

function fmtWeekDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function attendanceWarning(row: AttendanceRow): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (row.absent >= 5 || row.streak >= 3) return { label: 'Vắng nhiều', tone: 'danger' };
  if (row.absent >= 3 || row.streak >= 2) return { label: 'Cần theo dõi', tone: 'warning' };
  if (row.present + row.absent + row.excused > 0) return { label: 'Ổn', tone: 'success' };
  return { label: '—', tone: 'neutral' };
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
}: Props) {
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceFocus, setAttendanceFocus] = useState<AttendanceFocus>('all');
  const [scheduleMonth, setScheduleMonth] = useState(() => monthKey(new Date()));
  const [lessonMonth, setLessonMonth] = useState(() => monthKey(new Date()));
  const [scheduleClass, setScheduleClass] = useState('');

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
    .sort((a, b) => parseDMY(b.rawDate || b.date) - parseDMY(a.rawDate || a.date)),
  [dCls, lessonMonth, tlogs]);

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

    tlogs.forEach(log => (log.attendanceList || []).forEach((a: any) => {
      const row = map.get(attendanceIdOf(a));
      if (!row) return;
      const status = normalizeAttendanceStatus(getAttendanceStatus(a));
      if (status === 'absent') row.absent++;
      else if (status === 'excused') row.excused++;
      else row.present++;
    }));

    const byClass = new Map<string, TeachingLog[]>();
    [...tlogs]
      .sort((a, b) => parseDMY(b.rawDate || b.date) - parseDMY(a.rawDate || a.date))
      .forEach(log => {
        if (!byClass.has(log.classId)) byClass.set(log.classId, []);
        byClass.get(log.classId)!.push(log);
      });

    students.forEach(student => {
      const row = map.get(student.id);
      if (!row) return;
      const logs = (byClass.get(student.classId) || []).slice(0, 10);
      let streak = 0;
      for (const log of logs) {
        const entry = (log.attendanceList || []).find((a: any) => attendanceIdOf(a) === student.id);
        if (entry && normalizeAttendanceStatus(getAttendanceStatus(entry)) === 'absent') streak++;
        else if (entry) break;
      }
      row.streak = streak;
    });
    return [...map.values()];
  }, [students, tlogs]);

  const attendanceClassOptions = useMemo(() => {
    const items = [...new Set(attendanceStats.map(r => r.classId).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(value => ({ value, label: value }));
    return [{ value: '', label: 'Lớp' }, ...items];
  }, [attendanceStats]);

  const filteredAttendance = useMemo(() => {
    return attendanceStats
      .filter(r => !attendanceClass || r.classId === attendanceClass)
      .filter(r => {
        if (attendanceFocus === 'present') return r.present > 0;
        if (attendanceFocus === 'absent') return r.absent > 0;
        if (attendanceFocus === 'excused') return r.excused > 0;
        if (attendanceFocus === 'streak') return r.streak >= 2;
        return true;
      })
      .sort((a, b) => {
        if (attendanceFocus === 'present') return b.present - a.present;
        if (attendanceFocus === 'excused') return b.excused - a.excused;
        if (attendanceFocus === 'streak') return b.streak - a.streak;
        return b.absent - a.absent || b.streak - a.streak;
      });
  }, [attendanceClass, attendanceFocus, attendanceStats]);

  const attendanceTotals = useMemo(() => ({
    present: attendanceStats.reduce((sum, row) => sum + row.present, 0),
    absent: attendanceStats.reduce((sum, row) => sum + row.absent, 0),
    excused: attendanceStats.reduce((sum, row) => sum + row.excused, 0),
  }), [attendanceStats]);

  const openScheduleRow = (row: ScheduleRow) => {
    if (row.status === 'future' || row.status === 'cancelled') return;
    if (row.tlog) onViewDiary(row.tlog);
    else onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay);
  };

  const scheduleColumns = useMemo(() => [
    {
      key: 'time',
      label: 'Thời gian',
      width: '18%',
      render: (_: unknown, row: ScheduleRow) => {
        const dayCode = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][row.slot.date.getDay()];
        return (
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{DAY_FULL[dayCode]} · {row.slot.caDay}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11 }}><DateText value={row.slot.isoDate} /></p>
          </div>
        );
      },
    },
    {
      key: 'class',
      label: 'Lớp',
      width: '20%',
      render: (_: unknown, row: ScheduleRow) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#312e81', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.slot.classId}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.slot.className}</p>
        </div>
      ),
    },
    { key: 'teacher', label: 'Giáo viên', width: '17%', render: (_: unknown, row: ScheduleRow) => <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{row.slot.teacher || '—'}</span> },
    { key: 'facility', label: 'Cơ sở', width: '13%', render: (_: unknown, row: ScheduleRow) => <span style={{ fontSize: 12, fontWeight: 800, color: row.slot.facility === '—' ? '#94a3b8' : '#475569' }}>{row.slot.facility}</span> },
    { key: 'status', label: 'Trạng thái', align: 'center' as const, width: '14%', render: (_: unknown, row: ScheduleRow) => <ScheduleBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '18%',
      render: (_: unknown, row: ScheduleRow) => {
        const locked = row.status === 'future' || row.status === 'cancelled';
        const lockedLabel = row.status === 'future' ? 'Chưa tới giờ' : 'Đã hủy';
        const lockedTitle = row.status === 'future'
          ? 'Chỉ ghi buổi khi đã tới hoặc qua giờ học.'
          : 'Buổi học đã hủy nên không thể ghi buổi.';
        return (
          <div onClick={event => event.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {row.tlog ? (
              <Button intent="primary" variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => onViewDiary(row.tlog!)}>Xem</Button>
            ) : locked ? (
              <span title={lockedTitle} style={{ minHeight: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: 999, background: row.status === 'future' ? '#f8fafc' : '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
                {lockedLabel}
              </span>
            ) : (
              <Button intent="success" variant="outline" size="sm" icon={<Plus size={13} />} onClick={() => onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay)}>
                Ghi buổi
              </Button>
            )}
          </div>
        );
      },
    },
  ], [onAddDiary, onViewDiary]);

  const lessonColumns = useMemo(() => [
    { key: 'date', label: 'Ngày học', width: '14%', render: (_: unknown, log: TeachingLog) => <DateText value={log.date} /> },
    { key: 'classId', label: 'Lớp', width: '14%', render: (_: unknown, log: TeachingLog) => <StatusBadge domain="general" status="class" label={log.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'caDay',
      label: 'Giờ học',
      width: '12%',
      render: (_: unknown, log: TeachingLog) => (
        <span style={{ fontSize: 13, fontWeight: 900, color: log.caDay ? '#b45309' : '#94a3b8', whiteSpace: 'nowrap' }}>
          {log.caDay || '—'}
        </span>
      ),
    },
    {
      key: 'content',
      label: 'Nội dung',
      width: '26%',
      render: (_: unknown, log: TeachingLog) => (
        <span style={{ display: 'block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: log.content ? '#0f172a' : '#94a3b8' }}>
          {log.content || 'Chưa nhập nội dung'}
        </span>
      ),
    },
    {
      key: 'homework',
      label: 'Bài tập rèn luyện',
      width: '22%',
      render: (_: unknown, log: TeachingLog) => {
        const homework = String(log.homework || '').trim();
        const hasHomework = homework && homework !== '---';
        return (
          <span style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: hasHomework ? '#475569' : '#94a3b8' }}>
            {hasHomework ? homework : '—'}
          </span>
        );
      },
    },
    {
      key: 'attendance',
      label: 'Điểm danh',
      width: '12%',
      render: (_: unknown, log: TeachingLog) => {
        const a = lessonAttendanceSummary(log);
        return a.total > 0 ? (
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 800 }}>
            Có mặt {a.present} · Vắng {a.absent} · Có phép {a.excused}
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
          {row.grade && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Khối {row.grade}</p>}
        </div>
      ),
    },
    { key: 'classId', label: 'Lớp', align: 'center' as const, width: '12%', render: (_: unknown, row: AttendanceRow) => <StatusBadge domain="general" status="class" label={row.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'stats',
      label: 'Thống kê',
      width: '22%',
      render: (_: unknown, row: AttendanceRow) => (
        <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>
          Có mặt {row.present} · Vắng {row.absent} · Có phép {row.excused}
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
    .sort((a, b) => parseDMY(b.rawDate || b.date) - parseDMY(a.rawDate || a.date))
    .slice(0, 8), [scheduleClass, tlogs]);

  const warningAttendanceRows = useMemo(() => attendanceStats
    .filter(row => !scheduleClass || row.classId === scheduleClass)
    .map(row => ({ ...row, warning: attendanceWarning(row) }))
    .filter(row => row.warning.tone === 'danger' || row.warning.tone === 'warning')
    .sort((a, b) => b.absent - a.absent || b.streak - a.streak || a.name.localeCompare(b.name, 'vi'))
    .slice(0, 10), [attendanceStats, scheduleClass]);

  const weeklyLoggedCount = scheduleRows.filter(row => row.status === 'logged').length;
  const weeklyNoAttendanceCount = scheduleRows.filter(row => row.tlog && lessonAttendanceSummary(row.tlog).total === 0).length;

  const recentLessonColumns = useMemo(() => [
    { key: 'date', label: 'Ngày học', width: '14%', render: (_: unknown, log: TeachingLog) => <DateText value={log.date} /> },
    { key: 'classId', label: 'Lớp', width: '16%', render: (_: unknown, log: TeachingLog) => <StatusBadge domain="general" status="class" label={log.classId || '—'} tone="violet" dot={false} /> },
    {
      key: 'content',
      label: 'Nội dung',
      width: '28%',
      render: (_: unknown, log: TeachingLog) => (
        <span style={{ display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: log.content ? '#0f172a' : '#94a3b8' }}>
          {log.content || 'Chưa nhập nội dung'}
        </span>
      ),
    },
    {
      key: 'attendance',
      label: 'Điểm danh',
      width: '20%',
      render: (_: unknown, log: TeachingLog) => {
        const a = lessonAttendanceSummary(log);
        return a.total > 0 ? (
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 800 }}>
            Có mặt {a.present} · Vắng {a.absent} · Phép {a.excused}
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
            <Button size="sm" intent="neutral" variant="outline" onClick={() => setScheduleMonth(currentMonth)}>Tháng này</Button>
          )}
          <Select value={scheduleClass} onChange={setScheduleClass} options={classOptions} size="md" style={{ width: 108, minWidth: 96 }} />
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
          <Select
            value={dCls}
            onChange={value => { setDCls(value); setPgD(1); }}
            options={classOptions}
            size="md"
            style={{ width: 108, minWidth: 96 }}
          />
        </>
      )}
      {sub === 'attendance' && (
        <>
          <Select value={attendanceClass} onChange={setAttendanceClass} options={attendanceClassOptions} size="md" style={{ width: 108, minWidth: 96 }} />
          <Select
            value={attendanceFocus}
            onChange={v => setAttendanceFocus(v as AttendanceFocus)}
            options={[
              { value: 'all', label: `Trạng thái (${attendanceStats.length})` },
              { value: 'present', label: `Có mặt (${attendanceTotals.present})` },
              { value: 'absent', label: `Vắng (${attendanceTotals.absent})` },
              { value: 'excused', label: `Có phép (${attendanceTotals.excused})` },
              { value: 'streak', label: `Cảnh báo (${attendanceStats.filter(r => r.streak >= 2).length})` },
            ]}
            size="md"
            style={{ width: 146, minWidth: 128 }}
          />
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        .ops-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .ops-period-control{display:flex;align-items:center;gap:4px;border:1px solid #e2e8f0;padding:3px 7px;border-radius:8px;background:white}
        .ops-period-button{width:28px;height:28px;border:0;background:transparent;cursor:pointer;border-radius:6px;color:#64748b;font-size:18px;line-height:1}
        .ops-period-button:hover{background:#f1f5f9;color:#0f172a}
        .ops-period-label{font-size:12px;font-weight:900;color:#0f172a;min-width:76px;text-align:center;white-space:nowrap}
        @media(max-width:767px){
          .ops-toolbar-filters{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
          .ops-period-control{justify-content:space-between}
          .ops-toolbar-filters > *{width:100%!important;min-width:0!important}
        }
      `}</style>
      <PageToolbar
        title={title}
        actions={(
          <Button intent="success" size="sm" icon={<Plus size={13} />} onClick={() => onAddDiary()}>
            Ghi buổi học
          </Button>
        )}
      >
        <ToolbarTabs tabs={opsTabs} active={sub} onChange={setSub} />
        {toolbarFilters}
      </PageToolbar>

      {sub === 'schedule' && (
        <ActionableKpiGrid>
          <ActionableKpi icon={BookOpen} value={scheduleRows.length} label="Buổi trong tháng" sub={scheduleMonthLabel} tone="primary" />
          <ActionableKpi icon={CheckCircle} value={weeklyLoggedCount} label="Đã ghi buổi" sub={`${weeklyLoggedCount}/${scheduleRows.length || 0} buổi`} tone="success" />
          <ActionableKpi icon={Edit3} value={weeklyNoAttendanceCount} label="Chưa điểm danh" sub="Buổi đã ghi nhưng chưa có điểm danh" tone={weeklyNoAttendanceCount ? 'warning' : 'neutral'} />
          <ActionableKpi icon={AlertTriangle} value={warningAttendanceRows.length} label="Cảnh báo chuyên cần" sub={warningAttendanceRows.length ? 'Cần theo dõi' : 'Đang ổn'} tone={warningAttendanceRows.length ? 'danger' : 'success'} />
        </ActionableKpiGrid>
      )}

      {sub === 'schedule' && (
        <div>
          <style>{`
            .ops-schedule-desktop{display:block}.ops-schedule-mobile{display:none}
            @media(max-width:767px){.ops-schedule-desktop{display:none!important}.ops-schedule-mobile{display:grid!important}}
          `}</style>
          <div className="ops-schedule-desktop">
            <DataTable
              columns={scheduleColumns}
              data={scheduleRows}
              rowKey="id"
              emptyText="Không có lịch dạy trong tháng này"
              emptySub="Thử đổi tháng/năm hoặc lớp."
              onRowClick={openScheduleRow}
              scrollX={false}
              density="compact"
            />
          </div>
          <div className="ops-schedule-mobile" style={{ gap: 8, padding: 10 }}>
            {scheduleRows.length === 0 ? (
              <EmptyState text="Không có lịch dạy trong tháng này" sub="Thử đổi tháng/năm hoặc lớp." compact />
            ) : scheduleRows.map(row => {
              const dayCode = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][row.slot.date.getDay()];
              const locked = row.status === 'future' || row.status === 'cancelled';
              return (
                <MobileCard
                  key={row.id}
                  title={`${row.slot.caDay} · ${row.slot.classId}`}
                  subtitle={`${DAY_FULL[dayCode]} · ${fmtWeekDate(row.slot.date)} · ${row.slot.teacher || '—'}`}
                  badge={<ScheduleBadge status={row.status} />}
                  tone={scheduleStatusTone(row.status)}
                  onClick={() => openScheduleRow(row)}
                  rows={[
                    { label: 'Cơ sở', value: row.slot.facility },
                    { label: 'Trạng thái', value: scheduleStatusLabel(row.status) },
                  ]}
                  actions={(
                    <div onClick={event => event.stopPropagation()} style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: 7, flexWrap: 'wrap' }}>
                    {row.tlog ? (
                      <Button intent="primary" variant="outline" size="sm" onClick={() => onViewDiary(row.tlog!)}>Xem</Button>
                    ) : locked ? (
                      <span title={row.status === 'future' ? 'Chỉ ghi buổi khi đã tới hoặc qua giờ học.' : 'Buổi học đã hủy nên không thể ghi buổi.'} style={{ minHeight: 40, display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 900, fontSize: 12 }}>
                        {row.status === 'future' ? 'Chưa tới giờ' : 'Đã hủy'}
                      </span>
                    ) : (
                      <Button intent="success" variant="outline" size="sm" onClick={() => onAddDiary(row.slot.classId, row.slot.isoDate, row.slot.caDay)}>
                        Ghi buổi
                      </Button>
                    )}
                    </div>
                  )}
                />
              );
            })}
          </div>
        </div>
      )}

      {sub === 'lessons' && (
        <div>
          <style>{`
            .ops-lessons-desktop{display:block}.ops-lessons-mobile{display:none}
            @media(max-width:767px){.ops-lessons-desktop{display:none!important}.ops-lessons-mobile{display:grid!important}}
          `}</style>
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
          <div className="ops-lessons-mobile" style={{ gap: 8, padding: 10 }}>
            {pagedLessons.length === 0 ? (
              <EmptyState text="Chưa có buổi học phù hợp" sub="Thử đổi tháng hoặc lớp." compact />
            ) : pagedLessons.map(log => {
              const st = lessonStatus(log);
              const a = lessonAttendanceSummary(log);
              const homework = String(log.homework || '').trim();
              return (
                <MobileCard
                  key={`${log.classId}-${log.rawDate || log.date}-${log.caDay}`}
                  title={`${log.classId || '—'} · ${log.caDay || '—'}`}
                  subtitle={<DateText value={log.date} />}
                  badge={<StatusBadge domain="lesson" status={st.label} label={st.label} tone={st.tone} />}
                  tone={st.tone}
                  onClick={() => onViewDiary(log)}
                  rows={[
                    { label: 'Giờ học', value: log.caDay || '—' },
                    { label: 'Nội dung', value: log.content || 'Chưa nhập' },
                    { label: 'Bài tập', value: homework && homework !== '---' ? homework : '—' },
                    { label: 'Điểm danh', value: a.total > 0 ? `Có mặt ${a.present} · Vắng ${a.absent} · Có phép ${a.excused}` : 'Chưa điểm danh' },
                  ]}
                />
              );
            })}
            <Pager page={pgD} total={filteredLessons.length} perPage={IPP} setPage={setPgD} showTotal />
          </div>
        </div>
      )}

      {sub === 'attendance' && (
        <div>
          <style>{`
            .ops-attendance-desktop{display:block}.ops-attendance-mobile{display:none}
            @media(max-width:767px){.ops-attendance-desktop{display:none!important}.ops-attendance-mobile{display:grid!important}}
          `}</style>
          <div className="ops-attendance-desktop">
            <DataTable
              columns={attendanceColumns}
              data={filteredAttendance}
              rowKey="id"
              emptyText="Chưa có dữ liệu chuyên cần phù hợp"
              emptySub="Thử đổi lớp hoặc trạng thái."
              scrollX={false}
              density="compact"
            />
          </div>
          <div className="ops-attendance-mobile" style={{ gap: 8, padding: 10 }}>
            {filteredAttendance.length === 0 ? (
              <EmptyState text="Chưa có dữ liệu chuyên cần phù hợp" sub="Thử đổi bộ lọc chuyên cần." compact />
            ) : filteredAttendance.map(row => {
              const warning = attendanceWarning(row);
              const rate = attendanceRate(row);
              const phone = String(row.parentPhone || '').replace(/\D/g, '');
              return (
                <MobileCard
                  key={`${row.id}-attendance-mobile`}
                  title={row.name}
                  subtitle={`${row.id || '—'} · ${row.classId || 'Chưa có lớp'}`}
                  badge={<StatusBadge domain="attendance" status={warning.label} label={warning.label} tone={warning.tone} />}
                  tone={warning.tone}
                  rows={[
                    { label: 'Có mặt', value: row.present || '—' },
                    { label: 'Vắng', value: row.absent || '—' },
                    { label: 'Có phép', value: row.excused || '—' },
                    { label: 'Liên tiếp', value: row.streak || '—' },
                    { label: 'Tỷ lệ', value: rate === null ? '—' : `${rate}%` },
                  ]}
                  actions={phone.length >= 9 ? (
                    <a href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" style={{ minHeight: 40, borderRadius: 999, border: '1px solid #bfdbfe', background: '#eef6ff', color: '#0068FF', padding: '8px 12px', fontSize: 12, fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginLeft: 'auto' }}>
                      <Phone size={13} /> Zalo PH
                    </a>
                  ) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
