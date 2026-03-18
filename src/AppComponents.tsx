import React, { useState } from 'react';
import { Plus } from 'lucide-react';

/* ── Định dạng số tiền theo triệu ── */
export function fmtM(amount: number): string {
  if (amount === 0) return '0';
  const m = amount / 1_000_000;
  if (m >= 1000) return `${Math.round(m/1000)}tỷ`;
  if (m % 1 === 0) return `${m}tr`;
  return `${parseFloat(m.toFixed(1))}tr`;
}

/* ═══════════════════════════════════════════
   TABLE SHARED STYLES — Light header (như ảnh tham khảo)
═══════════════════════════════════════════ */
export const TABLE_WRAP: React.CSSProperties = {
  background: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

export const TH_SHARED: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  background: '#F8FAFC',
  borderBottom: '1.5px solid #E2E8F0',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};

export const TD_SHARED: React.CSSProperties = {
  padding: '13px 14px',
  fontSize: 13,
  color: '#1E293B',
  fontWeight: 500,
  borderBottom: '1px solid #F1F5F9',
  verticalAlign: 'middle',
};

export const trStyle = (idx: number, hov = false): React.CSSProperties => ({
  background: hov ? '#eef2ff' : idx % 2 === 0 ? 'white' : '#f0f7ff',
  transition: 'background 0.1s',
});

/* ═══════════════════════════════════════════
   AppTable — reusable table với light header
═══════════════════════════════════════════ */
interface ColDef {
  key: string; label: string; align?: 'left'|'center'|'right';
  width?: number|string; render?: (val:any,row:any,idx:number)=>React.ReactNode;
}

