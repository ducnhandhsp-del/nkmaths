/**
 * FinanceTab.tsx — v28.2
 * ✅ Xoá khối thống kê ở Sổ cái và Chi tiêu
 * ✅ Giữ StatBlock tóm tắt chỉ ở header chung + tab Công nợ
 * ✅ AppTable (header màu xanh đậm, góc vuông)
 * ✅ Công nợ đặt ĐẦU TIÊN
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
import React, { useMemo, useState, useCallback } from 'react';
import { DollarSign, TrendingDown, Eye, Edit3, Trash2, Plus, Copy, Check } from 'lucide-react';
import { fmtVND, formatDate, capitalizeName, exportCSV, parseDMY, isStudentActive } from './helpers';
import { Badge, Pager, FilterTabs } from './dsComponents';
import { FAB } from './AppComponents';
import { StatBlock, StatGrid, TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle, fmtM } from './AppComponents';
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

const IPP = 10;
const LEDGER_IPP = 20; // phân trang sổ cái
const EXPENSE_IPP = 20; // phân trang chi tiêu

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

export default function FinanceTab({
  summary, payments, expenses, students, uClasses, tlogs,
  curMo, curYr, qF, setQF, fMo, setFMo, fTch, setFTch, fFC, setFFC, fSt, setFSt,
  pgF, setPgF, filtFin, isPaid, zaloTpl, baseTuition, schoolYear,
  onViewInvoice, onViewFinance, onShowFAB, onEditPayment, onDeletePayment, onEditExpense, onDeleteExpense, onViewExpense,
}: Props) {
  const [finSub, setFinSub] = useState<FinanceSub>('debt');
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const pagedFin = filtFin.slice((pgF - 1) * IPP, pgF * IPP);
  // FIX: bỏ khai báo [fM, fY] — biến không dùng trong component (logic filter ở useDomains)
  const makeZaloMsg = (s: Student) => zaloTpl.replace('[Thang]', String(curMo)).replace('[Ten]', s.name).replace('[SoTien]', fmtVND(baseTuition));
  const fmtDesc = (desc: string) => (desc||'').replace(/[Hh]ọc phí\s+tháng\s+0?(\d{1,2})\s+năm\s+(\d{4})/i, 'HP T$1/$2');

  // FIX: dùng isStudentActive từ helpers, nhất quán toàn app
  const activeStudents = useMemo(() => students.filter(isStudentActive), [students]);
  const paidNow = useMemo(() => activeStudents.filter(s => isPaid(s.id, curMo, curYr)).length, [activeStudents, isPaid, curMo, curYr]);

  // Phân trang sổ cái
  const [pgLedger, setPgLedger] = useState(1);
  const pagedLedger = useMemo(() => {
    const sorted = payments.slice().reverse();
    return sorted.slice((pgLedger - 1) * LEDGER_IPP, pgLedger * LEDGER_IPP);
  }, [payments, pgLedger]);

  // Phân trang chi tiêu
  const [pgExpense, setPgExpense] = useState(1);
  const pagedExpense = useMemo(() => {
    const sorted = expenses.slice().reverse();
    return sorted.slice((pgExpense - 1) * EXPENSE_IPP, pgExpense * EXPENSE_IPP);
  }, [expenses, pgExpense]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header + sub-tabs + filters inline */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, flexShrink: 0 }}>Tài chính</h2>
        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
        {/* Công nợ FIRST */}
        <div style={{ padding: 3, background: '#f1f5f9' }}>
          <FilterTabs variant="segment" size="sm" active={finSub} onChange={id => setFinSub(id as FinanceSub)}
            tabs={[
              { id: 'debt',   label: '⚠ Công nợ' },
              { id: 'ledger', label: '📋 Sổ cái' },
              { id: 'expense',label: '📉 Chi tiêu' },
            ]} />
        </div>

        {/* Debt filters inline */}
        {finSub === 'debt' && (<>
          <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
          <input type="month" value={fMo ? `${fMo.split('/')[1]}-${fMo.split('/')[0].padStart(2,'0')}` : ''}
            onChange={e => { const [y,m] = e.target.value.split('-'); setFMo(`${m}/${y}`); setPgF(1); }}
            style={{ background: 'white', color: '#0f172a', padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12, outline: 'none' }} />
          <select value={fSt} onChange={e => { setFSt(e.target.value); setPgF(1); }} style={{ background: 'white', color: '#0f172a', padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
            <option value="unpaid">Chưa đóng</option><option value="paid">Đã đóng</option><option value="">Tất cả</option>
          </select>
          <select value={fFC} onChange={e => { setFFC(e.target.value); setPgF(1); }} style={{ background: 'white', color: '#0f172a', padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tất cả lớp</option>
            {uClasses.map(c => <option key={c['Mã Lớp']} value={c['Mã Lớp']}>{c['Mã Lớp']}</option>)}
          </select>
          <span style={{ fontSize: 12, fontWeight: 700, color: fSt === 'unpaid' ? '#e11d48' : '#059669', background: fSt === 'unpaid' ? '#fff1f2' : '#ecfdf5', padding: '5px 10px' }}>{filtFin.length} HS</span>
        </>)}
      </div>

      {/* Summary StatBlocks — chỉ hiện ở Công nợ */}
      {finSub === 'debt' && (
        <>
          <StatGrid>
            <StatBlock icon={DollarSign} value={fmtM(totalRevenue)} label="Tổng thu"    sub="toàn niên khóa"  gradient="linear-gradient(135deg,#10b981,#059669)" />
            <StatBlock icon={TrendingDown} value={fmtM(totalExpense)} label="Tổng chi"  sub="toàn niên khóa"  gradient="linear-gradient(135deg,#f43f5e,#e11d48)" />
            <StatBlock icon={DollarSign} value={fmtM(totalRevenue-totalExpense)} label="Lợi nhuận" sub={(totalRevenue-totalExpense)>=0?'Dương':'Âm'} gradient={(totalRevenue-totalExpense)>=0?'linear-gradient(135deg,#6366f1,#4f46e5)':'linear-gradient(135deg,#f97316,#ea580c)'} />
            <StatBlock icon={DollarSign} value={`${paidNow}/${activeStudents.length}`} label={`Đóng phí T${curMo}`} sub="học sinh đang học đã đóng" gradient="linear-gradient(135deg,#0ea5e9,#2563eb)" />
          </StatGrid>
          <p style={{ fontSize:11, color:'#94a3b8', margin:'-4px 0 0', fontStyle:'italic' }}>
            ※ Tổng thu/chi tính toàn bộ {payments.length} phiếu thu · {expenses.length} phiếu chi từ đầu niên khóa. Xem theo tháng cụ thể tại tab <strong style={{ color:'#6366f1' }}>Báo cáo → Doanh thu</strong>.
          </p>
        </>
      )}

      {/* ══ CÔNG NỢ ══ */}
      {finSub === 'debt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Niên khóa:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '2px 10px' }}>{schoolYear}</span>
            <button onClick={() => exportCSV(`cong-no-t${curMo}-${curYr}`,
              ['Mã HS', 'Họ tên', 'Lớp', 'SĐT phụ huynh', 'Tháng bắt đầu', 'Số tháng nợ (niên khóa)', 'Tổng nợ (đ)'],
              // FIX: xuất đúng danh sách đang hiển thị (filtFin), không re-filter lại theo logic khác
              filtFin.map(s => {
                const billable = schoolYearMonths.filter(fm => isMonthBillable(s, fm));
                const u = billable.filter(fm => !isPaid(s.id, fm.m, fm.y)).length;
                return [s.id, s.name, s.classId, s.parentPhone || '', s.startDate || '', u, u * baseTuition];
              })
            )} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#059669', border: 'none', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              📥 Xuất CSV
            </button>
          </div>
          <div style={TABLE_WRAP}>
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
                  ? <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Không có dữ liệu</td></tr>
                  : pagedFin.map((s, rowIdx) => {
                    const ph = String(s.parentPhone || '').replace(/\D/g, '');
                    const isInactive = s.status === 'inactive' || (s.endDate && s.endDate !== '---' && s.endDate !== '');

                    // Chỉ tính tháng mà học sinh thực sự phải đóng
                    const billableMonths = schoolYearMonths.filter(fm => isMonthBillable(s, fm));
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
                              const isCurM = fm.m === curMo && fm.y === curYr;

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
                              } else {
                                // Billable nhưng chưa đóng
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
                            {ph.length >= 9 && (<>
                              {/* FIX: Zalo không hỗ trợ pre-fill qua URL — bỏ ?text=
                                  Thay bằng nút copy message riêng */}
                              <button
                                onClick={() => copyMsg(s.id, makeZaloMsg(s))}
                                title="Copy nội dung nhắc phí"
                                style={{ width: 28, height: 28, background: copiedId === s.id ? '#ecfdf5' : '#f0fdf4', border: `1px solid ${copiedId === s.id ? '#a7f3d0' : '#bbf7d0'}`, color: copiedId === s.id ? '#059669' : '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                {copiedId === s.id ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                              <a href={`https://zalo.me/${ph}`} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#0068FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: 6 }} title="Mở Zalo PH (copy nội dung trước)"><ZaloIcon /></a>
                            </>)}
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
            <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <Pager page={pgF} total={filtFin.length} perPage={IPP} setPage={setPgF} showTotal />
            </div>
          </div>
        </div>
      )}

      {/* ══ SỔ CÁI — NO stat blocks ══ */}
      {finSub === 'ledger' && (
        <div style={TABLE_WRAP}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <DollarSign size={14} color="#10b981" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Thu học phí ({payments.length} phiếu thu)</p>
            <button onClick={() => exportCSV('phieu-thu',
              ['Ngày', 'Số CT', 'Học sinh', 'Người nộp', 'Nội dung', 'Hình thức', 'Số tiền (đ)'],
              payments.slice().reverse().map(p => [p.date, p.docNum, p.studentName, p.payer || '', p.description, p.method || '', p.amount])
            )} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#059669', border: 'none', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              📥 Xuất CSV
            </button>
          </div>
          {/* Desktop */}
          <div className="fin-desktop" style={{ overflowX: 'auto' }}>
            <style>{`.fin-desktop{display:block}.fin-mobile{display:none}@media(max-width:767px){.fin-desktop{display:none!important}.fin-mobile{display:block!important}}`}</style>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Thời gian', 'Học sinh', 'Người nộp', 'Nội dung', 'Số tiền', ''].map((h, i) => (
                    <th key={i} style={{ ...TH_SHARED, textAlign: i >= 4 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0
                  ? <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có phiếu thu</td></tr>
                  : pagedLedger.map((p, i) => (
                    <tr key={i} onMouseEnter={() => setHovPay(i)} onMouseLeave={() => setHovPay(null)} style={trStyle(i, hovPay === i)}>
                      <td style={{ ...TD_SHARED, fontSize: 12, color: '#475569' }}>{formatDate(p.date)}</td>
                      <td style={TD_SHARED}>
                        {(() => {
                          const st = students.find(s => s.id === p.studentId);
                          return (
                            <p style={{ fontWeight:600, margin:0, fontSize:13, color: st?'#6366f1':'#1e293b', cursor:st?'pointer':'default' }}
                              onClick={() => st && onViewFinance(st)} title={st?'Xem hồ sơ tài chính':undefined}>
                              {capitalizeName(p.studentName)}
                            </p>
                          );
                        })()}
                      </td>
                      <td style={TD_SHARED}>{p.payer || '---'}</td>
                      <td style={TD_SHARED}>{fmtDesc(p.description)}</td>
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
            {payments.length === 0
              ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '32px 16px', fontSize: 13 }}>Chưa có phiếu thu</p>
              : pagedLedger.map((p, i) => (
                <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f9fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize:13, fontWeight:700, margin:0, ...(students.find(s=>s.id===p.studentId) ? {color:'#6366f1',cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted' as const,textUnderlineOffset:3} : {color:'#0f172a'}) }}
                        onClick={() => { const st=students.find(s=>s.id===p.studentId); if(st) onViewFinance(st); }}>
                        {capitalizeName(p.studentName)}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{formatDate(p.date)} · {p.method || '---'}</p>
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
            <Pager page={pgLedger} total={payments.length} perPage={LEDGER_IPP} setPage={setPgLedger} showTotal />
          </div>
        </div>
      )}
      {finSub === 'expense' && (
        <div style={TABLE_WRAP}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <TrendingDown size={14} color="#f87171" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Chi tiêu ({expenses.length} phiếu chi)</p>
            <button onClick={() => exportCSV('phieu-chi',
              ['Ngày', 'Số CT', 'Nội dung', 'Hạng mục', 'Người chi', 'Số tiền (đ)'],
              expenses.slice().reverse().map(e => [e.date, e.docNum, e.description, e.category, e.spender || '', e.amount])
            )} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#059669', border: 'none', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              📥 Xuất CSV
            </button>
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
                {expenses.length === 0
                  ? <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có phiếu chi</td></tr>
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
            {expenses.length === 0
              ? <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '32px 16px', fontSize: 13 }}>Chưa có phiếu chi</p>
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
            <Pager page={pgExpense} total={expenses.length} perPage={EXPENSE_IPP} setPage={setPgExpense} showTotal />
          </div>
        </div>
      )}

      <FAB onClick={onShowFAB} label="Thêm phiếu thu/chi" icon={Plus} color="#059669" shadow="0 8px 24px rgba(5,150,105,0.5)" />
    </div>
  );
}
