import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { X, Save, DollarSign, Printer, Check, TrendingDown, MessageCircle, Phone, User, Wallet } from 'lucide-react';
import { fmtVND, formatDate, makeVietQR, BANK_DEFAULT, toInputDate, localDateStr, normalizePaymentMethod, buildSchoolYearMonths, parseDMY } from './helpers';
import { Button, FilterTabs } from './dsComponents';
import type { Student, Payment, Expense, ClassRecord } from './types';

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

const extractStudentId = (raw: unknown) => {
  const s = String(raw || '').trim();
  const match = s.match(/^([^\s-]+)\s*-/);
  return match ? match[1].trim() : s;
};

const classIdOf = (c: ClassRecord | any) =>
  String(c?.['Mã Lớp'] || c?.['Mã lớp'] || c?.['MÃ£ Lá»›p'] || c?.MaLop || c?.classId || '').trim();

const teacherOf = (c: ClassRecord | any) =>
  String(c?.['Giáo viên'] || c?.['GiÃ¡o viÃªn'] || c?.GiaoVien || c?.teacherName || '').trim();

const monthOptions = () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }));
const yearOptions = (curYr: number) => [curYr - 1, curYr, curYr + 1].map(y => ({ value: String(y), label: String(y) }));

function FinanceFormShell({
  title,
  subtitle,
  icon,
  tone,
  onClose,
  children,
  footer,
  width = 680,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: 'income' | 'expense';
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  width?: number;
}) {
  return (
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div className={`ltn-quick-modal ltn-finance-modal ltn-voucher-modal ${tone}`} style={{ width: `min(${width}px, calc(100vw - 40px))` }}>
        <header className="ltn-quick-head ltn-voucher-head">
          <div className="ltn-quick-title-row">
            <div className="ltn-quick-title">
              <div className="ltn-quick-icon">{icon}</div>
              <div>
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
            <button className="ltn-quick-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>
        <div className="ltn-quick-body">{children}</div>
        <div className="ltn-quick-foot ltn-finance-foot">{footer}</div>
      </div>
    </div>
  );
}

