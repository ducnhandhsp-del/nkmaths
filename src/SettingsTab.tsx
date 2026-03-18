/**
 * SettingsTab.tsx — v27.1 (redesigned UI)
 * Logic: KHÔNG THAY ĐỔI — chỉ thiết kế lại giao diện
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  Plus, X, Trash2, Edit3, Check, Eye,
  Plug, School, DollarSign, Landmark, MessageSquare,
  Paintbrush, Database, Clock, ExternalLink, ChevronRight,
} from 'lucide-react';
import { cn, saveSettings, makeVietQR, getCacheSize } from './helpers';
import { ModalWrap } from './UIComponents';
import { Button, IconButton, Input, Select } from './dsComponents';

interface Props {
  bankId: string;        setBankId: (v: string) => void;
  accountNo: string;     setAccountNo: (v: string) => void;
  accountName: string;   setAccountName: (v: string) => void;
  scriptUrl: string;     setScriptUrl: (v: string) => void;
  gsOk: boolean | null;  saving: boolean; loadData: () => void;
  baseTuition: number;   setBaseTuition: (v: number) => void;
  schoolYear: string;    setSchoolYear: (v: string) => void;
  zaloTpl: string;       setZaloTpl: (v: string) => void;
  centerName: string;    setCenterName: (v: string) => void;
  teacher: string;       setTeacher: (v: string) => void;
  addr1: string;         setAddr1: (v: string) => void;
  addr2: string;         setAddr2: (v: string) => void;
  phone: string;         setPhone: (v: string) => void;
  accentColor: string;   setAccentColor: (v: any) => void;
  showId: boolean;       setShowId: (v: boolean) => void;
  hideInactive: boolean; setHideInactive: (v: boolean) => void;
  caDayOptions: string[];setCaDayOptions: (v: string[]) => void;
  teacherList: string[]; setTeacherList: (v: string[]) => void;
  uniqueBranches: string[];
}

interface ZaloTemplate { id: string; name: string; content: string; }
const TEMPLATE_KEY = 'ltn-message-templates';
const DEFAULT_TEMPLATE: ZaloTemplate = {
  id: 'default', name: 'Thông báo học phí',
  content: 'Chào anh/chị, học phí tháng [Thang] của cháu [Ten] là [SoTien]. Vui lòng đóng trước ngày 10. Cảm ơn!',
};
const VARS = ['[Ten]','[Lop]','[Thang]','[SoTien]','[Ngay]'];
const FONT_SIZES = [{ id:'sm',label:'Nhỏ',px:'14px' },{ id:'md',label:'Vừa',px:'16px' },{ id:'lg',label:'To',px:'18px' },{ id:'xl',label:'Rất to',px:'20px' }] as const;

/* ─── Grade Fees ──────────────────────────────────────────────────── */
const GRADE_FEES_KEY = 'ltn-grade-fees';
const ALL_GRADES = ['6','7','8','9','10','11','12'];

function loadGradeFees(): GradeFees {
  try { const s = localStorage.getItem(GRADE_FEES_KEY); if (s) return JSON.parse(s); } catch {}
  return {};
}
function saveGradeFees(fees: GradeFees) {
  try { localStorage.setItem(GRADE_FEES_KEY, JSON.stringify(fees)); } catch {}
}

