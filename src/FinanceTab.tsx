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
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Plus, Copy, Check, TrendingDown, TrendingUp, Wallet, AlertTriangle, MessageCircle } from 'lucide-react';
import { fmtVND, capitalizeName, parseDMY, isStudentActive, normalizePaymentMethod, resolveTeacher, buildSchoolYearMonths } from './helpers';
import { Badge, Button, Pager, Select } from './dsComponents';
import { ActionableKpi, ActionableKpiGrid, DataTable, DateText, EmptyState, MobileCard, MoneyText, MonthText, PageToolbar, StatusBadge, ToolbarTabs } from './uiSystem';
import type { Payment, Expense, Student, FinanceSub } from './types';

interface Props {
  financeSubtab?: FinanceSub;
  setFinanceSubtab?: (sub: FinanceSub) => void;
  payments: Payment[]; expenses: Expense[];
  students: Student[]; uClasses: any[];
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
  onShowFAB: (tab?: 'income' | 'expense') => void;
  onEditPayment: (p: Payment) => void; onDeletePayment: (p: Payment) => void;
  onEditExpense: (e: Expense) => void; onDeleteExpense: (e: Expense) => void;
  onViewExpense: (e: Expense) => void;
}

type DebtStatus = 'paid' | 'unpaid' | 'overdue' | 'inactive';

interface DebtTableRow {
  id: string;
  student: Student;
  billableMonths: { m: number; y: number; label: string }[];
  unpaidMonths: { m: number; y: number; label: string }[];
  paidCount: number;
  paidPct: number;
  debtAmount: number;
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
  if (status === 'inactive') return { label: 'Đã nghỉ', tone: 'neutral' };
  return { label: 'Chưa thu', tone: 'warning' };
};

/**
 * isMonthBillable — tháng `fm` có phải tháng học sinh phải đóng phí không?
 * - Trước startDate → chưa học → không tính nợ
 * - Sau endDate (nếu có) → đã nghỉ → không tính nợ
 */
function isMonthBillable(s: Student, fm: { m: number; y: number }): boolean {
  const monthStart = new Date(fm.y, fm.m - 1, 1).getTime();

  // Kiểm tra startDate
  const startTs = parseDMY(s.startDate || '');
  if (startTs) {
    const d = new Date(startTs);
    const enrollStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (monthStart < enrollStart) return false;
  }

  // Kiểm tra endDate
  const endTs = parseDMY(s.endDate || '');
  if (endTs && s.endDate !== '---' && s.endDate !== '') {
    const d = new Date(endTs);
    const leaveMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    // Tháng nghỉ học trở đi không cần đóng nữa
    if (monthStart >= leaveMonth) return false;
  }

  return true;
}

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

function parseMoYr(raw: string): { m: number; y: number } | null {
  const s = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return { m: parseInt(s.split('/')[1]), y: parseInt(s.split('/')[2]) };
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return { m: parseInt(s.slice(5, 7)), y: parseInt(s.slice(0, 4)) };
  const ts = parseDMY(raw);
  if (!ts) return null;
  const d = new Date(ts);
  return { m: d.getMonth() + 1, y: d.getFullYear() };
}

function getPaymentTuitionPeriod(p: Payment): { m: number; y: number } | null {
  const m = Number(p.thangHP);
  const y = Number(p.namHP);
  if (m >= 1 && m <= 12 && y >= 2000) return { m, y };
  return parseMoYr(p.date || '');
}

function paymentClassId(p: Payment, students: Student[]): string {
  const raw = p as any;
  return String(raw.maLop || raw.MaLop || raw['Mã Lớp'] || raw.classId || students.find(s => s.id === p.studentId)?.classId || '');
}

