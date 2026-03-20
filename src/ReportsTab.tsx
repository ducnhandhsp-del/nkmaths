/**
 * ReportsTab.tsx — v28.1
 * ✅ StatBlock (horizontal) cho KPIs theo tab
 * ✅ [v28.1] Fix: dùng isStudentActive thay vì check status đơn lẻ
 * ✅ [v28.1] Fix: parseMoYr fallback dùng parseDMY thay vì new Date()
 * ✅ [v28.1] Học phí: bảng thống kê tháng học theo buổi (12 buổi/tháng) và theo tuần (4 tuần/tháng)
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Printer, School, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fmtVND, parseDMY, exportCSV, isStudentActive } from './helpers';
import { Badge, FilterTabs } from './dsComponents';
import { StatBlock, StatGrid, TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle, fmtM } from './AppComponents';
import type { Student, Payment, Expense, SummaryData } from './types';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316'];
const ACADEMIC_ORDER = ['Xuất sắc','Giỏi','Khá','Trung bình','Yếu','Chưa xác định'];
type ReportType = 'revenue' | 'attendance' | 'academic';

interface Props {
  students: Student[]; payments: Payment[]; expenses: Expense[];
  tlogs: any[]; uClasses: any[]; summary: SummaryData | null;
  curMo: number; curYr: number; isPaid: (sid: string, mo: number, yr: number) => boolean;
}

function parseMoYr(raw: string): { m: number; y: number } | null {
  const s = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return { m: parseInt(s.split('/')[1]), y: parseInt(s.split('/')[2]) };
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return { m: parseInt(s.slice(5,7)), y: parseInt(s.slice(0,4)) };
  // BUG FIX: dùng parseDMY (timezone-safe) thay vì new Date(raw) UTC
  const ts = parseDMY(raw);
  if (ts) { const d = new Date(ts); return { m: d.getMonth()+1, y: d.getFullYear() }; }
  return null;
}

/** Tính ISO week key: "YYYY-WNN" để đếm số tuần học riêng biệt */
export default function ReportsTab({ students, payments, expenses, tlogs, uClasses, summary, curMo, curYr, isPaid }: Props) {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [filterMo, setFilterMo] = useState(curMo);
  const [filterYr, setFilterYr] = useState(curYr);

  // Bug6 FIX: sync khi prop curMo/curYr thay đổi (app chạy qua đêm sang tháng mới)
  // chỉ sync nếu user đang xem tháng hiện tại (không override nếu đã navigate sang tháng khác)
  const prevCurMoRef = useRef(curMo);
  const prevCurYrRef = useRef(curYr);
  useEffect(() => {
    if (curMo !== prevCurMoRef.current || curYr !== prevCurYrRef.current) {
      if (filterMo === prevCurMoRef.current && filterYr === prevCurYrRef.current) {
        setFilterMo(curMo);
        setFilterYr(curYr);
      }
      prevCurMoRef.current = curMo;
      prevCurYrRef.current = curYr;
    }
  }, [curMo, curYr, filterMo, filterYr]);
  const prevMonth = () => { if (filterMo === 1) { setFilterMo(12); setFilterYr(y => y-1); } else setFilterMo(m => m-1); };
  const nextMonth = () => { if (filterMo === 12) { setFilterMo(1); setFilterYr(y => y+1); } else setFilterMo(m => m+1); };
  const isCurrentMonth = filterMo === curMo && filterYr === curYr;

  const moPayments = useMemo(() => payments.filter(p => { const r = parseMoYr(p.date||''); return r?.m===filterMo && r?.y===filterYr; }), [payments,filterMo,filterYr]);
  const moExpenses = useMemo(() => expenses.filter(e => { const r = parseMoYr(e.date||''); return r?.m===filterMo && r?.y===filterYr; }), [expenses,filterMo,filterYr]);
  const moTlogs   = useMemo(() => tlogs.filter(l => { const ts = parseDMY(l.date||''); if (!ts) return false; const d = new Date(ts); return d.getMonth()+1===filterMo && d.getFullYear()===filterYr; }), [tlogs,filterMo,filterYr]);

  const moRevenue = moPayments.reduce((s, p) => s+p.amount, 0);
  const moExpense = moExpenses.reduce((s, e) => s+e.amount, 0);
  // FIX: dùng isStudentActive thay vì chỉ check status
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);
  const active = activeStudents.length;
  
  const revenueByClass = useMemo(() => {
    const map: Record<string, {revenue:number;count:number;teacher:string}> = {};
    uClasses.forEach(c => { map[c['Mã Lớp']] = {revenue:0,count:0,teacher:c['Giáo viên']||'---'}; });
    moPayments.forEach(p => { const st = students.find(s => s.id===p.studentId); const cls = st?.classId||'Không rõ'; if (!map[cls]) map[cls]={revenue:0,count:0,teacher:'---'}; map[cls].revenue+=p.amount; map[cls].count++; });
    return Object.entries(map).filter(([,v]) => v.revenue>0).map(([cls,v]) => ({cls,...v,avg:v.count>0?Math.round(v.revenue/v.count):0})).sort((a,b) => b.revenue-a.revenue);
  }, [moPayments,students,uClasses]);

  const teacherRevenue = useMemo(() => {
    const map: Record<string, {revenue:number;students:number;paid:number;sessions:number;classes:Set<string>}> = {};
    // FIX: chỉ tính HS active
    activeStudents.forEach(s => { const t = s.teacher||'Chưa xác định'; if (!map[t]) map[t]={revenue:0,students:0,paid:0,sessions:0,classes:new Set()}; map[t].students++; if (isPaid(s.id,filterMo,filterYr)) map[t].paid++; if (s.classId) map[t].classes.add(s.classId); });
    moPayments.forEach(p => { const st = students.find(s => s.id===p.studentId); const t = st?.teacher||'Chưa xác định'; if (!map[t]) map[t]={revenue:0,students:0,paid:0,sessions:0,classes:new Set()}; map[t].revenue+=p.amount; });
    moTlogs.forEach(l => { const cls = uClasses.find(c => c['Mã Lớp']===l.classId); const t = cls?.['Giáo viên']||'Chưa xác định'; if (!map[t]) map[t]={revenue:0,students:0,paid:0,sessions:0,classes:new Set()}; map[t].sessions++; });
    return Object.entries(map).map(([fullName,v]) => ({fullName,...v,classList:[...v.classes].join(', '),avgPerSession:v.sessions>0?Math.round(v.revenue/v.sessions):0}));
  }, [activeStudents,students,moPayments,moTlogs,isPaid,filterMo,filterYr,uClasses]);

  const attendanceStats = useMemo(() => {
    const map: Record<string, {present:number;absent:number;late:number}> = {};
    uClasses.forEach(c => { map[c['Mã Lớp']]={present:0,absent:0,late:0}; });
    moTlogs.forEach(l => { if (!map[l.classId]) map[l.classId]={present:0,absent:0,late:0}; map[l.classId].present+=l.present||0; map[l.classId].absent+=l.absent||0; map[l.classId].late+=l.late||0; });
    return Object.entries(map).map(([cls,v]) => { const total=v.present+v.absent+v.late; return {cls,...v,total,pct:total>0?Math.round(v.present/total*100):0}; }).filter(r => r.total>0).sort((a,b) => b.pct-a.pct);
  }, [moTlogs,uClasses]);

  const academicDist = useMemo(() => {
    const m: Record<string,number> = {};
    students.forEach(s => {
      const k = (s.academicLevel && s.academicLevel.trim()) ? s.academicLevel.trim() : 'Chưa xác định';
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const ai = ACADEMIC_ORDER.indexOf(a.name);
        const bi = ACADEMIC_ORDER.indexOf(b.name);
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
  }, [students]);

  // FIX: dùng isStudentActive cho feeByClass
  const kpiConfig = {
    revenue:    [
      {icon:TrendingUp,  value:fmtM(moRevenue),          label:`Tổng thu T${filterMo}`,    sub:`${moPayments.length} phiếu`,   gradient:'linear-gradient(135deg,#10b981,#059669)'},
      {icon:TrendingDown,value:fmtM(moExpense),          label:`Tổng chi T${filterMo}`,    sub:`${moExpenses.length} phiếu`,   gradient:'linear-gradient(135deg,#f43f5e,#e11d48)'},
      {icon:DollarSign,  value:fmtM(moRevenue-moExpense),label:'Lợi nhuận tháng',          sub:moRevenue>=moExpense?'Dương':'Âm',gradient:(moRevenue-moExpense)>=0?'linear-gradient(135deg,#6366f1,#4f46e5)':'linear-gradient(135deg,#f97316,#ea580c)'},
      {icon:DollarSign,  value:fmtM(summary?.totalRevenue ?? 0), label:'Tổng thu niên khóa', sub:`${payments.length} phiếu thu`, gradient:'linear-gradient(135deg,#10b981,#059669)'},
    ],
    attendance: [
      {icon:BookOpen,    value:moTlogs.length,            label:'Tổng buổi dạy',            sub:`T${filterMo}/${filterYr}`,     gradient:'linear-gradient(135deg,#6366f1,#4f46e5)'},
      {icon:Users,       value:moTlogs.reduce((s,l)=>s+(l.present||0),0), label:'Lượt có mặt', sub:'tổng', gradient:'linear-gradient(135deg,#10b981,#059669)'},
      {icon:TrendingDown,value:moTlogs.reduce((s,l)=>s+(l.absent||0),0),  label:'Lượt vắng',   sub:'tổng', gradient:'linear-gradient(135deg,#f43f5e,#e11d48)'},
      {icon:BarChart3,   value:moTlogs.reduce((s,l)=>s+(l.present||0)+(l.absent||0)+(l.late||0),0)>0?`${Math.round(moTlogs.reduce((s,l)=>s+(l.present||0),0)/moTlogs.reduce((s,l)=>s+(l.present||0)+(l.absent||0)+(l.late||0),0)*100)}%`:'—', label:'Tỷ lệ CC', sub:'trung bình', gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
    ],
    academic:   [
      {icon:Users,       value:students.length,           label:'Tổng học sinh',            sub:`${active} đang học`,           gradient:'linear-gradient(135deg,#6366f1,#7c3aed)'},
      {icon:TrendingUp,  value:students.filter(s=>['Xuất sắc','Giỏi'].includes(s.academicLevel)).length, label:'Xuất sắc + Giỏi', sub:'học sinh', gradient:'linear-gradient(135deg,#10b981,#059669)'},
      {icon:BarChart3,   value:students.filter(s=>['Khá','Trung bình'].includes(s.academicLevel)).length,label:'Khá + TB',         sub:'học sinh', gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
      {icon:TrendingDown,value:students.filter(s=>s.academicLevel==='Yếu').length,                        label:'Yếu',             sub:'học sinh', gradient:'linear-gradient(135deg,#f43f5e,#e11d48)'},
    ],
    fee:        [],
  };

  const [hovR, setHovR] = useState<number|null>(null);
  const [hovT, setHovT] = useState<number|null>(null);
  const [hovA, setHovA] = useState<number|null>(null);

  const handleExport = () => {
    const mo = `t${filterMo}-${filterYr}`;
    if (reportType === 'revenue') {
      exportCSV(`doanh-thu-${mo}`,
        ['Lớp', 'Giáo viên', 'Số phiếu', 'Doanh thu'],
        revenueByClass.map(r => [r.cls, r.teacher, r.count, r.revenue])
      );
    } else if (reportType === 'attendance') {
      exportCSV(`chuyen-can-${mo}`,
        ['Lớp', 'Số buổi', 'Có mặt', 'Vắng', 'Muộn', 'Tỷ lệ (%)'],
        attendanceStats.map(r => [r.cls, moTlogs.filter(l=>l.classId===r.cls).length, r.present, r.absent, r.late, r.pct])
      );
    } else if (reportType === 'academic') {
      exportCSV(`hoc-luc-hs`,
        ['Mã HS', 'Họ tên', 'Lớp', 'Khối', 'Học lực'],
        students.map(s => [s.id, s.name, s.classId, s.grade || '', s.academicLevel || 'Chưa xác định'])
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, flexShrink: 0 }}>Báo cáo</h2>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ padding: 3, background: '#f1f5f9' }}>
          <FilterTabs variant="segment" size="sm" active={reportType} onChange={id => setReportType(id as ReportType)}
            tabs={[{id:'revenue',label:'Doanh thu'},{id:'attendance',label:'Chuyên cần'},{id:'academic',label:'Học lực'}]} />
        </div>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid #e2e8f0', padding: '4px 8px' }}>
          <button onClick={prevMonth} style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={13} color="#64748b" /></button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', minWidth: 72, textAlign: 'center', whiteSpace: 'nowrap' }}>T{filterMo}/{filterYr}</span>
          <button onClick={nextMonth} style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={13} color="#64748b" /></button>
          {!isCurrentMonth && <button onClick={() => { setFilterMo(curMo); setFilterYr(curYr); }} style={{ padding: '2px 7px', border: 'none', background: '#eef2ff', color: '#6366f1', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Hôm nay</button>}
        </div>
        <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'#059669', border:'none', color:'white', fontWeight:700, fontSize:12, cursor:'pointer', marginLeft:'auto', flexShrink:0 }} className="print:hidden">
          📥 Xuất CSV
        </button>
        <button onClick={() => window.print()} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'#e11d48', border:'none', color:'white', fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }} className="print:hidden">
          <Printer size={13} />In T{filterMo}
        </button>
      </div>

      {!isCurrentMonth && <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, background: '#fffbeb', border: '1px solid #fde68a', padding: '5px 12px', margin: 0 }}>📅 Đang xem: Tháng {filterMo} / {filterYr}</p>}

      {/* StatBlocks */}
      <StatGrid>{kpiConfig[reportType].map((k, i) => <StatBlock key={i} icon={k.icon} value={k.value} label={k.label} sub={k.sub} gradient={k.gradient} />)}</StatGrid>

      {/* Revenue */}
      {reportType === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={TABLE_WRAP}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 7 }}><School size={13} color="#6366f1" /><p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Doanh thu theo lớp · T{filterMo}/{filterYr}</p></div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                <thead><tr>
                  <th style={{ ...TH_SHARED, textAlign:'center' }}>Lớp</th>
                  <th style={TH_SHARED}>Giáo viên</th>
                  <th style={{ ...TH_SHARED, textAlign:'center' }}>Phiếu</th>
                  <th style={{ ...TH_SHARED, textAlign:'right' }}>Tổng thu</th>
                </tr></thead>
                <tbody>
                  {revenueByClass.length === 0 ? <tr><td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có doanh thu</td></tr>
                    : revenueByClass.map((r, i) => (
                    <tr key={r.cls} onMouseEnter={() => setHovR(i)} onMouseLeave={() => setHovR(null)} style={trStyle(i, hovR===i)}>
                      <td style={{ ...TD_SHARED, textAlign:'center', fontWeight:700, color:'#4338ca' }}>{r.cls}</td>
                      <td style={{ ...TD_SHARED, color: '#475569', fontSize: 12 }}>{r.teacher}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'center', fontWeight: 600 }}>{r.count}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'right', fontWeight: 700, color: '#059669' }}>+{fmtVND(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={TABLE_WRAP}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 7 }}><DollarSign size={13} color="#10b981" /><p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Tổng quan theo giáo viên · T{filterMo}/{filterYr}</p></div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
                <thead><tr>
                  <th style={TH_SHARED}>Giáo viên</th>
                  <th style={{ ...TH_SHARED, textAlign:'center' }}>HS</th>
                  <th style={{ ...TH_SHARED, textAlign:'center' }}>Đóng phí</th>
                  <th style={{ ...TH_SHARED, textAlign:'right' }}>Doanh thu</th>
                </tr></thead>
                <tbody>
                  {teacherRevenue.length === 0 ? <tr><td colSpan={4} style={{ padding: '28px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có dữ liệu</td></tr>
                    : teacherRevenue.map((t, i) => (
                    <tr key={i} onMouseEnter={() => setHovT(i)} onMouseLeave={() => setHovT(null)} style={trStyle(i, hovT===i)}>
                      <td style={{ ...TD_SHARED, fontWeight: 700 }}>{t.fullName}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}>{t.students}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: t.students>0&&t.paid/t.students>=0.8?'#ecfdf5':'#fff7ed', color: t.students>0&&t.paid/t.students>=0.8?'#059669':'#d97706' }}>{t.paid}/{t.students}</span></td>
                      <td style={{ ...TD_SHARED, textAlign: 'right', fontWeight: 700, color: '#059669' }}>+{fmtVND(t.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance */}
      {reportType === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {attendanceStats.length > 0 && (
            <div style={{ ...TABLE_WRAP, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
                Tỷ lệ chuyên cần theo lớp · T{filterMo}/{filterYr}
              </p>
              <ResponsiveContainer width="100%" height={Math.max(180, attendanceStats.length * 36)}>
                <BarChart data={attendanceStats} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cls" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={48} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Tỷ lệ CC']} contentStyle={{ borderRadius: 6, border: 'none', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                  <Bar dataKey="pct" name="Tỷ lệ CC" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {attendanceStats.map((r, i) => <Cell key={i} fill={r.pct >= 90 ? '#10b981' : r.pct >= 75 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, justifyContent: 'center' }}>
                {[{ color: '#10b981', label: '≥90% Tốt' }, { color: '#f59e0b', label: '75–89% TB' }, { color: '#ef4444', label: '<75% Thấp' }].map(l => (
                  <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />{l.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={TABLE_WRAP}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
              <thead><tr><th style={TH_SHARED}>Lớp</th><th style={{ ...TH_SHARED, textAlign:'center' }}>Buổi</th><th style={{ ...TH_SHARED, textAlign:'center' }}>Có mặt</th><th style={{ ...TH_SHARED, textAlign:'center' }}>Vắng</th><th style={{ ...TH_SHARED, textAlign:'center' }}>Muộn</th><th style={TH_SHARED}>Tỷ lệ</th></tr></thead>
              <tbody>
                {attendanceStats.length === 0 ? <tr><td colSpan={6} style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có buổi dạy tháng này</td></tr>
                  : attendanceStats.map((r, i) => (
                  <tr key={r.cls} onMouseEnter={() => setHovA(i)} onMouseLeave={() => setHovA(null)} style={trStyle(i, hovA===i)}>
                    <td style={TD_SHARED}><Badge color="indigo">{r.cls}</Badge></td>
                    <td style={{ ...TD_SHARED, textAlign: 'center', fontWeight: 600 }}>{moTlogs.filter(l => l.classId===r.cls).length}</td>
                    <td style={{ ...TD_SHARED, textAlign: 'center', fontWeight: 700, color: '#059669' }}>{r.present}</td>
                    <td style={{ ...TD_SHARED, textAlign: 'center', fontWeight: 700, color: '#e11d48' }}>{r.absent}</td>
                    <td style={{ ...TD_SHARED, textAlign: 'center', fontWeight: 700, color: '#d97706' }}>{r.late}</td>
                    <td style={TD_SHARED}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: r.pct>=90?'#ecfdf5':r.pct>=75?'#fffbeb':'#fff1f2', color: r.pct>=90?'#059669':r.pct>=75?'#d97706':'#e11d48' }}>{r.pct}%</span>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', minWidth: 50 }}><div style={{ height: '100%', background: r.pct>=90?'#10b981':r.pct>=75?'#f59e0b':'#ef4444', width: `${r.pct}%` }} /></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic */}
      {reportType === 'academic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
          <div style={{ ...TABLE_WRAP, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 0 }}>Phân bố học lực</p>
            {academicDist.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '40px 0' }}>Chưa có dữ liệu</p>
              : <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={academicDist} cx="50%" cy="50%" innerRadius={46} outerRadius={76} dataKey="value" paddingAngle={3}>{academicDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{ borderRadius: 6, border: 'none', fontSize: 12 }}/><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}/></PieChart></ResponsiveContainer>}
          </div>
          <div style={TABLE_WRAP}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid #f1f5f9' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Chi tiết học lực</p></div>
            {academicDist.map((d, i) => { const pct = students.length>0?Math.round(d.value/students.length*100):0; return (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: COLORS[i%COLORS.length] }} />
                <span style={{ flex: 1, fontWeight: 600, color: '#374151', fontSize: 13 }}>{d.name}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{d.value}</span>
                <div style={{ width: 60, height: 5, background: '#f1f5f9' }}><div style={{ height: '100%', width: `${pct}%`, background: COLORS[i%COLORS.length] }} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', width: 30, textAlign: 'right' }}>{pct}%</span>
              </div>
            );})}
          </div>
        </div>
      )}

    </div>
  );
}
