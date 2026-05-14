/**
 * StudentsTab.tsx — v29.0
 *
 * FIXES:
 *  [T1] Xoá 5 dead props: curMo, curYr, isPaid, zaloTpl, baseTuition
 *  [T2] hideInactive chuyển thành prop từ useDomains — bỏ local state duplicate,
 *       filtS từ useDomains đã áp dụng hideInactive (không lọc 2 lần nữa)
 *  [T3] Xoá dead alias TH/TD ở component level
 *  [T4] Bỏ anti-pattern "gọi function trả object" — inline row trong .map() trực tiếp,
 *       key đặt đúng trên element, không cần sub-component riêng
 */
import React, { useState } from 'react';
import { UserPlus, Eye, Edit3, Trash2, ArrowRight, MessageCircle } from 'lucide-react';
import { IPP, capitalizeName, isStudentActive } from './helpers';
import { ScrollHintTable, FAB } from './AppComponents';
import { TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import { Badge, Pager, SearchBar, Button, TableActions, Select, FilterChip } from './dsComponents';
import { EmptyState } from './UIComponents';
import { StatusBadge } from './uiSystem';
import type { Student, DeleteTarget } from './types';

interface Props {
  filtS:           Student[];
  pgS:             number;
  setPgS:          (p: number) => void;
  students:        Student[];
  qS:              string;
  setQS:           (v: string) => void;
  fCls:            string;
  setFCls:         (v: string) => void;
  /* FIX T2: hideInactive đến từ useDomains thay vì local state */
  hideInactive:    boolean;
  setHideInactive: (v: boolean) => void;
  uClasses:        any[];
  onViewStudent:   (s: Student) => void;
  onEditStudent:   (s: Student) => void;
  onDeleteStudent: (t: DeleteTarget) => void;
  onAddStudent:    () => void;
  onBulkTransfer:  (ss: Student[]) => void;
  embedded?:        boolean;
  /* FIX T1: đã xoá curMo, curYr, isPaid, zaloTpl, baseTuition */
}

const LEVEL_COLOR: Record<string, 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate'> = {
  'Xuất sắc': 'emerald', 'Giỏi': 'emerald',
  'Khá': 'indigo', 'Trung bình': 'amber', 'Yếu': 'rose',
};

