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

import { isStudentActive, parseDMY } from './helpers';
import { getPaymentReceiptPeriod, getTuitionCycleState, getUniquePaidStudentIdsByReceiptPeriod } from './measures';
import { Button, IconButton, SearchBar, Select } from './dsComponents';
import { DataTable, DetailMetric, EmptyState, MobileRecordAction, MobileRecordList, MobileRecordMarker, MobileRecordRow, MoneyText, PageToolbar, StatusBadge } from './uiSystem';
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
  reviewCount: number;
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
  baseTuition: number;
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

const teacherNameKey = (raw: any) =>
  norm(raw).replace(/^(thay|co|gv|giao vien)\s+/, '').trim();

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
  [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']]
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

const paymentInReceiptMonth = (p: Payment, mo: number, yr: number) => {
  const period = getPaymentReceiptPeriod(p);
  return period?.m === mo && period?.y === yr;
};

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
            {isSaving || localSaving ? 'Đang lưu...' : editing ? 'Cập nhật giáo viên' : 'Lưu giáo viên'}
          </Button>
        </div>
      </div>
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
  baseTuition,
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
  const [teacherQuery, setTeacherQuery] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'active' | 'all' | 'onleave' | 'inactive' | 'noClass'>('active');

  const rows = useMemo<TeacherRow[]>(() => {
    const names = new Map<string, string>();
    const addName = (name: any) => {
      if (!isNamedTeacher(name)) return;
      const label = String(name).trim();
      const key = teacherNameKey(label);
      if (!names.has(key)) names.set(key, label);
    };

    teachers.forEach(t => addName(t.name));
    uClasses.forEach(c => addName(getClassTeacherName(c)));
    students.forEach(s => addName(s.teacher));
    tlogs.forEach(l => addName(l.teacherName));

    const officialByName = new Map(teachers.filter(t => isNamedTeacher(t.name)).map(t => [teacherNameKey(t.name), t]));
    const studentById = new Map(students.map(s => [s.id, s]));

    return Array.from(names.values()).map(name => {
      const official = officialByName.get(teacherNameKey(name));
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

      const classMap = new Map<string, ClassRecord>();
      uClasses.forEach(c => {
        const classId = getClassId(c);
        if (!classId) return;
        if (teacherMatchesRecord(getClassTeacherName(c), getClassTeacherId(c), teacher) || (teacher.classes || []).includes(classId)) {
          classMap.set(classId, c);
        }
      });
      const classes = [...classMap.values()];
      const classIds = new Set(classes.map(getClassId).filter(Boolean));
      const activeStudents = students.filter(s =>
        isStudentActive(s) && (teacherMatches(s.teacher, name) || classIds.has(s.classId))
      );
      const tuitionStates = activeStudents.map(student => getTuitionCycleState({
        student,
        classes: uClasses,
        payments,
        tlogs,
        baseTuition,
      }));
      const billableStudents = tuitionStates.filter(state => state.billable).map(state => state.student);
      const teacherPayments = payments.filter(p => {
        const st = studentById.get(p.studentId);
        return !!st && (teacherMatches(st.teacher, name) || classIds.has(st.classId));
      });
      const logs = tlogs.filter(l => teacherMatchesRecord(l.teacherName, getLogTeacherId(l), teacher) || classIds.has(l.classId));
      const monthLogs = logs.filter(l => sameMonth(l.date, curMo, curYr));
      const recentLogs = [...logs].sort((a, b) => parseDMY(b.date) - parseDMY(a.date)).slice(0, 5);
      const monthRevenue = teacherPayments
        .filter(p => paymentInReceiptMonth(p, curMo, curYr))
        .reduce((s, p) => s + p.amount, 0);
      const totalRevenue = teacherPayments.reduce((s, p) => s + p.amount, 0);
      const paidStudentIds = getUniquePaidStudentIdsByReceiptPeriod(teacherPayments, { m: curMo, y: curYr });
      const paidCount = activeStudents.filter(student => paidStudentIds.has(student.id)).length;
      const unpaidCount = tuitionStates.filter(state => state.status === 'due' || state.status === 'overdue').length;
      const reviewCount = tuitionStates.filter(state => state.status === 'needs_review').length;
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
        unpaidCount,
        reviewCount,
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
  }, [teachers, uClasses, students, tlogs, payments, baseTuition, curMo, curYr]);

  const visibleRows = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    return rows.filter(row => {
      const status = teacherStatus(row.teacher.status);
      if (teacherStatusFilter === 'active' && status !== 'active') return false;
      if (teacherStatusFilter === 'onleave' && status !== 'onleave') return false;
      if (teacherStatusFilter === 'inactive' && status !== 'inactive') return false;
      if (teacherStatusFilter === 'noClass' && row.classes.length > 0) return false;
      if (!q) return true;
      const haystack = `${row.teacher.name || ''} ${row.teacher.id || ''} ${row.teacher.phone || ''} ${row.teacher.specialization || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, teacherQuery, teacherStatusFilter]);

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
      label: 'Cần thu',
      align: 'center' as const,
      width: '14%',
      render: (_: unknown, r: TeacherRow) => (
        <StatusBadge
          domain="tuition"
          status={r.unpaidCount > 0 ? 'due' : 'paid'}
          label={`${r.unpaidCount} HS`}
          tone={r.unpaidCount > 0 ? 'warning' : 'success'}
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
              <a href={`tel:${phone}`} title={`Gọi ${r.teacher.name}`} aria-label={`Gọi ${r.teacher.name}`} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bfdbfe', color: '#2563eb', background: '#eff6ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={14} />
              </a>
            )}
            {phone.length < 9 && <span title="Chưa có số điện thoại" aria-label={`Chưa có số điện thoại ${r.teacher.name}`} style={{ color: '#cbd5e1', fontWeight: 900 }}>—</span>}
          </div>
        );
      },
    },
  ], [curMo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: embedded ? 8 : 12 }}>
      <style>{`
        .teacher-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .teacher-desktop-table{display:block}.teacher-mobile-cards{display:none}
        @media(max-width:767px){
          .teacher-toolbar-filters{display:none!important}
          .teacher-desktop-table{display:none!important}.teacher-mobile-cards{display:block!important}
        }
      `}</style>

      <PageToolbar
        title="Giáo viên"
        embedded={embedded}
        hideActionsOnMobile
        actions={<Button intent="success" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Thêm giáo viên</Button>}
      >
        {toolbarPrefix}
        <div className="teacher-toolbar-filters">
          <SearchBar value={teacherQuery} onChange={setTeacherQuery} placeholder="Tìm GV" width={136} />
          <Select
            value={teacherStatusFilter}
            onChange={v => setTeacherStatusFilter(v as typeof teacherStatusFilter)}
            options={[
              { value: 'active', label: 'Đang dạy' },
              { value: 'all', label: 'Tất cả' },
              { value: 'onleave', label: 'Tạm nghỉ' },
              { value: 'inactive', label: 'Đã nghỉ' },
              { value: 'noClass', label: 'Chưa có lớp' },
            ]}
            style={{ width: 124, minWidth: 116 }}
          />
        </div>
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

        <div className="teacher-mobile-cards" style={{ padding: 6 }}>
          {visibleRows.length === 0 ? (
            <div style={{ padding: '28px 12px' }}>
              <EmptyState text={emptyText} sub={emptySub} compact />
            </div>
          ) : <MobileRecordList>{visibleRows.map(r => {
            const t = r.teacher;
            const status = teacherStatus(t.status);
            const phone = String(t.phone || '').replace(/\D/g, '');
            const classIds = r.classes.map(getClassId).filter(Boolean);
            const attendanceText = r.attendancePct == null ? 'Chưa có CC' : `CC ${r.attendancePct}%`;
            const tuitionText = `Cần thu: ${r.unpaidCount} HS`;
            return (
              <MobileRecordRow
                key={r.id}
                marker={<MobileRecordMarker tone={status === 'active' ? 'warning' : 'neutral'}>GV</MobileRecordMarker>}
                title={t.name}
                right={<StatusBadge domain="teacher" status={status} label={teacherStatusLabel(status)} />}
                meta={`${classIds.length} lớp · ${r.activeStudents.length} HS · ${attendanceText}`}
                note={(
                  <span>
                    {tuitionText}
                    {r.monthRevenue > 0 && <> · <MoneyText value={r.monthRevenue} compact tone="success" /></>}
                  </span>
                )}
                tone={status === 'active' ? 'warning' : 'neutral'}
                muted={status !== 'active'}
                onClick={() => setDetailId(r.id)}
                actions={(
                  <>
                    {phone.length >= 9 && (
                      <MobileRecordAction href={`tel:${phone}`} title={`Gọi ${t.name}`} tone="info">
                        <Phone size={15} />
                      </MobileRecordAction>
                    )}
                  </>
                )}
              />
            );
          })}</MobileRecordList>}
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
                  {detailRow.teacher.qualification && (
                    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 800, margin: '4px 0 0' }}>
                      {detailRow.teacher.qualification}
                    </p>
                  )}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <p className="ltn-section-title" style={{ textAlign: 'left' }}>Tổng quan tháng {curMo}/{curYr}</p>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>
                    {detailRow.classes.length} lớp · {detailRow.activeStudents.length} học sinh
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(112px,1fr))', gap: 8 }}>
                  <DetailMetric label="Lớp" value={detailRow.classes.length} tone="sky" />
                  <DetailMetric label="Học sinh" value={detailRow.activeStudents.length} tone="emerald" />
                  <DetailMetric label="Buổi dạy" value={detailRow.monthLogs.length} tone="violet" />
                  <DetailMetric label="Cần thu" value={detailRow.unpaidCount} tone="amber" />
                  <DetailMetric label="Đã thu tháng" value={`${detailRow.paidCount}/${detailRow.activeStudents.length}`} tone="emerald" />
                  <DetailMetric label="Cần kiểm tra" value={detailRow.reviewCount} tone="rose" />
                  <DetailMetric label="Thu học phí" value={<MoneyText value={detailRow.monthRevenue} compact tone="success" />} tone="emerald" />
                </div>
              </section>

              <section className="ltn-detail-section soft" style={{ marginBottom: 14 }}>
                <p className="ltn-section-title" style={{ textAlign: 'left' }}>Thông tin liên hệ</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
                  {[
                    { label: 'SĐT', val: detailRow.teacher.phone },
                    { label: 'Email', val: detailRow.teacher.email },
                    { label: 'Kinh nghiệm', val: `${detailRow.teacher.experience || 0} năm` },
                    { label: 'Lương cơ bản', val: <MoneyText value={detailRow.teacher.baseSalary ?? 0} tone="neutral" /> },
                  ].map(row => (
                    <div key={row.label} className="ltn-info-cell" style={{ gridColumn: 'auto' }}>
                      <div>
                        <p>{row.label}</p>
                        <p>{row.val || '---'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ ...PANEL, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <School size={16} color="#4f46e5" />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Lớp đang phụ trách</h4>
                  </div>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{detailRow.classes.length} lớp</span>
                </div>
                {detailRow.classes.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Chưa gán lớp cho giáo viên này.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {detailRow.classes.map(c => {
                      const classId = getClassId(c);
                      const slots = [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']].filter(Boolean);
                      return (
                        <div key={classId} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 10px', display: 'grid', gridTemplateColumns: 'minmax(86px,120px) minmax(0,1fr) auto', alignItems: 'center', gap: 10, background: '#fff' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{classId}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c['Cơ sở'] || 'Chưa rõ cơ sở'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
                            {slots.length > 0 ? slots.map(slot => (
                              <span key={`${classId}-${slot}`} style={{ minHeight: 26, display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 850, whiteSpace: 'nowrap' }}>
                                {String(slot)}
                              </span>
                            )) : (
                              <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 800 }}>Chưa có lịch</span>
                            )}
                          </div>
                          {onAddDiary && <Button size="xs" intent="success" variant="outline" icon={<BookOpen size={12} />} onClick={() => onAddDiary(classId)}>Ghi buổi</Button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section style={{ ...PANEL, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock3 size={16} color="#7c3aed" />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Buổi học gần nhất</h4>
                  </div>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{detailRow.recentLogs.length} buổi</span>
                </div>
                {detailRow.recentLogs.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Chưa có nhật ký buổi học.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {detailRow.recentLogs.map(log => (
                      <div key={`${log.date}-${log.classId}-${log.caDay}`} style={{ border: '1px solid #e9d5ff', borderLeft: '3px solid #8b5cf6', padding: '9px 10px', background: '#fbf8ff', borderRadius: 8, display: 'grid', gridTemplateColumns: 'minmax(118px,150px) minmax(0,1fr)', alignItems: 'center', gap: 10 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{log.date}</p>
                          <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ color: '#5b21b6', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 999, padding: '2px 7px', fontSize: 11, fontWeight: 900 }}>{log.classId || '—'}</span>
                            {log.caDay && <span style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '2px 7px', fontSize: 11, fontWeight: 900 }}>{log.caDay}</span>}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.45, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.content || '---'}
                        </p>
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

