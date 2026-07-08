import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Save, BookOpen, Edit3 } from 'lucide-react';
import { formatDate, toInputDate, localDateStr, normalizeCaDayLabel, normalizeCaDayOptions, getLessonOffReason, isLessonOffLog } from './helpers';

import { Button, AttendancePicker } from './dsComponents';
import type { AttendanceStudent } from './dsComponents';
import type { LeaveRequest, Student } from './types';

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

function normalizeAttendanceType(raw: any): 'regular' | 'extra' {
  const s = String(raw || '').trim().toLowerCase();
  return s === 'extra' || s === 'ngoai_lop' || s === 'ngoai lop' ? 'extra' : 'regular';
}

type LessonType = 'regular' | 'extra' | 'makeup' | 'review';

const LESSON_TYPE_OPTIONS: { value: LessonType; label: string }[] = [
  { value: 'regular', label: 'Theo lich' },
  { value: 'extra', label: 'Them buoi' },
  { value: 'makeup', label: 'Hoc bu' },
  { value: 'review', label: 'On tap' },
];

function normalizeLessonType(raw: any): LessonType {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'makeup' || s === 'hoc_bu' || s === 'hoc bu') return 'makeup';
  if (s === 'review' || s === 'on_tap' || s === 'on tap') return 'review';
  if (s === 'extra' || s === 'them_buoi' || s === 'them buoi') return 'extra';
  return 'regular';
}

function attendanceStatusFromLabel(raw: any): 'present' | 'absent' | 'excused' {
  const label = normalizeAttendanceLabel(String(raw || ''));
  if (label === normalizeAttendanceLabel('absent')) return 'absent';
  if (label === normalizeAttendanceLabel('excused')) return 'excused';
  return 'present';
}

function attendanceLabelFromStatus(status: any) {
  if (status === 'absent') return normalizeAttendanceLabel('absent');
  if (status === 'excused') return normalizeAttendanceLabel('excused');
  return normalizeAttendanceLabel('present');
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
  const found = raw.match(/\b\d{1,2}\s*(?:h|:)\s*\d{0,2}\b/g) || [];
  return [...new Set(found.map(normalizeCaDayLabel).filter(Boolean))];
}

