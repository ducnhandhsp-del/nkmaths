/**
 * SettingsTab.tsx — v28.2
 * Redesigned UI (v27.1) + bug fixes:
 * ✅ [v28.1] Khai báo type GradeFees
 * ✅ [v28.1] Fix insertVar stale closure
 * ✅ [v28.1] Font size applied on mount
 * ✅ [v28.2] Fix: thêm lại Trash2 + Eye (bị xóa nhầm khỏi import)
 * ✅ [v28.2] Fix: schoolYear validation YYYY-YYYY trước khi lưu
 * ✅ [v28.2] Fix: teacher1/phone1 sync khi props thay đổi từ ngoài
 * ✅ [v28.2] Xóa accentColor + uniqueBranches khỏi props (accepted nhưng không dùng)
 * ✅ [v28.3] Ẩn cài đặt chưa có tác dụng thật: showId, darkMode
 */
import React, { useState, useEffect } from 'react';

/* ─── useIsMobile ────────────────────────────────────────────────── */
function useIsMobile(bp = 640) {
  const [is, setIs] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setIs(window.innerWidth < bp);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return is;
}
import toast from 'react-hot-toast';
import {
  RefreshCw, CheckCircle, XCircle, Loader2, Save,
  Plus, X, Edit3, Check, Eye, Trash2,
  Plug, School, DollarSign, Landmark, MessageSquare,
  Database, Clock, ExternalLink,
} from 'lucide-react';
import { saveSettings, makeVietQR, getCacheSize, fmtVND, formatDate } from './helpers';
import { ModalWrap, useConfirm } from './UIComponents';
import { Button, IconButton, Input } from './dsComponents';

interface Props {
  bankId: string;        setBankId: (v: string) => void;
  accountNo: string;     setAccountNo: (v: string) => void;
  accountName: string;   setAccountName: (v: string) => void;
  scriptUrl: string;     setScriptUrl: (v: string) => void;
  gsOk: boolean | null;  saving: boolean; loadData: () => void;
  baseTuition: number;   setBaseTuition: (v: number) => void;
  schoolYear: string;    setSchoolYear: (v: string) => void;
  tuitionDueDay: number; setTuitionDueDay: (v: number) => void;
  setZaloTpl: (v: string) => void;
  centerName: string;    setCenterName: (v: string) => void;
  teacher: string;       setTeacher: (v: string) => void;
  addr1: string;         setAddr1: (v: string) => void;
  addr2: string;         setAddr2: (v: string) => void;
  phone: string;         setPhone: (v: string) => void;
  hideInactive: boolean; setHideInactive: (v: boolean) => void;
  caDayOptions: string[];setCaDayOptions: (v: string[]) => void;
  teacherList: string[]; setTeacherList: (v: string[]) => void;
}

interface ZaloTemplate { id: string; name: string; content: string; }
const TEMPLATE_KEY = 'ltn-message-templates';
const DEFAULT_TEMPLATE: ZaloTemplate = {
  id: 'tuition', name: 'Nhắc phí Zalo',
  content: 'Chào phụ huynh em [Ten], LỚP TOÁN NK thông báo học phí tháng [Thang]/[Nam] của em hiện còn [SoTien]. Phụ huynh vui lòng kiểm tra và thanh toán giúp lớp. Em cảm ơn ạ.',
};
const DEFAULT_TEMPLATES: ZaloTemplate[] = [
  DEFAULT_TEMPLATE,
  {
    id: 'absence',
    name: 'Vắng học Zalo',
    content: 'Chào phụ huynh em [Ten], hôm nay em vắng buổi học lớp [Lop]. Phụ huynh vui lòng phản hồi giúp lớp lý do vắng để giáo viên theo dõi. Em cảm ơn ạ.',
  },
  {
    id: 'schedule',
    name: 'Thông báo lịch Zalo',
    content: 'Chào phụ huynh em [Ten], LỚP TOÁN NK nhắc lịch học lớp [Lop] vào ngày [Ngay]. Phụ huynh vui lòng nhắc em đi học đúng giờ. Em cảm ơn ạ.',
  },
];
const VARS = ['[Ten]','[Lop]','[Thang]','[Nam]','[SoTien]','[Ngay]'];
function loadTemplates(): ZaloTemplate[] {
  try {
    const s = localStorage.getItem(TEMPLATE_KEY);
    if (s) {
      const saved = JSON.parse(s) as ZaloTemplate[];
      const ids = new Set(saved.map(t => t.id));
      return [...saved, ...DEFAULT_TEMPLATES.filter(t => !ids.has(t.id))];
    }
  } catch {}
  return DEFAULT_TEMPLATES;
}
function saveTemplates(ts: ZaloTemplate[]) {
  try { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(ts)); } catch {}
}

