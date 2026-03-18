/**
 * RecruitmentTab.tsx — v25.1
 *
 * BUG FIX v24.1 — Layout & Modal:
 *  1. TiemNangModal: xoá minWidth:420 cứng → dùng ModalWrap size="md" (maxWidth:560)
 *     → modal không còn bị tràn ra ngoài viewport trên màn hình nhỏ
 *  2. Stats grid: repeat(4,1fr) → GridLayout với minColWidth=180
 *     → tự wrap thay vì squish/overflow
 *  3. Table: bọc trong TableContainer để overflow-x:auto an toàn
 *
 * REFACTOR v24.1:
 *  - Dùng design system từ UIComponents:
 *    PageHeader, GridLayout, StatCard, TableContainer, FilterBar,
 *    SearchInput, SelectFilter, ModalWrap, ModalHeader, ModalFooter,
 *    ActionBtn, IconBtn, StatusBadge, Avatar, EmptyState,
 *    Field, INP_CLS, TH_STYLE, TD_STYLE, TABLE_STYLE, DS
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus, Phone, Calendar, TrendingUp,
  Star, Edit3, Plus, ExternalLink, Link2, X,
} from 'lucide-react';
import { formatDate } from './helpers';
import {
  ModalWrap, ModalHeader, ModalFooter,
  Field, INP_CLS,
  PageHeader, GridLayout, StatCard, TableContainer,
  FilterBar, SearchInput, SelectFilter,
  ActionBtn, IconBtn, StatusBadge, Avatar, EmptyState,
  TH_STYLE, TD_STYLE, TABLE_STYLE, DS,
} from './UIComponents';
import type { Lead } from './types';

/* ── Lookup tables ── */
const STATUS: Record<Lead['status'], { label: string; bg: string; color: string }> = {
  new:         { label: 'Mới',            bg: '#eff6ff', color: '#2563eb' },
  contacted:   { label: 'Đã liên hệ',    bg: '#f5f3ff', color: '#7c3aed' },
  appointment: { label: 'Hẹn tư vấn',    bg: '#fffbeb', color: '#d97706' },
  registered:  { label: 'Đã đăng ký',    bg: '#ecfdf5', color: '#059669' },
  lost:        { label: 'Không đăng ký',  bg: '#f8fafc', color: '#94a3b8' },
};
const SOURCE_BG:    Record<Lead['source'], string> = { Facebook:'#eff6ff', Zalo:'#f0f9ff', 'Giới thiệu':'#ecfdf5', Website:'#eef2ff', Khác:'#f8fafc' };
const SOURCE_COLOR: Record<Lead['source'], string> = { Facebook:'#2563eb', Zalo:'#0284c7', 'Giới thiệu':'#059669', Website:'#6366f1', Khác:'#64748b' };

/* ── Local storage ── */
const LINK_KEY = 'ltn-recruitment-links';
const DEFAULT_LINKS = [
  { label: 'Form đăng ký tuyển sinh', url: '' },
  { label: 'Thông tin lớp học',       url: '' },
  { label: 'Thông tin giáo viên',     url: '' },
  { label: 'Học phí & ưu đãi',       url: '' },
];

/* ── Demo data ── */
const DEMO_LEADS: Lead[] = [
  { id:'L001', name:'Nguyễn Thị Lan', phone:'0912345678', source:'Facebook',    status:'appointment',
    appointmentDate: new Date(Date.now()+86400000*2).toISOString().split('T')[0],
    notes:'Con học lớp 9, cần ôn thi vào 10', grade:'9',
    createdAt: new Date(Date.now()-3*86400000).toISOString() },
  { id:'L002', name:'Trần Văn Minh',  phone:'0978654321', source:'Zalo',        status:'contacted',
    notes:'Hỏi về lớp 12 luyện thi ĐH', grade:'12',
    createdAt: new Date(Date.now()-7*86400000).toISOString() },
  { id:'L003', name:'Lê Thị Hoa',    phone:'0905123456', source:'Giới thiệu',  status:'new',
    notes:'Do phụ huynh HS NK003 giới thiệu', grade:'8',
    createdAt: new Date(Date.now()-86400000).toISOString() },
];