function classIdOf(c: any): string {
  return String(c?.['Mã Lớp'] || c?.['Mã lớp'] || c?.MaLop || c?.classId || '').trim();
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
  payments, expenses, students, uClasses,
  curMo, curYr, fMo, setFMo, fTch, setFTch, fFC, setFFC,
  pgF, setPgF, isPaid, baseTuition, schoolYear, tuitionDueDay,
  onViewInvoice, onViewFinance, onShowFAB, onEditPayment, onDeletePayment, onEditExpense, onDeleteExpense, onViewExpense,
}: Props) {
  const finSub: FinanceSub = financeSubtab === 'debt' || financeSubtab === 'expense' || financeSubtab === 'ledger'
    ? financeSubtab
    : 'debt';

  // FIX Bug 4: dùng fM (tháng đang filter) thay vì curMo (tháng thực tế)
  // để nội dung Zalo đúng với tháng user đang xem công nợ
  const [fM, fY] = (fMo || `${String(curMo).padStart(2,'0')}/${curYr}`).split('/').map(Number);
  const makeZaloMsg = (s: Student, debtAmount = baseTuition) => {
    const amount = debtAmount > 0 ? debtAmount : baseTuition;
    return `Chào phụ huynh em ${s.name || ''}, LỚP TOÁN NK thông báo học phí tháng ${fM || curMo}/${fY || curYr} của em hiện còn ${fmtVND(amount)}. Phụ huynh vui lòng kiểm tra và thanh toán giúp lớp. Em cảm ơn ạ.`;
  };
  // FIX: dùng isStudentActive từ helpers, nhất quán toàn app
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);
  // Phân trang sổ cái
  const [pgLedger, setPgLedger] = useState(1);
  const [lFilterMo, setLFilterMo] = useState('');
  const [lFilterCls, setLFilterCls] = useState('');
  // FIX Bug 3: reset về trang 1 khi có phiếu mới (optimistic update thêm vào đầu)
  useEffect(() => { setPgLedger(1); }, [payments.length, lFilterMo, lFilterCls]);
  const filteredLedger = useMemo(() => {
    const [lFM, lFY] = (lFilterMo || '').split('/').map(Number);
    return payments.slice().reverse().filter(p => {
      if (lFilterMo) {
        const period = getPaymentTuitionPeriod(p);
        if (!period || period.m !== lFM || period.y !== lFY) return false;
      }
      if (lFilterCls) {
        if (paymentClassId(p, students) !== lFilterCls) return false;
      }
      return true;
    });
  }, [payments, lFilterMo, lFilterCls, students]);

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
        const r = parseMoYr(e.date || '');
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

  const schoolYearMonths = useMemo(() => {
    return buildSchoolYearMonths(schoolYear);
  }, [schoolYear]);

  const currentMonthKey = `${String(curMo).padStart(2,'0')}/${curYr}`;
  const unpaidNow = useMemo(() => activeStudents.filter(s =>
    isMonthBillable(s, { m: curMo, y: curYr }) && !isPaid(s.id, curMo, curYr)
  ).length, [activeStudents, curMo, curYr, isPaid]);
  useEffect(() => {
    if (fTch) setFTch('');
  }, [fTch, setFTch]);
  useEffect(() => {
    if (!fMo) setFMo(currentMonthKey);
  }, [fMo, setFMo, currentMonthKey]);
  const debtPeriodValue = fMo || currentMonthKey;
  const selectedDebtMonth = useMemo(() => {
    const [m, y] = debtPeriodValue.split('/').map(Number);
    return { m: m || curMo, y: y || curYr };
  }, [debtPeriodValue, curMo, curYr]);
  const buildDebtRow = useCallback((s: Student): DebtTableRow => {
    const isInactive = s.status === 'inactive' || (s.endDate && s.endDate !== '---' && s.endDate !== '');
    const billableMonths = schoolYearMonths.filter(fm => {
      if (!isMonthBillable(s, fm)) return false;
      if (fm.y > curYr) return false;
      if (fm.y === curYr && fm.m > curMo) return false;
      return true;
    });
    const unpaidMonths = billableMonths.filter(fm => !isPaid(s.id, fm.m, fm.y));
    const paidCount = billableMonths.length - unpaidMonths.length;
    const paidPct = billableMonths.length > 0 ? Math.round(paidCount / billableMonths.length * 100) : 100;
    const debtAmount = unpaidMonths.length * baseTuition;
    const isProblem = !isInactive && unpaidMonths.length > 2;
    const isWarning = !isInactive && unpaidMonths.length === 2;
    const status: DebtStatus = isInactive ? 'inactive' : unpaidMonths.length === 0 ? 'paid' : isProblem ? 'overdue' : 'unpaid';
    return {
      id: s.id,
      student: s,
      billableMonths,
      unpaidMonths,
      paidCount,
      paidPct,
      debtAmount,
      isInactive,
      isProblem,
      isWarning,
      status,
    };
  }, [baseTuition, curMo, curYr, isPaid, schoolYearMonths]);
  const financeStudents = useMemo(() => {
    return activeStudents.filter(s => {
      if (!isMonthBillable(s, selectedDebtMonth)) return false;
      if (fFC && s.classId !== fFC) return false;
      return true;
    });
  }, [activeStudents, fFC, selectedDebtMonth]);

  const debtTableRows = useMemo(() => financeStudents
    .map(buildDebtRow)
    .sort((a, b) => {
      const rank = (row: DebtTableRow) => row.status === 'overdue' ? 0 : row.status === 'unpaid' ? 1 : row.status === 'paid' ? 2 : 3;
      return rank(a) - rank(b) || a.student.name.localeCompare(b.student.name, 'vi');
    }),
  [buildDebtRow, financeStudents]);

  const pagedDebtRows = useMemo(() => debtTableRows.slice((pgF - 1) * IPP, pgF * IPP), [debtTableRows, pgF]);
  const classOptions = useMemo(() => [
    { value: '', label: 'Lớp' },
    ...uClasses.map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] })),
  ], [uClasses]);
  const expenseSpenderOptions = useMemo(() => [
    { value: '', label: 'Người chi' },
    ...[...new Set(expenses.map(e => e.spender).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(v => ({ value: v, label: v })),
  ], [expenses]);

  const getDebtPeriodAmount = useCallback((row: DebtTableRow) => (
    isMonthBillable(row.student, selectedDebtMonth) ? baseTuition : 0
  ), [baseTuition, selectedDebtMonth]);

  const getDebtPeriodPayment = useCallback((row: DebtTableRow) => payments.find(p => {
    if (p.studentId !== row.student.id) return false;
    const period = getPaymentTuitionPeriod(p);
    return period?.m === selectedDebtMonth.m && period?.y === selectedDebtMonth.y;
  }), [payments, selectedDebtMonth]);
  const normalizedDueDay = Math.min(31, Math.max(1, Number(tuitionDueDay) || 15));
  const debtDueLabel = useCallback(() => {
    const lastDay = new Date(selectedDebtMonth.y, selectedDebtMonth.m, 0).getDate();
    const dueDay = Math.min(normalizedDueDay, lastDay);
    return `${String(dueDay).padStart(2, '0')}/${String(selectedDebtMonth.m).padStart(2, '0')}/${selectedDebtMonth.y}`;
  }, [normalizedDueDay, selectedDebtMonth]);
  const isSelectedPeriodPastDue = useCallback(() => {
    const now = new Date();
    const lastDay = new Date(selectedDebtMonth.y, selectedDebtMonth.m, 0).getDate();
    const dueDay = Math.min(normalizedDueDay, lastDay);
    const due = new Date(selectedDebtMonth.y, selectedDebtMonth.m - 1, dueDay, 23, 59, 59, 999);
    return now.getTime() > due.getTime();
  }, [normalizedDueDay, selectedDebtMonth]);
  const getDebtPeriodStatus = useCallback((row: DebtTableRow): DebtStatus => {
    if (row.isInactive) return 'inactive';
    if (isPaid(row.student.id, selectedDebtMonth.m, selectedDebtMonth.y)) return 'paid';
    return isSelectedPeriodPastDue() ? 'overdue' : 'unpaid';
  }, [isPaid, isSelectedPeriodPastDue, selectedDebtMonth]);

  const selectedMonthPayments = useMemo(() => {
    return payments.slice().reverse().filter(p => {
      const period = getPaymentTuitionPeriod(p);
      if (period?.m !== selectedDebtMonth.m || period?.y !== selectedDebtMonth.y) return false;
      if (fFC && paymentClassId(p, students) !== fFC) return false;
      return true;
    });
  }, [fFC, payments, selectedDebtMonth, students]);

  const selectedMonthExpenses = useMemo(() => {
    return expenses.slice().reverse().filter(e => {
      const period = parseMoYr(e.date || '');
      if (period?.m !== selectedDebtMonth.m || period?.y !== selectedDebtMonth.y) return false;
      return true;
    });
  }, [expenses, selectedDebtMonth]);

  const totalDueAmount = financeStudents.length * baseTuition;
  const collectedAmount = selectedMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const remainingAmount = financeStudents.filter(s => !isPaid(s.id, selectedDebtMonth.m, selectedDebtMonth.y)).length * baseTuition;
  const spentAmount = selectedMonthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const recentPayments = selectedMonthPayments.slice(0, 5);
  const recentExpenses = selectedMonthExpenses.slice(0, 5);

  const debtColumns = useMemo(() => [
    {
      key: 'student',
      label: 'Học sinh',
      width: '21%',
      render: (_: unknown, row: DebtTableRow) => {
        const s = row.student;
        return (
          <div style={{ minWidth: 0, opacity: row.isInactive ? 0.62 : 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: row.isProblem ? '#be123c' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {capitalizeName(s.name)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.id || '—'}{s.grade ? ` · Khối ${s.grade}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      key: 'class',
      label: 'Lớp',
      align: 'center' as const,
      width: '12%',
      render: (_: unknown, row: DebtTableRow) => row.student.classId ? <Badge color="indigo">{row.student.classId}</Badge> : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>,
    },
    {
      key: 'sessions',
      label: 'Số buổi',
      align: 'center' as const,
      width: '9%',
      render: () => (
        <span style={{ color: '#94a3b8', fontWeight: 900 }}>—</span>
      ),
    },
    {
      key: 'amount',
      label: 'Thành tiền',
      align: 'right' as const,
      width: '13%',
      render: (_: unknown, row: DebtTableRow) => (
        <MoneyText value={getDebtPeriodAmount(row)} compact tone={row.status === 'paid' ? 'success' : row.status === 'overdue' ? 'danger' : undefined} />
      ),
    },
    {
      key: 'due',
      label: 'Hạn đóng',
      align: 'center' as const,
      width: '11%',
      render: () => (
        <span style={{ color: '#475569', fontWeight: 900, whiteSpace: 'nowrap' }}>{debtDueLabel()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center' as const,
      width: '12%',
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
      width: '18%',
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
            {periodStatus === 'paid' && receipt ? (
              <Button intent="primary" variant="outline" size="sm" onClick={() => onViewInvoice(receipt)}>Biên lai</Button>
            ) : periodStatus === 'unpaid' || periodStatus === 'overdue' ? (
              <>
                <Button intent="success" variant="outline" size="sm" onClick={() => onShowFAB('income')}>Thu phí</Button>
                {zaloPhone.length >= 9 && (
                  <a
                    className="ltn-zalo-action"
                    href={`https://zalo.me/${zaloPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => copyMsg(s.id, makeZaloMsg(s, amount))}
                    title="Copy tin nhắn và mở Zalo"
                    style={{ minHeight: 34, padding: '7px 11px', borderRadius: 999, border: `1px solid ${copiedId === s.id ? '#a7f3d0' : '#bfdbfe'}`, background: copiedId === s.id ? '#ecfdf5' : '#eef6ff', color: copiedId === s.id ? '#059669' : '#0068ff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none' }}
                  >
                    {copiedId === s.id ? <Check size={12} /> : <MessageCircle size={12} />}
                    {copiedId === s.id ? 'Đã copy' : 'Zalo'}
                  </a>
                )}
              </>
            ) : (
              <span style={{ color: '#cbd5e1', fontWeight: 900 }}>—</span>
            )}
          </div>
        );
      },
    },
  ], [baseTuition, copiedId, copyMsg, debtDueLabel, getDebtPeriodAmount, getDebtPeriodPayment, getDebtPeriodStatus, makeZaloMsg, onShowFAB, onViewInvoice]);

  const ledgerColumns = useMemo(() => [
    {
      key: 'date',
      label: 'Ngày',
      width: '12%',
      render: (_: unknown, p: Payment) => <DateText value={p.date} />,
    },
    {
      key: 'student',
      label: 'Học sinh',
      width: '22%',
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
      width: '11%',
      render: (_: unknown, p: Payment) => (
        <StatusBadge domain="general" status="class" label={paymentClassId(p, students) || '—'} tone="violet" dot={false} />
      ),
    },
    {
      key: 'period',
      label: 'Kỳ phí',
      align: 'center' as const,
      width: '13%',
      render: (_: unknown, p: Payment) => {
        const period = getPaymentTuitionPeriod(p);
        return period ? <MonthText month={period.m} year={period.y} /> : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
      },
    },
    {
      key: 'amount',
      label: 'Số tiền',
      align: 'right' as const,
      width: '14%',
      render: (_: unknown, p: Payment) => <MoneyText value={p.amount} tone="success" />,
    },
    {
      key: 'collector',
      label: 'Người thu',
      width: '14%',
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
      width: '14%',
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
      onChange={id => setFinanceSubtab?.(id)}
    />
  );

  const financeFilterRow = (
    <>
      {finSub === 'debt' && (
        <>
          <Select value={fFC} onChange={v => { setFFC(v); setPgF(1); }} options={classOptions} size="md" style={{ width: 104, minWidth: 96 }} />
          <MonthSelect value={debtPeriodValue} allowAll={false} onChange={v => { setFMo(v); setPgF(1); }} />
        </>
      )}
      {finSub === 'ledger' && (
        <>
          <MonthSelect value={lFilterMo} onChange={v => { setLFilterMo(v); setPgLedger(1); }} />
          <Select value={lFilterCls} onChange={v => { setLFilterCls(v); setPgLedger(1); }} options={classOptions} size="md" style={{ width: 104, minWidth: 96 }} />
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        .finance-toolbar-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .finance-toolbar-filters select{min-width:96px}
        @media(max-width:767px){
          .finance-toolbar-filters{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
          .finance-toolbar-filters select{width:100%!important;min-width:0!important}
        }
      `}</style>
      <PageToolbar
        title="Học phí"
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
            icon={Wallet}
            value={<MoneyText value={totalDueAmount} compact />}
            label="Phải thu tháng này"
            sub={`${financeStudents.length} học sinh tính phí`}
            tone="primary"
          />
          <ActionableKpi
            icon={TrendingUp}
            value={<MoneyText value={collectedAmount} compact tone="success" />}
            label="Đã thu"
            sub={`${selectedMonthPayments.length} phiếu thu`}
            tone="success"
          />
          <ActionableKpi
            icon={AlertTriangle}
            value={<MoneyText value={remainingAmount} compact tone={remainingAmount > 0 ? 'danger' : 'success'} />}
            label="Còn nợ"
            sub={`T${selectedDebtMonth.m}/${selectedDebtMonth.y}`}
            tone={remainingAmount > 0 ? 'danger' : 'success'}
          />
          <ActionableKpi
            icon={TrendingDown}
            value={<MoneyText value={spentAmount} compact tone="danger" />}
            label="Đã chi"
            sub={`${selectedMonthExpenses.length} phiếu chi`}
            tone="danger"
          />
        </ActionableKpiGrid>
      )}

      {/* ══ CÔNG NỢ ══ */}
      {finSub === 'debt' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <style>{`
            .fin-debt-desktop{display:block}.fin-debt-mobile{display:none}
            @media(max-width:767px){.fin-debt-desktop{display:none!important}.fin-debt-mobile{display:block!important}}
            .finance-recent-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
            .finance-section-title{margin:0 0 8px;font-size:13px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:.06em}
            @media(max-width:900px){.finance-recent-grid{grid-template-columns:1fr}}
          `}</style>
          <section>
          <div className="fin-debt-desktop">
            <DataTable
              columns={debtColumns}
              data={pagedDebtRows}
              rowKey="id"
              emptyText="Không có học sinh phù hợp"
              emptySub="Thử đổi lớp hoặc tháng học phí."
              onRowClick={row => onViewFinance(row.student)}
              scrollX={false}
              density="compact"
              footer={<Pager page={pgF} total={debtTableRows.length} perPage={IPP} setPage={setPgF} showTotal />}
            />
          </div>

          <div className="fin-debt-mobile" style={{ padding: 10 }}>
            {pagedDebtRows.length === 0 ? (
              <EmptyState text="Không có học sinh phù hợp" sub="Thử đổi bộ lọc công nợ." compact />
            ) : pagedDebtRows.map(row => {
              const s = row.student;
              const ph = String(s.parentPhone || '').replace(/\D/g, '');
              const sh = String(s.studentPhone || '').replace(/\D/g, '');
              const periodStatus = getDebtPeriodStatus(row);
              const meta = debtStatusMeta(periodStatus);
              const receipt = getDebtPeriodPayment(row);
              const amount = getDebtPeriodAmount(row);
              const actionAmount = amount || row.debtAmount || baseTuition;
              return (
                <MobileCard
                  key={`${s.id}-debt-card`}
                  title={capitalizeName(s.name)}
                  subtitle={`${s.id || '—'}${s.grade ? ` · Khối ${s.grade}` : ''} · ${s.classId || 'Chưa có lớp'}`}
                  badge={<StatusBadge domain="tuition" status={periodStatus} label={meta.label} tone={meta.tone} />}
                  tone={meta.tone}
                  onClick={() => onViewFinance(s)}
                  style={{ marginBottom: 8, opacity: row.isInactive ? 0.68 : 1 }}
                  rows={[
                    { label: 'Lớp', value: s.classId || '—' },
                    { label: 'Số buổi', value: '—' },
                    { label: 'Thành tiền', value: <MoneyText value={amount} compact tone={periodStatus === 'paid' ? 'success' : periodStatus === 'overdue' ? 'danger' : undefined} /> },
                    { label: 'Hạn đóng', value: '—' },
                  ]}
                  actions={(
                    <div className="ltn-mobile-action-row" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 7, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {periodStatus === 'paid' && receipt ? (
                        <button onClick={() => onViewInvoice(receipt)} style={{ minHeight: 40, padding: '8px 12px', borderRadius: 999, background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
                          Biên lai
                        </button>
                      ) : periodStatus === 'overdue' && (ph.length >= 9 || sh.length >= 9) ? (
                        <button className="ltn-zalo-action" onClick={() => copyMsg(s.id, makeZaloMsg(s, actionAmount))} style={{ minHeight: 42, padding: '9px 13px', borderRadius: 999, background: copiedId === s.id ? '#ecfdf5' : '#f0fdf4', border: `1px solid ${copiedId === s.id ? '#a7f3d0' : '#bbf7d0'}`, color: copiedId === s.id ? '#059669' : '#16a34a', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          {copiedId === s.id ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === s.id ? 'Đã copy' : 'Nhắc phí'}
                        </button>
                      ) : periodStatus === 'unpaid' || periodStatus === 'overdue' ? (
                        <button onClick={() => onShowFAB('income')} style={{ minHeight: 40, padding: '8px 12px', borderRadius: 999, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
                          Thu phí
                        </button>
                      ) : null}
                    </div>
                  )}
                />
              );
            })}
            <Pager page={pgF} total={debtTableRows.length} perPage={IPP} setPage={setPgF} showTotal />
          </div>
          </section>

          <section className="finance-recent-grid">
            <div>
              <h3 className="finance-section-title">Phiếu thu gần đây</h3>
              <DataTable
                columns={[
                  { key: 'date', label: 'Ngày', width: '16%', render: (_: unknown, p: Payment) => <DateText value={p.date} /> },
                  { key: 'student', label: 'Học sinh', width: '28%', render: (_: unknown, p: Payment) => <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{capitalizeName(p.studentName) || '—'}</span> },
                  { key: 'period', label: 'Kỳ phí', align: 'center' as const, width: '18%', render: (_: unknown, p: Payment) => {
                    const period = getPaymentTuitionPeriod(p);
                    return period ? <MonthText month={period.m} year={period.y} /> : <span style={{ color: '#94a3b8', fontWeight: 800 }}>—</span>;
                  } },
                  { key: 'amount', label: 'Số tiền', align: 'right' as const, width: '18%', render: (_: unknown, p: Payment) => <MoneyText value={p.amount} compact tone="success" /> },
                  { key: 'method', label: 'Thanh toán', width: '20%', render: (_: unknown, p: Payment) => normalizePaymentMethod(p.method) || '—' },
                ]}
                data={recentPayments}
                rowKey={(p) => p.id || p.docNum || `${p.studentId}-${p.date}-${p.amount}`}
                emptyText="Chưa có phiếu thu trong kỳ"
                emptySub="Phiếu thu mới sẽ hiển thị tại đây."
                onRowClick={onViewInvoice}
                scrollX={false}
                density="compact"
              />
            </div>
            <div>
              <h3 className="finance-section-title">Phiếu chi gần đây</h3>
              <DataTable
                columns={[
                  { key: 'date', label: 'Ngày', width: '18%', render: (_: unknown, e: Expense) => <DateText value={e.date} /> },
                  { key: 'description', label: 'Khoản chi', width: '34%', render: (_: unknown, e: Expense) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{e.description || '—'}</span> },
                  { key: 'category', label: 'Phân loại', width: '24%', render: (_: unknown, e: Expense) => e.category || '—' },
                  { key: 'amount', label: 'Số tiền', align: 'right' as const, width: '24%', render: (_: unknown, e: Expense) => <MoneyText value={e.amount} compact tone="danger" /> },
                ]}
                data={recentExpenses}
                rowKey={(e) => e.id || e.docNum || `${e.date}-${e.description}-${e.amount}`}
                emptyText="Chưa có phiếu chi trong kỳ"
                emptySub="Phiếu chi mới sẽ hiển thị tại đây."
                onRowClick={onViewExpense}
                scrollX={false}
                density="compact"
              />
            </div>
          </section>
        </div>
      )}

      {/* ══ SỔ CÁI — NO stat blocks ══ */}
      {finSub === 'ledger' && (
        <div>
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
            <div className="fin-ledger-mobile" style={{ gap: 8, padding: 10 }}>
            {pagedLedger.length === 0 ? (
                <EmptyState text="Chưa có phiếu thu phù hợp" sub="Thử đổi tháng hoặc lớp." compact />
              ) : pagedLedger.map(p => {
                const period = getPaymentTuitionPeriod(p);
                const cls = paymentClassId(p, students);
                return (
                  <MobileCard
                    key={p.id || p.docNum || `${p.studentId}-${p.date}-${p.amount}`}
                    title={capitalizeName(p.studentName) || p.docNum || 'Phiếu thu'}
                    subtitle={`${p.studentId || '—'}${cls ? ` · ${cls}` : ''}`}
                    badge={<MoneyText value={p.amount} tone="success" />}
                    tone="success"
                    onClick={() => onViewInvoice(p)}
                    rows={[
                      { label: 'Ngày thu', value: <DateText value={p.date} /> },
                      { label: 'Lớp', value: cls || '—' },
                      { label: 'Kỳ phí', value: period ? <MonthText month={period.m} year={period.y} /> : '—' },
                      { label: 'Người thu', value: paymentCollector(p, students, uClasses) },
                    ]}
                    actions={(
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 7, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button intent="primary" variant="outline" size="sm" onClick={() => onEditPayment(p)}>Sửa</Button>
                        <Button intent="danger" variant="outline" size="sm" onClick={() => onDeletePayment(p)}>Xóa</Button>
                      </div>
                    )}
                  />
                );
              })}
              <Pager page={pgLedger} total={filteredLedger.length} perPage={LEDGER_IPP} setPage={setPgLedger} showTotal />
            </div>
          </section>
        </div>
      )}
      {finSub === 'expense' && (
        <div>
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
          <div className="fin-expense-mobile" style={{ gap: 8, padding: 10 }}>
            {pagedExpense.length === 0 ? (
              <EmptyState text="Chưa có phiếu chi phù hợp" sub="Thử đổi tháng hoặc người chi." compact />
            ) : pagedExpense.map(e => (
                <MobileCard
                  key={e.id || e.docNum || `${e.date}-${e.description}-${e.amount}`}
                  title={e.description || e.docNum || 'Phiếu chi'}
                  subtitle={e.docNum || '—'}
                  badge={<MoneyText value={e.amount} tone="danger" />}
                  tone="danger"
                  onClick={() => onViewExpense(e)}
                  rows={[
                    { label: 'Ngày chi', value: <DateText value={e.date} /> },
                    { label: 'Hạng mục', value: e.category || '—' },
                    { label: 'Người chi', value: e.spender || '—' },
                  ]}
                  actions={(
                    <div onClick={event => event.stopPropagation()} style={{ display: 'flex', gap: 7, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button intent="primary" variant="outline" size="sm" onClick={() => onEditExpense(e)}>Sửa</Button>
                      <Button intent="danger" variant="outline" size="sm" onClick={() => onDeleteExpense(e)}>Xóa</Button>
                    </div>
                  )}
                />
            ))}
            <Pager page={pgExpense} total={filteredExpenses.length} perPage={EXPENSE_IPP} setPage={setPgExpense} showTotal />
          </div>
        </div>
      )}

    </div>
  );
}
