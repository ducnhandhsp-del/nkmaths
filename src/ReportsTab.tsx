/**
 * ReportsTab.tsx
 * Dashboard bao cao chung: tong hop dao tao, van hanh va tai chinh tren mot man hinh.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Download,
  Printer,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { exportCSV, fixVietnameseText, fmtVND, isLessonOffLog, parseDMY } from './helpers';
import {
  buildDataHealthReport,
  getPaymentReceiptPeriod,
  isStudentActive,
  isStudentActiveInMonth,
  parsePeriod,
} from './measures';
import { Button } from './dsComponents';
import {
  ActionableKpi,
  ActionableKpiGrid,
  EmptyState,
  MoneyText,
  PageToolbar,
} from './uiSystem';
import type { Expense, Payment, ReportsSub, Student, SummaryData } from './types';

interface Props {
  reportsSubtab?: ReportsSub;
  setReportsSubtab?: (sub: ReportsSub) => void;
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  tlogs: any[];
  uClasses: any[];
  summary: SummaryData | null;
  curMo: number;
  curYr: number;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
}

interface MonthlyRevenue {
  month: number;
  revenue: number;
  count: number;
}

interface ClassStudentRow {
  classId: string;
  className: string;
  teacher: string;
  students: number;
  paidThisMonth: number;
}

function readFirst(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return fixVietnameseText(value);
  }
  return '';
}

function classIdOf(c: Record<string, any>) {
  return readFirst(c, ['Mã Lớp', 'MaLop', 'Ma Lop', 'MÃ£ Lá»›p', 'classId', 'id']);
}

function classNameOf(c: Record<string, any>) {
  return classIdOf(c) || 'Lớp học';
}

function teacherOf(c: Record<string, any>) {
  return readFirst(c, ['Giáo viên', 'GiaoVien', 'Giao Vien', 'GiÃ¡o viÃªn', 'teacherName', 'teacher']) || '—';
}

function formatReportMoney(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${parseFloat((abs / 1_000_000_000).toFixed(1))} tỷ`;
  if (abs >= 1_000_000) return `${sign}${parseFloat((abs / 1_000_000).toFixed(1))}tr`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${sign}${abs}đ`;
}

export default function ReportsTab({
  students,
  payments,
  expenses,
  tlogs,
  uClasses,
  summary,
  curMo,
  curYr,
  isPaid,
}: Props) {
  const [filterMo, setFilterMo] = useState(curMo);
  const [filterYr, setFilterYr] = useState(curYr);
  const prevCurMoRef = useRef(curMo);
  const prevCurYrRef = useRef(curYr);
  const revenueSectionRef = useRef<HTMLElement | null>(null);
  const classSectionRef = useRef<HTMLElement | null>(null);
  const summarySectionRef = useRef<HTMLElement | null>(null);
  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    if (filterMo === 1) {
      setFilterMo(12);
      setFilterYr(y => y - 1);
    } else {
      setFilterMo(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (filterMo === 12) {
      setFilterMo(1);
      setFilterYr(y => y + 1);
    } else {
      setFilterMo(m => m + 1);
    }
  };

  const isCurrentPeriod = filterMo === curMo && filterYr === curYr;
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);

  const paymentsWithPeriod = useMemo(() => payments.map(payment => ({
    payment,
    period: getPaymentReceiptPeriod(payment),
  })), [payments]);

  const monthlyRevenue = useMemo<MonthlyRevenue[]>(() => {
    const rows = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, revenue: 0, count: 0 }));
    paymentsWithPeriod.forEach(({ payment, period }) => {
      if (period?.y !== filterYr) return;
      const row = rows[period.m - 1];
      if (!row) return;
      row.revenue += payment.amount || 0;
      row.count += 1;
    });
    return rows;
  }, [paymentsWithPeriod, filterYr]);

  const yearRevenue = useMemo(
    () => monthlyRevenue.reduce((sum, row) => sum + row.revenue, 0),
    [monthlyRevenue],
  );

  const monthPayments = useMemo(
    () => paymentsWithPeriod.filter(({ period }) => period?.m === filterMo && period?.y === filterYr),
    [paymentsWithPeriod, filterMo, filterYr],
  );
  const monthRevenue = monthPayments.reduce((sum, row) => sum + (row.payment.amount || 0), 0);
  const monthExpenseCount = expenses.filter(expense => {
    const period = parsePeriod(expense.date || '');
    return period?.m === filterMo && period?.y === filterYr;
  }).length;

  const monthTlogs = useMemo(
    () => tlogs.filter(log => {
      const period = parsePeriod(log.rawDate || log.date || '');
      return period?.m === filterMo && period?.y === filterYr;
    }),
    [tlogs, filterMo, filterYr],
  );

  const attendanceTotals = useMemo(() => {
    const countedLogs = monthTlogs.filter(log => !isLessonOffLog(log));
    const present = countedLogs.reduce((sum, log) => sum + (log.present || 0), 0);
    const absent = countedLogs.reduce((sum, log) => sum + (log.absent || 0), 0);
    const excused = countedLogs.reduce((sum, log) => sum + (log.excused || 0), 0);
    const total = present + absent + excused;
    return {
      present,
      absent,
      excused,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : null,
    };
  }, [monthTlogs]);

  const avgStudentsPerMonth = useMemo(() => {
    const total = Array.from({ length: 12 }, (_, index) => index + 1)
      .reduce((sum, month) => sum + students.filter(s => isStudentActiveInMonth(s, { m: month, y: filterYr })).length, 0);
    return Math.round(total / 12);
  }, [students, filterYr]);

  const newStudentsThisMonth = useMemo(() => students.filter(student => {
    const ts = parseDMY(student.startDate || '');
    if (!ts) return false;
    const d = new Date(ts);
    return d.getMonth() + 1 === filterMo && d.getFullYear() === filterYr;
  }).length, [students, filterMo, filterYr]);

  const classStudentRows = useMemo<ClassStudentRow[]>(() => uClasses.map(cls => {
    const classId = classIdOf(cls);
    const classStudents = activeStudents.filter(student => student.classId === classId);
    return {
      classId,
      className: classNameOf(cls),
      teacher: teacherOf(cls),
      students: classStudents.length,
      paidThisMonth: classStudents.filter(student => isPaid(student.id, filterMo, filterYr)).length,
    };
  }).filter(row => row.classId || row.students > 0)
    .sort((a, b) => b.students - a.students || a.className.localeCompare(b.className, 'vi')),
  [activeStudents, filterMo, filterYr, isPaid, uClasses]);

  const maxRevenue = Math.max(...monthlyRevenue.map(row => row.revenue), 0);
  const yearlyReceiptCount = monthlyRevenue.reduce((sum, row) => sum + row.count, 0);
  const totalClassStudents = classStudentRows.reduce((sum, row) => sum + row.students, 0);
  const dataHealth = useMemo(
    () => buildDataHealthReport({ students, classes: uClasses, payments, tlogs }),
    [students, uClasses, payments, tlogs],
  );
  const visibleHealthIssues = dataHealth.issues.filter(issue => issue.count > 0);

  const handleExport = () => {
    exportCSV(
      `bao-cao-thong-ke-${filterYr}`,
      ['Nhóm', 'Chỉ tiêu', 'Giá trị', 'Ghi chú'],
      [
        ['KPI', 'Doanh thu năm', yearRevenue, `${paymentsWithPeriod.filter(({ period }) => period?.y === filterYr).length} phiếu thu`],
        ['KPI', 'HS trung bình/tháng', avgStudentsPerMonth, 'Tính theo startDate/endDate hiện có'],
        ['KPI', 'Tỷ lệ chuyên cần', attendanceTotals.rate ?? '', `T${filterMo}/${filterYr}`],
        ['KPI', 'HS mới tháng này', newStudentsThisMonth, `T${filterMo}/${filterYr}`],
        ...monthlyRevenue.map(row => ['Doanh thu tháng', `T${row.month}/${filterYr}`, row.revenue, `${row.count} phiếu`]),
        ...classStudentRows.map(row => ['Học sinh theo lớp', row.className, row.students, row.classId]),
      ],
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        .report-dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .report-section{background:white;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.05);overflow:hidden}
        .report-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid #eef2f7}
        .report-section-title{margin:0;font-size:14px;font-weight:900;color:#334155;text-transform:uppercase;letter-spacing:.05em}
        .report-revenue-list{display:grid;gap:8px;padding:14px 16px}
        .report-revenue-row{display:grid;grid-template-columns:minmax(58px,.38fr) minmax(0,1fr) minmax(82px,.55fr);gap:10px;align-items:center;padding:10px 12px;border:1px solid #eef2f7;border-radius:12px;background:#fbfdff;min-width:0}
        .report-revenue-row.active{background:#ecfeff;border-color:#67e8f9}
        .report-revenue-row.best:not(.active){background:#f0fdf4;border-color:#86efac}
        .report-month-badge{height:30px;border-radius:9px;background:#eef2ff;color:#4f46e5;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:950;white-space:nowrap;font-variant-numeric:tabular-nums}
        .report-revenue-main{display:grid;gap:2px;min-width:0}
        .report-revenue-amount{font-size:16px;font-weight:950;color:#047857;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
        .report-revenue-sub{font-size:11px;font-weight:850;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .report-revenue-delta{justify-self:end;text-align:right;min-width:0;font-size:12px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
        .report-revenue-delta.up{color:#047857}
        .report-revenue-delta.down{color:#dc2626}
        .report-revenue-delta.flat{color:#64748b}
        .report-class-list{display:grid;gap:8px;padding:14px 16px}
        .report-class-row{display:grid;grid-template-columns:minmax(48px,64px) minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #eef2f7;border-radius:12px;background:#fbfdff}
        .report-class-code{font-size:15px;font-weight:950;color:#0f172a;white-space:nowrap}
        .report-class-teacher{font-size:12px;font-weight:850;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .report-class-metrics{display:flex;align-items:center;gap:6px;margin-top:4px;min-width:0;overflow:hidden}
        .report-class-metric{min-width:0;max-width:100%;font-size:10.5px;font-weight:850;color:#64748b;background:#f1f5f9;border-radius:999px;padding:3px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .report-class-count{font-size:13px;font-weight:950;color:#4f46e5;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:5px 10px;white-space:nowrap}
        .report-health-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;padding:14px}
        .report-health-card{border:1px solid #eef2f7;border-radius:12px;background:#fbfdff;padding:11px 12px;display:grid;gap:5px}
        .report-health-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .report-health-label{margin:0;font-size:11px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
        .report-health-count{font-size:18px;font-weight:950;color:#0f172a}
        .report-health-detail{margin:0;font-size:11px;line-height:1.35;color:#94a3b8;font-weight:750}
        .report-health-ok{margin:14px;padding:14px 16px;border:1px solid #bbf7d0;border-radius:12px;background:#ecfdf5;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .report-summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;padding:14px}
        .report-mobile-actions{display:none}
        @media(max-width:767px){
          .report-mobile-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:-6px}
          .report-mobile-actions button{width:100%;justify-content:center}
          .report-dashboard-grid{grid-template-columns:1fr}
          .report-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px}
          .report-revenue-list{padding:10px}
          .report-section-head{padding:12px 14px}
          .report-revenue-row{grid-template-columns:minmax(58px,.36fr) minmax(0,1fr);gap:8px}
          .report-revenue-delta{grid-column:2;justify-self:start;text-align:left}
          .report-class-row{grid-template-columns:minmax(52px,72px) minmax(0,1fr) auto}
          .report-class-metrics{flex-wrap:wrap}
        }
      `}</style>

      <PageToolbar
        title="Báo cáo"
        actions={(
          <>
            <Button intent="success" size="sm" icon={<Download size={13} />} onClick={handleExport}>Xuất CSV</Button>
            <Button intent="danger" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>
              In T{filterMo}
            </Button>
          </>
        )}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 10 }}>
          <button type="button" onClick={prevMonth} style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
            <ChevronLeft size={13} color="#64748b" />
          </button>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', minWidth: 78, textAlign: 'center', whiteSpace: 'nowrap' }}>T{filterMo}/{filterYr}</span>
          <button type="button" onClick={nextMonth} style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
            <ChevronRight size={13} color="#64748b" />
          </button>
          {!isCurrentPeriod && (
            <button type="button" onClick={() => { setFilterMo(curMo); setFilterYr(curYr); }} style={{ padding: '3px 8px', border: 'none', background: '#eef2ff', color: '#4f46e5', fontSize: 10, fontWeight: 900, cursor: 'pointer', borderRadius: 999 }}>
              Hiện tại
            </button>
          )}
        </div>
      </PageToolbar>
      <div className="report-mobile-actions" aria-label="Thao tác báo cáo">
        <Button intent="success" size="sm" icon={<Download size={13} />} onClick={handleExport}>Xuất CSV</Button>
        <Button intent="danger" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>
          In T{filterMo}
        </Button>
      </div>

      <ActionableKpiGrid>
        <ActionableKpi
          icon={TrendingUp}
          value={<MoneyText value={yearRevenue || summary?.totalRevenue || 0} compact tone="success" />}
          label={`Doanh thu năm ${filterYr}`}
          sub={`${paymentsWithPeriod.filter(({ period }) => period?.y === filterYr).length} phiếu thu`}
          tone="success"
          onClick={() => scrollToSection(revenueSectionRef)}
          actionLabel="Xem"
        />
        <ActionableKpi
          icon={Users}
          value={avgStudentsPerMonth}
          label="HS trung bình/tháng"
          sub={`${activeStudents.length} HS đang học hiện tại`}
          tone="primary"
          onClick={() => scrollToSection(classSectionRef)}
          actionLabel="Xem"
        />
        <ActionableKpi
          icon={BarChart3}
          value={attendanceTotals.rate === null ? '—' : `${attendanceTotals.rate}%`}
          label="Tỷ lệ chuyên cần"
          sub={`${attendanceTotals.total} lượt điểm danh T${filterMo}`}
          tone={attendanceTotals.rate !== null && attendanceTotals.rate >= 85 ? 'success' : 'warning'}
          onClick={() => scrollToSection(summarySectionRef)}
          actionLabel="Xem"
        />
        <ActionableKpi
          icon={UserPlus}
          value={newStudentsThisMonth}
          label="HS mới tháng này"
          sub={`T${filterMo}/${filterYr}`}
          tone="info"
          onClick={() => scrollToSection(classSectionRef)}
          actionLabel="Xem"
        />
      </ActionableKpiGrid>

      <section className="report-section" ref={summarySectionRef}>
        <div className="report-section-head">
          <h3 className="report-section-title">Tóm tắt kỳ T{filterMo}/{filterYr}</h3>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{monthPayments.length} phiếu thu · {monthTlogs.length} buổi học</span>
        </div>
        <div className="report-summary-grid">
          {[
            { label: 'Thu tháng này', value: <MoneyText value={monthRevenue} compact tone="success" /> },
            { label: 'Phiếu chi trong tháng', value: monthExpenseCount },
            { label: 'Có mặt', value: attendanceTotals.present },
            { label: 'Vắng/Có phép', value: `${attendanceTotals.absent}/${attendanceTotals.excused}` },
          ].map(item => (
            <div key={item.label} style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: '11px 12px', background: '#fbfdff', minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</p>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: '#0f172a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="report-dashboard-grid">
        <section className="report-section" ref={revenueSectionRef}>
          <div className="report-section-head">
            <h3 className="report-section-title">Thống kê doanh thu tháng ({filterYr})</h3>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>
              {formatReportMoney(yearRevenue)} · {yearlyReceiptCount} phiếu
            </span>
          </div>
          {yearRevenue <= 0 ? (
            <EmptyState text="Chưa có doanh thu trong năm này" sub="Phiếu thu sẽ được tổng hợp theo tháng tại đây." compact />
          ) : (
            <div className="report-revenue-list">
              {monthlyRevenue.map(row => {
                const isActive = row.month === filterMo;
                const isBest = row.revenue > 0 && row.revenue === maxRevenue;
                const avgReceipt = row.count > 0 ? Math.round(row.revenue / row.count) : 0;
                const yearShare = yearRevenue > 0 ? Math.round((row.revenue / yearRevenue) * 100) : 0;
                return (
                  <div key={row.month} className={`report-revenue-row ${isActive ? 'active' : ''} ${isBest ? 'best' : ''}`}>
                    <span className="report-month-badge">T{row.month}/{String(filterYr).slice(2)}</span>
                    <div className="report-revenue-main">
                      <span className="report-revenue-amount" title={fmtVND(row.revenue)}>{formatReportMoney(row.revenue)}</span>
                      <span className="report-revenue-sub" title={`Trung bình ${fmtVND(avgReceipt)} / phiếu`}>
                        {row.count} phiếu · TB {formatReportMoney(avgReceipt)}
                      </span>
                    </div>
                    <span className="report-revenue-delta flat" title={`${yearShare}% doanh thu năm ${filterYr}`}>
                      {yearShare}% năm
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="report-section" ref={classSectionRef}>
          <div className="report-section-head">
            <h3 className="report-section-title">Học sinh theo lớp</h3>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{totalClassStudents} HS</span>
          </div>
          {classStudentRows.length === 0 ? (
            <EmptyState text="Chưa có dữ liệu lớp" sub="Danh sách lớp và sĩ số sẽ hiển thị tại đây." compact />
          ) : (
            <div className="report-class-list">
              {classStudentRows.map(row => {
                const sharePct = totalClassStudents > 0 ? Math.round((row.students / totalClassStudents) * 100) : 0;
                return (
                  <div key={row.classId || row.className} className="report-class-row">
                    <div className="report-class-code">{row.classId || '—'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="report-class-teacher">{row.teacher || 'Chưa phân công'}</div>
                      <div className="report-class-metrics">
                        <span className="report-class-metric">Đã thu {row.paidThisMonth}/{row.students}</span>
                        <span className="report-class-metric">{sharePct}% tổng HS</span>
                      </div>
                    </div>
                    <div className="report-class-count">{row.students} HS</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="report-section">
        <div className="report-section-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <DatabaseZap size={15} color={dataHealth.tone === 'success' ? '#059669' : dataHealth.tone === 'danger' ? '#dc2626' : '#d97706'} />
            <h3 className="report-section-title">Sức khỏe dữ liệu</h3>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, color: dataHealth.totalIssues > 0 ? '#d97706' : '#059669' }}>
            {dataHealth.totalIssues > 0 ? `${dataHealth.totalIssues} cần rà` : 'Ổn'}
          </span>
        </div>
        {visibleHealthIssues.length === 0 ? (
          <div className="report-health-ok">
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 950, color: '#047857' }}>Dữ liệu chính đang ổn</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 750, color: '#059669' }}>Không phát hiện học sinh sai lớp, lịch thiếu, phiếu thu lệch hoặc buổi học thiếu điểm danh.</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 950, color: '#047857', whiteSpace: 'nowrap' }}>0 lỗi</span>
          </div>
        ) : (
          <div className="report-health-grid">
            {visibleHealthIssues.map(issue => {
              const color = issue.tone === 'danger' ? '#dc2626' : '#d97706';
              const bg = issue.tone === 'danger' ? '#fff1f2' : '#fffbeb';
              return (
                <div key={issue.key} className="report-health-card" style={{ background: bg }}>
                  <div className="report-health-top">
                    <p className="report-health-label">{issue.label}</p>
                    <span className="report-health-count" style={{ color }}>{issue.count}</span>
                  </div>
                  <p className="report-health-detail">{issue.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
