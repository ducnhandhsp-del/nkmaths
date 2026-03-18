import React, { useEffect, useRef, memo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Edit3, Calendar, Users, X, AlertTriangle, LucideIcon } from 'lucide-react';
import { cn, formatDate } from './helpers';

export const DS = {
  surfaceBase:'#f8fafc', surfaceCard:'#ffffff', surfaceMuted:'#f1f5f9',
  borderLight:'1px solid #e2e8f0', borderMuted:'1px solid #f1f5f9',
  radiusSm:10, radiusMd:14, radiusLg:18, radiusXl:22,
  shadowCard:'0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowModal:'0 8px 40px rgba(0,0,0,0.18)',
  textHeading:'#0f172a', textBody:'#334155', textMuted:'#64748b', textLight:'#94a3b8',
  gapSm:10, gapMd:16, gapLg:24,
  primary:'#6366f1', primaryDark:'#4f46e5', primaryLight:'#eef2ff',
  gradBlue:'linear-gradient(135deg,#3b82f6,#2563eb)',
  gradIndigo:'linear-gradient(135deg,#6366f1,#4f46e5)',
  gradGreen:'linear-gradient(135deg,#10b981,#059669)',
  gradAmber:'linear-gradient(135deg,#f59e0b,#d97706)',
  gradRose:'linear-gradient(135deg,#f43f5e,#e11d48)',
  gradPink:'linear-gradient(135deg,#db2777,#be185d)',
  gradViolet:'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  gradTeal:'linear-gradient(135deg,#14b8a6,#0d9488)',
  gradOrange:'linear-gradient(135deg,#f97316,#ea580c)',
  gradSlate:'linear-gradient(135deg,#475569,#334155)',
} as const;

export const TH_STYLE: React.CSSProperties = { padding:'11px 14px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', background:'#f8fafc', whiteSpace:'nowrap', textAlign:'left' };
export const TD_STYLE: React.CSSProperties = { padding:'12px 14px', fontSize:15, color:'#334155', fontWeight:500, borderBottom:'1px solid #f1f5f9' };
export const TABLE_STYLE: React.CSSProperties = { width:'100%', borderCollapse:'collapse', minWidth:'min-content' };
export const INP_CLS = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-300 transition-all bg-white';
export const SEL_CLS = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white cursor-pointer';
export const TA_CLS  = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-300 resize-none bg-white';

export function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?:React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:DS.gapMd }}>
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:DS.textHeading, textTransform:'uppercase', letterSpacing:'0.04em', margin:0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:13, color:DS.textMuted, margin:'3px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, style, className, noPadding }: { children:React.ReactNode; style?:React.CSSProperties; className?:string; noPadding?:boolean }) {
  return <div className={className} style={{ background:DS.surfaceCard, borderRadius:DS.radiusLg, border:DS.borderLight, boxShadow:DS.shadowCard, overflow:'hidden', padding:noPadding?0:DS.gapMd, ...style }}>{children}</div>;
}

export const StatCard = memo(function StatCard({ label, value, gradient, icon: Icon, sub }: { label:string; value:string|number; gradient:string; icon:LucideIcon; sub?:string }) {
  return (
    <div style={{ background:gradient, borderRadius:DS.radiusLg, padding:'18px 18px 14px', position:'relative', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.10)', minWidth:0 }}>
      <div style={{ position:'absolute', right:-8, top:-8, opacity:0.12, pointerEvents:'none' }}><Icon size={64} color="white"/></div>
      <p style={{ fontSize:26, fontWeight:800, color:'white', margin:0, position:'relative', lineHeight:1.1 }}>{value}</p>
      <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'5px 0 0', position:'relative' }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:'rgba(255,255,255,0.65)', margin:'2px 0 0', position:'relative' }}>{sub}</p>}
    </div>
  );
});

