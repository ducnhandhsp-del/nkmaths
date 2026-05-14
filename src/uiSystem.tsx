import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { colors, radius, shadows, transition, typography } from './ds';
import { Button, FilterTabs, IconButton, SearchBar } from './dsComponents';

export type UiTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'violet'
  | 'teal';

export type StatusDomain =
  | 'student'
  | 'tuition'
  | 'lesson'
  | 'attendance'
  | 'teacher'
  | 'data'
  | 'general';

export interface UiAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  intent?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  variant?: 'solid' | 'outline' | 'ghost' | 'text';
  disabled?: boolean;
}

const TONE: Record<UiTone, { solid: string; text: string; bg: string; border: string; grad: string }> = {
  primary: { solid: colors.primary[500], text: colors.primary[600], bg: colors.primary[50], border: colors.primary[200], grad: colors.primary.grad },
  success: { solid: colors.success[500], text: colors.success[600], bg: colors.success[50], border: colors.success[200], grad: colors.success.grad },
  warning: { solid: colors.warning[500], text: colors.warning[600], bg: colors.warning[50], border: colors.warning[200], grad: colors.warning.grad },
  danger:  { solid: colors.danger[500],  text: colors.danger[600],  bg: colors.danger[50],  border: colors.danger[200],  grad: colors.danger.grad },
  info:    { solid: colors.info[500],    text: colors.info[600],    bg: colors.info[50],    border: '#bae6fd',          grad: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  neutral: { solid: colors.neutral[500], text: colors.neutral[600], bg: colors.neutral[50], border: colors.neutral[200], grad: 'linear-gradient(135deg,#64748b,#334155)' },
  violet:  { solid: colors.secondary[500], text: colors.secondary[600], bg: colors.secondary[50], border: '#ddd6fe', grad: colors.secondary.grad },
  teal:    { solid: colors.teal[500],    text: colors.teal[600],    bg: colors.teal[50],    border: '#99f6e4',          grad: colors.teal.grad },
};

const CARD: React.CSSProperties = {
  background: 'white',
  border: `1px solid ${colors.neutral[200]}`,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
};

const TH: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: colors.neutral[500],
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  background: colors.neutral[50],
  borderBottom: `1.5px solid ${colors.neutral[200]}`,
  whiteSpace: 'nowrap',
  textAlign: 'left',
};

const TD: React.CSSProperties = {
  padding: '13px 14px',
  fontSize: 13,
  color: colors.neutral[800],
  fontWeight: 500,
  borderBottom: `1px solid ${colors.neutral[100]}`,
  verticalAlign: 'middle',
};

const statusDefaults: Record<string, { label: string; tone: UiTone }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  inactive: { label: 'Ngừng hoạt động', tone: 'neutral' },
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  missing: { label: 'Thiếu dữ liệu', tone: 'warning' },
  invalid: { label: 'Bất thường', tone: 'danger' },
};

const statusByDomain: Record<StatusDomain, Record<string, { label: string; tone: UiTone }>> = {
  student: {
    active: { label: 'Đang học', tone: 'success' },
    onleave: { label: 'Tạm nghỉ', tone: 'warning' },
    inactive: { label: 'Đã nghỉ', tone: 'neutral' },
  },
  tuition: {
    paid: { label: 'Đã đóng', tone: 'success' },
    unpaid: { label: 'Chưa đóng', tone: 'danger' },
    partial: { label: 'Đóng thiếu', tone: 'warning' },
    overdue: { label: 'Quá hạn', tone: 'danger' },
  },
  lesson: {
    logged: { label: 'Đã ghi', tone: 'success' },
    not_logged: { label: 'Chưa ghi', tone: 'warning' },
    missing_att: { label: 'Thiếu điểm danh', tone: 'danger' },
  },
  attendance: {
    present: { label: 'Có mặt', tone: 'success' },
    absent: { label: 'Vắng', tone: 'danger' },
    excused: { label: 'Có phép', tone: 'warning' },
  },
  teacher: {
    active: { label: 'Đang dạy', tone: 'success' },
    onleave: { label: 'Nghỉ phép', tone: 'warning' },
    inactive: { label: 'Đã nghỉ', tone: 'neutral' },
    missing_profile: { label: 'Thiếu hồ sơ', tone: 'danger' },
  },
  data: {
    missing: { label: 'Thiếu dữ liệu', tone: 'warning' },
    invalid: { label: 'Bất thường', tone: 'danger' },
    synced: { label: 'Đã đồng bộ', tone: 'success' },
    local: { label: 'Dữ liệu cục bộ', tone: 'info' },
  },
  general: statusDefaults,
};

