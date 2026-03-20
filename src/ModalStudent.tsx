import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Activity, UserX } from 'lucide-react';
import { fmtVND, formatDate, capitalizeName, isValidPhone, isValidDateDMY, toInputDate } from './helpers';
import { Button, IconButton, Input, Select } from './dsComponents';
import type { Student, Payment } from './types';

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

export function StudentModal({
  open, onClose, editing, uniqueClasses, uniqueBranches, isSaving, onSave, existingIds = [],
}: {
  open:boolean; onClose:()=>void; editing:Student|null;
  uniqueClasses:any[]; uniqueBranches:string[]; isSaving:boolean; onSave:(f:any)=>Promise<void>;
  existingIds?: string[];
}) {
  const defaultBranch = uniqueBranches[0] || 'Đào Tấn';
  const [f,setF]       = useState<any>({});
  const [errors,setErrors] = useState<Record<string,string>>({});

  useEffect(()=>{ setF(editing??{branch:defaultBranch,academicLevel:'Khá',startDate:new Date().toISOString().split('T')[0]}); setErrors({}); },[editing,open]);
  if(!open) return null;

  const u=(k:string,v:string)=>{ setF((p:any)=>({...p,[k]:v})); if(errors[k]) setErrors(prev=>({...prev,[k]:''})); };

  const validate=():boolean=>{
    const err:Record<string,string>={};
    const rawId = f.id?.trim() || '';
    const normalId = rawId.replace(/\s+/g,'');
    if(!normalId) err.id='Mã HS không được để trống';
    else if(!/^[A-Z0-9_\-]+$/i.test(normalId)) err.id='Chỉ chứa chữ, số, gạch ngang';
    else if(!editing && existingIds.includes(normalId)) err.id='Mã HS đã tồn tại trong hệ thống';
    if(!f.name?.trim()) err.name='Họ và tên không được để trống';
    else if(f.name.trim().length<3) err.name='Ít nhất 3 ký tự';
    if(f.parentPhone&&!isValidPhone(f.parentPhone)) err.parentPhone='SĐT không hợp lệ';
    if(f.dob&&!isValidDateDMY(f.dob)) err.dob='Dạng DD/MM/YYYY';
    setErrors(err); return Object.keys(err).length===0;
  };

  const classOptions=[{value:'',label:'Chọn lớp'},...uniqueClasses.map(c=>({value:c['Mã Lớp'],label:c['Mã Lớp']}))];
  const academicOptions=['Xuất sắc','Giỏi','Khá','Trung bình','Yếu'].map(v=>({value:v,label:v}));
  const branchOptions=uniqueBranches.length>0?uniqueBranches.map(b=>({value:b,label:b})):[{value:'Đào Tấn',label:'Đào Tấn'},{value:'Nguyễn Quang Bích',label:'Nguyễn Quang Bích'}];

  const handleSave = async () => {
    if(validate()) {
      const normalId = (f.id||'').trim().replace(/\s+/g,'');
      await onSave({ ...f, id: normalId });
    }
  };

  return (
    <div style={MODAL_STYLE}>
      <div style={DIALOG_STYLE}>
        <div style={{ padding:'18px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:'white',flexShrink:0 }}>
          <div>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',margin:0 }}>{editing?'Sửa thông tin học sinh':'Thêm học sinh mới'}</h3>
            <p style={{ fontSize:12,color:'#64748b',fontWeight:500,margin:'2px 0 0' }}>Điền đầy đủ thông tin bên dưới</p>
          </div>
          <IconButton icon={<X size={20}/>} label="Đóng" onClick={onClose}/>
        </div>

        <div style={{ flex:1,minHeight:0,overflowY:'auto',padding:'18px 24px' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:18 }}>
            <Input label="Mã HS *" value={f.id||''} onChange={v=>u('id',v)} placeholder="HS001" error={errors.id} disabled={!!editing} size="lg"/>
            <Input label="Họ và tên *" value={f.name||''} onChange={v=>u('name',v)} placeholder="Nguyễn Văn A" error={errors.name} size="lg"/>
            <Select label="Mã lớp" value={f.classId||''} onChange={v=>u('classId',v)} options={classOptions} size="lg"/>
            <Input label="Khối lớp" value={f.grade||''} onChange={v=>u('grade',v)} placeholder="9" size="lg"/>
            <Input label="Ngày sinh (DD/MM/YYYY)" value={f.dob||''} onChange={v=>u('dob',v)} placeholder="15/08/2010" error={errors.dob} size="lg"/>
            <Input label="Ngày bắt đầu học" type="date" value={toInputDate(f.startDate||'')} onChange={v=>u('startDate',v)} size="lg"/>
            <Select label="Học lực" value={f.academicLevel||'Khá'} onChange={v=>u('academicLevel',v)} options={academicOptions} size="lg"/>
            <Input label="SĐT phụ huynh" value={f.parentPhone||''} onChange={v=>u('parentPhone',v)} placeholder="09xxxxxxxx" error={errors.parentPhone} size="lg"/>
            <Input label="Tên phụ huynh" value={f.parentName||''} onChange={v=>u('parentName',v)} size="lg"/>
            <Input label="Trường đang học" value={f.school||''} onChange={v=>u('school',v)} size="lg"/>
            <Select label="Cơ sở" value={f.branch||defaultBranch} onChange={v=>u('branch',v)} options={branchOptions} size="lg"/>
            <Input label="Mục tiêu" value={f.goal||''} onChange={v=>u('goal',v)} placeholder="8 điểm học kỳ tới" size="lg"/>
            <Input label="Facebook / Messenger URL" value={f.facebookUrl||''} onChange={v=>u('facebookUrl',v)} placeholder="https://facebook.com/ten.phu.huynh" size="lg"/>
            <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em' }}>Ghi chú / Nhận xét GV</label>
              <textarea value={f.notes||''} onChange={e=>u('notes',e.target.value)} rows={3}
                placeholder="Nhận xét về học lực, thái độ, điểm mạnh/yếu của học sinh..."
                style={{ width:'100%',padding:'10px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,fontFamily:'inherit',color:'#0f172a',resize:'vertical',outline:'none',boxSizing:'border-box',lineHeight:1.6 }}/>
            </div>
          </div>
          {Object.keys(errors).length>0&&(
            <div style={{ marginTop:16,display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:10,background:'#fff1f2',border:'1px solid #fecaca' }}>
              <span style={{ fontSize:18 }}>⚠️</span>
              <span style={{ fontSize:14,fontWeight:600,color:'#be123c' }}>Vui lòng kiểm tra lại thông tin đã nhập</span>
            </div>
          )}
        </div>

        <div style={{ padding:'14px 24px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" size="lg" onClick={onClose}>Hủy</Button>
          <Button intent="primary" size="lg" loading={isSaving} icon={<Save size={16}/>} onClick={handleSave}>
            {editing?'Cập nhật':'Thêm mới'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StudentDetailModal({ student, onClose, tlogs, payments, onToggleStatus, onSaveNote, onSaveFacebook }: {
  student:Student; onClose:()=>void; tlogs?:any[]; payments?:Payment[];
  onToggleStatus?:(student:Student,endDate?:string)=>Promise<void>;
  onSaveNote?:(student:Student,notes:string)=>Promise<void>;
  onSaveFacebook?:(student:Student,facebookUrl:string)=>Promise<void>;
}) {
  const [toggling,setToggling]=useState(false);
  const [showEndPicker,setShowEndPicker]=useState(false);
  const [endDateInput,setEndDateInput]=useState(new Date().toISOString().split('T')[0]);

  // Đọc notes từ student.notes (Google Sheet), fallback sang localStorage cho data cũ
  const noteKey = `ltn-note-${student.id}`;
  const initialNote = student.notes || (() => { try { return localStorage.getItem(noteKey)||''; } catch { return ''; } })();
  const [note, setNote] = useState<string>(initialNote);
  const [noteSaving, setNoteSaving] = useState(false);

  // Facebook URL
  const [fbUrl, setFbUrl] = useState<string>(student.facebookUrl || '');
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const saveFb = async () => {
    if (!onSaveFacebook) return;
    setFbSaving(true);
    try { await onSaveFacebook(student, fbUrl); setFbSaved(true); setTimeout(()=>setFbSaved(false), 2000); }
    finally { setFbSaving(false); }
  };
  const [noteSaved,  setNoteSaved]  = useState(false);

  // Reset note khi mở modal cho HS khác
  useEffect(() => {
    const n = student.notes || (() => { try { return localStorage.getItem(`ltn-note-${student.id}`)||''; } catch { return ''; } })();
    setNote(n);
  }, [student.id, student.notes]);

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

  const s=student, ph=String(s.parentPhone||'').replace(/\D/g,'');
  // Không hardcode tên GV — dùng giá trị thật từ student.teacher
  const resolveT=(raw:string)=>raw||'---';
  const isInactive=s.status==='inactive'||(s.endDate&&s.endDate!=='---'&&s.endDate!=='');
  let present=0,absent=0,late=0;
  // Support both GAS v29 camelCase (trangThai) and legacy Vietnamese keys ('Trạng thái')
  if(tlogs) tlogs.forEach(log=>(log.attendanceList||[]).forEach((a:any)=>{
    const id = a.maHS || a['Mã HS'] || a.MaHS || '';
    if(id !== s.id) return;
    const st = a.trangThai || a['Trạng thái'] || a.TrangThai || '';
    if(st==='Có mặt') present++; else if(st==='Vắng') absent++; else if(st==='Muộn') late++;
  }));
  const totalSessions=present+absent+late, attendPct=totalSessions>0?Math.round(present/totalSessions*100):null;
  // Tất cả giao dịch, sort mới nhất lên đầu
  const allPayments=(payments||[]).filter(p=>p.studentId===s.id).sort((a,b)=>{
      // B3 FIX: DD/MM/YYYY lexicographic sort is wrong; use timestamp compare
      const ts = (d: string) => { if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) { const [dd,mm,yyyy]=d.split('/'); return new Date(+yyyy,+mm-1,+dd).getTime(); } return new Date(d).getTime()||0; };
      return ts(b.date) - ts(a.date);
    });
  const totalPaid = allPayments.reduce((sum,p)=>sum+p.amount,0);
  const handleToggle=async(endDate?:string)=>{ if(!onToggleStatus) return; setToggling(true); try{ await onToggleStatus(s,endDate); }finally{ setToggling(false); } };
  const attendColor=(attendPct??0)>=90?'#10b981':(attendPct??0)>=70?'#f97316':'#ef4444';
  const fields=[
    {l:'Ngày sinh',v:formatDate(s.dob)},{l:'Bắt đầu học',v:formatDate(s.startDate)},
    {l:'Khối lớp',v:s.grade},{l:'Học lực',v:s.academicLevel},
    {l:'Trường HT',v:s.school},{l:'Cơ sở',v:s.branch},
    {l:'Giáo viên',v:resolveT(s.teacher)},{l:'Phụ huynh',v:s.parentName},
    {l:'SĐT PH',v:s.parentPhone},{l:'Mục tiêu',v:s.goal},{l:'Cần hỗ trợ',v:s.supportNeeded},
  ];

  return (
    <div style={MODAL_STYLE}>
      <div style={{ ...DIALOG_STYLE, maxWidth:720 }}>
        <div style={{ padding:'18px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:14,background:'white',flexShrink:0 }}>
          <div style={{ flex:1,minWidth:0 }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{capitalizeName(s.name)}</h3>
            <p style={{ fontSize:13,color:'#6366f1',fontWeight:600,margin:'3px 0 0' }}>{s.id} · Lớp {s.classId}</p>
            {isInactive&&<span style={{ display:'inline-block',marginTop:5,fontSize:12,fontWeight:700,color:'#e11d48',background:'#fff1f2',border:'1px solid #fecaca',padding:'3px 10px',borderRadius:6,textTransform:'uppercase' }}>Đã nghỉ học</span>}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
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

        <div style={{ flex:1,minHeight:0,overflowY:'auto',padding:'16px 24px' }}>

          {/* Thông tin cơ bản */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {fields.map((item,i)=>(
              <div key={i} style={{ padding:'11px 14px',borderRadius:8,background:'#f8fafc',border:'1px solid #f1f5f9',gridColumn:(item.l==='Mục tiêu'||item.l==='Cần hỗ trợ')?'1/-1':'auto' }}>
                <p style={{ fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 3px' }}>{item.l}</p>
                <p style={{ fontWeight:600,color:'#1e293b',fontSize:15,margin:0 }}>{item.v||'---'}</p>
              </div>
            ))}
          </div>

          {/* Chuyên cần */}
          {totalSessions>0&&(
            <div style={{ marginTop:16,border:'1px solid #e2e8f0',borderRadius:10,padding:16 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <Activity size={15} color="#6366f1"/>
                <span style={{ fontSize:13,fontWeight:700,color:'#6366f1',textTransform:'uppercase',letterSpacing:'0.06em',flex:1 }}>Chuyên cần ({totalSessions} buổi)</span>
                {attendPct!==null&&<span style={{ fontSize:20,fontWeight:800,color:attendColor }}>{attendPct}%</span>}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12 }}>
                {[{label:'Có mặt',val:present,color:'#059669',bg:'#ecfdf5',border:'#a7f3d0'},{label:'Vắng',val:absent,color:'#e11d48',bg:'#fff1f2',border:'#fecaca'},{label:'Muộn',val:late,color:'#d97706',bg:'#fffbeb',border:'#fde68a'}].map(({label,val,color,bg,border})=>(
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
                          <th key={h} style={{ padding:'8px 12px',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.07em',textAlign:i===3?'right':'left',borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allPayments.map((p,i)=>(
                        <tr key={i} style={{ background:i%2===0?'white':'#fafafa',borderBottom:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'9px 12px',fontSize:12,color:'#475569',whiteSpace:'nowrap' }}>{formatDate(p.date)}</td>
                          <td style={{ padding:'9px 12px',fontSize:13,fontWeight:600,color:'#1e293b' }}>{p.description||'---'}</td>
                          <td style={{ padding:'9px 12px',fontSize:12,color:'#64748b' }}>{p.method||'---'}</td>
                          <td style={{ padding:'9px 12px',fontSize:13,fontWeight:800,color:'#059669',textAlign:'right',whiteSpace:'nowrap' }}>+{fmtVND(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>

          {/* Facebook URL */}
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
              <p style={{ fontSize:12,fontWeight:700,color:'#2563eb',textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>💬 Facebook / Messenger</p>
              {fbSaved && <span style={{ fontSize:11,fontWeight:700,color:'#059669' }}>✓ Đã lưu</span>}
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <input
                value={fbUrl}
                onChange={e=>setFbUrl(e.target.value)}
                placeholder="https://facebook.com/ten.phu.huynh hoặc https://m.me/username"
                style={{ flex:1,padding:'9px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,fontFamily:'inherit',color:'#1e293b',outline:'none',boxSizing:'border-box' as any }}
                onFocus={e=>e.target.style.borderColor='#2563eb'}
                onBlur={e=>e.target.style.borderColor='#e2e8f0'}
              />
              {onSaveFacebook && (
                <button onClick={saveFb} disabled={fbSaving}
                  style={{ padding:'9px 14px',borderRadius:8,border:'none',background:fbSaving?'#f1f5f9':'#2563eb',color:fbSaving?'#94a3b8':'white',fontSize:12,fontWeight:700,cursor:fbSaving?'default':'pointer',whiteSpace:'nowrap',flexShrink:0 }}>
                  {fbSaving ? '...' : '💾 Lưu'}
                </button>
              )}
            </div>
            {fbUrl && (
              <a href={fbUrl.startsWith('http') ? fbUrl : `https://m.me/${fbUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex',alignItems:'center',gap:6,marginTop:8,fontSize:12,fontWeight:700,color:'#2563eb',textDecoration:'none' }}>
                → Mở Messenger
              </a>
            )}
          </div>

          {/* Ghi chú giáo viên */}
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
              <p style={{ fontSize:12,fontWeight:700,color:'#7c3aed',textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>📝 Nhận xét giáo viên</p>
              {noteSaved && <span style={{ fontSize:11,fontWeight:700,color:'#059669' }}>✓ Đã lưu lên Sheet</span>}
            </div>
            <textarea
              value={note}
              onChange={e=>setNote(e.target.value)}
              placeholder="Nhận xét về học lực, thái độ, điểm mạnh/yếu của học sinh..."
              rows={3}
              style={{ width:'100%',padding:'10px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,fontFamily:'inherit',color:'#1e293b',resize:'vertical',outline:'none',boxSizing:'border-box',lineHeight:1.6 }}
              onFocus={e=>e.target.style.borderColor='#7c3aed'}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'}
            />
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6 }}>
              <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>
                {onSaveNote ? 'Lưu lên Google Sheet để dùng trên mọi thiết bị' : 'Lưu trên thiết bị này'}
              </p>
              <button
                onClick={saveNote}
                disabled={noteSaving}
                style={{ padding:'5px 14px',borderRadius:7,border:'none',background:noteSaving?'#f1f5f9':'#7c3aed',color:noteSaving?'#94a3b8':'white',fontSize:12,fontWeight:700,cursor:noteSaving?'default':'pointer' }}
              >
                {noteSaving ? '⏳ Đang lưu...' : '💾 Lưu nhận xét'}
              </button>
            </div>
          </div>

        </div>

        <div style={{ padding:'14px 24px',borderTop:'1px solid #f1f5f9',display:'flex',gap:10,flexShrink:0 }}>
          {ph.length>=9&&<>
            <a href={`tel:${ph}`} style={{ flex:1 }}><Button variant="outline" intent="success" fullWidth size="lg">📞 Gọi điện</Button></a>
            <a href={`https://zalo.me/${ph}`} target="_blank" rel="noopener noreferrer" style={{ flex:1,textDecoration:'none' }}><Button variant="outline" intent="primary" fullWidth size="lg">💬 Zalo PH</Button></a>
          </>}
          {s.facebookUrl && (
            <a href={s.facebookUrl.startsWith('http') ? s.facebookUrl : `https://m.me/${s.facebookUrl}`}
              target="_blank" rel="noopener noreferrer" style={{ flex:1,textDecoration:'none' }}>
              <Button variant="outline" intent="primary" fullWidth size="lg" style={{ background:'#e8f0fe',color:'#2563eb',borderColor:'#c7d2fe' }}>
                💬 Messenger
              </Button>
            </a>
          )}
          <Button variant="outline" intent="neutral" fullWidth size="lg" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
