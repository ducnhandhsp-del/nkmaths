import React from 'react';
import { AlertTriangle, CheckCircle2, GraduationCap, Layers, Plus, School, UserCheck, UserPlus, Users, Wallet } from 'lucide-react';
import { Button, FilterTabs } from './dsComponents';
import { fmtM, StatBlock, StatGrid, TABLE_WRAP } from './AppComponents';
import ClassesTab from './ClassesTab';
import StudentsTab from './StudentsTab';
import TeachersTab from './TeachersTab';
import type { ClassRecord, DeleteTarget, Payment, Student, Teacher, TeachingLog, TrainingSub } from './types';

type StudentFocus = 'all' | 'unassigned';
type ClassFocus = 'all' | 'missingTeacher';
type TeacherFocus = 'all' | 'active';

const norm = (raw: any) =>
  String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

const isActiveStudent = (s: Student) =>
  s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === '');

const isActiveTeacher = (t: Teacher) => norm(t.status || 'active') === 'active';

const classTeacherValue = (c: ClassRecord) =>
  String((c as any).MaGV || (c as any).teacherId || (c as any).GiaoVien || c['Giáo viên'] || '').trim();

const classSlots = (c: ClassRecord) =>
  [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']]
    .filter(v => String(v || '').trim())
    .map(String);

const validTeacherKeys = (teachers: Teacher[]) => {
  const keys = new Set<string>();
  teachers.forEach(t => {
    if (t.id) keys.add(norm(t.id));
    if (t.name) keys.add(norm(t.name));
  });
  return keys;
};

const hasValidTeacher = (c: ClassRecord, keys: Set<string>) => {
  const raw = classTeacherValue(c);
  if (!raw || raw === '---' || norm(raw) === 'chua xac dinh') return false;
  return keys.size === 0 || keys.has(norm(raw)) || /^GV/i.test(raw);
};

const paymentClassId = (p: Payment, students: Student[]) => {
  const raw = p as any;
  return String(raw.maLop || raw.MaLop || raw['Mã Lớp'] || raw.classId || students.find(s => s.id === p.studentId)?.classId || '');
};

function TrainingOverview({
  students,
  uClasses,
  teachers,
  payments,
  curMo,
  curYr,
  onOpenStudents,
  onOpenClasses,
  onOpenTeachers,
}: {
  students: Student[];
  uClasses: ClassRecord[];
  teachers: Teacher[];
  payments: Payment[];
  curMo: number;
  curYr: number;
  onOpenStudents: (focus?: StudentFocus) => void;
  onOpenClasses: (focus?: ClassFocus) => void;
  onOpenTeachers: (focus?: TeacherFocus) => void;
}) {
  const activeStudents = students.filter(isActiveStudent);
  const unassignedStudents = activeStudents.filter(s => !String(s.classId || '').trim());
  const activeTeachers = teachers.filter(isActiveTeacher);
  const teacherKeys = validTeacherKeys(teachers);
  const activeClasses = uClasses.filter(c => norm((c as any).TrangThai || (c as any).status || 'active') !== 'inactive');
  const missingTeacherClasses = uClasses.filter(c => !hasValidTeacher(c, teacherKeys));
  const missingScheduleClasses = activeClasses.filter(c => classSlots(c).length === 0);
  const idleActiveTeachers = activeTeachers.filter(t => {
    const hasClass = uClasses.some(c => {
      const raw = classTeacherValue(c);
      if (!raw) return false;
      return (t.id && norm(raw) === norm(t.id)) || (t.name && norm(raw) === norm(t.name)) || (t.name && norm(raw).includes(norm(t.name.split(/\s+/).pop() || '')));
    }) || (t.classes || []).length > 0;
    return !hasClass;
  });
  const monthRevenueByClass = payments
    .filter(p => {
      const hpMo = Number((p as any).thangHP || 0);
      const hpYr = Number((p as any).namHP || 0);
      if (hpMo) return hpMo === curMo && (hpYr || curYr) === curYr;
      return false;
    })
    .reduce((sum, p) => sum + (paymentClassId(p, students) ? Number(p.amount || 0) : 0), 0);
  const activePct = students.length > 0 ? Math.round((activeStudents.length / students.length) * 100) : 0;
  const insightItems = [
    unassignedStudents.length > 0 && {
      id: 'unassigned',
      tone: '#f97316',
      title: `${unassignedStudents.length} học sinh chưa có lớp`,
      sub: 'Cần gán lớp để theo dõi học phí và lịch học.',
      onClick: () => onOpenStudents('unassigned'),
    },
    missingTeacherClasses.length > 0 && {
      id: 'missing-teacher',
      tone: '#e11d48',
      title: `${missingTeacherClasses.length} lớp thiếu giáo viên`,
      sub: 'Cần phân công giáo viên phụ trách.',
      onClick: () => onOpenClasses('missingTeacher'),
    },
    missingScheduleClasses.length > 0 && {
      id: 'missing-schedule',
      tone: '#f59e0b',
      title: `${missingScheduleClasses.length} lớp thiếu lịch học`,
      sub: 'Cần bổ sung Buổi 1/2/3 để lên lịch dạy.',
      onClick: () => onOpenClasses('all'),
    },
    idleActiveTeachers.length > 0 && {
      id: 'idle-teacher',
      tone: '#0ea5e9',
      title: `${idleActiveTeachers.length} giáo viên chưa phụ trách lớp`,
      sub: 'Kiểm tra lại phân công nếu giáo viên đang dạy.',
      onClick: () => onOpenTeachers('active'),
    },
  ].filter(Boolean) as { id: string; tone: string; title: string; sub: string; onClick: () => void }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <StatGrid>
        <StatBlock icon={Users} value={students.length} label="Tổng học sinh" sub={`${activeStudents.length} đang học`} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" onClick={() => onOpenStudents('all')} actionLabel="Xem" />
        <StatBlock icon={GraduationCap} value={activeStudents.length} label="Học sinh đang học" sub={students.length ? `${activePct}% tổng HS` : 'Chưa có dữ liệu'} gradient="linear-gradient(135deg,#0ea5e9,#0284c7)" onClick={() => onOpenStudents('all')} actionLabel="Xem" />
        <StatBlock icon={AlertTriangle} value={unassignedStudents.length} label="Học sinh chưa có lớp" sub={unassignedStudents.length > 0 ? 'Cần xử lý' : 'Đã ổn'} gradient="linear-gradient(135deg,#f97316,#ea580c)" onClick={() => onOpenStudents('unassigned')} actionLabel="Xem HS" />
        <StatBlock icon={School} value={uClasses.length} label="Tổng lớp" sub={`${activeClasses.length} đang mở`} gradient="linear-gradient(135deg,#14b8a6,#0f766e)" onClick={() => onOpenClasses('all')} actionLabel="Xem" />
        <StatBlock icon={Layers} value={missingTeacherClasses.length} label="Lớp thiếu giáo viên" sub={missingTeacherClasses.length > 0 ? 'Cần phân công' : 'Đã đủ GV'} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" onClick={() => onOpenClasses('missingTeacher')} actionLabel="Xem lớp" />
        <StatBlock icon={UserCheck} value={activeTeachers.length} label="Giáo viên đang dạy" sub={`${teachers.length} tổng giáo viên`} gradient="linear-gradient(135deg,#f59e0b,#d97706)" onClick={() => onOpenTeachers('active')} actionLabel="Xem GV" />
        <StatBlock icon={Wallet} value={fmtM(monthRevenueByClass)} label="Thu học phí theo lớp" sub={`T${curMo}/${curYr}`} gradient="linear-gradient(135deg,#10b981,#059669)" onClick={() => onOpenClasses('all')} actionLabel="Xem lớp" />
      </StatGrid>

      <div style={{ ...TABLE_WRAP, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Việc cần xử lý</p>
          <span style={{ fontSize: 11, fontWeight: 800, color: insightItems.length ? '#f97316' : '#059669' }}>
            {insightItems.length ? `${insightItems.length} mục` : 'Ổn định'}
          </span>
        </div>
        {insightItems.length === 0 ? (
          <div style={{ padding: '18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b' }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#ecfdf5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={16} />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#334155' }}>Không có việc cần xử lý</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Dữ liệu đào tạo hiện đang ổn định.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {insightItems.slice(0, 5).map(item => (
              <button key={item.id} onClick={item.onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid #eef2f7', borderRadius: 9, background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: item.tone, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{item.title}</span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: '#64748b' }}>{item.sub}</span>
                </span>
                <span style={{ color: '#94a3b8', fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  trainingSubtab: TrainingSub;
  setTrainingSubtab: (v: TrainingSub) => void;
  uClasses: ClassRecord[];
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  tlogs: TeachingLog[];
  curMo: number;
  curYr: number;
  qCls: string;
  setQCls: (v: string) => void;
  fClsTeacher: string;
  setFClsTeacher: (v: string) => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onEditClass: (c: ClassRecord) => void;
  onAddClass: () => void;
  uniqueBranches: string[];
  filtS: Student[];
  pgS: number;
  setPgS: (p: number) => void;
  qS: string;
  setQS: (v: string) => void;
  fCls: string;
  setFCls: (v: string) => void;
  hideInactive: boolean;
  setHideInactive: (v: boolean) => void;
  onViewStudent: (s: Student) => void;
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (t: DeleteTarget) => void;
  onAddStudent: () => void;
  onBulkTransfer: (ss: Student[]) => void;
  onSaveTeacher: (form: any) => void | Promise<void>;
  isSaving: boolean;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
}

export default function LearningTab(props: Props) {
  const sub = props.trainingSubtab;
  const [studentFocus, setStudentFocus] = React.useState<StudentFocus>('all');
  const [classFocus, setClassFocus] = React.useState<ClassFocus>('all');
  const [teacherFocus, setTeacherFocus] = React.useState<TeacherFocus>('all');
  const [teacherAddSeq, setTeacherAddSeq] = React.useState(0);
  const activeStudents = props.students.filter(isActiveStudent).length;
  const teacherKeys = React.useMemo(() => validTeacherKeys(props.teachers), [props.teachers]);
  const displayedStudents = React.useMemo(() => {
    if (studentFocus === 'unassigned') {
      return props.filtS.filter(s => isActiveStudent(s) && !String(s.classId || '').trim());
    }
    return props.filtS;
  }, [props.filtS, studentFocus]);
  const displayedClasses = React.useMemo(() => {
    if (classFocus === 'missingTeacher') {
      return props.uClasses.filter(c => !hasValidTeacher(c, teacherKeys));
    }
    return props.uClasses;
  }, [props.uClasses, classFocus, teacherKeys]);
  const setSub = (next: TrainingSub) => {
    props.setTrainingSubtab(next);
    if (next === 'students') setStudentFocus('all');
    if (next === 'classes') setClassFocus('all');
    if (next === 'teachers') setTeacherFocus('all');
  };
  const openStudents = (focus: StudentFocus = 'all') => {
    setStudentFocus(focus);
    props.setQS('');
    props.setFCls('');
    props.setHideInactive(focus === 'unassigned');
    props.setPgS(1);
    props.setTrainingSubtab('students');
  };
  const openClasses = (focus: ClassFocus = 'all') => {
    setClassFocus(focus);
    props.setQCls('');
    props.setFClsTeacher('');
    props.setTrainingSubtab('classes');
  };
  const openTeachers = (focus: TeacherFocus = 'all') => {
    setTeacherFocus(focus);
    props.setTrainingSubtab('teachers');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Đào tạo
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Học sinh, lớp học và giáo viên
          </p>
        </div>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ padding: 3, background: '#f1f5f9', borderRadius: 12 }}>
          <FilterTabs
            variant="segment"
            size="sm"
            active={sub}
            onChange={id => setSub(id as TrainingSub)}
            tabs={[
              { id: 'overview', label: 'Tổng hợp', icon: <Layers size={12} /> },
              { id: 'students', label: 'Học sinh', icon: <GraduationCap size={12} />, count: activeStudents },
              { id: 'classes', label: 'Lớp học', icon: <School size={12} />, count: props.uClasses.length },
              { id: 'teachers', label: 'Giáo viên', icon: <Users size={12} />, count: props.teachers.length },
            ]}
          />
        </div>
        {sub !== 'overview' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button
              intent={sub === 'classes' ? 'primary' : sub === 'teachers' ? 'warning' : 'success'}
              size="sm"
              icon={sub === 'classes' ? <Plus size={13} /> : sub === 'teachers' ? <Users size={13} /> : <UserPlus size={13} />}
              onClick={sub === 'classes' ? props.onAddClass : sub === 'teachers' ? () => setTeacherAddSeq(v => v + 1) : props.onAddStudent}
            >
              {sub === 'classes' ? 'Thêm lớp' : sub === 'teachers' ? 'Thêm giáo viên' : 'Thêm học sinh'}
            </Button>
          </div>
        )}
      </div>

      {sub === 'overview' ? (
        <TrainingOverview
          students={props.students}
          uClasses={props.uClasses}
          teachers={props.teachers}
          payments={props.payments}
          curMo={props.curMo}
          curYr={props.curYr}
          onOpenStudents={openStudents}
          onOpenClasses={openClasses}
          onOpenTeachers={openTeachers}
        />
      ) : sub === 'students' ? (
        <StudentsTab
          filtS={displayedStudents}
          pgS={props.pgS}
          setPgS={props.setPgS}
          students={props.students}
          qS={props.qS}
          setQS={props.setQS}
          fCls={props.fCls}
          setFCls={props.setFCls}
          uClasses={props.uClasses}
          hideInactive={props.hideInactive}
          setHideInactive={props.setHideInactive}
          onViewStudent={props.onViewStudent}
          onEditStudent={props.onEditStudent}
          onDeleteStudent={props.onDeleteStudent}
          onAddStudent={props.onAddStudent}
          onBulkTransfer={props.onBulkTransfer}
          embedded
        />
      ) : sub === 'classes' ? (
        <ClassesTab
          uClasses={displayedClasses}
          students={props.students}
          curMo={props.curMo}
          curYr={props.curYr}
          qCls={props.qCls}
          setQCls={props.setQCls}
          fClsTeacher={props.fClsTeacher}
          setFClsTeacher={props.setFClsTeacher}
          isPaid={props.isPaid}
          onEditClass={props.onEditClass}
          onAddClass={props.onAddClass}
          uniqueBranches={props.uniqueBranches}
          embedded
        />
      ) : (
        <TeachersTab
          focusFilter={teacherFocus}
          teachers={props.teachers}
          students={props.students}
          uClasses={props.uClasses}
          payments={props.payments}
          tlogs={props.tlogs}
          curMo={props.curMo}
          curYr={props.curYr}
          isPaid={props.isPaid}
          onSave={props.onSaveTeacher}
          isSaving={props.isSaving}
          onAddDiary={props.onAddDiary}
          embedded
          addTrigger={teacherAddSeq}
        />
      )}
    </div>
  );
}
