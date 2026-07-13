import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, Edit3, LockKeyhole, Plus, RotateCcw, Save, Trash2, TrendingDown, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Assessment, ScoreEntry, ScoresSub, Student } from './types';
import type { AssessmentInput, ScoreDraft, ScoreEnrollment } from './useScores';
import { compareClassCode, formatDate, localDateStr, parseDMY, toInputDate } from './helpers';
import { isStudentActiveOnDate } from './measures';
import { Button, Input, SearchBar, Select, TableActions } from './dsComponents';
import { ActionableKpi, ActionableKpiGrid, DataTable, EmptyState, PageToolbar, StatusBadge, ToolbarTabs } from './uiSystem';

type Props = {
  assessments: Assessment[];
  scores: ScoreEntry[];
  enrollments: ScoreEnrollment[];
  students: Student[];
  uClasses: any[];
  loading: boolean;
  saving: boolean;
  onSaveAssessment: (input: AssessmentInput) => Promise<string>;
  onSaveScores: (assessmentId: string, entries: ScoreDraft[], expectedStudentIds: string[], finalize?: boolean) => Promise<void>;
  onReopen: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type ScoreFormRow = { student: Student; status: '' | ScoreEntry['status']; score: string; comment: string };

const ASSESSMENT_TYPES = [
  { value: 'quick', label: 'Kiểm tra nhanh' },
  { value: 'topic', label: 'Chuyên đề / chương' },
  { value: 'periodic', label: 'Định kỳ' },
  { value: 'mock', label: 'Thi thử' },
  { value: 'other', label: 'Khác' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Chưa nhập' },
  { value: 'scored', label: 'Có điểm' },
  { value: 'absent', label: 'Vắng' },
  { value: 'exempt', label: 'Miễn' },
];

const MODAL_OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15,23,42,.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const MODAL_CARD: React.CSSProperties = { width: 'min(720px,100%)', maxHeight: '92dvh', overflow: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 28px 70px rgba(15,23,42,.28)' };

const typeLabel = (value: string) => ASSESSMENT_TYPES.find(item => item.value === value)?.label || value || 'Khác';
const statusMeta = (status: Assessment['status']) => status === 'finalized'
  ? { label: 'Đã chốt', tone: 'success' as const }
  : status === 'entering'
    ? { label: 'Đang nhập', tone: 'warning' as const }
    : { label: 'Nháp', tone: 'neutral' as const };

const classCode = (row: any) => String(row?.['Mã Lớp'] || row?.MaLop || row?.classId || '');
const normalizedScore = (entry: ScoreEntry, assessment: Assessment) => entry.status === 'scored' && entry.score != null && assessment.maxScore > 0
  ? entry.score / assessment.maxScore * 10
  : null;

function AssessmentModal({ editing, classes, saving, onClose, onSave }: {
  editing: Assessment | null;
  classes: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: AssessmentInput) => Promise<void>;
}) {
  const [name, setName] = useState(editing?.name || '');
  const [classId, setClassId] = useState(editing?.classId || classes[0] || '');
  const [date, setDate] = useState(toInputDate(editing?.date || localDateStr()));
  const [type, setType] = useState(editing?.type || 'quick');
  const [topic, setTopic] = useState(editing?.topic || '');
  const [maxScore, setMaxScore] = useState(String(editing?.maxScore || 10));
  const [weight, setWeight] = useState(String(editing?.weight || 1));
  const [note, setNote] = useState(editing?.note || '');

  const submit = async () => {
    const max = Number(maxScore);
    const w = Number(weight);
    if (!name.trim() || !classId || !date) return toast.error('Vui lòng nhập tên, lớp và ngày kiểm tra');
    if (!Number.isFinite(max) || max <= 0) return toast.error('Thang điểm phải lớn hơn 0');
    if (!Number.isFinite(w) || w <= 0) return toast.error('Trọng số phải lớn hơn 0');
    await onSave({
      id: editing?.id,
      name: name.trim(), classId, date, type, topic: topic.trim(), maxScore: max, weight: w,
      status: editing?.status || 'entering', note: note.trim(), lessonId: editing?.lessonId || '', teacherId: editing?.teacherId || '',
    });
  };

  return <div style={MODAL_OVERLAY} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section style={MODAL_CARD}>
      <header style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: 19, color: '#0f172a' }}>{editing ? 'Cập nhật bài kiểm tra' : 'Tạo bài kiểm tra'}</h2>
        <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 12 }}>Thông tin dùng chung cho toàn bộ sổ điểm của lớp.</p>
      </header>
      <div className="score-form-grid" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
        <Input label="Tên bài kiểm tra" value={name} onChange={setName} required style={{ gridColumn: '1/-1' }} />
        <Select label="Lớp" value={classId} onChange={setClassId} options={classes.map(value => ({ value, label: `Lớp ${value}` }))} disabled={!!editing} />
        <Input label="Ngày kiểm tra" type="date" value={date} onChange={setDate} />
        <Select label="Loại bài" value={type} onChange={setType} options={ASSESSMENT_TYPES} />
        <Input label="Chuyên đề" value={topic} onChange={setTopic} placeholder="Ví dụ: Hàm số bậc hai" />
        <Input label="Thang điểm" type="number" value={maxScore} onChange={setMaxScore} />
        <Input label="Trọng số" type="number" value={weight} onChange={setWeight} />
        <Input label="Ghi chú" value={note} onChange={setNote} style={{ gridColumn: '1/-1' }} />
      </div>
      <footer style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button intent="neutral" variant="outline" onClick={onClose}>Hủy</Button>
        <Button icon={<Save size={14} />} loading={saving} onClick={() => void submit()}>{editing ? 'Lưu thay đổi' : 'Tạo bài kiểm tra'}</Button>
      </footer>
    </section>
  </div>;
}