export function DiaryModal({
  open, onClose, uniqueClasses, students, leaveRequests = [], isSaving, onSave, editingLog, caDayOptions=[], preselectedClassId='', preselectedDate='', preselectedCaDay='',
}: {
  open:boolean; onClose:()=>void; uniqueClasses:any[]; students:Student[]; leaveRequests?: LeaveRequest[]; isSaving:boolean;
  onSave:(f:any)=>Promise<void>; editingLog?:any; caDayOptions?:string[]; preselectedClassId?:string;
  preselectedDate?:string; preselectedCaDay?:string;
}) {
  const [classId,setClassId]=useState('');
  const [date,setDate]=useState(localDateStr());
  const [content,setContent]=useState('');
  const [hw,setHw]=useState('');
  const [teacherNote,setTeacherNote]=useState('');
  const [caDay,setCaDay]=useState('');
  const [lessonType,setLessonType]=useState<LessonType>('regular');
  const [manualCaDay,setManualCaDay]=useState(false);
  const [att,setAtt]=useState<Record<string,{trangThai:string;ghiChu:string}>>({});
  const [extraIds,setExtraIds]=useState<string[]>([]);
  const [extraPick,setExtraPick]=useState('');

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
      setTeacherNote(isLessonOffLog(editingLog) ? getLessonOffReason(editingLog) : (editingLog.teacherNote||editingLog['Ghi chú GV']||''));
      setCaDay(normalizeCaDayLabel(editingLog.caDay||''));
      setLessonType(normalizeLessonType(editingLog.lessonType || editingLog.LoaiBuoiHoc || editingLog.loaiBuoiHoc));
      setManualCaDay(true);
      const attInit:Record<string,{trangThai:string;ghiChu:string}>={};
      const extraInit:string[]=[];
      (editingLog.attendanceList||[]).forEach((a:any)=>{
        const id = a.maHS||a['Mã HS']||'';
        if(!id) return;
        attInit[id]={
          trangThai: normalizeAttendanceLabel(a.trangThai||a['Trạng thái']||a.TrangThai||'Có mặt'),
          ghiChu:    a.ghiChu||a['Ghi chú']||'',
        };
        if (normalizeAttendanceType(a.LoaiDiemDanh || a.loaiDiemDanh || a.attendanceType || a.type) === 'extra') extraInit.push(id);
      });
      setAtt(attInit);
      setExtraIds([...new Set(extraInit)]);
      setExtraPick('');
    } else {
      setClassId(preselectedClassId||'');
      setDate(preselectedDate||localDateStr());
      setCaDay(normalizeCaDayLabel(preselectedCaDay||''));
      setLessonType(preselectedClassId && preselectedDate && preselectedCaDay ? 'regular' : 'extra');
      setManualCaDay(!!preselectedCaDay);
      setContent('');
      setHw('');
      setTeacherNote('');
      setAtt({});
      setExtraIds([]);
      setExtraPick('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[open,editingLog,preselectedClassId,preselectedDate,preselectedCaDay]);

  // Chỉ lấy học sinh đang học (chưa nghỉ) trong lớp
  const cls=useMemo(() => students.filter(s=>
    s.classId===classId &&
    s.status!=='inactive' &&
    (!s.endDate || s.endDate==='---' || s.endDate==='')
  ), [classId, students]);
  const extraStudents = useMemo(() => students.filter(s => extraIds.includes(s.id)), [extraIds, students]);
  const extraStudentOptions = useMemo(() => students
    .filter(s =>
      s.id &&
      s.classId !== classId &&
      s.status !== 'inactive' &&
      (!s.endDate || s.endDate === '---' || s.endDate === '') &&
      !extraIds.includes(s.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    .map(s => ({ value: s.id, label: `${s.name} · ${s.classId || 'Chưa lớp'} · ${s.id}` })),
  [classId, extraIds, students]);
  const handleAddExtraStudent = () => {
    const picked = students.find(s => s.id === extraPick);
    if (!picked) return;
    setExtraIds(prev => prev.includes(picked.id) ? prev : [...prev, picked.id]);
    setAtt(prev => ({
      ...prev,
      [picked.id]: prev[picked.id] || { trangThai: normalizeAttendanceLabel(''), ghiChu: 'Hoc ngoai lop' },
    }));
    setExtraPick('');
  };
  const removeExtraStudent = (id: string) => {
    setExtraIds(prev => prev.filter(item => item !== id));
    setAtt(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  // BUG3 FIX: lấy tên GV từ class record thay vì student đầu tiên
  // tránh trường hợp lớp trống (chưa có HS) → teacherName = ''
  const clsRecord = uniqueClasses.find(c => classCode(c) === classId);
  const teacherName = clsRecord?.['Giáo viên'] || cls[0]?.teacher || '';
  const approvedLeaves = useMemo(() => leaveRequests.filter(req =>
    req.status === 'approved' &&
    req.classId === classId &&
    toInputDate(req.date || '') === date
  ), [classId, date, leaveRequests]);
  const caList=normalizeCaDayOptions(caDayOptions);
  const classOptions=[{value:'',label:'-- Chọn lớp học --'},...uniqueClasses.map(c=>({value:classCode(c),label:`Lớp ${classCode(c)}`})).filter(o=>o.value)];
  const caOptions=[{value:'',label:'-- Chọn ca dạy --'},...caList.map(ca=>({value:ca,label:`⏰ ${ca}`}))];
  const suggestedCaDay = clsRecord ? extractScheduleTimes(clsRecord)[0] || '' : '';
  const handleClassChange = (nextClassId: string) => {
    const nextClass = uniqueClasses.find(c => classCode(c) === nextClassId);
    const nextCa = nextClass ? extractScheduleTimes(nextClass)[0] || '' : '';
    setClassId(nextClassId);
    setAtt({});
    setExtraIds([]);
    setExtraPick('');
    setManualCaDay(false);
    if (nextCa) setCaDay(nextCa);
  };
  useEffect(() => {
    if (!open || editingLog || manualCaDay || caDay || !suggestedCaDay) return;
    setCaDay(suggestedCaDay);
  }, [open, editingLog, manualCaDay, caDay, suggestedCaDay]);

  useEffect(() => {
    if (!open || editingLog || approvedLeaves.length === 0) return;
    setAtt(prev => {
      let changed = false;
      const next = { ...prev };
      approvedLeaves.forEach(req => {
        const current = next[req.studentId];
        if (current && current.trangThai !== 'Có mặt') return;
        next[req.studentId] = {
          trangThai: 'Có phép',
          ghiChu: req.reason ? `Nghỉ phép: ${req.reason}` : 'Nghỉ phép đã duyệt',
        };
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [approvedLeaves, editingLog, open]);

  if(!open) return null;
  // Attendance
  const attStudents: AttendanceStudent[] = cls.map(s=>({
    id:s.id, name:s.name,
    status:attendanceStatusFromLabel(att[s.id]?.trangThai),
    note:att[s.id]?.ghiChu||'',
  }));
  const extraAttStudents: AttendanceStudent[] = extraStudents.map(s=>({
    id:s.id, name:s.name, classId:s.classId, attendanceType:'extra',
    status:attendanceStatusFromLabel(att[s.id]?.trangThai),
    note:att[s.id]?.ghiChu||'',
    onRemove:()=>removeExtraStudent(s.id),
  }));
  const allAttStudents: AttendanceStudent[] = [
    ...attStudents.map(s => ({ ...s, classId: cls.find(item => item.id === s.id)?.classId, attendanceType: 'regular' as const })),
    ...extraAttStudents,
  ];
  const handleAttChange=(updated:AttendanceStudent[])=>{
    const next:Record<string,{trangThai:string;ghiChu:string}>={};
    updated.forEach(a=>{ next[a.id]={trangThai:attendanceLabelFromStatus(a.status),ghiChu:a.note||''}; });
    setAtt(next);
  };

  const saveAttendance = [
    ...cls.map(s=>({maHS:s.id,tenHS:s.name,trangThai:att[s.id]?.trangThai||normalizeAttendanceLabel('present'),ghiChu:att[s.id]?.ghiChu||'',loaiDiemDanh:'regular'})),
    ...extraStudents.map(s=>({maHS:s.id,tenHS:s.name,trangThai:att[s.id]?.trangThai||normalizeAttendanceLabel('present'),ghiChu:att[s.id]?.ghiChu||'Hoc ngoai lop',loaiDiemDanh:'extra'})),
  ];

  const doSave=()=>{
    if(!classId){toast.error('⚠️ Vui lòng chọn lớp học!');return;}
    if(!caDay){toast.error('⚠️ Vui lòng chọn ca dạy!');return;}
    if(!content.trim()){toast.error('⚠️ Vui lòng nhập nội dung bài dạy!');return;}
    onSave({ date,classId,caDay: normalizeCaDayLabel(caDay),lessonType,content,homework:hw||'---',teacherNote:teacherNote.trim(),teacherName,
      ...(editingLog&&{originalId:editingLog.maBuoi||editingLog.id,originalDate:editingLog.originalDate||editingLog.rawDate,originalClassId:editingLog.originalClassId||editingLog.classId,originalCaDay:editingLog.originalCaDay||editingLog.caDay||''}),
      attendance:saveAttendance,
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
                <div className="ltn-quick-field">
                  <label>Loai buoi</label>
                  <select value={lessonType} onChange={e=>setLessonType(normalizeLessonType(e.target.value))}>
                    {LESSON_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            {approvedLeaves.length > 0 && (
              <div style={{ marginBottom: 8, border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 800 }}>
                {approvedLeaves.length} đơn nghỉ phép đã duyệt được tự đánh dấu Có phép.
              </div>
            )}
            {classId && (
              <div style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, alignItems: 'center' }}>
                <select value={extraPick} onChange={e=>setExtraPick(e.target.value)} style={{ minHeight: 36, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 12, fontWeight: 800, color: '#334155', background: 'white', minWidth: 0 }}>
                  <option value="">+ Them hoc sinh ngoai lop</option>
                  {extraStudentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button intent="primary" variant="outline" size="sm" onClick={handleAddExtraStudent} disabled={!extraPick}>Them</Button>
              </div>
            )}
            {allAttStudents.length > 0 ? (
              <AttendancePicker students={allAttStudents} onChange={handleAttChange}/>
            ) : (
              <div style={{ minHeight:100, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13, fontStyle:'italic' }}>
                {classId ? 'Lớp này chưa có học sinh đang học' : 'Chọn lớp để điểm danh'}
              </div>
            )}
          </section>
        </div>

        <div className="ltn-quick-foot ltn-diary-foot">
          <Button variant="outline" intent="neutral" size="sm" onClick={onClose}>Hủy</Button>
          <Button intent={editingLog ? 'primary' : 'success'} size="sm" loading={isSaving} icon={<Save size={14}/>} onClick={doSave} style={{ minWidth: editingLog ? 104 : 82 }}>
            {editingLog?'Cập nhật':'Lưu'}
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
  const [attendanceFilter,setAttendanceFilter]=useState<'all'|'present'|'absent'|'excused'>('all');
  const [attendanceQuery,setAttendanceQuery]=useState('');
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
  const attendanceRows = detailAttendance.map((a:any, i:number) => {
    const name = a['Họ và tên'] || a.tenHS || a['tenHS'] || '---';
    const status = normalizeAttendanceLabel(a.trangThai || a['Trạng thái'] || a.TrangThai || 'Có mặt');
    const note = a.ghiChu || a['Ghi chú'] || a['ghiChu'] || '';
    const sty = STATUS_STYLES[status] || STATUS_STYLES['Có mặt'];
    return { key: `${name}-${i}`, name, status, note, sty };
  });
  const filteredAttendanceRows = attendanceRows.filter(row => {
    const q = attendanceQuery.trim().toLowerCase();
    const matchQuery = !q || row.name.toLowerCase().includes(q) || row.note.toLowerCase().includes(q);
    const matchStatus =
      attendanceFilter === 'all' ||
      (attendanceFilter === 'present' && row.status === 'Có mặt') ||
      (attendanceFilter === 'absent' && row.status === 'Vắng') ||
      (attendanceFilter === 'excused' && row.status === 'Có phép');
    return matchQuery && matchStatus;
  });
  const attendanceTabs = [
    { key:'all', label:'Tất cả', count: attendanceRows.length },
    { key:'present', label:'Có mặt', count: detailPresent },
    { key:'absent', label:'Vắng', count: detailAbsent },
    { key:'excused', label:'Có phép', count: detailExcused },
  ] as const;
  return (
    <div className="ltn-form-modal-overlay" style={{ ...FS_WRAP, alignItems:'flex-start', padding:'24px 16px', overflowY:'auto' }}>
      <div className="ltn-form-modal-panel" style={{ ...FS_DLG, maxWidth:820, height:'calc(100dvh - 48px)', maxHeight:'calc(100dvh - 48px)', minHeight:'auto', borderRadius:18, overflow:'hidden', margin:'0 auto' }}>
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
                Sửa
              </Button>
            )}
            <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,background:'#F1F5F9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={14} color="#64748B"/></button>
          </div>
        </div>
        <div className="ltn-form-modal-body" style={{ flex:1,minHeight:0,overflowY:'hidden',padding:'14px 24px 18px',display:'flex',flexDirection:'column',gap:12 }}>
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
                <p>{isLessonOffLog(l) ? (getLessonOffReason(l) || 'Chưa ghi lý do nghỉ') : (l.teacherNote || '---')}</p>
              </div>
            </div>
          </section>
          {attendanceRows.length>0&&(
            <div style={{ border:'1.5px solid #e2e8f0',overflow:'hidden',borderRadius:10,background:'#fff',display:'flex',flexDirection:'column',minHeight:260,flex:'1 1 320px' }}>
              <div style={{ padding:'9px 14px',background:'#f8fafc',borderBottom:'1.5px solid #e2e8f0',display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',alignItems:'center',gap:10 }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:11,fontWeight:900,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>Danh sách điểm danh</p>
                  <p style={{ fontSize:11,fontWeight:800,color:'#94a3b8',margin:'3px 0 0' }}>{filteredAttendanceRows.length}/{attendanceRows.length} HS</p>
                </div>
                <input
                  value={attendanceQuery}
                  onChange={e=>setAttendanceQuery(e.target.value)}
                  placeholder="Tìm học sinh"
                  style={{ width:170,maxWidth:'38vw',height:32,border:'1px solid #e2e8f0',borderRadius:8,padding:'0 10px',fontSize:12,fontWeight:750,outline:'none' }}
                />
              </div>
              <div style={{ display:'flex',gap:6,padding:'8px 10px',borderBottom:'1px solid #eef2f7',overflowX:'auto' }}>
                {attendanceTabs.map(tab => {
                  const active = attendanceFilter === tab.key;
                  return (
                    <button key={tab.key} type="button" onClick={()=>setAttendanceFilter(tab.key)} style={{ border:`1px solid ${active?'#6366f1':'#e2e8f0'}`,background:active?'#eef2ff':'white',color:active?'#4f46e5':'#64748b',borderRadius:999,padding:'5px 10px',fontSize:11,fontWeight:900,whiteSpace:'nowrap',cursor:'pointer' }}>
                      {tab.label} · {tab.count}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:8,padding:10,overflowY:'auto',minHeight:0,alignContent:'start',flex:1 }}>
                {filteredAttendanceRows.map(row => (
                  <div key={row.key} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,minHeight:44,padding:'9px 10px',border:'1px solid #e2e8f0',borderRadius:8,background:row.status!=='Có mặt'?row.sty.bg:'#fff' }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <span style={{ display:'block',fontSize:13,fontWeight:850,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{row.name}</span>
                      {row.note&&<p style={{ fontSize:11,color:'#64748b',margin:'2px 0 0',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{row.note}</p>}
                    </div>
                    <span style={{ background:row.sty.bg,color:row.sty.active,fontSize:11,fontWeight:850,padding:'4px 9px',borderRadius:999,whiteSpace:'nowrap',border:`1px solid ${row.sty.dot}44` }}>{row.status}</span>
                  </div>
                ))}
                {filteredAttendanceRows.length===0&&(
                  <div style={{ gridColumn:'1 / -1',padding:'16px 12px',textAlign:'center',fontSize:12,fontWeight:800,color:'#94a3b8' }}>Không có học sinh phù hợp</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ltn-form-modal-footer" style={{ padding:'10px 24px',borderTop:'1px solid #f1f5f9',flexShrink:0,display:'flex',justifyContent:'flex-end',gap:10 }}>
          <Button variant="outline" intent="neutral" size="sm" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