function iconNode(icon?: React.ReactNode | LucideIcon, size = 16, color?: string) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
  ) {
    const Icon = icon as React.ElementType;
    return <Icon size={size} color={color} />;
  }
  return icon;
}

function actionButton(action: UiAction, size: 'xs' | 'sm' | 'md' = 'md') {
  return (
    <Button
      key={action.label}
      size={size}
      intent={action.intent || 'primary'}
      variant={action.variant || 'solid'}
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}

export function PageScaffold({
  children,
  header,
  context,
  kpis,
  tasks,
  subtabs,
  filters,
  gap = 16,
  style,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  context?: React.ReactNode;
  kpis?: React.ReactNode;
  tasks?: React.ReactNode;
  subtabs?: React.ReactNode;
  filters?: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {header}
      {context}
      {kpis}
      {tasks}
      {subtabs}
      {filters}
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  meta,
  primaryAction,
  actions,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
  meta?: React.ReactNode;
  primaryAction?: UiAction;
  actions?: UiAction[];
  children?: React.ReactNode;
}) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      {icon && (
        <div style={{ width: 42, height: 42, borderRadius: 10, background: colors.primary[50], color: colors.primary[600], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {iconNode(icon, 20, colors.primary[600])}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 220 }}>
        {eyebrow && <div style={{ marginBottom: 3, fontSize: 11, fontWeight: 800, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>{eyebrow}</div>}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.neutral[900], textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{title}</h2>
        {description && <p style={{ fontSize: 12, color: colors.neutral[500], margin: '3px 0 0', lineHeight: 1.5 }}>{description}</p>}
        {meta && <div style={{ marginTop: 8 }}>{meta}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        {children}
        {actions?.map(a => actionButton({ ...a, variant: a.variant || 'outline' }, 'sm'))}
        {primaryAction && actionButton(primaryAction, 'md')}
      </div>
    </header>
  );
}

export function ContextBar({
  items,
  actions,
}: {
  items: { label?: string; value: React.ReactNode; icon?: React.ReactNode | LucideIcon; tone?: UiTone }[];
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ ...CARD, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item, i) => {
        const tone = TONE[item.tone || 'neutral'];
        return (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.text, fontSize: 12, fontWeight: 800 }}>
            {iconNode(item.icon, 13, tone.text)}
            {item.label && <span style={{ color: colors.neutral[500], fontWeight: 700 }}>{item.label}:</span>}
            <span>{item.value}</span>
          </div>
        );
      })}
      {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function ActionableKpiGrid({ children, cols }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols ? `repeat(${cols},1fr)` : 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
      {children}
    </div>
  );
}

export function ActionableKpi({
  icon,
  value,
  label,
  sub,
  tone = 'primary',
  onClick,
  actionLabel,
  delta,
}: {
  icon: React.ReactNode | LucideIcon;
  value: React.ReactNode;
  label: string;
  sub?: React.ReactNode;
  tone?: UiTone;
  onClick?: () => void;
  actionLabel?: string;
  delta?: number | null;
}) {
  const [hov, setHov] = useState(false);
  const t = TONE[tone];
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={!clickable}
      style={{
        ...CARD,
        width: '100%',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        border: `1.5px solid ${hov && clickable ? `${t.solid}55` : colors.neutral[200]}`,
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: hov && clickable ? `0 4px 16px ${t.solid}22` : '0 1px 3px rgba(15,23,42,0.05)',
        transform: hov && clickable ? 'translateY(-1px)' : 'none',
        transition: transition.normal,
        opacity: 1,
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 10, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {iconNode(icon, 19, t.text)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 22, fontWeight: 800, color: colors.neutral[900], lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.neutral[500], marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 11, color: colors.neutral[400], marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
      {delta != null && (
        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 999, background: delta > 0 ? '#dcfce7' : delta < 0 ? '#fee2e2' : colors.neutral[100], color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : colors.neutral[500], flexShrink: 0 }}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
      {clickable && actionLabel && hov && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: t.bg, color: t.text, flexShrink: 0 }}>{actionLabel}</span>}
    </button>
  );
}

export function QuickTaskList({
  title = 'Việc cần xử lý',
  tasks,
  emptyText = 'Không có việc cần xử lý',
}: {
  title?: string;
  tasks: {
    id: string;
    label: React.ReactNode;
    detail?: React.ReactNode;
    tone?: UiTone;
    icon?: React.ReactNode | LucideIcon;
    count?: React.ReactNode;
    onClick?: () => void;
    actionLabel?: string;
  }[];
  emptyText?: string;
}) {
  return (
    <section style={{ ...CARD, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.neutral[900] }}>{title}</h3>
        <StatusBadge domain="general" status={tasks.length ? 'pending' : 'active'} label={tasks.length ? `${tasks.length} việc` : 'Ổn'} />
      </div>
      {tasks.length === 0 ? (
        <EmptyState compact text={emptyText} />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {tasks.map(task => {
            const tone = TONE[task.tone || 'warning'];
            const Wrapper = task.onClick ? 'button' : 'div';
            return (
              <Wrapper
                key={task.id}
                type={task.onClick ? 'button' : undefined}
                onClick={task.onClick}
                style={{
                  width: '100%',
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                  cursor: task.onClick ? 'pointer' : 'default',
                  fontFamily: typography.fontFamily,
                }}
              >
                <span style={{ color: tone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{iconNode(task.icon, 16, tone.text)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: colors.neutral[900], lineHeight: 1.4 }}>{task.label}</span>
                  {task.detail && <span style={{ display: 'block', fontSize: 11, color: colors.neutral[500], marginTop: 1, lineHeight: 1.45 }}>{task.detail}</span>}
                </span>
                {task.count && <span style={{ fontSize: 12, fontWeight: 800, color: tone.text, background: 'white', borderRadius: 999, padding: '3px 8px', flexShrink: 0 }}>{task.count}</span>}
                {task.onClick && task.actionLabel && <span style={{ fontSize: 11, fontWeight: 800, color: tone.text, flexShrink: 0 }}>{task.actionLabel}</span>}
              </Wrapper>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function SubTabBar({
  tabs,
  active,
  onChange,
  variant = 'segment',
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number; disabled?: boolean }[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'segment' | 'pill' | 'underline';
}) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
      <FilterTabs tabs={tabs} active={active} onChange={onChange} variant={variant} size="sm" />
    </div>
  );
}

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Tìm kiếm...',
  filters,
  right,
  hasActiveFilter,
  onReset,
}: {
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  right?: React.ReactNode;
  hasActiveFilter?: boolean;
  onReset?: () => void;
}) {
  return (
    <div style={{ ...CARD, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {onSearch && <SearchBar value={search || ''} onChange={onSearch} placeholder={searchPlaceholder} width={260} />}
      {filters}
      {hasActiveFilter && onReset && (
        <Button size="sm" variant="outline" intent="neutral" icon={<RotateCcw size={14} />} onClick={onReset}>
          Reset
        </Button>
      )}
      {right && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{right}</div>}
    </div>
  );
}

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  emptyText = 'Không có dữ liệu',
  emptyAction,
  loading,
  onRowClick,
  footer,
  scrollX = true,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string | number);
  emptyText?: string;
  emptyAction?: UiAction;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  footer?: React.ReactNode;
  scrollX?: boolean;
}) {
  const [hovRow, setHovRow] = useState<string | number | null>(null);
  const keyOf = (row: T) => typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      {loading && <div style={{ height: 4, background: colors.neutral[100], overflow: 'hidden' }}><div style={{ height: '100%', width: '35%', background: colors.primary[500], animation: 'uiSysLoad 1.1s ease-in-out infinite' }} /></div>}
      <style>{`@keyframes uiSysLoad{0%{transform:translateX(-110%)}100%{transform:translateX(320%)}}`}</style>
      <div style={{ overflowX: scrollX ? 'auto' : undefined }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} style={{ ...TH, textAlign: col.align || 'left', width: col.width, ...col.headerStyle }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '44px 16px' }}>
                  <EmptyState text={emptyText} action={emptyAction} />
                </td>
              </tr>
            ) : data.map((row, idx) => {
              const key = keyOf(row);
              const isHover = hovRow === key;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => setHovRow(key)}
                  onMouseLeave={() => setHovRow(null)}
                  style={{
                    background: isHover ? '#eef2ff' : idx % 2 === 0 ? 'white' : '#f8fbff',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.1s ease',
                  }}
                >
                  {columns.map(col => {
                    const value = row[col.key as keyof T];
                    return (
                      <td key={String(col.key)} style={{ ...TD, textAlign: col.align || 'left', ...col.cellStyle }}>
                        {col.render ? col.render(value, row, idx) : String(value ?? '---')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer && <div style={{ borderTop: `1px solid ${colors.neutral[100]}`, background: colors.neutral[50] }}>{footer}</div>}
    </div>
  );
}

export function StatusBadge({
  domain = 'general',
  status,
  label,
  tone,
  dot = true,
}: {
  domain?: StatusDomain;
  status: string;
  label?: string;
  tone?: UiTone;
  dot?: boolean;
}) {
  const cfg = statusByDomain[domain]?.[status] || statusDefaults[status] || { label: status, tone: tone || 'neutral' };
  const t = TONE[tone || cfg.tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.text, flexShrink: 0 }} />}
      {label || cfg.label}
    </span>
  );
}

export function EntityLink({
  label,
  sub,
  icon,
  tone = 'primary',
  onClick,
}: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
  tone?: UiTone;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  const Wrapper = onClick ? 'button' : 'span';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        maxWidth: '100%',
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: typography.fontFamily,
        textAlign: 'left',
      }}
    >
      {icon && <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{iconNode(icon, 14, t.text)}</span>}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: onClick ? t.text : colors.neutral[900], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 11, color: colors.neutral[400], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
    </Wrapper>
  );
}

export function InlineAlert({
  tone = 'warning',
  title,
  children,
  action,
}: {
  tone?: UiTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: UiAction;
}) {
  const t = TONE[tone];
  return (
    <div style={{ border: `1px solid ${t.border}`, background: t.bg, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.solid, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: colors.neutral[900] }}>{title}</p>}
        {children && <div style={{ marginTop: title ? 2 : 0, fontSize: 12, color: colors.neutral[600], lineHeight: 1.5 }}>{children}</div>}
      </div>
      {action && actionButton({ ...action, variant: action.variant || 'outline', intent: action.intent || 'neutral' }, 'sm')}
    </div>
  );
}