export function PaymentFormModal({
  open,
  onClose,
  students,
  classes = [],
  isSaving,
  onSave,
  baseTuition,
  editingPayment,
}: {
  open: boolean;
  onClose: () => void;
  students: Student[];
  classes?: ClassRecord[];
  isSaving: boolean;
  onSave: (f: any) => Promise<void>;
  baseTuition: number;
  editingPayment?: Payment | null;
}) {
  const today = localDateStr();
  const curMo = new Date().getMonth() + 1;
  const curYr = new Date().getFullYear();
  const [form, setForm] = useState<any>({});
  const [manualPayer, setManualPayer] = useState(false);
  const [manualClass, setManualClass] = useState(false);
  const [manualCollector, setManualCollector] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingPayment) {
      setForm({
        maHS: editingPayment.studentId || '',
        nguoiNop: editingPayment.payer || '',
        soTien: editingPayment.amount || baseTuition,
        method: normalizePaymentMethod(editingPayment.method || 'Chuyển khoản'),
        thangHP: (editingPayment as any).thangHP || curMo,
        namHP: (editingPayment as any).namHP || curYr,
        maLop: (editingPayment as any).maLop || '',
        nguoiThu: (editingPayment as any).nguoiThu || (editingPayment as any).collector || '',
        note: editingPayment.note || '',
        date: toInputDate(editingPayment.date),
        docNum: editingPayment.docNum || '',
      });
      setManualPayer(!!editingPayment.payer);
      setManualClass(!!(editingPayment as any).maLop);
      setManualCollector(!!((editingPayment as any).nguoiThu || (editingPayment as any).collector));
    } else {
      setForm({
        method: 'Chuyển khoản',
        date: today,
        soTien: baseTuition,
        thangHP: curMo,
        namHP: curYr,
        maHS: '',
        maLop: '',
        nguoiThu: '',
        nguoiNop: '',
        note: '',
        docNum: '',
      });
      setManualPayer(false);
      setManualClass(false);
      setManualCollector(false);
    }
  }, [open, editingPayment, baseTuition, today, curMo, curYr]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
    if (key === 'maHS') {
      setManualPayer(false);
      setManualClass(false);
      setManualCollector(false);
    }
    if (key === 'nguoiNop') setManualPayer(true);
    if (key === 'maLop') {
      setManualClass(true);
      setManualCollector(false);
    }
    if (key === 'nguoiThu') setManualCollector(true);
  };

  const rawStudentId = extractStudentId(form.maHS);
  const selectedStudent = students.find(s => s.id === rawStudentId);
  const selectedClass = classes.find(c => classIdOf(c) === String(form.maLop || selectedStudent?.classId || '').trim());

  useEffect(() => {
    if (!open || !selectedStudent) return;
    const nextPayer = selectedStudent.parentName?.trim() || selectedStudent.name?.trim() || '';
    const nextClass = selectedStudent.classId || '';
    const nextCollector = teacherOf(selectedClass) || selectedStudent.teacher || '';
    setForm((prev: any) => ({
      ...prev,
      ...(!manualPayer && nextPayer ? { nguoiNop: nextPayer } : {}),
      ...(!manualClass && nextClass ? { maLop: nextClass } : {}),
      ...(!manualCollector && nextCollector ? { nguoiThu: nextCollector } : {}),
    }));
  }, [open, selectedStudent, selectedClass, manualPayer, manualClass, manualCollector]);

  if (!open) return null;

  const activeStudents = students.filter(s => s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === ''));

  const submit = () => {
    const maHS = rawStudentId;
    if (!maHS) { toast.error('Vui lòng nhập mã học sinh'); return; }
    if (!form.date) { toast.error('Vui lòng chọn ngày thu'); return; }
    if (!form.soTien || Number(form.soTien) <= 0) { toast.error('Số tiền không hợp lệ'); return; }
    if (!form.thangHP) { toast.error('Vui lòng chọn tháng học phí'); return; }
    const maLop = String(form.maLop || selectedStudent?.classId || '').trim();
    const nguoiThu = String(form.nguoiThu || selectedStudent?.teacher || teacherOf(selectedClass) || '').trim();
    onClose();
    return onSave({ ...form, maHS, maLop, MaLop: maLop, classId: maLop, nguoiThu, collector: nguoiThu });
  };

  return (
    <FinanceFormShell
      title={editingPayment ? 'Cập nhật phiếu thu' : 'Phiếu thu học phí'}
      icon={<DollarSign size={18} />}
      tone="income"
      onClose={onClose}
      width={700}
      footer={(
        <>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent={editingPayment ? 'primary' : 'success'} loading={isSaving} icon={<Save size={14} />} onClick={submit}>
            {editingPayment ? 'Cập nhật phiếu thu' : 'Lưu phiếu thu'}
          </Button>
        </>
      )}
    >
      <section className="ltn-quick-card">
        <div className="ltn-quick-grid three">
          <div className="ltn-quick-field">
            <label>Học sinh</label>
            <input value={form.maHS || ''} onChange={e => update('maHS', extractStudentId(e.target.value))} placeholder="HS001" list="payment-students" autoComplete="off" />
            <datalist id="payment-students">
              {activeStudents.map(s => <option key={s.id} value={`${s.id} - ${s.name}`} />)}
            </datalist>
          </div>
          <div className="ltn-quick-field"><label>Số tiền</label><input type="number" value={form.soTien || ''} onChange={e => update('soTien', e.target.value)} placeholder="0" /></div>
          <div className="ltn-quick-field"><label>Ngày thu</label><input type="date" value={form.date || ''} onChange={e => update('date', e.target.value)} /></div>
        </div>
        <div className="ltn-quick-grid three">
          <div className="ltn-quick-field">
            <label>Tháng HP</label>
            <select value={String(form.thangHP || '')} onChange={e => update('thangHP', Number(e.target.value))}>
              {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="ltn-quick-field">
            <label>Năm HP</label>
            <select value={String(form.namHP || '')} onChange={e => update('namHP', Number(e.target.value))}>
              {yearOptions(curYr).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="ltn-quick-field">
            <label>Hình thức</label>
            <select value={normalizePaymentMethod(form.method || 'Chuyển khoản')} onChange={e => update('method', e.target.value)}>
              <option value="Chuyển khoản">Chuyển khoản</option>
              <option value="Tiền mặt">Tiền mặt</option>
            </select>
          </div>
        </div>
        <div className="ltn-quick-grid">
          <div className="ltn-quick-field"><label>Người nộp</label><input value={form.nguoiNop || ''} onChange={e => update('nguoiNop', e.target.value)} placeholder="Phụ huynh / học sinh" /></div>
          <div className="ltn-quick-field"><label>Ghi chú</label><textarea value={form.note || ''} onChange={e => update('note', e.target.value)} rows={2} placeholder="Đóng trễ, đóng bù..." /></div>
        </div>
      </section>
    </FinanceFormShell>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FABModal – Form thu/chi, thiết kế chuẩn DiaryModal
══════════════════════════════════════════════════════════════════ */
export function ExpenseFormModal({
  open,
  onClose,
  expenses = [],
  isSaving,
  onSave,
  editingExpense,
}: {
  open: boolean;
  onClose: () => void;
  expenses?: Expense[];
  isSaving: boolean;
  onSave: (f: any) => Promise<void>;
  editingExpense?: Expense | null;
}) {
  const today = localDateStr();
  const [form, setForm] = useState<any>({});
  const [manualSpender, setManualSpender] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingExpense) {
      setForm({
        description: editingExpense.description || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || '',
        spender: editingExpense.spender || '',
        date: toInputDate(editingExpense.date),
        docNum: editingExpense.docNum || '',
      });
      setManualSpender(!!editingExpense.spender);
    } else {
      setForm({ date: today, category: '', amount: '', spender: '', description: '', docNum: '' });
      setManualSpender(false);
    }
  }, [open, editingExpense, today]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
    if (key === 'category') setManualSpender(false);
    if (key === 'spender') setManualSpender(true);
  };
  const categoryOptions = Array.from(new Set(['Vận hành', 'In ấn', 'Trang thiết bị', 'Lương', 'Khác', ...expenses.map(e => e.category).filter(Boolean)])).sort((a, b) => a.localeCompare(b, 'vi'));
  const spenderOptions = Array.from(new Set(expenses.map(e => e.spender).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));
  const suggestedSpender = form.category
    ? expenses.find(e => e.category === form.category && e.spender)?.spender || ''
    : '';

  useEffect(() => {
    if (!open || manualSpender || form.spender || !suggestedSpender) return;
    setForm((prev: any) => ({ ...prev, spender: suggestedSpender }));
  }, [open, manualSpender, form.spender, suggestedSpender]);

  if (!open) return null;

  const submit = () => {
    if (!form.description?.trim()) { toast.error('Vui lòng nhập nội dung chi'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Số tiền không hợp lệ'); return; }
    if (!form.date) { toast.error('Vui lòng chọn ngày chi'); return; }
    onClose();
    return onSave(form);
  };

  return (
    <FinanceFormShell
      title={editingExpense ? 'Cập nhật phiếu chi' : 'Phiếu chi'}
      icon={<TrendingDown size={18} />}
      tone="expense"
      onClose={onClose}
      width={640}
      footer={(
        <>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          <Button intent={editingExpense ? 'primary' : 'danger'} loading={isSaving} icon={<Save size={14} />} onClick={submit}>
            {editingExpense ? 'Cập nhật phiếu chi' : 'Lưu phiếu chi'}
          </Button>
        </>
      )}
    >
      <section className="ltn-quick-card">
        <div className="ltn-quick-grid">
          <div className="ltn-quick-field"><label>Ngày chi</label><input type="date" value={form.date || ''} onChange={e => update('date', e.target.value)} /></div>
          <div className="ltn-quick-field"><label>Số tiền</label><input type="number" value={form.amount || ''} onChange={e => update('amount', e.target.value)} placeholder="0" /></div>
          <div className="ltn-quick-field">
            <label>Hạng mục</label>
            <input value={form.category || ''} onChange={e => update('category', e.target.value)} list="expense-categories" placeholder="Nhập hoặc chọn" />
            <datalist id="expense-categories">{categoryOptions.map(item => <option key={item} value={item} />)}</datalist>
          </div>
          <div className="ltn-quick-field">
            <label>Người chi</label>
            <input value={form.spender || ''} onChange={e => update('spender', e.target.value)} list="expense-spenders" placeholder="Tên người chi" />
            <datalist id="expense-spenders">{spenderOptions.map(item => <option key={item} value={item} />)}</datalist>
          </div>
          <div className="ltn-quick-field full"><label>Nội dung chi</label><textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={3} placeholder="VD: In đề kiểm tra, mua bút, trả lương..." /></div>
        </div>
      </section>
    </FinanceFormShell>
  );
}

export function FABModal({
  open, onClose, students, classes = [], isSaving, onSaveFee, onSaveExpense,
  baseTuition, editingPayment, editingExpense, initialTab,
}: {
  open: boolean; onClose: () => void; students: Student[]; classes?: ClassRecord[]; isSaving: boolean;
  onSaveFee: (f: any) => Promise<void>; onSaveExpense: (f: any) => Promise<void>;
  baseTuition: number; editingPayment?: Payment | null;
  editingExpense?: any | null; initialTab?: 'income' | 'expense';
}) {
  const today = localDateStr(), curMo = new Date().getMonth() + 1, curYr = new Date().getFullYear();
  const [tab, setTab] = useState<'income' | 'expense'>('income');
  const [fee, setFee] = useState<any>({});
  const [exp, setExp] = useState<any>({});
  const [manualPayer, setManualPayer] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  /* ── Khởi tạo state khi mở modal ─────────────────────────────── */
  useEffect(() => {
    if (open) {
      setShowReceipt(false);
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
          method: normalizePaymentMethod(editingPayment.method),
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }));
  const yearOptions = [curYr - 1, curYr, curYr + 1].map(y => ({ value: String(y), label: String(y) }));
  const methodOptions = [{ value: 'Chuyển khoản', label: 'Chuyển khoản' }, { value: 'Tiền mặt', label: 'Tiền mặt' }];
  const categoryOptions = ['Vận hành', 'In ấn', 'Trang thiết bị', 'Lương', 'Khác'];
  const rawFeeId = String(fee.maHS || '').includes(' - ') ? String(fee.maHS).split(' - ')[0].trim() : String(fee.maHS || '').trim();
  const selectedStudent = students.find(s => s.id === rawFeeId);
  const selectedClass = classes.find(c => String(c['Mã Lớp'] || c.MaLop || c.classId || '').trim() === String(selectedStudent?.classId || '').trim());
  const collectorName = String((fee as any).nguoiThu || selectedStudent?.teacher || selectedClass?.GiaoVien || selectedClass?.['Giáo viên'] || '').trim() || '---';
  const receiptAmount = Number(fee.soTien || 0);

  return (
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      {showReceipt && (
        <div className="ltn-receipt-modal">
          <article className="ltn-receipt-paper" id="inv">
            <header className="ltn-receipt-top">
              <div className="ltn-receipt-brand">
                <div className="ltn-receipt-logo">Σ</div>
                <div>
                  <h2>LỚP TOÁN NK</h2>
                  <p>Biên lai học phí nội bộ</p>
                </div>
              </div>
              <div className="ltn-receipt-meta">
                <span className="ltn-receipt-paid">Đã thu</span>
                <strong>{fee.docNum || 'PT-TAM-TINH'}</strong>
              </div>
            </header>
            <div className="ltn-receipt-body">
              <div className="ltn-receipt-grid">
                <div className="ltn-receipt-info">
                  <div className="ltn-receipt-cell"><span>Học sinh</span><strong>{selectedStudent?.name || rawFeeId || '---'}</strong></div>
                  <div className="ltn-receipt-cell"><span>Học phí</span><strong>{receiptAmount > 0 ? fmtVND(receiptAmount) : '---'}</strong></div>
                  <div className="ltn-receipt-cell"><span>Kỳ học phí</span><strong>Tháng {fee.thangHP || curMo}/{fee.namHP || curYr}</strong></div>
                  <div className="ltn-receipt-cell"><span>Hình thức</span><strong>{normalizePaymentMethod(fee.method || 'Chuyển khoản')}</strong></div>
                  <div className="ltn-receipt-cell"><span>Người nộp</span><strong>{fee.nguoiNop || selectedStudent?.parentName || 'Phụ huynh học sinh'}</strong></div>
                  <div className="ltn-receipt-cell"><span>Người thu</span><strong>{collectorName}</strong></div>
                </div>
                <aside className="ltn-receipt-qr-card">
                  <svg className="ltn-qr-box" viewBox="0 0 120 120" aria-label="QR biên lai học phí">
                    <rect width="120" height="120" fill="#fff"/>
                    <rect x="8" y="8" width="28" height="28" fill="#0f172a"/><rect x="14" y="14" width="16" height="16" fill="#fff"/><rect x="18" y="18" width="8" height="8" fill="#0f172a"/>
                    <rect x="84" y="8" width="28" height="28" fill="#0f172a"/><rect x="90" y="14" width="16" height="16" fill="#fff"/><rect x="94" y="18" width="8" height="8" fill="#0f172a"/>
                    <rect x="8" y="84" width="28" height="28" fill="#0f172a"/><rect x="14" y="90" width="16" height="16" fill="#fff"/><rect x="18" y="94" width="8" height="8" fill="#0f172a"/>
                    <rect x="44" y="8" width="8" height="8" fill="#0f172a"/><rect x="60" y="8" width="8" height="8" fill="#0f172a"/><rect x="72" y="16" width="8" height="8" fill="#0f172a"/>
                    <rect x="44" y="28" width="8" height="8" fill="#0f172a"/><rect x="56" y="28" width="16" height="8" fill="#0f172a"/><rect x="76" y="32" width="8" height="8" fill="#0f172a"/>
                    <rect x="44" y="44" width="8" height="8" fill="#0f172a"/><rect x="56" y="44" width="8" height="8" fill="#0f172a"/><rect x="72" y="44" width="16" height="8" fill="#0f172a"/><rect x="96" y="44" width="8" height="8" fill="#0f172a"/>
                    <rect x="8" y="48" width="8" height="8" fill="#0f172a"/><rect x="24" y="48" width="8" height="8" fill="#0f172a"/><rect x="40" y="56" width="24" height="8" fill="#0f172a"/><rect x="76" y="56" width="8" height="8" fill="#0f172a"/><rect x="100" y="56" width="12" height="8" fill="#0f172a"/>
                    <rect x="48" y="68" width="8" height="8" fill="#0f172a"/><rect x="64" y="68" width="8" height="8" fill="#0f172a"/><rect x="84" y="68" width="20" height="8" fill="#0f172a"/>
                    <rect x="44" y="84" width="12" height="8" fill="#0f172a"/><rect x="64" y="84" width="8" height="8" fill="#0f172a"/><rect x="80" y="84" width="8" height="8" fill="#0f172a"/><rect x="96" y="84" width="16" height="8" fill="#0f172a"/>
                    <rect x="44" y="100" width="8" height="8" fill="#0f172a"/><rect x="60" y="96" width="20" height="8" fill="#0f172a"/><rect x="88" y="100" width="8" height="8" fill="#0f172a"/><rect x="104" y="104" width="8" height="8" fill="#0f172a"/>
                  </svg>
                </aside>
              </div>
            </div>
          </article>
          <footer className="ltn-receipt-foot">
            <Button variant="outline" intent="neutral" onClick={() => setShowReceipt(false)}>Đóng</Button>
            <Button variant="outline" intent="neutral" icon={<Printer size={15}/>} onClick={() => window.print()}>In biên lai</Button>
            <Button intent="primary" onClick={() => window.print()}>Tải PDF</Button>
          </footer>
        </div>
      )}

      {!showReceipt && (
      <div className="ltn-quick-modal narrow ltn-finance-modal">
        <header className="ltn-quick-head">
          <div className="ltn-quick-title-row">
            <div className="ltn-quick-title">
              <div className="ltn-quick-icon">{isIncome ? '$' : '-'}</div>
              <div>
                <h2>{isEditing ? (isIncome ? 'Cập nhật phiếu thu' : 'Cập nhật phiếu chi') : (isIncome ? 'Thu học phí' : 'Ghi phiếu chi')}</h2>
                <p>{isIncome ? 'Xác nhận học sinh, kỳ phí, số tiền và hình thức thanh toán.' : 'Ghi nhận khoản chi vận hành của lớp.'}</p>
              </div>
            </div>
            <button className="ltn-quick-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>
          <div className="ltn-quick-context">
            {isIncome ? (
              <>
                <span className="ltn-context-chip"><strong>T{fee.thangHP || curMo}/{fee.namHP || curYr}</strong></span>
                <span className="ltn-context-chip">{selectedStudent?.classId || 'Chưa chọn lớp'}</span>
                <span className="ltn-context-chip">Chỉ Chuyển khoản / Tiền mặt</span>
              </>
            ) : (
              <>
                <span className="ltn-context-chip">Ngày chi: <strong>{formatDate(exp.date || today)}</strong></span>
                <span className="ltn-context-chip">{exp.category || 'Chưa chọn hạng mục'}</span>
              </>
            )}
          </div>
        </header>

        {!isEditing && (
          <div style={{ padding:'12px 24px 0' }}>
            <FilterTabs
              variant="segment"
              size="sm"
              active={tab}
              onChange={id => setTab(id as any)}
              tabs={[
                { id: 'income', label: 'Thu phí' },
                { id: 'expense', label: 'Ghi chi' },
              ]}
            />
          </div>
        )}

        <div className="ltn-quick-body">
          {isIncome ? (
            <>
              <section className="ltn-quick-card">
                <div className="ltn-quick-grid">
                  <div className="ltn-quick-field">
                    <label>Học sinh</label>
                    <input
                      value={fee.maHS || ''}
                      onChange={e => { const raw = e.target.value; const match = raw.match(/^([^\s-]+)\s*-/); uf('maHS', match ? match[1].trim() : raw); }}
                      placeholder="HS001"
                      list="fab-hs-v5"
                      autoComplete="off"
                    />
                    <datalist id="fab-hs-v5">
                      {students.filter(s => s.status !== 'inactive' && (!s.endDate || s.endDate === '---' || s.endDate === '')).map(s => <option key={s.id} value={`${s.id} - ${s.name}`} />)}
                    </datalist>
                  </div>
                  <div className="ltn-quick-field">
                    <label>Kỳ phí</label>
                    <select value={String(fee.thangHP || '')} onChange={e => uf('thangHP', Number(e.target.value))}>
                      {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="ltn-inline-pair">
                  <div className="ltn-quick-field"><label>Số tiền</label><input type="number" value={fee.soTien || ''} onChange={e => uf('soTien', e.target.value)} placeholder="0" /></div>
                  <div className="ltn-quick-field"><label>Ngày thu</label><input type="date" value={fee.date || ''} onChange={e => uf('date', e.target.value)} /></div>
                </div>
                <div className="ltn-quick-field full">
                  <label>Hình thức</label>
                  <div className="ltn-pay-choice">
                    {methodOptions.map(o => <button key={o.value} className={normalizePaymentMethod(fee.method || 'Chuyển khoản') === o.value ? 'active' : ''} onClick={() => uf('method', o.value)} type="button">{o.label}</button>)}
                  </div>
                </div>
                <div className="ltn-quick-grid">
                  <div className="ltn-quick-field"><label>Năm</label><select value={String(fee.namHP || '')} onChange={e => uf('namHP', Number(e.target.value))}>{yearOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div className="ltn-quick-field"><label>Người nộp</label><input value={fee.nguoiNop || ''} onChange={e => uf('nguoiNop', e.target.value)} placeholder="Phụ huynh / HS" /></div>
                  <div className="ltn-quick-field full"><label>Ghi chú</label><textarea value={fee.note || ''} onChange={e => uf('note', e.target.value)} placeholder="Đóng trễ, thiếu..." /></div>
                </div>
              </section>
            </>
          ) : (
            <section className="ltn-quick-card">
              <div className="ltn-quick-grid">
                <div className="ltn-quick-field"><label>Ngày chi</label><input type="date" value={exp.date || ''} onChange={e => ue('date', e.target.value)} /></div>
                <div className="ltn-quick-field"><label>Hạng mục</label><select value={exp.category || ''} onChange={e => ue('category', e.target.value)}><option value="">-- Chọn hạng mục --</option>{categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div className="ltn-quick-field"><label>Số tiền</label><input type="number" value={exp.amount || ''} onChange={e => ue('amount', e.target.value)} placeholder="0" /></div>
                <div className="ltn-quick-field"><label>Người chi</label><input value={exp.spender || ''} onChange={e => ue('spender', e.target.value)} placeholder="Ai chi?" /></div>
                <div className="ltn-quick-field full"><label>Lý do</label><textarea value={exp.description || ''} onChange={e => ue('description', e.target.value)} placeholder="Mua bút, in đề, tiền điện..." /></div>
              </div>
            </section>
          )}
        </div>

        <div className={`ltn-quick-foot ltn-finance-foot ${isIncome ? 'has-receipt' : ''}`}>
          <Button variant="outline" intent="neutral" onClick={onClose}>Hủy</Button>
          {isIncome && <Button variant="outline" intent="neutral" onClick={() => setShowReceipt(true)}>Xem biên lai</Button>}
          {isIncome ? (
            <Button
              intent={isEditing ? 'primary' : 'success'}
              loading={isSaving}
              icon={<Save size={14} />}
              onClick={() => {
                const maHS = rawFeeId;
                if (!maHS) { toast.error('⚠️ Vui lòng nhập mã học sinh!'); return; }
                if (!fee.date) { toast.error('⚠️ Vui lòng chọn ngày thu!'); return; }
                if (!fee.soTien || Number(fee.soTien) <= 0) { toast.error('⚠️ Số tiền không hợp lệ!'); return; }
                if (!fee.thangHP) { toast.error('⚠️ Vui lòng chọn tháng học phí!'); return; }
                const maLop = selectedStudent?.classId || '';
                onClose(); onSaveFee({ ...fee, maHS, maLop, MaLop: maLop, classId: maLop, nguoiThu: collectorName, collector: collectorName });
              }}
            >
              {isEditing ? 'Cập nhật thu' : 'Lưu phiếu thu'}
            </Button>
          ) : (
            <Button
              intent={isEditing ? 'primary' : 'danger'}
              loading={isSaving}
              icon={<Save size={14} />}
              onClick={() => {
                if (!exp.description?.trim()) { toast.error('⚠️ Vui lòng nhập lý do chi!'); return; }
                if (!exp.amount || Number(exp.amount) <= 0) { toast.error('⚠️ Số tiền không hợp lệ!'); return; }
                if (!exp.date) { toast.error('⚠️ Vui lòng chọn ngày chi!'); return; }
                onClose(); onSaveExpense(exp);
              }}
            >
              {isEditing ? 'Cập nhật chi' : 'Lưu phiếu chi'}
            </Button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   InvoiceModal – Hiển thị chi tiết phiếu thu (giữ nguyên)
══════════════════════════════════════════════════════════════════ */
export function InvoiceModal({ payment, onClose, centerName, bankId, accountNo, accountName, students = [], classes = [] }: {
  payment: Payment; onClose: () => void; centerName: string;
  bankId: string; accountNo: string; accountName: string;
  students?: Student[]; classes?: ClassRecord[];
}) {
  const r = payment;
  const receiptStudent = students.find(s => s.id === r.studentId);
  const receiptClass = classes.find(c => String(c['Mã Lớp'] || c.MaLop || c.classId || '').trim() === String(r.maLop || receiptStudent?.classId || '').trim());
  const collectorName = String((r as any).collector || (r as any).nguoiThu || receiptStudent?.teacher || receiptClass?.GiaoVien || receiptClass?.['Giáo viên'] || centerName).trim() || centerName;
  const qrUrl = accountNo && accountNo !== BANK_DEFAULT.accountNo
    ? makeVietQR(bankId, accountNo, r.amount, r.docNum, accountName)
    : null;
  return (
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div className="ltn-receipt-modal" style={{ position: 'relative' }}>
        <article className="ltn-receipt-paper" id="inv">
          <header className="ltn-receipt-top">
            <div className="ltn-receipt-brand">
              <div className="ltn-receipt-logo">Σ</div>
              <div>
                <h2>{centerName}</h2>
                <p>Biên lai học phí nội bộ</p>
              </div>
            </div>
            <div className="ltn-receipt-meta">
              <span className="ltn-receipt-paid">Đã thu</span>
              <strong>{r.docNum}</strong>
            </div>
          </header>
          <div className="ltn-receipt-body">
            <div className="ltn-receipt-grid">
              <div className="ltn-receipt-info">
                <div className="ltn-receipt-cell"><span>Học sinh</span><strong>{r.studentName || '---'}</strong></div>
                <div className="ltn-receipt-cell"><span>Học phí</span><strong>{fmtVND(r.amount)}</strong></div>
                <div className="ltn-receipt-cell"><span>Kỳ học phí</span><strong>{r.thangHP ? `Tháng ${r.thangHP}/${r.namHP || ''}` : '---'}</strong></div>
                <div className="ltn-receipt-cell"><span>Hình thức</span><strong>{normalizePaymentMethod(r.method)}</strong></div>
                <div className="ltn-receipt-cell"><span>Người nộp</span><strong>{r.payer || '---'}</strong></div>
                <div className="ltn-receipt-cell"><span>Người thu</span><strong>{collectorName}</strong></div>
              </div>
              <aside className="ltn-receipt-qr-card">
                {qrUrl ? (
                  <img src={qrUrl} alt="VietQR" className="ltn-qr-box" />
                ) : (
                  <svg className="ltn-qr-box" viewBox="0 0 120 120" aria-label="QR biên lai học phí">
                    <rect width="120" height="120" fill="#fff"/>
                    <rect x="8" y="8" width="28" height="28" fill="#0f172a"/><rect x="14" y="14" width="16" height="16" fill="#fff"/><rect x="18" y="18" width="8" height="8" fill="#0f172a"/>
                    <rect x="84" y="8" width="28" height="28" fill="#0f172a"/><rect x="90" y="14" width="16" height="16" fill="#fff"/><rect x="94" y="18" width="8" height="8" fill="#0f172a"/>
                    <rect x="8" y="84" width="28" height="28" fill="#0f172a"/><rect x="14" y="90" width="16" height="16" fill="#fff"/><rect x="18" y="94" width="8" height="8" fill="#0f172a"/>
                    <rect x="44" y="8" width="8" height="8" fill="#0f172a"/><rect x="60" y="8" width="8" height="8" fill="#0f172a"/><rect x="72" y="16" width="8" height="8" fill="#0f172a"/>
                    <rect x="44" y="44" width="8" height="8" fill="#0f172a"/><rect x="56" y="44" width="8" height="8" fill="#0f172a"/><rect x="72" y="44" width="16" height="8" fill="#0f172a"/>
                    <rect x="48" y="68" width="8" height="8" fill="#0f172a"/><rect x="64" y="68" width="8" height="8" fill="#0f172a"/><rect x="84" y="68" width="20" height="8" fill="#0f172a"/>
                    <rect x="44" y="100" width="8" height="8" fill="#0f172a"/><rect x="60" y="96" width="20" height="8" fill="#0f172a"/><rect x="88" y="100" width="8" height="8" fill="#0f172a"/>
                  </svg>
                )}
              </aside>
            </div>
          </div>
        </article>
        <footer className="ltn-receipt-foot print:hidden">
          <Button variant="outline" intent="neutral" onClick={onClose}>Đóng</Button>
          <Button variant="outline" intent="neutral" icon={<Printer size={15}/>} onClick={() => window.print()}>In biên lai</Button>
          <Button intent="primary" onClick={() => window.print()}>Tải PDF</Button>
        </footer>
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
    <div className="ltn-form-modal-overlay" style={FS_WRAP}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div className="ltn-form-modal-panel" style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 400, borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }} id="exp-voucher">
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
export function FinanceDetailModal({ student, payments, onClose, isPaid, schoolYear }: {
  student: Student; payments: Payment[]; onClose: () => void;
  isPaid: (sid: string, mo: number, yr: number) => boolean;
  schoolYear: string;
}) {
  const isFinanceMonthBillable = (s: Student, fm: { m: number; y: number }) => {
    const monthStart = new Date(fm.y, fm.m - 1, 1).getTime();
    const startTs = parseDMY(s.startDate || '');
    if (startTs) {
      const d = new Date(startTs);
      if (monthStart < new Date(d.getFullYear(), d.getMonth(), 1).getTime()) return false;
    }
    const endTs = parseDMY(s.endDate || '');
    if (endTs && s.endDate !== '---' && s.endDate !== '') {
      const d = new Date(endTs);
      if (monthStart >= new Date(d.getFullYear(), d.getMonth(), 1).getTime()) return false;
    }
    return true;
  };
  const financeMonths = useMemo(() => {
    const now = new Date();
    return buildSchoolYearMonths(schoolYear).filter(fm => {
      if (fm.y > now.getFullYear()) return false;
      if (fm.y === now.getFullYear() && fm.m > now.getMonth() + 1) return false;
      return isFinanceMonthBillable(student, fm);
    });
  }, [schoolYear, student]);

  const paymentPeriod = (p: Payment) => {
    const m = Number((p as any).thangHP);
    const y = Number((p as any).namHP);
    if (m >= 1 && m <= 12 && y >= 2000) return { m, y };
    const raw = String(p.date || '');
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return { m: Number(raw.slice(3, 5)), y: Number(raw.slice(6, 10)) };
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return { m: Number(raw.slice(5, 7)), y: Number(raw.slice(0, 4)) };
    return null;
  };
  const s = student;
  const sPayments = payments
    .filter(p => p.studentId === s.id)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const totalPaid = sPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidMonths = financeMonths.filter(fm => isPaid(s.id, fm.m, fm.y)).length;
  const unpaidMonths = financeMonths.length - paidMonths;
  const latestPayment = sPayments[0];
  const contactPhone = String(s.parentPhone || s.studentPhone || '').replace(/\D/g, '');

  return (
    <div className="ltn-form-modal-overlay" style={{ ...FS_WRAP, alignItems: 'center', padding: 16 }}>
      <div className="ltn-form-modal-panel" style={{ ...FS_DLG, maxWidth: 720, borderRadius: 18, boxShadow: '0 24px 80px rgba(15,23,42,0.28)' }}>
        <div className="ltn-form-modal-header" style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</h3>
              <p style={{ fontSize: 13, color: '#4f46e5', fontWeight: 800, margin: '3px 0 0' }}>{s.id || '—'} · Lớp {s.classId || '—'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                <span className="ltn-context-chip" style={{ minHeight: 30, padding: '5px 9px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><User size={12} /> {s.parentName || 'Chưa có PH'}</span>
                <span className="ltn-context-chip" style={{ minHeight: 30, padding: '5px 9px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={12} /> {s.parentPhone || 'Chưa có SĐT'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {contactPhone.length >= 9 && (
              <a href={`https://zalo.me/${contactPhone}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="outline" intent="primary" size="sm" icon={<MessageCircle size={14} />}>Zalo PH</Button>
              </a>
            )}
            <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={17} color="#64748b" />
            </button>
          </div>
        </div>
        <div className="ltn-form-modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18, display: 'grid', gap: 14 }}>
          <section className="ltn-detail-section">
            <p className="ltn-section-title">Tổng quan học phí</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              {[
                { label: 'Đã thu', value: fmtVND(totalPaid), tone: '#059669', bg: '#ecfdf5' },
                { label: 'Đã đóng', value: `${paidMonths}/${financeMonths.length} tháng`, tone: '#4f46e5', bg: '#eef2ff' },
                { label: 'Còn thiếu', value: `${unpaidMonths} tháng`, tone: unpaidMonths ? '#e11d48' : '#059669', bg: unpaidMonths ? '#fff1f2' : '#ecfdf5' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: item.bg, padding: '11px 12px' }}>
                  <p style={{ margin: 0, fontSize: 10.5, color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: item.tone, fontWeight: 950, whiteSpace: 'nowrap' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ltn-detail-section soft">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <p className="ltn-section-title">Lịch đóng học phí</p>
              {latestPayment && <span style={{ fontSize: 12, fontWeight: 900, color: '#059669' }}>Gần nhất: {formatDate(latestPayment.date)}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(66px,1fr))', gap: 7 }}>
              {financeMonths.map(fm => {
                const paid = isPaid(s.id, fm.m, fm.y);
                return (
                  <div key={`${fm.m}-${fm.y}`} style={{ borderRadius: 10, padding: '8px 5px', textAlign: 'center', background: paid ? '#ecfdf5' : '#f8fafc', border: paid ? '1.5px solid #a7f3d0' : '1.5px solid #e2e8f0' }}>
                    <p style={{ fontSize: 11, fontWeight: 900, color: paid ? '#059669' : '#94a3b8', margin: '0 0 4px' }}>{fm.label}</p>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', margin: '0 0 5px' }}>{fm.y}</p>
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
          </section>

          <section className="ltn-detail-section" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <p className="ltn-section-title">Lịch sử phiếu thu</p>
              <span style={{ color: '#64748b', fontSize: 12, fontWeight: 900 }}>{sPayments.length} giao dịch</span>
            </div>
            <div style={{ maxHeight: 230, overflowY: 'auto' }}>
              {sPayments.length === 0 ? (
                <p style={{ padding: 22, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 14, margin: 0 }}>Chưa có giao dịch</p>
              ) : (
                sPayments.map((p, i) => (
                  <div key={p.id || p.docNum || i} style={{ display: 'grid', gridTemplateColumns: 'minmax(86px,105px) minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', margin: 0 }}>{formatDate(p.date)}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', fontWeight: 800 }}>{(() => { const period = paymentPeriod(p); return period ? `T${period.m}/${period.y}` : 'Kỳ phí —'; })()}</p>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#334155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || p.docNum || 'Phiếu thu học phí'}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', fontWeight: 800 }}>{normalizePaymentMethod(p.method || '') || '—'}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 950, color: '#059669', background: '#ecfdf5', padding: '5px 9px', borderRadius: 999, border: '1px solid #a7f3d0', whiteSpace: 'nowrap' }}>+{fmtVND(p.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
        <div className="ltn-form-modal-footer" style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', flexShrink: 0, display: 'flex', gap: 10 }}>
          <Button variant="outline" intent="neutral" fullWidth size="lg" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
