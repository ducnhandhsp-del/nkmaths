/**
 * StudentsTab.tsx — v26.2 (Design System)
 * MIGRATE:
 *   - Inline search div → SearchBar
 *   - Inline select → Select component
 *   - Lớp / Học lực span → Badge
 *   - Table action buttons → TableActions + IconButton
 *   - Bulk transfer button → Button intent="primary"
 *   - Toggle inactive → Button variant="outline"/"solid"
 *   - Pager → từ design-system (compatible API)
 * Logic/state/filter/pagination: KHÔNG THAY ĐỔI
 */
import React, { useState } from 'react';
import { UserPlus, Eye, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { IPP, capitalizeName, isStudentActive } from './helpers';
import { ScrollHintTable, FAB } from './AppComponents';
import { TABLE_WRAP, TH_SHARED, TD_SHARED, trStyle } from './AppComponents';
import { Badge, Pager, SearchBar, Button, IconButton, TableActions, Select } from './dsComponents';
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
  uClasses:        any[];
  onViewStudent:   (s: Student) => void;
  onEditStudent:   (s: Student) => void;
  onDeleteStudent: (t: DeleteTarget) => void;
  onAddStudent:    () => void;
  onBulkTransfer:  (ss: Student[]) => void;
  curMo:           number;
  curYr:           number;
  isPaid:          (sid: string, mo: number, yr: number) => boolean;
  zaloTpl:         string;
  baseTuition:     number;
}

const LEVEL_COLOR: Record<string, { color: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' }> = {
  'Xuất sắc':   { color: 'emerald' },
  'Giỏi':       { color: 'emerald' },
  'Khá':        { color: 'indigo'  },
  'Trung bình': { color: 'amber'   },
  'Yếu':        { color: 'rose'    },
};

