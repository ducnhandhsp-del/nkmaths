/**
 * MaterialsTab.tsx — v27.0 (Design System)
 * - FilterChip inline header
 * - Không có demo materials
 * - Sharp table layout
 */
import React, { useState, useMemo } from 'react';
import { Library, Plus, ExternalLink, Trash2, Edit3, X, Save, BookMarked, FileText, Video, File, BookOpen, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { ModalWrap, Field } from './UIComponents';
import { Button, IconButton, Input, Select, FilterChip } from './dsComponents';
import { StatBlock as HStatCard, StatGrid as HStatGrid } from './AppComponents';
import { FAB } from './AppComponents';
import { TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import type { Material } from './types';

const TYPE_CFG: Partial<Record<Material['type'],{label:string;icon:any;iconColor:string;tagBg:string;tagColor:string}>> & Record<string,any> = {
  lesson:   { label:'Bài giảng',    icon:BookOpen,      iconColor:'#2563eb', tagBg:'#eff6ff', tagColor:'#2563eb' },
  exercise: { label:'Phiếu bài tập',icon:ClipboardList, iconColor:'#059669', tagBg:'#ecfdf5', tagColor:'#059669' },
  exam:     { label:'Đề thi',       icon:BookMarked,    iconColor:'#7c3aed', tagBg:'#f5f3ff', tagColor:'#7c3aed' },
  /* Legacy types — giữ để dữ liệu cũ không bị lỗi hiển thị */
  document: { label:'Tài liệu', icon:FileText, iconColor:'#2563eb', tagBg:'#eff6ff', tagColor:'#2563eb' },
  image:    { label:'Hình ảnh', icon:File,     iconColor:'#059669', tagBg:'#ecfdf5', tagColor:'#059669' },
  video:    { label:'Video',    icon:Video,    iconColor:'#e11d48', tagBg:'#fff1f2', tagColor:'#e11d48' },
  other:    { label:'Khác',     icon:File,     iconColor:'#64748b', tagBg:'#f8fafc', tagColor:'#64748b' },
};
/* 3 type chính dùng cho UI mới */
const MAIN_TYPES: Material['type'][] = ['lesson', 'exercise', 'exam'];

const GRADES = ['6','7','8','9','10','11','12','Tổng hợp'];

function MaterialModal({ open, onClose, editing, onSave, isSaving }: {
  open:boolean; onClose:()=>void; editing:Material|null; onSave:(f:any)=>void; isSaving:boolean;
}) {
  const [f,setF]=useState<Partial<Material>&{tagInput?:string}>({});
  React.useEffect(()=>{ if(open) setF(editing??{type:'lesson',subject:'Toán',grade:'9',tags:[],uploadedAt:new Date().toISOString()}); },[open,editing]);
  if(!open) return null;
  const u=(k:string,v:any)=>setF(p=>({...p,[k]:v}));
  const addTag=()=>{const t=(f.tagInput||'').trim();if(t&&!f.tags?.includes(t))u('tags',[...(f.tags||[]),t]);u('tagInput','');};
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white',width:'100%',maxWidth:680,maxHeight:'92vh',borderRadius:12,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,#ecfdf5,#d1fae5)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:'#10b981',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(16,185,129,0.4)' }}><Library size={18} color="white"/></div>
            <div>
              <h3 style={{ fontSize:16,fontWeight:800,color:'#0f172a',margin:0 }}>{editing?'Sửa học liệu':'Thêm học liệu mới'}</h3>
              <p style={{ fontSize:11,color:'#059669',fontWeight:600,margin:0 }}>Tài liệu · Đề thi · Video bài giảng</p>
            </div>
          </div>
          <IconButton icon={<X size={18}/>} label="Đóng" onClick={onClose}/>
        </div>
        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:24 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Tên học liệu *" value={f.name||''} onChange={v=>u('name',v)} placeholder="VD: Đề thi HK1 Toán 9 năm 2025"/>
            </div>
            <Select label="Loại" value={f.type||'lesson'} onChange={v=>u('type',v)} options={MAIN_TYPES.map(k=>({value:k,label:TYPE_CFG[k].label}))}/>
            <Select label="Khối lớp" value={f.grade||'9'} onChange={v=>u('grade',v)} options={GRADES.map(g=>({value:g,label:g==='Tổng hợp'?g:`Khối ${g}`}))}/>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Link Google Drive *" value={f.url||''} onChange={v=>u('url',v)} placeholder="https://drive.google.com/file/d/..."/>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Mô tả" value={f.description||''} onChange={v=>u('description',v)} placeholder="Mô tả ngắn..."/>
            </div>
          </div>
          {/* Tags */}
          <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
            <label style={{ fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em' }}>Tags</label>
            <div style={{ display:'flex',gap:8 }}>
              <input value={f.tagInput||''} onChange={e=>u('tagInput',e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} style={{ flex:1,padding:'9px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',background:'white' }} placeholder="Nhập tag và nhấn Enter..."/>
              <Button size="sm" intent="success" onClick={addTag} icon={<Plus size={13}/>}>Thêm</Button>
            </div>
            {(f.tags||[]).length>0&&<div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>{(f.tags||[]).map(t=><FilterChip key={t} label={t} active color="emerald" onRemove={()=>u('tags',(f.tags||[]).filter(x=>x!==t))}/>)}</div>}
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding:'14px 24px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent="success" loading={isSaving} icon={<Save size={15}/>} onClick={()=>onSave({...f,id:editing?.id||`M${Date.now()}`,uploadedBy:'GV001',downloadCount:editing?.downloadCount||0,tags:f.tags||[]})}>
            {editing?'Cập nhật':'Thêm mới'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GradeSection({ grade, materials, onEdit, onDelete }: {
  grade:string; materials:Material[]; onEdit:(m:Material)=>void; onDelete:(id:string)=>void;
}) {
  const [open,setOpen]=useState(true);
  const TH = TH_SHARED;
  const TD = TD_SHARED;
  return (
    <div style={TABLE_WRAP}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#f8fafc',border:'none',cursor:'pointer',borderBottom:open?'1px solid #e2e8f0':'none' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center' }}><Library size={14} color="#059669"/></div>
          <div style={{ textAlign:'left' }}>
            <p style={{ fontWeight:700,color:'#0f172a',margin:0,fontSize:14 }}>{grade==='Tổng hợp'?'Tổng hợp':`Khối ${grade}`}</p>
            <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>{materials.length} tài liệu</p>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:6,background:materials.length>0?'#ecfdf5':'#f1f5f9',color:materials.length>0?'#059669':'#94a3b8' }}>{materials.length}</span>
          {open?<ChevronUp size={14} color="#94a3b8"/>:<ChevronDown size={14} color="#94a3b8"/>}
        </div>
      </button>
      {open&&(
        materials.length===0
          ? <div style={{ padding:'20px 16px',textAlign:'center',color:'#94a3b8',fontStyle:'italic',fontSize:13 }}>Chưa có học liệu nào</div>
          : <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={TH}>Tên tài liệu</th>
                <th style={{ ...TH,textAlign:'center' }}>Loại</th>
                <th style={TH}>Mô tả / Tags</th>
                <th style={{ ...TH,textAlign:'center' }}>Thao tác</th>
              </tr></thead>
              <tbody>
                {materials.map((m,i)=>{ const tc=TYPE_CFG[m.type]; return (
                  <tr key={m.id} style={{ background:i%2===0?'white':'#fafafa' }}>
                    <td style={TD}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:32,height:32,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:'#f1f5f9' }}><tc.icon size={14} color={tc.iconColor}/></div>
                        <p style={{ fontWeight:600,color:'#0f172a',fontSize:13,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200 }}>{m.name}</p>
                      </div>
                    </td>
                    <td style={{ ...TD,textAlign:'center' }}><span style={{ fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:6,background:tc.tagBg,color:tc.tagColor }}>{tc.label}</span></td>
                    <td style={TD}>
                      <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                        {m.description&&<span style={{ fontSize:12,color:'#64748b' }}>{m.description}</span>}
                        {m.tags.slice(0,3).map(t=><span key={t} style={{ fontSize:11,background:'#f1f5f9',color:'#64748b',padding:'2px 7px',borderRadius:5 }}>{t}</span>)}
                      </div>
                    </td>
                    <td style={{ ...TD,textAlign:'center' }}>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        {m.url&&<a href={m.url} target="_blank" rel="noopener noreferrer" style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,background:'#ecfdf5',border:'1px solid #a7f3d0',color:'#059669',fontWeight:600,fontSize:12,textDecoration:'none' }}><ExternalLink size={12}/>Mở</a>}
                        <IconButton icon={<Edit3 size={13}/>} label="Sửa" intent="warning" onClick={()=>onEdit(m)}/>
                        <IconButton icon={<Trash2 size={13}/>} label="Xóa" intent="danger" onClick={()=>onDelete(m.id)}/>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
      )}
    </div>
  );
}

interface Props { materials:Material[]; uClasses:any[]; onSave:(f:any)=>void; onDelete:(id:string)=>void; isSaving:boolean; }

export default function MaterialsTab({ materials, uClasses, onSave, onDelete, isSaving }: Props) {
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState<Material|null>(null);
  const [filterGrade,setFilterGrade]=useState('');
  const [filterClass,setFilterClass]=useState('');

  /* Filter theo cả grade và classId */
  const filteredMaterials = useMemo(()=>{
    let list = materials;
    if (filterClass) list = list.filter(m => m.classId === filterClass);
    return list;
  }, [materials, filterClass]);

  const byGrade=useMemo(()=>{
    const map:Record<string,Material[]>={};
    GRADES.forEach(g=>{map[g]=[];});
    filteredMaterials.forEach(m=>{const g=m.grade||'Tổng hợp';if(!map[g])map[g]=[];map[g].push(m);});
    return map;
  },[filteredMaterials]);

  const totalDownloads=materials.reduce((s,m)=>s+(m.downloadCount||0),0);
  const gradesToShow=filterGrade?[filterGrade]:GRADES;

  /* Class filter options — chỉ hiện lớp có học liệu */
  const classOptions = useMemo(()=>[
    { value:'', label:'Tất cả lớp' },
    ...uClasses
      .filter(c => materials.some(m => m.classId === c['Mã Lớp']))
      .map(c => ({ value: c['Mã Lớp'], label: `Lớp ${c['Mã Lớp']}` })),
  ], [uClasses, materials]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header compact */}
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <h2 style={{ fontSize:22,fontWeight:800,color:'#0f172a',textTransform:'uppercase',letterSpacing:'0.04em',margin:0,flexShrink:0 }}>Học liệu</h2>
        <span style={{ width:1,height:22,background:'#e2e8f0',flexShrink:0 }}/>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
          <FilterChip label={`Tất cả (${filteredMaterials.length})`} active={filterGrade===''} onClick={()=>setFilterGrade('')} color="emerald"/>
          {GRADES.map(g=><FilterChip key={g} label={`${g==='Tổng hợp'?g:`Khối ${g}`} (${byGrade[g]?.length||0})`} active={filterGrade===g} onClick={()=>setFilterGrade(g===filterGrade?'':g)} color="teal"/>)}
        </div>
        {/* Filter theo lớp — chỉ hiện nếu có lớp nào có học liệu */}
        {classOptions.length > 1 && (
          <select
            value={filterClass}
            onChange={e=>setFilterClass(e.target.value)}
            style={{ padding:'5px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,fontWeight:600,color:'#475569',background:'white',cursor:'pointer',outline:'none' }}
          >
            {classOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <span style={{ marginLeft:'auto',fontSize:12,fontWeight:600,color:'#94a3b8' }}>{totalDownloads} lượt xem</span>
      </div>

      {/* Stats */}
      <HStatGrid>
        {MAIN_TYPES.map(k=>{
          const v=TYPE_CFG[k];
          const cnt=filteredMaterials.filter(m=>m.type===k).length;
          const grads:Record<string,string>={ lesson:'linear-gradient(135deg,#2563eb,#1d4ed8)', exercise:'linear-gradient(135deg,#10b981,#059669)', exam:'linear-gradient(135deg,#7c3aed,#6d28d9)' };
          return <HStatCard key={k} icon={v.icon} value={cnt} label={v.label} sub="tài liệu" gradient={grads[k]||'linear-gradient(135deg,#64748b,#475569)'}/>;
        })}
      </HStatGrid>

      {/* Empty state */}
      {filteredMaterials.length===0&&(
        <div style={{ border:'2px dashed #e2e8f0', borderRadius:8, padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:16 }}>📚</div>
          <h3 style={{ fontSize:17,fontWeight:700,color:'#0f172a',margin:'0 0 8px' }}>
            {filterClass ? `Chưa có học liệu cho lớp ${filterClass}` : 'Chưa có học liệu nào'}
          </h3>
          <p style={{ fontSize:13,color:'#94a3b8',margin:'0 0 20px' }}>Thêm tài liệu, đề thi, video bài giảng để chia sẻ với học sinh</p>
          <Button intent="success" icon={<Plus size={14}/>} onClick={()=>{setEditing(null);setShowModal(true);}}>Thêm học liệu đầu tiên</Button>
        </div>
      )}

      {/* Grade sections */}
      {filteredMaterials.length>0&&gradesToShow.map(grade=>(
        <GradeSection key={grade} grade={grade} materials={byGrade[grade]||[]} onEdit={m=>{setEditing(m);setShowModal(true);}} onDelete={onDelete}/>
      ))}

      <FAB onClick={()=>{setEditing(null);setShowModal(true);}} label="Thêm học liệu mới" color="#10b981" shadow="0 8px 24px rgba(16,185,129,0.5)"/>
      <MaterialModal open={showModal} onClose={()=>{setShowModal(false);setEditing(null);}} editing={editing} onSave={f=>{onSave(f);setShowModal(false);}} isSaving={isSaving}/>
    </div>
  );
}