export function AppTable({ columns,data,rowKey,emptyIcon='📋',emptyText='Không có dữ liệu',emptyAction,footer,style,scrollX=true }: {
  columns:ColDef[]; data:any[]; rowKey:string; emptyIcon?:string; emptyText?:string;
  emptyAction?:{label:string;onClick:()=>void}; footer?:React.ReactNode;
  style?:React.CSSProperties; scrollX?:boolean;
}) {
  const [hovRow, setHovRow] = useState<any>(null);
  return (
    <div style={{ ...TABLE_WRAP, ...style }}>
      <div style={{ overflowX: scrollX?'auto':undefined }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{columns.map(col=><th key={col.key} style={{ ...TH_SHARED, textAlign:col.align||'left', width:col.width }}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {data.length===0 ? (
              <tr><td colSpan={columns.length} style={{ padding:'52px 16px', textAlign:'center' }}>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:36 }}>{emptyIcon}</span>
                  <p style={{ color:'#94a3b8',fontStyle:'italic',fontSize:14,margin:0 }}>{emptyText}</p>
                  {emptyAction&&<button onClick={emptyAction.onClick} style={{ padding:'7px 18px',background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer' }}>{emptyAction.label}</button>}
                </div>
              </td></tr>
            ) : data.map((row,idx)=>(
              <tr key={row[rowKey]} onMouseEnter={()=>setHovRow(row[rowKey])} onMouseLeave={()=>setHovRow(null)} style={trStyle(idx,hovRow===row[rowKey])}>
                {columns.map(col=><td key={col.key} style={{ ...TD_SHARED, textAlign:col.align||'left' }}>{col.render?col.render(row[col.key],row,idx):(row[col.key]??'—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer&&<div style={{ borderTop:'1px solid #F1F5F9',background:'#FAFAFA' }}>{footer}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   StatBlock — WHITE card, số to, accent color
   (như ảnh tham khảo — không dùng gradient nền)
═══════════════════════════════════════════ */
export function StatBlock({ icon:Icon, value, label, sub, gradient, onClick, actionLabel, delta }: {
  icon:React.ComponentType<{size?:number;color?:string}>; value:string|number;
  label:string; sub?:string; gradient:string; onClick?:()=>void;
  actionLabel?:string; delta?:number|null;
}) {
  const [hov, setHov] = useState(false);
  const clickable = !!onClick;
  // Lấy màu accent từ gradient (lấy màu đầu)
  const accentMatch = gradient.match(/#[0-9a-fA-F]{6}/);
  const accent = accentMatch ? accentMatch[0] : '#4F46E5';

  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: 'white',
        border: `1.5px solid ${hov&&clickable ? accent+'44' : '#E2E8F0'}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: clickable?'pointer':'default',
        boxShadow: hov&&clickable ? `0 4px 16px ${accent}22` : '0 1px 3px rgba(0,0,0,0.05)',
        transform: hov&&clickable ? 'translateY(-1px)' : 'none',
        transition: 'all 0.16s ease',
        minWidth: 0, overflow: 'hidden',
      }}>
      {/* Icon circle với màu accent */}
      <div style={{ width:42,height:42,borderRadius:10,background:`${accent}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <Icon size={19} color={accent} />
      </div>
      {/* Số và label */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:22,fontWeight:800,color:'#0F172A',lineHeight:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{value}</div>
        <div style={{ fontSize:12,fontWeight:600,color:'#64748B',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{label}</div>
        {sub&&<div style={{ fontSize:11,color:'#94A3B8',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sub}</div>}
      </div>
      {/* Delta badge */}
      {delta!=null&&<span style={{ fontSize:11,fontWeight:700,padding:'3px 7px',borderRadius:999,background:delta>0?'#DCFCE7':delta<0?'#FEE2E2':'#F1F5F9',color:delta>0?'#16A34A':delta<0?'#DC2626':'#64748B',flexShrink:0 }}>{delta>0?`↑${delta}`:delta<0?`↓${Math.abs(delta)}`:'→'}</span>}
      {clickable&&actionLabel&&hov&&<span style={{ fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:`${accent}18`,color:accent,flexShrink:0,whiteSpace:'nowrap' }}>+ {actionLabel}</span>}
    </div>
  );
}

export function StatGrid({ children, cols }: { children:React.ReactNode; cols?:number }) {
  return (
    <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:cols?`repeat(${cols},1fr)`:'repeat(auto-fit,minmax(190px,1fr))', gap:12 }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAB — Floating Action Button
═══════════════════════════════════════════ */
export function FAB({ onClick,label,icon:Icon=Plus,color='#4F46E5',shadow='0 8px 24px rgba(79,70,229,0.45)' }: {
  onClick:()=>void; label:string;
  icon?:React.ComponentType<{size?:number;color?:string}>;
  color?:string; shadow?:string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <>
      <style>{`@media(min-width:768px){.ltn-fab{bottom:28px!important}}`}</style>
      <button onClick={onClick} aria-label={label} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        className="ltn-fab print:hidden"
        style={{ position:'fixed',right:20,zIndex:40,width:52,height:52,borderRadius:'50%',background:color,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:shadow,transform:hov?'scale(1.08)':'scale(1)',transition:'transform 0.18s' }}>
        <Icon size={21} color="white"/>
        {hov&&<span style={{ position:'absolute',right:58,whiteSpace:'nowrap',background:'#1E293B',color:'white',fontSize:12,fontWeight:700,padding:'5px 10px',borderRadius:8,pointerEvents:'none',boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>{label}</span>}
      </button>
    </>
  );
}

export function ScrollHintTable({ children }: { children:React.ReactNode }) {
  return <div style={{ overflowX:'auto',WebkitOverflowScrolling:'touch' as any }}>{children}</div>;
}

/* ═══════════════════════════════════════════
   ErrorBoundary
═══════════════════════════════════════════ */
interface EBState { hasError:boolean; msg:string; }
export class ErrorBoundary extends React.Component<{children:React.ReactNode;fallbackLabel?:string},EBState> {
  constructor(p:any){super(p);this.state={hasError:false,msg:''};}
  static getDerivedStateFromError(e:Error){return{hasError:true,msg:e.message};}
  componentDidCatch(e:Error,i:React.ErrorInfo){console.error('[ErrorBoundary]',e,i.componentStack);}
  render(){
    if(this.state.hasError)return(
      <div style={{padding:'32px 20px',textAlign:'center',background:'#FFF1F2',border:'1.5px solid #FECACA',borderRadius:12}}>
        <p style={{fontSize:24,margin:'0 0 8px'}}>⚠️</p>
        <p style={{fontSize:14,fontWeight:700,color:'#BE123C',margin:'0 0 6px'}}>{this.props.fallbackLabel||'Lỗi'} — Đã xảy ra lỗi</p>
        <p style={{fontSize:12,color:'#64748B',margin:0}}>{this.state.msg}</p>
        <button onClick={()=>this.setState({hasError:false,msg:''})} style={{marginTop:14,padding:'7px 16px',background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>Thử lại</button>
      </div>
    );
    return this.props.children;
  }
}