function ScoreEditor({ assessment, students, enrollments, existing, saving, onClose, onSave, onReopen }: {
  assessment: Assessment;
  students: Student[];
  enrollments: ScoreEnrollment[];
  existing: ScoreEntry[];
  saving: boolean;
  onClose: () => void;
  onSave: (entries: ScoreDraft[], expectedIds: string[], finalize: boolean) => Promise<void>;
  onReopen: () => Promise<void>;
}) {
  const existingMap = useMemo(() => new Map(existing.map(entry => [entry.studentId, entry])), [existing]);
  const enrollmentStudentIds = useMemo(() => new Set(enrollments.map(item => item.studentId)), [enrollments]);
  const eligible = useMemo(() => students
    .filter(student => {
      if (existingMap.has(student.id)) return true;
      const assessmentTs = parseDMY(assessment.date);
      const historicalMatch = enrollments.some(item => {
        if (item.studentId !== student.id || item.classId !== assessment.classId) return false;
        const startTs = parseDMY(item.startDate);
        const endTs = parseDMY(item.endDate);
        return (!startTs || assessmentTs >= startTs) && (!endTs || assessmentTs <= endTs);
      });
      if (historicalMatch) return true;
      return !enrollmentStudentIds.has(student.id) && student.classId === assessment.classId && isStudentActiveOnDate(student, assessment.date);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
  [assessment.classId, assessment.date, enrollmentStudentIds, enrollments, existingMap, students]);
  const [rows, setRows] = useState<ScoreFormRow[]>(() => eligible.map(student => {
    const entry = existingMap.get(student.id);
    return { student, status: entry?.status || '', score: entry?.score == null ? '' : String(entry.score), comment: entry?.comment || '' };
  }));
  const locked = assessment.status === 'finalized';
  const completed = rows.filter(row => row.status).length;

  const updateRow = (id: string, patch: Partial<ScoreFormRow>) => setRows(current => current.map(row => row.student.id === id ? { ...row, ...patch } : row));
  const buildEntries = (): ScoreDraft[] | null => {
    const next: ScoreDraft[] = [];
    for (const row of rows) {
      if (!row.status) continue;
      if (row.status === 'scored') {
        const score = Number(row.score);
        if (row.score === '' || !Number.isFinite(score) || score < 0 || score > assessment.maxScore) {
          toast.error(`Điểm của ${row.student.name} phải từ 0 đến ${assessment.maxScore}`);
          return null;
        }
        next.push({ studentId: row.student.id, status: 'scored', score, comment: row.comment.trim() });
      } else next.push({ studentId: row.student.id, status: row.status, score: null, comment: row.comment.trim() });
    }
    return next;
  };
  const submit = async (finalize: boolean) => {
    if (finalize && completed !== rows.length) return toast.error('Cần nhập trạng thái cho toàn bộ học sinh trước khi chốt');
    const entries = buildEntries();
    if (!entries) return;
    if (finalize && entries.length === 0) return toast.error('Không có kết quả để chốt');
    await onSave(entries, rows.map(row => row.student.id), finalize);
    if (finalize) onClose();
  };

  return <div style={MODAL_OVERLAY}>
    <section style={{ ...MODAL_CARD, width: 'min(980px,100%)' }}>
      <header style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 19, color: '#0f172a' }}>{assessment.name}</h2>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 12 }}>Lớp {assessment.classId} · {formatDate(assessment.date)} · thang {assessment.maxScore} · đã nhập {completed}/{rows.length}</p>
        </div>
        <StatusBadge status={assessment.status} label={statusMeta(assessment.status).label} tone={statusMeta(assessment.status).tone} />
      </header>
      {locked && <div style={{ margin: '12px 20px 0', padding: '10px 12px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 12, fontWeight: 800 }}>Bài đã chốt và đang khóa chỉnh sửa.</div>}
      <div style={{ padding: '12px 20px 18px', overflowX: 'auto' }}>
        <table className="score-entry-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead><tr>{['Học sinh', 'Điểm', 'Trạng thái', 'Nhận xét'].map(label => <th key={label} style={{ padding: '9px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{label}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.student.id}>
            <td style={{ padding: '9px 10px', borderBottom: '1px solid #eef2f7', fontSize: 13, fontWeight: 800 }}>{row.student.name}<div style={{ fontSize: 10, color: '#94a3b8' }}>{row.student.id}</div></td>
            <td style={{ padding: '9px 10px', borderBottom: '1px solid #eef2f7', width: 120 }}><input disabled={locked || (row.status !== '' && row.status !== 'scored')} type="number" min={0} max={assessment.maxScore} step="0.25" value={row.score} onChange={event => updateRow(row.student.id, { score: event.target.value, status: event.target.value === '' ? '' : 'scored' })} style={{ width: 88, height: 34, border: '1px solid #d8ddea', borderRadius: 8, padding: '0 9px', fontWeight: 800 }} /></td>
            <td style={{ padding: '9px 10px', borderBottom: '1px solid #eef2f7', width: 150 }}><select disabled={locked} value={row.status} onChange={event => updateRow(row.student.id, { status: event.target.value as ScoreFormRow['status'], score: event.target.value === 'scored' ? row.score : '' })} style={{ width: 132, height: 34, border: '1px solid #d8ddea', borderRadius: 8, background: '#fff', padding: '0 8px', fontWeight: 700 }}>{STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
            <td style={{ padding: '9px 10px', borderBottom: '1px solid #eef2f7' }}><input disabled={locked} value={row.comment} onChange={event => updateRow(row.student.id, { comment: event.target.value })} placeholder="Nhận xét ngắn" style={{ width: '100%', minWidth: 180, height: 34, border: '1px solid #d8ddea', borderRadius: 8, padding: '0 9px' }} /></td>
          </tr>)}</tbody>
        </table>
        {rows.length === 0 && <EmptyState compact text="Không có học sinh phù hợp tại ngày kiểm tra" />}
      </div>
      <footer style={{ padding: '13px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Button intent="neutral" variant="outline" onClick={onClose}>Đóng</Button>
        {locked ? <Button intent="warning" icon={<RotateCcw size={14} />} loading={saving} onClick={() => void onReopen()}>Mở lại để sửa</Button> : <>
          <Button intent="neutral" variant="outline" icon={<Save size={14} />} loading={saving} onClick={() => void submit(false)}>Lưu nháp</Button>
          <Button intent="success" icon={<LockKeyhole size={14} />} loading={saving} onClick={() => void submit(true)}>Chốt điểm</Button>
        </>}
      </footer>
    </section>
  </div>;
}

export default function ScoresTab({ assessments, scores, enrollments, students, uClasses, loading, saving, onSaveAssessment, onSaveScores, onReopen, onDelete }: Props) {
  const [sub, setSub] = useState<ScoresSub>('assessments');
  const [classFilter, setClassFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [showAssessment, setShowAssessment] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [scoreAssessment, setScoreAssessment] = useState<Assessment | null>(null);

  const classes = useMemo(() => [...new Set([...uClasses.map(classCode), ...assessments.map(item => item.classId)].filter(Boolean))].sort(compareClassCode), [assessments, uClasses]);
  useEffect(() => {
    if (!classFilter && classes.length) setClassFilter(classes[0]);
  }, [classFilter, classes]);
  const classOptions = [{ value: '', label: 'Tất cả lớp' }, ...classes.map(value => ({ value, label: `Lớp ${value}` }))];

  const filteredAssessments = useMemo(() => assessments
    .filter(item => !classFilter || item.classId === classFilter)
    .filter(item => !statusFilter || item.status === statusFilter)
    .filter(item => !monthFilter || toInputDate(item.date).slice(0, 7) === monthFilter)
    .filter(item => !query || `${item.name} ${item.topic} ${item.classId}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
    .sort((a, b) => parseDMY(b.date) - parseDMY(a.date)),
  [assessments, classFilter, monthFilter, query, statusFilter]);

  const scoreCount = useMemo(() => {
    const map = new Map<string, number>();
    scores.forEach(entry => map.set(entry.assessmentId, (map.get(entry.assessmentId) || 0) + 1));
    return map;
  }, [scores]);

  const finalized = useMemo(() => assessments.filter(item => item.status === 'finalized' && (!classFilter || item.classId === classFilter)).sort((a, b) => parseDMY(a.date) - parseDMY(b.date)), [assessments, classFilter]);
  const matrixAssessments = finalized.slice(-8);
  const scoreByKey = useMemo(() => new Map(scores.map(entry => [`${entry.assessmentId}:${entry.studentId}`, entry])), [scores]);
  const gradebookStudents = useMemo(() => students.filter(student => student.classId === classFilter || finalized.some(a => scoreByKey.has(`${a.id}:${student.id}`))).sort((a, b) => a.name.localeCompare(b.name, 'vi')), [classFilter, finalized, scoreByKey, students]);

  const metricOf = (studentId: string, source = finalized) => {
    const points = source.map(assessment => ({ assessment, entry: scoreByKey.get(`${assessment.id}:${studentId}`) })).filter(item => item.entry?.status === 'scored' && item.entry.score != null);
    const weighted = points.reduce((sum, item) => sum + (normalizedScore(item.entry!, item.assessment) || 0) * item.assessment.weight, 0);
    const weights = points.reduce((sum, item) => sum + item.assessment.weight, 0);
    const values = points.map(item => normalizedScore(item.entry!, item.assessment)!).filter(value => value != null);
    const last3 = values.slice(-3);
    const declining = last3.length === 3 && last3[0] > last3[1] && last3[1] > last3[2];
    const absent = source.filter(assessment => scoreByKey.get(`${assessment.id}:${studentId}`)?.status === 'absent').length;
    return { average: weights ? weighted / weights : null, last: values.at(-1) ?? null, count: values.length, declining, absent };
  };

  const insights = useMemo(() => students.map(student => ({ student, ...metricOf(student.id, assessments.filter(item => item.status === 'finalized')) }))
    .filter(row => (row.average != null && row.average < 5) || row.declining || row.absent >= 2)
    .sort((a, b) => Number(b.declining) - Number(a.declining) || b.absent - a.absent || (a.average ?? 99) - (b.average ?? 99)),
  // metricOf reads the same immutable render snapshot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [assessments, scoreByKey, students]);

  const saveAssessment = async (input: AssessmentInput) => {
    await onSaveAssessment(input);
    setShowAssessment(false);
    setEditingAssessment(null);
  };
  const remove = async (assessment: Assessment) => {
    if (assessment.status === 'finalized') return toast.error('Cần mở lại bài kiểm tra trước khi xóa');
    if (!window.confirm(`Xóa bài kiểm tra “${assessment.name}” và toàn bộ điểm đã nhập?`)) return;
    await onDelete(assessment.id);
  };

  const assessmentColumns = [
    { key: 'date', label: 'Ngày', width: 95, render: (_: unknown, row: Assessment) => <strong>{formatDate(row.date)}</strong> },
    { key: 'name', label: 'Bài kiểm tra', render: (_: unknown, row: Assessment) => <div><strong>{row.name}</strong><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{typeLabel(row.type)}{row.topic ? ` · ${row.topic}` : ''}</div></div> },
    { key: 'classId', label: 'Lớp', align: 'center' as const, width: 80, render: (_: unknown, row: Assessment) => <StatusBadge status="class" label={row.classId} tone="violet" dot={false} /> },
    { key: 'maxScore', label: 'Thang', align: 'center' as const, width: 70 },
    { key: 'progress', label: 'Đã nhập', align: 'center' as const, width: 85, render: (_: unknown, row: Assessment) => <strong>{scoreCount.get(row.id) || 0}</strong> },
    { key: 'status', label: 'Trạng thái', align: 'center' as const, width: 105, render: (_: unknown, row: Assessment) => <StatusBadge status={row.status} label={statusMeta(row.status).label} tone={statusMeta(row.status).tone} /> },
    { key: 'actions', label: 'Thao tác', align: 'right' as const, width: 220, render: (_: unknown, row: Assessment) => <TableActions compact actions={[
      { label: row.status === 'finalized' ? 'Xem điểm' : 'Nhập điểm', icon: <BookOpenCheck size={13} />, intent: 'primary', onClick: () => setScoreAssessment(row) },
      { label: 'Sửa', icon: <Edit3 size={13} />, disabled: row.status === 'finalized', onClick: () => { setEditingAssessment(row); setShowAssessment(true); } },
      { label: 'Xóa', icon: <Trash2 size={13} />, intent: 'danger', disabled: row.status === 'finalized', onClick: () => void remove(row) },
    ]} /> },
  ];

  const gradebookColumns: any[] = [
    { key: 'student', label: 'Học sinh', width: 190, render: (_: unknown, row: { student: Student }) => <div><strong>{row.student.name}</strong><div style={{ color: '#94a3b8', fontSize: 10 }}>{row.student.id}</div></div> },
    ...matrixAssessments.map(assessment => ({ key: assessment.id, label: assessment.name, align: 'center' as const, width: 115, render: (_: unknown, row: { student: Student }) => {
      const entry = scoreByKey.get(`${assessment.id}:${row.student.id}`);
      if (!entry) return <span style={{ color: '#cbd5e1' }}>—</span>;
      if (entry.status === 'absent') return <span style={{ color: '#e11d48', fontWeight: 800 }}>Vắng</span>;
      if (entry.status === 'exempt') return <span style={{ color: '#64748b', fontWeight: 800 }}>Miễn</span>;
      return <strong>{entry.score}/{assessment.maxScore}</strong>;
    } })),
    { key: 'average', label: 'TB / 10', align: 'center' as const, width: 90, render: (_: unknown, row: { student: Student }) => { const metric = metricOf(row.student.id); return <strong style={{ color: metric.average != null && metric.average < 5 ? '#dc2626' : '#047857' }}>{metric.average == null ? '—' : metric.average.toFixed(1)}</strong>; } },
    { key: 'trend', label: 'Theo dõi', align: 'center' as const, width: 100, render: (_: unknown, row: { student: Student }) => { const metric = metricOf(row.student.id); return metric.declining ? <StatusBadge status="declining" label="Đang giảm" tone="danger" /> : <StatusBadge status="stable" label={metric.count >= 3 ? 'Ổn định' : 'Ít dữ liệu'} tone="neutral" />; } },
  ];

  const insightColumns = [
    { key: 'student', label: 'Học sinh', render: (_: unknown, row: typeof insights[number]) => <div><strong>{row.student.name}</strong><div style={{ color: '#94a3b8', fontSize: 10 }}>{row.student.id}</div></div> },
    { key: 'classId', label: 'Lớp', align: 'center' as const, width: 90, render: (_: unknown, row: typeof insights[number]) => <StatusBadge status="class" label={row.student.classId || '—'} tone="violet" dot={false} /> },
    { key: 'average', label: 'Trung bình', align: 'center' as const, width: 105, render: (_: unknown, row: typeof insights[number]) => <strong style={{ color: row.average != null && row.average < 5 ? '#dc2626' : '#334155' }}>{row.average == null ? '—' : row.average.toFixed(1)}</strong> },
    { key: 'issue', label: 'Vấn đề cần xử lý', render: (_: unknown, row: typeof insights[number]) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{row.average != null && row.average < 5 && <StatusBadge status="low" label="TB dưới 5" tone="danger" />}{row.declining && <StatusBadge status="declining" label="Giảm 3 bài" tone="warning" />}{row.absent >= 2 && <StatusBadge status="absent" label={`Vắng ${row.absent} bài`} tone="danger" />}</div> },
  ];

  return <div style={{ display: 'grid', gap: 12 }}>
    <style>{`
      .scores-desktop{display:block}.scores-mobile{display:none}
      @media(max-width:767px){.scores-desktop{display:none!important}.scores-mobile{display:grid!important}.score-form-grid{grid-template-columns:1fr!important}.score-form-grid>*{grid-column:auto!important}}
    `}</style>
    <PageToolbar title="Điểm số" actions={<Button size="sm" icon={<Plus size={14} />} onClick={() => { setEditingAssessment(null); setShowAssessment(true); }}>Tạo bài kiểm tra</Button>}>
      <ToolbarTabs tabs={[{ id: 'assessments', label: 'Bài kiểm tra' }, { id: 'gradebook', label: 'Sổ điểm' }, { id: 'insights', label: 'Tiến bộ & Cảnh báo' }]} active={sub} onChange={id => setSub(id as ScoresSub)} />
    </PageToolbar>

    {sub === 'assessments' && <>
      <PageToolbar embedded>
        <Select value={classFilter} onChange={setClassFilter} options={classOptions} size="sm" style={{ width: 130 }} />
        <Input type="month" value={monthFilter} onChange={setMonthFilter} size="sm" style={{ width: 150 }} />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Mọi trạng thái' }, { value: 'draft', label: 'Nháp' }, { value: 'entering', label: 'Đang nhập' }, { value: 'finalized', label: 'Đã chốt' }]} size="sm" style={{ width: 145 }} />
        <SearchBar value={query} onChange={setQuery} placeholder="Tìm bài kiểm tra..." size="sm" width={220} />
      </PageToolbar>
      <div className="scores-desktop"><DataTable columns={assessmentColumns} data={filteredAssessments} rowKey="id" loading={loading} emptyText="Chưa có bài kiểm tra phù hợp" /></div>
      <div className="scores-mobile" style={{ gap: 8 }}>{filteredAssessments.length === 0 ? <EmptyState compact text="Chưa có bài kiểm tra phù hợp" /> : filteredAssessments.map(item => <article key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div><strong style={{ fontSize: 14 }}>{item.name}</strong><div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Lớp {item.classId} · {formatDate(item.date)} · {typeLabel(item.type)}</div></div><StatusBadge status={item.status} label={statusMeta(item.status).label} tone={statusMeta(item.status).tone} /></div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, color: '#64748b' }}>Thang {item.maxScore} · {scoreCount.get(item.id) || 0} kết quả</span><Button size="xs" variant="outline" onClick={() => setScoreAssessment(item)}>{item.status === 'finalized' ? 'Xem điểm' : 'Nhập điểm'}</Button></div>
      </article>)}</div>
    </>}

    {sub === 'gradebook' && <>
      <PageToolbar embedded><Select value={classFilter} onChange={setClassFilter} options={classOptions.filter(option => option.value)} size="sm" style={{ width: 150 }} /><span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Hiển thị tối đa 8 bài đã chốt gần nhất</span></PageToolbar>
      {classFilter && matrixAssessments.length ? <>
        <div className="scores-desktop"><DataTable columns={gradebookColumns} data={gradebookStudents.map(student => ({ id: student.id, student }))} rowKey="id" emptyText="Chưa có học sinh trong sổ điểm" /></div>
        <div className="scores-mobile" style={{ gap: 8 }}>{gradebookStudents.map(student => { const metric = metricOf(student.id); return <article key={student.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{student.name}</strong><strong style={{ color: metric.average != null && metric.average < 5 ? '#dc2626' : '#047857' }}>{metric.average == null ? '—' : `${metric.average.toFixed(1)}/10`}</strong></div><div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{metric.count} bài có điểm · gần nhất {metric.last == null ? '—' : metric.last.toFixed(1)}{metric.declining ? ' · đang giảm' : ''}</div></article>; })}</div>
      </> : <EmptyState compact text="Chưa có bài kiểm tra đã chốt cho lớp này" sub="Chốt ít nhất một bài kiểm tra để tạo sổ điểm." />}
    </>}

    {sub === 'insights' && <>
      <ActionableKpiGrid cols={3}>
        <ActionableKpi icon={AlertTriangle} value={insights.length} label="Học sinh cần hỗ trợ" tone="danger" />
        <ActionableKpi icon={TrendingDown} value={insights.filter(row => row.declining).length} label="Giảm 3 bài liên tiếp" tone="warning" />
        <ActionableKpi icon={Users} value={insights.filter(row => row.absent >= 2).length} label="Vắng từ 2 bài" tone="info" />
      </ActionableKpiGrid>
      <div className="scores-desktop"><DataTable<any> columns={insightColumns} data={insights.map(row => ({ ...row, id: row.student.id }))} rowKey="id" emptyText="Chưa có cảnh báo điểm số" emptySub="Cảnh báo chỉ dùng dữ liệu của các bài đã chốt." /></div>
      <div className="scores-mobile" style={{ gap: 8 }}>{insights.length === 0 ? <EmptyState compact text="Chưa có cảnh báo điểm số" /> : insights.map(row => <article key={row.student.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{row.student.name}</strong><span style={{ color: '#64748b', fontSize: 12 }}>Lớp {row.student.classId}</span></div><div style={{ marginTop: 7, fontSize: 12, color: '#475569' }}>TB {row.average == null ? '—' : row.average.toFixed(1)}{row.declining ? ' · giảm 3 bài' : ''}{row.absent >= 2 ? ` · vắng ${row.absent} bài` : ''}</div></article>)}</div>
    </>}

    {showAssessment && <AssessmentModal editing={editingAssessment} classes={classes} saving={saving} onClose={() => { setShowAssessment(false); setEditingAssessment(null); }} onSave={saveAssessment} />}
    {scoreAssessment && <ScoreEditor assessment={scoreAssessment} students={students} enrollments={enrollments} existing={scores.filter(entry => entry.assessmentId === scoreAssessment.id)} saving={saving} onClose={() => setScoreAssessment(null)} onSave={(entries, expected, finalize) => onSaveScores(scoreAssessment.id, entries, expected, finalize)} onReopen={async () => { await onReopen(scoreAssessment.id); setScoreAssessment({ ...scoreAssessment, status: 'entering' }); }} />}
  </div>;
}
