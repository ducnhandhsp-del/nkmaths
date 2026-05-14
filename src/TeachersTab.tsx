/**
 * TeachersTab.tsx
 * Tab giáo viên theo hướng vận hành: hồ sơ, lớp phụ trách, buổi dạy,
 * học sinh, học phí và chi tiết công việc trong tháng.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Clock3,
  Edit3,
  Eye,
  Mail,
  Phone,
  Plus,
  Save,
  School,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import { fmtVND, parseDMY } from './helpers';
import { isStudentActive } from './measures';
import { Badge, Button, FilterTabs, IconButton, Input, SearchBar, Select, TableActions } from './dsComponents';
import { fmtM, TABLE_WRAP, TD_SHARED, TH_SHARED, trStyle } from './AppComponents';
import { StatusBadge } from './uiSystem';
import type { ClassRecord, Payment, Student, Teacher, TeachingLog } from './types';

type TeacherStatus = 'active' | 'inactive' | 'onleave' | string;
type StatusFilter = 'all' | 'active' | 'onleave' | 'inactive';

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
  isSaving: boolean;
  onAddDiary?: (classId?: string, date?: string, caDay?: string) => void;
  focusFilter?: 'all' | 'active';
  embedded?: boolean;
  addTrigger?: number;
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

  React.useEffect(() => {
    if (!open) return;
    setF(editing ?? { ...blank, createdAt: new Date().toISOString() });
  }, [open, editing]);

  if (!open) return null;

  const u = (k: keyof Teacher | string, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.name?.trim()) return;
    await Promise.resolve(onSave({
      ...f,
      experience: Number(f.experience || 0),
      baseSalary: Number(f.baseSalary || 0),
      hourlyRate: Number(f.hourlyRate || 0),
      allowance: Number(f.allowance || 0),
    }));
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 760, maxHeight: '92vh', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
              <Users size={18} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{editing?.id?.startsWith('SYN-') ? 'Bổ sung hồ sơ giáo viên' : editing ? 'Sửa hồ sơ giáo viên' : 'Thêm giáo viên mới'}</h3>
              <p style={{ fontSize: 12, color: '#92400e', fontWeight: 600, margin: 0 }}>Thông tin này lưu vào sheet GiaoVien</p>
            </div>
          </div>
          <IconButton icon={<X size={18} />} label="Đóng" onClick={onClose} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
            <Input label="Họ tên" required value={f.name || ''} onChange={v => u('name', v)} placeholder="Nguyễn Văn A" />
            <Input label="Số điện thoại" value={f.phone || ''} onChange={v => u('phone', v)} placeholder="09xxxxxxxx" />
            <Input label="Email" type="email" value={f.email || ''} onChange={v => u('email', v)} placeholder="email@..." />
            <Input label="Ngày sinh" value={f.dob || ''} onChange={v => u('dob', v)} placeholder="dd/mm/yyyy" />
            <Select label="Giới tính" value={f.gender || 'male'} onChange={v => u('gender', v)} options={[
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
              { value: 'other', label: 'Khác' },
            ]} />
            <Select label="Trạng thái" value={f.status || 'active'} onChange={v => u('status', v as TeacherStatus)} options={[
              { value: 'active', label: 'Đang dạy' },
              { value: 'onleave', label: 'Nghỉ phép' },
              { value: 'inactive', label: 'Đã nghỉ' },
            ]} />
            <Input label="Chuyên môn" value={f.specialization || ''} onChange={v => u('specialization', v)} />
            <Input label="Bằng cấp" value={f.qualification || ''} onChange={v => u('qualification', v)} />
            <Input label="Kinh nghiệm" type="number" value={String(f.experience || 0)} onChange={v => u('experience', Number(v || 0))} suffix="năm" />
            <Input label="Lương cơ bản" type="number" value={String(f.baseSalary || 0)} onChange={v => u('baseSalary', Number(v || 0))} suffix="đ" />
            <Input label="Đơn giá/buổi" type="number" value={String(f.hourlyRate || 0)} onChange={v => u('hourlyRate', Number(v || 0))} suffix="đ" />
            <Input label="Phụ cấp" type="number" value={String(f.allowance || 0)} onChange={v => u('allowance', Number(v || 0))} suffix="đ" />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Ghi chú nghiệp vụ</label>
            <textarea
              value={f.notes || ''}
              onChange={e => u('notes', e.target.value)}
              rows={3}
              placeholder="Ví dụ: thế mạnh giảng dạy, lớp phù hợp, lưu ý phối hợp phụ huynh..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent="warning" loading={isSaving} icon={<Save size={15} />} onClick={() => { void save(); }} disabled={!f.name?.trim()}>
            {editing ? 'Cập nhật' : 'Thêm mới'}
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
  isSaving,
  onAddDiary,
  focusFilter = 'all',
  embedded = false,
  addTrigger = 0,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hovRow, setHovRow] = useState<string | null>(null);

  useEffect(() => {
    if (focusFilter === 'active') {
      setStatusFilter('active');
      setSearch('');
    } else if (focusFilter === 'all') {
      setStatusFilter('all');
    }
  }, [focusFilter]);

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
      const aActive = a.teacher.status === 'active' ? 1 : 0;
      const bActive = b.teacher.status === 'active' ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      if (b.monthLogs.length !== a.monthLogs.length) return b.monthLogs.length - a.monthLogs.length;
      return a.teacher.name.localeCompare(b.teacher.name, 'vi');
    });
  }, [teachers, uClasses, students, tlogs, payments, curMo, curYr, isPaid]);

  const statusCounts = useMemo(() => ({
    all: rows.length,
    active: rows.filter(r => r.teacher.status === 'active').length,
    onleave: rows.filter(r => r.teacher.status === 'onleave').length,
    inactive: rows.filter(r => r.teacher.status === 'inactive').length,
  }), [rows]);

  const visibleRows = rows.filter(r => {
    if (statusFilter !== 'all' && r.teacher.status !== statusFilter) return false;
    const q = norm(search);
    if (!q) return true;
    return [
      r.teacher.name,
      r.teacher.phone,
      r.teacher.email,
      r.teacher.specialization,
      r.classes.map(getClassId).join(' '),
    ].some(v => norm(v).includes(q));
  });

  const activeCount = rows.filter(r => r.teacher.status === 'active').length;
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

  const TH = TH_SHARED;
  const TD = TD_SHARED;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ flexShrink: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Giáo viên</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                {activeCount}/{rows.length} đang dạy · T{curMo}/{curYr}
              </p>
            </div>
            <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm giáo viên, lớp, SĐT..." width={260} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button intent="warning" icon={<Plus size={15} />} onClick={openAdd}>Thêm giáo viên</Button>
          </div>
        </div>
      )}

      <div style={{ ...PANEL, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FilterTabs
          variant="pill"
          size="sm"
          active={statusFilter}
          onChange={id => setStatusFilter(id as StatusFilter)}
          tabs={[
            { id: 'all', label: 'Tất cả', count: statusCounts.all },
            { id: 'active', label: 'Đang dạy', count: statusCounts.active },
            { id: 'onleave', label: 'Nghỉ phép', count: statusCounts.onleave },
            { id: 'inactive', label: 'Đã nghỉ', count: statusCounts.inactive },
          ]}
        />
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
          Hiển thị {visibleRows.length}/{rows.length}
        </span>
      </div>

      <div style={TABLE_WRAP}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Giáo viên', 'Phụ trách', 'Tháng này', 'Thu HP lớp', 'Chuyên cần', 'Trạng thái', 'Thao tác'].map((h, i) => (
                  <th key={h} style={{ ...TH, textAlign: i === 6 ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '52px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <BookOpen size={34} color="#cbd5e1" />
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 14, margin: 0 }}>
                        {search ? `Không tìm thấy "${search}"` : 'Chưa có giáo viên trong dữ liệu'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : visibleRows.map((r, idx) => {
                const t = r.teacher;
                const st = TEACHER_STATUS[t.status] ?? TEACHER_STATUS.active;
                return (
                  <tr key={r.id} onMouseEnter={() => setHovRow(r.id)} onMouseLeave={() => setHovRow(null)} style={trStyle(idx, hovRow === r.id)}>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                          {t.name.trim().split(/\s+/).pop()?.slice(0, 1).toUpperCase() || 'G'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>{t.name}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                            {r.official ? (t.phone || t.email || 'Đã có hồ sơ') : 'Chưa có hồ sơ trong sheet GiaoVien'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontWeight: 800, color: '#334155' }}>{r.classes.length} lớp · {r.activeStudents.length} HS</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {r.classes.slice(0, 3).map(getClassId).join(', ') || 'Chưa gán lớp'}
                          {r.classes.length > 3 ? ` +${r.classes.length - 3}` : ''}
                        </span>
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontWeight: 800, color: '#7c3aed' }}>{r.monthLogs.length} buổi</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Tổng {r.recentLogs.length} buổi gần nhất</span>
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontWeight: 800, color: '#059669' }}>{fmtVND(r.monthRevenue)}</span>
                        <span style={{ fontSize: 11, color: r.unpaidCount ? '#e11d48' : '#64748b' }}>
                          {r.paidCount}/{r.billableStudents.length} đã đóng
                        </span>
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ color: r.attendancePct == null ? '#94a3b8' : r.attendancePct >= 85 ? '#059669' : r.attendancePct >= 70 ? '#d97706' : '#e11d48', fontWeight: 800 }}>
                        {r.attendancePct == null ? '---' : `${r.attendancePct}%`}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{r.attendanceText}</p>
                    </td>
                    <td style={TD}>
                      <StatusBadge domain="teacher" status={st} />
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <TableActions actions={[
                        { icon: <Eye size={13} />, label: 'Xem', intent: 'primary', onClick: () => setDetailId(r.id) },
                        { icon: <Edit3 size={13} />, label: r.official ? 'Sửa' : 'Bổ sung hồ sơ', intent: 'warning', onClick: () => openEdit(t) },
                      ]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setDetailId(null)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 560, height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Hồ sơ giáo viên</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Tổng hợp từ hồ sơ, lớp, buổi học và tài chính</p>
                </div>
                <IconButton icon={<X size={18} />} label="Đóng" onClick={() => setDetailId(null)} />
              </div>

              <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderRadius: 10, padding: 18, marginBottom: 16, border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <h4 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{detailRow.teacher.name}</h4>
                    <p style={{ fontSize: 13, color: '#92400e', fontWeight: 700, margin: '4px 0' }}>
                      {detailRow.teacher.specialization || 'Toán'} {detailRow.teacher.qualification ? `· ${detailRow.teacher.qualification}` : ''}
                    </p>
                  </div>
                  <StatusBadge domain="teacher" status={TEACHER_STATUS[detailRow.teacher.status] ?? TEACHER_STATUS.active} />
                </div>
                {!detailRow.official && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.7)', color: '#92400e', fontSize: 12, fontWeight: 700 }}>
                    Giáo viên này đang xuất hiện trong lớp/buổi học nhưng chưa có hồ sơ riêng trong sheet GiaoVien.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                <MiniMetric label="Lớp" value={detailRow.classes.length} tone="sky" />
                <MiniMetric label="HS" value={detailRow.activeStudents.length} tone="emerald" />
                <MiniMetric label="Buổi" value={detailRow.monthLogs.length} tone="violet" />
                <MiniMetric label="Đã đóng" value={`${detailRow.paidCount}/${detailRow.billableStudents.length}`} tone="amber" />
                <MiniMetric label="Thu HP" value={fmtM(detailRow.monthRevenue)} tone="emerald" />
                <MiniMetric label="Chi phÃ­ GV dá»± kiáº¿n" value={detailRow.hasCostData ? fmtM(detailRow.projectedCost) : '---'} tone="violet" />
                <MiniMetric label="Hiện diện" value={detailRow.attendancePct == null ? '---' : `${detailRow.attendancePct}%`} tone={detailRow.attendancePct != null && detailRow.attendancePct < 70 ? 'rose' : 'sky'} />
              </div>

              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'SĐT', val: detailRow.teacher.phone, icon: Phone },
                  { label: 'Email', val: detailRow.teacher.email, icon: Mail },
                  { label: 'Kinh nghiệm', val: `${detailRow.teacher.experience || 0} năm`, icon: Award },
                  { label: 'Lương cơ bản', val: fmtVND(detailRow.teacher.baseSalary ?? 0), icon: Wallet },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 8, background: '#f8fafc' }}>
                    <row.icon size={15} color="#94a3b8" />
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>{row.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{row.val || '---'}</p>
                    </div>
                  </div>
                ))}
              </div>

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
                          {onAddDiary && <Button size="xs" intent="secondary" variant="outline" icon={<BookOpen size={12} />} onClick={() => onAddDiary(classId)}>Ghi buổi</Button>}
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

              <Button intent="warning" variant="outline" fullWidth icon={<Edit3 size={14} />} onClick={() => openEdit(detailRow.teacher)}>
                {detailRow.official ? 'Sửa hồ sơ giáo viên' : 'Bổ sung hồ sơ vào GiaoVien'}
              </Button>
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

