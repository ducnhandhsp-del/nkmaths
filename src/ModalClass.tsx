import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Button, IconButton, Input, Select } from './dsComponents';
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
    onSave({
      ...f,
      'Mã Lớp': String(f['Mã Lớp'] || '').trim().toUpperCase(),
      'Tên Lớp': String(f['Tên Lớp'] || '').trim(),
      'Khối': String(f['Khối'] || '').trim(),
      'Giáo viên': String(f['Giáo viên'] || '').trim(),
      'Cơ sở': String(f['Cơ sở'] || '').trim(),
      'Buổi 1': String(f['Buổi 1'] || '').trim(),
      'Buổi 2': String(f['Buổi 2'] || '').trim(),
      'Buổi 3': String(f['Buổi 3'] || '').trim(),
    } as ClassRecord);
  };

  const teacherOptions=[{value:'',label:'Chọn GV'},...(teacherList.length>0?teacherList:['Lê Đức Nhân','Nguyễn Thị Kiên']).map(t=>({value:t,label:t}))];
  const branchOptions=[{value:'',label:'Chọn cơ sở'},...(uniqueBranches.length>0?uniqueBranches.map(b=>({value:b,label:b})):[{value:'Đào Tấn',label:'Đào Tấn'},{value:'Nguyễn Quang Bích',label:'Nguyễn Quang Bích'}])];

  return (
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div className="ltn-quick-modal narrow">
        <header className="ltn-quick-head">
          <div className="ltn-quick-title-row">
            <div className="ltn-quick-title">
              <div className="ltn-quick-icon">L</div>
              <div>
                <h2>{editing ? 'Sửa lớp học' : 'Thêm lớp học'}</h2>
              </div>
            </div>
            <button className="ltn-quick-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>

        <div className="ltn-quick-body">
          <section className="ltn-quick-card">
            <div className="ltn-quick-grid">
              <div className="ltn-quick-field">
                <label>Mã lớp</label>
                <input value={f['Mã Lớp'] || ''} onChange={e=>u('Mã Lớp', e.target.value)} placeholder="12A_2K9_2026" disabled={!!editing} />
              </div>
              <div className="ltn-quick-field">
                <label>Tên lớp</label>
                <input value={f['Tên Lớp'] || ''} onChange={e=>u('Tên Lớp', e.target.value)} placeholder="12A" />
              </div>
              <div className="ltn-quick-field">
                <label>Khối</label>
                <input value={f['Khối'] || ''} onChange={e=>u('Khối', e.target.value)} placeholder="12" />
              </div>
              <div className="ltn-quick-field">
                <label>Giáo viên</label>
                <select value={f['Giáo viên'] || ''} onChange={e=>u('Giáo viên', e.target.value)}>
                  {teacherOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="ltn-quick-field">
                <label>Cơ sở</label>
                <select value={f['Cơ sở'] || ''} onChange={e=>u('Cơ sở', e.target.value)}>
                  {branchOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="ltn-quick-card soft">
            <div className="ltn-quick-grid three">
              {(['Buổi 1','Buổi 2','Buổi 3'] as const).map((b, idx)=>(
                <div key={b} className="ltn-quick-field">
                  <label>{b}</label>
                  <input
                    value={f[b] || ''}
                    onChange={e=>u(b, e.target.value)}
                    placeholder={idx === 0 ? 'T2 17:30' : idx === 1 ? 'T4 17:30' : 'T6 17:30'}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="ltn-quick-foot">
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent={editing ? 'primary' : 'success'} loading={isSaving} icon={<Save size={15}/>} onClick={handleSave}>
            {editing?'Cập nhật lớp':'Lưu lớp học'}
          </Button>
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
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div className="ltn-form-modal-panel" style={{ ...FS_DLG, maxWidth:520 }}>
        <div className="ltn-form-modal-header" style={{ padding:'20px 28px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <h3 style={{ fontSize:18,fontWeight:800,color:'#0f172a',margin:0 }}>Chuyển lớp hàng loạt</h3>
          <IconButton icon={<X size={18}/>} label="Đóng" onClick={onClose}/>
        </div>
        <div className="ltn-form-modal-body" style={{ flex:1,minHeight:0,overflowY:'auto',padding:'20px 28px' }}>
          <p style={{ fontSize:14,color:'#64748b',fontWeight:600,margin:'0 0 12px' }}>Đã chọn <span style={{ fontWeight:700,color:'#0d9488' }}>{selectedStudents.length}</span> học sinh{fromClasses.length>0&&<span style={{ color:'#94a3b8' }}> từ lớp {fromClasses.join(', ')}</span>}:</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6,maxHeight:100,overflowY:'auto',marginBottom:16 }}>
            {selectedStudents.map(s=><span key={s.id} style={{ background:'#f0fdfa',border:'1px solid #99f6e4',color:'#0f766e',fontSize:12,fontWeight:700,padding:'3px 9px',borderRadius:7 }}>{s.name}</span>)}
          </div>
          <div className="ltn-form-grid-2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <Select label="Chuyển sang lớp *" value={newClass} onChange={setNewClass} options={classOptions}/>
            <Input label="Ngày chuyển *" type="date" value={transferDate} onChange={setTransferDate}/>
          </div>
          {isSameClass&&<div style={{ display:'flex',alignItems:'center',gap:8,marginTop:12,padding:'9px 14px',borderRadius:8,background:'#fffbeb',border:'1px solid #fde68a' }}><AlertTriangle size={14} color="#d97706"/><p style={{ fontSize:13,fontWeight:600,color:'#92400e',margin:0 }}>Lớp đích trùng lớp hiện tại</p></div>}
          {newClass&&!isSameClass&&<p style={{ fontSize:13,fontWeight:600,color:'#4f46e5',background:'#eef2ff',border:'1px solid #c7d2fe',borderRadius:8,padding:'9px 14px',margin:'12px 0 0' }}>→ Chuyển từ <b>{fromClasses.join(', ')}</b> sang <b>{newClass}</b> ngày <b>{transferDate}</b></p>}
        </div>
        <div className="ltn-form-modal-footer" style={{ padding:'16px 28px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent="primary" loading={isSaving} disabled={!newClass||!transferDate||isSameClass} onClick={()=>newClass&&!isSameClass&&onConfirm(newClass,transferDate)}>
            {isSaving?'Đang chuyển...':`Chuyển ${selectedStudents.length} HS →`}
          </Button>
        </div>
      </div>
    </div>
  );
}
