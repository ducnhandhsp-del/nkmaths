import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Activity, UserX, Phone, MessageCircle, Trash2, ExternalLink } from 'lucide-react';
import { fmtVND, formatDate, capitalizeName, compareClassCode, isValidPhone, isValidDateDMY, toInputDate } from './helpers';
import { Button, IconButton, Input, Select } from './dsComponents';
import { DetailMetric } from './uiSystem';
import { calcStudentAttendance } from './measures';
import type { Student, Payment, DeleteTarget } from './types';

const MODAL_STYLE: React.CSSProperties = {
  position:'fixed', inset:0, zIndex:200,
  display:'flex', alignItems:'center', justifyContent:'center',
  padding:'12px', background:'rgba(15,23,42,0.65)', backdropFilter:'blur(5px)',
};
const DIALOG_STYLE: React.CSSProperties = {
  background:'white', width:'100%', maxWidth:840,
  maxHeight:'95vh', borderRadius:14, overflow:'hidden',
  display:'flex', flexDirection:'column',
  boxShadow:'0 24px 80px rgba(0,0,0,0.28)',
};

function nextStudentId(existingIds: string[]): string {
  const used = new Set(existingIds.map(id => String(id || '').trim().toUpperCase()));
  const maxNo = existingIds.reduce((max, id) => {
    const m = String(id || '').trim().toUpperCase().match(/^HS0*(\d+)$/);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  let nextNo = maxNo + 1;
  let nextId = `HS${String(nextNo).padStart(3, '0')}`;
  while (used.has(nextId)) {
    nextNo += 1;
    nextId = `HS${String(nextNo).padStart(3, '0')}`;
  }
  return nextId;
}

function gradeFromClassId(classId: string): string {
  return String(classId || '').trim().match(/\d+/)?.[0] || '';
}

export function StudentModal({
  open, onClose, editing, uniqueClasses, uniqueBranches, isSaving, onSave, existingIds = [],
}: {
  open:boolean; onClose:()=>void; editing:Student|null;
  uniqueClasses:any[]; uniqueBranches:string[]; isSaving:boolean; onSave:(f:any)=>Promise<void>;
  existingIds?: string[];
}) {
  const preferredBranch = 'Đào Tấn';
  const defaultBranch = uniqueBranches.find(b => b.trim().toLowerCase() === preferredBranch.toLowerCase()) || preferredBranch;
  const generatedId = nextStudentId(existingIds);
  const [f,setF]       = useState<any>({});
  const [errors,setErrors] = useState<Record<string,string>>({});

  useEffect(()=>{ setF(editing??{id:generatedId,branch:defaultBranch,academicLevel:'Khá',startDate:new Date().toISOString().split('T')[0]}); setErrors({}); },[editing,open,defaultBranch,generatedId]);
  if(!open) return null;

  const u=(k:string,v:string)=>{ setF((p:any)=>({...p,[k]:v})); if(errors[k]) setErrors(prev=>({...prev,[k]:''})); };

  const validate=():boolean=>{
    const err:Record<string,string>={};
    const rawId = f.id?.trim() || '';
    const normalId = rawId.replace(/\s+/g,'').toUpperCase();
    if(!normalId) err.id='Mã HS không được để trống';
    else if(!editing && !/^HS\d{3}$/.test(normalId)) err.id='Mã HS phải có dạng HS001';
    else if(editing && !/^[A-Z0-9_\-]+$/i.test(normalId)) err.id='Chỉ chứa chữ, số, gạch ngang';
    else if(!editing && existingIds.some(id => String(id).trim().toUpperCase() === normalId)) err.id='Mã HS đã tồn tại trong hệ thống';
    if(!f.name?.trim()) err.name='Họ và tên không được để trống';
    else if(f.name.trim().length<3) err.name='Ít nhất 3 ký tự';
    if(f.parentPhone&&!isValidPhone(f.parentPhone)) err.parentPhone='SĐT không hợp lệ';
    if(f.studentPhone&&!isValidPhone(f.studentPhone)) err.studentPhone='SĐT không hợp lệ';
    if(f.dob&&!isValidDateDMY(f.dob)) err.dob='Dạng DD/MM/YYYY';
    setErrors(err); return Object.keys(err).length===0;
  };

  const classOptions=[
    {value:'',label:'Chọn lớp'},
    ...uniqueClasses
      .map(c=>({value:c['Mã Lớp'],label:c['Mã Lớp']}))
      .filter(o=>o.value)
      .sort((a,b)=>compareClassCode(a.value,b.value))
  ];
  const academicOptions=['Xuất sắc','Giỏi','Khá','Trung bình','Yếu'].map(v=>({value:v,label:v}));
  const branchValues=[defaultBranch,...(uniqueBranches.length>0?uniqueBranches:['Nguyễn Quang Bích'])].filter((b,i,arr)=>b&&arr.indexOf(b)===i);
  const branchOptions=branchValues.map(b=>({value:b,label:b}));

  const handleSave = async () => {
    if(validate()) {
      const normalId = (f.id||'').trim().replace(/\s+/g,'').toUpperCase();
      await onSave({
        ...f,
        id: normalId,
        status: f.status || 'active',
        grade: gradeFromClassId(f.classId) || String(f.grade ?? '').trim(),
        parentPhone: String(f.parentPhone ?? '').trim(),
        studentPhone: String(f.studentPhone ?? '').trim(),
      });
    }
  };

  return (
    <div className="ltn-form-modal-overlay" style={MODAL_STYLE}>
      <div className="ltn-quick-modal">
        <header className="ltn-quick-head">
          <div className="ltn-quick-title-row">
            <div className="ltn-quick-title">
              <div className="ltn-quick-icon">HS</div>
              <div>
                <h2>{editing ? 'Sửa học sinh' : 'Thêm học sinh'}</h2>
              </div>
            </div>
            <button className="ltn-quick-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>

        <div className="ltn-quick-body">
          <section className="ltn-quick-card">
            <p className="ltn-section-title">Hồ sơ</p>
            <div className="ltn-grid-12">
              <div className="span-2"><Input label="Mã HS *" value={f.id||''} onChange={v=>u('id',v)} placeholder="HS001" error={errors.id} disabled size="lg"/></div>
              <div className="span-4"><Input label="Họ tên học sinh *" value={f.name||''} onChange={v=>u('name',v)} placeholder="Nguyễn Văn A" error={errors.name} size="lg"/></div>
              <div className="span-3"><Input label="Ngày sinh" value={f.dob||''} onChange={v=>u('dob',v)} placeholder="15/08/2010" error={errors.dob} size="lg"/></div>
              <div className="span-3"><Input label="Bắt đầu học" type="date" value={toInputDate(f.startDate||'')} onChange={v=>u('startDate',v)} size="lg"/></div>
            </div>

            <p className="ltn-section-title">Học tập</p>
            <div className="ltn-grid-12">
              <div className="span-2"><Select label="Lớp" value={f.classId||''} onChange={v=>u('classId',v)} options={classOptions} size="lg"/></div>
              <div className="span-4"><Input label="Trường" value={f.school||''} onChange={v=>u('school',v)} size="lg"/></div>
              <div className="span-2"><Select label="Học lực" value={f.academicLevel||'Khá'} onChange={v=>u('academicLevel',v)} options={academicOptions} size="lg"/></div>
              <div className="span-4"><Select label="Cơ sở" value={f.branch||defaultBranch} onChange={v=>u('branch',v)} options={branchOptions} size="lg"/></div>
            </div>

            <p className="ltn-section-title">Liên hệ & ghi chú</p>
            <div className="ltn-grid-12">
              <div className="span-4"><Input label="Phụ huynh" value={f.parentName||''} onChange={v=>u('parentName',v)} size="lg"/></div>
              <div className="span-4"><Input label="SĐT phụ huynh" value={f.parentPhone||''} onChange={v=>u('parentPhone',v)} placeholder="09xxxxxxxx" error={errors.parentPhone} size="lg"/></div>
              <div className="span-4"><Input label="SĐT học sinh" value={f.studentPhone||''} onChange={v=>u('studentPhone',v)} placeholder="09xxxxxxxx" error={errors.studentPhone} size="lg"/></div>
              <div className="span-12 ltn-quick-field">
                <label>Nhận xét GV</label>
                <textarea value={f.notes||''} onChange={e=>u('notes',e.target.value)} rows={2} placeholder="Học lực, thái độ, lịch mong muốn..." />
              </div>
            </div>
          </section>

          {Object.keys(errors).length>0&&(
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:10,background:'#fff1f2',border:'1px solid #fecaca' }}>
              <span style={{ fontSize:18 }}>⚠️</span>
              <span style={{ fontSize:14,fontWeight:600,color:'#be123c' }}>Vui lòng kiểm tra lại thông tin đã nhập</span>
            </div>
          )}
        </div>

        <div className="ltn-quick-foot">
          <Button variant="outline" intent="neutral" size="lg" onClick={onClose}>Hủy</Button>
          <Button intent={editing ? 'primary' : 'success'} size="lg" loading={isSaving} icon={<Save size={16}/>} onClick={handleSave}>
            {isSaving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StudentDetailModal({ student, onClose, tlogs, payments, onToggleStatus, onSaveNote, onSaveFacebook, onEdit, onDelete }: {
  student:Student; onClose:()=>void; tlogs?:any[]; payments?:Payment[];
  onToggleStatus?:(student:Student,endDate?:string)=>Promise<void>;
  onSaveNote?:(student:Student,notes:string)=>Promise<void>;
  onSaveFacebook?:(student:Student,facebookUrl:string)=>Promise<void>;
  onEdit?:(student:Student)=>void;
  onDelete?:(target:DeleteTarget)=>void;
}) {
  const [toggling,setToggling]=useState(false);
  const [showEndPicker,setShowEndPicker]=useState(false);
  const [endDateInput,setEndDateInput]=useState(new Date().toISOString().split('T')[0]);

  // Đọc notes từ student.notes (Google Sheet), fallback sang localStorage cho data cũ
  const noteKey = `ltn-note-${student.id}`;
  const initialNote = student.notes || (() => { try { return localStorage.getItem(noteKey)||''; } catch { return ''; } })();
  const [note, setNote] = useState<string>(initialNote);
  const [noteSaving, setNoteSaving] = useState(false);

  const [noteSaved,  setNoteSaved]  = useState(false);
  const fbKey = `ltn-facebook-${student.id}`;
  const initialFacebook = student.facebookUrl || (() => { try { return localStorage.getItem(fbKey)||''; } catch { return ''; } })();
  const [facebookUrl, setFacebookUrl] = useState<string>(initialFacebook);
  const [facebookSaving, setFacebookSaving] = useState(false);
  const [facebookSaved, setFacebookSaved] = useState(false);

  // Reset note khi mở modal cho HS khác
  useEffect(() => {
    const n = student.notes || (() => { try { return localStorage.getItem(`ltn-note-${student.id}`)||''; } catch { return ''; } })();
    setNote(n);
  }, [student.id, student.notes]);

  useEffect(() => {
    const url = student.facebookUrl || (() => { try { return localStorage.getItem(`ltn-facebook-${student.id}`)||''; } catch { return ''; } })();
    setFacebookUrl(url);
  }, [student.id, student.facebookUrl]);

  const saveNote = async () => {
    if (onSaveNote) {
      setNoteSaving(true);
      try { await onSaveNote(student, note); setNoteSaved(true); setTimeout(()=>setNoteSaved(false), 2000); }
      catch { /* fallback localStorage */ try { localStorage.setItem(noteKey, note); } catch {} setNoteSaved(true); setTimeout(()=>setNoteSaved(false), 2000); }
      finally { setNoteSaving(false); }
    } else {
      // Không có onSaveNote → dùng localStorage
      try { localStorage.setItem(noteKey, note); } catch {}
      setNoteSaved(true); setTimeout(()=>setNoteSaved(false), 1800);
    }
  };

  const saveFacebook = async () => {
    const cleanUrl = facebookUrl.trim();
    if (onSaveFacebook) {
      setFacebookSaving(true);
      try { await onSaveFacebook(student, cleanUrl); setFacebookSaved(true); setTimeout(()=>setFacebookSaved(false), 2000); }
      catch { try { localStorage.setItem(fbKey, cleanUrl); } catch {} setFacebookSaved(true); setTimeout(()=>setFacebookSaved(false), 2000); }
      finally { setFacebookSaving(false); }
    } else {
      try { localStorage.setItem(fbKey, cleanUrl); } catch {}
      setFacebookSaved(true); setTimeout(()=>setFacebookSaved(false), 1800);
    }
  };

  const s=student, ph=String(s.parentPhone||'').replace(/\D/g,'');
  // Không hardcode tên GV — dùng giá trị thật từ student.teacher
  const resolveT=(raw:string)=>raw||'---';
  const isInactive=s.status==='inactive'||(s.endDate&&s.endDate!=='---'&&s.endDate!=='');
  const attendance = calcStudentAttendance(tlogs || [], s.id);
  const present=attendance.present,absent=attendance.absent,excused=attendance.excused;
  const totalSessions=attendance.total, attendPct=attendance.pct;
  // Tất cả giao dịch, sort mới nhất lên đầu
  const allPayments=(payments||[]).filter(p=>p.studentId===s.id).sort((a,b)=>{
      // B3 FIX: DD/MM/YYYY lexicographic sort is wrong; use timestamp compare
      const ts = (d: string) => { if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) { const [dd,mm,yyyy]=d.split('/'); return new Date(+yyyy,+mm-1,+dd).getTime(); } return new Date(d).getTime()||0; };
      return ts(b.date) - ts(a.date);
    });
  const totalPaid = allPayments.reduce((sum,p)=>sum+p.amount,0);
  const handleToggle=async(endDate?:string)=>{ if(!onToggleStatus) return; setToggling(true); try{ await onToggleStatus(s,endDate); }finally{ setToggling(false); } };
  const attendColor=(attendPct??0)>=90?'#10b981':(attendPct??0)>=70?'#f97316':'#ef4444';
  const statusText = isInactive ? 'Đã nghỉ' : s.status === 'onleave' ? 'Tạm nghỉ' : 'Đang học';
  const profileFields=[
    {l:'Mã HS',v:s.id},{l:'Tên HS',v:capitalizeName(s.name)},{l:'Ngày sinh',v:formatDate(s.dob)},{l:'Bắt đầu học',v:formatDate(s.startDate)},
  ];
  const learningFields=[
    {l:'Trường',v:s.school},{l:'Học lực',v:s.academicLevel},{l:'Mục tiêu',v:s.goal},
  ];
  const contactFields=[
    {l:'Phụ huynh',v:s.parentName},{l:'SĐT PH',v:s.parentPhone},{l:'SĐT HS',v:s.studentPhone},
  ];
  const renderInfo = (items: {l:string; v:any}[], itemClass = 'ltn-info-cell compact') => (
    <div className="ltn-info-grid">
      {items.map(item => (
        <div key={item.l} className={itemClass}>
          <p>{item.l}</p>
          <p>{item.v || '---'}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="ltn-form-modal-overlay" style={MODAL_STYLE}>
      <div className="ltn-form-modal-panel" style={{ ...DIALOG_STYLE, maxWidth:720 }}>
        <div className="ltn-form-modal-header" style={{ padding:'18px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:14,background:'white',flexShrink:0 }}>
          <div style={{ flex:1,minWidth:0 }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{capitalizeName(s.name)}</h3>
            {isInactive&&<span style={{ display:'inline-block',marginTop:5,fontSize:12,fontWeight:700,color:'#e11d48',background:'#fff1f2',border:'1px solid #fecaca',padding:'3px 10px',borderRadius:6,textTransform:'uppercase' }}>Đã nghỉ học</span>}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            {ph.length>=9&&<a href={`tel:${ph}`} style={{ textDecoration:'none' }}><Button variant="outline" intent="success" size="sm" icon={<Phone size={14}/>}>Gọi</Button></a>}
            {ph.length>=9&&<a href={`https://zalo.me/${ph}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}><Button variant="outline" intent="primary" size="sm" icon={<MessageCircle size={14}/>}>Zalo PH</Button></a>}
            {onEdit && <Button intent="primary" variant="outline" size="sm" onClick={() => onEdit(student)}>Sửa hồ sơ</Button>}
            {onDelete && <Button intent="danger" variant="outline" size="sm" icon={<Trash2 size={14}/>} onClick={() => onDelete({ type:'student', id:s.id, name:capitalizeName(s.name) || s.id })}>Xóa</Button>}
            {onToggleStatus&&(isInactive
              ? <Button intent="success" variant="outline" size="sm" icon={<UserCheck size={14}/>} loading={toggling} onClick={()=>handleToggle()}>Học lại</Button>
              : showEndPicker
                ? <div style={{ display:'flex',alignItems:'center',gap:8,background:'#fff1f2',border:'1px solid #fecaca',borderRadius:8,padding:'7px 12px' }}>
                    <span style={{ fontSize:13,fontWeight:700,color:'#be123c',whiteSpace:'nowrap' }}>Ngày nghỉ:</span>
                    <input type="date" value={endDateInput} onChange={e=>setEndDateInput(e.target.value)} style={{ fontSize:13,fontWeight:600,color:'#9f1239',background:'transparent',border:'none',borderBottom:'1px solid #fca5a5',outline:'none' }}/>
                    <Button size="xs" intent="danger" loading={toggling} onClick={()=>{setShowEndPicker(false);handleToggle(endDateInput);}}>Xác nhận</Button>
                    <Button size="xs" variant="ghost" intent="neutral" onClick={()=>setShowEndPicker(false)}>Hủy</Button>
                  </div>
                : <Button intent="danger" variant="outline" size="sm" icon={<UserX size={14}/>} onClick={()=>{setEndDateInput(new Date().toISOString().split('T')[0]);setShowEndPicker(true);}}>Nghỉ học</Button>
            )}
            <IconButton icon={<X size={20}/>} label="Đóng" onClick={onClose}/>
          </div>
        </div>

        <div className="ltn-form-modal-body" style={{ flex:1,minHeight:0,overflowY:'auto',padding:'16px 24px' }}>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(108px,1fr))',gap:10,marginBottom:12 }}>
            <DetailMetric label="Lớp" value={s.classId || '---'} tone="violet" valueSize={18} truncate />
            <DetailMetric label="Trạng thái" value={statusText} tone={isInactive ? 'rose' : 'emerald'} valueSize={18} truncate />
            <DetailMetric label="Chuyên cần" value={attendPct === null ? '—' : `${attendPct}%`} tone={attendPct === null ? 'sky' : attendPct >= 90 ? 'emerald' : attendPct >= 70 ? 'amber' : 'rose'} valueSize={18} truncate />
            <DetailMetric label="Đã đóng" value={fmtVND(totalPaid)} tone="emerald" valueSize={18} truncate />
          </div>

          <section className="ltn-detail-section">
            <p className="ltn-section-title">Hồ sơ</p>
            {renderInfo(profileFields, 'ltn-info-cell quarter')}
          </section>

          <section className="ltn-detail-section soft" style={{ marginTop: 12 }}>
            <p className="ltn-section-title">Học tập</p>
            {renderInfo(learningFields, 'ltn-info-cell quarter')}
          </section>

          <section className="ltn-detail-section" style={{ marginTop: 12 }}>
            <p className="ltn-section-title">Liên hệ</p>
            {renderInfo(contactFields)}
            <div style={{ marginTop: 10, border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', background:'#fff' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'9px 12px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                <div>
                  <p style={{ margin:0,fontSize:11,fontWeight:900,color:'#64748b',textTransform:'uppercase',letterSpacing:'.07em' }}>Facebook</p>
                  <p style={{ margin:'2px 0 0',fontSize:11,fontWeight:700,color:'#94a3b8' }}>Link hồ sơ hoặc nguồn tuyển sinh</p>
                </div>
                {facebookSaved && <span style={{ fontSize:11,fontWeight:900,color:'#059669',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:999,padding:'3px 8px',whiteSpace:'nowrap' }}>Đã lưu</span>}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto',gap:8,padding:10,alignItems:'center' }}>
                <input
                  value={facebookUrl}
                  onChange={e=>setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                  style={{ minWidth:0,height:34,border:'1px solid #dbe3ef',borderRadius:8,padding:'0 10px',fontSize:13,fontWeight:700,color:'#0f172a',outline:'none' }}
                />
                {facebookUrl.trim() && (
                  <a href={facebookUrl.trim()} target="_blank" rel="noopener noreferrer" title="Mở Facebook" style={{ height:34,width:34,borderRadius:8,border:'1px solid #bfdbfe',background:'#eff6ff',color:'#2563eb',display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none' }}>
                    <ExternalLink size={14}/>
                  </a>
                )}
                <button
                  onClick={saveFacebook}
                  disabled={facebookSaving}
                  style={{ height:34,padding:'0 12px',borderRadius:8,border:`1px solid ${facebookSaving?'#e2e8f0':'#bfdbfe'}`,background:facebookSaving?'#f8fafc':'#2563eb',color:facebookSaving?'#94a3b8':'#fff',fontSize:12,fontWeight:900,cursor:facebookSaving?'default':'pointer' }}
                >
                  {facebookSaving ? 'Đang lưu' : 'Lưu'}
                </button>
              </div>
            </div>
          </section>

          <section className="ltn-detail-section soft" style={{ marginTop: 12 }}>
            <p className="ltn-section-title">Giáo viên phụ trách</p>
            <div className="ltn-info-grid">
              <div className="ltn-info-cell compact">
                <p>Giáo viên</p>
                <p>{resolveT(s.teacher)}</p>
              </div>
              <div className="ltn-info-cell compact">
                <p>Cơ sở</p>
                <p>{s.branch || '---'}</p>
              </div>
              <div className="ltn-info-cell wide" style={{ padding: 0, overflow: 'hidden', background: '#fff' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'10px 12px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0' }}>
                  <div>
                    <p style={{ margin:0,fontSize:11,fontWeight:900,color:'#64748b',textTransform:'uppercase',letterSpacing:'.07em' }}>Nhận xét</p>
                    <p style={{ margin:'2px 0 0',fontSize:11,fontWeight:700,color:'#94a3b8' }}>Học lực, thái độ, nguồn tuyển sinh hoặc lưu ý phối hợp</p>
                  </div>
                  {noteSaved && <span style={{ fontSize:11,fontWeight:900,color:'#059669',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:999,padding:'3px 8px',whiteSpace:'nowrap' }}>Đã lưu</span>}
                </div>
                <textarea
                  value={note}
                  onChange={e=>setNote(e.target.value)}
                  rows={4}
                  placeholder="Nhận xét về học lực, thái độ..."
                  style={{ width:'100%', minHeight: 94, padding:'12px 14px', border:'none', borderBottom:'1px solid #e2e8f0', background:'#fff', fontSize:13, fontFamily:'inherit', color:'#0f172a', resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.5 }}
                />
                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap: 8, padding:'9px 12px',background:'#fff' }}>
                  <button
                    onClick={saveNote}
                    disabled={noteSaving}
                    style={{ minHeight:32,padding:'6px 14px', borderRadius:9, border:`1px solid ${noteSaving?'#e2e8f0':'#bfdbfe'}`, background:noteSaving?'#f8fafc':'#2563eb', color:noteSaving?'#94a3b8':'white', fontSize:12, fontWeight:900, cursor:noteSaving?'default':'pointer', boxShadow:noteSaving?'none':'0 6px 14px rgba(37,99,235,.18)' }}
                  >
                    {noteSaving ? 'Đang lưu...' : 'Lưu nhận xét'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Chuyên cần */}
          {totalSessions>0&&(
            <div style={{ marginTop:16,border:'1px solid #e2e8f0',borderRadius:10,padding:16 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <Activity size={15} color="#6366f1"/>
                <span style={{ fontSize:13,fontWeight:700,color:'#6366f1',textTransform:'uppercase',letterSpacing:'0.06em',flex:1 }}>Chuyên cần ({totalSessions} buổi)</span>
                {attendPct!==null&&<span style={{ fontSize:20,fontWeight:800,color:attendColor }}>{attendPct}%</span>}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12 }}>
                {[{label:'Có mặt',val:present,color:'#059669',bg:'#ecfdf5',border:'#a7f3d0'},{label:'Vắng',val:absent,color:'#e11d48',bg:'#fff1f2',border:'#fecaca'},{label:'Có phép',val:excused,color:'#d97706',bg:'#fffbeb',border:'#fde68a'}].map(({label,val,color,bg,border})=>(
                  <div key={label} style={{ background:bg,border:`1px solid ${border}`,borderRadius:9,padding:'12px 8px',textAlign:'center' }}>
                    <p style={{ fontSize:28,fontWeight:800,color,margin:0,lineHeight:1 }}>{val}</p>
                    <p style={{ fontSize:11,fontWeight:700,color,margin:'4px 0 0',textTransform:'uppercase' }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ height:8,background:'#e2e8f0',borderRadius:4,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${attendPct??0}%`,background:attendColor,borderRadius:4,transition:'width 0.4s' }}/>
              </div>
            </div>
          )}

          {/* Lịch sử giao dịch đầy đủ */}
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
              <p style={{ fontSize:12,fontWeight:700,color:'#059669',textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>
                💰 Lịch sử đóng phí ({allPayments.length} lần)
              </p>
              {allPayments.length>0&&(
                <span style={{ fontSize:13,fontWeight:800,color:'#059669' }}>Tổng: {fmtVND(totalPaid)}</span>
              )}
            </div>
            {allPayments.length===0
              ? <p style={{ textAlign:'center',color:'#94a3b8',fontStyle:'italic',fontSize:13,padding:'16px 0',margin:0 }}>Chưa có giao dịch nào</p>
              : <div style={{ border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['Ngày','Nội dung','Hình thức','Số tiền'].map((h,i)=>(
                          <th key={h} style={{ padding:'8px 12px',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',textAlign:i===3?'right':i===2?'center':'left',borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allPayments.map((p,i)=>(
                        <tr key={i} style={{ background:i%2===0?'white':'#fafafa',borderBottom:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'9px 12px',fontSize:12,color:'#475569',whiteSpace:'nowrap' }}>{formatDate(p.date)}</td>
                          <td style={{ padding:'9px 12px',fontSize:13,fontWeight:600,color:'#1e293b' }}>{p.description||'---'}</td>
                          <td style={{ padding:'9px 12px',fontSize:12,color:'#64748b',textAlign:'center' }}>{p.method||'---'}</td>
                          <td style={{ padding:'9px 12px',fontSize:13,fontWeight:800,color:'#059669',textAlign:'right',whiteSpace:'nowrap' }}>+{fmtVND(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>

        </div>

        <div className="ltn-form-modal-footer" style={{ padding:'10px 24px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" size="sm" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
