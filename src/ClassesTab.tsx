/**
 * ClassesTab.tsx — màn quản lý dữ liệu lớp học gốc.
 */
import React, { useState, useMemo } from 'react';
import { Clock, Plus, Trash2, X, Users, MapPin, User } from 'lucide-react';
import { isStudentActive, parseDMY, resolveTeacher } from './helpers';
import { SearchBar, Select, Button } from './dsComponents';
import { DataTable, EmptyState, MobileCard, MoneyText, PageToolbar, StatusBadge } from './uiSystem';
import type { Student, ClassRecord, Payment, DeleteTarget } from './types';

interface Props {
  uClasses: ClassRecord[]; students: Student[];
  payments?: Payment[];
  curMo: number; curYr: number;
  qCls: string; setQCls: (v: string) => void;
  fClsTeacher: string; setFClsTeacher: (v: string) => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onEditClass: (c: ClassRecord) => void; onDeleteClass?: (t: DeleteTarget) => void; onAddClass: () => void; uniqueBranches: string[];
  onAddDiary?: (classId?: string) => void;
  embedded?: boolean;
  toolbarPrefix?: React.ReactNode;
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

function paymentPeriod(p: Payment): { m: number; y: number } | null {
  const m = Number(p.thangHP);
  const y = Number(p.namHP);
  if (m >= 1 && m <= 12 && y >= 2000) return { m, y };
  const ts = parseDMY(p.date || '');
  if (!ts) return null;
  const d = new Date(ts);
  return { m: d.getMonth() + 1, y: d.getFullYear() };
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

function getClassGrade(c: ClassRecord) {
  return String(c['Khối'] || c.Khoi || c.grade || '').trim();
}

function getClassTitle(c: ClassRecord) {
  return String(c['Tên Lớp'] || c['Mã Lớp'] || 'Lớp học').trim();
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
    const day = part.match(/\b(T[2-7]|CN)\b/i)?.[1]?.toUpperCase();
    const time = part.match(/(\d{1,2})(?:h|:)(\d{0,2})/i);

    if (day && !days.includes(day)) days.push(day);
    if (time) {
      const hour = Number(time[1]);
      const minute = time[2] ? String(Number(time[2])).padStart(2, '0') : '00';
      const label = `${hour}:${minute}`;
      if (!times.includes(label)) times.push(label);
    }
  });

  if (days.length && times.length === 1) return `${days.join('/')} · ${times[0]}`;
  if (days.length && times.length > 1) return parts.slice(0, 3).join(' · ');
  return raw.length > 36 ? `${raw.slice(0, 33)}...` : raw;
}

