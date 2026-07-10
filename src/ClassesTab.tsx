/**
 * ClassesTab.tsx — màn quản lý dữ liệu lớp học gốc.
 */
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Plus, Trash2, X, Users, MapPin, User } from 'lucide-react';
import { compareClassCode, fixVietnameseText, isStudentActive, normalizeCaDayLabel, normalizeScheduleCaText, resolveTeacher } from './helpers';
import { getMonthlyTuitionState, getPaymentTuitionPeriod, isStudentActiveInMonth } from './measures';
import { SearchBar, Select, Button } from './dsComponents';
import { DataTable, DetailMetric, EmptyState, MobileCompactCard, MoneyText, PageToolbar, StatusBadge } from './uiSystem';
import type { Student, ClassRecord, Payment, DeleteTarget, TeachingLog } from './types';

interface Props {
  uClasses: ClassRecord[]; students: Student[];
  payments?: Payment[];
  tlogs?: TeachingLog[];
  curMo: number; curYr: number;
  qCls: string; setQCls: (v: string) => void;
  fClsTeacher: string; setFClsTeacher: (v: string) => void;
  onEditClass: (c: ClassRecord) => void; onDeleteClass?: (t: DeleteTarget) => void; onAddClass: () => void; uniqueBranches: string[];
  onAddDiary?: (classId?: string) => void;
  embedded?: boolean;
  toolbarPrefix?: React.ReactNode;
}

function paymentClassId(p: Payment, students: Student[]): string {
  const raw = p as any;
  return String(raw.maLop || raw.MaLop || raw.classId || students.find(s => s.id === p.studentId)?.classId || '').trim();
}

function tuitionTone(total: number, pct: number): 'emerald' | 'amber' | 'rose' | 'slate' {
  if (total === 0) return 'slate';
  if (pct >= 80) return 'emerald';
  if (pct >= 50) return 'amber';
  return 'rose';
}

type ClassStatus = 'active' | 'missingTeacher' | 'missingSchedule' | 'inactive';

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function readClassField(c: any, keys: string[]) {
  for (const key of keys) {
    const value = c?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return fixVietnameseText(value);
  }
  return '';
}

function getClassCode(c: any) {
  return readClassField(c, ['Mã Lớp', 'Mã lớp', 'MaLop', 'Ma Lop', 'classId', 'id']);
}

function getClassTeacher(c: any) {
  return readClassField(c, ['Giáo viên', 'GiaoVien', 'Giao Vien', 'teacherName', 'teacher']);
}

function getClassBranch(c: any) {
  return readClassField(c, ['Cơ sở', 'CoSo', 'Co So', 'branch']);
}

function getClassScheduleSlots(c: any) {
  return [
    { label: 'Buổi 1', value: normalizeScheduleCaText(readClassField(c, ['Buổi 1', 'Buoi 1', 'Buoi1'])) },
    { label: 'Buổi 2', value: normalizeScheduleCaText(readClassField(c, ['Buổi 2', 'Buoi 2', 'Buoi2'])) },
    { label: 'Buổi 3', value: normalizeScheduleCaText(readClassField(c, ['Buổi 3', 'Buoi 3', 'Buoi3'])) },
  ];
}

function getClassSchedule(c: any) {
  const slots = getClassScheduleSlots(c).map(slot => slot.value).filter(Boolean);
  return slots.length > 0 ? slots.join(' | ') : readClassField(c, ['Ca học', 'Ca hoc', 'CaHoc']) || '---';
}

function getClassTitle(c: ClassRecord) {
  return getClassCode(c) || 'Lớp học';
}

function classStatusMeta(status: ClassStatus): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  if (status === 'missingTeacher') return { label: 'Thiếu GV', tone: 'warning' };
  if (status === 'missingSchedule') return { label: 'Thiếu lịch', tone: 'warning' };
  if (status === 'inactive') return { label: 'Tạm dừng', tone: 'neutral' };
  return { label: 'Đang mở', tone: 'success' };
}

