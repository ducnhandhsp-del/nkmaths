/**
 * FinanceTab.tsx — v29.0
 * ✅ Áp layout compact kiểu Lớp & Học sinh: header + subtab + filter row
 * ✅ Giữ nguyên logic nghiệp vụ công nợ/startDate/endDate
 * ✅ [v28.1] Tính nợ chỉ từ tháng học sinh bắt đầu học (startDate-aware)
 * ✅ [v28.1] Tháng sau endDate không tính là nợ
 * ✅ [v28.1] Sổ cái: phân trang thay vì cắt cứng 30 bản ghi
 * ✅ [v28.2] Fix: Zalo URL bỏ ?text= (Zalo không hỗ trợ pre-fill qua URL)
 * ✅ [v28.2] Fix: CSV export theo đúng filter đang hiển thị
 * ✅ [v28.2] Fix: activeStudents dùng isStudentActive nhất quán
 * ✅ [v28.2] Fix: xoá khai báo [fM, fY] không dùng (dead code)
 * ✅ [v28.2] Chi tiêu: phân trang tương tự Sổ cái
 * ✅ [v28.2] Zalo: thêm nút copy message vào clipboard
 */
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Check, TrendingDown, TrendingUp, Wallet, AlertTriangle, MessageCircle, ReceiptText, Edit3, Trash2 } from 'lucide-react';
import { fmtVND, capitalizeName, compareClassCode, normalizePaymentMethod, parseDMY, resolveTeacher } from './helpers';
import {
  classIdOf,
  getPaymentReceiptPeriod,
  getTuitionAccountState,
  parsePeriod,
  summarizeTuitionAccounts,
} from './measures';
import { Badge, Button, Pager, SearchBar, Select } from './dsComponents';
import { ActionableKpi, ActionableKpiGrid, DataTable, DateText, EmptyState, MobileRecordAction, MobileRecordList, MobileRecordMarker, MobileRecordRow, MobileRecordTextAction, MoneyText, MonthText, PageToolbar, StatusBadge, ToolbarTabs, ZaloMark, useIsMobileViewport } from './uiSystem';
import type { Payment, Expense, Student, FinanceSub, TeachingLog } from './types';
import type { TuitionAccountState, TuitionStatus } from './measures';

interface Props {
  financeSubtab?: FinanceSub;
  setFinanceSubtab?: (sub: FinanceSub) => void;
  payments: Payment[]; expenses: Expense[];
  students: Student[]; uClasses: any[]; tlogs: TeachingLog[];
  curMo: number; curYr: number;
  qF: string; setQF: (v: string) => void;
  fMo: string; setFMo: (v: string) => void;
  fTch: string; setFTch: (v: string) => void;
  fFC: string; setFFC: (v: string) => void;
  fSt: string; setFSt: (v: string) => void;
  pgF: number; setPgF: (p: number) => void;
  filtFin: Student[];
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  baseTuition: number; schoolYear: string; tuitionDueDay: number;
  onViewInvoice: (p: Payment) => void;
  onViewFinance: (s: Student) => void;
  onShowFAB: (tab?: 'income' | 'expense', draft?: any) => void;
  onEditPayment: (p: Payment) => void; onDeletePayment: (p: Payment) => void;
  onEditExpense: (e: Expense) => void; onDeleteExpense: (e: Expense) => void;
  onViewExpense: (e: Expense) => void;
}

type DebtStatus = TuitionStatus;

interface DebtTableRow {
  id: string;
  student: Student;
  account: TuitionAccountState;
  target: number;
  done: number;
  currentCycleIndex: number;
  unpaidCycleCount: number;
  dueCycleCount: number;
  overdueCycleCount: number;
  dueAmount: number;
  overdueAmount: number;
  hasReview: boolean;
  debtAmount: number;
  paidAmount: number;
  periodPayment?: Payment;
  lastPayment?: Payment;
  adjustedPayment: boolean;
  isInactive: boolean;
  isProblem: boolean;
  isWarning: boolean;
  status: DebtStatus;
}

const IPP = 25;
const LEDGER_IPP = 20; // phân trang sổ cái
const EXPENSE_IPP = 20; // phân trang chi tiêu
const FILTER_SELECT: React.CSSProperties = {
  height: 34,
  padding: '0 10px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  background: 'white',
  cursor: 'pointer',
  outline: 'none',
};
const debtStatusMeta = (status: DebtStatus): { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral' } => {
  if (status === 'paid') return { label: 'Đã thu', tone: 'success' };
  if (status === 'overdue') return { label: 'Quá hạn', tone: 'danger' };
  if (status === 'due') return { label: 'Cần thu', tone: 'warning' };
  if (status === 'needs_review') return { label: 'Cần kiểm tra', tone: 'warning' };
  if (status === 'inactive') return { label: 'Đã nghỉ', tone: 'neutral' };
  if (status === 'not_started') return { label: 'Chưa nhập học tại kỳ này', tone: 'neutral' };
  if (status === 'no_schedule') return { label: 'Chưa có lịch', tone: 'neutral' };
  if (status === 'not_due') return { label: 'Chưa đến kỳ', tone: 'neutral' };
  return { label: 'Chưa đến kỳ', tone: 'neutral' };
};

