/**
 * OperationsTab.tsx — v27.1
 * ✅ Thống kê vắng: filters inline với sub-tab header
 * ✅ AppTable cho tất cả bảng
 * ✅ StatBlock cho Thống kê vắng
 */
import React, { useState, useMemo } from 'react';
import { BookOpen, Calendar, AlertTriangle, Eye, Edit3, Clock, Phone } from 'lucide-react';
import { formatDate, parseDMY } from './helpers';
import { Badge, Pager, FilterTabs, SearchBar, Select, TableActions } from './dsComponents';
import { FAB } from './AppComponents';
import { StatBlock, StatGrid, AppTable, TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import type { Student, TeachingLog, LeaveRequest } from './types';

type Sub = 'diary' | 'schedule' | 'absence';
const SUBS = [
  { id: 'diary'    as Sub, label: 'Nhật ký giảng dạy', icon: BookOpen    },
  { id: 'schedule' as Sub, label: 'Lịch dạy',           icon: Calendar   },
  { id: 'absence'  as Sub, label: 'Thống kê vắng',      icon: AlertTriangle },
];

const DAYS     = ['T2','T3','T4','T5','T6','T7','CN'];
const DAY_FULL: Record<string, string> = { T2:'Thứ 2',T3:'Thứ 3',T4:'Thứ 4',T5:'Thứ 5',T6:'Thứ 6',T7:'Thứ 7',CN:'Chủ nhật' };
const CA_SLOTS = ['7h30','9h','13h30','15h30','17h30','19h30'];
const CA_MINS  = [7*60+30, 9*60, 13*60+30, 15*60+30, 17*60+30, 19*60+30];

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

function TeacherTimetable({ teacherName, uClasses }: { teacherName: string; uClasses: any[] }) {
  const myClasses = uClasses.filter(c => String(c['Giáo viên'] || '').toLowerCase().includes(teacherName.split(' ').pop()!.toLowerCase()));
  const grid: Record<number, Record<string, { classId: string }[]>> = {};
  CA_SLOTS.forEach((_, i) => { grid[i] = {}; DAYS.forEach(d => { grid[i][d] = []; }); });
  myClasses.forEach(c => { ['Buổi 1','Buổi 2','Buổi 3'].forEach(b => { const p = parseBuoi(c[b] || ''); if (p) grid[p.caIdx][p.day].push({ classId: c['Mã Lớp'] }); }); });

  return (
    <div style={{ border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={13} color="white" /></div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: 0 }}>TKB — {teacherName}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{myClasses.length} lớp phụ trách</p>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ ...TH_SHARED, width: 68, textAlign: 'left' }}>Ca học</th>
              {DAYS.map(d => <th key={d} style={{ ...TH_SHARED, textAlign: 'center' }}>{DAY_FULL[d] || d}</th>)}
            </tr>
          </thead>
          <tbody>
            {CA_SLOTS.map((ca, ci) => (
              <tr key={ca} style={trStyle(ci)}>
                <td style={{ ...TD_SHARED, padding: '8px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#6366f1' }}>
                    <Clock size={10} color="#6366f1" />{ca}
                  </span>
                </td>
                {DAYS.map(d => {
                  const cells = grid[ci][d] || [];
                  return (
                    <td key={d} style={{ ...TD_SHARED, textAlign: 'center', padding: '7px 5px' }}>
                      {cells.length === 0
                        ? <span style={{ color: '#e2e8f0', fontSize: 15 }}>—</span>
                        : cells.map((cell, k) => (
                          <div key={k} style={{ display: 'inline-block', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 9px', margin: 2 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: '#4338ca', margin: 0 }}>{cell.classId}</p>
                          </div>
                        ))
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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
      logDate = new Date(raw.slice(0,10));
    } else {
      const ts = parseDMY(raw); if (ts) logDate = new Date(ts);
    }
    if (!logDate || !sameDay(logDate, slot.date)) return false;
    // caDay match nếu có
    if (l.caDay && slot.caDay && l.caDay !== slot.caDay) return false;
    return true;
  });
}

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
                      const isPast  = d < today && !isToday;
                      return (
                        <td key={di} style={{ ...TD_SHARED, textAlign:'center', padding:'6px 5px', background: isToday ? (cellSlots.length > 0 ? undefined : '#fafbff') : 'transparent', borderLeft: isToday ? '1px solid #c7d2fe' : undefined, borderRight: isToday ? '1px solid #c7d2fe' : undefined, verticalAlign:'top' }}>
                          {cellSlots.length === 0
                            ? <span style={{ color:'#e2e8f0',fontSize:14 }}>—</span>
                            : cellSlots.map((slot, k) => {
                                const tlog = findMatchingTlog(slot, tlogs);
                                const isFuture = d > today;
                                const bg      = tlog ? '#ecfdf5' : (isFuture ? '#f8fafc' : '#fefce8');
                                const border  = tlog ? '#a7f3d0' : (isFuture ? '#e2e8f0' : '#fde68a');
                                const textClr = tlog ? '#065f46' : (isFuture ? '#94a3b8' : '#92400e');
                                const cursor  = isFuture ? 'default' : 'pointer';
                                return (
                                  <div key={k}
                                    onClick={() => {
                                      if (isFuture) return;
                                      if (tlog) onViewDiary(tlog);
                                      else onAddDiary(slot.classId, slot.isoDate, slot.caDay);
                                    }}
                                    title={tlog ? `Đã ghi: ${tlog.present} có mặt` : (isFuture ? 'Buổi chưa đến' : 'Chưa ghi — click để ghi')}
                                    style={{ background:bg, border:`1px solid ${border}`, borderRadius:7, padding:'5px 7px', margin:'0 auto 3px', cursor, transition:'opacity 0.15s', maxWidth:100 }}
                                    onMouseEnter={e => { if (!isFuture) (e.currentTarget as HTMLElement).style.opacity='0.8'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity='1'; }}
                                  >
                                    <p style={{ fontSize:11,fontWeight:800,color:textClr,margin:0,whiteSpace:'nowrap' }}>{slot.classId}</p>
                                    {tlog
                                      ? <p style={{ fontSize:10,color:'#059669',margin:'2px 0 0',fontWeight:600 }}>✓ {tlog.present}/{tlog.present+(tlog.absent||0)+(tlog.late||0)}</p>
                                      : <p style={{ fontSize:10,color:textClr,margin:'2px 0 0',opacity:0.8 }}>{isFuture ? '—' : '! Chưa ghi'}</p>
                                    }
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
          { bg:'#ecfdf5', border:'#a7f3d0', color:'#065f46', label:'Đã ghi nhật ký' },
          { bg:'#fefce8', border:'#fde68a', color:'#92400e', label:'Chưa ghi (click để ghi)' },
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
  filtD: TeachingLog[]; pgD: number; setPgD: (p: number) => void;
  qD: string; setQD: (v: string) => void;
  dCls: string; setDCls: (v: string) => void;
  uClasses: Record<string, string>[]; IPP: number; students: Student[]; tlogs: TeachingLog[];
  leaveRequests: LeaveRequest[];
  onViewDiary: (log: TeachingLog) => void; onEditDiary: (log: TeachingLog) => void;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
  onApproveLeave: (id: string) => void; onRejectLeave: (id: string) => void;
}

export default function OperationsTab({ filtD, pgD, setPgD, qD, setQD, dCls, setDCls, uClasses, IPP, students, tlogs, onViewDiary, onEditDiary, onAddDiary }: Props) {
  const [sub, setSub] = useState<Sub>('diary');
  const [absSearch, setAbsSearch] = useState('');
  const [absClass, setAbsClass]   = useState('');
  const [absSort, setAbsSort]     = useState<'absent' | 'late' | 'name'>('absent');

  const paged = filtD.slice((pgD - 1) * IPP, pgD * IPP);
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  const teachers = useMemo(() => { const s = new Set<string>(); uClasses.forEach(c => { if (c['Giáo viên'] && c['Giáo viên'] !== '---') s.add(c['Giáo viên']); }); return [...s]; }, [uClasses]);
  const classOptions = [{ value: '', label: 'Tất cả lớp' }, ...uClasses.map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] }))];

  /* Absence stats */
  const absStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; classId: string; parentPhone: string; absent: number; late: number; present: number; streak: number }>();
    students.filter(s => s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === '')).forEach(s => map.set(s.id, { id: s.id, name: s.name, classId: s.classId, parentPhone: s.parentPhone || '', absent: 0, late: 0, present: 0, streak: 0 }));
    // Support both GAS v29 camelCase (trangThai) and legacy Vietnamese keys ('Trạng thái')
    const getStatus = (a: any) => a.trangThai || a['Trạng thái'] || a.TrangThai || '';
    const getId = (a: any) => a.maHS || a['Mã HS'] || a.MaHS || '';
    tlogs.forEach(log => (log.attendanceList || []).forEach((a: any) => {
      const row = map.get(getId(a)); if (!row) return;
      const st = getStatus(a);
      if (st === 'Vắng') row.absent++; else if (st === 'Muộn') row.late++; else if (st === 'Có mặt') row.present++;
    }));
    const byClass = new Map<string, any[]>();
    [...tlogs].sort((a: any, b: any) => parseDMY(b.rawDate||b.date) - parseDMY(a.rawDate||a.date))
      .forEach((l: any) => { if (!byClass.has(l.classId)) byClass.set(l.classId, []); byClass.get(l.classId)!.push(l); });
    students.forEach(s => {
      const row = map.get(s.id); if (!row) return;
      const logs = (byClass.get(s.classId) || []).slice(0, 10);
      let streak = 0;
      for (const log of logs) {
        const a = (log.attendanceList || []).find((a: any) => getId(a) === s.id);
        if (a && getStatus(a) === 'Vắng') streak++; else if (a) break;
      }
      row.streak = streak;
    });
    return [...map.values()];
  }, [students, tlogs]);

  const absClasses = [...new Set(absStats.map(r => r.classId))].sort();
  const filtAbs = useMemo(() => {
    const q = absSearch.toLowerCase();
    return absStats.filter(r => (!q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) && (!absClass || r.classId === absClass)).sort((a, b) => absSort === 'absent' ? b.absent - a.absent : absSort === 'late' ? b.late - a.late : a.name.localeCompare(b.name));
  }, [absStats, absSearch, absClass, absSort]);

  const totalA = absStats.reduce((s, r) => s + r.absent, 0);
  const totalL = absStats.reduce((s, r) => s + r.late, 0);
  const withA  = absStats.filter(r => r.absent > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header row — sub-tabs + (diary filters) + (absence filters inline) ── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, flexShrink: 0 }}>Vận hành</h2>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Sub-tab switcher */}
        <div style={{ padding: 3, background: '#f1f5f9' }}>
          <FilterTabs variant="segment" size="sm" active={sub} onChange={id => setSub(id as Sub)}
            tabs={SUBS.map(s => ({ id: s.id, label: s.label, icon: <s.icon size={12} /> }))} />
        </div>

        {/* Diary — chỉ hiện badge đếm */}
        {sub === 'diary' && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: 6, flexShrink: 0 }}>{filtD.length} buổi</span>
        )}

        {/* Absence filters — inline with header */}
        {sub === 'absence' && (<>
          <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
          <SearchBar value={absSearch} onChange={setAbsSearch} placeholder="Tìm học sinh..." width={180} />
          <Select value={absClass} onChange={setAbsClass} options={[{ value: '', label: 'Tất cả lớp' }, ...absClasses.map(c => ({ value: c, label: c }))]} />
          <Select value={absSort} onChange={v => setAbsSort(v as any)} options={[{ value: 'absent', label: 'Vắng nhiều nhất' }, { value: 'late', label: 'Muộn nhiều nhất' }, { value: 'name', label: 'Tên A-Z' }]} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, flexShrink: 0 }}>{filtAbs.length} HS</span>
        </>)}
      </div>

      {/* ── DIARY TABLE ── */}
      {sub === 'diary' && (
        <div style={TABLE_WRAP}>
          {/* Desktop table */}
          <div className="diary-desktop-table" style={{ overflowX: 'auto' }}>
            <style>{`@media(max-width:767px){.diary-desktop-table{display:none!important}}.diary-mobile-cards{display:none}@media(max-width:767px){.diary-mobile-cards{display:block!important}}`}</style>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr>
                  {['Ngày', 'Lớp', 'Ca dạy', 'Nội dung bài dạy', 'Có mặt', 'Vắng', 'Thao tác'].map((h, i) => (
                    <th key={h} style={{ ...TH_SHARED, textAlign: i >= 4 ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0
                  ? <tr><td colSpan={7} style={{ padding: '52px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 36 }}>📖</span>
                        <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 14, margin: 0 }}>Chưa có nhật ký nào</p>
                        <button onClick={onAddDiary} style={{ padding: '7px 18px', background: '#7c3aed', color: '#64748b', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: 6 }}>+ Ghi buổi đầu tiên</button>
                      </div>
                    </td></tr>
                  : paged.map((l, i) => (
                    <tr key={i} onMouseEnter={() => setHovIdx(i)} onMouseLeave={() => setHovIdx(null)} style={trStyle(i, hovIdx === i)}>
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
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, margin: 0 }}>Chưa có nhật ký nào</p>
                  <button onClick={onAddDiary} style={{ padding: '8px 18px', background: '#7c3aed', color: '#64748b', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: 8 }}>+ Ghi buổi đầu tiên</button>
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

      {/* ── ABSENCE ── */}
      {sub === 'absence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stat blocks */}
          <StatGrid>
            <StatBlock icon={AlertTriangle} value={withA}  label="HS có buổi vắng" sub="trong tổng số HS active"  gradient="linear-gradient(135deg,#f43f5e,#e11d48)" />
            <StatBlock icon={AlertTriangle} value={totalA} label="Tổng buổi vắng"   sub="toàn bộ ghi nhận"         gradient="linear-gradient(135deg,#f97316,#ea580c)" />
            <StatBlock icon={Clock}         value={totalL} label="Tổng buổi muộn"   sub="toàn bộ ghi nhận"         gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
          </StatGrid>

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
                    <th style={{ ...TH_SHARED, textAlign: 'center' }}>Muộn</th>
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
                          <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 600, color: r.late > 0 ? '#d97706' : '#cbd5e1' }}>{r.late || '—'}</span></td>
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

      {sub === 'diary' && <FAB onClick={onAddDiary} label="Ghi buổi dạy mới" color="#7c3aed" shadow="0 8px 24px rgba(124,58,237,0.5)" />}
    </div>
  );
}
