import React, { memo, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Menu,
  School,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { CacheMeta, DataSyncState, FinanceSub, OperationsSub, ReportsSub, Screen, TrainingSub } from './types';

export const NAV_ITEMS: {
  id: Screen;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string;
}[] = [
  { id: 'overview', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: LayoutDashboard, color: 'text-indigo-400' },
  { id: 'training', label: 'Đào tạo', shortLabel: 'Đào tạo', icon: GraduationCap, color: 'text-sky-400' },
  { id: 'operations', label: 'Vận hành', shortLabel: 'Vận hành', icon: Activity, color: 'text-violet-400' },
  { id: 'finance', label: 'Tài chính', shortLabel: 'Tài chính', icon: Wallet, color: 'text-orange-400' },
  { id: 'reports', label: 'Báo cáo', shortLabel: 'Báo cáo', icon: BarChart3, color: 'text-emerald-400' },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', icon: Settings, color: 'text-slate-400' },
];

export const BOTTOM_NAV_IDS: Screen[] = ['overview', 'training', 'operations', 'finance', 'reports'];

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', h);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isDesktop;
}

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 72;
const BRAND_NAME = 'LỚP TOÁN NK';

type SidebarNavProps = {
  active: Screen;
  set: (s: Screen) => void;
  centerName: string;
  onClose?: () => void;
  trainingSubtab?: TrainingSub;
  setTrainingSubtab?: (sub: TrainingSub) => void;
  operationsSubtab?: OperationsSub;
  setOperationsSubtab?: (sub: OperationsSub) => void;
  financeSubtab?: FinanceSub;
  setFinanceSubtab?: (sub: FinanceSub) => void;
  reportsSubtab?: ReportsSub;
  setReportsSubtab?: (sub: ReportsSub) => void;
  cacheMeta?: CacheMeta | null;
  syncState?: DataSyncState;
  collapsed?: boolean;
  setCollapsed?: (next: boolean) => void;
};

type FlatNavItem =
  { key: string; screen: Screen; sub?: TrainingSub | OperationsSub | FinanceSub | ReportsSub; label: string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }> };

const SIDEBAR_ITEMS: FlatNavItem[] = [
  { key: 'overview', screen: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'training', screen: 'training', sub: 'students', label: 'Đào tạo', icon: GraduationCap },
  { key: 'operations', screen: 'operations', sub: 'schedule', label: 'Vận hành', icon: Calendar },
  { key: 'finance', screen: 'finance', sub: 'debt', label: 'Học phí', icon: Wallet },
  { key: 'reports', screen: 'reports', sub: 'finance', label: 'Báo cáo', icon: BarChart3 },
  { key: 'settings', screen: 'settings', label: 'Cài đặt', icon: Settings },
];