const ZALO_PREVIEW_DATA: Record<string, string> = {
  '[Ten]': 'Nguyễn An',
  '[Lop]': '6A1',
  '[Thang]': '5',
  '[Nam]': '2026',
  '[SoTien]': fmtVND(600_000),
  '[Ngay]': formatDate(new Date().toISOString()),
};

function renderZaloPreview(content: string): string {
  return Object.entries(ZALO_PREVIEW_DATA).reduce(
    (msg, [key, value]) => msg.split(key).join(value),
    content || DEFAULT_TEMPLATE.content
  );
}

/* ─── Design tokens ──────────────────────────────────────────────── */
const RADIUS = 10;
const INP: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, fontWeight: 500, color: '#0f172a',
  outline: 'none', background: 'white',
  boxSizing: 'border-box' as const, fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

/* ─── LField: label wrapper ──────────────────────────────────────── */
function LField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>{hint}</p>}
    </div>
  );
}

/* ─── SCard: section card with colored accent bar ─────────────────── */
function SCard({ icon: Icon, title, accent = '#6366f1', children }: {
  icon: any; title: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: RADIUS, border: '1px solid #e8edf2',
      overflow: 'hidden', background: 'white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px',
        background: '#F8FAFC',
        borderBottom: '1px solid #e8edf2',
        borderLeft: `3px solid ${accent}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: accent + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={14} color={accent} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

/* ─── FormGrid ────────────────────────────────────────────────────── */
function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 1 ? '100%' : '180px'}, 1fr))`, gap: 14 }}>
      {children}
    </div>
  );
}

/* ─── ToggleRow ──────────────────────────────────────────────────── */
function ToggleRow({ label, sub, val, onChange }: { label: string; sub?: string; val: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px', borderRadius: 8,
      background: val ? '#f5f3ff' : '#f8fafc',
      border: `1px solid ${val ? '#ddd6fe' : '#e2e8f0'}`,
      marginBottom: 8, transition: 'all 0.15s',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!val)}
        style={{
          width: 44, height: 24, background: val ? '#6366f1' : '#cbd5e1',
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s', borderRadius: 12, flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, width: 20, height: 20,
          background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'left 0.2s', left: val ? 22 : 2, borderRadius: '50%',
        }} />
      </button>
    </div>
  );
}

function InfoPill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'blue' }) {
  const cfg = {
    slate: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    green: { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
    amber: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
    blue:  { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 28, padding: '4px 10px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 12, fontWeight: 800 }}>
      {children}
    </span>
  );
}

/* ─── TagList ─────────────────────────────────────────────────────── */
function TagList({ items, setItems, placeholder }: { items: string[]; setItems: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (v && !items.includes(v)) setItems([...items, v]); setDraft(''); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', gap: 7 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          style={{ ...INP, flex: 1, fontSize: 12 }}
        />
        <button
          onClick={add}
          style={{
            padding: '0 14px', background: '#6366f1', color: 'white',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => (
          <span key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#eef2ff', border: '1px solid #c7d2fe',
            color: '#3730a3', fontSize: 12, fontWeight: 700,
            padding: '4px 10px', borderRadius: 20,
          }}>
            {item}
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', lineHeight: 1, padding: 0 }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Chưa có mục nào</span>
        )}
      </div>
    </div>
  );
}

/* ─── QR Modal ────────────────────────────────────────────────────── */
function QRModal({ open, onClose, bankId, accountNo, accountName }: {
  open: boolean; onClose: () => void; bankId: string; accountNo: string; accountName: string;
}) {
  if (!open) return null;
  const url = makeVietQR(bankId, accountNo, 1_000_000, 'Hoc phi mau', accountName);
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding: 24, textAlign: 'center', maxWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Thử QR VietQR</h3>
          <IconButton icon={<X size={16} />} label="Đóng" onClick={onClose} />
        </div>
        <img src={url} alt="VietQR Preview" style={{ width: 180, height: 180, border: '1px solid #e2e8f0', borderRadius: 10, margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: 12, color: '#64748b' }}>{bankId} · {accountNo}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '2px 0 12px' }}>{accountName}</p>
        <Button variant="outline" intent="neutral" fullWidth onClick={onClose}>Đóng</Button>
      </div>
    </ModalWrap>
  );
}