/* ── MonthSelect — picker T/YYYY không phụ thuộc locale ── */
function MonthSelect({ value, onChange, allowAll = true }: { value: string; onChange: (v: string) => void; allowAll?: boolean }) {
  const options = React.useMemo(() => {
    const now = new Date();
    const list = allowAll ? [{ value: '', label: 'Tháng' }] : [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const v = `${String(m).padStart(2,'0')}/${y}`;
      list.push({ value: v, label: `T${m}/${y}` });
    }
    return list;
  }, [allowAll]);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={FILTER_SELECT}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function paymentClassId(p: Payment, students: Student[]): string {
  const raw = p as any;
  return String(raw.maLop || raw.MaLop || raw['Mã Lớp'] || raw.classId || students.find(s => s.id === p.studentId)?.classId || '');
}

function paymentCollector(p: Payment, students: Student[], classes: any[]): string {
  const raw = p as any;
  const direct = String(raw.collector || raw.nguoiThu || raw.NguoiThu || raw['Người thu'] || '').trim();
  if (direct) return resolveTeacher(direct) || direct;

  const classId = paymentClassId(p, students).trim();
  const student = students.find(s => s.id === p.studentId);
  const cls = classes.find(c => classIdOf(c) === classId);
  const teacher = String(student?.teacher || cls?.GiaoVien || cls?.['Giáo viên'] || cls?.teacherName || '').trim();
  return teacher ? (resolveTeacher(teacher) || teacher) : '—';
}

export default function FinanceTab({
  financeSubtab,
  setFinanceSubtab,
  payments, expenses, students, uClasses, tlogs,
  curMo, curYr, qF, setQF, fMo, setFMo, fTch, setFTch, fFC, setFFC, fSt, setFSt,
  pgF, setPgF, baseTuition,
  onViewInvoice, onViewFinance, onShowFAB, onEditPayment, onDeletePayment, onEditExpense, onDeleteExpense, onViewExpense,
}: Props) {
  const finSub: FinanceSub = financeSubtab === 'debt' || financeSubtab === 'expense' || financeSubtab === 'ledger'
    ? financeSubtab
    : 'debt';

  const makeZaloMsg = (s: Student, debtAmount = baseTuition) => {
    const amount = debtAmount > 0 ? debtAmount : baseTuition;
    return `Chào phụ huynh em ${s.name || ''}, LỚP TOÁN NK thông báo học phí theo chu kỳ học hiện tại của em đang cần thu, số tiền ${fmtVND(amount)}. Phụ huynh vui lòng kiểm tra và thanh toán giúp lớp. Em cảm ơn ạ.`;
  };
  const debtStatusFilter: 'all' | 'review' | 'collected' | 'due' | 'overdue' =
    fSt === 'review' || fSt === 'collected' || fSt === 'due' || fSt === 'overdue' ? fSt : 'all';
  const debtListRef = useRef<HTMLDivElement>(null);
  const ledgerListRef = useRef<HTMLDivElement>(null);
  const expenseListRef = useRef<HTMLDivElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  // Phân trang sổ cái
  const [pgLedger, setPgLedger] = useState(1);
  const [lFilterMo, setLFilterMo] = useState('');
  const [lFilterCls, setLFilterCls] = useState('');
  const [ledgerQuery, setLedgerQuery] = useState('');
  const isMobileViewport = useIsMobileViewport();
  // FIX Bug 3: reset về trang 1 khi có phiếu mới (optimistic update thêm vào đầu)
  useEffect(() => { setPgLedger(1); }, [payments.length, lFilterMo, lFilterCls, ledgerQuery]);
  const filteredLedger = useMemo(() => {
    const [lFM, lFY] = (lFilterMo || '').split('/').map(Number);
    const q = isMobileViewport ? '' : ledgerQuery.trim().toLowerCase();
    return payments
      .map((payment, index) => ({ payment, index, ts: parseDMY(payment.date || '') || 0 }))
      .filter(({ payment: p }) => {
      if (lFilterMo) {
        const period = getPaymentReceiptPeriod(p);
        if (!period || period.m !== lFM || period.y !== lFY) return false;
      }
      if (lFilterCls) {
        if (paymentClassId(p, students) !== lFilterCls) return false;
      }
      if (q) {
        const haystack = `${p.docNum || ''} ${p.studentId || ''} ${p.studentName || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
      })
      .sort((a, b) => b.ts - a.ts || b.index - a.index)
      .map(row => row.payment);
  }, [payments, lFilterMo, lFilterCls, ledgerQuery, students, isMobileViewport]);

  const pagedLedger = useMemo(() => {
    return filteredLedger.slice((pgLedger - 1) * LEDGER_IPP, pgLedger * LEDGER_IPP);
  }, [filteredLedger, pgLedger]);

  // Phân trang chi tiêu
  const [pgExpense, setPgExpense] = useState(1);
  const [eFilterMo, setEFilterMo] = useState('');
  const [eFilterSpender, setEFilterSpender] = useState('');
  // FIX Bug 3: reset về trang 1 khi có phiếu chi mới
  useEffect(() => { setPgExpense(1); }, [expenses.length, eFilterMo, eFilterSpender]);
  const filteredExpenses = useMemo(() => {
    const [eFM, eFY] = (eFilterMo || '').split('/').map(Number);
    return expenses.slice().reverse().filter(e => {
      if (eFilterMo) {
        const r = parsePeriod(e.date || '');
        if (!r || r.m !== eFM || r.y !== eFY) return false;
      }
      if (eFilterSpender && e.spender !== eFilterSpender) return false;
      return true;
    });
  }, [expenses, eFilterMo, eFilterSpender]);
  const pagedExpense = useMemo(() => {
    return filteredExpenses.slice((pgExpense - 1) * EXPENSE_IPP, pgExpense * EXPENSE_IPP);
  }, [filteredExpenses, pgExpense]);

  // Copy message to clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyMsg = useCallback((id: string, msg: string) => {
    navigator.clipboard?.writeText(msg).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // Fallback khi clipboard API không có (HTTP / WebView)
      const ta = document.createElement('textarea');
      ta.value = msg; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const currentMonthKey = `${String(curMo).padStart(2,'0')}/${curYr}`;
  useEffect(() => {
    if (fTch) setFTch('');
  }, [fTch, setFTch]);
  useEffect(() => {
    if (!fMo) setFMo(currentMonthKey);
  }, [fMo, setFMo, currentMonthKey]);
  useEffect(() => { setPgF(1); }, [qF, fFC, debtStatusFilter, setPgF]);
  const debtPeriodValue = fMo || currentMonthKey;
  const selectedDebtMonth = useMemo(() => {
    const [m, y] = debtPeriodValue.split('/').map(Number);
    return { m: m || curMo, y: y || curYr };
  }, [debtPeriodValue, curMo, curYr]);
  const isCurrentDebtPeriod = selectedDebtMonth.m === curMo && selectedDebtMonth.y === curYr;
  const debtAsOfTs = useMemo(() => {
    const endOfSelectedMonth = new Date(selectedDebtMonth.y, selectedDebtMonth.m, 0, 23, 59, 59, 999).getTime();
    return Math.min(endOfSelectedMonth, Date.now());
  }, [selectedDebtMonth]);
  const buildDebtRow = useCallback((s: Student): DebtTableRow => {
    const cycleState = getTuitionAccountState({
      student: s,
      classes: uClasses,
      payments,
      tlogs,
      baseTuition,
      asOfTs: debtAsOfTs,
    });
    const status = cycleState.status;
    const debtAmount = cycleState.totalOutstandingAmount;
    const periodPayments = payments.filter(payment => {
      if (payment.studentId !== s.id || Number(payment.amount) <= 0) return false;
      const period = getPaymentReceiptPeriod(payment);
      return period?.m === selectedDebtMonth.m && period?.y === selectedDebtMonth.y;
    });
    const periodPayment = periodPayments
      .slice()
      .sort((a, b) => parseDMY(b.date || '') - parseDMY(a.date || ''))[0];
    const periodPaidAmount = periodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const isInactive = status === 'inactive';
    const isProblem = status === 'overdue';
    const isWarning = status === 'due' || status === 'needs_review';
    return {
      id: s.id,
      student: s,
      account: cycleState,
      target: cycleState.target,
      done: cycleState.currentCycle.done,
      currentCycleIndex: cycleState.currentCycle.cycleIndex,
      unpaidCycleCount: cycleState.unpaidCollectibleCycles.length,
      dueCycleCount: cycleState.dueCycles.length,
      overdueCycleCount: cycleState.overdueCycles.length,
      dueAmount: cycleState.dueCycles.reduce((sum, cycle) => sum + cycle.outstandingAmount, 0),
      overdueAmount: cycleState.overdueCycles.reduce((sum, cycle) => sum + cycle.outstandingAmount, 0),
      hasReview: cycleState.reviewReasons.length > 0 || status === 'needs_review',
      debtAmount,
      paidAmount: periodPaidAmount,
      periodPayment,
      lastPayment: cycleState.lastPayment,
      adjustedPayment: !!cycleState.lastPayment && baseTuition > 0 && Number(cycleState.lastPayment.amount || 0) !== baseTuition,
      isInactive,
      isProblem,
      isWarning,
      status,
    };
  }, [baseTuition, debtAsOfTs, payments, selectedDebtMonth, tlogs, uClasses]);
  const financeStudents = useMemo(() => {
    return students.filter(s => {
      if (fFC && s.classId !== fFC) return false;
      return true;
    });
  }, [fFC, students]);

  const financeCycleRows = useMemo(() => financeStudents.map(buildDebtRow), [buildDebtRow, financeStudents]);

  const debtTableRows = useMemo(() => financeCycleRows
    .filter(row => {
      if (debtStatusFilter === 'review' && !row.hasReview) return false;
      if (debtStatusFilter === 'due' && row.dueCycleCount === 0) return false;
      if (debtStatusFilter === 'overdue' && row.overdueCycleCount === 0) return false;
      if (debtStatusFilter === 'collected') {
        if (!row.periodPayment) return false;
      }
      const q = isMobileViewport ? '' : qF.trim().toLowerCase();
      if (!q) return true;
      const s = row.student;
      return `${s.id || ''} ${s.name || ''} ${s.parentName || ''} ${s.parentPhone || ''}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const rank = (row: DebtTableRow) => row.status === 'overdue' ? 0 : row.status === 'due' ? 1 : row.status === 'needs_review' ? 2 : row.status === 'paid' ? 3 : 4;
      return rank(a) - rank(b) || a.student.name.localeCompare(b.student.name, 'vi');
    }),
  [debtStatusFilter, financeCycleRows, qF, isMobileViewport, selectedDebtMonth]);

  const pagedDebtRows = useMemo(() => debtTableRows.slice((pgF - 1) * IPP, pgF * IPP), [debtTableRows, pgF]);
  const classOptions = useMemo(() => [
    { value: '', label: 'Lớp' },
    ...uClasses
      .map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] }))
      .filter(o => o.value)
      .sort((a, b) => compareClassCode(a.value, b.value)),
  ], [uClasses]);
  const expenseSpenderOptions = useMemo(() => [
    { value: '', label: 'Người chi' },
    ...[...new Set(expenses.map(e => e.spender).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(v => ({ value: v, label: v })),
  ], [expenses]);
  const getDebtPeriodPayment = useCallback((row: DebtTableRow) => row.periodPayment || row.lastPayment, []);
  const getDebtPeriodAmount = useCallback((row: DebtTableRow) => {
    if (row.status === 'paid') return row.paidAmount;
    if (row.status === 'due' || row.status === 'overdue') return row.debtAmount || baseTuition;
    return 0;
  }, [baseTuition]);
  const getDebtDisplayAmount = useCallback(
    (row: DebtTableRow) => debtStatusFilter === 'collected'
      ? row.paidAmount
      : debtStatusFilter === 'due'
        ? row.dueAmount
        : debtStatusFilter === 'overdue'
          ? row.overdueAmount
          : getDebtPeriodAmount(row),
    [debtStatusFilter, getDebtPeriodAmount],
  );
  const getDebtPeriodStatus = useCallback((row: DebtTableRow): DebtStatus => (
    debtStatusFilter === 'due' && row.dueCycleCount > 0
      ? 'due'
      : debtStatusFilter === 'overdue' && row.overdueCycleCount > 0
        ? 'overdue'
        : debtStatusFilter === 'review' && row.hasReview
          ? 'needs_review'
          : row.status
  ), [debtStatusFilter]);
  const makePaymentDraft = useCallback((row: DebtTableRow) => {
    const s = row.student;
    const amount = baseTuition;
    return {
      maHS: s.id,
      maLop: s.classId || '',
      soTien: amount,
      thangHP: curMo,
      namHP: curYr,
    };
  }, [baseTuition, curMo, curYr]);

  const selectedMonthPayments = useMemo(() => {
    return payments.slice().reverse().filter(p => {
      const period = getPaymentReceiptPeriod(p);
      if (period?.m !== selectedDebtMonth.m || period?.y !== selectedDebtMonth.y) return false;
      if (fFC && paymentClassId(p, students) !== fFC) return false;
      return true;
    });
  }, [fFC, payments, selectedDebtMonth, students]);

  const collectedAmount = selectedMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const financeSummary = useMemo(
    () => summarizeTuitionAccounts(financeCycleRows.map(row => row.account)),
    [financeCycleRows],
  );

  const debtColumns = useMemo(() => [
    {
      key: 'studentId',
      label: 'Mã HS',
      width: '7%',
      render: (_: unknown, row: DebtTableRow) => {
        const s = row.student;
        return (
          <span style={{ display: 'block', opacity: row.isInactive ? 0.62 : 1, fontSize: 12, fontWeight: 900, color: s.id ? '#4f46e5' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.id || '—'}
          </span>
        );
      },
    },
    {
      key: 'studentName',
      label: 'Tên học sinh',
      width: '21%',
      render: (_: unknown, row: DebtTableRow) => (
        <span style={{ display: 'block', opacity: row.isInactive ? 0.62 : 1, margin: 0, fontSize: 14, fontWeight: 900, color: row.isProblem ? '#be123c' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {capitalizeName(row.student.name)}
        </span>
      ),
    },
    {
      key: 'class',
      label: 'Lớp',
      align: 'center' as const,
      width: '6%',
      render: (_: unknown, row: DebtTableRow) => row.student.classId ? <Badge color="indigo">{row.student.classId}</Badge> : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>,
    },
    {
      key: 'sessions',
      label: 'Số buổi',
      align: 'center' as const,
      width: '6%',
      render: (_: unknown, row: DebtTableRow) => {
        if (!row.target) return <span style={{ color: '#94a3b8', fontWeight: 900 }}>—</span>;
        return (
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#334155', fontWeight: 950, fontSize: 12, lineHeight: 1.1 }}>
            CK{row.currentCycleIndex} · {row.done}/{row.target}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Thành tiền',
      align: 'right' as const,
      width: '12%',
      render: (_: unknown, row: DebtTableRow) => {
        const periodStatus = getDebtPeriodStatus(row);
        return <MoneyText value={getDebtDisplayAmount(row)} compact tone={debtStatusFilter === 'collected' || periodStatus === 'paid' ? 'success' : periodStatus === 'overdue' ? 'danger' : undefined} />;
      },
    },
    {
      key: 'due',
      label: 'Chu kỳ cần thu',
      align: 'center' as const,
      width: '10%',
      render: (_: unknown, row: DebtTableRow) => (
        <span style={{ color: row.unpaidCycleCount > 1 ? '#be123c' : '#475569', fontSize: 12, fontWeight: 900 }}>
          {row.unpaidCycleCount > 0 ? `${row.unpaidCycleCount} kỳ` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center' as const,
      width: '11%',
      render: (_: unknown, row: DebtTableRow) => {
        const periodStatus = getDebtPeriodStatus(row);
        const meta = debtStatusMeta(periodStatus);
        return <StatusBadge domain="tuition" status={periodStatus} label={meta.label} tone={meta.tone} />;
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '13%',
      render: (_: unknown, row: DebtTableRow) => {
        const s = row.student;
        const ph = String(s.parentPhone || '').replace(/\D/g, '');
        const sh = String(s.studentPhone || '').replace(/\D/g, '');
        const zaloPhone = sh.length >= 9 ? sh : ph;
        const receipt = getDebtPeriodPayment(row);
        const amount = getDebtPeriodAmount(row) || row.debtAmount || baseTuition;
        const periodStatus = getDebtPeriodStatus(row);
        return (
          <div className="ltn-mobile-action-row" onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {(debtStatusFilter === 'collected' || periodStatus === 'paid') && receipt ? (
              <Button intent="primary" variant="outline" size="sm" onClick={() => onViewInvoice(receipt)}>Biên lai</Button>
            ) : isCurrentDebtPeriod && (periodStatus === 'due' || periodStatus === 'overdue') ? (
              <>
                <button
                  type="button"
                  aria-label="Thu phí"
                  title="Thu phí"
                  onClick={() => onShowFAB('income', makePaymentDraft(row))}
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <ReceiptText size={15} />
                </button>
                {zaloPhone.length >= 9 && (
                  <a
                    className="ltn-zalo-action"
                    href={`https://zalo.me/${zaloPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => copyMsg(s.id, makeZaloMsg(s, amount))}
                    aria-label={copiedId === s.id ? 'Đã copy tin nhắn' : 'Copy tin nhắn và mở Zalo'}
                    title={copiedId === s.id ? 'Đã copy tin nhắn' : 'Copy tin nhắn và mở Zalo'}
                    style={{ width: 34, height: 34, padding: 0, borderRadius: 10, border: `1px solid ${copiedId === s.id ? '#a7f3d0' : '#bfdbfe'}`, background: copiedId === s.id ? '#ecfdf5' : '#eef6ff', color: copiedId === s.id ? '#059669' : '#0068ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    {copiedId === s.id ? <Check size={14} /> : <MessageCircle size={14} />}
                  </a>
                )}
              </>
            ) : (
              <span title="Không có thao tác khả dụng" aria-label={`Không có thao tác khả dụng cho ${s.name}`} style={{ color: '#cbd5e1', fontWeight: 900 }}>—</span>
            )}
          </div>
        );
      },
    },
  ], [baseTuition, copiedId, copyMsg, debtStatusFilter, getDebtDisplayAmount, getDebtPeriodAmount, getDebtPeriodPayment, getDebtPeriodStatus, isCurrentDebtPeriod, makePaymentDraft, makeZaloMsg, onShowFAB, onViewInvoice]);

  const ledgerColumns = useMemo(() => [
    {
      key: 'date',
      label: 'Ngày',
      width: '11%',
      render: (_: unknown, p: Payment) => <DateText value={p.date} />,
    },
    {
      key: 'student',
      label: 'Học sinh',
      width: '20%',
      render: (_: unknown, p: Payment) => {
        const st = students.find(s => s.id === p.studentId);
        return (
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: st ? '#4f46e5' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {capitalizeName(p.studentName) || '—'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'classId',
      label: 'Lớp',
      align: 'center' as const,
      width: '9%',
      render: (_: unknown, p: Payment) => (
        <StatusBadge domain="general" status="class" label={paymentClassId(p, students) || '—'} tone="violet" dot={false} />
      ),
    },
    {
      key: 'period',
      label: 'Kỳ phí',
      align: 'center' as const,
      width: '11%',
      render: (_: unknown, p: Payment) => {
        const period = getPaymentReceiptPeriod(p);
        return period ? <MonthText month={period.m} year={period.y} /> : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
      },
    },
    {
      key: 'amount',
      label: 'Số tiền',
      align: 'right' as const,
      width: '12%',
      render: (_: unknown, p: Payment) => <MoneyText value={p.amount} tone="success" />,
    },
    {
      key: 'method',
      label: 'Hình thức',
      align: 'center' as const,
      width: '12%',
      render: (_: unknown, p: Payment) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 24, padding: '3px 8px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
          {normalizePaymentMethod(p.method) || '—'}
        </span>
      ),
    },
    {
      key: 'collector',
      label: 'Người thu',
      width: '12%',
      render: (_: unknown, p: Payment) => {
        const collector = paymentCollector(p, students, uClasses);
        return (
          <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: collector !== '—' ? '#0f172a' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {collector}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '13%',
      render: (_: unknown, p: Payment) => (
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'nowrap' }}>
          <Button intent="primary" variant="outline" size="sm" onClick={() => onEditPayment(p)}>Sửa</Button>
          <Button intent="danger" variant="outline" size="sm" onClick={() => onDeletePayment(p)}>Xóa</Button>
        </div>
      ),
    },
  ], [onDeletePayment, onEditPayment, students, uClasses]);

  const expenseColumns = useMemo(() => [
    {
      key: 'date',
      label: 'Ngày',
      width: '12%',
      render: (_: unknown, e: Expense) => <DateText value={e.date} />,
    },
    {
      key: 'description',
      label: 'Khoản chi',
      width: '28%',
      render: (_: unknown, e: Expense) => (
        <span style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
          {e.description || '—'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Hạng mục',
      width: '16%',
      render: (_: unknown, e: Expense) => (
        e.category
          ? <StatusBadge domain="general" status="category" label={e.category} tone="warning" />
          : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>
      ),
    },
    {
      key: 'amount',
      label: 'Số tiền',
      align: 'right' as const,
      width: '14%',
      render: (_: unknown, e: Expense) => <MoneyText value={e.amount} tone="danger" />,
    },
    {
      key: 'spender',
      label: 'Người chi',
      width: '16%',
      render: (_: unknown, e: Expense) => (
        <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: e.spender ? '#0f172a' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.spender || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center' as const,
      width: '14%',
      render: (_: unknown, e: Expense) => (
        <div onClick={event => event.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'nowrap' }}>
          <Button intent="primary" variant="outline" size="sm" onClick={() => onEditExpense(e)}>Sửa</Button>
          <Button intent="danger" variant="outline" size="sm" onClick={() => onDeleteExpense(e)}>Xóa</Button>
        </div>
      ),
    },
  ], [onDeleteExpense, onEditExpense]);

  const financeTabs = (
    <ToolbarTabs
      tabs={[
        { id: 'debt' as FinanceSub, label: 'Công nợ' },
        { id: 'ledger' as FinanceSub, label: 'Phiếu thu' },
        { id: 'expense' as FinanceSub, label: 'Phiếu chi' },
      ]}
      active={finSub}
      onChange={id => {
        if (id === 'debt' && !fSt) setFSt('all');
        setFinanceSubtab?.(id);
      }}
    />
  );

  const financeFilterRow = (
    <>
      {finSub === 'debt' && (
        <>
          <MonthSelect value={debtPeriodValue} allowAll={false} onChange={v => { setFMo(v); setFSt('all'); setPgF(1); }} />
          <div className="finance-desktop-only">
            <Select value={fFC} onChange={v => { setFFC(v); setPgF(1); }} options={classOptions} size="md" style={{ width: 108, minWidth: 96 }} />
          </div>
          <div className="finance-desktop-only">
            <SearchBar value={qF} onChange={v => { setQF(v); setPgF(1); }} placeholder="Tìm HS" width={116} size="md" />
          </div>
          <div className="finance-mobile-only">
            <Select
              value={fFC}
              onChange={v => { setFFC(v); setPgF(1); }}
              options={classOptions}
              size="md"
            />
          </div>
        </>
      )}
      {finSub === 'ledger' && (
        <>
          <MonthSelect value={lFilterMo} onChange={v => { setLFilterMo(v); setPgLedger(1); }} />
          <div className="finance-desktop-only">
            <Select value={lFilterCls} onChange={v => { setLFilterCls(v); setPgLedger(1); }} options={classOptions} size="md" style={{ width: 108, minWidth: 96 }} />
          </div>
          <div className="finance-desktop-only">
            <SearchBar value={ledgerQuery} onChange={v => { setLedgerQuery(v); setPgLedger(1); }} placeholder="Tìm HS / số phiếu" width={108} size="sm" />
          </div>
          <div className="finance-mobile-only">
            <Select value={lFilterCls} onChange={v => { setLFilterCls(v); setPgLedger(1); }} options={classOptions} size="md" />
          </div>
        </>
      )}
      {finSub === 'expense' && (
        <>
          <MonthSelect value={eFilterMo} onChange={v => { setEFilterMo(v); setPgExpense(1); }} />
          <Select value={eFilterSpender} onChange={v => { setEFilterSpender(v); setPgExpense(1); }} options={expenseSpenderOptions} size="md" style={{ width: 128, minWidth: 112 }} />
        </>
      )}
    </>
  );

  const focusDebtStatus = (status: 'review' | 'collected' | 'due' | 'overdue') => {
    setFinanceSubtab?.('debt');
    setFSt(debtStatusFilter === status ? 'all' : status);
    setPgF(1);
    scrollTo(debtListRef);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        .finance-toolbar-title{display:flex;align-items:center;gap:12px}
        .finance-mobile-add{display:none}
        .finance-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .finance-toolbar-filters select{min-width:96px}
        .finance-mobile-only{display:none}
        @media(max-width:767px){
          .finance-toolbar-title{width:calc(100vw - 84px);justify-content:space-between}
          .finance-mobile-add{display:none!important}
          .finance-toolbar-filters{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
          .finance-toolbar-filters > *{width:100%!important;min-width:0!important}
          .finance-toolbar-filters select{width:100%!important;min-width:0!important}
          .finance-desktop-only{display:none!important}
          .finance-mobile-only{display:block!important}
        }
      `}</style>
      <PageToolbar
        title={(
          <div className="finance-toolbar-title">
            <h2 className="ltn-page-toolbar-title" style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{finSub === 'debt' ? 'HỌC PHÍ' : finSub === 'ledger' ? 'Phiếu thu' : 'Phiếu chi'}</h2>
            <span className="finance-mobile-add">
              <Button intent={finSub === 'expense' ? 'danger' : 'success'} size="sm" icon={<Plus size={13} />} onClick={() => onShowFAB(finSub === 'expense' ? 'expense' : 'income')} style={{ minWidth: 82 }}>
                Thêm
              </Button>
            </span>
          </div>
        )}
        hideActionsOnMobile
        actions={(
          <Button intent={finSub === 'expense' ? 'danger' : 'success'} size="sm" icon={<Plus size={13} />} onClick={() => onShowFAB(finSub === 'expense' ? 'expense' : 'income')}>
            {finSub === 'expense' ? 'Thêm phiếu chi' : 'Thêm phiếu thu'}
          </Button>
        )}
      >
        {financeTabs}
        <div className="finance-toolbar-filters">
          {financeFilterRow}
        </div>
      </PageToolbar>

      {finSub === 'debt' && (
        <ActionableKpiGrid>
          <ActionableKpi
            icon={AlertTriangle}
            value={financeSummary.reviewStudentCount}
            label="Cần đối soát"
            sub={`${financeSummary.reviewStudentCount} học sinh cần kiểm tra`}
            tone={financeSummary.reviewStudentCount > 0 ? 'warning' : 'success'}
            onClick={() => focusDebtStatus('review')}
            actionLabel="Rà soát"
          />
          <ActionableKpi
            icon={TrendingUp}
            value={<MoneyText value={collectedAmount} compact tone="success" />}
            label="Đã thu trong tháng"
            sub={`${selectedMonthPayments.length} phiếu theo ngày thu`}
            tone="success"
            onClick={() => focusDebtStatus('collected')}
            actionLabel="Lọc đã thu"
          />
          <ActionableKpi
            icon={Wallet}
            value={<MoneyText value={financeSummary.totalOutstandingAmount} compact tone={financeSummary.totalOutstandingAmount > 0 ? 'danger' : 'success'} />}
            label="Tổng cần thu"
            sub={`${financeSummary.collectibleStudentCount} học sinh · ${financeSummary.collectibleCycleCount} chu kỳ`}
            tone={financeSummary.totalOutstandingAmount > 0 ? 'danger' : 'success'}
          />
          <ActionableKpi
            icon={Wallet}
            value={<MoneyText value={financeSummary.dueAmount} compact tone={financeSummary.dueAmount > 0 ? 'warning' : 'success'} />}
            label="Đến hạn"
            sub={`${financeSummary.dueStudentCount} học sinh · ${financeSummary.dueCycleCount} chu kỳ`}
            tone={financeSummary.dueAmount > 0 ? 'warning' : 'success'}
            onClick={() => focusDebtStatus('due')}
            actionLabel="Lọc đến hạn"
          />
          <ActionableKpi
            icon={TrendingDown}
            value={<MoneyText value={financeSummary.overdueAmount} compact tone={financeSummary.overdueAmount > 0 ? 'danger' : 'success'} />}
            label="Quá hạn"
            sub={`${financeSummary.overdueStudentCount} học sinh · ${financeSummary.overdueCycleCount} chu kỳ`}
            tone={financeSummary.overdueAmount > 0 ? 'danger' : 'success'}
            onClick={() => focusDebtStatus('overdue')}
            actionLabel="Lọc quá hạn"
          />
        </ActionableKpiGrid>
      )}

      {/* ══ CÔNG NỢ ══ */}
      {finSub === 'debt' && (
        <div ref={debtListRef} style={{ display: 'grid', gap: 14 }}>
          <style>{`
            .fin-debt-desktop{display:block}.fin-debt-mobile{display:none}
            @media(max-width:767px){.fin-debt-desktop{display:none!important}.fin-debt-mobile{display:block!important}}
          `}</style>
          <section>
          <div className="fin-debt-desktop">
            <DataTable
              columns={debtColumns}
              data={pagedDebtRows}
              rowKey="id"
              emptyText="Không có học sinh phù hợp"
              emptySub="Thử đổi lớp hoặc trạng thái chu kỳ."
              onRowClick={row => onViewFinance(row.student)}
              scrollX={false}
              density="compact"
              footer={<Pager page={pgF} total={debtTableRows.length} perPage={IPP} setPage={setPgF} showTotal />}
            />
          </div>

          <div className="fin-debt-mobile" style={{ padding: 6 }}>
            {pagedDebtRows.length === 0 ? (
              <EmptyState text="Không có học sinh phù hợp" sub="Thử đổi bộ lọc công nợ." compact />
            ) : <MobileRecordList>{pagedDebtRows.map(row => {
              const s = row.student;
              const ph = String(s.parentPhone || '').replace(/\D/g, '');
              const sh = String(s.studentPhone || '').replace(/\D/g, '');
              const zaloPhone = ph || sh;
              const periodStatus = getDebtPeriodStatus(row);
              const meta = debtStatusMeta(periodStatus);
              const receipt = getDebtPeriodPayment(row);
              const amount = getDebtDisplayAmount(row);
              const actionAmount = amount || row.debtAmount || baseTuition;
              const sessionLabel = row.target ? `CK${row.currentCycleIndex} · ${row.done}/${row.target} buổi${row.unpaidCycleCount > 1 ? ` · ${row.unpaidCycleCount} kỳ cần thu` : ''}` : 'Chưa có lịch';
              const classId = s.classId || 'HS';
              return (
                <MobileRecordRow
                  key={`${s.id}-debt-card`}
                  marker={<MobileRecordMarker tone={meta.tone}>{classId}</MobileRecordMarker>}
                  title={capitalizeName(s.name)}
                  right={<MoneyText value={amount} compact tone={periodStatus === 'paid' ? 'success' : periodStatus === 'overdue' ? 'danger' : undefined} />}
                  meta={`Cuối T${selectedDebtMonth.m}/${selectedDebtMonth.y} · ${sessionLabel}`}
                  note={<StatusBadge domain="tuition" status={periodStatus} label={meta.label} tone={meta.tone} />}
                  tone={meta.tone}
                  muted={row.isInactive}
                  onClick={() => onViewFinance(s)}
                  actions={(
                    <>
                      {(debtStatusFilter === 'collected' || periodStatus === 'paid') && receipt ? (
                        <MobileRecordTextAction title="Biên lai" tone="primary" onClick={() => onViewInvoice(receipt)}>
                          Biên lai
                        </MobileRecordTextAction>
                      ) : isCurrentDebtPeriod && (periodStatus === 'due' || periodStatus === 'overdue') ? (
                        <>
                          <MobileRecordAction title="Thu phí" tone="success" onClick={() => onShowFAB('income', makePaymentDraft(row))}>
                            <ReceiptText size={15} />
                          </MobileRecordAction>
                          {zaloPhone.length >= 9 && (
                            <MobileRecordAction
                              title={copiedId === s.id ? 'Đã copy tin nhắn' : 'Nhắc phí Zalo'}
                              tone={copiedId === s.id ? 'success' : 'zalo'}
                              onClick={() => {
                                copyMsg(s.id, makeZaloMsg(s, actionAmount));
                                window.open(`https://zalo.me/${zaloPhone}`, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              {copiedId === s.id ? <Check size={15} /> : <ZaloMark size={18} />}
                            </MobileRecordAction>
                          )}
                        </>
                      ) : null}
                    </>
                  )}
                />
              );
            })}</MobileRecordList>}
            <Pager page={pgF} total={debtTableRows.length} perPage={IPP} setPage={setPgF} showTotal />
          </div>
          </section>
        </div>
      )}

      {/* ══ SỔ CÁI — NO stat blocks ══ */}
      {finSub === 'ledger' && (
        <div ref={ledgerListRef}>
          <style>{`
            .fin-ledger-desktop{display:block}.fin-ledger-mobile{display:none}
            .fin-expense-desktop{display:block}.fin-expense-mobile{display:none}
            .finance-transaction-section{display:grid;gap:0;margin-bottom:16px}
            @media(max-width:767px){.fin-ledger-desktop,.fin-expense-desktop{display:none!important}.fin-ledger-mobile,.fin-expense-mobile{display:grid!important}}
          `}</style>
          <section className="finance-transaction-section">
            <div className="fin-ledger-desktop">
              <DataTable
                columns={ledgerColumns}
                data={pagedLedger}
                rowKey={(p) => p.id || p.docNum || `${p.studentId}-${p.date}-${p.amount}`}
                emptyText="Chưa có phiếu thu phù hợp"
                emptySub="Thử đổi tháng hoặc lớp."
                onRowClick={onViewInvoice}
                scrollX={false}
                density="compact"
                footer={<Pager page={pgLedger} total={filteredLedger.length} perPage={LEDGER_IPP} setPage={setPgLedger} showTotal />}
              />
            </div>
            <div className="fin-ledger-mobile" style={{ gap: 6, padding: 6 }}>
            {pagedLedger.length === 0 ? (
                <EmptyState text="Chưa có phiếu thu phù hợp" sub="Thử đổi tháng hoặc lớp." compact />
              ) : <MobileRecordList>{pagedLedger.map(p => {
                const period = getPaymentReceiptPeriod(p);
                const cls = paymentClassId(p, students);
                return (
                  <MobileRecordRow
                    key={p.id || p.docNum || `${p.studentId}-${p.date}-${p.amount}`}
                    marker={<MobileRecordMarker tone="success"><ReceiptText size={15} /></MobileRecordMarker>}
                    title={capitalizeName(p.studentName) || p.docNum || 'Phiếu thu'}
                    right={<MoneyText value={p.amount} compact tone="success" />}
                    meta={(
                      <>
                        <DateText value={p.date} /> · {period ? <MonthText month={period.m} year={period.y} /> : 'Chưa rõ kỳ'}{cls ? ` · ${cls}` : ''}
                      </>
                    )}
                    note={paymentCollector(p, students, uClasses) || 'Chưa rõ người thu'}
                    tone="success"
                    onClick={() => onViewInvoice(p)}
                    actions={(
                      <>
                        <MobileRecordAction title="Sửa phiếu thu" tone="primary" onClick={() => onEditPayment(p)}><Edit3 size={15} /></MobileRecordAction>
                        <MobileRecordAction title="Xóa phiếu thu" tone="danger" onClick={() => onDeletePayment(p)}><Trash2 size={15} /></MobileRecordAction>
                      </>
                    )}
                  />
                );
              })}</MobileRecordList>}
              <Pager page={pgLedger} total={filteredLedger.length} perPage={LEDGER_IPP} setPage={setPgLedger} showTotal />
            </div>
          </section>
        </div>
      )}
      {finSub === 'expense' && (
        <div ref={expenseListRef}>
          <style>{`
            .fin-expense-desktop{display:block}.fin-expense-mobile{display:none}
            @media(max-width:767px){.fin-expense-desktop{display:none!important}.fin-expense-mobile{display:grid!important}}
          `}</style>
          <div className="fin-expense-desktop">
            <DataTable
              columns={expenseColumns}
              data={pagedExpense}
              rowKey={(e) => e.id || e.docNum || `${e.date}-${e.description}-${e.amount}`}
              emptyText="Chưa có phiếu chi phù hợp"
              emptySub="Thử đổi tháng hoặc người chi."
              onRowClick={onViewExpense}
              scrollX={false}
              density="compact"
              footer={<Pager page={pgExpense} total={filteredExpenses.length} perPage={EXPENSE_IPP} setPage={setPgExpense} showTotal />}
            />
          </div>
          <div className="fin-expense-mobile" style={{ gap: 6, padding: 6 }}>
            {pagedExpense.length === 0 ? (
              <EmptyState text="Chưa có phiếu chi phù hợp" sub="Thử đổi tháng hoặc người chi." compact />
            ) : <MobileRecordList>{pagedExpense.map(e => (
                <MobileRecordRow
                  key={e.id || e.docNum || `${e.date}-${e.description}-${e.amount}`}
                  marker={<MobileRecordMarker tone="danger"><TrendingDown size={15} /></MobileRecordMarker>}
                  title={e.description || e.docNum || 'Phiếu chi'}
                  right={<MoneyText value={e.amount} compact tone="danger" />}
                  meta={<><DateText value={e.date} /> · {e.category || 'Chưa phân loại'}</>}
                  note={e.spender || 'Chưa rõ người chi'}
                  tone="danger"
                  onClick={() => onViewExpense(e)}
                  actions={(
                    <>
                      <MobileRecordAction title="Sửa phiếu chi" tone="primary" onClick={() => onEditExpense(e)}><Edit3 size={15} /></MobileRecordAction>
                      <MobileRecordAction title="Xóa phiếu chi" tone="danger" onClick={() => onDeleteExpense(e)}><Trash2 size={15} /></MobileRecordAction>
                    </>
                  )}
                />
            ))}</MobileRecordList>}
            <Pager page={pgExpense} total={filteredExpenses.length} perPage={EXPENSE_IPP} setPage={setPgExpense} showTotal />
          </div>
        </div>
      )}

    </div>
  );
}
