import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, DollarSign, Printer, Check, TrendingUp, TrendingDown, Calendar, Users, FileText, Wallet } from 'lucide-react';
import { fmtVND, formatDate, makeVietQR, BANK_DEFAULT, toInputDate, localDateStr } from './helpers';
import { Button, IconButton, FilterTabs } from './dsComponents';
import type { Student, Payment, Expense } from './types';

/* ─── Layout constants (same pattern as DiaryModal) ──────────────── */
const FS_WRAP: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200, display: 'flex',
  alignItems: 'flex-end', justifyContent: 'center',
  background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)',
};
const FS_DLG: React.CSSProperties = {
  background: 'white', width: '100%', maxWidth: 900,
  maxHeight: '95dvh', borderRadius: '12px 12px 0 0',
  overflow: 'hidden', display: 'flex', flexDirection: 'column',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.28)',
};

/* ─── SBox: section card (same as DiaryModal) ─────────────────────── */
function SBox({ color, icon: Icon, title, children, stretch }: {
  color: string; icon: any; title: string; children: React.ReactNode; stretch?: boolean;
}) {
  return (
    <div style={{ borderRadius: 8, border: '1px solid #e8edf2', overflow: 'hidden', background: 'white', ...(stretch && { display: 'flex', flexDirection: 'column', height: '100%' }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#F5F7FA', borderBottom: '1px solid #e8edf2', flexShrink: 0 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, ...(stretch && { flex: 1 }) }}>{children}</div>
    </div>
  );
}

/* ─── LField: label + input wrapper ───────────────────────────────── */
function LField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─── Shared input / select styles ───────────────────────────────── */
const INP: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 500,
  color: '#0f172a', outline: 'none', background: 'white',
  fontFamily: 'inherit', boxSizing: 'border-box',
};
const SEL: React.CSSProperties = { ...INP, cursor: 'pointer' };

function focusBorder(color: string) {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = color),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = '#e2e8f0'),
  };
}

