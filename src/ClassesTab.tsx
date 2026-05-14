/**
 * ClassesTab.tsx — v28.0
 * Toggle Bảng/Thẻ, mobile 3 cột + Chi tiết, modal chi tiết lớp
 */
import React, { useState, useMemo } from 'react';
import { Edit3, Clock, Plus, LayoutList, LayoutGrid, X, Users, MapPin, User } from 'lucide-react';
import { isStudentActive, parseDMY, resolveTeacher } from './helpers';
import { FAB, TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import { Badge, SearchBar, Select, IconButton, Button } from './dsComponents';
import { EmptyState } from './UIComponents';
import type { Student, ClassRecord } from './types';

interface Props {
  uClasses: ClassRecord[]; students: Student[];
  curMo: number; curYr: number;
  qCls: string; setQCls: (v: string) => void;
  fClsTeacher: string; setFClsTeacher: (v: string) => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onEditClass: (c: ClassRecord) => void; onAddClass: () => void; uniqueBranches: string[];
  embedded?: boolean;
}

function isMonthBillable(s: Student, month: number, year: number): boolean {
  const monthStart = new Date(year, month - 1, 1).getTime();

  const startTs = parseDMY(s.startDate || '');
  if (startTs) {
    const d = new Date(startTs);
    const startMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (monthStart < startMonth) return false;
  }

  const endRaw = String(s.endDate || '').trim();
  const endTs = parseDMY(endRaw);
  if (endTs && endRaw && endRaw !== '---') {
    const d = new Date(endTs);
    const leaveMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (monthStart >= leaveMonth) return false;
  }

  return true;
}

function tuitionTone(total: number, pct: number): 'emerald' | 'amber' | 'rose' | 'slate' {
  if (total === 0) return 'slate';
  if (pct >= 80) return 'emerald';
  if (pct >= 50) return 'amber';
  return 'rose';
}

function ClassDetailModal({ cls, curMo, curYr, students, isPaid, onClose, onEdit }: {
  cls: ClassRecord & { studentCount?: number; paidCount?: number; pct?: number };
  curMo: number; curYr: number;
  students: Student[];
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onClose: () => void; onEdit: () => void;
}) {
  // Chỉ tính HS đang học — bỏ qua HS đã nghỉ
  const clsStudents = students.filter(s =>
    s.classId === cls['Mã Lớp'] &&
    isStudentActive(s)
  );
  const billableStudents = clsStudents.filter(s => isMonthBillable(s, curMo, curYr));
  const paid   = billableStudents.filter(s => isPaid(s.id, curMo, curYr));
  const unpaid = billableStudents.filter(s => !isPaid(s.id, curMo, curYr));
  const pct = billableStudents.length > 0 ? Math.round(paid.length / billableStudents.length * 100) : 0;
  const feeTone = tuitionTone(billableStudents.length, pct);
  const feeBg = feeTone === 'emerald' ? '#ecfdf5' : feeTone === 'amber' ? '#fefce8' : feeTone === 'rose' ? '#fff1f2' : '#f8fafc';
  const feeBorder = feeTone === 'emerald' ? '#a7f3d0' : feeTone === 'amber' ? '#fde68a' : feeTone === 'rose' ? '#fecaca' : '#e2e8f0';
  const feeColor = feeTone === 'emerald' ? '#059669' : feeTone === 'amber' ? '#d97706' : feeTone === 'rose' ? '#e11d48' : '#64748b';

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white',width:'100%',maxWidth:520,borderRadius:'16px 16px 0 0',overflow:'hidden',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',maxHeight:'90dvh',display:'flex',flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ color:'white',fontWeight:800,fontSize:12 }}>{(cls['Mã Lớp']||'').slice(0,3)}</span>
            </div>
            <div>
              <p style={{ fontSize:16,fontWeight:800,color:'#0f172a',margin:0 }}>{cls['Mã Lớp']}</p>
              <p style={{ fontSize:12,color:'#6366f1',fontWeight:600,margin:0 }}>{cls['Tên Lớp'] || 'Chi tiết lớp học'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,background:'#f1f5f9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <X size={14} color="#64748b" />
          </button>
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14 }}>

          {/* Thông tin lớp — compact 2 cột */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {[
              { icon: <User size={13} color="#6366f1" />,   label:'Giáo viên', value: resolveTeacher(cls['Giáo viên']||'')||'---' },
              { icon: <MapPin size={13} color="#059669" />, label:'Cơ sở',     value: cls['Cơ sở']||'---' },
              { icon: <Clock size={13} color="#d97706" />,  label:'Lịch học',  value: [cls['Buổi 1'],cls['Buổi 2'],cls['Buổi 3']].filter(Boolean).join(' · ')||cls['Ca học']||'---' },
              { icon: <Users size={13} color="#0ea5e9" />,  label:'Sĩ số',     value: `${clsStudents.length} học sinh` },
            ].map((row,i) => (
              <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:8,padding:'10px 12px',background:'#f8fafc',borderRadius:8 }}>
                <div style={{ width:26,height:26,borderRadius:7,background:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>{row.icon}</div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:10,fontWeight:700,color:'#94a3b8',margin:0,textTransform:'uppercase',letterSpacing:'0.06em' }}>{row.label}</p>
                  <p style={{ fontSize:13,fontWeight:600,color:'#0f172a',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress đóng phí */}
          <div style={{ padding:'12px 14px',background: feeBg, borderRadius:10, border:`1px solid ${feeBorder}` }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <span style={{ fontSize:12,fontWeight:700,color:'#374151' }}>Đóng phí T{curMo}</span>
              <span style={{ fontSize:16,fontWeight:800,color:feeColor }}>{paid.length}/{billableStudents.length} · {pct}%</span>
            </div>
            <div style={{ height:6,background:'rgba(0,0,0,0.08)',borderRadius:3,overflow:'hidden' }}>
              <div style={{ width:`${pct}%`,height:'100%',background:feeTone==='slate'?'#94a3b8':pct>=80?'#10b981':pct>=50?'#f59e0b':'#ef4444',borderRadius:3,transition:'width 0.4s' }}/>
            </div>
          </div>

          {/* Danh sách học sinh */}
          {clsStudents.length > 0 && (
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px' }}>
                Danh sách học sinh cần đóng ({billableStudents.length}/{clsStudents.length})
              </p>

              {/* Chưa đóng phí */}
              {unpaid.length > 0 && (
                <div style={{ marginBottom:8 }}>
                  <p style={{ fontSize:11,fontWeight:700,color:'#e11d48',margin:'0 0 5px',display:'flex',alignItems:'center',gap:5 }}>
                    <span style={{ width:6,height:6,borderRadius:'50%',background:'#e11d48',display:'inline-block' }}/>
                    Chưa đóng ({unpaid.length})
                  </p>
                  <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                    {unpaid.map(s => (
                      <div key={s.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#fff5f5',borderRadius:8,border:'1px solid #fecaca' }}>
                        <div>
                          <p style={{ fontSize:13,fontWeight:600,color:'#0f172a',margin:0 }}>{s.name}</p>
                          <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>{s.id}</p>
                        </div>
                        {s.parentPhone && (
                          <a href={`tel:${s.parentPhone}`} style={{ fontSize:11,color:'#6366f1',fontWeight:600,textDecoration:'none' }}>{s.parentPhone}</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Đã đóng phí */}
              {paid.length > 0 && (
                <div>
                  <p style={{ fontSize:11,fontWeight:700,color:'#059669',margin:'0 0 5px',display:'flex',alignItems:'center',gap:5 }}>
                    <span style={{ width:6,height:6,borderRadius:'50%',background:'#059669',display:'inline-block' }}/>
                    Đã đóng ({paid.length})
                  </p>
                  <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                    {paid.map(s => (
                      <div key={s.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#f0fdf4',borderRadius:8,border:'1px solid #a7f3d0' }}>
                        <div>
                          <p style={{ fontSize:13,fontWeight:600,color:'#0f172a',margin:0 }}>{s.name}</p>
                          <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>{s.id}</p>
                        </div>
                        <span style={{ fontSize:11,fontWeight:700,color:'#059669',background:'#dcfce7',padding:'2px 8px',borderRadius:5 }}>✓ Đã đóng</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {clsStudents.length === 0 && (
            <div style={{ textAlign:'center',padding:'24px 0',color:'#94a3b8',fontStyle:'italic',fontSize:13 }}>Chưa có học sinh trong lớp này</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px',borderTop:'1px solid #f1f5f9',display:'flex',gap:10,flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1,padding:'12px',borderRadius:10,background:'#f1f5f9',border:'none',fontWeight:700,fontSize:14,color:'#64748b',cursor:'pointer' }}>Đóng</button>
          <button onClick={onEdit}  style={{ flex:2,padding:'12px',borderRadius:10,background:'linear-gradient(135deg,#6366f1,#4f46e5)',border:'none',fontWeight:700,fontSize:14,color:'white',cursor:'pointer' }}>✏️ Chỉnh sửa lớp</button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesTab({ uClasses,students,curMo,curYr,qCls,setQCls,fClsTeacher,setFClsTeacher,isPaid,onEditClass,onAddClass,uniqueBranches,embedded=false }: Props) {
  const [fBranch, setFBranch] = useState('');
  const [viewMode, setViewMode] = useState<'table'|'grid'>('table');
  const [detailCls, setDetailCls] = useState<any>(null);

  // FIX C4: memoize getSchedule helper (stable reference)
  const getSchedule = React.useCallback((c: any) => {
    const p = [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']].filter(Boolean);
    return p.length > 0 ? p.join(' | ') : (c['Ca học'] || '---');
  }, []);

  // FIX C4: memoize clsStats — chỉ tính HS đang học (bỏ HS nghỉ)
  const clsStats = React.useMemo(() => uClasses.map(c => {
    const cls = students.filter(s =>
      s.classId === c['Mã Lớp'] &&
      isStudentActive(s)
    );
    const billable = cls.filter(s => isMonthBillable(s, curMo, curYr));
    const paidCount = billable.filter(s => isPaid(s.id, curMo, curYr)).length;
    const pct = billable.length > 0 ? Math.round(paidCount / billable.length * 100) : 0;
    return { ...c, studentCount: cls.length, billableCount: billable.length, paidCount, pct };
  }).sort((a, b) => (a['Mã Lớp'] || '').localeCompare(b['Mã Lớp'] || '')),
  [uClasses, students, isPaid, curMo, curYr]);

  // FIX C4: memoize teacher list (uses resolveTeacher per class)
  const teachers = React.useMemo(() =>
    [...new Set(uClasses.map(c => resolveTeacher(c['Giáo viên'] || '')).filter(Boolean))],
  [uClasses]);

  // FIX C3 Bug: filter compares resolveTeacher(raw) against fClsTeacher (already resolved)
  const filtCls = React.useMemo(() => {
    const q = qCls.toLowerCase();
    return clsStats.filter(c => {
      const resolvedTeacher = resolveTeacher(c['Giáo viên'] || '');
      return (!q || (c['Mã Lớp'] || '').toLowerCase().includes(q) || (c['Tên Lớp'] || '').toLowerCase().includes(q))
        && (!fClsTeacher || resolvedTeacher === fClsTeacher)
        && (!fBranch || (c['Cơ sở'] || '').includes(fBranch));
    });
  }, [clsStats, qCls, fClsTeacher, fBranch]);

  // FIX C4: memoize select options
  const teacherOptions = React.useMemo(() =>
    [{ value: '', label: 'Tất cả GV' }, ...teachers.map(t => ({ value: t, label: t }))],
  [teachers]);
  const branchOptions = React.useMemo(() =>
    [{ value: '', label: 'Tất cả cơ sở' }, ...uniqueBranches.map(b => ({ value: b, label: b }))],
  [uniqueBranches]);

  const TH = TH_SHARED, TD = TD_SHARED;

  const emptyState = (
    <div style={{ padding:'52px 16px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:12 }}>
      <EmptyState
        title={qCls || fClsTeacher || fBranch ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học'}
        subtitle={qCls || fClsTeacher || fBranch ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Tạo lớp đầu tiên để gán học sinh, giáo viên và lịch học.'}
      />
      <Button intent="primary" size="sm" icon={<Plus size={13}/>} onClick={onAddClass}>Tạo lớp đầu tiên</Button>
    </div>
  );

  const pctBar = (pct: number, total = 1) => (
    <div style={{ width:'100%',height:4,background:'#f1f5f9',borderRadius:2,overflow:'hidden',marginTop:4 }}>
      <div style={{ width:`${pct}%`,height:'100%',background:total===0?'#94a3b8':pct>=80?'#10b981':pct>=50?'#f59e0b':'#ef4444',transition:'width 0.3s' }}/>
    </div>
  );

  return (
    <div style={{ display:'flex',flexDirection:'column',gap: embedded ? 10 : 14 }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',flexWrap:'wrap',gap:8 }}>
        {!embedded && (
          <>
            <div style={{ flexShrink:0 }}>
              <h2 style={{ fontSize:22,fontWeight:800,color:'#0f172a',textTransform:'uppercase',letterSpacing:'0.04em',margin:0 }}>Lớp học</h2>
              <p style={{ fontSize:12,color:'#64748b',margin:'2px 0 0' }}>{filtCls.length}/{uClasses.length} lớp · {students.length} học sinh</p>
            </div>
            <span style={{ width:1,height:22,background:'#e2e8f0',flexShrink:0 }}/>
          </>
        )}
        {embedded && (
          <span style={{ fontSize:12,fontWeight:700,color:'#64748b',background:'#f8fafc',border:'1px solid #e2e8f0',padding:'7px 10px',borderRadius:8 }}>
            {filtCls.length}/{uClasses.length} lớp
          </span>
        )}
        <SearchBar value={qCls} onChange={setQCls} placeholder="Tìm mã/tên lớp..." width={140}/>
        <Select value={fClsTeacher} onChange={setFClsTeacher} options={teacherOptions}/>
        <Select value={fBranch} onChange={setFBranch} options={branchOptions}/>
        {/* Toggle Bảng/Thẻ — ngang hàng luôn */}
        <div style={{ display:'flex',background:'#f1f5f9',borderRadius:8,padding:3,gap:2 }}>
          {([['table','Bảng'] as const, ['grid','Thẻ'] as const]).map(([mode, title]) => (
            <button key={mode} onClick={()=>setViewMode(mode)} title={title}
              style={{ width:34,height:30,borderRadius:6,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:viewMode===mode?'white':'transparent',boxShadow:viewMode===mode?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s' }}>
              {mode==='table' ? <LayoutList size={15} color={viewMode===mode?'#6366f1':'#94a3b8'}/> : <LayoutGrid size={15} color={viewMode===mode?'#6366f1':'#94a3b8'}/>}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: BẢNG */}
      {viewMode === 'table' && (
        <div style={TABLE_WRAP}>
          {/* Desktop */}
          <div className="cls-dt" style={{ overflowX:'auto' }}>
            <style>{`.cls-dt{display:block}.cls-mb{display:none}@media(max-width:767px){.cls-dt{display:none!important}.cls-mb{display:block!important}}`}</style>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Mã lớp','Lịch học','Sĩ số','Cơ sở','Giáo viên',`Đóng phí T${curMo}`,''].map((h,i)=>(
                  <th key={i} style={{ ...TH,textAlign:i>=2?'center':'left' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtCls.length===0 ? <tr><td colSpan={7}>{emptyState}</td></tr>
                : filtCls.map((c,idx)=>(
                  <tr key={c['Mã Lớp']} style={{ ...trStyle(idx), cursor:'pointer' }} onClick={()=>setDetailCls(c)}>
                    <td style={TD}><Badge color="indigo">{c['Mã Lớp']}</Badge></td>
                    <td style={TD}><div style={{ display:'flex',alignItems:'center',gap:5,color:'#475569',fontSize:12 }}><Clock size={11} color="#6366f1"/><span>{getSchedule(c)}</span></div></td>
                    <td style={{ ...TD,textAlign:'center' }}><span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32,background:'#f1f5f9',fontWeight:700,color:'#374151',fontSize:13 }}>{c.studentCount}</span></td>
                    <td style={{ ...TD,color:'#475569' }}>{c['Cơ sở']||'---'}</td>
                    <td style={{ ...TD,fontWeight:600,color:'#374151' }}>{resolveTeacher(c['Giáo viên']||'')}</td>
                    <td style={{ ...TD,textAlign:'center' }}>
                      <Badge color={tuitionTone(c.billableCount, c.pct)}>{c.paidCount}/{c.billableCount} ({c.pct}%)</Badge>
                      {pctBar(c.pct, c.billableCount)}
                    </td>
                    <td style={{ ...TD,textAlign:'center' }}><IconButton icon={<Edit3 size={13}/>} label={`Sửa ${c['Mã Lớp']}`} intent="warning" onClick={e=>{e.stopPropagation();onEditClass(c);}}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: 3 cột quan trọng + Chi tiết */}
          <div className="cls-mb">
            {filtCls.length===0 ? emptyState : filtCls.map((c,idx)=>(
              <div key={c['Mã Lớp']} style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:'1px solid #f1f5f9',background:idx%2===0?'white':'#f9fafc' }}>
                <div style={{ flexShrink:0 }}><Badge color="indigo">{c['Mã Lớp']}</Badge></div>
                <div style={{ flexShrink:0,textAlign:'center',minWidth:36 }}>
                  <p style={{ fontSize:17,fontWeight:800,color:'#0f172a',margin:0,lineHeight:1 }}>{c.studentCount}</p>
                  <p style={{ fontSize:9,color:'#94a3b8',margin:'2px 0 0',fontWeight:700,textTransform:'uppercase' }}>HS</p>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <Badge color={tuitionTone(c.billableCount, c.pct)}>{c.paidCount}/{c.billableCount}</Badge>
                <span style={{ fontSize:12,fontWeight:700,color:c.billableCount===0?'#64748b':c.pct>=80?'#059669':c.pct>=50?'#d97706':'#e11d48' }}>{c.pct}%</span>
                  </div>
                  {pctBar(c.pct, c.billableCount)}
                </div>
                <button onClick={()=>setDetailCls(c)}
                  style={{ flexShrink:0,padding:'7px 11px',borderRadius:8,background:'#eef2ff',border:'none',color:'#4f46e5',fontWeight:700,fontSize:12,cursor:'pointer' }}>
                  Chi tiết
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: THẺ (GRID) */}
      {viewMode === 'grid' && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:10 }}>
          {filtCls.length===0 ? <div style={{ gridColumn:'1/-1' }}>{emptyState}</div>
          : filtCls.map(c=>(
            <div key={c['Mã Lớp']} onClick={()=>setDetailCls(c)}
              style={{ background:'white',border:'1px solid #e2e8f0',borderRadius:12,padding:'14px',cursor:'pointer',transition:'all 0.15s',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(99,102,241,0.15)';(e.currentTarget as HTMLElement).style.borderColor='#a5b4fc';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';(e.currentTarget as HTMLElement).style.borderColor='#e2e8f0';}}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                <span style={{ fontSize:13,fontWeight:800,color:'#4f46e5' }}>{c['Mã Lớp']}</span>
                <button onClick={e=>{e.stopPropagation();onEditClass(c);}}
                  style={{ width:26,height:26,borderRadius:6,background:'#f1f5f9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Edit3 size={11} color="#64748b"/>
                </button>
              </div>
              <p style={{ fontSize:11,color:'#64748b',margin:'0 0 10px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                👨‍🏫 {resolveTeacher(c['Giáo viên']||'')||'---'}
              </p>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                <span style={{ fontSize:11,color:'#94a3b8',fontWeight:600 }}>Sĩ số</span>
                <span style={{ fontSize:20,fontWeight:800,color:'#0f172a' }}>{c.studentCount}</span>
              </div>
              <div style={{ fontSize:10,color:'#94a3b8',fontWeight:600,marginBottom:4,display:'flex',justifyContent:'space-between' }}>
                <span>Đóng phí T{curMo}</span>
                <span style={{ fontWeight:700,color:c.billableCount===0?'#64748b':c.pct>=80?'#059669':c.pct>=50?'#d97706':'#e11d48' }}>{c.pct}%</span>
              </div>
              {pctBar(c.pct, c.billableCount)}
              <p style={{ fontSize:10,color:'#94a3b8',margin:'4px 0 0',textAlign:'right' }}>{c.paidCount}/{c.billableCount} cần đóng</p>
            </div>
          ))}
        </div>
      )}

      {!embedded && <FAB onClick={onAddClass} label="Thêm lớp học mới"/>}

      {detailCls && <ClassDetailModal cls={detailCls} curMo={curMo} curYr={curYr} students={students} isPaid={isPaid} onClose={()=>setDetailCls(null)} onEdit={()=>{onEditClass(detailCls);setDetailCls(null);}}/>}
    </div>
  );
}
