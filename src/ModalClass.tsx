import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Button, IconButton, Input, Select } from './dsComponents';
import { ModalWrap } from './UIComponents';
import type { Student, ClassRecord } from './types';
import toast from 'react-hot-toast';

const FS_WRAP: React.CSSProperties = { position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:12,overflowY:'auto',background:'rgba(15,23,42,0.65)',backdropFilter:'blur(5px)' };
const FS_DLG: React.CSSProperties  = { background:'white',width:'100%',maxWidth:640,maxHeight:'92vh',borderRadius:12,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,0.28)' };

export function ClassModal({
  open, onClose, editing, isSaving, onSave, uniqueBranches=[], teacherList=[],
}: {
  open:boolean; onClose:()=>void; editing:ClassRecord|null; isSaving:boolean;
  onSave:(f:ClassRecord)=>Promise<void>;
  uniqueBranches?:string[]; teacherList?:string[];
}) {
  const [f, setF] = useState<Partial<ClassRecord>>({});
  useEffect(()=>{ setF(editing ?? {}); },[editing,open]);
  if(!open) return null;
  const u = (k: string, v: string) => setF(p => ({...p, [k]: v}));
  const handleSave = () => {
    if(!f['Mã Lớp']?.trim()){ toast.error('⚠️ Mã lớp không được để trống!'); return; }
    onSave(f as ClassRecord);
  };

  const teacherOptions=[{value:'',label:'Chọn GV'},...(teacherList.length>0?teacherList:['Lê Đức Nhân','Nguyễn Thị Kiên']).map(t=>({value:t,label:t}))];
  const branchOptions=[{value:'',label:'Chọn cơ sở'},...(uniqueBranches.length>0?uniqueBranches.map(b=>({value:b,label:b})):[{value:'Đào Tấn',label:'Đào Tấn'},{value:'Nguyễn Quang Bích',label:'Nguyễn Quang Bích'}])];

  return (
    <div style={FS_WRAP}>
      <div style={FS_DLG}>
        <div style={{ padding:'20px 28px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,#eef2ff,#e0e7ff)',flexShrink:0 }}>
          <div>
            <h3 style={{ fontSize:18,fontWeight:800,color:'#0f172a',margin:0 }}>{editing?'Sửa lớp học':'Thêm lớp học mới'}</h3>
            <p style={{ fontSize:12,color:'#6366f1',fontWeight:600,margin:0 }}>Điền thông tin lớp học bên dưới</p>
          </div>
          <IconButton icon={<X size={18}/>} label="Đóng" onClick={onClose}/>
        </div>
        <div style={{ flex:1,minHeight:0,overflowY:'auto',padding:'24px 28px' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14 }}>
            <Input label="Mã lớp *" value={f['Mã Lớp']||''} onChange={v=>u('Mã Lớp',v)} placeholder="NHAN_9A"/>
            <Input label="Tên lớp" value={f['Tên Lớp']||''} onChange={v=>u('Tên Lớp',v)} placeholder="9A"/>
            <Select label="Giáo viên" value={f['Giáo viên']||''} onChange={v=>u('Giáo viên',v)} options={teacherOptions}/>
            <Select label="Cơ sở" value={f['Cơ sở']||''} onChange={v=>u('Cơ sở',v)} options={branchOptions}/>
            <Input label="Khối" value={f['Khối']||''} onChange={v=>u('Khối',v)} placeholder="9"/>
          </div>
          <div style={{ marginTop:18 }}>
            <p style={{ fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px' }}>Lịch học (tối đa 3 buổi)</p>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {(['Buổi 1','Buổi 2','Buổi 3'] as const).map(b=>(
                <div key={b} style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:13,fontWeight:700,color:'#94a3b8',width:56,flexShrink:0 }}>{b}:</span>
                  <Input value={f[b]||''} onChange={v=>u(b,v)} placeholder={b==='Buổi 1'?'T2 9:00–10:30':b==='Buổi 2'?'T4 9:00–10:30':'T6 9:00–10:30 (nếu có)'} style={{ flex:1 }}/>
                </div>
              ))}
            </div>
            <p style={{ fontSize:11,color:'#94a3b8',fontWeight:600,margin:'8px 0 0' }}>VD: T2 18:00–19:30 · T4 18:00–19:30</p>
          </div>
        </div>
        <div style={{ padding:'16px 28px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent="primary" loading={isSaving} icon={<Save size={15}/>} onClick={handleSave}>{editing?'Cập nhật':'Thêm mới'}</Button>
        </div>
      </div>
    </div>
  );
}