/* ══════════════════════════════════════════════════════════════════
   FABModal – Form thu/chi, thiết kế chuẩn DiaryModal
══════════════════════════════════════════════════════════════════ */
export function FABModal({
  open, onClose, students, isSaving, onSaveFee, onSaveExpense,
  baseTuition, editingPayment, editingExpense, initialTab,
}: {
  open: boolean; onClose: () => void; students: Student[]; isSaving: boolean;
  onSaveFee: (f: any) => Promise<void>; onSaveExpense: (f: any) => Promise<void>;
  baseTuition: number; editingPayment?: Payment | null;
  editingExpense?: any | null; initialTab?: 'income' | 'expense';
}) {
  const today = localDateStr(), curMo = new Date().getMonth() + 1, curYr = new Date().getFullYear();
  const [tab, setTab] = useState<'income' | 'expense'>('income');
  const [fee, setFee] = useState<any>({});
  const [exp, setExp] = useState<any>({});
  const [manualPayer, setManualPayer] = useState(false);

  /* ── Khởi tạo state khi mở modal ─────────────────────────────── */
  useEffect(() => {
    if (open) {
      if (!editingPayment && !editingExpense && initialTab) setTab(initialTab);
      if (editingPayment) {
        setTab('income');
        const parsedMo = (editingPayment as any).thangHP || (editingPayment.description ? (() => {
          const d2 = String(editingPayment.description || '').toLowerCase();
          const mm = d2.match(/th[aá]ng\s*0?(\d{1,2})/) || d2.match(/\bt0?(\d{1,2})\b/i);
          if (mm) { const v = parseInt(mm[1]); if (v >= 1 && v <= 12) return v; }
          return null;
        })() : null) || curMo;
        setFee({
          maHS: editingPayment.studentId,
          nguoiNop: editingPayment.payer,
          soTien: editingPayment.amount,
          method: editingPayment.method,
          thangHP: parsedMo,
          namHP: (editingPayment as any).namHP || curYr,
          note: editingPayment.note || '',
          date: toInputDate(editingPayment.date),
          docNum: editingPayment.docNum,
        });
        setManualPayer(!!editingPayment.payer);
      } else if (editingExpense) {
        setTab('expense');
        setExp({
          description: editingExpense.description,
          amount: editingExpense.amount,
          category: editingExpense.category,
          spender: editingExpense.spender,
          date: toInputDate(editingExpense.date),
          docNum: editingExpense.docNum,
        });
      } else {
        setFee({ method: 'Chuyển khoản', date: today, soTien: baseTuition, thangHP: curMo, namHP: curYr, note: '' });
        setExp({ date: today, category: 'Vận hành', amount: '', spender: '', description: '' });
        setManualPayer(false);
      }
    }
  }, [open, baseTuition, editingPayment, editingExpense, initialTab]);

  /* ── Tự động điền người nộp khi chọn mã học sinh ─────────────── */
  useEffect(() => {
    if (tab === 'income' && fee.maHS && !manualPayer) {
      const student = students.find(s => s.id === fee.maHS);
      if (student) {
        const defaultPayer = student.parentName?.trim() || student.name?.trim() || '';
        if (defaultPayer && fee.nguoiNop !== defaultPayer)
          setFee((prev: any) => ({ ...prev, nguoiNop: defaultPayer }));
      }
    }
  }, [fee.maHS, tab, students, manualPayer]);

  /* ── Ngày thu thay đổi → cập nhật tháng/năm ──────────────────── */
  useEffect(() => {
    if (tab === 'income' && fee.date) {
      const [y, m] = fee.date.split('-').map(Number);
      setFee((prev: any) => ({ ...prev, thangHP: m, namHP: y }));
    }
  }, [fee.date, tab]);

  if (!open) return null;

  const uf = (k: string, v: any) => { setFee((p: any) => ({ ...p, [k]: v })); if (k === 'nguoiNop') setManualPayer(true); };
  const ue = (k: string, v: any) => setExp((p: any) => ({ ...p, [k]: v }));
  const isEditing = !!(editingPayment || editingExpense);
  const isIncome = tab === 'income';
  const accentColor = isIncome ? '#059669' : '#dc2626';

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }));
  const yearOptions = [curYr - 1, curYr, curYr + 1].map(y => ({ value: String(y), label: String(y) }));
  const methodOptions = [{ value: 'Chuyển khoản', label: 'Chuyển khoản' }, { value: 'Tiền mặt', label: 'Tiền mặt' }];
  const categoryOptions = ['Vận hành', 'In ấn', 'Trang thiết bị', 'Lương', 'Khác'];

  return (
    <div style={FS_WRAP}>
      <div style={FS_DLG}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: isIncome ? '#ecfdf5' : '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isIncome
                ? <TrendingUp size={16} color="#059669" />
                : <TrendingDown size={16} color="#dc2626" />}
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEditing ? (isIncome ? 'Cập nhật phiếu thu' : 'Cập nhật phiếu chi') : (isIncome ? 'Ghi phiếu thu' : 'Ghi phiếu chi')}
              </h3>
              <p style={{ fontSize: 11, color: accentColor, fontWeight: 600, margin: 0 }}>
                {isIncome ? 'Thu học phí từ học sinh' : 'Ghi nhận chi phí vận hành'}
              </p>
            </div>
          </div>
          <IconButton icon={<X size={18} />} label="Đóng" onClick={onClose} />
        </div>

        {/* ── Tab switcher (chỉ hiện khi không phải edit) ─────────── */}
        {!isEditing && (
          <div style={{ padding: '12px 18px 0', flexShrink: 0 }}>
            <FilterTabs
              variant="segment"
              size="sm"
              active={tab}
              onChange={id => setTab(id as any)}
              tabs={[
                { id: 'income', label: '💰 Thu phí' },
                { id: 'expense', label: '💸 Ghi chi' },
              ]}
            />
          </div>
        )}

        {/* ── Body (scrollable) ────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 18px' }}>

          {isIncome ? (
            /* ══ FORM THU: 2 cột, 1 SBox mỗi cột, stretch height ══ */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, alignItems: 'stretch' }}>

              {/* Cột trái: gộp Thông tin + Học sinh vào 1 SBox */}
              <SBox color="#059669" icon={Calendar} title="Thông tin phiếu thu" stretch>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <LField label="Ngày thu">
                    <input type="date" value={fee.date || ''} onChange={e => uf('date', e.target.value)}
                      style={INP} {...focusBorder('#059669')} />
                  </LField>
                  <LField label="Hình thức">
                    <select value={fee.method || 'Chuyển khoản'} onChange={e => uf('method', e.target.value)}
                      style={SEL} {...focusBorder('#059669')}>
                      {methodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </LField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <LField label="Tháng *">
                    <select value={String(fee.thangHP || '')} onChange={e => uf('thangHP', Number(e.target.value))}
                      style={SEL} {...focusBorder('#059669')}>
                      {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </LField>
                  <LField label="Năm">
                    <select value={String(fee.namHP || '')} onChange={e => uf('namHP', Number(e.target.value))}
                      style={SEL} {...focusBorder('#059669')}>
                      {yearOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </LField>
                </div>
                {/* Divider */}
                <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0 -14px', padding: '0 14px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <LField label="Mã HS *">
                    <input
                      value={fee.maHS || ''}
                      onChange={e => { const raw = e.target.value; const match = raw.match(/^([^\s-]+)\s*-/); uf('maHS', match ? match[1].trim() : raw); }}
                      placeholder="HS001"
                      list="fab-hs"
                      autoComplete="off"
                      style={INP}
                      {...focusBorder('#059669')}
                    />
                    <datalist id="fab-hs">
                      {students.map(s => <option key={s.id} value={`${s.id} - ${s.name}`} />)}
                    </datalist>
                  </LField>
                  <LField label="Người nộp">
                    <input value={fee.nguoiNop || ''} onChange={e => uf('nguoiNop', e.target.value)}
                      placeholder="Phụ huynh / HS" style={INP} {...focusBorder('#059669')} />
                  </LField>
                </div>
              </SBox>

              {/* Cột phải */}
              <SBox color="#d97706" icon={Wallet} title="Số tiền & Ghi chú" stretch>
                <LField label="Số tiền (VNĐ) *">
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={fee.soTien || ''}
                      onChange={e => uf('soTien', e.target.value)}
                      placeholder="0"
                      style={{ ...INP, paddingLeft: 28 }}
                      {...focusBorder('#d97706')}
                    />
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#d97706' }}>₫</span>
                  </div>
                </LField>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #fde68a', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: fee.soTien > 0 ? '#b45309' : '#d1c4a0', margin: 0 }}>
                    {fee.soTien > 0 ? fmtVND(Number(fee.soTien)) : '0 ₫'}
                  </p>
                </div>
                <LField label="Ghi chú">
                  <textarea
                    value={fee.note || ''}
                    onChange={e => uf('note', e.target.value)}
                    placeholder="Đóng trễ, thiếu..."
                    style={{ ...INP, resize: 'none', flex: 1, minHeight: 80 }}
                    {...focusBorder('#d97706')}
                  />
                </LField>
              </SBox>
            </div>

          ) : (
            /* ══ FORM CHI: 2 cột, 1 SBox mỗi cột, stretch height ══ */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, alignItems: 'stretch' }}>

              {/* Cột trái */}
              <SBox color="#dc2626" icon={Calendar} title="Thông tin chi phí" stretch>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <LField label="Ngày chi">
                    <input type="date" value={exp.date || ''} onChange={e => ue('date', e.target.value)}
                      style={INP} {...focusBorder('#dc2626')} />
                  </LField>
                  <LField label="Người chi">
                    <input value={exp.spender || ''} onChange={e => ue('spender', e.target.value)}
                      placeholder="Ai chi?" style={INP} {...focusBorder('#dc2626')} />
                  </LField>
                </div>
                <LField label="Hạng mục">
                  <select value={exp.category || ''} onChange={e => ue('category', e.target.value)}
                    style={SEL} {...focusBorder('#dc2626')}>
                    <option value="">-- Chọn hạng mục --</option>
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </LField>
              </SBox>

              {/* Cột phải */}
              <SBox color="#7c3aed" icon={FileText} title="Chi tiết khoản chi" stretch>
                <LField label="Số tiền (VNĐ) *">
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={exp.amount || ''}
                      onChange={e => ue('amount', e.target.value)}
                      placeholder="0"
                      style={{ ...INP, paddingLeft: 28 }}
                      {...focusBorder('#7c3aed')}
                    />
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>₫</span>
                  </div>
                </LField>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#faf5ff', border: '1.5px solid #e9d5ff', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: exp.amount > 0 ? '#7c3aed' : '#c4b5d4', margin: 0 }}>
                    {exp.amount > 0 ? fmtVND(Number(exp.amount)) : '0 ₫'}
                  </p>
                </div>
                <LField label="Lý do *">
                  <textarea
                    value={exp.description || ''}
                    onChange={e => ue('description', e.target.value)}
                    placeholder="Mua bút, in đề, tiền điện..."
                    style={{ ...INP, resize: 'none', flex: 1, minHeight: 80 }}
                    {...focusBorder('#7c3aed')}
                  />
                </LField>
              </SBox>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <Button variant="outline" intent="neutral" onClick={onClose} style={{ minWidth: 90 }}>Hủy</Button>
          {isIncome ? (
            <Button
              intent="success"
              loading={isSaving}
              icon={<Save size={14} />}
              onClick={() => { onClose(); onSaveFee(fee); }}
              style={{ boxShadow: '0 4px 14px rgba(5,150,105,0.4)', flex: 1, maxWidth: 200 }}
            >
              {isEditing ? 'Cập nhật thu' : 'Ghi sổ thu'}
            </Button>
          ) : (
            <Button
              intent="danger"
              loading={isSaving}
              icon={<Save size={14} />}
              onClick={() => { onClose(); onSaveExpense(exp); }}
              style={{ boxShadow: '0 4px 14px rgba(220,38,38,0.4)', flex: 1, maxWidth: 200 }}
            >
              {isEditing ? 'Cập nhật chi' : 'Ghi sổ chi'}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   InvoiceModal – Hiển thị chi tiết phiếu thu (giữ nguyên)
══════════════════════════════════════════════════════════════════ */
export function InvoiceModal({ payment, onClose, centerName, bankId, accountNo, accountName }: {
  payment: Payment; onClose: () => void; centerName: string;
  bankId: string; accountNo: string; accountName: string;
}) {
  const r = payment;
  const qrUrl = accountNo && accountNo !== BANK_DEFAULT.accountNo
    ? makeVietQR(bankId, accountNo, r.amount, r.docNum, accountName)
    : null;
  const rows = [
    { l: 'Ngày thu', v: formatDate(r.date) },
    { l: 'Học sinh', v: String(r.studentName || '').toUpperCase() },
    { l: 'Người nộp', v: r.payer || '---' },
    { l: 'Hình thức', v: r.method || '---' },
    { l: 'Nội dung', v: r.description || '---' },
  ];
  return (
    <div style={FS_WRAP}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 400, borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }} id="inv">
        <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={15} color="white" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Phiếu thu học phí</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>{centerName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: '0 0 2px' }}>Số CT</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: 0 }}>{r.docNum}</p>
          </div>
        </div>
        <div style={{ padding: '18px 24px' }}>
          {rows.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f1f5f9', gap: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{item.l}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: 220 }}>{item.v}</span>
            </div>
          ))}
          {r.note && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9', gap: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ghi chú</span>
              <span style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic', textAlign: 'right' }}>{r.note}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '13px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#fff7ed,#fffbeb)', border: '1.5px solid #fed7aa' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>Số tiền thu</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#ea580c' }}>{fmtVND(r.amount)}</span>
          </div>
        </div>
        {qrUrl && (
          <div style={{ padding: '0 24px 16px', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quét để chuyển khoản</p>
              <img src={qrUrl} alt="VietQR" style={{ width: 150, height: 150, margin: '0 auto', display: 'block', borderRadius: 10, border: '1px solid #e2e8f0' }} />
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{bankId} · {accountNo}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>{accountName}</p>
            </div>
          </div>
        )}
        <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }} className="print:hidden">
          <Button intent="warning" fullWidth size="lg" icon={<Printer size={15} />} onClick={() => window.print()} style={{ background: '#ea580c' }}>In / Xuất PDF</Button>
          <button onClick={onClose} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Đóng lại</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ExpenseModal – Hiển thị chi tiết phiếu chi + in
══════════════════════════════════════════════════════════════════ */
export function ExpenseModal({ expense, onClose, centerName }: {
  expense: Expense; onClose: () => void; centerName: string;
}) {
  const e = expense;
  const rows = [
    { l: 'Ngày chi',   v: formatDate(e.date) },
    { l: 'Nội dung',   v: e.description || '---' },
    { l: 'Hạng mục',   v: e.category    || '---' },
    { l: 'Người chi',  v: e.spender     || '---' },
    { l: 'Số CT',      v: e.docNum      || '---' },
  ];
  return (
    <div style={FS_WRAP}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 400, borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }} id="exp-voucher">
        {/* Header — đỏ để phân biệt với phiếu thu (cam) */}
        <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={15} color="white" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Phiếu chi</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>{centerName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: '0 0 2px' }}>Số CT</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: 0 }}>{e.docNum || '---'}</p>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: '18px 24px' }}>
          {rows.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f1f5f9', gap: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{item.l}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: 220 }}>{item.v}</span>
            </div>
          ))}
          {/* Tổng tiền — nổi bật màu đỏ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '13px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#fff1f2,#fef2f2)', border: '1.5px solid #fecaca' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>Số tiền chi</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{fmtVND(e.amount)}</span>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }} className="print:hidden">
          <Button intent="danger" fullWidth size="lg" icon={<Printer size={15} />} onClick={() => window.print()}>In / Xuất PDF</Button>
          <button onClick={onClose} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Đóng lại</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FinanceDetailModal – Chi tiết tài chính học sinh (giữ nguyên)
══════════════════════════════════════════════════════════════════ */
export function FinanceDetailModal({ student, payments, onClose, isPaid }: {
  student: Student; payments: Payment[]; onClose: () => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
}) {
  const financeMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { m: d.getMonth() + 1, y: d.getFullYear(), label: `T${d.getMonth() + 1}` };
    });
  }, []);

  const s = student, sPayments = payments.filter(p => p.studentId === s.id);
  return (
    <div style={FS_WRAP}>
      <div style={{ ...FS_DLG, maxWidth: 580 }}>
        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '18px 24px', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={20} color="rgba(255,255,255,0.7)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>{s.name}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>{s.id} · Lớp {s.classId}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="white" />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Lịch đóng học phí</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(54px,1fr))', gap: 6 }}>
              {financeMonths.map(fm => {
                const paid = isPaid(s.id, fm.m, fm.y);
                return (
                  <div key={fm.label} style={{ borderRadius: 8, padding: '8px 4px', textAlign: 'center', background: paid ? '#ecfdf5' : '#f8fafc', border: paid ? '1.5px solid #a7f3d0' : '1.5px solid #e2e8f0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: paid ? '#059669' : '#94a3b8', margin: '0 0 3px' }}>{fm.label}</p>
                    {paid ? (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <Check size={9} color="white" />
                      </div>
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0', margin: '0 auto' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 16, border: '1.5px solid #e2e8f0', overflow: 'hidden', borderRadius: 10 }}>
            <div style={{ padding: '9px 16px', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>💳 Lịch sử ({sPayments.length} giao dịch)</p>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {sPayments.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 14 }}>Chưa có giao dịch</p>
              ) : (
                sPayments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{formatDate(p.date)}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0', fontStyle: 'italic' }}>{p.description}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: 8, border: '1px solid #a7f3d0' }}>+{fmtVND(p.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <Button variant="outline" intent="neutral" fullWidth size="lg" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
