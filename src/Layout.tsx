import React, { memo, useState, useEffect, useRef } from 'react';
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, GraduationCap, LayoutDashboard, Library, Menu, School, Settings, Users, Wallet, X } from 'lucide-react';
import type { Screen } from './types';

export const NAV_ITEMS: {
  id: Screen;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}[] = [
  { id: 'overview',    label: 'Tổng quan',  shortLabel: 'Tổng quan', icon: LayoutDashboard, color: 'text-indigo-400' },
  { id: 'operations',  label: 'Vận hành',   shortLabel: 'Vận hành',  icon: BookOpen,        color: 'text-violet-400' },
  { id: 'teachers',    label: 'Giáo viên',  shortLabel: 'GV',        icon: Users,           color: 'text-amber-400' },
  { id: 'classes',     label: 'Lớp học',    shortLabel: 'Lớp học',   icon: School,          color: 'text-sky-400' },
  { id: 'students',    label: 'Học sinh',   shortLabel: 'Học sinh',  icon: GraduationCap,   color: 'text-teal-400' },
  { id: 'materials',   label: 'Học liệu',   shortLabel: 'Học liệu',  icon: Library,         color: 'text-emerald-400' },
  { id: 'finance',     label: 'Tài chính',  shortLabel: 'Tài chính', icon: Wallet,          color: 'text-orange-400' },
  { id: 'reports',     label: 'Báo cáo',    shortLabel: 'Báo cáo',   icon: BarChart3,       color: 'text-rose-400' },
  { id: 'settings',    label: 'Cài đặt',    shortLabel: 'Cài đặt',   icon: Settings,        color: 'text-slate-400' },
];

// Bottom nav chỉ hiển thị 5 tab quan trọng nhất trên mobile
export const BOTTOM_NAV_IDS: Screen[] = ['operations','materials','finance','reports','settings'];

// Export để App.tsx gọi 1 lần duy nhất, truyền xuống props
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

const W_EXPANDED = 200;
const W_COLLAPSED = 48;  // ~0.8cm ≈ 30px, 48px for icon visibility

const SidebarContent = memo(({
  active, set, centerName, collapsed, onClose,
}: {
  active: Screen; set: (s: Screen) => void;
  centerName: string; collapsed?: boolean; onClose?: () => void;
}) => (
  <div style={{
    display: 'flex', flexDirection: 'column', height: '100%',
    background: 'linear-gradient(180deg,#0f1f3d 0%,#0a1628 100%)',
    overflow: 'hidden',
  }}>
    {/* Logo area */}
    <div style={{
      padding: collapsed ? '12px 0' : '14px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 10, minHeight: 56, flexShrink: 0,
    }}>
      <button
        onClick={() => set('overview')}
        title="Về Tổng quan"
        style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer', padding: 0,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.08)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 0 3px rgba(99,102,241,0.4)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}
      >
        <GraduationCap size={15} color="white" />
      </button>
      {!collapsed && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {centerName}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(147,197,253,0.5)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', marginTop: 1 }}>
            Quản lý giảng dạy
          </div>
        </div>
      )}
      {onClose && (
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={15} />
        </button>
      )}
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '8px 6px' : '8px 6px' }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => { set(id); onClose?.(); }}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            title={label}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 9,
              padding: collapsed ? '9px 0' : '8px 9px',
              borderRadius: 7, border: 'none', cursor: 'pointer', marginBottom: 1,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
              textTransform: 'uppercase', transition: 'all 0.13s',
              background: isActive ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.46)',
              boxShadow: isActive ? '0 3px 10px rgba(99,102,241,0.4)' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
            }}>
              <Icon size={13} color={isActive ? 'white' : undefined} className={isActive ? '' : color} />
            </span>
            {!collapsed && (
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Footer version */}
    {!collapsed && (
      <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
        v27.1
      </div>
    )}
  </div>
));

export const Sidebar = memo(({ active, set, centerName, isDesktop }: {
  active: Screen; set: (s: Screen) => void; centerName: string; isDesktop: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const w = collapsed ? W_COLLAPSED : W_EXPANDED;

  if (!isDesktop) return null;

  return (
    <aside style={{
      width: w, minWidth: w, minHeight: '100dvh', position: 'sticky', top: 0, alignSelf: 'flex-start',
      transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '3px 0 16px rgba(0,0,0,0.15)',
      flexShrink: 0, zIndex: 30,
    }} className="print:hidden">
      <SidebarContent active={active} set={set} centerName={centerName} collapsed={collapsed} />
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute', bottom: 44, right: -11, width: 22, height: 22,
          borderRadius: '50%', background: '#1e3a5f', border: '2px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10, flexShrink: 0,
        }}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        {collapsed
          ? <ChevronRight size={11} color="rgba(255,255,255,0.65)" />
          : <ChevronLeft  size={11} color="rgba(255,255,255,0.65)" />
        }
      </button>
    </aside>
  );
});

export const MobileHeader = memo(({ active, set, centerName, isDesktop }: {
  active: Screen; set: (s: Screen) => void; centerName: string; isDesktop: boolean;
}) => {
  const [open, setOpen] = useState(false);
  if (isDesktop) return null;
  const currentItem = NAV_ITEMS.find(n => n.id === active);

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        background: 'white',
        borderBottom: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 14px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        minHeight: 56,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }} className="print:hidden">
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '10px 8px', display: 'flex', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', margin: '0 -4px' }}>
          <Menu size={22} />
        </button>
        <button onClick={() => set('overview')} title="Về Tổng quan" style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0 }}>
          <GraduationCap size={15} color="white" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{centerName}</div>
          {currentItem && <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{currentItem.label}</div>}
        </div>
      </header>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} />}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, width: 240, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)', boxShadow: '8px 0 32px rgba(0,0,0,0.35)' }} className="print:hidden">
        <SidebarContent active={active} set={set} centerName={centerName} onClose={() => setOpen(false)} />
      </div>
    </>
  );
});

// Bottom nav 5 tab thực dụng nhất — Báo cáo thay Cài đặt (Cài đặt vẫn có trong sidebar)
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(n =>
  ['overview','operations','students','classes','finance','reports'].includes(n.id)
);

export const BottomNav = memo(({ active, set, isDesktop }: {
  active: Screen; set: (s: Screen) => void; isDesktop: boolean;
}) => {
  if (isDesktop) return null;
  return (
    <>
      <nav className="ltn-bnav print:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'white',
          borderTop: '1px solid #e8edf2',
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom,0px)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}>
        {BOTTOM_NAV_ITEMS.map(({ id, shortLabel = '', icon: Icon }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => set(id)}
              style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '8px 4px 7px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? '#6366f1' : '#94a3b8',
                transition: 'color 0.15s',
              }}>
              <span style={{
                width: 32, height: 24, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? '#eef2ff' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <Icon size={16} color={isActive ? '#6366f1' : '#94a3b8'} />
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.03em',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
                color: isActive ? '#6366f1' : '#94a3b8',
              }}>{shortLabel || id}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
});
