/**
 * TeachersTab.tsx — v27.0 (Design System)
 * - HStatCard horizontal
 * - SearchBar, IconButton, Button từ design-system
 * - Bảng sharp (borderRadius: 0)
 * - No Avatar
 * - Full-screen detail panel
 */
import React, { useState } from 'react';
import { Users, Award, School, Phone, Mail, X, Edit3, Eye, Plus, Save, DollarSign } from 'lucide-react';
import { fmtVND } from './helpers';
import { ModalWrap, Field } from './UIComponents';
import { Button, IconButton, Input, Select, SearchBar, TableActions } from './dsComponents';
import { StatBlock, StatGrid, TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import { FAB } from './AppComponents';
import type { Teacher } from './types';

const DEMO_TEACHERS: Teacher[] = [
  { id:'T001', name:'Lê Đức Nhân',     phone:'0383634949', email:'nhan@loptoannk.com', gender:'male',   specialization:'Toán', qualification:'Thạc sĩ', experience:8, baseSalary:8000000, hourlyRate:200000, allowance:500000, status:'active', classes:[], createdAt:'2020-01-01T00:00:00Z', notes:'Giáo viên chủ chốt, chuyên Toán 9-12' },
  { id:'T002', name:'Nguyễn Thị Kiên', phone:'0912345678', email:'kien@loptoannk.com', gender:'female', specialization:'Toán', qualification:'Cử nhân', experience:4, baseSalary:6000000, hourlyRate:150000, allowance:300000, status:'active', classes:[], createdAt:'2022-06-01T00:00:00Z', notes:'Lớp cơ bản' },
];

const STATUS_MAP: Record<Teacher['status'],{label:string;bg:string;color:string}> = {
  active:  { label:'Đang dạy',  bg:'#ecfdf5', color:'#059669' },
  inactive:{ label:'Đã nghỉ',   bg:'#f8fafc', color:'#94a3b8' },
  onleave: { label:'Nghỉ phép', bg:'#fffbeb', color:'#d97706' },
};

function TeacherModal({ open, onClose, editing, onSave, isSaving }: {
  open:boolean; onClose:()=>void; editing:Teacher|null; onSave:(f:any)=>void; isSaving:boolean;
}) {
  const blank: Partial<Teacher> = { status:'active', gender:'male', experience:0, baseSalary:6000000, hourlyRate:150000, allowance:0, specialization:'Toán', qualification:'Cử nhân', classes:[] };
  const [f,setF] = useState<Partial<Teacher>>(blank);
  React.useEffect(()=>{ if(open) setF(editing??{...blank,id:`T${Date.now()}`,createdAt:new Date().toISOString()}); },[open,editing]);
  if(!open) return null;
  const u=(k:string,v:any)=>setF(p=>({...p,[k]:v}));

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white', width:'100%', maxWidth:720, maxHeight:'92vh', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg,#fffbeb,#fef3c7)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(245,158,11,0.4)' }}><Users size={18} color="white"/></div>
            <div>
              <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0 }}>{editing?'Sửa thông tin giáo viên':'Thêm giáo viên mới'}</h3>
              <p style={{ fontSize:12, color:'#d97706', fontWeight:600, margin:0 }}>Điền đầy đủ thông tin giáo viên</p>
            </div>
          </div>
          <IconButton icon={<X size={18}/>} label="Đóng" onClick={onClose}/>
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
            <Input label="Họ tên *" value={f.name||''} onChange={v=>u('name',v)} placeholder="Nguyễn Văn A"/>
            <Input label="SĐT *" value={f.phone||''} onChange={v=>u('phone',v)} placeholder="09xxxxxxxx"/>
            <Input label="Email" value={f.email||''} onChange={v=>u('email',v)} placeholder="email@..."/>
            <Select label="Giới tính" value={f.gender||'male'} onChange={v=>u('gender',v)} options={[{value:'male',label:'Nam'},{value:'female',label:'Nữ'},{value:'other',label:'Khác'}]}/>
            <Input label="Chuyên môn" value={f.specialization||''} onChange={v=>u('specialization',v)}/>
            <Input label="Bằng cấp" value={f.qualification||''} onChange={v=>u('qualification',v)}/>
            <Input label="Kinh nghiệm (năm)" type="number" value={String(f.experience||0)} onChange={v=>u('experience',+v)}/>
            <Select label="Trạng thái" value={f.status||'active'} onChange={v=>u('status',v)} options={[{value:'active',label:'Đang dạy'},{value:'inactive',label:'Đã nghỉ'},{value:'onleave',label:'Nghỉ phép'}]}/>
            <Input label="Lương cơ bản (đ)" type="number" value={String(f.baseSalary||0)} onChange={v=>u('baseSalary',+v)}/>
            <Input label="Lương/giờ (đ)" type="number" value={String(f.hourlyRate||0)} onChange={v=>u('hourlyRate',+v)}/>
            <Input label="Phụ cấp (đ)" type="number" value={String(f.allowance||0)} onChange={v=>u('allowance',+v)}/>
          </div>
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4 }}>Ghi chú</label>
            <textarea value={f.notes||''} onChange={e=>u('notes',e.target.value)} rows={2} style={{ width:'100%',padding:'10px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,fontWeight:500,color:'#0f172a',outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box' }}/>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent="warning" loading={isSaving} icon={<Save size={15}/>} onClick={()=>onSave(f)} disabled={!f.name?.trim()}>
            {editing?'Cập nhật':'Thêm mới'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props { teachers:Teacher[]; uClasses:any[]; tlogs:any[]; onSave:(f:any)=>void; isSaving:boolean; }

export default function TeachersTab({ teachers:propTeachers, uClasses, tlogs, onSave, isSaving }: Props) {
  const teachers = propTeachers.length > 0 ? propTeachers : DEMO_TEACHERS;
  const [showModal,setShowModal] = useState(false);
  const [editing,setEditing] = useState<Teacher|null>(null);
  const [detail,setDetail] = useState<Teacher|null>(null);
  const [search,setSearch] = useState('');
  const [hovRow,setHovRow] = useState<string|null>(null);

  const filtered = teachers.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const active   = teachers.filter(t => t.status==='active').length;

  const TH = TH_SHARED;
  const TD = TD_SHARED;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div style={{ flexShrink:0 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.04em', margin:0 }}>Giáo viên</h2>
          <p style={{ fontSize:12, color:'#64748b', margin:'2px 0 0' }}>{active}/{teachers.length} đang dạy</p>
        </div>
        <span style={{ width:1, height:22, background:'#e2e8f0', flexShrink:0 }}/>
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm giáo viên..." width={200}/>
      </div>

      {/* Horizontal stat cards */}
      <StatGrid>
        <StatBlock icon={Users}  value={teachers.length} label="Tổng giáo viên" sub="trong hệ thống"    gradient="linear-gradient(135deg,#f59e0b,#d97706)"/>
        <StatBlock icon={Award}  value={active}           label="Đang dạy"       sub={`/ ${teachers.length} giáo viên`}  gradient="linear-gradient(135deg,#10b981,#059669)"/>
        <StatBlock icon={School} value={uClasses.length}  label="Lớp phụ trách"  sub="tổng số lớp"       gradient="linear-gradient(135deg,#6366f1,#4f46e5)"/>
      </StatGrid>

      {/* Table - sharp borders */}
      <div style={TABLE_WRAP}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Giáo viên','Chuyên môn','Kinh nghiệm','Lương cơ bản','Trạng thái','Thao tác'].map((h,i)=>(
                <th key={i} style={{ ...TH, textAlign:i===5?'center':'left' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={6} style={{ padding:'56px 16px', textAlign:'center', color:'#94a3b8', fontStyle:'italic' }}>Chưa có giáo viên nào</td></tr>
                : filtered.map((t,idx)=>{
                  const st=STATUS_MAP[t.status];
                  return (
                    <tr key={t.id} onMouseEnter={()=>setHovRow(t.id)} onMouseLeave={()=>setHovRow(null)}
                      style={trStyle(idx, hovRow===t.id)}>
                      <td style={TD}>
                        <p style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0 }}>{t.name}</p>
                        <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{t.phone}</p>
                      </td>
                      <td style={TD}><span style={{ color:'#475569' }}>{t.specialization} · {t.qualification}</span></td>
                      <td style={TD}><span style={{ background:'#fffbeb',color:'#d97706',fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:6 }}>{t.experience} năm</span></td>
                      <td style={TD}><span style={{ fontWeight:700,color:'#059669' }}>{fmtVND(t.baseSalary)}</span></td>
                      <td style={TD}><span style={{ background:st.bg,color:st.color,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:6 }}>{st.label}</span></td>
                      <td style={{ ...TD, textAlign:'center' }}>
                        <TableActions actions={[
                          { icon:<Eye size={13}/>,   label:'Xem',   intent:'primary', onClick:()=>setDetail(t) },
                          { icon:<Edit3 size={13}/>, label:'Sửa',   intent:'warning', onClick:()=>{setEditing(t);setShowModal(true);} },
                        ]}/>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {detail && (
        <div style={{ position:'fixed', inset:0, zIndex:150, display:'flex', justifyContent:'flex-end' }} onClick={()=>setDetail(null)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.35)', backdropFilter:'blur(4px)' }}/>
          <div style={{ position:'relative', background:'white', width:'100%', maxWidth:440, height:'100%', overflowY:'auto', boxShadow:'-8px 0 40px rgba(0,0,0,0.18)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0 }}>Chi tiết giáo viên</h3>
                <IconButton icon={<X size={18}/>} label="Đóng" onClick={()=>setDetail(null)}/>
              </div>
              <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', borderRadius:10, padding:18, marginBottom:20, border:'1px solid #fde68a' }}>
                <h4 style={{ fontSize:19, fontWeight:800, color:'#0f172a', margin:0 }}>{detail.name}</h4>
                <p style={{ fontSize:13, color:'#d97706', fontWeight:600, margin:'4px 0' }}>{detail.specialization} · {detail.qualification}</p>
                <span style={{ background:STATUS_MAP[detail.status].bg, color:STATUS_MAP[detail.status].color, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6 }}>{STATUS_MAP[detail.status].label}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
                {[
                  { label:'Buổi dạy',  val:tlogs.filter(l=>(l.teacherName||'').includes(detail.name.split(' ').pop()||'')).length, color:'#7c3aed', bg:'#f5f3ff' },
                  { label:'Kinh nghiệm', val:`${detail.experience}n`, color:'#d97706', bg:'#fffbeb' },
                  { label:'Lớp phụ trách', val:uClasses.filter(c=>(c['Giáo viên']||'').includes(detail.name.split(' ').pop()||'')).length, color:'#0284c7', bg:'#f0f9ff' },
                ].map((s,i)=>(
                  <div key={i} style={{ background:s.bg, borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                    <p style={{ fontSize:20, fontWeight:800, color:s.color, margin:0 }}>{s.val}</p>
                    <p style={{ fontSize:10, color:'#64748b', margin:'2px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {[{label:'SĐT',val:detail.phone,icon:Phone},{label:'Email',val:detail.email,icon:Mail}].map((row,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:8, background:'#f8fafc', marginBottom:7 }}>
                  <row.icon size={14} color="#94a3b8"/>
                  <div>
                    <p style={{ fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',margin:0 }}>{row.label}</p>
                    <p style={{ fontSize:13,fontWeight:600,color:'#1e293b',margin:0 }}>{row.val||'—'}</p>
                  </div>
                </div>
              ))}
              <div style={{ background:'#ecfdf5', borderRadius:8, padding:14, marginTop:10 }}>
                <p style={{ fontSize:10,fontWeight:700,color:'#059669',textTransform:'uppercase',marginBottom:7 }}>💰 Thu nhập</p>
                {[['Lương cơ bản',fmtVND(detail.baseSalary)],['Phụ cấp',fmtVND(detail.allowance)],['Lương/giờ',fmtVND(detail.hourlyRate)]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4 }}>
                    <span style={{ color:'#64748b' }}>{k}:</span>
                    <span style={{ fontWeight:700,color:'#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>
              {detail.notes&&<div style={{ marginTop:10,padding:12,borderRadius:8,background:'#f8fafc',fontSize:13,color:'#475569',fontStyle:'italic' }}>💬 {detail.notes}</div>}
              <div style={{ marginTop:16 }}>
                <Button intent="warning" variant="outline" fullWidth icon={<Edit3 size={14}/>} onClick={()=>{setEditing(detail);setShowModal(true);}}>Sửa thông tin</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TeacherModal open={showModal} onClose={()=>setShowModal(false)} editing={editing} onSave={f=>{onSave(f);setShowModal(false);}} isSaving={isSaving}/>
      <FAB onClick={()=>{setEditing(null);setShowModal(true);}} label="Thêm giáo viên mới" icon={Plus} color="#f59e0b" shadow="0 8px 24px rgba(245,158,11,0.5)"/>
    </div>
  );
}
