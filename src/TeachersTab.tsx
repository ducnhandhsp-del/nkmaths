/**
 * TeachersTab.tsx
 * Tab giáo viên theo hướng vận hành: hồ sơ, lớp phụ trách, buổi dạy,
 * học sinh, học phí và chi tiết công việc trong tháng.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Clock3,
  Edit3,
  Phone,
  Plus,
  Save,
  School,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import { parseDMY } from './helpers';
import { isStudentActive } from './measures';
import { Button, IconButton } from './dsComponents';
import { DataTable, EmptyState, MobileCard, MoneyText, PageToolbar, StatusBadge } from './uiSystem';
import type { ClassRecord, DeleteTarget, Payment, Student, Teacher, TeachingLog } from './types';

type TeacherStatus = 'active' | 'inactive' | 'onleave' | string;

interface TeacherRow {
  id: string;
  teacher: Teacher;
  official: boolean;
  classes: ClassRecord[];
  activeStudents: Student[];
  monthLogs: TeachingLog[];
  recentLogs: TeachingLog[];
  billableStudents: Student[];
  monthRevenue: number;
  totalRevenue: number;
  paidCount: number;
  unpaidCount: number;
  projectedCost: number;
  hasCostData: boolean;
  attendancePct: number | null;
  attendanceText: string;
}

interface Props {
  teachers: Teacher[];
  students: Student[];
  payments: Payment[];
  uClasses: ClassRecord[];
  tlogs: TeachingLog[];
  curMo: number;
  curYr: number;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onSave: (f: any) => void | Promise<void>;
  onDeleteTeacher?: (t: DeleteTarget) => void;
  isSaving: boolean;
  onAddDiary?: (classId?: string, date?: string, caDay?: string) => void;
  focusFilter?: 'all' | 'active';
  embedded?: boolean;
  addTrigger?: number;
  toolbarPrefix?: React.ReactNode;
}

const TEACHER_STATUS: Record<string, 'active' | 'onleave' | 'inactive'> = {
  active: 'active',
  inactive: 'inactive',
  onleave: 'onleave',
};

const PANEL: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
};

const norm = (raw: any) =>
  String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

const isNamedTeacher = (raw: any) => {
  const s = String(raw || '').trim();
  return !!s && s !== '---' && s !== 'Chưa xác định';
};

const teacherMatches = (raw: any, teacherName: string) => {
  if (!isNamedTeacher(raw) || !teacherName) return false;
  const a = norm(raw);
  const b = norm(teacherName);
  if (!a || !b) return false;
  if (a === b) return true;
  const last = b.split(/\s+/).filter(Boolean).pop() || '';
  return last.length >= 2 && a.includes(last);
};

const stableSyntheticId = (name: string) => `SYN-${norm(name).replace(/[^a-z0-9]+/g, '-')}`;

const getClassId = (c: ClassRecord) => String(c['Mã Lớp'] || c.MaLop || c['Ma Lop'] || '');
const getClassTeacherId = (c: ClassRecord) => String((c as any).MaGV || (c as any).teacherId || '');
const getClassTeacherName = (c: ClassRecord) => String(c['Giáo viên'] || (c as any).GiaoVien || '');
const getLogTeacherId = (l: TeachingLog) => String((l as any).maGV || (l as any).MaGV || (l as any).teacherId || '');
const teacherStatus = (raw: any): 'active' | 'onleave' | 'inactive' => {
  const s = norm(raw);
  if (s.includes('nghi phep') || s.includes('tam nghi') || s.includes('onleave')) return 'onleave';
  if (s.includes('da nghi') || s.includes('nghi viec') || s.includes('inactive') || s.includes('ngung')) return 'inactive';
  return TEACHER_STATUS[s] || 'active';
};
const teacherStatusLabel = (status: 'active' | 'onleave' | 'inactive') =>
  status === 'onleave' ? 'Tạm nghỉ' : status === 'inactive' ? 'Đã nghỉ' : 'Đang dạy';

const getClassSlotCount = (c: ClassRecord) =>
  [c['Buá»•i 1'], c['Buá»•i 2'], c['Buá»•i 3']]
    .filter(v => String(v || '').trim())
    .length;
const weeksInMonth = (mo: number, yr: number) => {
  const days = new Date(yr, mo, 0).getDate();
  return Math.ceil(days / 7);
};

const sameMonth = (raw: any, mo: number, yr: number) => {
  const ts = parseDMY(raw || '');
  if (!ts) return false;
  const d = new Date(ts);
  return d.getMonth() + 1 === mo && d.getFullYear() === yr;
};

const paymentInTuitionMonth = (p: Payment, mo: number, yr: number) => {
  const hpMo = Number((p as any).thangHP || 0);
  const hpYr = Number((p as any).namHP || 0);
  if (hpMo) return hpMo === mo && (hpYr || yr) === yr;
  return sameMonth(p.date, mo, yr);
};

function isMonthBillable(s: Student, mo: number, yr: number): boolean {
  const monthStart = new Date(yr, mo - 1, 1).getTime();

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

function teacherMatchesRecord(rawName: any, rawId: any, teacher: Teacher) {
  const id = String(rawId || '').trim();
  if (id && teacher.id && norm(id) === norm(teacher.id)) return true;
  return teacherMatches(rawName, teacher.name);
}

function TeacherModal({
  open,
  onClose,
  editing,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  editing: Teacher | null;
  onSave: (f: any) => void | Promise<void>;
  isSaving: boolean;
}) {
  const blank: Partial<Teacher> = {
    status: 'active',
    gender: 'male',
    experience: 0,
    baseSalary: 0,
    hourlyRate: 0,
    allowance: 0,
    specialization: 'Toán',
    qualification: '',
    classes: [],
  };
  const [f, setF] = useState<Partial<Teacher>>(blank);
  const [localSaving, setLocalSaving] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    setF(editing ?? { ...blank, createdAt: new Date().toISOString() });
  }, [open, editing]);

  if (!open) return null;

  const u = (k: keyof Teacher | string, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.name?.trim() || localSaving || isSaving) return;
    setLocalSaving(true);
    try {
      await Promise.resolve(onSave({
        ...f,
        experience: Number(f.experience || 0),
        baseSalary: Number(f.baseSalary || 0),
        hourlyRate: Number(f.hourlyRate || 0),
        allowance: Number(f.allowance || 0),
      }));
      onClose();
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="ltn-form-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="ltn-quick-modal narrow">
        <header className="ltn-quick-head">
          <div className="ltn-quick-title-row">
            <div className="ltn-quick-title">
              <div className="ltn-quick-icon">GV</div>
              <div>
                <h2>{editing?.id?.startsWith('SYN-') ? 'Bổ sung giáo viên' : editing ? 'Sửa giáo viên' : 'Thêm giáo viên'}</h2>
              </div>
            </div>
            <button className="ltn-quick-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>

        <div className="ltn-quick-body">
          <section className="ltn-quick-card">
            <p className="ltn-section-title">Hồ sơ</p>
            <div className="ltn-grid-12">
              <div className="ltn-quick-field span-4">
                <label>Họ tên</label>
                <input value={f.name || ''} onChange={e=>u('name', e.target.value)} placeholder="Lê Đức Nhân" />
              </div>
              <div className="ltn-quick-field span-3">
                <label>Số điện thoại</label>
                <input value={f.phone || ''} onChange={e=>u('phone', e.target.value)} placeholder="09xxxxxxxx" />
              </div>
              <div className="ltn-quick-field span-3">
                <label>Email</label>
                <input type="email" value={f.email || ''} onChange={e=>u('email', e.target.value)} placeholder="email@..." />
              </div>
              <div className="ltn-quick-field span-2">
                <label>Trạng thái</label>
                <select value={f.status || 'active'} onChange={e=>u('status', e.target.value as TeacherStatus)}>
                  <option value="active">Đang dạy</option>
                  <option value="onleave">Tạm nghỉ</option>
                  <option value="inactive">Đã nghỉ</option>
                </select>
              </div>
            </div>

            <p className="ltn-section-title">Chuyên môn</p>
            <div className="ltn-grid-12">
              <div className="ltn-quick-field span-4">
                <label>Chuyên môn</label>
                <input value={f.specialization || ''} onChange={e=>u('specialization', e.target.value)} placeholder="Toán" />
              </div>
              <div className="ltn-quick-field span-4">
                <label>Bằng cấp</label>
                <input value={f.qualification || ''} onChange={e=>u('qualification', e.target.value)} placeholder="Đại học / Thạc sĩ..." />
              </div>
              <div className="ltn-quick-field span-2">
                <label>Ngày sinh</label>
                <input value={f.dob || ''} onChange={e=>u('dob', e.target.value)} placeholder="dd/mm/yyyy" />
              </div>
              <div className="ltn-quick-field span-2">
                <label>Kinh nghiệm</label>
                <input type="number" value={String(f.experience || 0)} onChange={e=>u('experience', Number(e.target.value || 0))} />
              </div>
            </div>

            <p className="ltn-section-title">Tài chính</p>
            <div className="ltn-grid-12">
              <div className="ltn-quick-field span-4">
                <label>Đơn giá/buổi</label>
                <input type="number" value={String(f.hourlyRate || 0)} onChange={e=>u('hourlyRate', Number(e.target.value || 0))} />
              </div>
              <div className="ltn-quick-field span-4">
                <label>Lương cơ bản</label>
                <input type="number" value={String(f.baseSalary || 0)} onChange={e=>u('baseSalary', Number(e.target.value || 0))} />
              </div>
              <div className="ltn-quick-field span-4">
                <label>Phụ cấp</label>
                <input type="number" value={String(f.allowance || 0)} onChange={e=>u('allowance', Number(e.target.value || 0))} />
              </div>
            </div>

            <p className="ltn-section-title">Ghi chú</p>
            <div className="ltn-grid-12">
              <div className="ltn-quick-field span-12">
                <label>Ghi chú nghiệp vụ</label>
                <textarea value={f.notes || ''} onChange={e=>u('notes', e.target.value)} rows={3} placeholder="Thế mạnh giảng dạy, lớp phù hợp, lưu ý phối hợp..." />
              </div>
            </div>
          </section>
        </div>

        <div className="ltn-quick-foot">
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent={editing ? 'primary' : 'success'} loading={isSaving || localSaving} icon={<Save size={15} />} onClick={() => { void save(); }} disabled={!f.name?.trim() || isSaving || localSaving}>
            {editing ? 'Cập nhật giáo viên' : 'Lưu giáo viên'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: React.ReactNode; tone: 'violet' | 'amber' | 'emerald' | 'sky' | 'rose' }) {
  const cfg = {
    violet: { bg: '#f5f3ff', color: '#7c3aed' },
    amber: { bg: '#fffbeb', color: '#d97706' },
    emerald: { bg: '#ecfdf5', color: '#059669' },
    sky: { bg: '#f0f9ff', color: '#0284c7' },
    rose: { bg: '#fff1f2', color: '#e11d48' },
  }[tone];
  return (
    <div style={{ background: cfg.bg, borderRadius: 8, padding: '10px 8px', minWidth: 0, textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: cfg.color, margin: 0, lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 10, color: '#64748b', margin: '3px 0 0', fontWeight: 700 }}>{label}</p>
    </div>
  );
}

export default function TeachersTab({
  teachers,
  students,
  payments,
  uClasses,
  tlogs,
  curMo,
  curYr,
  isPaid,
  onSave,
  onDeleteTeacher,
  isSaving,
  onAddDiary,
  embedded = false,
  addTrigger = 0,
  toolbarPrefix,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo<TeacherRow[]>(() => {
    const names = new Map<string, string>();
    const addName = (name: any) => {
      if (!isNamedTeacher(name)) return;
      const label = String(name).trim();
      names.set(norm(label), label);
    };

    teachers.forEach(t => addName(t.name));
    uClasses.forEach(c => addName(getClassTeacherName(c)));
    students.forEach(s => addName(s.teacher));
    tlogs.forEach(l => addName(l.teacherName));

    const officialByName = new Map(teachers.filter(t => isNamedTeacher(t.name)).map(t => [norm(t.name), t]));
    const studentById = new Map(students.map(s => [s.id, s]));

    return Array.from(names.values()).map(name => {
      const official = officialByName.get(norm(name));
      const teacher: Teacher = official ?? {
        id: stableSyntheticId(name),
        name,
        phone: '',
        email: '',
        gender: 'other',
        specialization: 'Toán',
        qualification: '',
        experience: 0,
        baseSalary: 0,
        hourlyRate: 0,
        allowance: 0,
        status: 'active',
        classes: [],
        notes: '',
        createdAt: '',
      };

      const classes = uClasses.filter(c => {
        const classId = getClassId(c);
        return teacherMatchesRecord(getClassTeacherName(c), getClassTeacherId(c), teacher) || (teacher.classes || []).includes(classId);
      });
      const classIds = new Set(classes.map(getClassId).filter(Boolean));
      const activeStudents = students.filter(s =>
        isStudentActive(s) && (teacherMatches(s.teacher, name) || classIds.has(s.classId))
      );
      const billableStudents = activeStudents.filter(s => isMonthBillable(s, curMo, curYr));
      const teacherPayments = payments.filter(p => {
        const st = studentById.get(p.studentId);
        return !!st && (teacherMatches(st.teacher, name) || classIds.has(st.classId));
      });
      const logs = tlogs.filter(l => teacherMatchesRecord(l.teacherName, getLogTeacherId(l), teacher) || classIds.has(l.classId));
      const monthLogs = logs.filter(l => sameMonth(l.date, curMo, curYr));
      const recentLogs = [...logs].sort((a, b) => parseDMY(b.date) - parseDMY(a.date)).slice(0, 5);
      const monthRevenue = teacherPayments
        .filter(p => paymentInTuitionMonth(p, curMo, curYr))
        .reduce((s, p) => s + p.amount, 0);
      const totalRevenue = teacherPayments.reduce((s, p) => s + p.amount, 0);
      const paidCount = billableStudents.filter(s => isPaid(s.id, curMo, curYr)).length;
      const attendanceTotal = monthLogs.reduce((s, l) => s + (l.present || 0) + (l.absent || 0) + (l.late || 0) + (l.excused || 0), 0);
      const attendancePresent = monthLogs.reduce((s, l) => s + (l.present || 0) + (l.late || 0), 0);
      const attendancePct = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null;
      const plannedSessions = classes.reduce((s, c) => s + getClassSlotCount(c), 0) * weeksInMonth(curMo, curYr);
      const baseSalary = Number(teacher.baseSalary || 0);
      const hourlyRate = Number(teacher.hourlyRate || 0);
      const allowance = Number(teacher.allowance || 0);
      const hasCostData = baseSalary > 0 || hourlyRate > 0 || allowance > 0;
      const projectedCost = hasCostData ? baseSalary + allowance + hourlyRate * plannedSessions : 0;

      return {
        id: teacher.id,
        teacher,
        official: !!official,
        classes,
        activeStudents,
        billableStudents,
        monthLogs,
        recentLogs,
        monthRevenue,
        totalRevenue,
        paidCount,
        unpaidCount: Math.max(0, billableStudents.length - paidCount),
        projectedCost,
        hasCostData,
        attendancePct,
        attendanceText: attendancePct == null ? 'Chưa có dữ liệu' : `${attendancePct}% hiện diện`,
      };
    }).sort((a, b) => {
      const aActive = teacherStatus(a.teacher.status) === 'active' ? 1 : 0;
      const bActive = teacherStatus(b.teacher.status) === 'active' ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      if (b.monthLogs.length !== a.monthLogs.length) return b.monthLogs.length - a.monthLogs.length;
      return a.teacher.name.localeCompare(b.teacher.name, 'vi');
    });
  }, [teachers, uClasses, students, tlogs, payments, curMo, curYr, isPaid]);

  const visibleRows = rows;

  const detailRow = detailId ? rows.find(r => r.id === detailId) ?? null : null;

  const openAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  useEffect(() => {
    if (addTrigger > 0) openAdd();
  }, [addTrigger]);

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setShowModal(true);
  };

  const emptyText = 'Chưa có giáo viên';
  const emptySub = 'Thêm giáo viên đầu tiên để theo dõi lớp phụ trách.';

  const teacherColumns = useMemo(() => [
    {
      key: 'id',
      label: 'STT',
      align: 'center' as const,
      width: '6%',
      render: (_: unknown, _r: TeacherRow, idx: number) => (
        <span style={{ fontSize: 13, fontWeight: 900, color: '#64748b', whiteSpace: 'nowrap' }}>
          {idx + 1}
        </span>
      ),
    },
    {
      key: 'teacher',
      label: 'Giáo viên',
      width: '20%',
      render: (_: unknown, r: TeacherRow) => {
        const t = r.teacher;
        return (
          <p style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.name || '—'}
          </p>
        );
      },
    },
    {
      key: 'classes',
      label: 'Số lớp',
      align: 'center' as const,
      width: '9%',
      render: (_: unknown, r: TeacherRow) => {
        return <span style={{ fontSize: 13, fontWeight: 900, color: r.classes.length ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap' }}>{r.classes.length} lớp</span>;
      },
    },
    {
      key: 'students',
      label: 'Số học sinh',
      align: 'center' as const,
      width: '11%',
      render: (_: unknown, r: TeacherRow) => (
        <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.activeStudents.length} HS</span>
      ),
    },
    {
      key: 'paidRate',
      label: `Tỉ lệ HP T${curMo}`,
      align: 'center' as const,
      width: '14%',
      render: (_: unknown, r: TeacherRow) => (
        <StatusBadge
          domain="tuition"
          status={r.billableStudents.length && r.paidCount >= r.billableStudents.length ? 'paid' : 'unpaid'}
          label={`${r.paidCount}/${r.billableStudents.length} HS`}
          tone={r.billableStudents.length && r.paidCount >= r.billableStudents.length ? 'success' : 'warning'}
        />
      ),
    },
    {
      key: 'attendanceRate',
      label: 'Tỉ lệ CC',
      align: 'center' as const,
      width: '9%',
      render: (_: unknown, r: TeacherRow) => {
        if (r.attendancePct == null) {
          return <span style={{ color: '#94a3b8', fontWeight: 900 }}>—</span>;
        }
        return (
          <StatusBadge
            domain="attendance"
            status={`${r.attendancePct}%`}
            label={`${r.attendancePct}%`}
            tone={r.attendancePct >= 80 ? 'success' : r.attendancePct >= 60 ? 'warning' : 'danger'}
          />
        );
      },
    },
    {
      key: 'revenue',
      label: `Học phí lớp`,
      align: 'right' as const,
      width: '18%',
      render: (_: unknown, r: TeacherRow) => <MoneyText value={r.monthRevenue} compact tone={r.monthRevenue > 0 ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '8%',
      render: (_: unknown, r: TeacherRow) => {
        const phone = String(r.teacher.phone || '').replace(/\D/g, '');
        return (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {phone.length >= 9 && (
              <a href={`tel:${phone}`} title="Gọi giáo viên" style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bfdbfe', color: '#2563eb', background: '#eff6ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={14} />
              </a>
            )}
            {phone.length < 9 && <span style={{ color: '#cbd5e1', fontWeight: 900 }}>—</span>}
          </div>
        );
      },
    },
  ], [curMo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: embedded ? 10 : 16 }}>
      <style>{`
        .teacher-desktop-table{display:block}.teacher-mobile-cards{display:none}
        @media(max-width:767px){
          .teacher-desktop-table{display:none!important}.teacher-mobile-cards{display:block!important}
        }
      `}</style>

      <PageToolbar
        title="Giáo viên"
        embedded={embedded}
        actions={<Button intent="success" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Thêm giáo viên</Button>}
      >
        {toolbarPrefix}
      </PageToolbar>

      <div>
        <div className="teacher-desktop-table">
          <DataTable
            columns={teacherColumns}
            data={visibleRows}
            rowKey="id"
            emptyText={emptyText}
            emptySub={emptySub}
            emptyAction={{ label: 'Thêm giáo viên', onClick: openAdd, intent: 'success' }}
            onRowClick={r => setDetailId(r.id)}
            scrollX={false}
            density="compact"
          />
        </div>

        <div className="teacher-mobile-cards" style={{ padding: 10 }}>
          {visibleRows.length === 0 ? (
            <div style={{ padding: '28px 12px' }}>
              <EmptyState text={emptyText} sub={emptySub} compact />
            </div>
          ) : visibleRows.map(r => {
            const t = r.teacher;
            const status = teacherStatus(t.status);
            const phone = String(t.phone || '').replace(/\D/g, '');
            const classIds = r.classes.map(getClassId).filter(Boolean);
            return (
              <MobileCard
                key={r.id}
                title={t.name}
                subtitle={`${t.id || '—'}${t.specialization ? ` · ${t.specialization}` : ''}`}
                badge={<StatusBadge domain="teacher" status={status} label={teacherStatusLabel(status)} />}
                tone={status === 'active' ? 'warning' : 'neutral'}
                onClick={() => setDetailId(r.id)}
                style={{ marginBottom: 8 }}
                rows={[
                  { label: 'Số lớp', value: `${classIds.length} lớp` },
                  { label: 'Sĩ số', value: `${r.activeStudents.length} HS` },
                  { label: `HP T${curMo}`, value: `${r.paidCount}/${r.billableStudents.length} HS` },
                  { label: 'Chuyên cần', value: r.attendancePct == null ? '—' : `${r.attendancePct}%` },
                  { label: 'Thu HP lớp', value: <MoneyText value={r.monthRevenue} compact tone={r.monthRevenue > 0 ? 'success' : 'neutral'} /> },
                ]}
                actions={(
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 7, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {phone.length >= 9 && (
                      <a href={`tel:${phone}`} style={{ minHeight: 40, padding: '8px 12px', borderRadius: 999, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontWeight: 900, fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Phone size={13} /> Gọi
                      </a>
                    )}
                  </div>
                )}
              />
            );
          })}
        </div>
      </div>

      {detailRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }} onClick={() => setDetailId(null)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 760, maxHeight: '88dvh', borderRadius: 20, overflowY: 'auto', boxShadow: '0 24px 80px rgba(15,23,42,0.28)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detailRow.teacher.name}</h3>
                  <p style={{ fontSize: 13, color: '#4f46e5', fontWeight: 800, margin: '4px 0 0' }}>
                    {detailRow.teacher.specialization || 'Toán'} {detailRow.teacher.qualification ? `· ${detailRow.teacher.qualification}` : ''}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <StatusBadge domain="teacher" status={teacherStatus(detailRow.teacher.status)} label={teacherStatusLabel(teacherStatus(detailRow.teacher.status))} />
                    {!detailRow.official && (
                      <span style={{ display: 'inline-flex', padding: '5px 9px', borderRadius: 999, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 11, fontWeight: 800 }}>
                        Chưa có hồ sơ GiaoVien
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Button intent="primary" variant="outline" size="sm" icon={<Edit3 size={14} />} onClick={() => { openEdit(detailRow.teacher); setDetailId(null); }}>
                    {detailRow.official ? 'Sửa hồ sơ' : 'Bổ sung'}
                  </Button>
                  {onDeleteTeacher && detailRow.official && (
                    <Button
                      intent="danger"
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => {
                        onDeleteTeacher({ type: 'teacher', id: detailRow.teacher.id, name: detailRow.teacher.name });
                        setDetailId(null);
                      }}
                    >
                      Xóa
                    </Button>
                  )}
                  <IconButton icon={<X size={18} />} label="Đóng" onClick={() => setDetailId(null)} />
                </div>
              </div>

              <section className="ltn-detail-section" style={{ marginBottom: 14 }}>
                <p className="ltn-section-title">Tổng quan</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  <MiniMetric label="Lớp" value={detailRow.classes.length} tone="sky" />
                  <MiniMetric label="HS" value={detailRow.activeStudents.length} tone="emerald" />
                  <MiniMetric label="Buổi" value={detailRow.monthLogs.length} tone="violet" />
                  <MiniMetric label="Đã đóng" value={`${detailRow.paidCount}/${detailRow.billableStudents.length}`} tone="amber" />
                  <MiniMetric label="Thu HP" value={<MoneyText value={detailRow.monthRevenue} compact tone="success" />} tone="emerald" />
                  <MiniMetric label="Chi phí GV dự kiến" value={detailRow.hasCostData ? <MoneyText value={detailRow.projectedCost} compact tone="primary" /> : '---'} tone="violet" />
                  <MiniMetric label="Hiện diện" value={detailRow.attendancePct == null ? '---' : `${detailRow.attendancePct}%`} tone={detailRow.attendancePct != null && detailRow.attendancePct < 70 ? 'rose' : 'sky'} />
                </div>
              </section>

              <section className="ltn-detail-section soft" style={{ marginBottom: 14 }}>
                <p className="ltn-section-title">Hồ sơ</p>
                <div className="ltn-info-grid">
                {[
                  { label: 'SĐT', val: detailRow.teacher.phone },
                  { label: 'Email', val: detailRow.teacher.email },
                  { label: 'Kinh nghiệm', val: `${detailRow.teacher.experience || 0} năm` },
                  { label: 'Lương cơ bản', val: <MoneyText value={detailRow.teacher.baseSalary ?? 0} tone="neutral" /> },
                ].map(row => (
                  <div key={row.label} className="ltn-info-cell quarter">
                    <div>
                      <p>{row.label}</p>
                      <p>{row.val || '---'}</p>
                    </div>
                  </div>
                ))}
                </div>
              </section>

              <section style={{ ...PANEL, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <School size={16} color="#4f46e5" />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Lớp đang phụ trách</h4>
                </div>
                {detailRow.classes.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Chưa gán lớp cho giáo viên này.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {detailRow.classes.map(c => {
                      const classId = getClassId(c);
                      const slots = [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']].filter(Boolean);
                      return (
                        <div key={classId} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{classId} · {c['Tên Lớp'] || c['Khối'] || 'Lớp học'}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                              {c['Cơ sở'] || 'Chưa rõ cơ sở'} · {slots.join(' · ') || 'Chưa có lịch'}
                            </p>
                          </div>
                          {onAddDiary && <Button size="xs" intent="success" variant="outline" icon={<BookOpen size={12} />} onClick={() => onAddDiary(classId)}>Ghi buổi</Button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section style={{ ...PANEL, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Clock3 size={16} color="#7c3aed" />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Buổi học gần nhất</h4>
                </div>
                {detailRow.recentLogs.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Chưa có nhật ký buổi học.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {detailRow.recentLogs.map(log => (
                      <div key={`${log.date}-${log.classId}-${log.caDay}`} style={{ borderLeft: '3px solid #8b5cf6', padding: '8px 10px', background: '#faf5ff', borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{log.date} · {log.classId} {log.caDay ? `· ${log.caDay}` : ''}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>{log.content || '---'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {detailRow.teacher.notes && (
                <section style={{ ...PANEL, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <UserCheck size={16} color="#059669" />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Ghi chú quản lý</h4>
                  </div>
                  <p style={{ margin: 0, color: '#475569', fontSize: 13, lineHeight: 1.55 }}>{detailRow.teacher.notes}</p>
                </section>
              )}

              <Button variant="outline" intent="neutral" fullWidth onClick={() => setDetailId(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}

      <TeacherModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editing={editing}
        onSave={onSave}
        isSaving={isSaving}
      />
    </div>
  );
}