export function GridLayout({ children, minColWidth=200, gap=DS.gapMd, style }: { children:React.ReactNode; minColWidth?:number; gap?:number; style?:React.CSSProperties }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fit,minmax(${minColWidth}px,1fr))`, gap, ...style }}>{children}</div>;
}

export function Grid2({ children, gap=DS.gapMd, style }: { children:React.ReactNode; gap?:number; style?:React.CSSProperties }) {
  return <div className="two-col" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap, ...style }}>{children}</div>;
}

export function TableContainer({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div style={{ background:DS.surfaceCard, borderRadius:DS.radiusLg, border:DS.borderLight, boxShadow:DS.shadowCard, overflow:'hidden', ...style }}>
      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>{children}</div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children:React.ReactNode; action?:React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <h3 style={{ fontSize:11, fontWeight:700, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>{children}</h3>
      {action}
    </div>
  );
}

export function EmptyState({ emoji='📭', title, subtitle }: { emoji?:string; title:string; subtitle?:string }) {
  return (
    <div style={{ padding:'48px 24px', textAlign:'center', color:DS.textLight }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{emoji}</div>
      <p style={{ fontSize:15, fontWeight:700, color:DS.textMuted, margin:0 }}>{title}</p>
      {subtitle && <p style={{ fontSize:13, color:DS.textLight, margin:'6px 0 0' }}>{subtitle}</p>}
    </div>
  );
}

export function ActionBtn({ onClick, children, variant='primary', disabled, icon:Icon, style }: { onClick:()=>void; children:React.ReactNode; variant?:'primary'|'secondary'|'danger'; disabled?:boolean; icon?:LucideIcon; style?:React.CSSProperties }) {
  const V = {
    primary:   { background:DS.primary, color:'white', border:'none', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' },
    secondary: { background:'white', color:DS.textBody, border:DS.borderLight, boxShadow:'none' },
    danger:    { background:'#e11d48', color:'white', border:'none', boxShadow:'0 4px 14px rgba(225,29,72,0.3)' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'9px 18px', borderRadius:DS.radiusMd, fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.15s', opacity:disabled?0.5:1, ...V[variant], ...style }}>
      {Icon && <Icon size={15} color="currentColor"/>}
      {children}
    </button>
  );
}

export function IconBtn({ onClick, icon:Icon, color=DS.textMuted, bg=DS.surfaceMuted, title }: { onClick:()=>void; icon:LucideIcon; color?:string; bg?:string; title?:string }) {
  return <button onClick={onClick} title={title} style={{ width:32, height:32, borderRadius:9, background:bg, border:'none', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}><Icon size={13} color={color}/></button>;
}

export function StatusBadge({ label, bg, color }: { label:string; bg:string; color:string }) {
  return <span style={{ background:bg, color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:8, whiteSpace:'nowrap' }}>{label}</span>;
}

export function FilterBar({ children }: { children:React.ReactNode }) {
  return <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>{children}</div>;
}

export function SearchInput({ value, onChange, placeholder='Tìm kiếm...' }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:DS.radiusMd, border:DS.borderLight, background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', flex:1, minWidth:180, maxWidth:300 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ background:'transparent', border:'none', outline:'none', fontSize:13, fontWeight:600, color:DS.textHeading, width:'100%', minWidth:0 }}/>
      {value && <button onClick={()=>onChange('')} style={{ border:'none', background:'none', cursor:'pointer', padding:0, lineHeight:0 }}><X size={13} color={DS.textLight}/></button>}
    </div>
  );
}

export function SelectFilter({ value, onChange, children, minWidth=140 }: { value:string; onChange:(v:string)=>void; children:React.ReactNode; minWidth?:number }) {
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{ background:'white', border:DS.borderLight, borderRadius:DS.radiusMd, padding:'8px 14px', fontSize:13, fontWeight:600, color:DS.textHeading, outline:'none', cursor:'pointer', minWidth }}>{children}</select>;
}

export type ModalSize = 'sm'|'md'|'lg'|'xl';
const MODAL_WIDTHS: Record<ModalSize,number> = { sm:420, md:560, lg:720, xl:920 };

export function ModalBase({ onClose, children, size='md' }: { onClose:()=>void; children:React.ReactNode; size?:ModalSize }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevRef  = useRef<HTMLElement|null>(null);
  useEffect(() => {
    prevRef.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; prevRef.current?.focus(); };
  }, []);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Tab') {
      const els = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])');
      if (!els?.length) return;
      const first = els[0]; const last = els[els.length-1];
      if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first.focus(); }
    }
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, boxSizing:'border-box' }} className="print:hidden">
      <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)' }} onClick={onClose} aria-hidden="true"/>
      <div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} onKeyDown={handleKeyDown}
        style={{ position:'relative', background:DS.surfaceCard, borderRadius:DS.radiusXl, boxShadow:DS.shadowModal, width:'100%', maxWidth:MODAL_WIDTHS[size], maxHeight:'calc(100vh - 32px)', overflowY:'auto', WebkitOverflowScrolling:'touch', outline:'none', animation:'modalSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
        {children}
      </div>
    </div>
  );
}

export function ModalWrap({ onClose, children, size }: { onClose:()=>void; children:React.ReactNode; size?:ModalSize }) {
  return <ModalBase onClose={onClose} size={size}>{children}</ModalBase>;
}

export function ModalHeader({ title, onClose }: { title:string; onClose:()=>void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
      <h3 style={{ fontSize:17, fontWeight:800, color:DS.textHeading, margin:0, letterSpacing:'-0.01em' }}>{title}</h3>
      <button onClick={onClose} style={{ width:32, height:32, borderRadius:9, background:DS.surfaceMuted, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-label="Đóng"><X size={14} color={DS.textMuted}/></button>
    </div>
  );
}

export function ModalFooter({ children }: { children:React.ReactNode }) {
  return <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 24px 20px', borderTop:DS.borderLight }}>{children}</div>;
}

export function Field({ label, children, error }: { label:string; children:React.ReactNode; error?:string }) {
  return (
    <div className="space-y-1">
      <label style={{ fontSize:11, fontWeight:700, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', display:'block' }}>{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs font-semibold flex items-center gap-1"><span>⚠️</span>{error}</p>}
    </div>
  );
}

export function SL({ icon:Icon, color, children }: { icon:React.ComponentType<{size?:number;className?:string}>; color:string; children:React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={15} className={color}/>
      <span className={cn('text-sm font-semibold uppercase tracking-widest', color)}>{children}</span>
    </div>
  );
}

const AVATAR_COLORS = ['bg-indigo-500','bg-teal-500','bg-rose-500','bg-amber-500','bg-violet-500','bg-sky-500','bg-emerald-500','bg-orange-500'];
export function Avatar({ name, size='md' }: { name:string; size?:'sm'|'md'|'lg' }) {
  const initials = (name||'?').split(' ').filter(Boolean).slice(-2).map(w=>w[0].toUpperCase()).join('');
  const colorIdx = (name||'').charCodeAt(0) % AVATAR_COLORS.length;
  const sizeMap = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-12 h-12 text-base' };
  return <div className={cn('rounded-full flex items-center justify-center font-semibold text-white shrink-0', AVATAR_COLORS[colorIdx], sizeMap[size])} aria-label={`Avatar ${name}`}>{initials}</div>;
}

type BadgeColorOld = 'indigo'|'teal'|'green'|'red'|'amber'|'slate'|'orange';
const BADGE_MAP: Record<BadgeColorOld,string> = {
  indigo:'bg-indigo-100 text-indigo-700 border-indigo-200', teal:'bg-teal-100 text-teal-700 border-teal-200',
  green:'bg-emerald-100 text-emerald-700 border-emerald-200', red:'bg-red-100 text-red-600 border-red-200',
  amber:'bg-amber-100 text-amber-700 border-amber-200', slate:'bg-slate-100 text-slate-600 border-slate-200',
  orange:'bg-orange-100 text-orange-700 border-orange-200',
};
export function Badge({ color='indigo', children }: { color?:BadgeColorOld; children:React.ReactNode }) {
  return <span className={cn('inline-block px-2.5 py-1 rounded-lg text-sm font-semibold border', BADGE_MAP[color])}>{children}</span>;
}

export function Pager({ page, total, perPage, setPage }: { page:number; total:number; perPage:number; setPage:(p:number)=>void }) {
  const totalPages = Math.max(1, Math.ceil(total/perPage));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <span className="text-sm font-bold text-slate-500">{(page-1)*perPage+1}–{Math.min(page*perPage,total)} / {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={()=>setPage(page-1)} disabled={page===1} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronLeft size={16}/></button>
        {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce<(number|'...')[]>((acc,p,i,arr)=>{ if(i>0&&typeof arr[i-1]==='number'&&(p as number)-(arr[i-1] as number)>1) acc.push('...'); acc.push(p); return acc; },[]).map((p,i)=>p==='...'?<span key={`e${i}`} className="px-1 text-slate-400 font-bold">···</span>:<button key={p} onClick={()=>setPage(p as number)} className={cn('w-9 h-9 rounded-xl font-semibold text-sm transition-colors', page===p?'bg-indigo-600 text-white':'border border-slate-200 text-slate-600 hover:bg-slate-100')}>{p}</button>)}
        <button onClick={()=>setPage(page+1)} disabled={page===totalPages} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={16}/></button>
      </div>
    </div>
  );
}

export function DiaryCard({ log, onDetail, onEdit }: { log:any; onDetail:()=>void; onEdit:()=>void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0"><Calendar size={15} className="text-indigo-600"/></div>
          <div><p className="font-semibold text-slate-900 text-base">{formatDate(log.date)}</p><Badge color="indigo">{log.classId}</Badge></div>
        </div>
        {log.caDay&&<span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">⏰ {log.caDay}</span>}
      </div>
      <p className="font-semibold text-slate-800 text-base leading-snug">{log.content}</p>
      {log.homework&&log.homework!=='---'&&<p className="text-sm text-slate-400">📖 {log.homework}</p>}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5"><Users size={12} className="text-emerald-600"/><span className="text-sm font-semibold text-emerald-700">{log.present}</span></div>
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5"><span className="text-sm font-semibold text-red-600">{log.absent} vắng</span></div>
        <div className="flex gap-1 ml-auto">
          <button onClick={onDetail} className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"><Eye size={14}/></button>
          <button onClick={onEdit} className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"><Edit3 size={14}/></button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText='Xác nhận', cancelText='Hủy', variant='info' }: {
  isOpen:boolean; onClose:()=>void; onConfirm:()=>void; title:string; message:string;
  confirmText?:string; cancelText?:string; variant?:'danger'|'warning'|'info';
}) {
  if (!isOpen) return null;
  const VC = { danger:'bg-red-600 hover:bg-red-700', warning:'bg-amber-600 hover:bg-amber-700', info:'bg-indigo-600 hover:bg-indigo-700' };
  const VI = { danger:'⚠️', warning:'⚡', info:'ℹ️' };
  return (
    <ModalWrap onClose={onClose} size="sm">
      <div className="p-6 space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto"><span className="text-3xl">{VI[variant]}</span></div>
        <div><h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3><p className="text-slate-500 text-base">{message}</p></div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-base border border-slate-200 transition-all">{cancelText}</button>
          <button onClick={()=>{onConfirm();onClose();}} className={cn('flex-1 px-5 py-3 text-white rounded-xl font-semibold text-base transition-all active:scale-95',VC[variant])}>{confirmText}</button>
        </div>
      </div>
    </ModalWrap>
  );
}

export function DeleteModal({ target, onClose, onConfirm, isSaving }: {
  target: { type:string; id:string; name:string };
  onClose: ()=>void; onConfirm: ()=>void; isSaving: boolean;
}) {
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding:'24px 24px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
        <div style={{ width:64, height:64, borderRadius:18, background:'#fff1f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <AlertTriangle size={32} color="#e11d48"/>
        </div>
        <div style={{ textAlign:'center' }}>
          <h3 style={{ fontSize:22, fontWeight:700, color:'#0f172a', margin:'0 0 8px' }}>Xác nhận xóa</h3>
          <p style={{ fontSize:16, color:'#64748b', margin:0, lineHeight:1.5 }}>
            Bạn có chắc muốn xóa <span style={{ fontWeight:700, color:'#0f172a' }}>"{target.name}"</span>?<br/>Thao tác này không thể hoàn tác.
          </p>
        </div>
        <div style={{ display:'flex', gap:12, width:'100%' }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid #e2e8f0', background:'white', fontWeight:700, fontSize:14, cursor:'pointer' }}>Hủy bỏ</button>
          <button onClick={onConfirm} disabled={isSaving} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'#e11d48', color:'white', fontWeight:700, fontSize:14, cursor:isSaving?'not-allowed':'pointer', opacity:isSaving?0.6:1 }}>
            {isSaving ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{
    isOpen:boolean; title:string; message:string;
    variant:'danger'|'warning'|'info'; resolver:((value:boolean)=>void)|null;
  }>({ isOpen:false, title:'', message:'', variant:'info', resolver:null });

  const confirm = (title:string, message:string, variant:'danger'|'warning'|'info'='info'): Promise<boolean> => {
    return new Promise(resolve => setState({ isOpen:true, title, message, variant, resolver:resolve }));
  };

  const handleConfirm = () => { state.resolver?.(true); setState(p=>({...p,isOpen:false,resolver:null})); };
  const handleCancel  = () => { state.resolver?.(false); setState(p=>({...p,isOpen:false,resolver:null})); };

  const ConfirmComponent = () => (
    <ConfirmDialog isOpen={state.isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={state.title} message={state.message} variant={state.variant}/>
  );

  return { confirm, ConfirmDialog: ConfirmComponent };
}