function ClassDetailModal({ cls, curMo, curYr, students, isPaid, onClose, onEdit, onDelete }: {
  cls: ClassRecord & { studentCount?: number; paidCount?: number; pct?: number };
  curMo: number; curYr: number;
  students: Student[];
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onClose: () => void; onEdit: () => void; onDelete?: () => void;
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
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:18,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white',width:'100%',maxWidth:760,borderRadius:20,overflow:'hidden',boxShadow:'0 24px 80px rgba(15,23,42,0.28)',maxHeight:'88dvh',display:'flex',flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'#eef2ff',border:'1px solid #c7d2fe',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ color:'#4f46e5',fontWeight:800,fontSize:12 }}>{(cls['Mã Lớp']||'').slice(0,3)}</span>
            </div>
            <div>
              <p style={{ fontSize:16,fontWeight:800,color:'#0f172a',margin:0 }}>{cls['Mã Lớp']}</p>
              <p style={{ fontSize:12,color:'#6366f1',fontWeight:600,margin:0 }}>{cls['Tên Lớp'] || 'Chi tiết lớp học'}</p>
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

        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14 }}>

          <section className="ltn-detail-section">
            <p className="ltn-section-title">Thiết lập lớp</p>
            <div className="ltn-info-grid">
              {[
                { label:'Giáo viên', value: resolveTeacher(cls['Giáo viên']||'')||'---' },
                { label:'Cơ sở',     value: cls['Cơ sở']||'---' },
                { label:'Lịch học',  value: [cls['Buổi 1'],cls['Buổi 2'],cls['Buổi 3']].filter(Boolean).join(' · ')||cls['Ca học']||'---' },
                { label:'Sĩ số',     value: `${clsStudents.length} học sinh` },
              ].map(row => (
                <div key={row.label} className={row.label === 'Lịch học' ? 'ltn-info-cell wide' : 'ltn-info-cell compact'}>
                  <p>{row.label}</p>
                  <p>{row.value}</p>
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

          {/* Danh sách học sinh */}
          {clsStudents.length > 0 && (
            <section className="ltn-detail-section">
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
        <div style={{ padding:'10px 20px',borderTop:'1px solid #f1f5f9',display:'flex',gap:10,flexShrink:0 }}>
          <Button variant="outline" intent="neutral" fullWidth size="lg" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesTab({ uClasses,students,payments=[],curMo,curYr,qCls,setQCls,fClsTeacher,setFClsTeacher,isPaid,onEditClass,onDeleteClass,onAddClass,onAddDiary,embedded=false,toolbarPrefix }: Props) {
  const [fGrade, setFGrade] = useState('');
  const [detailCls, setDetailCls] = useState<any>(null);

  // FIX C4: memoize getSchedule helper (stable reference)
  const getSchedule = React.useCallback((c: any) => {
    const p = [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']].filter(Boolean);
    return p.length > 0 ? p.join(' | ') : (c['Ca học'] || '---');
  }, []);

  const getClassStatus = React.useCallback((c: ClassRecord): ClassStatus => {
    const rawStatus = normalizeText(c.status || c.TrangThai || c['Trạng thái']);
    if (rawStatus.includes('nghi') || rawStatus.includes('tam dung') || rawStatus.includes('dong') || rawStatus.includes('inactive')) return 'inactive';
    const teacherName = resolveTeacher(c['Giáo viên'] || c.GiaoVien || '');
    if (!teacherName || teacherName === '---') return 'missingTeacher';
    const schedule = getSchedule(c);
    if (!schedule || schedule === '---') return 'missingSchedule';
    return 'active';
  }, [getSchedule]);

  // FIX C4: memoize clsStats — chỉ tính HS đang học (bỏ HS nghỉ)
  const clsStats = React.useMemo(() => uClasses.map(c => {
    const cls = students.filter(s =>
      s.classId === c['Mã Lớp'] &&
      isStudentActive(s)
    );
    const billable = cls.filter(s => isMonthBillable(s, curMo, curYr));
    const paidCount = billable.filter(s => isPaid(s.id, curMo, curYr)).length;
    const pct = billable.length > 0 ? Math.round(paidCount / billable.length * 100) : 0;
    const classId = String(c['Mã Lớp'] || '').trim();
    const paidAmount = payments
      .filter(p => {
        const period = paymentPeriod(p);
        return paymentClassId(p, students) === classId && period?.m === curMo && period?.y === curYr;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return { ...c, studentCount: cls.length, billableCount: billable.length, paidCount, pct, paidAmount };
  }).sort((a, b) => (a['Mã Lớp'] || '').localeCompare(b['Mã Lớp'] || '')),
  [uClasses, students, payments, isPaid, curMo, curYr]);

  // FIX C4: memoize teacher list (uses resolveTeacher per class)
  const teachers = React.useMemo(() =>
    [...new Set(uClasses.map(c => resolveTeacher(c['Giáo viên'] || c.GiaoVien || '')).filter(Boolean))],
  [uClasses]);

  // FIX C3 Bug: filter compares resolveTeacher(raw) against fClsTeacher (already resolved)
  const filtCls = React.useMemo(() => {
    const q = qCls.toLowerCase();
    return clsStats.filter(c => {
      const resolvedTeacher = resolveTeacher(c['Giáo viên'] || c.GiaoVien || '');
      const grade = getClassGrade(c);
      return (!q || (c['Mã Lớp'] || '').toLowerCase().includes(q) || (c['Tên Lớp'] || '').toLowerCase().includes(q))
        && (!fClsTeacher || resolvedTeacher === fClsTeacher)
        && (!fGrade || grade === fGrade);
    });
  }, [clsStats, qCls, fClsTeacher, fGrade]);

  // FIX C4: memoize select options
  const teacherOptions = React.useMemo(() =>
    [{ value: '', label: 'Giáo viên' }, ...teachers.map(t => ({ value: t, label: t }))],
  [teachers]);
  const gradeOptions = React.useMemo(() => {
    const grades = [...new Set(uClasses.map(getClassGrade).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));
    return [{ value: '', label: 'Khối' }, ...grades.map(g => ({ value: g, label: `Khối ${g}` }))];
  }, [uClasses]);
  const hasActiveFilter = !!(qCls || fClsTeacher || fGrade);
  const emptyText = hasActiveFilter ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học';
  const emptySub = hasActiveFilter ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Tạo lớp đầu tiên để gán học sinh, giáo viên và lịch học.';

  const classColumns = useMemo(() => [
    {
      key: 'code',
      label: 'Mã lớp',
      width: '11%',
      render: (_: unknown, c: ClassRecord) => {
        const status = getClassStatus(c);
        const meta = classStatusMeta(status);
        return (
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 0, fontSize: 13, fontWeight: 900, color: '#3730a3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c['Mã Lớp'] || '—'}
            </span>
            {status !== 'active' && <StatusBadge domain="general" status={status} label={meta.label} tone={meta.tone} />}
          </div>
        );
      },
    },
    {
      key: 'schedule',
      label: 'Lịch học',
      width: '28%',
      render: (_: unknown, c: ClassRecord) => {
        const schedule = compactScheduleLabel(getSchedule(c));
        return schedule ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', color: '#475569', fontSize: 12, fontWeight: 800 }}>
            <Clock size={12} color="#6366f1" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{schedule}</span>
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontWeight: 800, whiteSpace: 'nowrap' }}>Chưa có lịch</span>
        );
      },
    },
    {
      key: 'teacher',
      label: 'Giáo viên',
      width: '20%',
      render: (_: unknown, c: ClassRecord) => {
        const teacherName = resolveTeacher(c['Giáo viên'] || c.GiaoVien || '');
        return teacherName ? (
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{teacherName}</span>
        ) : (
          <span style={{ color: '#94a3b8', fontWeight: 800, whiteSpace: 'nowrap' }}>Chưa phân công</span>
        );
      },
    },
    {
      key: 'students',
      label: 'Sĩ số',
      align: 'center' as const,
      width: '9%',
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
      width: '10%',
      render: (_: unknown, c: ClassRecord & { billableCount?: number; paidCount?: number; paidAmount?: number }) => {
        const billable = c.billableCount || 0;
        const paid = c.paidCount || 0;
        return (
          <span style={{ fontSize: 12, fontWeight: 900, color: paid >= billable && billable > 0 ? '#059669' : '#b45309', whiteSpace: 'nowrap' }}>
            {paid}/{billable}
          </span>
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
      width: '10%',
      render: (_: unknown, c: ClassRecord) => {
        const hasSchedule = !!compactScheduleLabel(getSchedule(c));
        return (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center' }}>
            {onAddDiary && hasSchedule ? (
              <Button intent="success" variant="outline" size="sm" onClick={() => onAddDiary(c['Mã Lớp'])}>Ghi buổi</Button>
            ) : (
              <span style={{ color: '#cbd5e1', fontWeight: 800 }}>—</span>
            )}
          </div>
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
          .class-toolbar-filters{width:100%;display:grid;grid-template-columns:minmax(0,1fr) 92px minmax(112px,1fr);gap:8px}
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
          <Select value={fGrade} onChange={setFGrade} options={gradeOptions} style={{ width: 92, minWidth: 88 }}/>
          <Select value={fClsTeacher} onChange={setFClsTeacher} options={teacherOptions} style={{ width: 136, minWidth: 118 }}/>
        </div>
      </PageToolbar>

      <div>
        <div className="class-desktop-table">
          <DataTable
            columns={classColumns}
            data={filtCls}
            rowKey={(c) => c['Mã Lớp'] || getClassTitle(c)}
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
            const classId = c['Mã Lớp'];
            const schedule = compactScheduleLabel(getSchedule(c));
            const hasSchedule = !!schedule;
            const teacherName = resolveTeacher(c['Giáo viên'] || c.GiaoVien || '');
            const status = getClassStatus(c);
            const meta = classStatusMeta(status);
            return (
              <MobileCard
                key={classId || idx}
                title={getClassTitle(c)}
                subtitle={classId || '—'}
                badge={status !== 'active' ? <StatusBadge domain="general" status={status} label={meta.label} tone={meta.tone} /> : undefined}
                tone={meta.tone}
                onClick={() => setDetailCls(c)}
                style={{ marginBottom: idx === filtCls.length - 1 ? 0 : 8 }}
                rows={[
                  { label: 'Mã lớp', value: classId || '—' },
                  { label: 'Lịch học', value: hasSchedule ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={12} color="#6366f1" />{schedule}</span> : 'Chưa có lịch' },
                  { label: 'Giáo viên', value: teacherName || 'Chưa phân công' },
                  { label: 'Sĩ số', value: `${c.studentCount || 0} HS` },
                  { label: `HP T${curMo}`, value: `${c.paidCount || 0}/${c.billableCount || 0} · ${c.paidAmount ? `${(c.paidAmount / 1000000).toFixed(1).replace('.0', '')}tr` : '0đ'}` },
                ]}
                actions={(
                  <div onClick={e => e.stopPropagation()} style={{ display:'flex',gap:7,width:'100%',justifyContent:'flex-end',flexWrap:'wrap' }}>
                    {onAddDiary && hasSchedule && (
                      <button onClick={() => onAddDiary(classId)}
                        style={{ minHeight:40,padding:'8px 12px',borderRadius:999,background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#047857',fontWeight:900,fontSize:12,cursor:'pointer' }}>
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
        isPaid={isPaid}
        onClose={()=>setDetailCls(null)}
        onEdit={()=>{onEditClass(detailCls);setDetailCls(null);}}
        onDelete={onDeleteClass ? () => {
          const id = String(detailCls['Mã Lớp'] || detailCls.MaLop || detailCls.classId || '').trim();
          if (!id) return;
          onDeleteClass({ type: 'class', id, name: String(detailCls['Tên Lớp'] || id) });
          setDetailCls(null);
        } : undefined}
      />}
    </div>
  );
}