/* ── StudentRow: dùng chung cho desktop table và mobile card ── */
function StudentRow({
  s, idx, selected, hovRow, setHovRow, toggle,
  onView, onEdit, onDelete,
}: {
  s: Student; idx: number;
  selected: Set<string>;
  hovRow: string | null;
  setHovRow: (id: string | null) => void;
  toggle: (id: string) => void;
  onView: (s: Student) => void;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
}) {
  const inactive  = !isStudentActive(s);
  const levelConf = LEVEL_COLOR[s.academicLevel] || { color: 'slate' as const };
  const TH = TH_SHARED;
  const TD = TD_SHARED;

  /* Desktop row */
  const desktopRow = (
    <tr
      key={`dt-${s.id}`}
      onMouseEnter={() => setHovRow(s.id)}
      onMouseLeave={() => setHovRow(null)}
      style={{ ...trStyle(idx, hovRow === s.id), opacity: inactive ? 0.5 : 1 }}
    >
      <td style={{ ...TD, width: 40, textAlign: 'center' }}>
        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} aria-label={`Chọn ${s.name}`} />
      </td>
      <td style={TD}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{capitalizeName(s.name)}</p>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{s.id}</p>
      </td>
      <td style={TD}><Badge color="indigo">{s.classId || '---'}</Badge></td>
      <td style={TD}><Badge color={levelConf.color}>{s.academicLevel || '---'}</Badge></td>
      <td style={TD}><span style={{ color: '#475569', fontWeight: 500 }}>{s.parentPhone || '---'}</span></td>
      <td style={{ ...TD, textAlign: 'center' }}>
        <TableActions actions={[
          { icon: <Eye   size={13} />, label: `Xem ${s.name}`, intent: 'primary', onClick: () => onView(s)   },
          { icon: <Edit3 size={13} />, label: `Sửa ${s.name}`, intent: 'warning', onClick: () => onEdit(s)   },
          { icon: <Trash2 size={13}/>, label: `Xóa ${s.name}`, intent: 'danger',  onClick: () => onDelete(s) },
        ]} />
      </td>
    </tr>
  );

  /* Mobile card */
  const mobileCard = (
    <div
      key={`mb-${s.id}`}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f9fafc', opacity: inactive ? 0.55 : 1 }}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{(s.name || '?').trim().split(' ').pop()?.[0]?.toUpperCase()}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capitalizeName(s.name)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <Badge color="indigo">{s.classId || '---'}</Badge>
          <Badge color={levelConf.color}>{s.academicLevel || '---'}</Badge>
          {s.parentPhone && <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.parentPhone}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onView(s)} style={{ width: 32, height: 32, borderRadius: 7, background: '#eef2ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} color="#4f46e5" /></button>
        <button onClick={() => onEdit(s)} style={{ width: 32, height: 32, borderRadius: 7, background: '#fffbeb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} color="#b45309" /></button>
      </div>
    </div>
  );

  return { desktopRow, mobileCard };
}

export default function StudentsTab({
  filtS, pgS, setPgS, students, qS, setQS,
  fCls, setFCls, uClasses,
  onViewStudent, onEditStudent, onDeleteStudent,
  onAddStudent, onBulkTransfer,
}: Props) {
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [hideInactive, setHideInactive] = useState(false);
  const [hovRow,       setHovRow]       = useState<string | null>(null);

  const visible = filtS.filter(s => hideInactive ? isStudentActive(s) : true);
  const paged   = visible.slice((pgS - 1) * IPP, pgS * IPP);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allPagedSelected = paged.length > 0 && paged.every(s => selected.has(s.id));
  const somePagedSelected = paged.some(s => selected.has(s.id));
  const toggleAll = () => {
    if (allPagedSelected) {
      setSelected(prev => { const next = new Set(prev); paged.forEach(s => next.delete(s.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); paged.forEach(s => next.add(s.id)); return next; });
    }
  };

  const selectedStudents = students.filter(s => selected.has(s.id));

  const TH = TH_SHARED;
  const TD = TD_SHARED;

  /* Class select options */
  const classOptions = [
    { value: '', label: 'Tất cả lớp' },
    ...uClasses.map(c => ({ value: c['Mã Lớp'], label: c['Mã Lớp'] })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header — pattern A: tên + separator + filters cùng hàng ── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Học sinh
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            {visible.length}/{students.length} học sinh
          </p>
        </div>

        <span style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Bulk transfer */}
        {selected.size > 0 && (
          <Button
            intent="primary"
            size="sm"
            icon={<ArrowRight size={14} />}
            iconPosition="left"
            onClick={() => { onBulkTransfer(selectedStudents); setSelected(new Set()); }}
          >
            Chuyển lớp ({selected.size})
          </Button>
        )}

        {/* Toggle ẩn HS nghỉ */}
        <Button
          variant={hideInactive ? 'solid' : 'outline'}
          intent={hideInactive ? 'primary' : 'neutral'}
          size="sm"
          onClick={() => { setHideInactive(h => !h); setPgS(1); }}
          aria-pressed={hideInactive}
        >
          {hideInactive ? '● Đang học' : '○ Tất cả'}
        </Button>

        <SearchBar
          value={qS}
          onChange={v => { setQS(v); setPgS(1); }}
          placeholder="Tìm tên, mã HS..."
          width={180}
        />

        <Select
          value={fCls}
          onChange={v => { setFCls(v); setPgS(1); }}
          options={classOptions}
        />
      </div>

      {/* ── Table (desktop) + Cards (mobile) ── */}
      <div style={TABLE_WRAP}>
        {/* Desktop table */}
        <div className="student-desktop-table">
          <style>{`.student-desktop-table{display:block}.student-mobile-cards{display:none}@media(max-width:767px){.student-desktop-table{display:none!important}.student-mobile-cards{display:block!important}}`}</style>
          <ScrollHintTable>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allPagedSelected}
                      ref={el => { if (el) el.indeterminate = somePagedSelected && !allPagedSelected; }}
                      onChange={toggleAll}
                      aria-label="Chọn tất cả trang này"
                      title={allPagedSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả trang này'}
                    />
                  </th>
                  {['Học sinh', 'Lớp', 'Học lực', 'SĐT phụ huynh', 'Thao tác'].map(h => (
                    <th key={h} style={{ ...TH, textAlign: h === 'Thao tác' ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '56px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 40 }}>👤</span>
                        <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 15, margin: 0 }}>Không có học sinh nào</p>
                        <Button intent="primary" size="sm" icon={<UserPlus size={14} />} onClick={onAddStudent}>Thêm học sinh đầu tiên</Button>
                      </div>
                    </td>
                  </tr>
                ) : paged.map((s, idx) =>
                  StudentRow({ s, idx, selected, hovRow, setHovRow, toggle,
                    onView: onViewStudent, onEdit: onEditStudent,
                    onDelete: s => onDeleteStudent({ type: 'student', id: s.id, name: s.name }),
                  }).desktopRow
                )}
              </tbody>
            </table>
          </ScrollHintTable>
        </div>

        {/* Mobile card list */}
        <div className="student-mobile-cards">
          {paged.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>👤</span>
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, margin: 0 }}>Không có học sinh nào</p>
              <button onClick={onAddStudent} style={{ padding: '8px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Thêm học sinh</button>
            </div>
          ) : paged.map((s, idx) =>
            StudentRow({ s, idx, selected, hovRow, setHovRow, toggle,
              onView: onViewStudent, onEdit: onEditStudent,
              onDelete: s => onDeleteStudent({ type: 'student', id: s.id, name: s.name }),
            }).mobileCard
          )}
        </div>

        <Pager page={pgS} total={visible.length} perPage={IPP} setPage={setPgS} showTotal />
      </div>

      <FAB onClick={onAddStudent} label="Thêm học sinh mới" icon={UserPlus} />
    </div>
  );
}
