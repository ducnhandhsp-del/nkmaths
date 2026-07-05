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
  ExternalLink,
} from 'lucide-react';
import { saveSettings, makeVietQR, getCacheSize, fmtVND, formatDate } from './helpers';
import { ModalWrap, useConfirm } from './UIComponents';
import { Button, IconButton, Input } from './dsComponents';
import type { CacheMeta, DataSyncState } from './types';

interface Props {
  bankId: string;        setBankId: (v: string) => void;
  accountNo: string;     setAccountNo: (v: string) => void;
  accountName: string;   setAccountName: (v: string) => void;
  scriptUrl: string;     setScriptUrl: (v: string) => void;
  gsOk: boolean | null;  saving: boolean; loadData: () => void;
  cacheMeta?: CacheMeta | null; syncState?: DataSyncState;
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
      boxShadow: 'none',
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
  scriptUrl, setScriptUrl, gsOk, saving, loadData, cacheMeta, syncState,
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
  const [phone2,   setPhone2]   = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ltn-settings') || '{}');
      return String(saved.manager2Phone || '0364760584');
    } catch {
      return '0364760584';
    }
  });

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
  const isMobile = useIsMobile();

  useEffect(() => { setCacheSize(getCacheSize()); }, []);
  useEffect(() => { const t = templates.find(t => t.id === activeTplId); if (t) setTplContent(t.content); }, [activeTplId, templates]);

  const currentSettingsKey = JSON.stringify({
    bankId, accountNo, accountName, scriptUrl, baseTuition, schoolYear, tuitionDueDay,
    teacher1, teacher2, addr1, addr2, phone1, phone2,
    templates, tplContent, sheetsUrl, docUrl,
  });
  const [lastSavedKey, setLastSavedKey] = useState(currentSettingsKey);
  const hasUnsavedChanges = currentSettingsKey !== lastSavedKey;

  type SettingIssue = { label: string; detail: string; tone: 'danger' | 'warning'; section: string };
  const settingIssues: SettingIssue[] = [];
  if (!scriptUrl.trim()) settingIssues.push({ label: 'Thiếu Script URL', detail: 'App chưa có nguồn đồng bộ Google Sheets.', tone: 'danger', section: 'system' });
  else if (!scriptUrl.trim().startsWith('https://script.google.com/macros/s/')) settingIssues.push({ label: 'Script URL chưa chuẩn', detail: 'URL nên bắt đầu bằng link Web App của Google Apps Script.', tone: 'warning', section: 'system' });
  if (baseTuition <= 0) settingIssues.push({ label: 'Học phí chưa hợp lệ', detail: 'Mức học phí mặc định phải lớn hơn 0.', tone: 'danger', section: 'finance' });
  if (!/^\d{4}-\d{4}$/.test(schoolYear.trim())) settingIssues.push({ label: 'Niên khóa sai định dạng', detail: 'Dùng dạng 2026-2027.', tone: 'warning', section: 'finance' });
  if (tuitionDueDay < 1 || tuitionDueDay > 31) settingIssues.push({ label: 'Hạn đóng chưa hợp lệ', detail: 'Hạn đóng học phí phải từ ngày 1 đến 31.', tone: 'danger', section: 'finance' });
  if (!bankId.trim() || !accountNo.trim() || !accountName.trim()) settingIssues.push({ label: 'Thiếu thông tin ngân hàng', detail: 'QR/phiếu thu cần đủ Bank ID, STK và chủ tài khoản.', tone: 'warning', section: 'finance' });
  if (!teacher1.trim()) settingIssues.push({ label: 'Thiếu giáo viên chính', detail: 'Thông tin này dùng cho phiếu thu và dữ liệu mặc định.', tone: 'warning', section: 'center' });

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
    const defaultCenterName = 'LỚP TOÁN NK';
    const newTeacherList = [teacher1, teacher2].filter(Boolean);
    setCenterName(defaultCenterName);
    setTeacherList(newTeacherList); setTeacher(teacher1); setPhone(phone1); setZaloTpl(tplContent);
    saveSettings({ baseTuition, schoolYear, tuitionDueDay, zaloTpl: tplContent, bankId, accountNo, accountName, scriptUrl, centerName: defaultCenterName, teacher: teacher1, addr1, addr2, phone: phone1, manager2Phone: phone2, hideInactive, caDayOptions, teacherList: newTeacherList });
    saveTemplates(templates);
    try { localStorage.setItem('ltn-sheetsUrl', sheetsUrl); } catch {}
    try { localStorage.setItem('ltn-docUrl', docUrl); } catch {}
    setLastSavedKey(currentSettingsKey);
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

  const connColor = gsOk === true ? '#059669' : gsOk === false ? '#e11d48' : '#64748b';
  const connBg    = gsOk === true ? '#ecfdf5' : gsOk === false ? '#fff1f2' : '#f8fafc';
  const connText  = gsOk === true ? 'Kết nối thành công' : gsOk === false ? 'Lỗi kết nối' : 'Đang kiểm tra...';
  const cacheTimeText = cacheMeta?.cachedAt
    ? new Date(cacheMeta.cachedAt).toLocaleString('vi-VN')
    : 'Chưa có metadata cache';
  const syncText =
    syncState === 'syncing' ? 'Đang đồng bộ'
      : syncState === 'cache' ? 'Đang dùng dữ liệu lưu gần nhất'
        : syncState === 'error' ? 'Chưa đồng bộ được'
          : syncState === 'fresh' ? 'Dữ liệu mới từ Google Sheets'
            : 'Sẵn sàng';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: isMobile ? 96 : 0 }}>
      <style>{`
        .settings-command-grid{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:12px;align-items:center}
        .settings-zalo-grid{display:grid;grid-template-columns:260px minmax(0,1fr) 300px;gap:14px;align-items:start}
        @media(max-width:1180px){.settings-command-grid{grid-template-columns:1fr}.settings-zalo-grid{grid-template-columns:230px minmax(0,1fr)}.settings-zalo-preview{grid-column:1 / -1;position:static!important}}
        @media(max-width:767px){.settings-command-grid{grid-template-columns:1fr}.settings-zalo-grid{grid-template-columns:1fr}}
      `}</style>

      <div style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 12px 32px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        <div className="settings-command-grid" style={{ padding: isMobile ? 14 : 16, borderBottom: '1px solid #eef2f7', background: '#fbfdff' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trung tâm cấu hình</p>
            <h2 style={{ margin: '4px 0 0', fontSize: isMobile ? 21 : 24, fontWeight: 950, color: '#0f172a', letterSpacing: 0 }}>CÀI ĐẶT</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <InfoPill tone={gsOk === true ? 'green' : gsOk === false ? 'amber' : 'slate'}>{connText}</InfoPill>
            <InfoPill tone={syncState === 'cache' ? 'amber' : syncState === 'error' ? 'amber' : syncState === 'fresh' ? 'green' : 'blue'}>{syncText}</InfoPill>
            {settingIssues.length > 0 && <InfoPill tone="amber">{settingIssues.length} cảnh báo</InfoPill>}
            <Button intent="neutral" variant="outline" size="sm" icon={<RefreshCw size={13} />} loading={saving} onClick={handleLoadData}>Tải dữ liệu</Button>
            <Button intent={hasUnsavedChanges ? 'primary' : 'success'} size="sm" icon={<Save size={13} />} loading={saving} onClick={handleSaveAll}>
              {hasUnsavedChanges ? 'Lưu thay đổi' : 'Đã lưu'}
            </Button>
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── HỆ THỐNG ── */}
        {(
          <SCard icon={Plug} title="Hệ thống & kết nối" accent="#6366f1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <LField label="Apps Script URL">
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
                <LField label="Google Sheet ID / URL">
                  <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." style={INP} />
                </LField>
                <LField label="Google Doc URL">
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

              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 14, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 14px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 9,
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#374151', margin: 0 }}>Cache offline</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>Dữ liệu lưu tạm từ Google Sheets</p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>Cập nhật: {cacheTimeText}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: '#6366f1', margin: '0 0 4px' }}>{cacheSize || '…'}</p>
                    <button
                      onClick={handleClearCache}
                      style={{ fontSize: 12, color: '#e11d48', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Xóa cache
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 14px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 9,
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#374151', margin: 0 }}>Cài đặt ứng dụng</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>Lưu trong trình duyệt hiện tại</p>
                  </div>
                  <button
                    onClick={handleResetSettings}
                    style={{ fontSize: 12, color: '#e11d48', fontWeight: 800, background: '#fff1f2', border: '1px solid #fecaca', padding: '6px 12px', cursor: 'pointer', borderRadius: 7, flexShrink: 0 }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </SCard>
        )}

        {/* ── TRUNG TÂM ── */}
        {(
          <SCard icon={School} title="Thông tin trung tâm" accent="#0ea5e9">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <section style={{ border: '1px solid #dbeafe', borderRadius: 12, background: '#f8fbff', padding: 14, display: 'grid', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quản lý Nguyễn Quang Bích</p>
                  </div>
                  <LField label="Giáo viên/Quản lý">
                    <input value={teacher1} onChange={e => setTeacher1(e.target.value)} placeholder="Lê Đức Nhân" style={INP} />
                  </LField>
                  <LField label="SĐT/Zalo">
                    <input value={phone1} onChange={e => setPhone1(e.target.value)} placeholder="0383634949" style={INP} />
                  </LField>
                  <LField label="Cơ sở">
                    <input value={addr2} onChange={e => setAddr2(e.target.value)} placeholder="30 Nguyễn Quang Bích" style={INP} />
                  </LField>
                </section>

                <section style={{ border: '1px solid #ccfbf1', borderRadius: 12, background: '#f0fdfa', padding: 14, display: 'grid', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quản lý Đào Tấn</p>
                  </div>
                  <LField label="Giáo viên/Quản lý">
                    <input value={teacher2} onChange={e => setTeacher2(e.target.value)} placeholder="Nguyễn Thị Kiên" style={INP} />
                  </LField>
                  <LField label="SĐT/Zalo">
                    <input value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="0364760584" style={INP} />
                  </LField>
                  <LField label="Cơ sở">
                    <input value={addr1} onChange={e => setAddr1(e.target.value)} placeholder="15/80 Đào Tấn" style={INP} />
                  </LField>
                </section>
              </div>
            </div>
          </SCard>
        )}

        {/* ── TÀI CHÍNH ── */}
        {(
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 8 }}>
                <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #bbf7d0', background: '#ecfdf5' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#047857' }}>Lớp 2 buổi/tuần</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: '#64748b' }}>Đến kỳ ở 8/8, quá hạn khi vượt 8 buổi.</p>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#1d4ed8' }}>Lớp 3 buổi/tuần</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: '#64748b' }}>Đến kỳ ở 12/12, quá hạn khi vượt 12 buổi.</p>
                </div>
              </div>
            </div>
          </SCard>
        )}

        {/* ── NGÂN HÀNG ── */}
        {(
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
        {(
          <SCard icon={MessageSquare} title="Mẫu tin nhắn Zalo" accent="#06b6d4">
            <div className="settings-zalo-grid">
              <section style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mẫu đang dùng</p>
                {templates.map(t => {
                  const active = t.id === activeTplId;
                  return (
                    <button key={t.id} type="button" onClick={() => setActiveTplId(t.id)} style={{ width: '100%', minWidth: 0, padding: isMobile ? '9px 11px' : '10px 11px', borderRadius: 10, border: `1.5px solid ${active ? '#06b6d4' : '#e2e8f0'}`, background: active ? '#ecfeff' : 'white', textAlign: 'left', cursor: 'pointer', overflow: 'hidden' }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: active ? '#0e7490' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      <span style={{ display: isMobile ? 'none' : 'block', marginTop: 3, fontSize: 11, fontWeight: 700, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</span>
                    </button>
                  );
                })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  <Button size="sm" intent="primary" icon={<Plus size={13} />} onClick={() => { setEditingTpl(null); setShowTplModal(true); }}>Thêm</Button>
                  <Button size="sm" intent="warning" variant="outline" icon={<Edit3 size={13} />} onClick={() => { setEditingTpl(activeTpl || null); setShowTplModal(true); }}>Sửa</Button>
                </div>
                {templates.length > 1 && <Button size="sm" intent="danger" variant="outline" icon={<Trash2 size={13} />} onClick={() => setShowDeleteTpl(true)}>Xóa mẫu đang chọn</Button>}
              </section>

              <section style={{ display: 'grid', gap: 10, minWidth: 0 }}>
                <LField label="Nội dung mẫu">
                  <textarea
                    value={tplContent}
                    onChange={e => { setTplContent(e.target.value); setTemplates(ts => ts.map(t => t.id === activeTplId ? { ...t, content: e.target.value } : t)); }}
                    rows={9}
                    style={{ ...INP, resize: 'vertical', minHeight: 224, lineHeight: 1.55 }}
                    placeholder="Nội dung tin nhắn..."
                  />
                </LField>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginRight: 2 }}>Chèn biến</span>
                  {VARS.map(v => (
                    <button
                      key={v}
                      onClick={() => insertVar(v)}
                      style={{
                        fontSize: 11, fontWeight: 800, fontFamily: 'monospace', padding: '6px 10px',
                        border: '1px solid', borderRadius: 7, cursor: 'pointer',
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
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Biến hỗ trợ: [Ten], [Lop], [Thang], [Nam], [SoTien], [Ngay]. Nội dung chỉ được copy/mở Zalo ở tab Tài chính, chưa gửi hàng loạt tự động.
                </p>
              </section>

              <section className="settings-zalo-preview" style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, position: 'sticky', top: 12, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                  Xem trước tin nhắn
                </p>
                <div style={{ borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', padding: 12 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: '#334155', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {renderZaloPreview(tplContent)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                  <InfoPill tone="blue">Nhắc phí</InfoPill>
                  <InfoPill tone="amber">Vắng học</InfoPill>
                  <InfoPill tone="green">Lịch học</InfoPill>
                </div>
              </section>

              {/* Delete confirm */}
              {showDeleteTpl && (
                <div style={{ gridColumn: '1 / -1', padding: 14, background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#be123c', margin: '0 0 10px' }}>Xóa mẫu "<b>{activeTpl?.name}</b>"?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="outline" intent="neutral" fullWidth onClick={() => setShowDeleteTpl(false)}>Hủy</Button>
                    <Button intent="danger" fullWidth onClick={handleDeleteTpl}>Xóa mẫu</Button>
                  </div>
                </div>
              )}

              <TemplateModal open={showTplModal} onClose={() => { setShowTplModal(false); setEditingTpl(null); }} initial={editingTpl} onSave={handleSaveTpl} />
            </div>
          </SCard>
        )}

      </div>

      <ConfirmDialog />
    </div>
  );
}