export function BulkTransferModal({
  open, onClose, selectedStudents, uniqueClasses, isSaving, onConfirm,
}: {
  open:boolean; onClose:()=>void; selectedStudents:Student[]; uniqueClasses:any[]; isSaving:boolean;
  onConfirm:(newClassId:string,transferDate:string)=>Promise<void>;
}) {
  const [newClass,setNewClass]=useState('');
  const [transferDate,setTransferDate]=useState(new Date().toISOString().split('T')[0]);
  useEffect(()=>{ if(open){setNewClass('');setTransferDate(new Date().toISOString().split('T')[0]);} },[open]);
  if(!open) return null;
  const fromClasses=[...new Set(selectedStudents.map(s=>s.classId))];
  const isSameClass=fromClasses.length===1&&newClass===fromClasses[0];
  const classOptions=[{value:'',label:'— Chọn lớp mới —'},...uniqueClasses.map(c=>({value:c['Mã Lớp'],label:`Lớp ${c['Mã Lớp']}`}))];

  return (
    <div style={FS_WRAP}>
      <div style={{ ...FS_DLG, maxWidth:520 }}>
        <div style={{ padding:'20px 28px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <h3 style={{ fontSize:18,fontWeight:800,color:'#0f172a',margin:0 }}>Chuyển lớp hàng loạt</h3>
          <IconButton icon={<X size={18}/>} label="Đóng" onClick={onClose}/>
        </div>
        <div style={{ flex:1,minHeight:0,overflowY:'auto',padding:'20px 28px' }}>
          <p style={{ fontSize:14,color:'#64748b',fontWeight:600,margin:'0 0 12px' }}>Đã chọn <span style={{ fontWeight:700,color:'#0d9488' }}>{selectedStudents.length}</span> học sinh{fromClasses.length>0&&<span style={{ color:'#94a3b8' }}> từ lớp {fromClasses.join(', ')}</span>}:</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6,maxHeight:100,overflowY:'auto',marginBottom:16 }}>
            {selectedStudents.map(s=><span key={s.id} style={{ background:'#f0fdfa',border:'1px solid #99f6e4',color:'#0f766e',fontSize:12,fontWeight:700,padding:'3px 9px',borderRadius:7 }}>{s.name}</span>)}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <Select label="Chuyển sang lớp *" value={newClass} onChange={setNewClass} options={classOptions}/>
            <Input label="Ngày chuyển *" type="date" value={transferDate} onChange={setTransferDate}/>
          </div>
          {isSameClass&&<div style={{ display:'flex',alignItems:'center',gap:8,marginTop:12,padding:'9px 14px',borderRadius:8,background:'#fffbeb',border:'1px solid #fde68a' }}><AlertTriangle size={14} color="#d97706"/><p style={{ fontSize:13,fontWeight:600,color:'#92400e',margin:0 }}>Lớp đích trùng lớp hiện tại</p></div>}
          {newClass&&!isSameClass&&<p style={{ fontSize:13,fontWeight:600,color:'#4f46e5',background:'#eef2ff',border:'1px solid #c7d2fe',borderRadius:8,padding:'9px 14px',margin:'12px 0 0' }}>→ Chuyển từ <b>{fromClasses.join(', ')}</b> sang <b>{newClass}</b> ngày <b>{transferDate}</b></p>}
        </div>
        <div style={{ padding:'16px 28px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent="primary" loading={isSaving} disabled={!newClass||!transferDate||isSameClass} onClick={()=>newClass&&!isSameClass&&onConfirm(newClass,transferDate)}>
            {isSaving?'Đang chuyển...':`Chuyển ${selectedStudents.length} HS →`}
          </Button>
        </div>
      </div>
    </div>
  );
}