/* ─── Template Modal ──────────────────────────────────────────────── */
function TemplateModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void; initial?: ZaloTemplate | null; onSave: (t: ZaloTemplate) => void;
}) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  useEffect(() => { if (open) { setName(initial?.name || ''); setContent(initial?.content || ''); } }, [open, initial]);
  if (!open) return null;
  const insertVar = (v: string) => setContent(c => c + v);
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding: 20, width: '100%', maxWidth: 480, boxSizing: 'border-box' as const }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>{initial ? 'Sửa mẫu' : 'Thêm mẫu'}</h3>
          <IconButton icon={<X size={16} />} label="Đóng" onClick={onClose} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Tên mẫu" value={name} onChange={setName} placeholder="Thông báo học phí..." />
          <LField label="Nội dung">
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} style={{ ...INP, resize: 'vertical' }} placeholder="Nội dung tin nhắn..." />
          </LField>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Chèn biến:</span>
            {VARS.map(v => (
              <button key={v} onClick={() => insertVar(v)} style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', padding: '6px 12px', border: '1px solid #c7d2fe', cursor: 'pointer', background: '#f8fafc', color: '#4338ca', borderRadius: 5 }}>{v}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <Button variant="outline" intent="neutral" fullWidth onClick={onClose}>Hủy</Button>
            <Button intent="primary" fullWidth onClick={() => {
              if (!name.trim()) { toast.error('Nhập tên mẫu Zalo'); return; }
              onSave({ id: initial?.id || Date.now().toString(), name: name.trim(), content: content.trim() });
            }}>
              {initial ? 'Cập nhật' : 'Thêm mẫu'}
            </Button>
          </div>
        </div>
      </div>
    </ModalWrap>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SettingsTab
══════════════════════════════════════════════════════════════════ */
export default function SettingsTab({
  bankId, setBankId, accountNo, setAccountNo, accountName, setAccountName,
  scriptUrl, setScriptUrl, gsOk, saving, loadData,
  baseTuition, setBaseTuition, schoolYear, setSchoolYear, tuitionDueDay, setTuitionDueDay, setZaloTpl,
  centerName, setCenterName, teacher, setTeacher, addr1, setAddr1, addr2, setAddr2,
  phone, setPhone, hideInactive, setHideInactive,
  caDayOptions, setCaDayOptions, teacherList, setTeacherList,
}: Props) {
  const { confirm, ConfirmDialog } = useConfirm();

  // FIX: teacher1/phone1 cần sync với props khi parent cập nhật (e.g. sau reload dữ liệu)
  // Dùng useEffect để sync thay vì chỉ dùng useState(initialValue)
  const [teacher1, setTeacher1] = useState(teacherList[0] || teacher || '');
  const [teacher2, setTeacher2] = useState(teacherList[1] || '');
  const [phone1,   setPhone1]   = useState(phone || '');

  useEffect(() => {
    setTeacher1(teacherList[0] || teacher || '');
    setTeacher2(teacherList[1] || '');
  }, [teacherList, teacher]);

  useEffect(() => {
    setPhone1(phone || '');
  }, [phone]);
  const [sheetsUrl, setSheetsUrl] = useState(() => { try { return localStorage.getItem('ltn-sheetsUrl') || ''; } catch { return ''; } });
  const [docUrl,    setDocUrl]    = useState(() => { try { return localStorage.getItem('ltn-docUrl') || ''; } catch { return ''; } });
  const [showQR,   setShowQR]   = useState(false);
  const [cacheSize, setCacheSize] = useState('');
  const [templates, setTemplates]         = useState<ZaloTemplate[]>(() => loadTemplates());
  const [activeTplId, setActiveTplId]     = useState<string>(templates[0]?.id || 'default');
  const [showTplModal, setShowTplModal]   = useState(false);
  const [editingTpl, setEditingTpl]       = useState<ZaloTemplate | null>(null);
  const [tplContent, setTplContent]       = useState<string>(templates[0]?.content || DEFAULT_TEMPLATE.content);
  const [copiedVar, setCopiedVar]         = useState('');
  const [showDeleteTpl, setShowDeleteTpl] = useState(false);
  const [activeSection, setActiveSection] = useState('center');
  const isMobile = useIsMobile();

  useEffect(() => { setCacheSize(getCacheSize()); }, []);
  useEffect(() => { const t = templates.find(t => t.id === activeTplId); if (t) setTplContent(t.content); }, [activeTplId, templates]);

  /* ── Handlers ─────────────────────────────────────────────────── */
  const handleLoadData = () => {
    if (!scriptUrl.trim().startsWith('https://script.google.com/macros/s/')) { toast.error('Script URL không hợp lệ'); return; }
    loadData();
  };
  const handleClearCache = async () => {
    if (!(await confirm('Xóa cache offline?', 'Dữ liệu tạm trong trình duyệt sẽ bị xóa, sau đó app tải lại từ Google Sheets.', 'warning'))) return;
    try { localStorage.removeItem('ltn-cache'); setCacheSize(getCacheSize()); toast.success('Đã xóa cache offline'); loadData(); }
    catch { toast.error('Không xóa được cache'); }
  };
  const handleResetSettings = async () => {
    if (!(await confirm('Reset cài đặt ứng dụng?', 'Chỉ xóa cài đặt lưu trên trình duyệt này. Dữ liệu Google Sheets không bị ảnh hưởng.', 'danger'))) return;
    try {
      localStorage.removeItem('ltn-settings');
      toast.success('Đã reset cài đặt đã lưu. Tải lại trang để dùng mặc định.');
    } catch {
      toast.error('Không reset được cài đặt');
    }
  };
  // FIX: xoá silentLoadData — dead code (useCallback bao bọc loadData nhưng không dùng ở đâu)

  const handleSaveAll = () => {
    if (!scriptUrl.trim()) { toast.error('Script URL không được để trống'); return; }
    if (baseTuition <= 0)  { toast.error('Học phí phải lớn hơn 0'); return; }
    if (tuitionDueDay < 1 || tuitionDueDay > 31) { toast.error('Hạn đóng phải từ ngày 1 đến 31'); return; }
    // FIX: validate schoolYear format YYYY-YYYY trước khi lưu
    if (!/^\d{4}-\d{4}$/.test(schoolYear.trim())) {
      toast.error('Niên khóa phải có định dạng YYYY-YYYY, ví dụ 2026-2027'); return;
    }
    const newTeacherList = [teacher1, teacher2].filter(Boolean);
    setTeacherList(newTeacherList); setTeacher(teacher1); setPhone(phone1); setZaloTpl(tplContent);
    saveSettings({ baseTuition, schoolYear, tuitionDueDay, zaloTpl: tplContent, bankId, accountNo, accountName, scriptUrl, centerName, teacher: teacher1, addr1, addr2, phone: phone1, hideInactive, caDayOptions, teacherList: newTeacherList });
    saveTemplates(templates);
    try { localStorage.setItem('ltn-sheetsUrl', sheetsUrl); } catch {}
    try { localStorage.setItem('ltn-docUrl', docUrl); } catch {}
    toast.success('Đã lưu cài đặt');
  };

  const handleSaveTpl = (t: ZaloTemplate) => {
    const exists = templates.find(x => x.id === t.id);
    const next = exists ? templates.map(x => x.id === t.id ? t : x) : [...templates, t];
    setTemplates(next); setActiveTplId(t.id); setTplContent(t.content); setShowTplModal(false); setEditingTpl(null); toast.success('Đã lưu mẫu Zalo');
  };
  const handleDeleteTpl = () => {
    if (templates.length <= 1) { toast.error('Cần ít nhất 1 mẫu Zalo'); return; }
    const next = templates.filter(t => t.id !== activeTplId);
    setTemplates(next); setActiveTplId(next[0].id); setTplContent(next[0].content); setShowDeleteTpl(false); toast.success('Đã xóa mẫu Zalo');
  };

  /**
   * FIX: insertVar stale closure bug
   * Bug cũ: setTemplates dùng `tplContent` từ closure cũ → lần chèn thứ 2+ bị mất ký tự lần trước.
   * Fix: tính `newContent` trước, dùng chung cho cả 2 state updates.
   */
  const insertVar = (v: string) => {
    const newContent = tplContent + v;
    setTplContent(newContent);
    setTemplates(ts => ts.map(t => t.id === activeTplId ? { ...t, content: newContent } : t));
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(''), 1200);
  };

  const activeTpl = templates.find(t => t.id === activeTplId);
  // FIX: xoá activeNav — computed nhưng không dùng ở đâu trong JSX

  /* ── Nav config ───────────────────────────────────────────────── */
  const navItems = [
    { id: 'center',        icon: School,        label: 'Trung tâm',  accent: '#0ea5e9' },
    { id: 'finance',       icon: DollarSign,    label: 'Tài chính',  accent: '#059669' },
    { id: 'operations',    icon: Clock,         label: 'Vận hành',   accent: '#d97706' },
    { id: 'notifications', icon: MessageSquare, label: 'Thông báo',  accent: '#06b6d4' },
    { id: 'system',        icon: Plug,          label: 'Hệ thống',   accent: '#6366f1' },
  ];

  const connColor = gsOk === true ? '#059669' : gsOk === false ? '#e11d48' : '#64748b';
  const connBg    = gsOk === true ? '#ecfdf5' : gsOk === false ? '#fff1f2' : '#f8fafc';
  const connText  = gsOk === true ? 'Kết nối thành công' : gsOk === false ? 'Lỗi kết nối' : 'Đang kiểm tra...';

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : 18, alignItems: 'flex-start' }}>

      {/* ── NAV: Sidebar on desktop / Horizontal scroll tabs on mobile ── */}
      {isMobile ? (
        /* ── Mobile: horizontal scroll tab bar ── */
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e8edf2', marginBottom: 12 }}>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 0, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 14px',
                    background: 'white',
                    border: 'none',
                    borderBottom: isActive ? `2.5px solid ${item.accent}` : '2.5px solid transparent',
                    cursor: 'pointer',
                    color: isActive ? item.accent : '#94a3b8',
                    minWidth: 60,
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <item.icon size={16} color={isActive ? item.accent : '#94a3b8'} />
                    {item.id === 'system' && (
                      <span style={{ position: 'absolute', top: -2, right: -3, width: 6, height: 6, borderRadius: '50%', background: connColor, border: '1px solid white' }} />
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Desktop: vertical sidebar ── */
        <div style={{ width: 172, flexShrink: 0, position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            borderRadius: RADIUS, border: '1px solid #e2e8f0',
            overflow: 'hidden', background: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 4,
          }}>
            <div style={{ padding: '10px 14px', background: '#F5F7FA', borderBottom: '1px solid #e8edf2' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Cài đặt</p>
            </div>
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '10px 14px',
                    background: isActive ? item.accent + '12' : 'white',
                    border: 'none',
                    borderBottom: '1px solid #f1f5f9',
                    borderLeft: isActive ? `3px solid ${item.accent}` : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    color: isActive ? item.accent : '#475569',
                    transition: 'all 0.12s',
                  }}
                >
                  <item.icon size={13} color={isActive ? item.accent : '#94a3b8'} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.id === 'system' && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: connColor, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
          <Button intent="primary" fullWidth icon={<Save size={14} />} loading={saving} onClick={handleSaveAll} style={{ borderRadius: 9, fontWeight: 700 }}>
            Lưu cài đặt
          </Button>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: isMobile ? 80 : 0 }}>

        {/* ── HỆ THỐNG ── */}
        {activeSection === 'system' && (
          <SCard icon={Plug} title="Hệ thống & kết nối" accent="#6366f1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <LField
                label="Apps Script URL"
                hint="URL triển khai Web App dùng để đọc/ghi dữ liệu. Chỉ chỉnh khi thay đổi nguồn dữ liệu."
              >
                <input value={scriptUrl} onChange={e => setScriptUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." style={INP} />
              </LField>

              {/* Status + actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 9,
                background: connBg, border: `1px solid ${gsOk === true ? '#a7f3d0' : gsOk === false ? '#fca5a5' : '#e2e8f0'}`,
                flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {gsOk === null && <Loader2 size={14} color={connColor} style={{ animation: 'spin 1s linear infinite' }} />}
                  {gsOk === true  && <CheckCircle size={14} color={connColor} />}
                  {gsOk === false && <XCircle size={14} color={connColor} />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: connColor }}>{connText}</span>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <Button intent="primary" size="sm" icon={<RefreshCw size={13} />} loading={saving} onClick={handleLoadData}>Tải lại dữ liệu</Button>
                  <Button intent="danger" variant="outline" size="sm" icon={<Trash2 size={13} />} onClick={handleClearCache}>Xóa cache</Button>
                </div>
              </div>

              {/* Sheets + Doc links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <LField label="Google Sheet ID / URL" hint="Có thể lưu ID hoặc link Google Sheets gốc để quản lý nhanh. Không ảnh hưởng Apps Script.">
                  <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." style={INP} />
                </LField>
                <LField label="Google Doc URL" hint="Tùy chọn, dùng để ghi nhớ mẫu in/báo cáo nếu có.">
                  <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://docs.google.com/document/..." style={INP} />
                </LField>
              </div>

              {(sheetsUrl || docUrl) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sheetsUrl && (
                    <a href={sheetsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
                      <ExternalLink size={12} />Mở Google Sheets
                    </a>
                  )}
                  {docUrl && (
                    <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
                      <ExternalLink size={12} />Mở Google Doc
                    </a>
                  )}
                </div>
              )}
            </div>
          </SCard>
        )}

        {/* ── TRUNG TÂM ── */}
        {activeSection === 'center' && (
          <SCard icon={School} title="Thông tin trung tâm" accent="#0ea5e9">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormGrid>
                <LField label="Tên"><input value={centerName} onChange={e => setCenterName(e.target.value)} placeholder="LỚP TOÁN NK" style={{ ...INP, textTransform: 'uppercase' }} /></LField>
                <LField label="SĐT/Zalo"><input value={phone1} onChange={e => setPhone1(e.target.value)} placeholder="0383634949" style={INP} /></LField>
                <LField label="Địa chỉ cơ sở 1"><input value={addr1} onChange={e => setAddr1(e.target.value)} placeholder="15/80 Đào Tấn" style={INP} /></LField>
                <LField label="Địa chỉ cơ sở 2"><input value={addr2} onChange={e => setAddr2(e.target.value)} placeholder="30 Nguyễn Quang Bích" style={INP} /></LField>
                <LField label="Giáo viên/Người quản lý chính" hint="Dùng làm thông tin mặc định trên phiếu/in ấn và dữ liệu legacy.">
                  <input value={teacher1} onChange={e => setTeacher1(e.target.value)} placeholder="Lê Đức Nhân" style={INP} />
                </LField>
                <LField label="Giáo viên/Quản lý phụ" hint="Tùy chọn, chỉ lưu trong cài đặt trình duyệt.">
                  <input value={teacher2} onChange={e => setTeacher2(e.target.value)} placeholder="Nguyễn Thị Kiên" style={INP} />
                </LField>
              </FormGrid>
            </div>
          </SCard>
        )}

        {/* ── VẬN HÀNH ── */}
        {activeSection === 'operations' && (
          <SCard icon={Clock} title="Vận hành buổi học" accent="#d97706">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Trạng thái điểm danh</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <InfoPill tone="green">Có mặt</InfoPill>
                  <InfoPill tone="amber">Có phép</InfoPill>
                  <InfoPill>Vắng</InfoPill>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', fontStyle: 'italic' }}>
                  Ba trạng thái này là chuẩn nghiệp vụ hiện tại. Chưa hỗ trợ thêm trạng thái mới trong Cài đặt để tránh lệch dữ liệu điểm danh.
                </p>
              </div>
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Clock size={12} color="#64748b" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ca dạy</span>
                </div>
                <TagList items={caDayOptions} setItems={setCaDayOptions} placeholder="Thêm ca (VD: 7h30, 19h30)..." />
              </div>
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Tùy chọn dữ liệu</p>
                <ToggleRow label="Ẩn học sinh đã nghỉ học theo mặc định" sub="Áp dụng cho các danh sách có lọc trạng thái học sinh." val={hideInactive} onChange={setHideInactive} />
              </div>
            </div>
          </SCard>
        )}

        {/* ── TÀI CHÍNH ── */}
        {activeSection === 'finance' && (
          <SCard icon={DollarSign} title="Học phí & Niên khóa" accent="#059669">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FormGrid>
                <LField label="Mức học phí mặc định">
                  <input type="number" value={baseTuition} onChange={e => setBaseTuition(Number(e.target.value))} placeholder="600000" style={INP} min={0} />
                </LField>
                <LField label="Niên khóa">
                  <input value={schoolYear} onChange={e => setSchoolYear(e.target.value)} placeholder="2026-2027" style={INP} />
                </LField>
                <LField label="Hạn đóng học phí">
                  <input type="number" value={tuitionDueDay} onChange={e => setTuitionDueDay(Number(e.target.value))} placeholder="15" style={INP} min={1} max={31} />
                </LField>
              </FormGrid>
            </div>
          </SCard>
        )}

        {/* ── NGÂN HÀNG ── */}
        {activeSection === 'finance' && (
          <SCard icon={Landmark} title="Ngân hàng (VietQR)" accent="#d97706">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormGrid>
                <LField label="Bank ID" hint="VD: VCB, MBBank, TCB">
                  <input value={bankId} onChange={e => setBankId(e.target.value)} placeholder="VCB" style={INP} />
                </LField>
                <LField label="Số tài khoản">
                  <input value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="1234567890" style={INP} />
                </LField>
                <LField label="Tên tài khoản">
                  <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="LOP TOAN NK" style={{ ...INP, textTransform: 'uppercase' }} />
                </LField>
              </FormGrid>
              <div>
                <Button variant="outline" intent="primary" size="sm" icon={<Eye size={13} />} onClick={() => setShowQR(true)}>
                  Xem thử QR VietQR
                </Button>
              </div>
              <QRModal open={showQR} onClose={() => setShowQR(false)} bankId={bankId} accountNo={accountNo} accountName={accountName} />
            </div>
          </SCard>
        )}

        {/* ── THÔNG BÁO ── */}
        {activeSection === 'notifications' && (
          <SCard icon={MessageSquare} title="Mẫu tin nhắn Zalo" accent="#06b6d4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <InfoPill tone="blue">Nhắc phí</InfoPill>
                <InfoPill tone="amber">Vắng học</InfoPill>
                <InfoPill tone="green">Thông báo lịch</InfoPill>
              </div>

              {/* Template selector */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={activeTplId}
                  onChange={e => setActiveTplId(e.target.value)}
                  style={{ flex: 1, minWidth: 0, ...INP }}
                >
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <Button size="sm" intent="primary" icon={<Plus size={13} />} onClick={() => { setEditingTpl(null); setShowTplModal(true); }}>Thêm</Button>
                <Button size="sm" intent="warning" variant="outline" icon={<Edit3 size={13} />} onClick={() => { setEditingTpl(activeTpl || null); setShowTplModal(true); }}>Sửa</Button>
                {templates.length > 1 && <Button size="sm" intent="danger" variant="outline" icon={<Trash2 size={13} />} onClick={() => setShowDeleteTpl(true)}>Xóa</Button>}
              </div>

              {/* Content editor */}
              <LField label="Nội dung mẫu">
                <textarea
                  value={tplContent}
                  onChange={e => { setTplContent(e.target.value); setTemplates(ts => ts.map(t => t.id === activeTplId ? { ...t, content: e.target.value } : t)); }}
                  rows={4}
                  style={{ ...INP, resize: 'vertical' }}
                  placeholder="Nội dung tin nhắn..."
                />
              </LField>

              {/* Variables */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginRight: 2 }}>Chèn biến:</span>
                {VARS.map(v => (
                  <button
                    key={v}
                    onClick={() => insertVar(v)}
                    style={{
                      fontSize: 11, fontWeight: 700, fontFamily: 'monospace', padding: '6px 12px',
                      border: '1px solid', borderRadius: 6, cursor: 'pointer',
                      background: copiedVar === v ? '#10b981' : '#f8fafc',
                      color: copiedVar === v ? 'white' : '#4338ca',
                      borderColor: copiedVar === v ? '#10b981' : '#c7d2fe',
                      transition: 'all 0.15s',
                    }}
                  >
                    {copiedVar === v ? <Check size={10} /> : null}{v}
                  </button>
                ))}
              </div>

              <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                  Xem trước
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#334155', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {renderZaloPreview(tplContent)}
                </p>
              </div>

              {/* Delete confirm */}
              {showDeleteTpl && (
                <div style={{ padding: 14, background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#be123c', margin: '0 0 10px' }}>Xóa mẫu "<b>{activeTpl?.name}</b>"?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="outline" intent="neutral" fullWidth onClick={() => setShowDeleteTpl(false)}>Hủy</Button>
                    <Button intent="danger" fullWidth onClick={handleDeleteTpl}>Xóa mẫu</Button>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Biến hỗ trợ: [Ten], [Lop], [Thang], [Nam], [SoTien], [Ngay]. Nội dung chỉ được copy/mở Zalo ở tab Tài chính, chưa gửi hàng loạt tự động.
              </p>
              <TemplateModal open={showTplModal} onClose={() => { setShowTplModal(false); setEditingTpl(null); }} initial={editingTpl} onSave={handleSaveTpl} />
            </div>
          </SCard>
        )}

        {/* ── DỮ LIỆU ── */}
        {activeSection === 'system' && (
          <SCard icon={Database} title="Dữ liệu hệ thống" accent="#dc2626">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Cache row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 9,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>Cache offline</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>Dữ liệu lưu tạm từ Google Sheets</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#6366f1', margin: '0 0 4px' }}>{cacheSize || '…'}</p>
                  <button
                    onClick={handleClearCache}
                    style={{ fontSize: 12, color: '#e11d48', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Xóa cache
                  </button>
                </div>
              </div>

              {/* Settings row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 9,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>Cài đặt ứng dụng</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>Lưu trong localStorage của trình duyệt</p>
                </div>
                <button
                  onClick={handleResetSettings}
                  style={{ fontSize: 12, color: '#e11d48', fontWeight: 700, background: '#fff1f2', border: '1px solid #fecaca', padding: '6px 14px', cursor: 'pointer', borderRadius: 7 }}
                >
                  Reset cài đặt
                </button>
              </div>

              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '4px 0 0', textAlign: 'right' }}>v27.1 · Lớp Toán NK</p>
            </div>
          </SCard>
        )}

      </div>

      {/* ── Mobile sticky save bar ─────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
          padding: '10px 16px',
          background: 'white',
          borderTop: '1px solid #e8edf2',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        }}>
          <Button intent="primary" fullWidth icon={<Save size={14} />} loading={saving} onClick={handleSaveAll} style={{ borderRadius: 9, fontWeight: 700, height: 46 }}>
            Lưu cài đặt
          </Button>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
