/**
 * ReportsTab.tsx
 * Dashboard bao cao chung: tong hop dao tao, van hanh va tai chinh tren mot man hinh.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Printer,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { exportCSV, isStudentActive, parseDMY } from './helpers';
import { Button } from './dsComponents';
import {
  ActionableKpi,
  ActionableKpiGrid,
  EmptyState,
  MobileCard,
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
}

function parseMoYr(raw: string): { m: number; y: number } | null {
  const s = raw.includes(' - ') ? raw.split(' - ')[1] : raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return { m: parseInt(s.split('/')[1], 10), y: parseInt(s.split('/')[2], 10) };
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return { m: parseInt(s.slice(5, 7), 10), y: parseInt(s.slice(0, 4), 10) };
  const ts = parseDMY(raw);
  if (!ts) return null;
  const d = new Date(ts);
  return { m: d.getMonth() + 1, y: d.getFullYear() };
}

function readFirst(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
  }
  return '';
}

function classIdOf(c: Record<string, any>) {
  return readFirst(c, ['Mã Lớp', 'MaLop', 'Ma Lop', 'MÃ£ Lá»›p', 'classId', 'id']);
}

function classNameOf(c: Record<string, any>) {
  return readFirst(c, ['Tên Lớp', 'TenLop', 'Ten Lop', 'TÃªn Lá»›p', 'name']) || classIdOf(c) || 'Lớp học';
}

function teacherOf(c: Record<string, any>) {
  return readFirst(c, ['Giáo viên', 'GiaoVien', 'Giao Vien', 'GiÃ¡o viÃªn', 'teacherName', 'teacher']) || '—';
}

function isStudentActiveInMonth(student: Student, month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1).getTime();
  const nextMonthStart = new Date(year, month, 1).getTime();
  const startTs = parseDMY(student.startDate || '');
  const endTs = parseDMY(student.endDate || '');

  if (startTs && startTs >= nextMonthStart) return false;
  if (endTs && student.endDate !== '---' && endTs < monthStart) return false;
  return isStudentActive(student) || (!!startTs && (!endTs || endTs >= monthStart));
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
    period: parseMoYr(payment.date || ''),
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

  const monthTlogs = useMemo(
    () => tlogs.filter(log => {
      const ts = parseDMY(log.date || '');
      if (!ts) return false;
      const d = new Date(ts);
      return d.getMonth() + 1 === filterMo && d.getFullYear() === filterYr;
    }),
    [tlogs, filterMo, filterYr],
  );

  const attendanceTotals = useMemo(() => {
    const present = monthTlogs.reduce((sum, log) => sum + (log.present || 0), 0);
    const absent = monthTlogs.reduce((sum, log) => sum + (log.absent || 0), 0);
    const excused = monthTlogs.reduce((sum, log) => sum + (log.excused || 0), 0);
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
      .reduce((sum, month) => sum + students.filter(s => isStudentActiveInMonth(s, month, filterYr)).length, 0);
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
    return {
      classId,
      className: classNameOf(cls),
      teacher: teacherOf(cls),
      students: activeStudents.filter(student => student.classId === classId).length,
    };
  }).filter(row => row.classId || row.students > 0)
    .sort((a, b) => b.students - a.students || a.className.localeCompare(b.className, 'vi')),
  [activeStudents, uClasses]);

  const maxRevenue = Math.max(...monthlyRevenue.map(row => row.revenue), 0);
  const totalClassStudents = classStudentRows.reduce((sum, row) => sum + row.students, 0);

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
        .report-dashboard-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,0.75fr);gap:14px}
        .report-section{background:white;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.05);overflow:hidden}
        .report-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid #eef2f7}
        .report-section-title{margin:0;font-size:14px;font-weight:900;color:#334155;text-transform:uppercase;letter-spacing:.05em}
        .report-chart{display:grid;gap:8px;padding:14px 16px}
        .report-bar-row{display:grid;grid-template-columns:42px minmax(0,1fr) 92px;align-items:center;gap:10px}
        .report-bar-track{height:20px;background:#f1f5f9;border-radius:999px;overflow:hidden}
        .report-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#4f46e5,#06b6d4)}
        .report-class-list{display:grid;gap:8px;padding:14px 16px}
        .report-class-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid #eef2f7;border-radius:12px;background:#fbfdff}
        @media(max-width:767px){
          .report-dashboard-grid{grid-template-columns:1fr}
          .report-bar-row{grid-template-columns:38px minmax(0,1fr);gap:8px}
          .report-bar-row .report-bar-value{grid-column:2;text-align:left}
          .report-section-head{padding:12px 14px}
        }
      `}</style>

      <PageToolbar
        title="Báo cáo"
        actions={(
          <>
            <Button intent="success" size="sm" onClick={handleExport}>Xuất CSV</Button>
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

      <div className="report-dashboard-grid">
        <section className="report-section" ref={revenueSectionRef}>
          <div className="report-section-head">
            <h3 className="report-section-title">📊 Doanh thu theo tháng ({filterYr})</h3>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>
              <MoneyText value={yearRevenue} compact tone="success" />
            </span>
          </div>
          {yearRevenue <= 0 ? (
            <EmptyState text="Chưa có doanh thu trong năm này" sub="Phiếu thu sẽ được tổng hợp theo tháng tại đây." compact />
          ) : (
            <div className="report-chart">
              {monthlyRevenue.map(row => {
                const width = maxRevenue > 0 ? Math.max(4, Math.round((row.revenue / maxRevenue) * 100)) : 0;
                return (
                  <div key={row.month} className="report-bar-row">
                    <span style={{ fontSize: 12, fontWeight: 900, color: row.month === filterMo ? '#4f46e5' : '#64748b' }}>T{row.month}</span>
                    <div className="report-bar-track">
                      <div className="report-bar-fill" style={{ width: `${width}%`, opacity: row.revenue > 0 ? 1 : 0.15 }} />
                    </div>
                    <span className="report-bar-value" style={{ fontSize: 12, fontWeight: 900, color: row.revenue > 0 ? '#059669' : '#94a3b8', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <MoneyText value={row.revenue} compact tone={row.revenue > 0 ? 'success' : 'neutral'} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="report-section" ref={classSectionRef}>
          <div className="report-section-head">
            <h3 className="report-section-title">👥 Học sinh theo lớp</h3>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{totalClassStudents} HS</span>
          </div>
          {classStudentRows.length === 0 ? (
            <EmptyState text="Chưa có dữ liệu lớp" sub="Danh sách lớp và sĩ số sẽ hiển thị tại đây." compact />
          ) : (
            <div className="report-class-list">
              {classStudentRows.map(row => (
                <MobileCard
                  key={row.classId || row.className}
                  title={row.className}
                  subtitle={`${row.classId || '—'} · ${row.teacher}`}
                  badge={<span style={{ fontSize: 13, fontWeight: 900, color: '#4f46e5' }}>{row.students} HS</span>}
                  tone="primary"
                  rows={[
                    { label: 'Mã lớp', value: row.classId || '—' },
                    { label: 'Giáo viên', value: row.teacher },
                  ]}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="report-section" ref={summarySectionRef}>
        <div className="report-section-head">
          <h3 className="report-section-title">Tóm tắt kỳ T{filterMo}/{filterYr}</h3>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{monthPayments.length} phiếu thu · {monthTlogs.length} buổi học</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, padding: 14 }}>
          {[
            { label: 'Thu tháng này', value: <MoneyText value={monthPayments.reduce((sum, row) => sum + (row.payment.amount || 0), 0)} compact tone="success" /> },
            { label: 'Phiếu chi trong tháng', value: expenses.filter(expense => {
              const period = parseMoYr(expense.date || '');
              return period?.m === filterMo && period?.y === filterYr;
            }).length },
            { label: 'Có mặt', value: attendanceTotals.present },
            { label: 'Vắng/Có phép', value: `${attendanceTotals.absent}/${attendanceTotals.excused}` },
          ].map(item => (
            <div key={item.label} style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: '11px 12px', background: '#fbfdff' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</p>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
