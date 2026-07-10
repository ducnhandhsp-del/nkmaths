import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface FilterMenuProps {
  activeCount?: number;
  children: React.ReactNode;
  className?: string;
  label?: string;
  panelWidth?: number;
}

export default function FilterMenu({
  activeCount = 0,
  children,
  className,
  label = 'Lọc',
  panelWidth = 240,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={className} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        style={{
          height: 34,
          minWidth: 78,
          width: '100%',
          padding: '0 10px',
          borderRadius: 8,
          border: activeCount > 0 ? '1.5px solid #c7d2fe' : '1.5px solid #e2e8f0',
          background: activeCount > 0 ? '#eef2ff' : '#fff',
          color: activeCount > 0 ? '#4f46e5' : '#475569',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 900,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <SlidersHorizontal size={14} />
        <span>{label}{activeCount > 0 ? ` ${activeCount}` : ''}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: 80,
            width: panelWidth,
            maxWidth: 'calc(100vw - 32px)',
            padding: 10,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            background: '#fff',
            boxShadow: '0 18px 44px rgba(15,23,42,.16)',
            display: 'grid',
            gap: 8,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
