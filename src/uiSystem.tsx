import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Info, RotateCcw, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { colors, radius, shadows, transition, typography } from './ds';
import { Button, FilterTabs, IconButton, SearchBar } from './dsComponents';
import { fmtVND, formatDate } from './helpers';

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

export type ConfirmVariant = 'info' | 'warning' | 'danger';

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

export type DetailMetricTone = 'violet' | 'amber' | 'emerald' | 'sky' | 'rose';

export function DetailMetric({
  label,
  value,
  tone,
  valueSize = 20,
  truncate = false,
}: {
  label: string;
  value: React.ReactNode;
  tone: DetailMetricTone;
  valueSize?: number;
  truncate?: boolean;
}) {
  const cfg = {
    violet: { bg: '#f5f3ff', color: '#7c3aed' },
    amber: { bg: '#fffbeb', color: '#d97706' },
    emerald: { bg: '#ecfdf5', color: '#059669' },
    sky: { bg: '#f0f9ff', color: '#0284c7' },
    rose: { bg: '#fff1f2', color: '#e11d48' },
  }[tone];
  return (
    <div style={{ background: cfg.bg, borderRadius: 8, padding: '10px 8px', minWidth: 0, textAlign: 'center' }}>
      <p style={{ fontSize: valueSize, fontWeight: 800, color: cfg.color, margin: 0, lineHeight: 1.1, ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const } : {}) }}>
        {value}
      </p>
      <p style={{ fontSize: 10, color: '#64748b', margin: '3px 0 0', fontWeight: 800 }}>{label}</p>
    </div>
  );
}

const CARD: React.CSSProperties = {
  background: 'white',
  border: `1px solid ${colors.neutral[200]}`,
  borderRadius: 14,
  boxShadow: '0 2px 16px rgba(79,70,229,0.08)',
};

const TH: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 900,
  color: colors.neutral[400],
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  background: colors.neutral[50],
  borderBottom: `1px solid ${colors.neutral[200]}`,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  lineHeight: 1.25,
};

const TD: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 13,
  color: colors.neutral[800],
  fontWeight: 700,
  borderBottom: `1px solid ${colors.neutral[100]}`,
  verticalAlign: 'middle',
  lineHeight: 1.35,
};