export function EmptyState({
  text = 'Không có dữ liệu',
  sub,
  icon,
  action,
  compact = false,
}: {
  text?: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
  action?: UiAction;
  compact?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, textAlign: 'center', padding: compact ? '8px 4px' : '18px 8px' }}>
      {!compact && icon && <div style={{ color: colors.neutral[300] }}>{iconNode(icon, 34, colors.neutral[300])}</div>}
      <p style={{ color: colors.neutral[400], fontStyle: 'italic', fontSize: 13, margin: 0 }}>{text}</p>
      {sub && <p style={{ color: colors.neutral[400], fontSize: 11, margin: 0 }}>{sub}</p>}
      {action && actionButton(action, 'sm')}
    </div>
  );
}

export function DrawerPanel({
  open,
  onClose,
  title,
  subtitle,
  actions,
  footer,
  children,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: UiAction[];
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }} />
      <aside style={{ position: 'relative', background: 'white', width: '100%', maxWidth: width, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(15,23,42,0.18)' }} onClick={e => e.stopPropagation()}>
        <header style={{ padding: '18px 22px', borderBottom: `1px solid ${colors.neutral[100]}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: colors.neutral[900] }}>{title}</h3>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: colors.neutral[500], lineHeight: 1.5 }}>{subtitle}</p>}
          </div>
          {actions?.map(a => actionButton({ ...a, variant: a.variant || 'outline' }, 'sm'))}
          <IconButton icon={<X size={18} />} label="Đóng" onClick={onClose} />
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>{children}</div>
        {footer && <footer style={{ padding: '14px 22px', borderTop: `1px solid ${colors.neutral[100]}`, background: colors.neutral[50] }}>{footer}</footer>}
      </aside>
    </div>
  );
}

export function ModalForm({
  open,
  onClose,
  onSubmit,
  title,
  subtitle,
  children,
  submitLabel = 'Lưu',
  cancelLabel = 'Hủy',
  isSaving,
  submitDisabled,
  width = 760,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  submitDisabled?: boolean;
  width?: number;
}) {
  if (!open) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.resolve(onSubmit?.());
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <form onSubmit={submit} style={{ background: 'white', width: '100%', maxWidth: width, maxHeight: '92vh', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: shadows.xl }}>
        <header style={{ padding: '18px 22px', borderBottom: `1px solid ${colors.neutral[100]}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: colors.neutral[900] }}>{title}</h3>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: colors.neutral[500], lineHeight: 1.5 }}>{subtitle}</p>}
          </div>
          <IconButton icon={<X size={18} />} label="Đóng" onClick={onClose} />
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>{children}</div>
        <footer style={{ padding: '14px 22px', borderTop: `1px solid ${colors.neutral[100]}`, background: colors.neutral[50], display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button type="button" variant="outline" intent="neutral" onClick={onClose}>{cancelLabel}</Button>
          <Button type="submit" intent="primary" loading={isSaving} disabled={submitDisabled}>{submitLabel}</Button>
        </footer>
      </form>
    </div>
  );
}

