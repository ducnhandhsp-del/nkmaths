/**
 * CommandPalette.tsx — Lớp Toán NK v23.0
 * Overlay tìm kiếm và hành động nhanh (Ctrl+K / ⌘K).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Command } from 'lucide-react';
import { cn } from './helpers';
import type { Command as Cmd } from './useCommands';

interface CommandPaletteProps {
  open:     boolean;
  onClose:  () => void;
  commands: Cmd[];
}

const GROUP_ORDER = ['Điều hướng', 'Thêm mới', 'Điểm danh', 'Học sinh'];

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export default function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery]           = useState('');
  const [activeIdx, setActiveIdx]   = useState(0);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const listRef                     = useRef<HTMLDivElement>(null);

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* Filter — must be declared before keyboard useEffect */
  const q = normalize(query.trim());

  const filtered = useMemo<Cmd[]>(() => {
    if (!q) {
      // Default: show nav + quick actions
      return commands.filter(c => c.group === 'Điều hướng' || c.group === 'Thêm mới');
    }
    return commands.filter(c =>
      normalize(c.label).includes(q) ||
      c.keywords.some(kw => normalize(kw).includes(q))
    ).slice(0, 20);
  }, [commands, q]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); filtered[activeIdx]?.handler(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, filtered, activeIdx]);

  /* Group results */
  const grouped = useMemo(() => {
    const map = new Map<string, Cmd[]>();
    filtered.forEach(cmd => {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    });
    // Sort groups
    const out: { group: string; items: Cmd[] }[] = [];
    GROUP_ORDER.forEach(g => { if (map.has(g)) out.push({ group: g, items: map.get(g)! }); });
    map.forEach((items, g) => { if (!GROUP_ORDER.includes(g)) out.push({ group: g, items }); });
    return out;
  }, [filtered]);

  /* Scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-active="true"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  /* Flat list để tính index chính xác, không dùng biến mutable trong render */
  const flatItems = useMemo(() => grouped.flatMap(g => g.items), [grouped]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'cmdSlideIn 0.15s ease-out' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Tìm kiếm lệnh, học sinh, lớp..."
            className="flex-1 bg-transparent outline-none text-base font-semibold text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => { setQuery(''); setActiveIdx(0); }} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm italic">
              Không tìm thấy lệnh nào
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {group}
                </div>
                {items.map(cmd => {
                  const idx = flatItems.indexOf(cmd);
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={cmd.id}
                      data-active={isActive}
                      onClick={() => { cmd.handler(); onClose(); }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">
                        {cmd.icon}
                      </span>
                      <span className={cn(
                        'flex-1 text-sm font-semibold',
                        isActive ? 'text-indigo-700' : 'text-slate-700'
                      )}>
                        {cmd.label}
                      </span>
                      {isActive && (
                        <kbd className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs font-bold">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">↑↓</kbd> chọn</span>
          <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">↵</kbd> thực hiện</span>
          <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">ESC</kbd> đóng</span>
        </div>
      </div>

      <style>{`
        @keyframes cmdSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