function formatSyncTime(meta?: CacheMeta | null) {
  if (!meta?.cachedAt) return '';
  const date = new Date(meta.cachedAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function SyncBadge({ cacheMeta, syncState, compact = false }: {
  cacheMeta?: CacheMeta | null;
  syncState?: DataSyncState;
  compact?: boolean;
}) {
  const time = formatSyncTime(cacheMeta);
  const cfg =
    syncState === 'syncing'
      ? { label: 'Đang đồng bộ', bg: '#eef2ff', color: '#4f46e5' }
      : syncState === 'cache' || cacheMeta?.source === 'cache'
        ? { label: time ? `Cache ${time}` : 'Dữ liệu cache', bg: '#fffbeb', color: '#92400e' }
        : syncState === 'error'
          ? { label: 'Mất kết nối', bg: '#fff1f2', color: '#be123c' }
          : { label: time ? `Cập nhật ${time}` : 'Đã cập nhật', bg: '#ecfdf5', color: '#047857' };
  return (
    <span
      title={cacheMeta?.cachedAt ? `Dữ liệu cập nhật: ${new Date(cacheMeta.cachedAt).toLocaleString('vi-VN')}` : cfg.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: compact ? 24 : 28,
        padding: compact ? '3px 8px' : '5px 10px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        fontSize: compact ? 10 : 11,
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

const SidebarContent = memo(({
  active,
  set,
  centerName,
  onClose,
  trainingSubtab,
  setTrainingSubtab,
  operationsSubtab,
  setOperationsSubtab,
  financeSubtab,
  setFinanceSubtab,
  reportsSubtab,
  setReportsSubtab,
  cacheMeta,
  syncState,
  collapsed = false,
  setCollapsed,
}: SidebarNavProps) => {
  const openItem = (item: FlatNavItem) => {
    if (item.screen === 'training' && item.sub) setTrainingSubtab?.(item.sub as TrainingSub);
    if (item.screen === 'operations' && item.sub) setOperationsSubtab?.(item.sub as OperationsSub);
    if (item.screen === 'finance' && item.sub) setFinanceSubtab?.(item.sub as FinanceSub);
    if (item.screen === 'reports' && item.sub) setReportsSubtab?.(item.sub as ReportsSub);
    set(item.screen);
    onClose?.();
  };

  const isActiveItem = (item: FlatNavItem) => {
    if (active !== item.screen) return false;
    return true;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: '100dvh', background: '#1E1B4B', overflow: 'hidden' }}>
      <div style={{ padding: collapsed ? '18px 12px 16px' : '20px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 12, minHeight: 76, flexShrink: 0 }}>
        <button
          onClick={() => { set('overview'); onClose?.(); }}
          title="Về Tổng quan"
          style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <GraduationCap size={19} color="white" />
        </button>
        {!collapsed && <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: '#fff', fontSize: 16, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {BRAND_NAME}
          </div>
        </div>}
        {onClose && (
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={15} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '14px 10px' : '14px 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SIDEBAR_ITEMS.map(item => {
                const Icon = item.icon;
                const itemActive = isActiveItem(item);
                return (
                  <button
                    key={item.key}
                    onClick={() => openItem(item)}
                    aria-current={itemActive ? 'page' : undefined}
                    title={item.label}
                    style={{
                      width: '100%',
                      minHeight: 41,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? '9px 0' : '9px 10px',
                      borderRadius: 11,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13.5,
                      fontWeight: 800,
                      transition: 'all 0.13s',
                      background: itemActive ? '#4F46E5' : 'transparent',
                      color: itemActive ? '#fff' : 'rgba(255,255,255,0.72)',
                      boxShadow: itemActive ? '0 10px 22px rgba(79,70,229,0.28)' : 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => { if (!itemActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { if (!itemActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: itemActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)' }}>
                      <Icon size={15} color={itemActive ? 'white' : 'rgba(226,232,240,0.72)'} />
                    </span>
                    {!collapsed && <span style={{ flex: 1, minWidth: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>}
                  </button>
                );
              })}
        </div>
      </nav>

      <div style={{ padding: collapsed ? '10px' : '12px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            style={{ width: '100%', minHeight: 34, border: 'none', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: collapsed ? 0 : 8 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        {!collapsed && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: 'rgba(255,255,255,0.07)', padding: '10px 11px' }}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 7, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {BRAND_NAME}
            </div>
            <SyncBadge cacheMeta={cacheMeta} syncState={syncState} compact />
          </div>
        </div>}
      </div>
    </div>
  );
});

export const Sidebar = memo(({ isDesktop, ...navProps }: SidebarNavProps & { isDesktop: boolean }) => {
  const [collapsed, setCollapsedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ltnSidebarCollapsed') === '1';
  });
  const setCollapsed = (next: boolean) => {
    setCollapsedState(next);
    if (typeof window !== 'undefined') localStorage.setItem('ltnSidebarCollapsed', next ? '1' : '0');
  };
  if (!isDesktop) return null;
  const width = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
  return (
    <aside style={{ width, minWidth: width, height: '100dvh', minHeight: '100dvh', position: 'sticky', top: 0, alignSelf: 'stretch', background: '#1E1B4B', boxShadow: '8px 0 28px rgba(30,27,75,0.18)', flexShrink: 0, zIndex: 30, transition: 'width 0.18s ease, min-width 0.18s ease' }} className="print:hidden">
      <SidebarContent {...navProps} collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
});

export const MobileHeader = memo(({ active, set, centerName, isDesktop, ...navProps }: SidebarNavProps & { isDesktop: boolean }) => {
  const [open, setOpen] = useState(false);
  if (isDesktop) return null;

  return (
    <>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, background: 'white', borderBottom: '1px solid #e8edf2', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', paddingTop: 'env(safe-area-inset-top, 0px)', minHeight: 60, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} className="print:hidden">
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '10px 8px', display: 'flex', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', margin: '0 -4px' }}>
          <Menu size={22} />
        </button>
        <button onClick={() => set('overview')} title="Về Tổng quan" style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0 }}>
          <GraduationCap size={15} color="white" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 13, letterSpacing: '0.04em' }}>{BRAND_NAME}</div>
        </div>
        <SyncBadge cacheMeta={navProps.cacheMeta} syncState={navProps.syncState} compact />
      </header>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} />}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, width: 240, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)', boxShadow: '8px 0 32px rgba(0,0,0,0.35)' }} className="print:hidden">
        <SidebarContent active={active} set={set} centerName={centerName} {...navProps} onClose={() => setOpen(false)} />
      </div>
    </>
  );
});

const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(n => BOTTOM_NAV_IDS.includes(n.id));

export const BottomNav = memo(({ active, set, isDesktop }: {
  active: Screen; set: (s: Screen) => void; isDesktop: boolean;
}) => {
  if (isDesktop) return null;
  return (
    <nav className="ltn-bnav print:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'white', borderTop: '1px solid #e8edf2', display: 'flex', alignItems: 'stretch', minHeight: 64, paddingBottom: 'env(safe-area-inset-bottom,0px)', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
      {BOTTOM_NAV_ITEMS.map(({ id, shortLabel = '', icon: Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => set(id)} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 4px 7px', minHeight: 64, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#6366f1' : '#94a3b8', transition: 'color 0.15s' }}>
            <span style={{ width: 32, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? '#eef2ff' : 'transparent', transition: 'background 0.15s' }}>
              <Icon size={16} color={isActive ? '#6366f1' : '#94a3b8'} />
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: isActive ? '#6366f1' : '#94a3b8' }}>{shortLabel || id}</span>
          </button>
        );
      })}
    </nav>
  );
});