function compactScheduleLabel(schedule: string) {
  const raw = String(schedule || '').trim();
  if (!raw || raw === '---') return '';

  const parts = raw.split(/\s*[|,;]\s*/).map(part => part.trim()).filter(Boolean);
  const days: string[] = [];
  const times: string[] = [];

  parts.forEach(part => {
    const normalizedPart = part.replace(/\s+/g, ' ').replace(/\bT\s+([2-7])\b/gi, 'T$1');
    const day = normalizedPart.match(/\b(T[2-7]|CN)\b/i)?.[1]?.toUpperCase();
    const time = normalizedPart.match(/(\d{1,2})\s*(?:h|:)\s*(\d{0,2})/i);

    if (day && !days.includes(day)) days.push(day);
    if (time) {
      const hour = Number(time[1]);
      const minute = time[2] ? String(Number(time[2])).padStart(2, '0') : '00';
      const label = normalizeCaDayLabel(`${hour}h${minute}`);
      if (!times.includes(label)) times.push(label);
    }
  });

  if (days.length && times.length === 1) return `${days.join('/')} · ${times[0]}`;
  if (days.length && times.length > 1) return parts.slice(0, 3).join(' · ');
  return raw.length > 36 ? `${raw.slice(0, 33)}...` : raw;
}

function ClassStudentListOverlay({ title, students, tone, onClose }: {
  title: string;
  students: Student[];
  tone: 'unpaid' | 'paid';
  onClose: () => void;
}) {
  const isUnpaid = tone === 'unpaid';
  const content = (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.68)',backdropFilter:'blur(4px)',overflowY:'auto',padding:'18px 12px' }}>
      <div style={{ width:'100%',maxWidth:680,margin:'0 auto',background:'white',borderRadius:18,overflow:'hidden',boxShadow:'0 24px 80px rgba(15,23,42,0.3)' }}>
        <div style={{ position:'sticky',top:0,zIndex:1,background:'#f8fafc',borderBottom:'1px solid #e2e8f0',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10 }}>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0,fontSize:16,fontWeight:950,color:'#0f172a' }}>{title}</p>
            <p style={{ margin:'3px 0 0',fontSize:12,fontWeight:800,color:'#64748b' }}>{students.length} học sinh</p>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:10,border:'none',background:'#eef2f7',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <X size={16} color="#64748b" />
          </button>
        </div>
        <div style={{ display:'grid',gap:8,padding:12 }}>
          {students.length === 0 ? (
            <div style={{ padding:'24px 12px',textAlign:'center',fontSize:13,fontWeight:800,color:'#94a3b8' }}>Không có học sinh trong danh sách</div>
          ) : students.map(s => (
            <div key={s.id} style={{ display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:10,alignItems:'center',padding:'11px 12px',borderRadius:12,border:`1px solid ${isUnpaid ? '#fecaca' : '#a7f3d0'}`,background:isUnpaid ? '#fff5f5' : '#f0fdf4' }}>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:14,fontWeight:900,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.name}</p>
                <p style={{ fontSize:12,fontWeight:750,color:'#64748b',margin:'3px 0 0' }}>{s.id}{s.parentPhone ? ` · ${s.parentPhone}` : ''}</p>
              </div>
              <span style={{ fontSize:11,fontWeight:900,color:isUnpaid ? '#be123c' : '#047857',background:isUnpaid ? '#fee2e2' : '#dcfce7',padding:'5px 9px',borderRadius:999,whiteSpace:'nowrap' }}>
                {isUnpaid ? 'Chưa đóng' : 'Đã đóng'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}

function ClassDetailModal({ cls, curMo, curYr, students, payments = [], onClose, onEdit, onDelete }: {
  cls: ClassRecord & { studentCount?: number; paidCount?: number; pct?: number };
  curMo: number; curYr: number;
  students: Student[];
  payments?: Payment[];
  onClose: () => void; onEdit: () => void; onDelete?: () => void;
}) {
  // Chỉ tính HS đang học — bỏ qua HS đã nghỉ
  const tuitionPeriod = { m: curMo, y: curYr };
  const clsStudents = students.filter(s =>
    s.classId === getClassCode(cls) &&
    isStudentActiveInMonth(s, tuitionPeriod)
  );
  const tuitionStates = clsStudents.map(student => getMonthlyTuitionState({
    student,
    period: tuitionPeriod,
    payments,
  }));
  const billableStudents = tuitionStates.filter(state => state.billable).map(state => state.student);
  const paid   = tuitionStates.filter(state => state.status === 'paid').map(state => state.student);
  const unpaid = tuitionStates.filter(state => state.outstandingAmount > 0).map(state => state.student);
  const pct = billableStudents.length > 0 ? Math.round(paid.length / billableStudents.length * 100) : 0;
  const feeTone = tuitionTone(billableStudents.length, pct);
  const feeBg = feeTone === 'emerald' ? '#ecfdf5' : feeTone === 'amber' ? '#fefce8' : feeTone === 'rose' ? '#fff1f2' : '#f8fafc';
  const feeBorder = feeTone === 'emerald' ? '#a7f3d0' : feeTone === 'amber' ? '#fde68a' : feeTone === 'rose' ? '#fecaca' : '#e2e8f0';
  const feeColor = feeTone === 'emerald' ? '#059669' : feeTone === 'amber' ? '#d97706' : feeTone === 'rose' ? '#e11d48' : '#64748b';
  const classCode = getClassCode(cls);
  const teacherName = resolveTeacher(getClassTeacher(cls)) || 'Chưa phân công';
  const scheduleSlots = getClassScheduleSlots(cls);
  const [feeListMode, setFeeListMode] = useState<'unpaid' | 'paid' | null>(null);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'24px 18px',overflowY:'auto',background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white',width:'100%',maxWidth:760,borderRadius:20,overflow:'hidden',boxShadow:'0 24px 80px rgba(15,23,42,0.28)',display:'flex',flexDirection:'column',margin:'0 auto' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'#eef2ff',border:'1px solid #c7d2fe',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ color:'#4f46e5',fontWeight:800,fontSize:12 }}>{classCode.slice(0,3)}</span>
            </div>
            <div>
              <p style={{ fontSize:16,fontWeight:850,color:'#0f172a',margin:0 }}>Lớp {classCode || '---'}</p>
              <p style={{ fontSize:12,color:'#64748b',fontWeight:700,margin:'2px 0 0' }}>Giáo viên {teacherName}</p>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            <Button intent="primary" variant="outline" size="sm" onClick={onEdit}>Chỉnh sửa</Button>
            {onDelete && <Button intent="danger" variant="outline" size="sm" icon={<Trash2 size={14}/>} onClick={onDelete}>Xóa</Button>}
            <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,background:'#f1f5f9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <X size={14} color="#64748b" />
            </button>
          </div>
        </div>

        <div style={{ flex:'initial',overflowY:'visible',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14 }}>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(96px,1fr))',gap:10 }}>
            <DetailMetric label="Lớp" value={classCode || '---'} tone="violet" />
            <DetailMetric label="Sĩ số" value={clsStudents.length} tone="sky" />
            <DetailMetric label="Cần thu" value={billableStudents.length} tone="amber" />
            <DetailMetric label="Đã đóng" value={`${paid.length}/${billableStudents.length}`} tone="emerald" />
            <DetailMetric label={`T${curMo}/${curYr}`} value={`${pct}%`} tone={feeTone === 'rose' ? 'rose' : feeTone === 'amber' ? 'amber' : 'emerald'} />
          </div>

          <section className="ltn-detail-section">
            <p className="ltn-section-title" style={{ textAlign:'left' }}>Chi tiết lớp</p>
            <div className="ltn-info-grid">
              {[
                { label:'Giáo viên', value: teacherName },
                { label:'Cơ sở',     value: getClassBranch(cls) || '---' },
                { label:'Lịch học',  value: scheduleSlots.filter(slot => slot.value).length ? `${scheduleSlots.filter(slot => slot.value).length} buổi/tuần` : 'Chưa có lịch' },
              ].map(row => (
                <div key={row.label} className="ltn-info-cell compact">
                  <p>{row.label}</p>
                  <p>{row.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8 }}>
              {scheduleSlots.map(slot => (
                <div key={slot.label} className="ltn-info-cell" style={{ gridColumn:'auto', background:slot.value ? '#f8fafc' : '#fff', borderStyle:slot.value ? 'solid' : 'dashed' }}>
                  <p>{slot.label}</p>
                  <p>{slot.value || 'Chưa có lịch'}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ltn-detail-section soft" style={{ borderColor: feeBorder, background: feeBg }}>
            <p className="ltn-section-title">Học phí T{curMo}</p>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <span style={{ fontSize:12,fontWeight:700,color:'#374151' }}>Đã đóng / cần thu</span>
              <span style={{ fontSize:16,fontWeight:800,color:feeColor }}>{paid.length}/{billableStudents.length} · {pct}%</span>
            </div>
            <div style={{ height:6,background:'rgba(0,0,0,0.08)',borderRadius:3,overflow:'hidden' }}>
              <div style={{ width:`${pct}%`,height:'100%',background:feeTone==='slate'?'#94a3b8':pct>=80?'#10b981':pct>=50?'#f59e0b':'#ef4444',borderRadius:3,transition:'width 0.4s' }}/>
            </div>
          </section>

          <section className="ltn-detail-section">
            <p style={{ fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px' }}>
              Danh sách học sinh cần đóng ({billableStudents.length}/{clsStudents.length})
            </p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8 }}>
              <button type="button" onClick={() => setFeeListMode('unpaid')} style={{ minHeight:54,padding:'10px 12px',borderRadius:12,border:'1px solid #fecaca',background:'#fff5f5',textAlign:'left',cursor:'pointer' }}>
                <span style={{ display:'block',fontSize:18,fontWeight:950,color:'#be123c' }}>{unpaid.length}</span>
                <span style={{ display:'block',fontSize:12,fontWeight:900,color:'#7f1d1d' }}>Xem chưa đóng</span>
              </button>
              <button type="button" onClick={() => setFeeListMode('paid')} style={{ minHeight:54,padding:'10px 12px',borderRadius:12,border:'1px solid #a7f3d0',background:'#f0fdf4',textAlign:'left',cursor:'pointer' }}>
                <span style={{ display:'block',fontSize:18,fontWeight:950,color:'#047857' }}>{paid.length}</span>
                <span style={{ display:'block',fontSize:12,fontWeight:900,color:'#065f46' }}>Xem đã đóng</span>
              </button>
            </div>
            {clsStudents.length > 0 && (
              <div style={{ maxHeight:280,overflowY:'auto',display:'grid',gap:10,paddingRight:2 }}>
                {unpaid.length > 0 && (
                  <div style={{ display:'grid',gap:6 }}>
                    <p style={{ fontSize:11,fontWeight:900,color:'#be123c',margin:0 }}>Chưa đóng ({unpaid.length})</p>
                    {unpaid.map(s => (
                      <div key={s.id} style={{ display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:8,alignItems:'center',padding:'9px 10px',background:'#fff5f5',borderRadius:10,border:'1px solid #fecaca' }}>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:13,fontWeight:850,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.name}</p>
                          <p style={{ fontSize:11,color:'#64748b',fontWeight:750,margin:'2px 0 0' }}>{s.id}{s.parentPhone ? ` · ${s.parentPhone}` : ''}</p>
                        </div>
                        <span style={{ fontSize:11,fontWeight:900,color:'#be123c',background:'#fee2e2',padding:'4px 8px',borderRadius:999,whiteSpace:'nowrap' }}>Chưa đóng</span>
                      </div>
                    ))}
                  </div>
                )}
                {paid.length > 0 && (
                  <div style={{ display:'grid',gap:6 }}>
                    <p style={{ fontSize:11,fontWeight:900,color:'#047857',margin:0 }}>Đã đóng ({paid.length})</p>
                    {paid.map(s => (
                      <div key={s.id} style={{ display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:8,alignItems:'center',padding:'9px 10px',background:'#f0fdf4',borderRadius:10,border:'1px solid #a7f3d0' }}>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:13,fontWeight:850,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.name}</p>
                          <p style={{ fontSize:11,color:'#64748b',fontWeight:750,margin:'2px 0 0' }}>{s.id}{s.parentPhone ? ` · ${s.parentPhone}` : ''}</p>
                        </div>
                        <span style={{ fontSize:11,fontWeight:900,color:'#047857',background:'#dcfce7',padding:'4px 8px',borderRadius:999,whiteSpace:'nowrap' }}>Đã đóng</span>
                      </div>
                    ))}
                  </div>
                )}
                {unpaid.length === 0 && paid.length === 0 && (
                  <div style={{ padding:'18px 10px',textAlign:'center',fontSize:12,fontWeight:800,color:'#94a3b8' }}>Không có học sinh cần thu trong tháng này</div>
                )}
              </div>
            )}
          </section>

          {/* Danh sách học sinh */}
          {clsStudents.length > 0 && (
            <section className="ltn-detail-section" style={{ display:'none' }}>
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
            </section>
          )}

          {clsStudents.length === 0 && (
            <div style={{ textAlign:'center',padding:'24px 0',color:'#94a3b8',fontStyle:'italic',fontSize:13 }}>Chưa có học sinh trong lớp này</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'10px 20px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" size="sm" onClick={onClose}>Đóng</Button>
        </div>
      </div>
      {feeListMode && (
        <ClassStudentListOverlay
          title={feeListMode === 'unpaid' ? `Chưa đóng phí lớp ${classCode}` : `Đã đóng phí lớp ${classCode}`}
          students={feeListMode === 'unpaid' ? unpaid : paid}
          tone={feeListMode}
          onClose={() => setFeeListMode(null)}
        />
      )}
    </div>
  );
}

export default function ClassesTab({ uClasses,students,payments=[],curMo,curYr,qCls,setQCls,fClsTeacher,setFClsTeacher,onEditClass,onDeleteClass,onAddClass,onAddDiary,embedded=false,toolbarPrefix }: Props) {
  const [detailCls, setDetailCls] = useState<any>(null);

  // FIX C4: memoize getSchedule helper (stable reference)
  const getSchedule = React.useCallback((c: any) => {
    return getClassSchedule(c);
  }, []);

  const getClassStatus = React.useCallback((c: ClassRecord): ClassStatus => {
    const rawStatus = normalizeText(c.status || c.TrangThai || c['Trạng thái']);
    if (rawStatus.includes('nghi') || rawStatus.includes('tam dung') || rawStatus.includes('dong') || rawStatus.includes('inactive')) return 'inactive';
    const teacherName = resolveTeacher(getClassTeacher(c));
    if (!teacherName || teacherName === '---') return 'missingTeacher';
    const schedule = getSchedule(c);
    if (!schedule || schedule === '---') return 'missingSchedule';
    return 'active';
  }, [getSchedule]);

  // FIX C4: memoize clsStats — chỉ tính HS đang học (bỏ HS nghỉ)
  const clsStats = React.useMemo(() => uClasses.map(c => {
    const tuitionPeriod = { m: curMo, y: curYr };
    const cls = students.filter(s =>
      s.classId === getClassCode(c) &&
      isStudentActiveInMonth(s, tuitionPeriod)
    );
    const tuitionStates = cls.map(student => getMonthlyTuitionState({
      student,
      period: tuitionPeriod,
      payments,
    }));
    const billable = tuitionStates.filter(state => state.billable);
    const paidCount = tuitionStates.filter(state => state.status === 'paid').length;
    const pct = billable.length > 0 ? Math.round(paidCount / billable.length * 100) : 0;
    const classId = getClassCode(c);
    const paidAmount = payments
      .filter(p => {
        const period = getPaymentTuitionPeriod(p);
        return paymentClassId(p, students) === classId && period?.m === curMo && period?.y === curYr;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return { ...c, studentCount: cls.length, billableCount: billable.length, paidCount, pct, paidAmount };
  }).sort((a, b) => compareClassCode(getClassCode(a), getClassCode(b))),
  [uClasses, students, payments, curMo, curYr]);

  // FIX C4: memoize teacher list (uses resolveTeacher per class)
  const teachers = React.useMemo(() =>
    [...new Set(uClasses.map(c => resolveTeacher(getClassTeacher(c))).filter(Boolean))],
  [uClasses]);
  const [classStatusFilter, setClassStatusFilter] = React.useState<'all' | ClassStatus>('all');

  // FIX C3 Bug: filter compares resolveTeacher(raw) against fClsTeacher (already resolved)
  const filtCls = React.useMemo(() => {
    const q = qCls.toLowerCase();
    return clsStats.filter(c => {
      const classCode = getClassCode(c);
      const resolvedTeacher = resolveTeacher(getClassTeacher(c));
      return (!q || classCode.toLowerCase().includes(q))
        && (!fClsTeacher || resolvedTeacher === fClsTeacher)
        && (classStatusFilter === 'all' || getClassStatus(c) === classStatusFilter);
    });
  }, [clsStats, qCls, fClsTeacher, classStatusFilter]);

  // FIX C4: memoize select options
  const teacherOptions = React.useMemo(() =>
    [{ value: '', label: 'Giáo viên' }, ...teachers.map(t => ({ value: t, label: t }))],
  [teachers]);
  const classStatusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang mở' },
    { value: 'missingTeacher', label: 'Thiếu GV' },
    { value: 'missingSchedule', label: 'Chưa lịch' },
    { value: 'inactive', label: 'Đã đóng' },
  ];
  const hasActiveFilter = !!(qCls || fClsTeacher || classStatusFilter !== 'all');
  const emptyText = hasActiveFilter ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học';
  const emptySub = hasActiveFilter ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Tạo lớp đầu tiên để gán học sinh, giáo viên và lịch học.';

  const classColumns = useMemo(() => [
    {
      key: 'code',
      label: 'Lớp',
      align: 'center' as const,
      width: 72,
      cellStyle: { whiteSpace: 'nowrap', paddingLeft: 8, paddingRight: 8 },
      headerStyle: { paddingLeft: 8, paddingRight: 8 },
      render: (_: unknown, c: ClassRecord) => {
        const status = getClassStatus(c);
        const meta = classStatusMeta(status);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, maxWidth: '100%' }}>
            <span style={{ minWidth: 0, fontSize: 13, fontWeight: 900, color: '#4f46e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {getClassCode(c) || '—'}
            </span>
            {status !== 'active' && <StatusBadge domain="general" status={status} label={meta.label} tone={meta.tone} />}
          </span>
        );
      },
    },
    {
      key: 'schedule',
      label: 'Lịch học',
      width: '25%',
      render: (_: unknown, c: ClassRecord) => {
        const schedule = compactScheduleLabel(getSchedule(c));
        return schedule ? (
          <span style={{ display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: 13, fontWeight: 900 }}>
            {schedule}
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontWeight: 800, whiteSpace: 'nowrap' }}>Chưa có lịch</span>
        );
      },
    },
    {
      key: 'teacher',
      label: 'Giáo viên',
      width: '19%',
      render: (_: unknown, c: ClassRecord) => {
        const teacherName = resolveTeacher(getClassTeacher(c));
        return teacherName ? (
          <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{teacherName}</span>
        ) : (
          <span style={{ color: '#94a3b8', fontWeight: 800, whiteSpace: 'nowrap' }}>Chưa phân công</span>
        );
      },
    },
    {
      key: 'students',
      label: 'Sĩ số',
      align: 'center' as const,
      width: 76,
      render: (_: unknown, c: ClassRecord & { studentCount?: number }) => (
        <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
          {c.studentCount || 0} HS
        </span>
      ),
    },
    {
      key: 'tuitionRate',
      label: `Tỉ lệ T${curMo}`,
      align: 'center' as const,
      width: 110,
      render: (_: unknown, c: ClassRecord & { billableCount?: number; paidCount?: number; paidAmount?: number }) => {
        const billable = c.billableCount || 0;
        const paid = c.paidCount || 0;
        return (
          <StatusBadge
            domain="tuition"
            status={billable > 0 && paid >= billable ? 'paid' : 'unpaid'}
            label={`${paid}/${billable}`}
            tone={billable > 0 && paid >= billable ? 'success' : 'warning'}
          />
        );
      },
    },
    {
      key: 'tuitionAmount',
      label: 'Số tiền',
      align: 'right' as const,
      width: '12%',
      render: (_: unknown, c: ClassRecord & { paidAmount?: number }) => (
        <MoneyText value={c.paidAmount || 0} compact tone={(c.paidAmount || 0) > 0 ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: 76,
      cellStyle: { paddingLeft: 8, paddingRight: 8 },
      headerStyle: { paddingLeft: 8, paddingRight: 8 },
      render: (_: unknown, c: ClassRecord) => {
        const classId = getClassCode(c);
        const hasSchedule = !!compactScheduleLabel(getSchedule(c));
        if (!onAddDiary || !hasSchedule) return <span title="Lớp chưa có lịch để ghi buổi" aria-label={`Lớp ${classId || 'này'} chưa có lịch để ghi buổi`} style={{ color: '#cbd5e1', fontWeight: 900 }}>—</span>;
        return (
          <button
            type="button"
            title="Ghi buổi"
            aria-label={`Ghi buổi ${classId || 'lớp'}`}
            onClick={event => { event.stopPropagation(); onAddDiary(classId); }}
            style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bbf7d0', color: '#047857', background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Clock size={14} />
          </button>
        );
      },
    },
  ], [curMo, getClassStatus, getSchedule, onAddDiary]);

  const emptyState = (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'28px 12px' }}>
      <EmptyState text={emptyText} sub={emptySub} compact />
      {!embedded && <Button intent="success" size="sm" icon={<Plus size={13}/>} onClick={onAddClass}>Thêm lớp đầu tiên</Button>}
    </div>
  );

  return (
    <div style={{ display:'flex',flexDirection:'column',gap: embedded ? 10 : 14 }}>
      <style>{`
        .class-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .class-desktop-table{display:block}.class-mobile-cards{display:none}
        @media(max-width:767px){
          .class-toolbar-filters{width:100%;display:grid;grid-template-columns:minmax(0,1fr) minmax(112px,1fr);gap:8px}
          .class-toolbar-filters > *{width:100%!important;min-width:0!important}
          .class-desktop-table{display:none!important}.class-mobile-cards{display:block!important}
        }
      `}</style>

      <PageToolbar
        title="Lớp học"
        embedded={embedded}
        actions={!embedded && (
          <Button intent="success" size="sm" icon={<Plus size={13}/>} onClick={onAddClass}>Thêm lớp</Button>
        )}
      >
        {toolbarPrefix}
        <div className="class-toolbar-filters">
          <SearchBar value={qCls} onChange={setQCls} placeholder="Tìm" width={126}/>
          <Select value={fClsTeacher} onChange={setFClsTeacher} options={teacherOptions} style={{ width: 136, minWidth: 118 }}/>
          <Select value={classStatusFilter} onChange={v => setClassStatusFilter(v as typeof classStatusFilter)} options={classStatusOptions} style={{ width: 124, minWidth: 112 }} />
        </div>
      </PageToolbar>

      <div>
        <div className="class-desktop-table">
          <DataTable
            columns={classColumns}
            data={filtCls}
            rowKey={(c) => getClassCode(c) || getClassTitle(c)}
            emptyText={emptyText}
            emptySub={emptySub}
            emptyAction={!embedded ? { label: 'Thêm lớp đầu tiên', onClick: onAddClass, intent: 'success' } : undefined}
            onRowClick={setDetailCls}
            scrollX={false}
            density="compact"
          />
        </div>

        <div className="class-mobile-cards" style={{ padding: 10 }}>
          {filtCls.length === 0 ? emptyState : filtCls.map((c, idx) => {
            const classId = getClassCode(c);
            const schedule = compactScheduleLabel(getSchedule(c));
            const hasSchedule = !!schedule;
            const teacherName = resolveTeacher(getClassTeacher(c));
            const branch = getClassBranch(c);
            const status = getClassStatus(c);
            const meta = classStatusMeta(status);
            return (
              <MobileCompactCard
                key={classId || idx}
                title={getClassTitle(c)}
                subtitle={teacherName || branch || 'Chưa phân công'}
                value={`${c.studentCount || 0} HS`}
                badge={status !== 'active' ? <StatusBadge domain="general" status={status} label={meta.label} tone={meta.tone} /> : undefined}
                tone={meta.tone}
                onClick={() => setDetailCls(c)}
                style={{ marginBottom: idx === filtCls.length - 1 ? 0 : 8 }}
                meta={[
                  { key: 'schedule', label: hasSchedule ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={12} color="#6366f1" />{schedule}</span> : 'Chưa có lịch', tone: hasSchedule ? 'primary' as const : 'warning' as const },
                  { key: 'tuition', label: `HP T${curMo}: ${c.paidCount || 0}/${c.billableCount || 0}`, tone: (c.billableCount || 0) > 0 && (c.paidCount || 0) >= (c.billableCount || 0) ? 'success' as const : 'warning' as const },
                  ...(branch ? [{ key: 'branch', label: branch, tone: 'neutral' as const }] : []),
                ]}
                actions={(
                  <div onClick={e => e.stopPropagation()} style={{ display:'flex',gap:6,justifyContent:'flex-end',flexWrap:'wrap' }}>
                    {onAddDiary && hasSchedule && (
                      <button onClick={() => onAddDiary(classId)}
                        style={{ minHeight:34,padding:'7px 10px',borderRadius:999,background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#047857',fontWeight:900,fontSize:12,cursor:'pointer' }}>
                        Ghi buổi
                      </button>
                    )}
                  </div>
                )}
              />
            );
          })}
        </div>
      </div>
      {detailCls && <ClassDetailModal
        cls={detailCls}
        curMo={curMo}
        curYr={curYr}
        students={students}
        payments={payments}
        onClose={()=>setDetailCls(null)}
        onEdit={()=>{onEditClass(detailCls);setDetailCls(null);}}
        onDelete={onDeleteClass ? () => {
          const id = getClassCode(detailCls);
          if (!id) return;
          onDeleteClass({ type: 'class', id, name: id });
          setDetailCls(null);
        } : undefined}
      />}
    </div>
  );
}