/* ══════════════════════════════════════════════════════
   MODAL THÊM / SỬA TIỀM NĂNG
   BUG FIX v24.1:
   - Xoá minWidth:420 cứng → modal tràn viewport trên mobile
   - Dùng ModalWrap size="md" (maxWidth 560, width 100%)
   - Dùng ModalHeader + ModalFooter nhất quán
══════════════════════════════════════════════════════ */
function TiemNangModal({ open, onClose, editing, onSave, isSaving }: {
  open: boolean; onClose: () => void;
  editing: Lead | null; onSave: (f: any) => void; isSaving: boolean;
}) {
  const [f, setF] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (open) setF(editing ?? { source: 'Facebook', status: 'new', createdAt: new Date().toISOString() });
  }, [open, editing]);

  if (!open) return null;

  const u = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  const canSave = !isSaving && !!f.name?.trim() && !!f.phone?.trim();

  return (
    /* BUG FIX: size="md" → maxWidth 560px + width:100% thay vì minWidth:420 cứng */
    <ModalWrap onClose={onClose} size="md">
      <ModalHeader
        title={editing ? 'Sửa thông tin tiềm năng' : 'Thêm học sinh tiềm năng'}
        onClose={onClose}
      />

      {/* Body */}
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Hàng 1: Tên + SĐT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="Tên *">
            <input
              value={f.name || ''} onChange={e => u('name', e.target.value)}
              placeholder="Nguyễn Văn A" className={INP_CLS}
            />
          </Field>
          <Field label="SĐT *">
            <input
              value={f.phone || ''} onChange={e => u('phone', e.target.value)}
              placeholder="0383..." className={INP_CLS}
            />
          </Field>
        </div>

        {/* Hàng 2: Nguồn + Trạng thái */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="Nguồn">
            <select value={f.source || 'Facebook'} onChange={e => u('source', e.target.value)} className={INP_CLS}>
              {(['Facebook', 'Zalo', 'Giới thiệu', 'Website', 'Khác'] as Lead['source'][]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={f.status || 'new'} onChange={e => u('status', e.target.value)} className={INP_CLS}>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Hàng 3: Khối + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="Khối lớp">
            <input
              value={f.grade || ''} onChange={e => u('grade', e.target.value)}
              placeholder="9, 10, 12..." className={INP_CLS}
            />
          </Field>
          <Field label="Email">
            <input
              value={f.email || ''} onChange={e => u('email', e.target.value)}
              placeholder="tuynchon@email.com" className={INP_CLS}
            />
          </Field>
        </div>

        {/* Ngày hẹn (chỉ hiện khi status = appointment) */}
        {f.status === 'appointment' && (
          <Field label="Ngày hẹn tư vấn">
            <input
              type="date"
              value={f.appointmentDate || ''}
              onChange={e => u('appointmentDate', e.target.value)}
              className={INP_CLS}
            />
          </Field>
        )}

        {/* Ghi chú */}
        <Field label="Ghi chú">
          <textarea
            value={f.notes || ''}
            onChange={e => u('notes', e.target.value)}
            placeholder="Nhu cầu, mục tiêu học tập..."
            rows={3}
            className={INP_CLS}
            style={{ resize: 'vertical' }}
          />
        </Field>
      </div>

      <ModalFooter>
        <ActionBtn onClick={onClose} variant="secondary">Hủy</ActionBtn>
        <ActionBtn
          onClick={() => onSave(f)}
          disabled={!canSave}
          style={{ background: DS.gradPink, border: 'none', color: 'white', boxShadow: '0 4px 12px rgba(219,39,119,0.3)' }}
        >
          {isSaving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
        </ActionBtn>
      </ModalFooter>
    </ModalWrap>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN TAB
══════════════════════════════════════════════════════ */
interface Props {
  leads: Lead[]; students: any[];
  onSaveLead: (f: any) => void;
  onDeleteLead: (id: string) => void;
  isSaving: boolean;
}

export default function RecruitmentTab({ leads: propLeads, students, onSaveLead, onDeleteLead, isSaving }: Props) {
  const leads = propLeads.length > 0 ? propLeads : DEMO_LEADS;
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<Lead['status'] | ''>('');
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState<Lead | null>(null);
  const [links,        setLinks]        = useState(() => {
    try { const s = localStorage.getItem(LINK_KEY); return s ? JSON.parse(s) : DEFAULT_LINKS; } catch { return DEFAULT_LINKS; }
  });
  const [editingLinks, setEditingLinks] = useState(false);
  const [hovRow,       setHovRow]       = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l =>
      (!q || l.name.toLowerCase().includes(q) || l.phone.includes(q)) &&
      (!filterStatus || l.status === filterStatus)
    );
  }, [leads, search, filterStatus]);

  const stats = useMemo(() => ({
    total:    leads.length,
    newCount: leads.filter(l => l.status === 'new').length,
    today:    leads.filter(l => l.appointmentDate === new Date().toISOString().split('T')[0]).length,
    convRate: leads.length > 0
      ? Math.round(leads.filter(l => l.status === 'registered').length / leads.length * 100)
      : 0,
  }), [leads]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: DS.gapMd }}>

      {/* Header */}
      <PageHeader
        title="Tuyển sinh"
        subtitle="Quản lý học sinh tiềm năng"
        action={
          <ActionBtn
            onClick={() => { setEditing(null); setShowModal(true); }}
            icon={Plus}
            style={{ background: DS.gradPink, border: 'none', color: 'white', boxShadow: '0 4px 14px rgba(219,39,119,0.35)' }}
          >
            Thêm tiềm năng
          </ActionBtn>
        }
      />

      {/* Stats — BUG FIX: GridLayout thay cho repeat(4,1fr) cứng */}
      <GridLayout minColWidth={160} gap={14}>
        <StatCard label="Tổng tiềm năng" value={stats.total}          gradient={DS.gradPink}   icon={UserPlus} />
        <StatCard label="Mới hôm nay"    value={stats.newCount}       gradient={DS.gradBlue}   icon={Star} />
        <StatCard label="Hẹn tư vấn"     value={stats.today}          gradient={DS.gradAmber}  icon={Calendar} />
        <StatCard label="Tỷ lệ đăng ký"  value={`${stats.convRate}%`} gradient={DS.gradGreen}  icon={TrendingUp} />
      </GridLayout>

      {/* Filters */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, SĐT..." />
        <SelectFilter value={filterStatus} onChange={v => setFilterStatus(v as any)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </SelectFilter>
        <span style={{
          fontSize: 13, fontWeight: 700, color: DS.textMuted,
          background: DS.surfaceMuted, padding: '8px 14px', borderRadius: DS.radiusMd,
        }}>
          {filtered.length} học sinh
        </span>
      </FilterBar>

      {/* Table — BUG FIX: TableContainer với overflow-x:auto */}
      <TableContainer>
        <table style={TABLE_STYLE}>
          <thead>
            <tr style={{ borderBottom: DS.borderLight }}>
              {['Học sinh', 'Nguồn', 'Trạng thái', 'Khối', 'Ghi chú', 'Ngày tạo', ''].map((h, i) => (
                <th key={i} style={{ ...TH_STYLE, textAlign: i === 6 ? 'center' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState emoji="🎯" title="Chưa có học sinh tiềm năng" subtitle="Nhấn 'Thêm tiềm năng' để bắt đầu" />
                </td>
              </tr>
            ) : filtered.map(l => {
              const st = STATUS[l.status];
              return (
                <tr
                  key={l.id}
                  onMouseEnter={() => setHovRow(l.id)}
                  onMouseLeave={() => setHovRow(null)}
                  style={{ background: hovRow === l.id ? '#fdf4ff' : 'white', transition: 'background 0.12s' }}
                >
                  {/* Học sinh */}
                  <td style={TD_STYLE}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={l.name} size="sm" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: DS.textHeading, margin: 0 }}>{l.name}</p>
                        <a href={`tel:${l.phone}`} style={{ fontSize: 12, color: DS.textLight, textDecoration: 'none' }}>
                          {l.phone}
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Nguồn */}
                  <td style={TD_STYLE}>
                    <StatusBadge label={l.source} bg={SOURCE_BG[l.source]} color={SOURCE_COLOR[l.source]} />
                  </td>

                  {/* Trạng thái */}
                  <td style={TD_STYLE}>
                    <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                  </td>

                  {/* Khối */}
                  <td style={TD_STYLE}>
                    <span style={{ color: DS.textMuted }}>Lớp {l.grade || '—'}</span>
                  </td>

                  {/* Ghi chú */}
                  <td style={{ ...TD_STYLE, maxWidth: 200 }}>
                    <p style={{ fontSize: 12, color: DS.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.notes || '—'}
                    </p>
                    {l.appointmentDate && (
                      <p style={{ fontSize: 11, color: '#d97706', fontWeight: 600, margin: '2px 0 0' }}>
                        📅 {l.appointmentDate}
                      </p>
                    )}
                  </td>

                  {/* Ngày tạo */}
                  <td style={TD_STYLE}>
                    <span style={{ color: DS.textLight, fontSize: 12 }}>
                      {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                      <IconBtn
                        onClick={() => { setEditing(l); setShowModal(true); }}
                        icon={Edit3} color="#f97316" bg="#fff7ed"
                        title="Chỉnh sửa"
                      />
                      <IconBtn
                        onClick={() => onDeleteLead(l.id)}
                        icon={X} color="#e11d48" bg="#fff1f2"
                        title="Xoá"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>

      {/* Liên kết hữu ích */}
      <div style={{
        background: DS.surfaceCard, borderRadius: DS.radiusLg,
        border: DS.borderLight, boxShadow: DS.shadowCard, padding: DS.gapMd,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            🔗 Liên kết hữu ích
          </p>
          <button
            onClick={() => {
              setEditingLinks(e => !e);
              if (editingLinks) { try { localStorage.setItem(LINK_KEY, JSON.stringify(links)); } catch {} }
            }}
            style={{
              padding: '6px 14px', borderRadius: 9,
              border: DS.borderLight,
              background: editingLinks ? DS.primary : 'white',
              color: editingLinks ? 'white' : DS.textMuted,
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}
          >
            {editingLinks ? '✓ Lưu' : '✎ Sửa'}
          </button>
        </div>

        {/* BUG FIX: dùng GridLayout thay cho repeat(2,1fr) cứng */}
        <GridLayout minColWidth={240} gap={10}>
          {links.map((link: any, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: DS.radiusMd,
              border: DS.borderLight, background: '#fafafa',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: '#eef2ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Link2 size={14} color={DS.primary} />
              </div>
              {editingLinks ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <input value={link.label}
                    onChange={e => setLinks((p: any[]) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: DS.textHeading, background: 'transparent', width: '100%' }} />
                  <input value={link.url} placeholder="https://..."
                    onChange={e => setLinks((p: any[]) => p.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                    style={{ border: 'none', outline: 'none', fontSize: 11, color: DS.textLight, background: 'transparent', width: '100%' }} />
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: DS.textHeading, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</p>
                  {link.url
                    ? <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: DS.primary, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{link.url}</a>
                    : <span style={{ fontSize: 11, color: '#cbd5e1' }}>Chưa có link</span>
                  }
                </div>
              )}
              {link.url && !editingLinks && (
                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                  <ExternalLink size={13} color={DS.textLight} />
                </a>
              )}
            </div>
          ))}
        </GridLayout>
      </div>

      {/* Modal */}
      <TiemNangModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editing={editing}
        onSave={f => { onSaveLead(f); setShowModal(false); }}
        isSaving={isSaving}
      />
    </div>
  );
}
