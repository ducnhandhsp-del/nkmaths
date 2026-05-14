/**
 * OperationsTab.tsx — v27.1
 * Tổng hợp vận hành + các subtab nghiệp vụ gọn.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { BookOpen, Calendar, AlertTriangle, Eye, Edit3, Clock, Phone, Plus, School, Users } from 'lucide-react';
import { formatDate, parseDMY, isStudentActive } from './helpers';
import { Badge, Pager, FilterTabs, Select, TableActions, Button } from './dsComponents';
import { StatBlock, StatGrid, TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import type { Student, TeachingLog, LeaveRequest, Payment, Teacher, OperationsSub } from './types';

type Sub = OperationsSub;
const SUBS = [
  { id: 'overview' as Sub, label: 'Tổng hợp',           icon: AlertTriangle },
  { id: 'schedule' as Sub, label: 'Lịch dạy',           icon: Calendar   },
  { id: 'lessons'  as Sub, label: 'Buổi học',           icon: BookOpen    },
  { id: 'attendance' as Sub, label: 'Chuyên cần',       icon: Users },
];

const DAYS     = ['T2','T3','T4','T5','T6','T7','CN'];
const DAY_FULL: Record<string, string> = { T2:'Thứ 2',T3:'Thứ 3',T4:'Thứ 4',T5:'Thứ 5',T6:'Thứ 6',T7:'Thứ 7',CN:'Chủ nhật' };
const CA_SLOTS = ['7h30','9h','13h30','15h30','17h30','19h30'];
const CA_MINS  = [7*60+30, 9*60, 13*60+30, 15*60+30, 17*60+30, 19*60+30];

function ScheduleBadge({ status }: { status: 'logged' | 'pending' | 'future' }) {
  const cfg = status === 'logged'
    ? { label: 'Đã ghi', bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' }
    : status === 'pending'
      ? { label: 'Chưa ghi', bg: '#fffbeb', border: '#fde68a', color: '#92400e' }
      : { label: 'Sắp tới', bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 7px', borderRadius: 999, border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function parseBuoi(v: string) {
  if (!v) return null;
  const parts = v.trim().split(/\s+/);
  const day = parts[0];
  if (!DAYS.includes(day)) return null;
  const m = parts.slice(1).join(' ').match(/(\d+)[h:]/);
  if (!m) return null;
  const h = parseInt(m[1]);
  const m2 = parts.slice(1).join(' ').match(/[h:](\d{2})/);
  const min = m2 ? parseInt(m2[1]) : 0;
  const total = h * 60 + min;
  let best = 0, bestDiff = Infinity;
  CA_MINS.forEach((cm, i) => { const d = Math.abs(total - cm); if (d < bestDiff) { bestDiff = d; best = i; } });
  return { day, caIdx: best };
}


/* ─────────────────────────────────────────────────────────────
   WeeklyCalendar — lịch tuần tương tác
───────────────────────────────────────────────────────────── */
interface ScheduledSlot {
  date:    Date;
  isoDate: string;   // YYYY-MM-DD
  classId: string;
  caDay:   string;
  caIdx:   number;
  teacher: string;
}

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function isFutureSlot(slot: ScheduledSlot, now: Date) {
  const mins = CA_MINS[slot.caIdx] ?? 0;
  const startsAt = new Date(slot.date);
  startsAt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return startsAt > now;
}

function findMatchingTlog(slot: ScheduledSlot, tlogs: TeachingLog[]): TeachingLog | undefined {
  return tlogs.find(l => {
    if (l.classId !== slot.classId) return false;
    const raw = l.rawDate || l.date || '';
    // parse DD/MM/YYYY hoặc ISO
    let logDate: Date | null = null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [d,m,y] = raw.split('/').map(Number);
      logDate = new Date(y, m-1, d);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      // BUG FIX: new Date('YYYY-MM-DD') parses as UTC midnight → lệch ngày ở UTC+7
      // Phải parse component trực tiếp để tránh UTC offset
      const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
      logDate = new Date(y, m - 1, d);
    } else {
      const ts = parseDMY(raw); if (ts) logDate = new Date(ts);
    }
    if (!logDate || !sameDay(logDate, slot.date)) return false;
    // caDay match nếu có
    if (l.caDay && slot.caDay && l.caDay !== slot.caDay) return false;
    return true;
  });
}

type AlertKind = 'class' | 'student' | 'teacher' | 'finance';
type AlertSeverity = 'high' | 'medium' | 'low';

interface OperationAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  target: string;
  action: string;
}

