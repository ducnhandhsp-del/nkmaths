import React from 'react';
import ClassesTab from './ClassesTab';
import StudentsTab from './StudentsTab';
import TeachersTab from './TeachersTab';
import { ToolbarTabs } from './uiSystem';
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

const classTeacherValue = (c: ClassRecord) =>
  String((c as any).MaGV || (c as any).teacherId || (c as any).GiaoVien || c['Giáo viên'] || '').trim();

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
  onDeleteClass?: (t: DeleteTarget) => void;
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
  onCollectFee?: (s: Student) => void;
  onBulkTransfer: (ss: Student[]) => void;
  onSaveTeacher: (form: any) => void | Promise<void>;
  onDeleteTeacher?: (t: DeleteTarget) => void;
  isSaving: boolean;
  onAddDiary: (classId?: string, date?: string, caDay?: string) => void;
}

export default function LearningTab(props: Props) {
  const sub = props.trainingSubtab;
  const [studentFocus] = React.useState<StudentFocus>('all');
  const [classFocus] = React.useState<ClassFocus>('all');
  const [teacherFocus] = React.useState<TeacherFocus>('all');
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
  const tabs: { id: TrainingSub; label: string }[] = [
    { id: 'students', label: 'Học sinh' },
    { id: 'classes', label: 'Lớp học' },
    { id: 'teachers', label: 'Giáo viên' },
  ];
  const toolbarTabs = (
    <ToolbarTabs tabs={tabs} active={sub} onChange={props.setTrainingSubtab} />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sub === 'students' ? (
        <StudentsTab
          key="students"
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
          onCollectFee={props.onCollectFee}
          onBulkTransfer={props.onBulkTransfer}
          curMo={props.curMo}
          curYr={props.curYr}
          isPaid={props.isPaid}
          toolbarPrefix={toolbarTabs}
        />
      ) : sub === 'classes' ? (
        <ClassesTab
          key="classes"
          uClasses={displayedClasses}
          students={props.students}
          payments={props.payments}
          tlogs={props.tlogs}
          curMo={props.curMo}
          curYr={props.curYr}
          qCls={props.qCls}
          setQCls={props.setQCls}
          fClsTeacher={props.fClsTeacher}
          setFClsTeacher={props.setFClsTeacher}
          onEditClass={props.onEditClass}
          onDeleteClass={props.onDeleteClass}
          onAddClass={props.onAddClass}
          onAddDiary={props.onAddDiary}
          uniqueBranches={props.uniqueBranches}
          toolbarPrefix={toolbarTabs}
        />
      ) : (
        <TeachersTab
          key="teachers"
          focusFilter={teacherFocus}
          teachers={props.teachers}
          students={props.students}
          uClasses={props.uClasses}
          payments={props.payments}
          tlogs={props.tlogs}
          curMo={props.curMo}
          curYr={props.curYr}
          onSave={props.onSaveTeacher}
          onDeleteTeacher={props.onDeleteTeacher}
          isSaving={props.isSaving}
          onAddDiary={props.onAddDiary}
          toolbarPrefix={toolbarTabs}
        />
      )}
    </div>
  );
}