export default function StudentsTab({
  filtS, pgS, setPgS, students, qS, setQS,
  fCls, setFCls, hideInactive, setHideInactive, uClasses,
  onViewStudent, onEditStudent, onDeleteStudent,
  onAddStudent, onBulkTransfer, embedded = false,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovRow,   setHovRow]   = useState<string | null>(null);

  /* FIX T2: filtS từ useDomains đã filter hideInactive — dùng trực tiếp, không filter thêm */
  const paged = filtS.slice((pgS - 1) * IPP, pgS * IPP);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allPagedSelected  = paged.length > 0 && paged.every(s => selected.has(s.id));
  const somePagedSelected = paged.some(s => selected.has(s.id));
  const toggleAll = () => {
    if (allPagedSelected) {
      setSelected(prev => { const next = new Set(prev); paged.forEach(s => next.delete(s.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); paged.forEach(s => next.add(s.id)); return next; });
    }
  };

  const selectedStudents = students.filter(s => selected.has(s.id));

  const classOptions = [
    { value: '', label: 'Tất cả lớp' },
    ...uClasses.map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] })),
  ];

  const emptyState = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <EmptyState
        title={qS || fCls ? 'Không tìm thấy học sinh phù hợp' : 'Chưa có học sinh'}
        subtitle={qS || fCls ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc lớp.' : 'Thêm học sinh đầu tiên để bắt đầu quản lý lớp.'}
      />
      {!embedded && <Button intent="primary" size="sm" icon={<UserPlus size={14} />} onClick={onAddStudent}>Thêm học sinh đầu tiên</Button>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: embedded ? 10 : 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        {!embedded && (
          <>
            <div style={{ flexShrink: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Học sinh</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                {filtS.length}/{students.length} · {students.filter(isStudentActive).length} đang học · {students.filter(s => !isStudentActive(s)).length} đã nghỉ
              </p>
            </div>
            <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />
          </>
        )}
        {embedded && (
          <span style={{ fontSize:12,fontWeight:700,color:'#64748b',background:'#f8fafc',border:'1px solid #e2e8f0',padding:'7px 10px',borderRadius:8 }}>
            {filtS.length}/{students.length} HS
          </span>
        )}

        {selected.size > 0 && (
          <Button intent="primary" size="sm" icon={<ArrowRight size={14} />} iconPosition="left"
            onClick={() => { onBulkTransfer(selectedStudents); setSelected(new Set()); }}>
            Chuyển lớp ({selected.size})
          </Button>
        )}

        {/* FIX T2: setHideInactive từ props — không còn local state */}
        <FilterChip
          label="Đang học"
          count={students.filter(isStudentActive).length}
          active={hideInactive}
          onClick={() => { setHideInactive(true); setPgS(1); }}
          color="indigo"
        />
        <FilterChip
          label="Tất cả"
          count={students.length}
          active={!hideInactive}
          onClick={() => { setHideInactive(false); setPgS(1); }}
          color="slate"
        />

        <SearchBar value={qS} onChange={v => { setQS(v); setPgS(1); }} placeholder="Tìm tên, mã HS..." width={180} />
        <Select value={fCls} onChange={v => { setFCls(v); setPgS(1); }} options={classOptions} />
      </div>

      {/* Table */}
      <div style={TABLE_WRAP}>
        {/* Desktop — FIX T4: inline row rendering, key đặt trực tiếp trên <tr> */}
        <div className="student-desktop-table">
          <style>{`.student-desktop-table{display:block}.student-mobile-cards{display:none}@media(max-width:767px){.student-desktop-table{display:none!important}.student-mobile-cards{display:block!important}}`}</style>
          <ScrollHintTable>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={{ ...TH_SHARED, width: 40, textAlign: 'center' }}>
                    <input type="checkbox" checked={allPagedSelected}
                      ref={el => { if (el) el.indeterminate = somePagedSelected && !allPagedSelected; }}
                      onChange={toggleAll}
                      aria-label="Chọn tất cả trang này"
                      title={allPagedSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả trang này'}
                    />
                  </th>
                  {['Học sinh', 'Lớp', 'Học lực', 'SĐT phụ huynh', 'Thao tác'].map(h => (
                    <th key={h} style={{ ...TH_SHARED, textAlign: h === 'Thao tác' ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '56px 16px', textAlign: 'center' }}>{emptyState}</td></tr>
                ) : paged.map((s, idx) => {
                const inactive   = !isStudentActive(s);
                const levelColor = LEVEL_COLOR[s.academicLevel] || 'slate';
                const studentZalo = String(s.studentPhone || '').replace(/\D/g, '');
                  return (
                    <tr key={s.id}
                      onMouseEnter={() => setHovRow(s.id)}
                      onMouseLeave={() => setHovRow(null)}
                      style={{ ...trStyle(idx, hovRow === s.id), opacity: inactive ? 0.5 : 1 }}
                    >
                      <td style={{ ...TD_SHARED, width: 40, textAlign: 'center' }}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} aria-label={`Chọn ${s.name}`} />
                      </td>
                      <td style={TD_SHARED}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{capitalizeName(s.name)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{s.id}</span>
                          <StatusBadge domain="student" status={inactive ? 'inactive' : 'active'} />
                        </div>
                      </td>
                      <td style={TD_SHARED}><Badge color="indigo">{s.classId || '---'}</Badge></td>
                      <td style={TD_SHARED}><Badge color={levelColor}>{s.academicLevel || '---'}</Badge></td>
                      <td style={TD_SHARED}><span style={{ color: '#475569', fontWeight: 500 }}>{s.parentPhone || '---'}</span></td>
                      <td style={{ ...TD_SHARED, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {s.facebookUrl && (
                            <a href={s.facebookUrl.startsWith('http') ? s.facebookUrl : `https://m.me/${s.facebookUrl}`}
                              target="_blank" rel="noopener noreferrer" title="Messenger PH"
                              style={{ width: 28, height: 28, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', textDecoration: 'none', flexShrink: 0 }}>
                              <MessageCircle size={13} />
                            </a>
                          )}
                          {studentZalo.length >= 9 && (
                            <a href={`https://zalo.me/${studentZalo}`}
                              target="_blank" rel="noopener noreferrer" title="Zalo HS"
                              style={{ width: 28, height: 28, background: '#eef6ff', border: '1px solid #bfdbfe', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0068FF', textDecoration: 'none', flexShrink: 0 }}>
                              <MessageCircle size={13} />
                            </a>
                          )}
                          <TableActions actions={[
                            { icon: <Eye    size={13} />, label: `Xem ${s.name}`, intent: 'primary', onClick: () => onViewStudent(s) },
                            { icon: <Edit3  size={13} />, label: `Sửa ${s.name}`, intent: 'warning', onClick: () => onEditStudent(s) },
                            { icon: <Trash2 size={13} />, label: `Xóa ${s.name}`, intent: 'danger',  onClick: () => onDeleteStudent({ type: 'student', id: s.id, name: s.name }) },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollHintTable>
        </div>

        {/* Mobile — FIX T4: inline, key trực tiếp trên <div> */}
        <div className="student-mobile-cards">
          {paged.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              {emptyState}
            </div>
          ) : paged.map((s, idx) => {
            const inactive   = !isStudentActive(s);
            const levelColor = LEVEL_COLOR[s.academicLevel] || 'slate';
            const studentZalo = String(s.studentPhone || '').replace(/\D/g, '');
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f9fafc', opacity: inactive ? 0.55 : 1 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>
                    {(s.name || '?').trim().split(' ').pop()?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capitalizeName(s.name)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <StatusBadge domain="student" status={inactive ? 'inactive' : 'active'} />
                    <Badge color="indigo">{s.classId || '---'}</Badge>
                    <Badge color={levelColor}>{s.academicLevel || '---'}</Badge>
                    {s.parentPhone && <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.parentPhone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {studentZalo.length >= 9 && (
                    <a href={`https://zalo.me/${studentZalo}`}
                      target="_blank" rel="noopener noreferrer" title="Zalo HS"
                      style={{ width: 32, height: 32, borderRadius: 7, background: '#eef6ff', border: '1px solid #bfdbfe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0068FF', textDecoration: 'none' }}>
                      <MessageCircle size={14} />
                    </a>
                  )}
                  <button onClick={() => onViewStudent(s)} style={{ width: 32, height: 32, borderRadius: 7, background: '#eef2ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} color="#4f46e5" /></button>
                  <button onClick={() => onEditStudent(s)} style={{ width: 32, height: 32, borderRadius: 7, background: '#fffbeb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} color="#b45309" /></button>
                </div>
              </div>
            );
          })}
        </div>

        <Pager page={pgS} total={filtS.length} perPage={IPP} setPage={setPgS} showTotal />
      </div>

      {!embedded && <FAB onClick={onAddStudent} label="Thêm học sinh mới" icon={UserPlus} />}
    </div>
  );
}