const norm = (raw: any) =>
  String(raw || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const getClassId = (c: Record<string, any>) => String(c['Mã Lớp'] || c['MÃ£ Lá»›p'] || c.MaLop || c['Ma Lop'] || '');
const getClassTeacherId = (c: Record<string, any>) => String(c.MaGV || c.maGV || c.teacherId || '');
const getClassTeacherName = (c: Record<string, any>) => String(c.GiaoVien || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || '');
const getClassSlots = (c: Record<string, any>) => [c['Buổi 1'] || c['Buá»•i 1'], c['Buổi 2'] || c['Buá»•i 2'], c['Buổi 3'] || c['Buá»•i 3']].filter(Boolean).map(String);
const teacherMatchesClass = (teacher: Teacher, c: Record<string, any>) => {
  const tid = getClassTeacherId(c);
  if (tid && teacher.id && norm(tid) === norm(teacher.id)) return true;
  const tName = getClassTeacherName(c);
  if (!tName || !teacher.name) return false;
  return norm(tName) === norm(teacher.name);
};
const isMonthBillable = (s: Student, mo: number, yr: number) => {
  const monthStart = new Date(yr, mo - 1, 1).getTime();
  const startTs = parseDMY(s.startDate || '');
  if (startTs) {
    const d = new Date(startTs);
    if (monthStart < new Date(d.getFullYear(), d.getMonth(), 1).getTime()) return false;
  }
  const endRaw = String(s.endDate || '').trim();
  const endTs = parseDMY(endRaw);
  if (endTs && endRaw && endRaw !== '---') {
    const d = new Date(endTs);
    if (monthStart >= new Date(d.getFullYear(), d.getMonth(), 1).getTime()) return false;
  }
  return true;
};
const paymentInTuitionMonth = (p: Payment, mo: number, yr: number) => {
  const hpMo = Number(p.thangHP || 0);
  const hpYr = Number(p.namHP || 0);
  if (hpMo) return hpMo === mo && (hpYr || yr) === yr;
  const ts = parseDMY(p.date || '');
  if (!ts) return false;
  const d = new Date(ts);
  return d.getMonth() + 1 === mo && d.getFullYear() === yr;
};
const getAttendanceStatus = (a: any) => a.trangThai || a['Trạng thái'] || a.TrangThai || '';
const normalizeAttendanceStatus = (raw: string) => {
  const s = String(raw || '').trim();
  if (s === 'Vắng') return 'absent';
  if (s === 'Có phép' || s === 'Nghỉ có phép') return 'excused';
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n === 'vang' || n === 'absent') return 'absent';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'excused';
  return 'present';
};
const attendanceIdOf = (a: any) => a.maHS || a['Mã HS'] || a.MaHS || '';
const logInMonth = (log: TeachingLog, mo: number, yr: number) => {
  const ts = parseDMY(log.rawDate || log.date || '');
  if (!ts) return false;
  const d = new Date(ts);
  return d.getMonth() + 1 === mo && d.getFullYear() === yr;
};