const DATA_TABLE_CSS = `
@keyframes uiSysLoad{0%{transform:translateX(-110%)}100%{transform:translateX(320%)}}
.ltn-data-table-card{background:white;border:1px solid ${colors.neutral[200]};border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,0.055);overflow:hidden}
.ltn-data-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ltn-data-table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0}
.ltn-data-table thead th:first-child{padding-left:16px}
.ltn-data-table tbody td:first-child{padding-left:16px}
.ltn-data-table thead th:last-child{padding-right:16px}
.ltn-data-table tbody td:last-child{padding-right:16px}
.ltn-data-table-row{transition:background .14s ease,box-shadow .14s ease}
.ltn-data-table-row:last-child .ltn-data-table-cell{border-bottom:none!important}
.ltn-data-table-cell{min-height:52px;overflow:hidden}
.ltn-data-table-cell p{margin-top:0}
.ltn-data-table-cell button,.ltn-data-table-cell a{white-space:nowrap}
.ltn-data-table-cell [style*="text-overflow"]{min-width:0}
@media(max-width:720px){
  .ltn-data-table-card{box-shadow:0 1px 8px rgba(15,23,42,.06)}
  .ltn-data-table-scroll{overflow-x:visible!important}
  .ltn-data-table{display:block}
  .ltn-data-table thead{display:none}
  .ltn-data-table tbody{display:grid;gap:10px;padding:10px;background:${colors.neutral[50]}}
  .ltn-data-table-row{display:block;border:1px solid ${colors.neutral[200]};border-radius:14px;background:white!important;overflow:hidden;box-shadow:0 1px 8px rgba(15,23,42,.04)}
  .ltn-data-table-cell{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:10px 12px!important;border-bottom:1px solid ${colors.neutral[100]}!important;text-align:right!important}
  .ltn-data-table-cell:last-child{border-bottom:none!important}
  .ltn-data-table-cell::before{content:attr(data-label);font-size:10px;font-weight:800;color:${colors.neutral[400]};text-transform:uppercase;letter-spacing:.06em;text-align:left;flex:0 0 38%;max-width:38%}
  .ltn-data-table-cell > *{max-width:62%;justify-content:flex-end}
}
`;

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
  general: {
    ...statusDefaults,
    success: { label: 'Đã xong', tone: 'success' },
    warning: { label: 'Cần chú ý', tone: 'warning' },
    danger: { label: 'Cảnh báo', tone: 'danger' },
    info: { label: 'Thông tin', tone: 'info' },
    all: { label: 'Tất cả', tone: 'neutral' },
  },
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

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message, { icon: 'i' }),
  copied: (message = 'Đã copy') => toast.success(message),
  zaloCopied: () => toast.success('Đã copy tin nhắn Zalo'),
};

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function PageToolbar({
  title,
  children,
  actions,
  embedded = false,
  hideActionsOnMobile = false,
  style,
  controlsStyle,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  embedded?: boolean;
  hideActionsOnMobile?: boolean;
  style?: React.CSSProperties;
  controlsStyle?: React.CSSProperties;
}) {
  const isMobileViewport = useIsMobileViewport();
  const shouldRenderActions = actions && (!hideActionsOnMobile || !isMobileViewport);

  return (
    <div
      className="ltn-page-toolbar"
      style={{
        ...CARD,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '12px 14px',
        ...style,
      }}
    >
      {!embedded && title && (
        <>
          <div style={{ flexShrink: 0 }}>
            {typeof title === 'string'
              ? <h2 className="ltn-page-toolbar-title" style={{ fontSize: 22, fontWeight: 800, color: colors.neutral[900], textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{title}</h2>
              : title}
          </div>
          <span className="ltn-page-toolbar-divider" style={{ width: 1, height: 22, background: colors.neutral[200], flexShrink: 0 }} />
        </>
      )}
      {children && (
        <div className="ltn-page-toolbar-controls" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, minWidth: 0, ...controlsStyle }}>
          {children}
        </div>
      )}
      {shouldRenderActions && (
        <div
          className={`ltn-page-toolbar-actions${hideActionsOnMobile ? ' ltn-page-toolbar-actions--mobile-hidden' : ''}`}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

export function ToolbarTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
      {tabs.map(tab => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              minHeight: 34,
              padding: '7px 13px',
              borderRadius: 999,
              border: selected ? `1px solid ${colors.primary[200]}` : `1px solid ${colors.neutral[200]}`,
              background: selected ? colors.primary[50] : 'white',
              color: selected ? colors.primary[600] : colors.neutral[500],
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: typography.fontFamily,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
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
    <div className="ltn-actionable-kpi-grid" style={{ display: 'grid', gridTemplateColumns: cols ? `repeat(${cols},1fr)` : 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
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
      className="ltn-actionable-kpi"
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
      <span className="ltn-actionable-kpi-icon" style={{ width: 42, height: 42, borderRadius: radius.md, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {iconNode(icon, 19, t.text)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="ltn-actionable-kpi-value" style={{ display: 'block', fontSize: 22, fontWeight: 800, color: colors.neutral[900], lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <span className="ltn-actionable-kpi-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.neutral[500], marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span className="ltn-actionable-kpi-sub" style={{ display: 'block', fontSize: 11, color: colors.neutral[400], marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
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
  style,
  className,
}: {
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  right?: React.ReactNode;
  hasActiveFilter?: boolean;
  onReset?: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        ...CARD,
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        boxShadow: '0 8px 18px rgba(15,23,42,.04)',
        ...style,
      }}
    >
      {onSearch && <SearchBar value={search || ''} onChange={onSearch} placeholder={searchPlaceholder} width={180} />}
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
  emptySub,
  emptyAction,
  loading,
  onRowClick,
  footer,
  scrollX = true,
  density = 'compact',
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string | number);
  emptyText?: string;
  emptySub?: React.ReactNode;
  emptyAction?: UiAction;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  footer?: React.ReactNode;
  scrollX?: boolean;
  density?: 'compact' | 'comfortable';
}) {
  const [hovRow, setHovRow] = useState<string | number | null>(null);
  const keyOf = (row: T) => typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
  const cellPad = density === 'comfortable' ? '13px 16px' : '10px 14px';
  return (
    <div className="ltn-data-table-card" aria-busy={loading || undefined}>
      {loading && <div style={{ height: 4, background: colors.neutral[100], overflow: 'hidden' }}><div style={{ height: '100%', width: '35%', background: colors.primary[500], animation: 'uiSysLoad 1.1s ease-in-out infinite' }} /></div>}
      <style>{DATA_TABLE_CSS}</style>
      <div className="ltn-data-table-scroll" style={{ overflowX: scrollX ? 'auto' : undefined }}>
        <table className="ltn-data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} scope="col" style={{ ...TH, padding: cellPad, textAlign: col.align || 'left', width: col.width, ...col.headerStyle }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: density === 'comfortable' ? '36px 16px' : '24px 12px' }}>
                  <EmptyState text={emptyText} sub={emptySub} action={emptyAction} compact={density === 'compact'} />
                </td>
              </tr>
            ) : data.map((row, idx) => {
              const key = keyOf(row);
              const isHover = hovRow === key;
              return (
                <tr
                  key={key}
                  className="ltn-data-table-row"
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => setHovRow(key)}
                  onMouseLeave={() => setHovRow(null)}
                  style={{
                    background: isHover ? '#f8fafc' : 'white',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.1s ease',
                  }}
                >
                  {columns.map(col => {
                    const value = row[col.key as keyof T];
                    return (
                      <td key={String(col.key)} className="ltn-data-table-cell" data-label={col.label} style={{ ...TD, padding: cellPad, textAlign: col.align || 'left', ...col.cellStyle }}>
                        {col.render ? col.render(value, row, idx) : String(value ?? '—')}
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
  style,
}: {
  text?: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
  action?: UiAction;
  compact?: boolean;
  style?: React.CSSProperties;
}) {
  const iconBox = icon ?? Inbox;
  return (
    <div className="ltn-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, textAlign: 'center', padding: compact ? '10px 6px' : '22px 10px', minHeight: compact ? 86 : 128, ...style }}>
      {!compact && (
        <div style={{ width: 42, height: 42, borderRadius: 14, background: colors.neutral[50], border: `1px solid ${colors.neutral[200]}`, color: colors.neutral[300], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {iconNode(iconBox, 21, colors.neutral[400])}
        </div>
      )}
      <p style={{ color: colors.neutral[600], fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.45 }}>{text}</p>
      {sub && <p style={{ color: colors.neutral[400], fontSize: 11, margin: 0, lineHeight: 1.5, maxWidth: 320 }}>{sub}</p>}
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
    <div className="ltn-modal-overlay ltn-form-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <form onSubmit={submit} className="ltn-modal-panel ltn-form-modal-panel" style={{ background: 'white', width: '100%', maxWidth: width, maxHeight: '92vh', borderRadius: radius.lg, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: shadows.xl }}>
        <header className="ltn-form-modal-header" style={{ padding: '18px 22px', borderBottom: `1px solid ${colors.neutral[100]}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: colors.neutral[900] }}>{title}</h3>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: colors.neutral[500], lineHeight: 1.5 }}>{subtitle}</p>}
          </div>
          <IconButton icon={<X size={18} />} label="Đóng" onClick={onClose} />
        </header>
        <div className="ltn-form-modal-body" style={{ flex: 1, overflowY: 'auto', padding: 22 }}>{children}</div>
        <footer className="ltn-form-modal-footer" style={{ padding: '14px 22px', borderTop: `1px solid ${colors.neutral[100]}`, background: colors.neutral[50], display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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

export function MoneyText({
  value,
  tone = 'neutral',
  compact = false,
  zero = '0đ',
  style,
}: {
  value?: number | null;
  tone?: UiTone | 'auto';
  compact?: boolean;
  zero?: string;
  style?: React.CSSProperties;
}) {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const resolvedTone: UiTone = tone === 'auto' ? (safe < 0 ? 'danger' : safe > 0 ? 'success' : 'neutral') : tone;
  const t = TONE[resolvedTone];
  const display = safe === 0 ? zero : compact ? formatMoneyCompact(safe) : fmtVND(safe);
  return <span style={{ color: t.text, fontWeight: 800, whiteSpace: 'nowrap', ...style }}>{display}</span>;
}

export function DateText({
  value,
  placeholder = '—',
  style,
}: {
  value?: string | number | Date | null;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const text = value ? formatDate(value) : placeholder;
  return <span style={{ color: colors.neutral[600], fontWeight: 700, whiteSpace: 'nowrap', ...style }}>{text}</span>;
}

export function MonthText({ month, year, style }: { month: number; year: number; style?: React.CSSProperties }) {
  return <span style={{ fontWeight: 800, color: colors.neutral[900], whiteSpace: 'nowrap', ...style }}>{`T${month}/${year}`}</span>;
}

function formatMoneyCompact(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${parseFloat((abs / 1_000_000_000).toFixed(1))} tỷ`;
  if (abs >= 1_000_000) return `${sign}${parseFloat((abs / 1_000_000).toFixed(1))}tr`;
  return `${sign}${fmtVND(abs)}`;
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

export function MobileCard({
  title,
  subtitle,
  badge,
  rows,
  actions,
  onClick,
  tone = 'neutral',
  style,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  rows?: { label: React.ReactNode; value: React.ReactNode }[];
  actions?: React.ReactNode;
  onClick?: () => void;
  tone?: UiTone;
  style?: React.CSSProperties;
}) {
  const t = TONE[tone];
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      style={{
        ...CARD,
        width: '100%',
        padding: 14,
        display: 'block',
        textAlign: 'left',
        borderRadius: 16,
        borderColor: onClick ? `${t.border}` : colors.neutral[200],
        boxShadow: '0 1px 10px rgba(15,23,42,.055)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: typography.fontFamily,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: colors.neutral[900], lineHeight: 1.32 }}>{title}</p>
          {subtitle && <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: colors.neutral[400], lineHeight: 1.45 }}>{subtitle}</p>}
        </div>
        {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
      </div>
      {!!rows?.length && (
        <div style={{ display: 'grid', gap: 7, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${colors.neutral[100]}` }}>
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
              <span style={{ color: colors.neutral[400], fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
              <span style={{ color: colors.neutral[800], fontWeight: 800, textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {actions && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>{actions}</div>}
    </div>
  );
}

export type MobileCompactMeta = {
  key: string;
  label: React.ReactNode;
  tone?: UiTone;
};

export function MobileCompactCard({
  title,
  subtitle,
  value,
  badge,
  meta,
  actions,
  onClick,
  tone = 'neutral',
  muted = false,
  style,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: MobileCompactMeta[];
  actions?: React.ReactNode;
  onClick?: () => void;
  tone?: UiTone;
  muted?: boolean;
  style?: React.CSSProperties;
}) {
  const t = TONE[tone];
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      style={{
        ...CARD,
        width: '100%',
        padding: '12px 12px',
        borderRadius: 14,
        borderColor: onClick ? t.border : colors.neutral[200],
        boxShadow: '0 1px 8px rgba(15,23,42,.045)',
        cursor: onClick ? 'pointer' : 'default',
        opacity: muted ? 0.64 : 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        gap: 10,
        alignItems: 'start',
        fontFamily: typography.fontFamily,
        ...style,
      }}
    >
      <div style={{ minWidth: 0, display: 'grid', gap: 7 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 950, color: colors.neutral[900], lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </p>
          {subtitle && (
            <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 750, color: colors.neutral[400], lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </p>
          )}
        </div>
        {!!meta?.length && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 5, minWidth: 0 }}>
            {meta.map(item => {
              const mt = TONE[item.tone || 'neutral'];
              return (
                <span
                  key={item.key}
                  style={{
                    minWidth: 0,
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 999,
                    border: `1px solid ${mt.border}`,
                    background: mt.bg,
                    color: mt.text,
                    fontSize: 11,
                    fontWeight: 850,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ minWidth: 74, display: 'grid', justifyItems: 'end', gap: 7 }}>
        {value && <div style={{ fontSize: 15, fontWeight: 950, color: colors.neutral[900], textAlign: 'right', whiteSpace: 'nowrap' }}>{value}</div>}
        {badge}
        {actions && <div onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'info',
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  if (!open) return null;
  const cfg = variant === 'danger'
    ? { tone: TONE.danger, icon: AlertTriangle }
    : variant === 'warning'
      ? { tone: TONE.warning, icon: AlertTriangle }
      : { tone: TONE.info, icon: Info };
  const Icon = cfg.icon;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <section style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: radius.lg, boxShadow: shadows.xl, padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: cfg.tone.bg, border: `1px solid ${cfg.tone.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Icon size={24} color={cfg.tone.text} />
        </div>
        <h3 style={{ margin: 0, textAlign: 'center', fontSize: 18, fontWeight: 800, color: colors.neutral[900] }}>{title}</h3>
        {message && <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, lineHeight: 1.6, color: colors.neutral[500] }}>{message}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <Button intent="neutral" variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button intent={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: React.ReactNode;
    message?: React.ReactNode;
    variant: ConfirmVariant;
    resolver: ((value: boolean) => void) | null;
  }>({ open: false, title: '', message: undefined, variant: 'info', resolver: null });

  const confirm = (title: React.ReactNode, message?: React.ReactNode, variant: ConfirmVariant = 'info') =>
    new Promise<boolean>(resolve => setState({ open: true, title, message, variant, resolver: resolve }));

  const close = () => {
    state.resolver?.(false);
    setState(prev => ({ ...prev, open: false, resolver: null }));
  };
  const accept = () => {
    state.resolver?.(true);
    setState(prev => ({ ...prev, open: false, resolver: null }));
  };
  const ConfirmComponent = () => (
    <ConfirmDialog open={state.open} title={state.title} message={state.message} variant={state.variant} onClose={close} onConfirm={accept} />
  );
  return { confirm, ConfirmDialog: ConfirmComponent };
}

export function ActionBar({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' | 'between' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'between' ? 'space-between' : align === 'left' ? 'flex-start' : 'flex-end', gap: 8, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}
