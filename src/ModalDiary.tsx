import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Save, BookOpen, Edit3 } from 'lucide-react';
import { formatDate, toInputDate, localDateStr } from './helpers';

import { Button, AttendancePicker } from './dsComponents';
import type { AttendanceStudent } from './dsComponents';
import type { Student } from './types';

const FS_WRAP: React.CSSProperties = { position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(15,23,42,0.65)',backdropFilter:'blur(5px)' };
const FS_DLG: React.CSSProperties  = { background:'white',width:'100%',maxWidth:900,maxHeight:'95dvh',borderRadius:'12px 12px 0 0',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.28)' };

function normalizeAttendanceLabel(raw: string): 'Có mặt' | 'Vắng' | 'Có phép' {
  const s = (raw || '').trim();
  if (s === 'Vắng') return 'Vắng';
  if (s === 'Có phép' || s === 'Nghỉ có phép') return 'Có phép';
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n === 'vang' || n === 'absent') return 'Vắng';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'Có phép';
  return 'Có mặt';
}

function readClassField(c: any, keys: string[]): string {
  for (const key of keys) {
    const value = String(c?.[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function classCode(c: any): string {
  return readClassField(c, ['Mã Lớp', 'Mã lớp', 'MaLop', 'classId']);
}

function extractScheduleTimes(c: any): string[] {
  const raw = [
    readClassField(c, ['Ca học', 'Ca hoc', 'CaHoc']),
    readClassField(c, ['Buổi 1', 'Buoi 1', 'Buoi1']),
    readClassField(c, ['Buổi 2', 'Buoi 2', 'Buoi2']),
    readClassField(c, ['Buổi 3', 'Buoi 3', 'Buoi3']),
  ].filter(Boolean).join(' | ');
  const found = raw.match(/\b\d{1,2}h(?:\d{1,2})?\b/g) || [];
  return [...new Set(found)];
}

export function DiaryModal({
  open, onClose, uniqueClasses, students, isSaving, onSave, editingLog, caDayOptions=[], preselectedClassId='', preselectedDate='', preselectedCaDay='',
}: {
  open:boolean; onClose:()=>void; uniqueClasses:any[]; students:Student[]; isSaving:boolean;
  onSave:(f:any)=>Promise<void>; editingLog?:any; caDayOptions?:string[]; preselectedClassId?:string;
  preselectedDate?:string; preselectedCaDay?:string;
}) {
  const [classId,setClassId]=useState('');
  const [date,setDate]=useState(localDateStr());
  const [content,setContent]=useState('');
  const [hw,setHw]=useState('');
  const [teacherNote,setTeacherNote]=useState('');
  const [caDay,setCaDay]=useState('');
  const [manualCaDay,setManualCaDay]=useState(false);
  const [att,setAtt]=useState<Record<string,{trangThai:string;ghiChu:string}>>({});

  // Chỉ reset form khi modal vừa mở (false→true).
  // Bỏ uniqueClasses khỏi deps: silent-reload tạo array reference mới nhưng
  // không được coi là "modal vừa mở" → form không bị clear khi đang nhập.
  const prevOpenRef = useRef(false);
  useEffect(()=>{
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if(!justOpened) return;
    if(editingLog){
      setClassId(editingLog.classId||''); setDate(toInputDate(editingLog.rawDate||editingLog.date||''));
      setContent(editingLog.content||''); setHw(editingLog.homework==='---'?'':editingLog.homework||'');
      setTeacherNote(editingLog.teacherNote||editingLog['Ghi chú GV']||'');
      setCaDay(editingLog.caDay||'');
      setManualCaDay(true);
      const attInit:Record<string,{trangThai:string;ghiChu:string}>={};
      (editingLog.attendanceList||[]).forEach((a:any)=>{
        const id = a.maHS||a['Mã HS']||'';
        if(!id) return;
        attInit[id]={
          trangThai: normalizeAttendanceLabel(a.trangThai||a['Trạng thái']||a.TrangThai||'Có mặt'),
          ghiChu:    a.ghiChu||a['Ghi chú']||'',
        };
      });
      setAtt(attInit);
    } else {
      setClassId(preselectedClassId||'');
      setDate(preselectedDate||localDateStr());
      setCaDay(preselectedCaDay||'');
      setManualCaDay(!!preselectedCaDay);
      setContent(''); setHw(''); setTeacherNote(''); setAtt({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[open,editingLog,preselectedClassId,preselectedDate,preselectedCaDay]);

  // Chỉ lấy học sinh đang học (chưa nghỉ) trong lớp
  const cls=students.filter(s=>
    s.classId===classId &&
    s.status!=='inactive' &&
    (!s.endDate || s.endDate==='---' || s.endDate==='')
  );
  // BUG3 FIX: lấy tên GV từ class record thay vì student đầu tiên
  // tránh trường hợp lớp trống (chưa có HS) → teacherName = ''
  const clsRecord = uniqueClasses.find(c => classCode(c) === classId);
  const teacherName = clsRecord?.['Giáo viên'] || cls[0]?.teacher || '';
  const caList=caDayOptions.length>0?caDayOptions:['7h30','9h','13h30','15h30','17h30','19h30'];
  const classOptions=[{value:'',label:'-- Chọn lớp học --'},...uniqueClasses.map(c=>({value:classCode(c),label:`Lớp ${classCode(c)}`})).filter(o=>o.value)];
  const caOptions=[{value:'',label:'-- Chọn ca dạy --'},...caList.map(ca=>({value:ca,label:`⏰ ${ca}`}))];
  const suggestedCaDay = clsRecord ? extractScheduleTimes(clsRecord)[0] || '' : '';
  const handleClassChange = (nextClassId: string) => {
    const nextClass = uniqueClasses.find(c => classCode(c) === nextClassId);
    const nextCa = nextClass ? extractScheduleTimes(nextClass)[0] || '' : '';
    setClassId(nextClassId);
    setAtt({});
    setManualCaDay(false);
    if (nextCa) setCaDay(nextCa);
  };
  useEffect(() => {
    if (!open || editingLog || manualCaDay || caDay || !suggestedCaDay) return;
    setCaDay(suggestedCaDay);
  }, [open, editingLog, manualCaDay, caDay, suggestedCaDay]);

  if(!open) return null;
  // Attendance
  const attStudents: AttendanceStudent[] = cls.map(s=>({
    id:s.id, name:s.name,
    status:(att[s.id]?.trangThai==='Vắng'?'absent':att[s.id]?.trangThai==='Có phép'?'excused':'present') as any,
    note:att[s.id]?.ghiChu||'',
  }));
  const handleAttChange=(updated:AttendanceStudent[])=>{
    const next:Record<string,{trangThai:string;ghiChu:string}>={};
    updated.forEach(a=>{ next[a.id]={trangThai:a.status==='absent'?'Vắng':a.status==='excused'?'Có phép':'Có mặt',ghiChu:a.note||''}; });
    setAtt(next);
  };

  const doSave=()=>{
    if(!classId){toast.error('⚠️ Vui lòng chọn lớp học!');return;}
    if(!caDay){toast.error('⚠️ Vui lòng chọn ca dạy!');return;}
    if(!content.trim()){toast.error('⚠️ Vui lòng nhập nội dung bài dạy!');return;}
    onSave({ date,classId,caDay,content,homework:hw||'---',teacherNote:teacherNote.trim(),teacherName,
      ...(editingLog&&{originalDate:editingLog.originalDate||editingLog.rawDate,originalClassId:editingLog.originalClassId||editingLog.classId,originalCaDay:editingLog.originalCaDay||editingLog.caDay||''}),
      attendance:cls.map(s=>({maHS:s.id,tenHS:s.name,trangThai:att[s.id]?.trangThai||'Có mặt',ghiChu:att[s.id]?.ghiChu||''})),
    });
  };

  return (
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div className="ltn-quick-modal ltn-diary-modal">
        <header className="ltn-quick-head">
          <div className="ltn-quick-title-row">
            <div className="ltn-quick-title">
              <div className="ltn-quick-icon">✓</div>
              <div>
                <h2>{editingLog ? 'Cập nhật buổi học' : 'Ghi buổi học'}</h2>
              </div>
            </div>
            <button className="ltn-quick-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>

        <div className="ltn-quick-body">
          <section className="ltn-quick-card" style={{ borderColor:'#bfdbfe', background:'#f8fbff' }}>
              <div className="ltn-quick-grid three">
                <div className="ltn-quick-field">
                  <label>Lớp</label>
                  <select value={classId} onChange={e=>handleClassChange(e.target.value)}>
                    {classOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="ltn-quick-field">
                  <label>Ngày học</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
                </div>
                <div className="ltn-quick-field">
                  <label>Ca học</label>
                  <select value={caDay} onChange={e=>{setManualCaDay(true);setCaDay(e.target.value);}}>
                    {caOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
          </section>

          <section className="ltn-quick-card">
            <div className="ltn-quick-grid three">
              <div className="ltn-quick-field">
                <label>Nội dung</label>
                <textarea value={content} onChange={e=>setContent(e.target.value)} rows={2} placeholder="VD: Phương trình bậc 2..." />
              </div>
              <div className="ltn-quick-field">
                <label>Bài tập về nhà</label>
                <textarea value={hw} onChange={e=>setHw(e.target.value)} rows={2} placeholder="SBT tr.45: 1,2,3..." />
              </div>
              <div className="ltn-quick-field">
                <label>Ghi chú GV</label>
                <textarea value={teacherNote} onChange={e=>setTeacherNote(e.target.value)} rows={2} placeholder="Lưu ý cần theo dõi" />
              </div>
            </div>
          </section>

          <section className="ltn-quick-card soft">
            <div className="ltn-quick-card-head">
              <h3>Điểm danh · {cls.length} học sinh</h3>
            </div>
            {cls.length > 0 ? (
              <AttendancePicker students={attStudents} onChange={handleAttChange}/>
            ) : (
              <div style={{ minHeight:100, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13, fontStyle:'italic' }}>
                {classId ? 'Lớp này chưa có học sinh đang học' : 'Chọn lớp để điểm danh'}
              </div>
            )}
          </section>
        </div>

        <div className="ltn-quick-foot ltn-diary-foot">
          <Button variant="outline" intent="neutral" onClick={onClose} style={{ minWidth:90, minHeight:44 }}>Hủy</Button>
          <Button intent={editingLog ? 'primary' : 'success'} loading={isSaving} icon={<Save size={14}/>} onClick={doSave} style={{ flex:1,minHeight:44 }}>
            {editingLog?'Cập nhật buổi học':'Lưu buổi học'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string,{active:string;bg:string;dot:string}> = {
  'Có mặt':{active:'#059669',bg:'#ecfdf5',dot:'#10b981'},
  'Vắng':  {active:'#dc2626',bg:'#fef2f2',dot:'#ef4444'},
  'Có phép':{active:'#d97706',bg:'#fffbeb',dot:'#f59e0b'},
};
export function DiaryDetailModal({ log, onClose, onEdit }: { log:any; onClose:()=>void; onEdit?:(log:any)=>void }) {
  const l=log;
  const detailAttendance = l.attendanceList || [];
  const detailPresent = detailAttendance.length
    ? detailAttendance.filter((a:any) => normalizeAttendanceLabel(a.trangThai||a['Trạng thái']||a.TrangThai||'') === 'Có mặt').length
    : Number(l.present || 0);
  const detailAbsent = detailAttendance.length
    ? detailAttendance.filter((a:any) => normalizeAttendanceLabel(a.trangThai||a['Trạng thái']||a.TrangThai||'') === 'Vắng').length
    : Number(l.absent || 0);
  const detailExcused = detailAttendance.length
    ? detailAttendance.filter((a:any) => normalizeAttendanceLabel(a.trangThai||a['Trạng thái']||a.TrangThai||'') === 'Có phép').length
    : Number(l.excused || 0);
  return (
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div className="ltn-form-modal-panel" style={{ ...FS_DLG, maxWidth:560 }}>
        <div className="ltn-form-modal-header" style={{ background:'#F8FAFC',borderBottom:'1px solid #E2E8F0',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12, minWidth:0 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center' }}><BookOpen size={18} color="#4F46E5"/></div>
            <div style={{ minWidth:0 }}>
              <h3 style={{ fontSize:17,fontWeight:900,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>Buổi học {l.classId || '---'}</h3>
              <p style={{ color:'#64748B',fontSize:13,margin:'3px 0 0',fontWeight:700 }}>{formatDate(l.date)}{l.caDay ? ` · ${l.caDay}` : ''}</p>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            {onEdit && (
              <Button intent="primary" variant="outline" size="sm" icon={<Edit3 size={14} />} onClick={() => onEdit(l)}>
                Sửa buổi học
              </Button>
            )}
            <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,background:'#F1F5F9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={14} color="#64748B"/></button>
          </div>
        </div>
        <div className="ltn-form-modal-body" style={{ flex:1,minHeight:0,overflowY:'auto',padding:'16px 24px',display:'flex',flexDirection:'column',gap:12 }}>
          <div style={{ display:'flex',gap:8 }}>
            {[{label:'Có mặt',val:detailPresent,color:'#059669',bg:'#ecfdf5',border:'#a7f3d0'},{label:'Vắng',val:detailAbsent,color:'#dc2626',bg:'#fef2f2',border:'#fecaca'},{label:'Có phép',val:detailExcused,color:'#d97706',bg:'#fffbeb',border:'#fde68a'}].map(({label,val,color,bg,border})=>(
              <div key={label} style={{ flex:1,textAlign:'center',padding:'10px 8px',borderRadius:8,background:bg,border:`1.5px solid ${border}` }}>
                <p style={{ fontSize:26,fontWeight:800,color,margin:0,lineHeight:1 }}>{val}</p>
                <p style={{ fontSize:10,fontWeight:700,color,margin:'3px 0 0',textTransform:'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
          <section className="ltn-detail-section">
            <p className="ltn-section-title">Nội dung buổi học</p>
            <div className="ltn-info-grid">
              <div className="ltn-info-cell compact">
                <p>Nội dung</p>
                <p>{l.content || '---'}</p>
              </div>
              <div className="ltn-info-cell compact">
                <p>Bài tập về nhà</p>
                <p>{l.homework && l.homework !== '---' ? l.homework : '---'}</p>
              </div>
              <div className="ltn-info-cell compact">
                <p>Ghi chú GV</p>
                <p>{l.teacherNote || '---'}</p>
              </div>
            </div>
          </section>
          {l.attendanceList?.length>0&&(
            <div style={{ border:'1.5px solid #e2e8f0',overflow:'hidden',borderRadius:8 }}>
              <div style={{ padding:'8px 12px',background:'#f8fafc',borderBottom:'1.5px solid #e2e8f0' }}><p style={{ fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>Danh sách điểm danh</p></div>
              <div style={{ maxHeight:200,overflowY:'auto' }}>
                {l.attendanceList.map((a:any,i:number)=>{
                  const name=a['Họ và tên']||a.tenHS||a['tenHS']||'---';
                  const status=normalizeAttendanceLabel(a.trangThai||a['Trạng thái']||a.TrangThai||'Có mặt');
                  const note=a.ghiChu||a['Ghi chú']||a['ghiChu']||'';
                  const sty=STATUS_STYLES[status]||STATUS_STYLES['Có mặt'];
                  return (
                    <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',borderBottom:'1px solid #f1f5f9',background:status!=='Có mặt'?sty.bg:'white' }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <span style={{ fontSize:13,fontWeight:600,color:'#0f172a' }}>{name}</span>
                        {note&&<p style={{ fontSize:11,color:'#94a3b8',margin:'2px 0 0',fontStyle:'italic' }}>{note}</p>}
                      </div>
                      <span style={{ background:sty.bg,color:sty.active,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:7,whiteSpace:'nowrap',border:`1px solid ${sty.dot}33` }}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="ltn-form-modal-footer" style={{ padding:'10px 24px',borderTop:'1px solid #f1f5f9',flexShrink:0,display:'flex',gap:10 }}>
          <Button variant="outline" intent="neutral" fullWidth onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