function loadTemplates(): ZaloTemplate[] {
  try { const s = localStorage.getItem(TEMPLATE_KEY); if (s) return JSON.parse(s); } catch {}
  return [DEFAULT_TEMPLATE];
}
function saveTemplates(ts: ZaloTemplate[]) {
  try { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(ts)); } catch {}
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
              if (!name.trim()) { toast.error('Nhập tên mẫu!'); return; }
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
  baseTuition, setBaseTuition, schoolYear, setSchoolYear, zaloTpl, setZaloTpl,
  centerName, setCenterName, teacher, setTeacher, addr1, setAddr1, addr2, setAddr2,
  phone, setPhone, accentColor, setAccentColor, showId, setShowId, hideInactive, setHideInactive,
  caDayOptions, setCaDayOptions, teacherList, setTeacherList, uniqueBranches,
}: Props) {

  const [teacher1, setTeacher1] = useState(teacherList[0] || teacher || '');
  const [teacher2, setTeacher2] = useState(teacherList[1] || '');
  const [phone1,   setPhone1]   = useState(phone || '');
  const [sheetsUrl, setSheetsUrl] = useState(() => { try { return localStorage.getItem('ltn-sheetsUrl') || ''; } catch { return ''; } });
  const [docUrl,    setDocUrl]    = useState(() => { try { return localStorage.getItem('ltn-docUrl') || ''; } catch { return ''; } });
  const [showQR,   setShowQR]   = useState(false);
  const [fontSize, setFontSize] = useState<string>(() => { try { return localStorage.getItem('ltn-fontSize') || 'md'; } catch { return 'md'; } });
  const [darkMode, setDarkMode] = useState<boolean>(() => { try { return localStorage.getItem('ltn-darkMode') === 'true'; } catch { return false; } });
  const [cacheSize, setCacheSize] = useState('');
  const [templates, setTemplates]         = useState<ZaloTemplate[]>(() => loadTemplates());
  const [activeTplId, setActiveTplId]     = useState<string>(templates[0]?.id || 'default');
  const [showTplModal, setShowTplModal]   = useState(false);
  const [editingTpl, setEditingTpl]       = useState<ZaloTemplate | null>(null);
  const [tplContent, setTplContent]       = useState<string>(templates[0]?.content || DEFAULT_TEMPLATE.content);
  const [copiedVar, setCopiedVar]         = useState('');
  const [showDeleteTpl, setShowDeleteTpl] = useState(false);
  const [activeSection, setActiveSection] = useState('connection');
  const [gradeFees, setGradeFees] = useState<GradeFees>(() => loadGradeFees());
  const isMobile = useIsMobile();

  useEffect(() => { setCacheSize(getCacheSize()); }, []);
  useEffect(() => { const t = templates.find(t => t.id === activeTplId); if (t) setTplContent(t.content); }, [activeTplId, templates]);
  useEffect(() => {
    const px = FONT_SIZES.find(f => f.id === fontSize)?.px || '16px';
    document.documentElement.style.setProperty('--app-font-size', px);
    document.documentElement.style.fontSize = px;
    document.body.style.fontSize = px;
    const root = document.getElementById('root');
    if (root) root.style.fontSize = px;
    try { localStorage.setItem('ltn-fontSize', fontSize); } catch {}
  }, [fontSize]);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.background = '#0f172a';
      document.body.style.color = '#f1f5f9';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.background = '';
      document.body.style.color = '';
    }
    try { localStorage.setItem('ltn-darkMode', String(darkMode)); } catch {}
  }, [darkMode]);

  /* ── Handlers (logic giữ nguyên) ─────────────────────────────── */
  const handleLoadData = () => {
    if (!scriptUrl.trim().startsWith('https://script.google.com/macros/s/')) { toast.error('⚠️ Script URL không hợp lệ!'); return; }
    loadData();
  };
  const handleClearCache = () => { try { localStorage.removeItem('ltn-cache'); setCacheSize(getCacheSize()); toast.success('✅ Đã xóa cache!'); loadData(); } catch { toast.error('Lỗi xóa cache'); } };
  const silentLoadData = useCallback(() => loadData(), [loadData]);

  const handleSaveAll = () => {
    if (!scriptUrl.trim()) { toast.error('⚠️ Script URL không được để trống!'); return; }
    if (baseTuition <= 0)  { toast.error('⚠️ Học phí phải lớn hơn 0!'); return; }
    const newTeacherList = [teacher1, teacher2].filter(Boolean);
    setTeacherList(newTeacherList); setTeacher(teacher1); setPhone(phone1); setZaloTpl(tplContent);
    saveSettings({ baseTuition, schoolYear, zaloTpl: tplContent, bankId, accountNo, accountName, scriptUrl, centerName, teacher: teacher1, addr1, addr2, phone: phone1, accentColor, showId, hideInactive, caDayOptions, teacherList: newTeacherList, fontSize, darkMode });
    saveTemplates(templates);
    saveGradeFees(gradeFees);
    try { localStorage.setItem('ltn-sheetsUrl', sheetsUrl); } catch {}
    try { localStorage.setItem('ltn-docUrl', docUrl); } catch {}
    toast.success('✅ Đã lưu tất cả cài đặt!');
  };

  const handleSaveTpl = (t: ZaloTemplate) => {
    const exists = templates.find(x => x.id === t.id);
    const next = exists ? templates.map(x => x.id === t.id ? t : x) : [...templates, t];
    setTemplates(next); setActiveTplId(t.id); setTplContent(t.content); setShowTplModal(false); setEditingTpl(null); toast.success('✅ Đã lưu mẫu!');
  };
  const handleDeleteTpl = () => {
    if (templates.length <= 1) { toast.error('Cần ít nhất 1 mẫu!'); return; }
    const next = templates.filter(t => t.id !== activeTplId);
    setTemplates(next); setActiveTplId(next[0].id); setTplContent(next[0].content); setShowDeleteTpl(false); toast.success('Đã xóa mẫu!');
  };
  const insertVar = (v: string) => { setTplContent(c => c + v); setTemplates(ts => ts.map(t => t.id === activeTplId ? { ...t, content: tplContent + v } : t)); setCopiedVar(v); setTimeout(() => setCopiedVar(''), 1200); };
  const activeTpl = templates.find(t => t.id === activeTplId);

  /* ── Nav config ───────────────────────────────────────────────── */
  const navItems = [
    { id: 'connection', icon: Plug,         label: 'Kết nối',    accent: '#6366f1' },
    { id: 'center',     icon: School,        label: 'Trung tâm',  accent: '#0ea5e9' },
    { id: 'tuition',    icon: DollarSign,    label: 'Học phí',    accent: '#059669' },
    { id: 'bank',       icon: Landmark,      label: 'Ngân hàng',  accent: '#d97706' },
    { id: 'zalo',       icon: MessageSquare, label: 'Zalo',       accent: '#06b6d4' },
    { id: 'display',    icon: Paintbrush,    label: 'Giao diện',  accent: '#8b5cf6' },
    { id: 'data',       icon: Database,      label: 'Dữ liệu',    accent: '#dc2626' },
  ];

  const connColor = gsOk === true ? '#059669' : gsOk === false ? '#e11d48' : '#64748b';
  const connBg    = gsOk === true ? '#ecfdf5' : gsOk === false ? '#fff1f2' : '#f8fafc';
  const connText  = gsOk === true ? 'Kết nối thành công' : gsOk === false ? 'Lỗi kết nối' : 'Đang kiểm tra...';
  const activeNav = navItems.find(n => n.id === activeSection);

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
                    {item.id === 'connection' && (
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
                  {item.id === 'connection' && (
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

        {/* ── KẾT NỐI ── */}
        {activeSection === 'connection' && (
          <SCard icon={Plug} title="Kết nối & Dữ liệu" accent="#6366f1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <LField
                label="Google Apps Script URL"
                hint="URL triển khai của Google Apps Script — dùng để kết nối dữ liệu với Google Sheets"
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
                  <Button intent="primary" size="sm" icon={<RefreshCw size={13} />} loading={saving} onClick={handleLoadData}>Tải lại</Button>
                  <Button intent="danger" variant="outline" size="sm" icon={<Trash2 size={13} />} onClick={handleClearCache}>Xóa cache</Button>
                </div>
              </div>

              {/* Sheets + Doc links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <LField label="Google Sheets URL" hint="Link Google Sheets chứa dữ liệu học sinh, lịch học">
                  <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." style={INP} />
                </LField>
                <LField label="Google Doc URL" hint="Link Google Docs dùng để in phiếu, tạo báo cáo">
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
                <LField label="Tên trung tâm"><input value={centerName} onChange={e => setCenterName(e.target.value)} placeholder="Lớp Toán NK" style={INP} /></LField>
                <LField label="Giáo viên 1"><input value={teacher1} onChange={e => setTeacher1(e.target.value)} placeholder="Lê Đức Nhân" style={INP} /></LField>
                <LField label="Giáo viên 2"><input value={teacher2} onChange={e => setTeacher2(e.target.value)} placeholder="Nguyễn Thị Kiên" style={INP} /></LField>
                <LField label="SĐT liên hệ"><input value={phone1} onChange={e => setPhone1(e.target.value)} placeholder="0383634949" style={INP} /></LField>
                <LField label="Địa chỉ cơ sở 1"><input value={addr1} onChange={e => setAddr1(e.target.value)} placeholder="15/80 Đào Tấn" style={INP} /></LField>
                <LField label="Địa chỉ cơ sở 2"><input value={addr2} onChange={e => setAddr2(e.target.value)} placeholder="30 Nguyễn Quang Bích" style={INP} /></LField>
              </FormGrid>

              {/* Divider */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Clock size={12} color="#64748b" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ca dạy</span>
                </div>
                <TagList items={caDayOptions} setItems={setCaDayOptions} placeholder="Thêm ca (VD: 7h30, 19h30)..." />
              </div>
            </div>
          </SCard>
        )}

        {/* ── HỌC PHÍ ── */}
        {activeSection === 'tuition' && (
          <SCard icon={DollarSign} title="Học phí & Niên khóa" accent="#059669">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FormGrid>
                <LField label="Học phí cơ bản (đ/tháng)" hint={`Hiện tại: ${baseTuition.toLocaleString('vi-VN')}đ/tháng`}>
                  <input type="number" value={baseTuition} onChange={e => setBaseTuition(Number(e.target.value))} placeholder="600000" style={INP} min={0} />
                </LField>
                <LField label="Niên khóa" hint="Định dạng: YYYY-YYYY">
                  <input value={schoolYear} onChange={e => setSchoolYear(e.target.value)} placeholder="2025-2026" style={INP} />
                </LField>
              </FormGrid>

              {/* Học phí theo khối */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Học phí theo khối</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0', fontStyle: 'italic' }}>Để trống = dùng học phí cơ bản ({baseTuition.toLocaleString('vi-VN')}đ)</p>
                  </div>
                  <button
                    onClick={() => setGradeFees({})}
                    style={{ fontSize: 11, color: '#e11d48', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Xóa hết
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                  {ALL_GRADES.map(grade => {
                    const val = gradeFees[grade];
                    const isCustom = val !== undefined && val > 0;
                    return (
                      <div key={grade} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: isCustom ? '#059669' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                          Khối {grade}
                          {isCustom && <span style={{ fontSize: 9, background: '#dcfce7', color: '#059669', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>Tùy chỉnh</span>}
                        </label>
                        <input
                          type="number"
                          value={val || ''}
                          placeholder={baseTuition.toLocaleString('vi-VN')}
                          onChange={e => {
                            const n = Number(e.target.value);
                            setGradeFees(prev => {
                              const next = { ...prev };
                              if (!n) delete next[grade];
                              else next[grade] = n;
                              return next;
                            });
                          }}
                          style={{ ...INP, borderColor: isCustom ? '#a7f3d0' : '#e2e8f0', fontSize: 12 }}
                          min={0}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Tóm tắt */}
                {Object.keys(gradeFees).length > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#059669', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Tùy chỉnh: {Object.keys(gradeFees).length} khối
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(gradeFees).sort((a,b) => Number(a[0])-Number(b[0])).map(([g, fee]) => (
                        <span key={g} style={{ fontSize: 12, fontWeight: 700, background: 'white', border: '1px solid #a7f3d0', color: '#065f46', padding: '3px 10px', borderRadius: 6 }}>
                          Khối {g}: {fee.toLocaleString('vi-VN')}đ
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SCard>
        )}

        {/* ── NGÂN HÀNG ── */}
        {activeSection === 'bank' && (
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

        {/* ── ZALO ── */}
        {activeSection === 'zalo' && (
          <SCard icon={MessageSquare} title="Mẫu tin nhắn Zalo" accent="#06b6d4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

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

              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Biến sẽ được thay thế tự động khi gửi cho từng học sinh.</p>
              <TemplateModal open={showTplModal} onClose={() => { setShowTplModal(false); setEditingTpl(null); }} initial={editingTpl} onSave={handleSaveTpl} />
            </div>
          </SCard>
        )}

        {/* ── GIAO DIỆN ── */}
        {activeSection === 'display' && (
          <SCard icon={Paintbrush} title="Giao diện" accent="#8b5cf6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Cỡ chữ */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Cỡ chữ</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {FONT_SIZES.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFontSize(f.id)}
                      style={{
                        padding: '12px 8px', border: `1.5px solid ${fontSize === f.id ? '#8b5cf6' : '#e2e8f0'}`,
                        borderRadius: 9, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        background: fontSize === f.id ? '#f5f3ff' : 'white',
                        color: fontSize === f.id ? '#7c3aed' : '#475569',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: f.px, lineHeight: 1 }}>A</span>
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chế độ */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Chế độ hiển thị</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ id: false, label: '🌞 Sáng' }, { id: true, label: '🌙 Tối' }].map(m => (
                    <button
                      key={String(m.id)}
                      onClick={() => setDarkMode(m.id)}
                      style={{
                        flex: 1, padding: '11px 14px',
                        border: `1.5px solid ${darkMode === m.id ? '#8b5cf6' : '#e2e8f0'}`,
                        borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        background: darkMode === m.id ? '#f5f3ff' : 'white',
                        color: darkMode === m.id ? '#7c3aed' : '#475569',
                        transition: 'all 0.15s',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Tuỳ chọn hiển thị</p>
                <ToggleRow label="Hiển thị Mã HS trong danh sách" val={showId} onChange={setShowId} />
                <ToggleRow label="Ẩn học sinh đã nghỉ học theo mặc định" val={hideInactive} onChange={setHideInactive} />
              </div>
            </div>
          </SCard>
        )}

        {/* ── DỮ LIỆU ── */}
        {activeSection === 'data' && (
          <SCard icon={Database} title="Dữ liệu & Cache" accent="#dc2626">
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
                  onClick={() => { try { localStorage.removeItem('ltn-settings'); toast.success('✅ Đã xóa cài đặt!'); } catch { toast.error('Lỗi'); } }}
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

    </div>
  );
}
