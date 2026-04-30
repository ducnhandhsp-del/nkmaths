/**
 * OverviewTab.tsx — v27.1
 * ✅ 4 KPI cards tích hợp luôn action (click để thêm/xem)
 * ✅ 2 banner "Lịch dạy hôm nay" theo từng GV
 * ✅ Xoá 4 ô thao tác riêng
 * ✅ StatBlock chuẩn chung
 */
import React, { useMemo, useState } from 'react';
import { Users, BookOpen, DollarSign, Library, CalendarCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fmtVND, formatDate, parseDMY, capitalizeName, isStudentActive } from './helpers';
import { Grid2 } from './UIComponents';
import { StatBlock, StatGrid, TABLE_WRAP, fmtM } from './AppComponents';
import { groupByMonth } from './aggregations';
import type { Student, Payment, Expense, SummaryData } from './types';
import type { Screen } from './types';

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
const DAYS_VN = ['CN','T2','T3','T4','T5','T6','T7'];

/* ── Today's schedule banner ── */
function TodaySchedule({ uClasses }: { uClasses: any[] }) {
  const todayIdx  = new Date().getDay(); // 0=Sun
  const todayCode = DAYS_VN[todayIdx];

  function classesToday(teacherName: string) {
    const keyword = teacherName.split(' ').pop()?.toLowerCase() || '';
    return uClasses
      .filter(c => {
        const gv = String(c['Giáo viên'] || '').toLowerCase();
        if (!gv.includes(keyword)) return false;
        const buois = [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']].filter(Boolean);
        return buois.some(b => String(b).trim().startsWith(todayCode));
      })
      .map(c => {
        const buois = [c['Buổi 1'], c['Buổi 2'], c['Buổi 3']].filter(Boolean);
        const todayBuois = buois.filter(b => String(b).trim().startsWith(todayCode));
        const times = todayBuois.map(b => b.replace(todayCode, '').trim()).filter(Boolean);
        return { classId: c['Mã Lớp'], times };
      })
      .sort((a, b) => {
        const toMin = (t: string) => { const m = t.match(/(\d+)[h:](\d*)/); return m ? parseInt(m[1]) * 60 + parseInt(m[2] || '0') : 0; };
        return toMin(a.times[0] || '') - toMin(b.times[0] || '');
      });
  }

  // Lấy tất cả GV duy nhất từ classes — không hardcode
  const uniqueTeachers = [...new Set(uClasses.map(c => c['Giáo viên']).filter(Boolean))] as string[];
  const todayName = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][todayIdx];

  const BANNER_COLORS = [
    { color: '#6366f1', bg: '#f5f3ff', border: '#ddd6fe' },
    { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' },
    { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ];

  if (uniqueTeachers.length === 0) return null;

  return (
    <div style={{ border: '1px solid #e8edf2', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      {uniqueTeachers.map((teacherName, i) => {
        const classes = classesToday(teacherName);
        const { color, bg, border } = BANNER_COLORS[i % BANNER_COLORS.length];
        return (
          <React.Fragment key={teacherName}>
            {i > 0 && <div style={{ height: 1, background: '#e2e8f0' }} />}
            <div style={{ background: bg, border: `0px solid ${border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <CalendarCheck size={15} color={color} />
                <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                  {teacherName} · {todayName}:
                </span>
              </div>
              {classes.length === 0
                ? <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Không có lớp</span>
                : classes.map((c, j) => (
                    <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: `1px solid ${border}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, color }}>
                      <span style={{ background: color, color: 'white', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{c.classId}</span>
                      {c.times.length > 0 && <span style={{ color: '#64748b', fontWeight: 600 }}>{c.times.join(', ')}</span>}
                    </span>
                  ))
              }
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Smart Alerts ── */
function SmartAlerts({ students, tlogs, payments, curMo, curYr, isPaid, goScreen }: {
  students: Student[]; tlogs: any[]; payments: Payment[]; curMo: number; curYr: number;
  isPaid: (s: string, m: number, y: number) => boolean; goScreen: (s: Screen) => void;
}) {
  const [dA, setDA] = useState(false), [dF, setDF] = useState(false);
  const absentS = useMemo(() => {
    const byClass = new Map<string, any[]>();
    [...tlogs].sort((a, b) => parseDMY(b.rawDate || b.date) - parseDMY(a.rawDate || a.date))
      .forEach(l => { if (!byClass.has(l.classId)) byClass.set(l.classId, []); byClass.get(l.classId)!.push(l); });
    return students.filter(isStudentActive).map(s => {
      const logs = (byClass.get(s.classId) || []).slice(0, 8);
      let streak = 0;
      for (const log of logs) {
        // Support both GAS v29 (trangThai camelCase) and legacy ('Trạng thái')
        const a = (log.attendanceList || []).find((a: any) =>
          (a.maHS || a['Mã HS'] || a.MaHS) === s.id
        );
        if (!a) continue;
        const status = a.trangThai || a['Trạng thái'] || a.TrangThai || '';
        if (status === 'Vắng') streak++; else if (status) break;
      }
      return { ...s, streak };
    }).filter(s => s.streak >= 2).sort((a, b) => b.streak - a.streak);
  }, [students, tlogs]);
  const unpaidS = useMemo(() => students.filter(s => isStudentActive(s) && !isPaid(s.id, curMo, curYr)), [students, isPaid, curMo, curYr]);

  const alerts = [
    !dA && absentS.length > 0 && { id: 'a', icon: '⚠️', title: `${absentS.length} học sinh vắng liên tiếp`, desc: absentS.slice(0, 3).map(s => `${s.name}(${s.streak})`).join(', ') + (absentS.length > 3 ? '...' : ''), action: 'Xem vắng', onAction: () => goScreen('operations'), onDismiss: () => setDA(true), borderColor: '#fca5a5', bg: '#fff1f2', titleColor: '#be123c', iconBg: '#ffe4e6' },
    !dF && unpaidS.length > 0 && { id: 'f', icon: '💰', title: `${unpaidS.length} HS chưa nộp học phí T${curMo}`, desc: unpaidS.slice(0, 3).map(s => s.name).join(', ') + (unpaidS.length > 3 ? '...' : ''), action: 'Xem công nợ', onAction: () => goScreen('finance'), onDismiss: () => setDF(true), borderColor: '#fcd34d', bg: '#fffbeb', titleColor: '#92400e', iconBg: '#fef3c7' },
  ].filter(Boolean) as any[];

  if (!alerts.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a: any) => (
        <div key={a.id} style={{ background: a.bg, border: `1px solid ${a.borderColor}`, padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>{a.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: a.titleColor, margin: 0 }}>{a.title}</p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.desc}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <button onClick={a.onAction} style={{ padding: '5px 12px', border: `1px solid ${a.borderColor}`, background: 'white', color: a.titleColor, fontWeight: 700, fontSize: 11, cursor: 'pointer', borderRadius: 6 }}>{a.action}</button>
            <button onClick={a.onDismiss} style={{ width: 24, height: 24, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5 }}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Activity feed ── */
function timeAgo(dateStr: string): string {
  const ts = parseDMY(dateStr); if (!ts) return dateStr;
  const diff = Date.now() - ts, m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 2) return 'vừa xong'; if (m < 60) return `${m}p trước`; if (h < 24) return `${h}h trước`; if (d < 7) return `${d}ngày trước`;
  return formatDate(dateStr);
}

/* ── Revenue Chart (6 tháng gần nhất) ── */
function RevenueChart({ payments, expenses, students, isPaid, onGoFinance }: {
  payments: Payment[]; expenses: Expense[]; students: Student[];
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onGoFinance: () => void;
}) {
  const data = useMemo(() => groupByMonth(payments, expenses, students, isPaid, 6), [payments, expenses, students, isPaid]);
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expense)), 1);

  return (
    <div style={{ ...TABLE_WRAP, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Doanh thu 6 tháng gần nhất</p>
        </div>
        <button onClick={onGoFinance} style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}>Chi tiết →</button>
      </div>

      {/* Chart bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {data.map((d, i) => {
          const revH = Math.round((d.revenue / maxVal) * 100);
          const expH = Math.round((d.expense / maxVal) * 100);
          const isCur = i === data.length - 1;
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              {/* Bars */}
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 100 }}>
                <div title={`Thu: ${fmtVND(d.revenue)}`} style={{ flex: 1, height: `${revH}%`, minHeight: d.revenue > 0 ? 3 : 0, background: isCur ? '#059669' : '#a7f3d0', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                <div title={`Chi: ${fmtVND(d.expense)}`} style={{ flex: 1, height: `${expH}%`, minHeight: d.expense > 0 ? 3 : 0, background: isCur ? '#e11d48' : '#fca5a5', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
              </div>
              {/* Label tháng */}
              <p style={{ fontSize: 10, fontWeight: isCur ? 700 : 500, color: isCur ? '#0f172a' : '#94a3b8', margin: 0, whiteSpace: 'nowrap' }}>{d.label}</p>
            </div>
          );
        })}
      </div>

      {/* Legend + tổng tháng hiện tại */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', display: 'inline-block' }} />Thu
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e11d48', display: 'inline-block' }} />Chi
          </span>
        </div>
        {data.length > 0 && (() => {
          const cur = data[data.length - 1];
          const net = cur.revenue - cur.expense;
          return (
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>+{fmtM(cur.revenue)}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e11d48' }}>-{fmtM(cur.expense)}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: net >= 0 ? '#6366f1' : '#f97316' }}>{net >= 0 ? '+' : ''}{fmtM(net)}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

interface Props {
  students: Student[]; payments: Payment[]; expenses: Expense[];
  tlogs: any[]; uClasses: any[]; summary: SummaryData | null;
  curMo: number; curYr: number; paidNow: number;
  goScreen: (s: Screen) => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  onAddDiary: (classId?: string) => void;
  onAddPayment: () => void;
  onAddStudent: () => void;
  onViewMaterials: () => void;
  materialCount?: number;
  prevPaidNow?: number; prevStudentCount?: number; prevTlogCount?: number;
}

export default function OverviewTab({
  students, payments, expenses, tlogs, uClasses, summary, curMo, curYr, paidNow,
  goScreen, isPaid, onAddDiary, onAddPayment, onAddStudent, onViewMaterials, materialCount = 0,
  prevPaidNow, prevStudentCount, prevTlogCount,
}: Props) {
  const activeStudents = students.filter(isStudentActive);
  const paidPct = activeStudents.length > 0 ? Math.round(paidNow / activeStudents.length * 100) : 0;

  const hocLuc = useMemo(() => {
    const m: Record<string, number> = {};
    activeStudents.forEach(s => {
      const k = (s.academicLevel && s.academicLevel.trim()) ? s.academicLevel.trim() : 'Chưa xác định';
      m[k] = (m[k] || 0) + 1;
    });
    const ORDER = ['Xuất sắc','Giỏi','Khá','Trung bình','Yếu','Chưa xác định'];
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const ai = ORDER.indexOf(a.name), bi = ORDER.indexOf(b.name);
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
  }, [activeStudents]);
  const theoKhoi = useMemo(() => {
    const m: Record<string, number> = {};
    activeStudents.forEach(s => { const k = s.grade || 'Khác'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m)
      .sort((a, b) => {
        const na = parseInt(a[0]), nb = parseInt(b[0]);
        // Ưu tiên sort số (6,7,8,9,10,11,12) trước, string sau
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        if (!isNaN(na)) return -1;
        if (!isNaN(nb)) return 1;
        return a[0].localeCompare(b[0]);
      })
      .map(([name, value]) => ({ name, value }));
  }, [activeStudents]);

  const teachingActs = useMemo(() => {
    const acts: any[] = [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // Chỉ hiện HS mới đăng ký trong 30 ngày gần nhất
    students.forEach(s => {
      const ts = parseDMY(s.startDate || '');
      if (ts > thirtyDaysAgo) acts.push({ iconBg: '#ecfdf5', iconColor: '#059669', desc: `HS mới: ${capitalizeName(s.name)} — Lớp ${s.classId}`, time: ts, dateStr: s.startDate, type: 'student' });
    });
    tlogs.forEach((l, i) => { const ts = parseDMY(l.rawDate || l.date || ''); if (ts) acts.push({ iconBg: '#f5f3ff', iconColor: '#7c3aed', desc: `${l.classId}: ${l.content || '---'} · ${l.present ?? 0} có mặt`, time: ts + (tlogs.length - i), dateStr: l.date, type: 'diary' }); });
    return acts.filter(a => a.time > 0).sort((a, b) => b.time - a.time).slice(0, 12);
  }, [students, tlogs]);

  const finActs = useMemo(() => {
    const acts: any[] = [];
    payments.forEach(p => { const ts = parseDMY(p.date || ''); if (ts) acts.push({ iconBg: '#ecfdf5', iconColor: '#059669', desc: `Thu ${fmtVND(p.amount)} — ${p.studentName || p.payer || '---'}`, time: ts, dateStr: p.date, type: 'income' }); });
    expenses.forEach(e => { const ts = parseDMY(e.date || ''); if (ts) acts.push({ iconBg: '#fff1f2', iconColor: '#e11d48', desc: `Chi ${fmtVND(e.amount)} — ${e.description || e.category || '---'}`, time: ts, dateStr: e.date, type: 'expense' }); });
    return acts.filter(a => a.time > 0).sort((a, b) => b.time - a.time).slice(0, 12);
  }, [payments, expenses]);

  const [showAllT, setShowAllT] = useState(false);
  const [showAllF, setShowAllF] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 1. KPI StatBlocks — click to add (ABOVE banners) */}
      <StatGrid>
        <StatBlock icon={Users} value={activeStudents.length} label="Học sinh đang học"
          sub={`Tổng: ${students.length}`}
          gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
          onClick={onAddStudent} actionLabel="Thêm HS"
          delta={prevStudentCount != null ? activeStudents.length - prevStudentCount : null} />
        <StatBlock icon={BookOpen} value={tlogs.length} label="Buổi đã dạy"
          sub={`${uClasses.length} lớp`}
          gradient="linear-gradient(135deg,#0ea5e9,#6366f1)"
          onClick={() => onAddDiary()} actionLabel="Ghi buổi"
          delta={prevTlogCount != null ? tlogs.length - prevTlogCount : null} />
        <StatBlock icon={DollarSign} value={`${paidPct}%`} label={`Đóng phí T${curMo}`}
          sub={`${paidNow}/${activeStudents.length} HS`}
          gradient="linear-gradient(135deg,#10b981,#059669)"
          onClick={onAddPayment} actionLabel="Thu phí"
          delta={prevPaidNow != null ? paidNow - prevPaidNow : null} />
        <StatBlock icon={Library} value={materialCount} label="Học liệu"
          sub="Tài liệu · video · đề thi"
          gradient="linear-gradient(135deg,#14b8a6,#0d9488)"
          onClick={onViewMaterials} actionLabel="Xem liệu" />
      </StatGrid>

      {/* 2. Today's schedule banners */}
      <TodaySchedule uClasses={uClasses} />

      {/* 3. Smart Alerts */}
      <SmartAlerts students={students} tlogs={tlogs} payments={payments} curMo={curMo} curYr={curYr} isPaid={isPaid} goScreen={goScreen} />

      {/* 4. Activity feeds */}
      <Grid2 gap={14}>
        {/* Teaching feed */}
        <div style={{ ...TABLE_WRAP, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>📖</span>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1, margin: 0 }}>Dạy học gần đây</p>
            <button onClick={() => goScreen('operations')} style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Nhật ký →</button>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', flex: 1 }}>
            {teachingActs.length === 0
              ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '28px 0', fontSize: 13 }}>Chưa có hoạt động</p>
              : (showAllT ? teachingActs : teachingActs.slice(0, 6)).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 14px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.desc}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>{timeAgo(a.dateStr)}</p>
                  </div>
                </div>
              ))
            }
          </div>
          {teachingActs.length > 6 && <button onClick={() => setShowAllT(v => !v)} style={{ width: '100%', padding: 9, fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#fafafa', border: 'none', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>{showAllT ? '▲ Thu gọn' : `▼ Thêm ${teachingActs.length - 6}`}</button>}
        </div>

        {/* Finance feed */}
        <div style={{ ...TABLE_WRAP, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>💰</span>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1, margin: 0 }}>Tài chính gần đây</p>
            <button onClick={() => goScreen('finance')} style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}>Xem →</button>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', flex: 1 }}>
            {finActs.length === 0
              ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '28px 0', fontSize: 13 }}>Chưa có giao dịch</p>
              : (showAllF ? finActs : finActs.slice(0, 6)).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 14px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.desc}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>{timeAgo(a.dateStr)}</p>
                  </div>
                </div>
              ))
            }
          </div>
          {finActs.length > 6 && <button onClick={() => setShowAllF(v => !v)} style={{ width: '100%', padding: 9, fontSize: 11, fontWeight: 700, color: '#059669', background: '#fafafa', border: 'none', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>{showAllF ? '▲ Thu gọn' : `▼ Thêm ${finActs.length - 6}`}</button>}
        </div>
      </Grid2>

      {/* 5. Biểu đồ doanh thu 6 tháng — full width */}
      <RevenueChart
        payments={payments}
        expenses={expenses}
        students={students}
        isPaid={isPaid}
        onGoFinance={() => goScreen('finance')}
      />

      {/* 6. Mini charts */}
      <Grid2 gap={14}>
        <div style={{ ...TABLE_WRAP, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Học lực môn Toán</p>
          {hocLuc.length === 0
            ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '36px 0', fontSize: 13 }}>Chưa có dữ liệu</p>
            : <ResponsiveContainer width="100%" height={170}><PieChart><Pie data={hocLuc} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>{hocLuc.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 6, border: 'none', fontSize: 12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>}
        </div>
        <div style={{ ...TABLE_WRAP, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>HS theo khối lớp</p>
          {theoKhoi.length === 0
            ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '36px 0', fontSize: 13 }}>Chưa có dữ liệu</p>
            : <ResponsiveContainer width="100%" height={170}><BarChart data={theoKhoi} layout="vertical" margin={{ left: 0, right: 14 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={40} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 6, border: 'none', fontSize: 12 }} /><Bar dataKey="value" name="HS" radius={[0, 4, 4, 0]}>{theoKhoi.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>}
        </div>
      </Grid2>
    </div>
  );
}