function WeeklyCalendar({ uClasses, tlogs, onAddDiary, onViewDiary }: {
  uClasses: Record<string,string>[];
  tlogs: TeachingLog[];
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
  onViewDiary: (log: TeachingLog) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterTeacher, setFilterTeacher] = useState('');
  const today = new Date();

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const teachers = useMemo(() => {
    const s = new Set<string>();
    uClasses.forEach(c => { if (c['Giáo viên'] && c['Giáo viên'] !== '---') s.add(c['Giáo viên']); });
    return [...s];
  }, [uClasses]);

  const teacherOptions = [{ value:'', label:'Tất cả GV' }, ...teachers.map(t => ({ value:t, label:t }))];

  // Build tất cả slots cho tuần này
  const slots = useMemo((): ScheduledSlot[] => {
    const result: ScheduledSlot[] = [];
    weekDates.forEach(date => {
      const dow  = date.getDay(); // 0=Sun
      const dayCode = ['CN','T2','T3','T4','T5','T6','T7'][dow];
      uClasses
        .filter(c => !filterTeacher || c['Giáo viên'] === filterTeacher)
        .forEach(c => {
          ['Buổi 1','Buổi 2','Buổi 3'].forEach(b => {
            const p = parseBuoi(c[b] || '');
            if (!p || p.day !== dayCode) return;
            result.push({
              date, isoDate: toISO(date),
              classId: c['Mã Lớp'],
              caDay:   CA_SLOTS[p.caIdx],
              caIdx:   p.caIdx,
              teacher: c['Giáo viên'] || '',
            });
          });
        });
    });
    return result;
  }, [weekDates, uClasses, filterTeacher]);

  // Grouping: caIdx → dayIdx → slots[]
  const grid = useMemo(() => {
    const g: Record<number, Record<number, ScheduledSlot[]>> = {};
    CA_SLOTS.forEach((_, ci) => {
      g[ci] = {};
      weekDates.forEach((_, di) => { g[ci][di] = []; });
    });
    slots.forEach(s => {
      const di = weekDates.findIndex(d => sameDay(d, s.date));
      if (di >= 0) g[s.caIdx][di].push(s);
    });
    return g;
  }, [slots, weekDates]);

  // Kiểm tra tuần có slot không
  const hasAnySlot = slots.length > 0;

  const DAY_LABELS = ['T2','T3','T4','T5','T6','T7','CN'];
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        {/* Week nav */}
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'white', border:'1px solid #e2e8f0', padding:'4px 8px', borderRadius:8 }}>
          <button onClick={() => setWeekOffset(o=>o-1)} style={{ width:28,height:28,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,color:'#64748b' }}>‹</button>
          <span style={{ fontSize:12,fontWeight:700,color:'#0f172a',minWidth:160,textAlign:'center',whiteSpace:'nowrap' }}>
            {fmt(weekDates[0])} — {fmt(weekDates[6])} / {weekDates[0].getFullYear()}
          </span>
          <button onClick={() => setWeekOffset(o=>o+1)} style={{ width:28,height:28,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,color:'#64748b' }}>›</button>
        </div>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} style={{ padding:'5px 10px',border:'none',background:'#eef2ff',color:'#6366f1',fontSize:11,fontWeight:700,cursor:'pointer',borderRadius:6 }}>Tuần này</button>
        )}
        {/* Filter GV */}
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
          style={{ padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,fontWeight:600,color:'#374151',background:'white',cursor:'pointer',outline:'none' }}>
          {teacherOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ fontSize:12,fontWeight:600,color:'#94a3b8',marginLeft:'auto' }}>
          {slots.length} buổi/tuần
        </span>
      </div>

      {/* Grid */}
      <div style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' as any }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
            <thead>
              <tr>
                <th style={{ ...TH_SHARED, width:64, textAlign:'left' }}>Ca</th>
                {weekDates.map((d, di) => {
                  const isToday = sameDay(d, today);
                  return (
                    <th key={di} style={{ ...TH_SHARED, textAlign:'center', minWidth:90, background: isToday ? '#eef2ff' : '#f8fafc', color: isToday ? '#4338ca' : '#64748b', borderLeft: isToday ? '2px solid #c7d2fe' : undefined, borderRight: isToday ? '2px solid #c7d2fe' : undefined }}>
                      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:1 }}>
                        <span>{DAY_LABELS[di]}</span>
                        <span style={{ fontSize:10,fontWeight:600,color: isToday ? '#6366f1' : '#94a3b8' }}>{fmt(d)}</span>
                        {isToday && <span style={{ fontSize:7,fontWeight:800,color:'#c7d2fe',letterSpacing:'0.1em' }}>HÔM NAY</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {!hasAnySlot ? (
                <tr><td colSpan={8} style={{ padding:'48px 16px',textAlign:'center',color:'#94a3b8',fontStyle:'italic' }}>
                  Không có lịch dạy nào trong tuần này
                </td></tr>
              ) : CA_SLOTS.map((ca, ci) => {
                const rowHasSlot = weekDates.some((_, di) => grid[ci][di]?.length > 0);
                if (!rowHasSlot) return null;
                return (
                  <tr key={ca} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ ...TD_SHARED, padding:'8px 12px', whiteSpace:'nowrap' }}>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,color:'#6366f1' }}>
                        <Clock size={10} color="#6366f1" />{ca}
                      </span>
                    </td>
                    {weekDates.map((d, di) => {
                      const cellSlots = grid[ci][di] || [];
                      const isToday = sameDay(d, today);
                      return (
                        <td key={di} style={{ ...TD_SHARED, textAlign:'center', padding:'6px 5px', background: isToday ? (cellSlots.length > 0 ? undefined : '#fafbff') : 'transparent', borderLeft: isToday ? '1px solid #c7d2fe' : undefined, borderRight: isToday ? '1px solid #c7d2fe' : undefined, verticalAlign:'top' }}>
                          {cellSlots.length === 0
                            ? <span style={{ color:'#e2e8f0',fontSize:14 }}>—</span>
                            : cellSlots.map((slot, k) => {
                                const tlog = findMatchingTlog(slot, tlogs);
                                const isFuture = isFutureSlot(slot, today);
                                const isLockedFuture = isFuture && !tlog;
                                const bg      = tlog ? '#ecfdf5' : (isFuture ? '#f8fafc' : '#fefce8');
                                const border  = tlog ? '#a7f3d0' : (isFuture ? '#e2e8f0' : '#fde68a');
                                const textClr = tlog ? '#065f46' : (isFuture ? '#94a3b8' : '#92400e');
                                const cursor  = isLockedFuture ? 'default' : 'pointer';
                                return (
                                  <div key={k}
                                    onClick={() => {
                                      if (isLockedFuture) return;
                                      if (tlog) onViewDiary(tlog);
                                      else onAddDiary(slot.classId, slot.isoDate, slot.caDay);
                                    }}
                                    title={tlog ? `Đã ghi: ${tlog.present} có mặt` : (isFuture ? 'Buổi chưa đến' : 'Chưa ghi — click để ghi')}
                                    style={{ background:bg, border:`1px solid ${border}`, borderRadius:7, padding:'5px 7px', margin:'0 auto 3px', cursor, transition:'opacity 0.15s', maxWidth:100 }}
                                    onMouseEnter={e => { if (!isLockedFuture) (e.currentTarget as HTMLElement).style.opacity='0.8'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity='1'; }}
                                  >
                                    <p style={{ fontSize:11,fontWeight:800,color:textClr,margin:0,whiteSpace:'nowrap' }}>{slot.classId}</p>
                                    {slot.teacher && <p style={{ fontSize:9,color:'#64748b',margin:'1px 0 0',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{slot.teacher}</p>}
                                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                                      <ScheduleBadge status={tlog ? 'logged' : isFuture ? 'future' : 'pending'} />
                                    </div>
                                  </div>
                                );
                              })
                          }
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[
          { bg:'#ecfdf5', border:'#a7f3d0', color:'#065f46', label:'Đã ghi buổi học' },
          { bg:'#fefce8', border:'#fde68a', color:'#92400e', label:'Chưa ghi buổi học' },
          { bg:'#f8fafc', border:'#e2e8f0', color:'#94a3b8', label:'Buổi tương lai' },
        ].map(item => (
          <div key={item.label} style={{ display:'flex',alignItems:'center',gap:6 }}>
            <div style={{ width:12,height:12,background:item.bg,border:`1px solid ${item.border}`,borderRadius:3,flexShrink:0 }}/>
            <span style={{ fontSize:11,color:'#64748b' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  sub: OperationsSub; setSub: (sub: OperationsSub) => void;
  filtD: TeachingLog[]; pgD: number; setPgD: (p: number) => void;
  qD: string; setQD: (v: string) => void;
  dCls: string; setDCls: (v: string) => void;
  uClasses: Record<string, string>[]; IPP: number; students: Student[]; tlogs: TeachingLog[];
  teachers: Teacher[]; payments: Payment[]; curMo: number; curYr: number; isPaid: (sid: string, mo: number, yr: number) => boolean;
  leaveRequests: LeaveRequest[];
  onViewDiary: (log: TeachingLog) => void; onEditDiary: (log: TeachingLog) => void;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
  onApproveLeave: (id: string) => void; onRejectLeave: (id: string) => void;
}

export default function OperationsTab({ sub, setSub, filtD, pgD, setPgD, qD, setQD, dCls, setDCls, uClasses, IPP, students, tlogs, teachers, payments, curMo, curYr, isPaid, onViewDiary, onEditDiary, onAddDiary }: Props) {
  const [absClass, setAbsClass]   = useState('');
  const [absFocus, setAbsFocus] = useState<'all' | 'present' | 'absent' | 'excused' | 'streak'>('all');

  const paged = filtD.slice((pgD - 1) * IPP, pgD * IPP);
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  useEffect(() => {
    if (sub === 'lessons' && qD) setQD('');
  }, [sub, qD, setQD]);

  const classOptions = [{ value: '', label: 'Tất cả lớp' }, ...uClasses.map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] }))];

  const currentWeekSlots = useMemo(() => {
    const weekDates = getWeekDates(0);
    const result: ScheduledSlot[] = [];
    weekDates.forEach(date => {
      const dayCode = ['CN','T2','T3','T4','T5','T6','T7'][date.getDay()];
      uClasses.forEach(c => {
        getClassSlots(c).forEach(slotRaw => {
          const p = parseBuoi(slotRaw);
          if (!p || p.day !== dayCode) return;
          result.push({ date, isoDate: toISO(date), classId: getClassId(c), caDay: CA_SLOTS[p.caIdx], caIdx: p.caIdx, teacher: getClassTeacherName(c) });
        });
      });
    });
    return result;
  }, [uClasses]);

  const todaySlotCount = useMemo(() => {
    const today = new Date();
    return currentWeekSlots.filter(s => sameDay(s.date, today)).length;
  }, [currentWeekSlots]);

  const operationalAlerts = useMemo<OperationAlert[]>(() => {
    const alerts: OperationAlert[] = [];
    const activeStudents = students.filter(isStudentActive);
    const billableStudents = activeStudents.filter(s => isMonthBillable(s, curMo, curYr));

    uClasses.forEach(c => {
      const classId = getClassId(c);
      const teacherId = getClassTeacherId(c);
      const teacherName = getClassTeacherName(c);
      const slots = getClassSlots(c);
      if (!teacherId && !teacherName) alerts.push({ id: `class-teacher-${classId}`, kind: 'class', severity: 'high', title: 'Lớp thiếu giáo viên', detail: 'Chưa có MaGV/GiaoVien để điều phối lịch dạy.', target: classId || 'Lớp chưa rõ mã', action: 'Cập nhật giáo viên phụ trách' });
      if (slots.length === 0) alerts.push({ id: `class-slots-${classId}`, kind: 'class', severity: 'medium', title: 'Lớp thiếu lịch học', detail: 'Chưa có Buổi 1/2/3 nên lịch tuần không hiển thị.', target: classId || 'Lớp chưa rõ mã', action: 'Bổ sung lịch học' });
    });

    activeStudents.filter(s => !String(s.classId || '').trim()).forEach(s => {
      alerts.push({ id: `student-class-${s.id}`, kind: 'student', severity: 'high', title: 'HS đang học chưa có lớp', detail: 'Học sinh active nhưng chưa có classId/DangKyLop active.', target: `${s.id} · ${s.name}`, action: 'Gán lớp cho học sinh' });
    });

    teachers.filter(t => t.status === 'active').forEach(t => {
      const hasClass = uClasses.some(c => teacherMatchesClass(t, c)) || (t.classes || []).length > 0;
      if (!hasClass) alerts.push({ id: `teacher-class-${t.id}`, kind: 'teacher', severity: 'low', title: 'GV active chưa phụ trách lớp', detail: 'Giáo viên đang hoạt động nhưng chưa thấy lớp nào gắn MaGV/tên.', target: `${t.id} · ${t.name}`, action: 'Gán lớp nếu đang dạy' });
    });

    payments.filter(p => paymentInTuitionMonth(p, curMo, curYr)).forEach(p => {
      const missingStudent = !String(p.studentId || '').trim() || p.studentId === 'X';
      const missingClass = !String((p as any).maLop || (p as any).MaLop || (p as any).classId || '').trim();
      if (missingStudent || missingClass) alerts.push({ id: `payment-code-${p.id}`, kind: 'finance', severity: missingStudent ? 'high' : 'medium', title: 'Công nợ thiếu MaHS/MaLop', detail: `${missingStudent ? 'Thiếu MaHS' : ''}${missingStudent && missingClass ? ', ' : ''}${missingClass ? 'thiếu MaLop' : ''}.`, target: p.docNum || p.id, action: 'Kiểm tra phiếu thu' });
    });

    billableStudents.filter(s => !isPaid(s.id, curMo, curYr) && !String(s.classId || '').trim()).forEach(s => {
      alerts.push({ id: `billable-class-${s.id}`, kind: 'finance', severity: 'high', title: 'HS billable thiếu MaLop', detail: `Chưa đóng T${curMo}/${curYr} và chưa có lớp để nhắc phí đúng ngữ cảnh.`, target: `${s.id} · ${s.name}`, action: 'Gán lớp hoặc kiểm tra DangKyLop' });
    });

    return alerts;
  }, [students, uClasses, teachers, payments, curMo, curYr, isPaid]);

  /* Absence stats */
  const absStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; classId: string; parentPhone: string; absent: number; excused: number; present: number; streak: number }>();
    students.filter(s => s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === '')).forEach(s => map.set(s.id, { id: s.id, name: s.name, classId: s.classId, parentPhone: s.parentPhone || '', absent: 0, excused: 0, present: 0, streak: 0 }));
    tlogs.forEach(log => (log.attendanceList || []).forEach((a: any) => {
      const row = map.get(attendanceIdOf(a)); if (!row) return;
      const st = normalizeAttendanceStatus(getAttendanceStatus(a));
      if (st === 'absent') row.absent++; else if (st === 'excused') row.excused++; else row.present++;
    }));
    const byClass = new Map<string, any[]>();
    [...tlogs].sort((a: any, b: any) => parseDMY(b.rawDate||b.date) - parseDMY(a.rawDate||a.date))
      .forEach((l: any) => { if (!byClass.has(l.classId)) byClass.set(l.classId, []); byClass.get(l.classId)!.push(l); });
    students.forEach(s => {
      const row = map.get(s.id); if (!row) return;
      const logs = (byClass.get(s.classId) || []).slice(0, 10);
      let streak = 0;
      for (const log of logs) {
        const a = (log.attendanceList || []).find((a: any) => attendanceIdOf(a) === s.id);
        if (a && normalizeAttendanceStatus(getAttendanceStatus(a)) === 'absent') streak++; else if (a) break;
      }
      row.streak = streak;
    });
    return [...map.values()];
  }, [students, tlogs]);

  const absClasses = absStats.map(r => r.classId).filter((v, i, a) => a.indexOf(v) === i).sort();
  const filtAbs = useMemo(() => {
    return absStats
      .filter(r => !absClass || r.classId === absClass)
      .filter(r => absFocus === 'all' || (absFocus === 'present' ? r.present > 0 : absFocus === 'absent' ? r.absent > 0 : absFocus === 'excused' ? r.excused > 0 : r.streak >= 2))
      .sort((a, b) => absFocus === 'present' ? b.present - a.present : absFocus === 'excused' ? b.excused - a.excused : absFocus === 'streak' ? b.streak - a.streak : b.absent - a.absent);
  }, [absStats, absClass, absFocus]);

  const totalA = absStats.reduce((s, r) => s + r.absent, 0);
  const totalE = absStats.reduce((s, r) => s + r.excused, 0);
  const totalP = absStats.reduce((s, r) => s + r.present, 0);

  const monthLessons = useMemo(() => tlogs.filter(l => logInMonth(l, curMo, curYr)), [tlogs, curMo, curYr]);
  const monthLessonClassCount = useMemo(() => new Set(monthLessons.map(l => l.classId).filter(Boolean)).size, [monthLessons]);
  const monthAttendance = useMemo(() => {
    let present = 0, absent = 0, excused = 0;
    monthLessons.forEach(log => (log.attendanceList || []).forEach((a: any) => {
      const st = normalizeAttendanceStatus(getAttendanceStatus(a));
      if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
      else present++;
    }));
    return { present, absent, excused, total: present + absent + excused };
  }, [monthLessons]);
  const monthAttendancePct = monthAttendance.total > 0
    ? Math.round((monthAttendance.present / monthAttendance.total) * 100)
    : 0;
  const unrecordedSlots = useMemo(() => {
    const now = new Date();
    return currentWeekSlots.filter(slot => !isFutureSlot(slot, now) && !findMatchingTlog(slot, tlogs));
  }, [currentWeekSlots, tlogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header row — sub-tabs + compact filters ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Vận hành</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Theo dõi lịch dạy, buổi học và chuyên cần
          </p>
        </div>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Sub-tab switcher */}
        <div style={{ padding: 3, background: '#f1f5f9', borderRadius: 12 }}>
          <FilterTabs variant="segment" size="sm" active={sub} onChange={id => setSub(id as Sub)}
            tabs={SUBS.map(s => ({ id: s.id, label: s.label, icon: <s.icon size={12} /> }))} />
        </div>

        {/* Buổi học: chỉ filter lớp */}
        {sub === 'lessons' && (<>
          <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
          <Select value={dCls} onChange={v => { setDCls(v); setPgD(1); }} options={classOptions} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: 6, flexShrink: 0 }}>
            Hiển thị {filtD.length} buổi học
          </span>
        </>)}

        {/* Chuyên cần: filter lớp */}
        {sub === 'attendance' && (<>
          <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
          <Select value={absClass} onChange={setAbsClass} options={[{ value: '', label: 'Tất cả lớp' }, ...absClasses.map(c => ({ value: c, label: c }))]} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, flexShrink: 0 }}>
            Hiển thị {filtAbs.length} HS
          </span>
        </>)}
        {sub === 'schedule' && <Button
          intent="secondary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={() => onAddDiary()}
          style={{ marginLeft: 'auto' }}
        >
          Ghi buổi học
        </Button>}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StatGrid>
            <StatBlock icon={Calendar} value={todaySlotCount} label="Lớp hôm nay" sub={formatDate(new Date().toISOString())} gradient="linear-gradient(135deg,#6366f1,#4f46e5)" onClick={() => setSub('schedule')} actionLabel="Xem lịch" />
            <StatBlock icon={BookOpen} value={monthLessons.length} label="Buổi học tháng này" sub={`${monthLessonClassCount} lớp có phát sinh`} gradient="linear-gradient(135deg,#0ea5e9,#0284c7)" onClick={() => setSub('lessons')} actionLabel="Xem buổi" />
            <StatBlock icon={Users} value={monthAttendance.total > 0 ? `${monthAttendancePct}%` : '---'} label="Tỷ lệ chuyên cần" sub={`${monthAttendance.total} lượt điểm danh`} gradient="linear-gradient(135deg,#10b981,#059669)" onClick={() => { setAbsFocus('all'); setSub('attendance'); }} actionLabel="Xem" />
            <StatBlock icon={AlertTriangle} value={monthAttendance.absent} label="Lượt vắng" sub={monthAttendance.absent > 0 ? 'Cần theo dõi' : 'Đã ổn'} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" onClick={() => { setAbsFocus('absent'); setSub('attendance'); }} actionLabel="Xem vắng" />
            <StatBlock icon={Clock} value={monthAttendance.excused} label="Lượt có phép" sub="Không tính là vắng không phép" gradient="linear-gradient(135deg,#f59e0b,#d97706)" onClick={() => { setAbsFocus('excused'); setSub('attendance'); }} actionLabel="Xem có phép" />
            {unrecordedSlots.length > 0 && (
              <StatBlock icon={School} value={unrecordedSlots.length} label="Buổi chưa ghi nhận" sub="từ lịch tuần này" gradient="linear-gradient(135deg,#f97316,#ea580c)" onClick={() => setSub('schedule')} actionLabel="Xem lịch" />
            )}
          </StatGrid>

          <div style={TABLE_WRAP}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    {['Mức', 'Nhóm', 'Cảnh báo vận hành', 'Đối tượng', 'Gợi ý xử lý'].map((h, i) => (
                      <th key={h} style={{ ...TH_SHARED, textAlign: i === 0 ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operationalAlerts.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '44px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Không có cảnh báo vận hành quan trọng</td></tr>
                  ) : operationalAlerts.slice(0, 8).map((a, i) => {
                    const sevColor = a.severity === 'high' ? 'rose' : a.severity === 'medium' ? 'amber' : 'slate';
                    const kindLabel = a.kind === 'class' ? 'Lớp' : a.kind === 'student' ? 'Học sinh' : a.kind === 'teacher' ? 'Giáo viên' : 'Công nợ';
                    return (
                      <tr key={a.id} style={trStyle(i, false)}>
                        <td style={{ ...TD_SHARED, textAlign: 'center' }}><Badge color={sevColor as any}>{a.severity === 'high' ? 'Cao' : a.severity === 'medium' ? 'Vừa' : 'Nhẹ'}</Badge></td>
                        <td style={TD_SHARED}><Badge color={a.kind === 'finance' ? 'emerald' : a.kind === 'teacher' ? 'sky' : a.kind === 'student' ? 'amber' : 'indigo'}>{kindLabel}</Badge></td>
                        <td style={TD_SHARED}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{a.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{a.detail}</p>
                        </td>
                        <td style={{ ...TD_SHARED, fontWeight: 700, color: '#334155' }}>{a.target}</td>
                        <td style={{ ...TD_SHARED, color: '#475569' }}>{a.action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── LESSON TABLE ── */}
      {sub === 'lessons' && (
        <div style={TABLE_WRAP}>
          {/* Desktop table */}
          <div className="diary-desktop-table" style={{ overflowX: 'auto' }}>
            <style>{`@media(max-width:767px){.diary-desktop-table{display:none!important}}.diary-mobile-cards{display:none}@media(max-width:767px){.diary-mobile-cards{display:block!important}}`}</style>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr>
                  {['Ngày', 'Lớp', 'Ca dạy', 'Nội dung bài dạy', 'Có mặt', 'Vắng', 'Có phép', 'Thao tác'].map((h, i) => (
                    <th key={h} style={{ ...TH_SHARED, textAlign: i >= 4 ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0
                  ? <tr><td colSpan={8} style={{ padding: '52px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 36 }}>📖</span>
                        <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 14, margin: 0 }}>Chưa có buổi học nào</p>
                      </div>
                    </td></tr>
                  : paged.map((l, i) => (
                    <tr key={`${l.classId}-${l.date}-${l.caDay}`} onMouseEnter={() => setHovIdx(i)} onMouseLeave={() => setHovIdx(null)} style={trStyle(i, hovIdx === i)}>
                      <td style={{ ...TD_SHARED, fontSize: 12, color: '#475569', fontWeight: 600 }}>{formatDate(l.date)}</td>
                      <td style={TD_SHARED}><Badge color="indigo">{l.classId}</Badge></td>
                      <td style={TD_SHARED}>
                        {l.caDay ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px' }}><Clock size={10} color="#b45309" />{l.caDay}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ ...TD_SHARED, maxWidth: 240 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{l.content}</p>
                        {l.homework && l.homework !== '---' && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>📖 {l.homework}</p>}
                      </td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: '#ecfdf5', fontWeight: 800, color: '#059669', fontSize: 14 }}>{l.present}</span></td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: '#fff1f2', fontWeight: 800, color: '#e11d48', fontSize: 14 }}>{l.absent}</span></td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: '#fffbeb', fontWeight: 800, color: '#d97706', fontSize: 14 }}>{l.excused || 0}</span></td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                        <TableActions compact actions={[
                          { icon: <Eye size={13} />, label: 'Xem', intent: 'primary', onClick: () => onViewDiary(l) },
                          { icon: <Edit3 size={13} />, label: 'Sửa', intent: 'warning', onClick: () => onEditDiary(l) },
                        ]} />
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="diary-mobile-cards">
            {paged.length === 0
              ? <div style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 32 }}>📖</span>
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, margin: 0 }}>Chưa có buổi học nào</p>
                </div>
              : paged.map((l, i) => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f9fafc' }}>
                  {/* Row 1: date + class + ca */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{formatDate(l.date)}</span>
                    <Badge color="indigo">{l.classId}</Badge>
                    {l.caDay && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: 4 }}><Clock size={9} color="#b45309" />{l.caDay}</span>}
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: 4 }}>✓ {l.present}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '2px 7px', borderRadius: 4 }}>✗ {l.absent}</span>
                      {(l.excused || 0) > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: 4 }}>Có phép {l.excused}</span>}
                    </span>
                  </div>
                  {/* Row 2: content */}
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 4px', lineHeight: 1.4 }}>{l.content}</p>
                  {l.homework && l.homework !== '---' && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>📖 BTVN: {l.homework}</p>}
                  {/* Row 3: actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => onViewDiary(l)} style={{ flex: 1, padding: '6px 0', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Xem chi tiết</button>
                    <button onClick={() => onEditDiary(l)} style={{ flex: 1, padding: '6px 0', background: '#fffbeb', color: '#b45309', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sửa</button>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
            <Pager page={pgD} total={filtD.length} perPage={IPP} setPage={setPgD} showTotal />
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {sub === 'schedule' && (
        <WeeklyCalendar
          uClasses={uClasses}
          tlogs={tlogs}
          onAddDiary={onAddDiary}
          onViewDiary={onViewDiary}
        />
      )}

      {/* ── ATTENDANCE ── */}
      {sub === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...TABLE_WRAP, padding: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Nhóm chuyên cần
            </span>
            <FilterTabs
              variant="pill"
              size="sm"
              active={absFocus}
              onChange={id => setAbsFocus(id as typeof absFocus)}
              tabs={[
                { id: 'all', label: 'Tất cả', count: absStats.length },
                { id: 'present', label: 'Có mặt', count: totalP },
                { id: 'absent', label: 'Vắng', count: totalA },
                { id: 'excused', label: 'Có phép', count: totalE },
              ]}
            />
          </div>

          {/* Absence table */}
          <div style={TABLE_WRAP}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH_SHARED, width: 36, textAlign: 'center' }}>#</th>
                    <th style={TH_SHARED}>Học sinh</th>
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Lớp</th>
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Vắng</th>
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Có phép</th>
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Có mặt</th>
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Vắng liên tiếp</th>
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Liên hệ PH</th>
                  </tr>
                </thead>
                <tbody>
                  {filtAbs.length === 0
                    ? <tr><td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>🎉 Chưa có dữ liệu vắng</td></tr>
                    : filtAbs.map((r, i) => {
                      const ph = String(r.parentPhone || '').replace(/\D/g, '');
                      const isH = r.absent >= 5 || r.streak >= 3, isM = r.absent >= 3 || r.streak >= 2;
                      return (
                        <tr key={r.id} style={{ background: isH ? '#fff1f2' : isM ? '#fff7ed' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ ...TD_SHARED, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                          <td style={TD_SHARED}>
                            <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 13 }}>{r.name}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{r.id}</p>
                          </td>
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}><Badge color="indigo">{r.classId}</Badge></td>
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ fontSize: 14, fontWeight: 800, color: r.absent === 0 ? '#cbd5e1' : isH ? '#e11d48' : isM ? '#f97316' : '#374151' }}>{r.absent || '—'}</span></td>
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 600, color: r.excused > 0 ? '#d97706' : '#cbd5e1' }}>{r.excused || '—'}</span></td>
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{r.present || '—'}</span></td>
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                            {r.streak >= 2 ? <span style={{ fontSize: 11, fontWeight: 700, background: '#fff1f2', color: '#e11d48', padding: '2px 8px' }}>{r.streak} buổi</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                            {ph.length >= 9
                              ? <a href={`https://zalo.me/${ph}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 9px', textDecoration: 'none' }}><Phone size={11} />Zalo</a>
                              : <span style={{ color: '#cbd5e1' }}>—</span>
                            }
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