export function MonthNavigator({
  month,
  year,
  onPrev,
  onNext,
  onToday,
  label,
}: {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  label?: string;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 4, borderRadius: 12, background: colors.neutral[100] }}>
      <IconButton size="sm" icon={<ChevronLeft size={15} />} label="Tháng trước" onClick={onPrev} />
      <div style={{ minWidth: 118, textAlign: 'center', padding: '0 8px' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: colors.neutral[900] }}>{label || `Tháng ${month}/${year}`}</p>
      </div>
      <IconButton size="sm" icon={<ChevronRight size={15} />} label="Tháng sau" onClick={onNext} />
      {onToday && <Button size="sm" variant="ghost" intent="neutral" onClick={onToday}>Hiện tại</Button>}
    </div>
  );
}

export function ChartPanel({
  title,
  subtitle,
  controls,
  legend,
  footer,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  controls?: React.ReactNode;
  legend?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ ...CARD, overflow: 'hidden' }}>
      <header style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.neutral[100]}`, display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.neutral[900] }}>{title}</h3>
          {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: colors.neutral[500] }}>{subtitle}</p>}
        </div>
        {controls}
      </header>
      <div style={{ padding: 16 }}>{children}</div>
      {(legend || footer) && (
        <footer style={{ padding: '10px 16px', borderTop: `1px solid ${colors.neutral[100]}`, background: colors.neutral[50], display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          {legend}
          {footer}
        </footer>
      )}
    </section>
  );
}

export function ViewToggle({
  views,
  active,
  onChange,
}: {
  views: { id: string; label: string; icon?: React.ReactNode | LucideIcon }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: colors.neutral[100], borderRadius: radius.lg }}>
      {views.map(view => {
        const isActive = view.id === active;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              border: 'none',
              borderRadius: radius.md,
              background: isActive ? 'white' : 'transparent',
              color: isActive ? colors.neutral[900] : colors.neutral[500],
              boxShadow: isActive ? shadows.sm : 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              transition: transition.fast,
              whiteSpace: 'nowrap',
            }}
          >
            {iconNode(view.icon, 14)}
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

export function ActionBar({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' | 'between' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'between' ? 'space-between' : align === 'left' ? 'flex-start' : 'flex-end', gap: 8, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}
