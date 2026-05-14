/**
 * FinanceTab.tsx — v29.0
 * ✅ Áp layout compact kiểu Lớp & Học sinh: header + subtab + filter row
 * ✅ Báo cáo doanh thu dùng MonthNavigator, ChartPanel, DataTable
 * ✅ Giữ nguyên logic nghiệp vụ công nợ/startDate/endDate
 * ✅ Tổng hợp đặt ĐẦU TIÊN
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
import { DollarSign, TrendingDown, TrendingUp, Eye, Edit3, Trash2, Plus, Copy, Check, BarChart3, Printer, School, ReceiptText } from 'lucide-react';
import { fmtVND, formatDate, capitalizeName, exportCSV, parseDMY, isStudentActive, normalizePaymentMethod } from './helpers';
import { Badge, Button, FilterTabs, Pager, SearchBar, Select } from './dsComponents';
import { TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle, fmtM } from './AppComponents';
import { EmptyState } from './UIComponents';
import {
  ActionableKpi,
  ActionableKpiGrid,
  ChartPanel,
  ContextBar,
  DataTable,
  EntityLink,
  MonthNavigator,
  PageScaffold,
  StatusBadge,
} from './uiSystem';
import type { Payment, Expense, Student, SummaryData, FinanceSub } from './types';

const ZaloIcon = () => (
  <svg viewBox="0 0 48 48" style={{ width:16, height:16 }} fill="currentColor">
    <path d="M24 4C12.954 4 4 12.954 4 24c0 3.594.945 6.97 2.6 9.89L4 44l10.374-2.554A19.9 19.9 0 0024 44c11.046 0 20-8.954 20-20S35.046 4 24 4zm-6.5 13h3v10h-3V17zm4.5 0h3v1.5c.8-.95 1.95-1.5 3-1.5 2.75 0 4 1.9 4 4.5V27h-3v-5.5c0-1.4-.55-2.5-2-2.5s-2 1.1-2 2.5V27h-3V17z"/>
  </svg>
);

const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width:15, height:15 }} fill="currentColor">
    <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.84 1.32 5.38 3.4 7.1v3.461l3.154-1.737A10.7 10.7 0 0012 20.518c5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.045 12.447l-2.55-2.72-4.98 2.72 5.474-5.806 2.614 2.72 4.915-2.72-5.473 5.806z"/>
  </svg>
);

interface Props {
  financeSubtab?: FinanceSub;
  setFinanceSubtab?: (sub: FinanceSub) => void;
  summary: SummaryData | null; payments: Payment[]; expenses: Expense[];
  students: Student[]; uClasses: any[]; tlogs: any[];
  curMo: number; curYr: number;
  qF: string; setQF: (v: string) => void;
  fMo: string; setFMo: (v: string) => void;
  fTch: string; setFTch: (v: string) => void;
  fFC: string; setFFC: (v: string) => void;
  fSt: string; setFSt: (v: string) => void;
  pgF: number; setPgF: (p: number) => void;
  filtFin: Student[];
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  zaloTpl: string; baseTuition: number; schoolYear: string;
  onViewInvoice: (p: Payment) => void;
  onViewFinance: (s: Student) => void;
  onShowFAB: () => void;
  onEditPayment: (p: Payment) => void; onDeletePayment: (p: Payment) => void;
  onEditExpense: (e: Expense) => void; onDeleteExpense: (e: Expense) => void;
  onViewExpense: (e: Expense) => void;
}

const IPP = 25;
const LEDGER_IPP = 20; // phân trang sổ cái
const EXPENSE_IPP = 20; // phân trang chi tiêu
const FILTER_SELECT: React.CSSProperties = {
  height: 38,
  padding: '0 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  background: 'white',
  cursor: 'pointer',
  outline: 'none',
};
const FIN_HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '12px 14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};
const FIN_FILTER_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
};
const SUMMARY_CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  minHeight: 38,
  padding: '0 12px',
  borderRadius: 10,
  background: 'white',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  fontSize: 12,
  fontWeight: 800,
  color: '#334155',
  whiteSpace: 'nowrap',
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
    const list = allowAll ? [{ value: '', label: 'Tất cả tháng' }] : [];
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

function tuitionPeriodLabel(p: Payment): string {
  const period = getPaymentTuitionPeriod(p);
  return period ? `T${period.m}/${period.y}` : '---';
}

function paymentClassId(p: Payment, students: Student[]): string {
  const raw = p as any;
  return String(raw.maLop || raw.MaLop || raw['Mã Lớp'] || raw.classId || students.find(s => s.id === p.studentId)?.classId || '');
}

function FinanceReportTab({ students, payments, expenses, tlogs, uClasses, summary, curMo, curYr, isPaid, baseTuition, onOpenSub }: {
  students: Student[]; payments: Payment[]; expenses: Expense[]; tlogs: any[]; uClasses: any[];
  summary: SummaryData | null; curMo: number; curYr: number;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  baseTuition: number;
  onOpenSub: (sub: FinanceSub, period?: string) => void;
}) {
  const [filterMo, setFilterMo] = useState(curMo);
  const [filterYr, setFilterYr] = useState(curYr);
  const prevCurMoRef = useRef(curMo);
  const prevCurYrRef = useRef(curYr);

  useEffect(() => {
    if (curMo !== prevCurMoRef.current || curYr !== prevCurYrRef.current) {
      if (filterMo === prevCurMoRef.current && filterYr === prevCurYrRef.current) {
        setFilterMo(curMo);
        setFilterYr(curYr);
      }
      prevCurMoRef.current = curMo;
      prevCurYrRef.current = curYr;
    }
  }, [curMo, curYr, filterMo, filterYr]);

  const prevMonth = () => {
    if (filterMo === 1) { setFilterMo(12); setFilterYr(y => y - 1); }
    else setFilterMo(m => m - 1);
  };
  const nextMonth = () => {
    if (filterMo === 12) { setFilterMo(1); setFilterYr(y => y + 1); }
    else setFilterMo(m => m + 1);
  };
  const isCurrentMonth = filterMo === curMo && filterYr === curYr;

  const moPayments = useMemo(() => payments.filter(p => {
    const r = getPaymentTuitionPeriod(p);
    return r?.m === filterMo && r?.y === filterYr;
  }), [payments, filterMo, filterYr]);
  const moExpenses = useMemo(() => expenses.filter(e => {
    const r = parseMoYr(e.date || '');
    return r?.m === filterMo && r?.y === filterYr;
  }), [expenses, filterMo, filterYr]);
  const moTlogs = useMemo(() => tlogs.filter(l => {
    const ts = parseDMY(l.date || '');
    if (!ts) return false;
    const d = new Date(ts);
    return d.getMonth() + 1 === filterMo && d.getFullYear() === filterYr;
  }), [tlogs, filterMo, filterYr]);

  const moRevenue = moPayments.reduce((s, p) => s + p.amount, 0);
  const moExpense = moExpenses.reduce((s, e) => s + e.amount, 0);
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);
  const reportPeriodKey = `${String(filterMo).padStart(2, '0')}/${filterYr}`;
  const unpaidInReportMonth = useMemo(() =>
    activeStudents.filter(s => isMonthBillable(s, { m: filterMo, y: filterYr }) && !isPaid(s.id, filterMo, filterYr)).length,
  [activeStudents, filterMo, filterYr, isPaid]);

  const revenueByClass = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; teacher: string }> = {};
    uClasses.forEach(c => { map[c['Mã Lớp']] = { revenue: 0, count: 0, teacher: c['Giáo viên'] || '---' }; });
    moPayments.forEach(p => {
      const cls = paymentClassId(p, students) || 'Không rõ';
      if (!map[cls]) map[cls] = { revenue: 0, count: 0, teacher: '---' };
      map[cls].revenue += p.amount;
      map[cls].count++;
    });
    return Object.entries(map)
      .filter(([, v]) => v.revenue > 0)
      .map(([cls, v]) => ({ cls, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [moPayments, students, uClasses]);

  const teacherRevenue = useMemo(() => {
    const map: Record<string, { revenue: number; students: number; paid: number; sessions: number; classes: Set<string> }> = {};
    activeStudents.forEach(s => {
      const t = s.teacher || 'Chưa xác định';
      if (!map[t]) map[t] = { revenue: 0, students: 0, paid: 0, sessions: 0, classes: new Set() };
      map[t].students++;
      if (isPaid(s.id, filterMo, filterYr)) map[t].paid++;
      if (s.classId) map[t].classes.add(s.classId);
    });
    moPayments.forEach(p => {
      const st = students.find(s => s.id === p.studentId);
      const t = st?.teacher || 'Chưa xác định';
      if (!map[t]) map[t] = { revenue: 0, students: 0, paid: 0, sessions: 0, classes: new Set() };
      map[t].revenue += p.amount;
    });
    moTlogs.forEach(l => {
      const cls = uClasses.find(c => c['Mã Lớp'] === l.classId);
      const t = cls?.['Giáo viên'] || 'Chưa xác định';
      if (!map[t]) map[t] = { revenue: 0, students: 0, paid: 0, sessions: 0, classes: new Set() };
      map[t].sessions++;
      if (l.classId) map[t].classes.add(l.classId);
    });
    return Object.entries(map)
      .map(([fullName, v]) => ({ fullName, ...v, classList: [...v.classes].join(', ') }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [activeStudents, students, moPayments, moTlogs, isPaid, filterMo, filterYr, uClasses]);

  const topClassRevenue = useMemo(() => revenueByClass.slice(0, 10), [revenueByClass]);
  const maxClassRevenue = topClassRevenue.reduce((max, r) => Math.max(max, r.revenue), 0) || 1;

  const handleExport = () => {
    exportCSV(`doanh-thu-t${filterMo}-${filterYr}`,
      ['Lớp', 'Giáo viên', 'Số phiếu', 'Doanh thu'],
      revenueByClass.map(r => [r.cls, r.teacher, r.count, r.revenue])
    );
  };

  return (
    <PageScaffold
      gap={12}
      context={
        <ContextBar
          items={[
            { label: 'Kỳ báo cáo', value: `T${filterMo}/${filterYr}`, icon: BarChart3, tone: 'primary' },
            { label: 'Phiếu thu', value: moPayments.length, icon: ReceiptText, tone: 'success' },
            { label: 'Phiếu chi', value: moExpenses.length, icon: TrendingDown, tone: 'danger' },
          ]}
          actions={
            <>
              <MonthNavigator
                month={filterMo}
                year={filterYr}
                onPrev={prevMonth}
                onNext={nextMonth}
                onToday={!isCurrentMonth ? () => { setFilterMo(curMo); setFilterYr(curYr); } : undefined}
              />
              <Button size="sm" intent="success" variant="outline" onClick={handleExport}>Xuất CSV</Button>
              <Button size="sm" intent="danger" variant="outline" icon={<Printer size={13} />} onClick={() => window.print()}>In</Button>
            </>
          }
        />
      }
      kpis={
        <ActionableKpiGrid>
          <ActionableKpi
            icon={TrendingUp}
            value={fmtM(moRevenue)}
            label="Thu"
            sub={`${moPayments.length} phiếu`}
            tone="success"
            onClick={() => onOpenSub('ledger', reportPeriodKey)}
            actionLabel="Xem phiếu thu"
          />
          <ActionableKpi
            icon={TrendingDown}
            value={fmtM(moExpense)}
            label="Chi"
            sub={`${moExpenses.length} phiếu`}
            tone="danger"
            onClick={() => onOpenSub('expense', reportPeriodKey)}
            actionLabel="Xem phiếu chi"
          />
          <ActionableKpi icon={DollarSign} value={fmtM(moRevenue - moExpense)} label="Lợi nhuận" sub={`T${filterMo}/${filterYr}`} tone={(moRevenue - moExpense) >= 0 ? 'primary' : 'warning'} />
          <ActionableKpi
            icon={ReceiptText}
            value={unpaidInReportMonth}
            label="Chưa đóng"
            sub={fmtM(unpaidInReportMonth * baseTuition)}
            tone={unpaidInReportMonth > 0 ? 'danger' : 'success'}
            onClick={() => onOpenSub('debt', reportPeriodKey)}
            actionLabel="Xem công nợ"
          />
        </ActionableKpiGrid>
      }
    >
      <ChartPanel
        title="Doanh thu theo lớp"
        subtitle={`Kỳ T${filterMo}/${filterYr}`}
        legend={<span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{revenueByClass.length} lớp có doanh thu</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {topClassRevenue.length === 0 ? (
            <div style={{ padding: '26px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
              Chưa có dữ liệu để vẽ biểu đồ
            </div>
          ) : topClassRevenue.map((row, idx) => {
            const pct = Math.max(4, Math.round(row.revenue / maxClassRevenue * 100));
            return (
              <div key={row.cls} style={{ display: 'grid', gridTemplateColumns: 'minmax(54px,76px) minmax(80px,1fr) minmax(66px,86px)', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: idx === 0 ? '#4338ca' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.cls}
                </span>
                <div style={{ height: 20, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: idx === 0 ? 'linear-gradient(90deg,#4f46e5,#06b6d4)' : 'linear-gradient(90deg,#60a5fa,#22c55e)', transition: 'width 0.25s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {fmtM(row.revenue)}
                </span>
              </div>
            );
          })}
        </div>
        <DataTable
          data={revenueByClass}
          rowKey="cls"
          emptyText="Chưa có doanh thu tháng này"
          columns={[
            { key: 'cls', label: 'Lớp', align: 'center', render: v => <span style={{ fontWeight: 800, color: '#4338ca' }}>{v}</span> },
            { key: 'teacher', label: 'Giáo viên', render: v => <span style={{ color: '#475569', fontSize: 12 }}>{v}</span> },
            { key: 'count', label: 'Phiếu', align: 'center' },
            { key: 'revenue', label: 'Tổng thu', align: 'right', render: v => <span style={{ fontWeight: 800, color: '#059669' }}>+{fmtVND(v)}</span> },
          ]}
        />
      </ChartPanel>

      <ChartPanel
        title="Tổng quan theo giáo viên"
        subtitle={`Học sinh, lớp, đóng phí và doanh thu T${filterMo}/${filterYr}`}
      >
        <DataTable
          data={teacherRevenue}
          rowKey="fullName"
          emptyText="Chưa có dữ liệu giáo viên trong kỳ này"
          columns={[
            { key: 'fullName', label: 'Giáo viên', render: v => <EntityLink label={v} tone="teal" icon={School} /> },
            { key: 'classList', label: 'Lớp', align: 'center', render: v => <span style={{ color: '#64748b', fontSize: 12 }}>{v || '---'}</span> },
            { key: 'students', label: 'HS', align: 'center' },
            {
              key: 'paid',
              label: 'Đóng phí',
              align: 'center',
              render: (_v, row) => (
                <StatusBadge
                  domain="tuition"
                  status={row.students > 0 && row.paid / row.students >= 0.8 ? 'paid' : 'partial'}
                  label={`${row.paid}/${row.students}`}
                />
              ),
            },
            { key: 'revenue', label: 'Doanh thu', align: 'right', render: v => <span style={{ fontWeight: 800, color: '#059669' }}>+{fmtVND(v)}</span> },
          ]}
        />
      </ChartPanel>
    </PageScaffold>
  );
}

export default function FinanceTab({
  financeSubtab, setFinanceSubtab,
  summary, payments, expenses, students, uClasses, tlogs,
  curMo, curYr, qF, setQF, fMo, setFMo, fTch, setFTch, fFC, setFFC, fSt, setFSt,
  pgF, setPgF, filtFin, isPaid, zaloTpl, baseTuition, schoolYear,
  onViewInvoice, onViewFinance, onShowFAB, onEditPayment, onDeletePayment, onEditExpense, onDeleteExpense, onViewExpense,
}: Props) {
  const [internalFinSub, setInternalFinSub] = useState<FinanceSub>('report');
  const finSub = financeSubtab ?? internalFinSub;
  const setFinSub = setFinanceSubtab ?? setInternalFinSub;
  const pagedFin = filtFin.slice((pgF - 1) * IPP, pgF * IPP);

  // FIX Bug 4: dùng fM (tháng đang filter) thay vì curMo (tháng thực tế)
  // để nội dung Zalo đúng với tháng user đang xem công nợ
  const [fM, fY] = (fMo || `${String(curMo).padStart(2,'0')}/${curYr}`).split('/').map(Number);
  const makeZaloMsg = (s: Student) => {
    const msgDate = formatDate(new Date().toISOString());
    return zaloTpl
      .replace(/\[Ten\]/g, s.name || '')
      .replace(/\[Lop\]/g, s.classId || '---')
      .replace(/\[Thang\]/g, String(fM || curMo))
      .replace(/\[Nam\]/g, String(fY || curYr))
      .replace(/\[SoTien\]/g, fmtVND(baseTuition))
      .replace(/\[Ngay\]/g, msgDate);
  };
  const fmtDesc = (desc: string) => (desc||'').replace(/[Hh]ọc phí\s+tháng\s+0?(\d{1,2})\s+năm\s+(\d{4})/i, 'HP T$1/$2');

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
  const [eFilterCat, setEFilterCat] = useState('');
  const [eFilterSpender, setEFilterSpender] = useState('');
  // FIX Bug 3: reset về trang 1 khi có phiếu chi mới
  useEffect(() => { setPgExpense(1); }, [expenses.length, eFilterMo, eFilterCat, eFilterSpender]);
  const filteredExpenses = useMemo(() => {
    const [eFM, eFY] = (eFilterMo || '').split('/').map(Number);
    return expenses.slice().reverse().filter(e => {
      if (eFilterMo) {
        const r = parseMoYr(e.date || '');
        if (!r || r.m !== eFM || r.y !== eFY) return false;
      }
      if (eFilterCat && e.category !== eFilterCat) return false;
      if (eFilterSpender && e.spender !== eFilterSpender) return false;
      return true;
    });
  }, [expenses, eFilterMo, eFilterCat, eFilterSpender]);
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
    const parts = (schoolYear || '2025-2026').split('-').map(Number);
    const y1 = parts[0] || new Date().getFullYear(), y2 = parts[1] || y1 + 1;
    const m: { m: number; y: number; label: string }[] = [];
    for (let mo = 7; mo <= 12; mo++) m.push({ m: mo, y: y1, label: `T${mo}` });
    for (let mo = 1; mo <= 6; mo++)  m.push({ m: mo, y: y2, label: `T${mo}` });
    return m;
  }, [schoolYear]);

  const [hovPay, setHovPay] = useState<number|null>(null);
  const [hovExp, setHovExp] = useState<number|null>(null);

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
  const debtSummary = useMemo(() => {
    const unpaid = activeStudents.filter(s =>
      isMonthBillable(s, selectedDebtMonth) && !isPaid(s.id, selectedDebtMonth.m, selectedDebtMonth.y)
    ).length;
    return {
      unpaid,
      estimatedDebt: unpaid * baseTuition,
      label: `T${selectedDebtMonth.m}/${selectedDebtMonth.y}`,
    };
  }, [activeStudents, selectedDebtMonth, isPaid, baseTuition]);
  const hasDebtFilter = !!qF || debtPeriodValue !== currentMonthKey || !!fFC || fSt !== 'unpaid';
  const resetDebtFilters = () => {
    setQF('');
    setFMo(currentMonthKey);
    setFFC('');
    setFSt('unpaid');
    setPgF(1);
  };
  const exportPayments = () => exportCSV('phieu-thu',
    ['Ngày thu', 'Số CT', 'Mã HS', 'Mã lớp', 'Học sinh', 'Kỳ HP', 'Tháng HP', 'Năm HP', 'Người nộp', 'Hình thức', 'Số tiền (đ)'],
    filteredLedger.map(p => {
      const period = getPaymentTuitionPeriod(p);
      return [
        p.date,
        p.docNum,
        p.studentId,
        paymentClassId(p, students),
        p.studentName,
        tuitionPeriodLabel(p),
        period?.m || '',
        period?.y || '',
        p.payer || '',
        normalizePaymentMethod(p.method),
        p.amount,
      ];
    })
  );
  const exportExpenses = () => exportCSV('phieu-chi',
    ['Ngày', 'Số CT', 'Nội dung', 'Hạng mục', 'Người chi', 'Số tiền (đ)'],
    filteredExpenses.map(e => [e.date, e.docNum, e.description, e.category, e.spender || '', e.amount])
  );

  const classOptions = useMemo(() => [
    { value: '', label: 'Tất cả lớp' },
    ...uClasses.map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] })),
  ], [uClasses]);
  const expenseCategoryOptions = useMemo(() => [
    { value: '', label: 'Tất cả hạng mục' },
    ...[...new Set(expenses.map(e => e.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(v => ({ value: v, label: v })),
  ], [expenses]);
  const expenseSpenderOptions = useMemo(() => [
    { value: '', label: 'Tất cả người chi' },
    ...[...new Set(expenses.map(e => e.spender).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(v => ({ value: v, label: v })),
  ], [expenses]);
  const debtStatusOptions = useMemo(() => [
    { value: 'unpaid', label: 'Chưa đóng' },
    { value: 'paid', label: 'Đã đóng' },
    { value: '', label: 'Tất cả' },
  ], []);
  const openFinanceSub = useCallback((sub: FinanceSub, period?: string) => {
    if (sub === 'debt' && period) setFMo(period);
    if (sub === 'ledger' && period) setLFilterMo(period);
    if (sub === 'expense' && period) setEFilterMo(period);
    setFinSub(sub);
  }, [setFMo]);

  const financeFilterRow = finSub === 'debt' ? (
    <div style={FIN_FILTER_ROW}>
      <span style={{ ...SUMMARY_CHIP, color: debtSummary.unpaid > 0 ? '#be123c' : '#059669' }}>
        <DollarSign size={14} />
        {debtSummary.label} · {debtSummary.unpaid} chưa đóng · Dự kiến {fmtM(debtSummary.estimatedDebt)}
      </span>
      <SearchBar
        value={qF}
        onChange={v => { setQF(v); setPgF(1); }}
        placeholder="Tìm học sinh, mã HS..."
        width={230}
      />
      <MonthSelect value={debtPeriodValue} allowAll={false} onChange={v => { setFMo(v); setPgF(1); }} />
      <Select value={fSt} onChange={v => { setFSt(v); setPgF(1); }} options={debtStatusOptions} size="md" style={{ width: 138 }} />
      <Select value={fFC} onChange={v => { setFFC(v); setPgF(1); }} options={classOptions} size="md" style={{ width: 150 }} />
      {hasDebtFilter && <Button size="sm" intent="neutral" variant="outline" onClick={resetDebtFilters}>Reset</Button>}
    </div>
  ) : finSub === 'ledger' ? (
    <div style={FIN_FILTER_ROW}>
      <span style={SUMMARY_CHIP}>
        <ReceiptText size={14} color="#059669" />
        {filteredLedger.length}/{payments.length} phiếu thu
      </span>
      <MonthSelect value={lFilterMo} onChange={setLFilterMo} />
      <Select value={lFilterCls} onChange={setLFilterCls} options={classOptions} size="md" style={{ width: 150 }} />
      {(lFilterMo || lFilterCls) && <Button size="sm" intent="neutral" variant="outline" onClick={() => { setLFilterMo(''); setLFilterCls(''); }}>Reset</Button>}
      <div style={{ marginLeft: 'auto' }}>
        <Button size="sm" intent="success" variant="outline" onClick={exportPayments}>Xuất CSV</Button>
      </div>
    </div>
  ) : finSub === 'expense' ? (
    <div style={FIN_FILTER_ROW}>
      <span style={SUMMARY_CHIP}>
        <TrendingDown size={14} color="#e11d48" />
        {filteredExpenses.length}/{expenses.length} phiếu chi
      </span>
      <MonthSelect value={eFilterMo} onChange={setEFilterMo} />
      <Select value={eFilterCat} onChange={setEFilterCat} options={expenseCategoryOptions} size="md" style={{ width: 170 }} />
      <Select value={eFilterSpender} onChange={setEFilterSpender} options={expenseSpenderOptions} size="md" style={{ width: 170 }} />
      {(eFilterMo || eFilterCat || eFilterSpender) && (
        <Button size="sm" intent="neutral" variant="outline" onClick={() => { setEFilterMo(''); setEFilterCat(''); setEFilterSpender(''); }}>
          Reset
        </Button>
      )}
      <div style={{ marginLeft: 'auto' }}>
        <Button size="sm" intent="success" variant="outline" onClick={exportExpenses}>Xuất CSV</Button>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={FIN_HEADER}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Tài chính
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Công nợ, phiếu thu/chi
          </p>
        </div>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ padding: 3, background: '#f1f5f9', borderRadius: 12, overflowX: 'auto', maxWidth: '100%' }}>
          <FilterTabs
            variant="segment"
            size="sm"
            active={finSub}
            onChange={id => setFinSub(id as FinanceSub)}
            tabs={[
              { id: 'report', label: 'Tổng hợp', icon: <BarChart3 size={12} /> },
              { id: 'debt', label: 'Công nợ', icon: <DollarSign size={12} />, count: unpaidNow },
              { id: 'ledger', label: 'Phiếu thu', icon: <ReceiptText size={12} />, count: filteredLedger.length },
              { id: 'expense', label: 'Phiếu chi', icon: <TrendingDown size={12} />, count: filteredExpenses.length },
            ]}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Button intent="success" size="sm" icon={<Plus size={13} />} onClick={onShowFAB}>
            Thêm phiếu thu/chi
          </Button>
        </div>
      </div>

      {financeFilterRow}



      {/* ══ CÔNG NỢ ══ */}
      {finSub === 'debt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={TABLE_WRAP}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH_SHARED, textAlign: 'left' }}>Học sinh</th>
                  <th style={{ ...TH_SHARED, textAlign: 'center' }}>Lớp</th>
                  <th style={{ ...TH_SHARED, textAlign: 'center', minWidth: 200 }}>Tình trạng đóng phí ({schoolYearMonths.length} tháng)</th>
                  <th style={{ ...TH_SHARED, textAlign: 'center', background: '#fef2f2', color: '#be123c', minWidth: 52 }}>Nợ</th>
                  <th style={{ ...TH_SHARED, textAlign: 'right', background: '#fef2f2', color: '#be123c', minWidth: 90 }}>Tổng nợ</th>
                  <th style={{ ...TH_SHARED, textAlign: 'center' }}>Liên hệ</th>
                </tr>
              </thead>
              <tbody>
                {pagedFin.length === 0
                  ? <tr><td colSpan={6}><EmptyState title="Không có học sinh phù hợp" subtitle="Thử đổi kỳ học phí, trạng thái đóng phí hoặc bộ lọc lớp." /></td></tr>
                  : pagedFin.map((s, rowIdx) => {
                    const ph = String(s.parentPhone || '').replace(/\D/g, '');
                    const sh = String(s.studentPhone || '').replace(/\D/g, '');
                    const isInactive = s.status === 'inactive' || (s.endDate && s.endDate !== '---' && s.endDate !== '');

                    // Chỉ tính tháng mà học sinh thực sự phải đóng
                    // FIX A: chỉ tính tháng đã qua/đang diễn ra — không tính tương lai là nợ
                    const billableMonths = schoolYearMonths.filter(fm => {
                      if (!isMonthBillable(s, fm)) return false;
                      if (fm.y > curYr) return false;
                      if (fm.y === curYr && fm.m > curMo) return false;
                      return true;
                    });
                    const unpaidCount = billableMonths.filter(fm => !isPaid(s.id, fm.m, fm.y)).length;
                    const paidCount   = billableMonths.filter(fm =>  isPaid(s.id, fm.m, fm.y)).length;
                    const paidPct     = billableMonths.length > 0 ? Math.round(paidCount / billableMonths.length * 100) : 100;
                    const isProblem   = !isInactive && unpaidCount > 2;
                    const isWarning   = !isInactive && unpaidCount === 2;
                    const rowBg = isInactive ? '#f8fafc' : isProblem ? '#fff5f5' : isWarning ? '#fefce8' : undefined;
                    return (
                      <tr key={s.id} style={{ ...trStyle(rowIdx), ...(rowBg ? { background: rowBg } : {}), opacity: isInactive ? 0.6 : 1 }}>
                        <td style={{ ...TD_SHARED, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: isInactive ? '#cbd5e1' : isProblem ? '#ef4444' : isWarning ? '#f59e0b' : '#a7f3d0' }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <p style={{ fontWeight: 700, color: isInactive ? '#94a3b8' : isProblem ? '#be123c' : '#0f172a', margin: 0, fontSize: 13 }}>{capitalizeName(s.name)}</p>
                                {isInactive && <span style={{ fontSize: 9, fontWeight: 700, background: '#e2e8f0', color: '#64748b', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase' }}>Nghỉ</span>}
                              </div>
                              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{s.id}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...TD_SHARED, textAlign: 'center' }}><Badge color="indigo">{s.classId}</Badge></td>
                        <td style={{ ...TD_SHARED, padding: '8px 14px' }}>
                          {/* Thanh tiến độ + dots tháng */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${paidPct}%`, background: isInactive ? '#94a3b8' : unpaidCount === 0 ? '#10b981' : unpaidCount <= 2 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', minWidth: 32 }}>{paidCount}/{billableMonths.length}</span>
                          </div>
                          {/* Dots mini cho từng tháng — 3 trạng thái: đã đóng / chưa đóng / chưa học */}
                          <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
                            {schoolYearMonths.map(fm => {
                              const billable = isMonthBillable(s, fm);
                              const paid = isPaid(s.id, fm.m, fm.y);
                              const isCurM   = fm.m === curMo && fm.y === curYr;
                              // FIX A: tháng tương lai — xám trung tính, không tính là nợ
                              const isFuture = fm.y > curYr || (fm.y === curYr && fm.m > curMo);

                              // Màu dot theo trạng thái
                              let dotBg = '#e2e8f0';       // mặc định: chưa học (xám nhạt)
                              let dotColor = '#cbd5e1';
                              let dotBorder = '1px solid transparent';
                              let dotTitle = `T${fm.m}/${fm.y}: Chưa học`;

                              if (!billable) {
                                // Chưa bắt đầu hoặc đã nghỉ — xám sọc
                                dotBg = '#f1f5f9';
                                dotColor = '#e2e8f0';
                                dotTitle = `T${fm.m}/${fm.y}: Chưa học`;
                              } else if (paid) {
                                dotBg = '#10b981';
                                dotColor = 'white';
                                dotBorder = '1px solid transparent';
                                dotTitle = `T${fm.m}/${fm.y}: Đã đóng`;
                              } else if (isFuture) {
                                // Tháng tương lai — xám nhạt, không tính là nợ
                                dotBg = '#f8fafc';
                                dotColor = '#e2e8f0';
                                dotBorder = '1px solid #e2e8f0';
                                dotTitle = `T${fm.m}/${fm.y}: Chưa đến`;
                              } else {
                                // Đã đến hạn nhưng chưa đóng
                                dotBg = isCurM ? '#fca5a5' : '#fde68a';
                                dotColor = isCurM ? '#dc2626' : '#92400e';
                                dotBorder = isCurM ? '1.5px solid #ef4444' : '1px solid #fcd34d';
                                dotTitle = `T${fm.m}/${fm.y}: Chưa đóng`;
                              }

                              return (
                                <div key={`${fm.m}-${fm.y}`} title={dotTitle}
                                  style={{ width: 14, height: 14, borderRadius: 3, background: dotBg, border: dotBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: billable ? 1 : 0.4 }}>
                                  <span style={{ fontSize: 7, fontWeight: 700, color: dotColor, lineHeight: 1 }}>{fm.m}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: isProblem ? '#fee2e2' : isWarning ? '#fef9c3' : '#f1f5f9', color: isProblem ? '#b91c1c' : isWarning ? '#92400e' : '#64748b' }}>
                            {unpaidCount}T
                          </span>
                        </td>
                        <td style={{ ...TD_SHARED, textAlign: 'right', fontWeight: 700, color: isProblem ? '#b91c1c' : '#64748b', whiteSpace: 'nowrap' }}>
                          {unpaidCount > 0 ? fmtVND(unpaidCount * baseTuition) : '—'}
                        </td>
                        <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                            <button onClick={() => onViewFinance(s)} style={{ width: 28, height: 28, background: '#eef2ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}><Eye size={12} color="#6366f1" /></button>
                            {(ph.length >= 9 || sh.length >= 9) && (<>
                              {/* FIX: Zalo không hỗ trợ pre-fill qua URL — bỏ ?text=
                                  Thay bằng nút copy message riêng */}
                              <button
                                onClick={() => copyMsg(s.id, makeZaloMsg(s))}
                                title="Copy nội dung nhắc phí"
                                style={{ width: 28, height: 28, background: copiedId === s.id ? '#ecfdf5' : '#f0fdf4', border: `1px solid ${copiedId === s.id ? '#a7f3d0' : '#bbf7d0'}`, color: copiedId === s.id ? '#059669' : '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                {copiedId === s.id ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </>)}
                            {ph.length >= 9 && (
                              <a href={`https://zalo.me/${ph}`} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#0068FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 6 }} title="Mở Zalo PH (copy nội dung trước)"><ZaloIcon /></a>
                            )}
                            {sh.length >= 9 && (
                              <a href={`https://zalo.me/${sh}`} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, background: '#eef6ff', border: '1px solid #bfdbfe', color: '#0068FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 6 }} title="Mở Zalo HS (copy nội dung trước)"><ZaloIcon /></a>
                            )}
                            {s.facebookUrl && (
                              <a href={s.facebookUrl.startsWith('http') ? s.facebookUrl : `https://m.me/${s.facebookUrl}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ width: 28, height: 28, background: '#f0f4ff', border: '1px solid #c7d2fe', color: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 6 }}
                                title="Messenger PH"><MessengerIcon /></a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <Pager page={pgF} total={filtFin.length} perPage={IPP} setPage={setPgF} showTotal />
            </div>
          </div>
        </div>
      )}

      {/* ══ SỔ CÁI — NO stat blocks ══ */}
      {finSub === 'ledger' && (
        <div style={TABLE_WRAP}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
            <DollarSign size={14} color="#10b981" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Thu học phí ({filteredLedger.length}/{payments.length} phiếu)</p>
            <StatusBadge domain="data" status={lFilterMo || lFilterCls ? 'local' : 'synced'} label={lFilterMo || lFilterCls ? 'Đang lọc' : 'Toàn bộ'} />
          </div>
          {/* Desktop */}
          <div className="fin-desktop" style={{ overflowX: 'auto' }}>
            <style>{`.fin-desktop{display:block}.fin-mobile{display:none}@media(max-width:767px){.fin-desktop{display:none!important}.fin-mobile{display:block!important}}`}</style>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ngày thu', 'Học sinh', 'Kỳ HP', 'Người nộp', 'Số tiền', ''].map((h, i) => (
                    <th key={i} style={{ ...TH_SHARED, textAlign: i >= 4 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0
                  ? <tr><td colSpan={6}><EmptyState title="Chưa có phiếu thu phù hợp" subtitle="Phiếu thu mới hoặc kết quả lọc sẽ hiển thị tại đây." /></td></tr>
                  : pagedLedger.map((p, i) => (
                    <tr key={i} onMouseEnter={() => setHovPay(i)} onMouseLeave={() => setHovPay(null)} style={trStyle(i, hovPay === i)}>
                      <td style={{ ...TD_SHARED, fontSize: 12, color: '#475569' }}>{formatDate(p.date)}</td>
                      <td style={TD_SHARED}>
                        {(() => {
                          const st = students.find(s => s.id === p.studentId);
                          const cls = paymentClassId(p, students);
                          return (
                            <div>
                              <p style={{ fontWeight:600, margin:0, fontSize:13, color: st?'#6366f1':'#1e293b', cursor:st?'pointer':'default' }}
                                onClick={() => st && onViewFinance(st)} title={st?'Xem hồ sơ tài chính':undefined}>
                                {capitalizeName(p.studentName)}
                              </p>
                              <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>{p.studentId}{cls ? ` · ${cls}` : ''}</p>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={TD_SHARED}>
                        <Badge color="emerald">{tuitionPeriodLabel(p)}</Badge>
                        {p.description && <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>{fmtDesc(p.description)}</p>}
                      </td>
                      <td style={TD_SHARED}>{p.payer || '---'}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'right', fontWeight: 700, color: '#059669' }}>+{fmtVND(p.amount)}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                          <button onClick={() => onViewInvoice(p)} style={{ width: 30, height: 30, background: '#fff7ed', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={13} color="#f97316" /></button>
                          <button onClick={() => onEditPayment(p)} style={{ width: 30, height: 30, background: '#eef2ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={13} color="#6366f1" /></button>
                          <button onClick={() => onDeletePayment(p)} style={{ width: 30, height: 30, background: '#fff1f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} color="#f87171" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="fin-mobile">
            {filteredLedger.length === 0
              ? <EmptyState title="Chưa có phiếu thu phù hợp" subtitle="Phiếu thu mới hoặc kết quả lọc sẽ hiển thị tại đây." />
              : pagedLedger.map((p, i) => (
                <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f9fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize:13, fontWeight:700, margin:0, ...(students.find(s=>s.id===p.studentId) ? {color:'#6366f1',cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted' as const,textUnderlineOffset:3} : {color:'#0f172a'}) }}
                        onClick={() => { const st=students.find(s=>s.id===p.studentId); if(st) onViewFinance(st); }}>
                        {capitalizeName(p.studentName)}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{p.studentId}{paymentClassId(p, students) ? ` · ${paymentClassId(p, students)}` : ''}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{formatDate(p.date)} · {tuitionPeriodLabel(p)} · {normalizePaymentMethod(p.method)}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#059669', flexShrink: 0 }}>+{fmtVND(p.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => onViewInvoice(p)} style={{ flex: 1, padding: '6px 0', background: '#fff7ed', color: '#f97316', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Xem phiếu</button>
                    <button onClick={() => onEditPayment(p)} style={{ flex: 1, padding: '6px 0', background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => onDeletePayment(p)} style={{ width: 34, padding: '6px 0', background: '#fff1f2', color: '#f87171', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
          {/* Phân trang sổ cái */}
          <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
            <Pager page={pgLedger} total={filteredLedger.length} perPage={LEDGER_IPP} setPage={setPgLedger} showTotal />
          </div>
        </div>
      )}
      {finSub === 'expense' && (
        <div style={TABLE_WRAP}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <TrendingDown size={14} color="#f87171" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Chi tiêu ({filteredExpenses.length}/{expenses.length} phiếu chi)</p>
            <StatusBadge domain="data" status={eFilterMo || eFilterCat || eFilterSpender ? 'local' : 'synced'} label={eFilterMo || eFilterCat || eFilterSpender ? 'Đang lọc' : 'Toàn bộ'} />
          </div>
          {/* Desktop */}
          <div className="fin-exp-desktop" style={{ overflowX: 'auto' }}>
            <style>{`.fin-exp-desktop{display:block}.fin-exp-mobile{display:none}@media(max-width:767px){.fin-exp-desktop{display:none!important}.fin-exp-mobile{display:block!important}}`}</style>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ngày', 'Nội dung', 'Hạng mục', 'Người chi', 'Số tiền', ''].map((h, i) => (
                    <th key={i} style={{ ...TH_SHARED, textAlign: i >= 4 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0
                  ? <tr><td colSpan={6}><EmptyState title="Chưa có phiếu chi phù hợp" subtitle="Phiếu chi mới hoặc kết quả lọc sẽ hiển thị tại đây." /></td></tr>
                  : pagedExpense.map((e, i) => (
                    <tr key={`${e.docNum}-${i}`} onMouseEnter={() => setHovExp(i)} onMouseLeave={() => setHovExp(null)} style={trStyle(i, hovExp === i)}>
                      <td style={{ ...TD_SHARED, fontSize: 12, color: '#475569' }}>{formatDate(e.date)}</td>
                      <td style={TD_SHARED}>{e.description}</td>
                      <td style={TD_SHARED}><Badge color="amber">{e.category}</Badge></td>
                      <td style={TD_SHARED}>{e.spender}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'right', fontWeight: 700, color: '#e11d48' }}>-{fmtVND(e.amount)}</td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                          <button onClick={() => onViewExpense(e)} style={{ width: 30, height: 30, background: '#fff1f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={13} color="#dc2626" /></button>
                          <button onClick={() => onEditExpense(e)} style={{ width: 30, height: 30, background: '#eef2ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={13} color="#6366f1" /></button>
                          <button onClick={() => onDeleteExpense(e)} style={{ width: 30, height: 30, background: '#fff1f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} color="#f87171" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="fin-exp-mobile">
            {filteredExpenses.length === 0
              ? <EmptyState title="Chưa có phiếu chi phù hợp" subtitle="Phiếu chi mới hoặc kết quả lọc sẽ hiển thị tại đây." />
              : pagedExpense.map((e, i) => (
                <div key={`${e.docNum}-mb-${i}`} style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f9fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{e.description}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{formatDate(e.date)} · {e.category}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#e11d48', flexShrink: 0 }}>-{fmtVND(e.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => onViewExpense(e)} style={{ flex: 1, padding: '6px 0', background: '#fff1f2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Xem phiếu</button>
                    <button onClick={() => onEditExpense(e)} style={{ flex: 1, padding: '6px 0', background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => onDeleteExpense(e)} style={{ flex: 1, padding: '6px 0', background: '#fff1f2', color: '#f87171', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
                  </div>
                </div>
              ))
            }
          </div>
          {/* Phân trang chi tiêu */}
          <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
            <Pager page={pgExpense} total={filteredExpenses.length} perPage={EXPENSE_IPP} setPage={setPgExpense} showTotal />
          </div>
        </div>
      )}

      {/* ══ BÁO CÁO DOANH THU ══ */}
      {finSub === 'report' && (
        <FinanceReportTab
          students={students}
          payments={payments}
          expenses={expenses}
          tlogs={tlogs}
          uClasses={uClasses}
          summary={summary}
          curMo={curMo}
          curYr={curYr}
          isPaid={isPaid}
          baseTuition={baseTuition}
          onOpenSub={openFinanceSub}
        />
      )}

    </div>
  );
}
