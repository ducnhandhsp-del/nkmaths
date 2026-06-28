/**
 * StudentsTab.tsx - man hinh quan ly du lieu hoc sinh goc.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReceiptText, UserPlus } from 'lucide-react';
import { IPP, capitalizeName, isStudentActive, parseDMY } from './helpers';
import { Badge, Pager, Button, Select } from './dsComponents';
import { DataTable, EmptyState, MobileCard, PageToolbar, StatusBadge } from './uiSystem';
import type { Student, DeleteTarget } from './types';

interface Props {
  filtS: Student[];
  pgS: number;
  setPgS: (p: number) => void;
  students: Student[];
  qS: string;
  setQS: (v: string) => void;
  fCls: string;
  setFCls: (v: string) => void;
  hideInactive: boolean;
  setHideInactive: (v: boolean) => void;
  uClasses: any[];
  onViewStudent: (s: Student) => void;
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (t: DeleteTarget) => void;
  onAddStudent: () => void;
  onBulkTransfer: (ss: Student[]) => void;
  onCollectFee?: (s: Student) => void;
  curMo?: number;
  curYr?: number;
  isPaid?: (sid: string, mo: number, yr: number) => boolean;
  embedded?: boolean;
  toolbarPrefix?: React.ReactNode;
}

const getClassCode = (c: any) =>
  String(c?.['Mã Lớp'] || c?.['Mã lớp'] || c?.['MÃ£ Lá»›p'] || c?.MaLop || c?.classId || '').trim();

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

function schoolMonthsUntil(month: number, year: number) {
  const startYear = month >= 7 ? year : year - 1;
  const months: { m: number; y: number }[] = [];
  for (let m = 7; m <= 12; m++) months.push({ m, y: startYear });
  for (let m = 1; m <= 6; m++) months.push({ m, y: startYear + 1 });
  return months.filter(fm => fm.y < year || (fm.y === year && fm.m <= month));
}

function DebtMonthsState({ months }: { months: number | null }) {
  if (months == null) return <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
  if (months === 1) return <StatusBadge status="warning" label="Chưa thu" tone="warning" />;
  return months > 0 ? (
    <StatusBadge status="warning" label={`Nợ ${months} tháng`} tone="warning" />
  ) : (
    <StatusBadge status="success" label="Đã đủ" tone="success" />
  );
}

function classSummary(raw: string) {
  const classes = String(raw || '')
    .split(/[,;|]+/)
    .map(item => item.trim())
    .filter(Boolean);
  if (classes.length === 0) return null;
  return { primary: classes[0], extra: classes.length - 1 };
}

function ZaloMark({ size = 18 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: Math.round(size * 0.72),
        borderRadius: Math.max(5, Math.round(size * 0.28)),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0068ff',
        color: '#fff',
        fontSize: Math.max(7, Math.round(size * 0.42)),
        fontWeight: 950,
        lineHeight: 1,
        letterSpacing: '-0.05em',
        fontFamily: 'Arial, sans-serif',
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.14)',
      }}
    >
      Zalo
    </span>
  );
}

export default function StudentsTab({
  filtS,
  pgS,
  setPgS,
  students,
  qS,
  setQS,
  fCls,
  setFCls,
  hideInactive,
  setHideInactive,
  uClasses,
  onViewStudent,
  onDeleteStudent,
  onAddStudent,
  onBulkTransfer,
  onCollectFee,
  curMo,
  curYr,
  isPaid,
  embedded = false,
  toolbarPrefix,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'inactive'>(hideInactive ? 'active' : 'all');
  const [gradeFilter, setGradeFilter] = useState('');

  useEffect(() => {
    if (hideInactive && statusFilter !== 'active') setStatusFilter('active');
  }, [hideInactive, statusFilter]);

  const canShowDebt = !!curMo && !!curYr && !!isPaid;

  const classOptions = useMemo(() => {
    const rows = uClasses
      .map(c => {
        const code = getClassCode(c);
        return { value: code, label: code || '---' };
      })
      .filter(o => o.value);
    return [{ value: '', label: 'Lớp' }, ...rows];
  }, [uClasses]);

  const gradeOptions = useMemo(() => {
    const grades = [...new Set(students.map(s => String(s.grade || '').trim()).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));
    return [{ value: '', label: 'Khối' }, ...grades.map(g => ({ value: g, label: `Khối ${g}` }))];
  }, [students]);

  const debtMonthsOf = useCallback((s: Student): number | null => {
    if (!canShowDebt || !isStudentActive(s)) return null;
    return schoolMonthsUntil(curMo!, curYr!)
      .filter(fm => isMonthBillable(s, fm.m, fm.y))
      .filter(fm => !isPaid!(s.id, fm.m, fm.y))
      .length;
  }, [canShowDebt, curMo, curYr, isPaid]);

  const displayed = useMemo(() => {
    return filtS.filter(s => {
      const active = isStudentActive(s);
      if (statusFilter === 'inactive' && isStudentActive(s)) return false;
      if (statusFilter === 'active' && !active) return false;
      if (gradeFilter && String(s.grade || '').trim() !== gradeFilter) return false;
      return true;
    });
  }, [filtS, gradeFilter, statusFilter]);

  const paged = displayed.slice((pgS - 1) * IPP, pgS * IPP);
  const hasActiveFilter = !!qS || !!fCls || !!gradeFilter;
  const resetFilters = () => {
    setQS('');
    setFCls('');
    setGradeFilter('');
    setStatusFilter('active');
    setHideInactive(true);
    setPgS(1);
  };

  const emptyState = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <EmptyState
        text={hasActiveFilter ? 'Không tìm thấy học sinh phù hợp' : 'Chưa có học sinh'}
        sub={hasActiveFilter ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Thêm học sinh đầu tiên để bắt đầu quản lý lớp.'}
        compact
      />
      {!embedded && <Button intent="success" size="sm" icon={<UserPlus size={14} />} onClick={onAddStudent}>Thêm học sinh đầu tiên</Button>}
    </div>
  );

  const studentColumns = useMemo(() => [
    {
      key: 'id',
      label: 'Mã HS',
      width: 78,
      align: 'center' as const,
      cellStyle: { whiteSpace: 'nowrap' },
      render: (_: unknown, student: Student) => (
        <span style={{ fontSize: 12, fontWeight: 900, color: '#4f46e5', fontVariantNumeric: 'tabular-nums' }}>
          {student.id || '—'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Tên',
      width: '25%',
      render: (_: unknown, student: Student) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {capitalizeName(student.name) || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'classId',
      label: 'Lớp',
      align: 'center' as const,
      width: 68,
      cellStyle: { whiteSpace: 'nowrap', paddingLeft: 8, paddingRight: 8 },
      headerStyle: { paddingLeft: 8, paddingRight: 8 },
      render: (_: unknown, student: Student) => {
        const summary = classSummary(student.classId);
        if (!summary) return <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, maxWidth: '100%' }}>
            <span className="student-class-code">{summary.primary}</span>
            {summary.extra > 0 && <span style={{ color: '#64748b', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>+{summary.extra}</span>}
          </span>
        );
      },
    },
    {
      key: 'parentName',
      label: 'Phụ huynh',
      width: '18%',
      render: (_: unknown, student: Student) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: student.parentName ? '#0f172a' : '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.parentName || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'parentPhone',
      label: 'SĐT',
      width: 112,
      cellStyle: { whiteSpace: 'nowrap' },
      render: (_: unknown, student: Student) => (
        <span style={{
          fontSize: 12,
          fontWeight: 900,
          color: student.parentPhone || student.studentPhone ? '#334155' : '#94a3b8',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {student.parentPhone || student.studentPhone || '—'}
        </span>
      ),
    },
    {
      key: 'tuition',
      label: 'Học phí',
      align: 'center' as const,
      width: 98,
      render: (_: unknown, student: Student) => <DebtMonthsState months={debtMonthsOf(student)} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: 78,
      cellStyle: { paddingLeft: 8, paddingRight: 8 },
      headerStyle: { paddingLeft: 8, paddingRight: 8 },
      render: (_: unknown, student: Student) => {
        const zaloPhone = String(student.parentPhone || student.studentPhone || '').replace(/\D/g, '');
        return (
          <div onClick={e => e.stopPropagation()} className="student-action-strip">
            {zaloPhone.length >= 9 ? (
              <a
                href={`https://zalo.me/${zaloPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Zalo"
                aria-label={`Zalo ${capitalizeName(student.name)}`}
                className="student-action-icon student-action-icon--zalo"
              >
                <ZaloMark size={20} />
              </a>
            ) : (
              <span className="student-action-icon student-action-icon--empty" aria-hidden="true">—</span>
            )}
            {onCollectFee && isStudentActive(student) && (
              <button
                type="button"
                title="Phiếu"
                aria-label={`Phiếu thu ${capitalizeName(student.name)}`}
                className="student-action-icon student-action-icon--receipt"
                onClick={() => onCollectFee?.(student)}
              >
                <ReceiptText size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [debtMonthsOf, onCollectFee]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: embedded ? 10 : 20 }}>
      <style>{`
        .student-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .student-toolbar-search{width:136px;min-width:118px;height:34px;border:1px solid #dbe3ef;border-radius:8px;background:#fff;padding:0 10px;font-size:13px;font-weight:800;color:#0f172a;outline:none}
        .student-toolbar-search::placeholder{color:#94a3b8;font-weight:800}
        .student-toolbar-reset{height:32px;padding:0 9px;border-radius:999px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:12px;font-weight:900;cursor:pointer}
        .student-toolbar-reset:hover{border-color:#cbd5e1;background:#f8fafc}
        .student-class-code{display:inline-flex;align-items:center;justify-content:center;min-width:42px;max-width:56px;height:24px;padding:0 8px;border-radius:999px;background:#eef2ff;border:1px solid #c7d2fe;color:#4338ca;font-size:12px;font-weight:950;font-variant-numeric:tabular-nums;line-height:1;white-space:nowrap}
        .student-action-strip{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:66px}
        .student-action-icon{width:30px;height:30px;padding:0;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;text-decoration:none;cursor:pointer;transition:background .14s ease,border-color .14s ease,box-shadow .14s ease,transform .14s ease}
        .student-action-icon:hover{box-shadow:0 5px 14px rgba(15,23,42,.10);transform:translateY(-1px)}
        .student-action-icon:active{transform:translateY(0)}
        .student-action-icon--zalo{background:#eef6ff;border:1px solid #bfdbfe;color:#0068ff}
        .student-action-icon--receipt{background:#ecfdf5;border:1px solid #bbf7d0;color:#047857}
        .student-action-icon--empty{background:#f8fafc;border:1px solid #e2e8f0;color:#cbd5e1;cursor:default}
        .student-action-icon--empty:hover{box-shadow:none;transform:none}
        .student-mobile-actions .student-action-icon{width:40px;height:40px;flex-basis:40px}
        .student-desktop-table{display:block}.student-mobile-cards{display:none}
        @media(max-width:767px){
          .student-toolbar-filters{width:100%;display:grid;grid-template-columns:minmax(0,1fr) 92px 92px;gap:8px}
          .student-toolbar-search{width:100%;min-width:0}
          .student-toolbar-filters select{width:100%!important;min-width:0!important}
          .student-toolbar-reset{grid-column:1/-1}
          .student-desktop-table{display:none!important}.student-mobile-cards{display:block!important}
        }
      `}</style>

      <PageToolbar
        title="Học sinh"
        embedded={embedded}
        actions={!embedded && (
          <Button intent="success" size="sm" icon={<UserPlus size={14} />} iconPosition="left" onClick={onAddStudent}>
            Thêm học sinh
          </Button>
        )}
      >
        {toolbarPrefix}
        <div className="student-toolbar-filters">
          <input
            className="student-toolbar-search"
            value={qS}
            onChange={e => { setQS(e.target.value); setPgS(1); }}
            placeholder="Tìm"
            aria-label="Tìm học sinh"
          />
          <Select value={fCls} onChange={v => { setFCls(v); setPgS(1); }} options={classOptions} style={{ width: 92, minWidth: 88 }} />
          <Select value={gradeFilter} onChange={v => { setGradeFilter(v); setPgS(1); }} options={gradeOptions} style={{ width: 92, minWidth: 88 }} />
          {hasActiveFilter && (
            <button type="button" className="student-toolbar-reset" onClick={resetFilters}>
              Xóa lọc
            </button>
          )}
        </div>
      </PageToolbar>

      <div>
        <div className="student-desktop-table">
          <DataTable
            columns={studentColumns}
            data={paged}
            rowKey="id"
            emptyText={hasActiveFilter ? 'Không tìm thấy học sinh phù hợp' : 'Chưa có học sinh'}
            emptySub={hasActiveFilter ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Thêm học sinh đầu tiên để bắt đầu quản lý lớp.'}
            emptyAction={!embedded ? { label: 'Thêm học sinh đầu tiên', onClick: onAddStudent, intent: 'success' } : undefined}
            onRowClick={onViewStudent}
            scrollX={false}
            density="compact"
            footer={<Pager page={pgS} total={displayed.length} perPage={IPP} setPage={setPgS} showTotal />}
          />
        </div>

        <div className="student-mobile-cards" style={{ padding: 10 }}>
          {paged.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>{emptyState}</div>
          ) : paged.map((s) => {
            const inactive = !isStudentActive(s);
            const zaloPhone = String(s.parentPhone || s.studentPhone || '').replace(/\D/g, '');
            const debtMonths = debtMonthsOf(s);
            return (
              <MobileCard
                key={s.id}
                title={capitalizeName(s.name)}
                subtitle={`${s.id || '—'}${s.classId ? ` · ${s.classId}` : ''}`}
                badge={<StatusBadge domain="student" status={inactive ? 'inactive' : 'active'} />}
                tone={inactive ? 'neutral' : 'primary'}
                onClick={() => onViewStudent(s)}
                style={{ marginBottom: 8, opacity: inactive ? 0.58 : 1 }}
                rows={[
                  { label: 'Lớp', value: <Badge color="indigo">{s.classId || '—'}</Badge> },
                  { label: 'Khối / học lực', value: `${s.grade ? `Khối ${s.grade}` : '—'}${s.academicLevel ? ` · ${s.academicLevel}` : ''}` },
                  { label: 'Phụ huynh', value: s.parentName || '—' },
                  { label: 'Liên hệ', value: s.parentPhone || s.studentPhone || '—' },
                  { label: 'Học phí', value: <DebtMonthsState months={debtMonths} /> },
                ]}
                actions={(
                  <div onClick={e => e.stopPropagation()} className="student-mobile-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                    {zaloPhone.length >= 9 && (
                      <a
                        href={`https://zalo.me/${zaloPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Zalo"
                        aria-label={`Zalo ${capitalizeName(s.name)}`}
                        className="student-action-icon student-action-icon--zalo"
                      >
                        <ZaloMark size={24} />
                      </a>
                    )}
                    {onCollectFee && !inactive && (
                      <button
                        type="button"
                        title="Phiếu"
                        aria-label={`Phiếu thu ${capitalizeName(s.name)}`}
                        className="student-action-icon student-action-icon--receipt"
                        onClick={() => onCollectFee(s)}
                      >
                        <ReceiptText size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              />
            );
          })}
          <Pager page={pgS} total={displayed.length} perPage={IPP} setPage={setPgS} showTotal />
        </div>
      </div>
    </div>
  );
}
