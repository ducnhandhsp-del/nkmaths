import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import type {
  ButtonProps, IconButtonProps, InputProps, SelectProps, RadioGroupProps, SearchBarProps,
  StatCardProps, DataTableProps, TableActionsProps, AttendancePickerProps, AttendanceStatus,
  BadgeProps, BadgeColor, ConnectionStatusProps, QuickActionGroupProps, QuickAction, PagerProps,
  NavBarProps, FilterTabsProps, FilterChipProps,
} from './ds';
import { colors, typography, radius, shadows, transition } from './ds';

export type { AttendanceStudent } from './ds';

/* ─── FORM: Button ─── */
const BTN_SIZE = {
  xs:{height:28,px:10,fontSize:11,gap:4,iconSize:12,radius:radius.sm},
  sm:{height:32,px:12,fontSize:12,gap:5,iconSize:14,radius:radius.sm},
  md:{height:38,px:16,fontSize:13,gap:6,iconSize:15,radius:radius.md},
  lg:{height:44,px:20,fontSize:14,gap:7,iconSize:16,radius:radius.lg},
  xl:{height:52,px:24,fontSize:15,gap:8,iconSize:18,radius:radius.lg},
};
const BTN_INTENT = {
  primary:  {solid:colors.primary[500],  hover:colors.primary[600],   text:colors.primary[600],   border:colors.primary[200],   light:colors.primary[50],   shadow:shadows.primary},
  secondary:{solid:colors.secondary[500],hover:colors.secondary[600], text:colors.secondary[600], border:'#ddd6fe',              light:colors.secondary[50], shadow:'0 8px 24px rgba(139,92,246,0.35)'},
  success:  {solid:colors.success[500],  hover:colors.success[600],   text:colors.success[600],   border:colors.success[200],   light:colors.success[50],   shadow:shadows.success},
  warning:  {solid:colors.warning[500],  hover:colors.warning[600],   text:colors.warning[600],   border:colors.warning[200],   light:colors.warning[50],   shadow:shadows.warning},
  danger:   {solid:colors.danger[500],   hover:colors.danger[600],    text:colors.danger[600],    border:colors.danger[200],    light:colors.danger[50],    shadow:shadows.danger},
  neutral:  {solid:colors.neutral[700],  hover:colors.neutral[800],   text:colors.neutral[600],   border:colors.neutral[200],   light:colors.neutral[50],   shadow:shadows.md},
};
function Spinner({size=14}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{animation:'ds-spin 0.8s linear infinite'}}><style>{`@keyframes ds-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
}
export function Button({children,intent='primary',variant='solid',size='md',icon,iconPosition='left',loading=false,disabled=false,fullWidth=false,onClick,type='button',style}:ButtonProps) {
  const [hov,setHov]=useState(false);
  const s=BTN_SIZE[size],c=BTN_INTENT[intent],isDisabled=disabled||loading;
  const getStyle=():React.CSSProperties=>{
    const base:React.CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:s.gap,height:s.height,paddingLeft:s.px,paddingRight:s.px,fontSize:s.fontSize,fontWeight:700,fontFamily:typography.fontFamily,borderRadius:s.radius,border:'none',cursor:isDisabled?'not-allowed':'pointer',transition:transition.normal,userSelect:'none',width:fullWidth?'100%':undefined,opacity:isDisabled?0.5:1,whiteSpace:'nowrap'};
    if(variant==='solid') return{...base,background:hov&&!isDisabled?c.hover:c.solid,color:'white',boxShadow:hov&&!isDisabled?c.shadow:shadows.sm,transform:hov&&!isDisabled?'translateY(-1px)':'none'};
    if(variant==='outline') return{...base,background:hov&&!isDisabled?c.light:'transparent',color:c.text,border:`1.5px solid ${hov&&!isDisabled?c.solid:c.border}`};
    if(variant==='ghost') return{...base,background:hov&&!isDisabled?c.light:'transparent',color:c.text};
    return{...base,background:'transparent',color:c.text,padding:0,height:'auto'};
  };
  return <button type={type} onClick={isDisabled?undefined:onClick} disabled={isDisabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{...getStyle(),...style}}>{loading&&<Spinner size={s.iconSize}/>}{!loading&&icon&&iconPosition==='left'&&<span style={{display:'flex',alignItems:'center'}}>{icon}</span>}{children}{!loading&&icon&&iconPosition==='right'&&<span style={{display:'flex',alignItems:'center'}}>{icon}</span>}</button>;
}

/* ─── FORM: IconButton ─── */
const IB_SIZE={xs:28,sm:32,md:36,lg:40,xl:46};
const IB_INTENT:Record<string,{bg:string;hover:string;color:string}>={
  default:{bg:colors.neutral[100],hover:colors.neutral[200],color:colors.neutral[600]},
  primary:{bg:colors.primary[50],hover:colors.primary[100],color:colors.primary[600]},
  warning:{bg:colors.warning[50],hover:colors.warning[200],color:colors.warning[600]},
  danger:{bg:colors.danger[50],hover:colors.danger[200],color:colors.danger[600]},
  success:{bg:colors.success[50],hover:colors.success[200],color:colors.success[600]},
};
export function IconButton({icon,label,intent='default',size='md',onClick,disabled,tooltip,style}:IconButtonProps){
  const [hov,setHov]=useState(false),[showTip,setShowTip]=useState(false);
  const sz=IB_SIZE[size],c=IB_INTENT[intent]||IB_INTENT.default;
  return(
    <div style={{position:'relative',display:'inline-flex'}}>
      <button onClick={disabled?undefined:onClick} disabled={disabled} aria-label={label} onMouseEnter={()=>{setHov(true);setShowTip(true);}} onMouseLeave={()=>{setHov(false);setShowTip(false);}} style={{width:sz,height:sz,borderRadius:radius.md,background:hov?c.hover:c.bg,border:'none',cursor:disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:c.color,transition:transition.fast,opacity:disabled?0.4:1,transform:hov?'scale(1.06)':'scale(1)',...style}}>{icon}</button>
      {tooltip&&showTip&&<div style={{position:'absolute',bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',background:colors.neutral[900],color:'white',fontSize:11,fontWeight:700,padding:'4px 8px',borderRadius:6,whiteSpace:'nowrap',pointerEvents:'none',zIndex:99}}>{tooltip}</div>}
    </div>
  );
}

/* ─── FORM: Input ─── */
const INP_SIZE={sm:{height:32,px:10,fs:12},md:{height:38,px:12,fs:13},lg:{height:44,px:14,fs:14}};
export function Input({label,placeholder,value,onChange,type='text',error,hint,disabled,required,prefix,suffix,clearable=false,size='md',style}:InputProps){
  const [focus,setFocus]=useState(false);const s=INP_SIZE[size];const hasError=!!error;
  const borderColor=hasError?colors.danger[500]:focus?colors.primary[500]:colors.neutral[200];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:4,...style}}>
      {label&&<label style={{fontSize:11,fontWeight:700,color:colors.neutral[500],textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}{required&&<span style={{color:colors.danger[500],marginLeft:2}}>*</span>}</label>}
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {prefix&&<span style={{position:'absolute',left:s.px,color:colors.neutral[400],display:'flex',alignItems:'center',pointerEvents:'none'}}>{prefix}</span>}
        <input type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{width:'100%',height:s.height,paddingLeft:prefix?`calc(${s.px}px + 20px)`:s.px,paddingRight:(suffix||clearable)?`calc(${s.px}px + 24px)`:s.px,fontSize:s.fs,fontWeight:500,fontFamily:typography.fontFamily,color:colors.neutral[900],background:disabled?colors.neutral[50]:'white',border:`1.5px solid ${borderColor}`,borderRadius:radius.md,outline:'none',boxShadow:focus?`0 0 0 3px ${hasError?colors.danger[50]:colors.primary[50]}`:'none',transition:transition.fast,cursor:disabled?'not-allowed':undefined}}/>
        {clearable&&value&&<button onClick={()=>onChange('')} style={{position:'absolute',right:s.px,background:'none',border:'none',cursor:'pointer',color:colors.neutral[400],display:'flex',alignItems:'center',padding:2}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
        {suffix&&!clearable&&<span style={{position:'absolute',right:s.px,color:colors.neutral[400],display:'flex',alignItems:'center',pointerEvents:'none'}}>{suffix}</span>}
      </div>
      {(error||hint)&&<p style={{fontSize:11,fontWeight:600,color:error?colors.danger[600]:colors.neutral[400],margin:0}}>{error||hint}</p>}
    </div>
  );
}

/* ─── FORM: Select ─── */
export function Select({label,value,onChange,options,placeholder,error,disabled,size='md',style}:SelectProps){
  const [focus,setFocus]=useState(false);const s=INP_SIZE[size];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:4,...style}}>
      {label&&<label style={{fontSize:11,fontWeight:700,color:colors.neutral[500],textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</label>}
      <div style={{position:'relative'}}>
        <select value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{width:'100%',height:s.height,paddingLeft:s.px,paddingRight:32,fontSize:s.fs,fontWeight:600,fontFamily:typography.fontFamily,color:value?colors.neutral[900]:colors.neutral[400],background:disabled?colors.neutral[50]:'white',border:`1.5px solid ${error?colors.danger[500]:focus?colors.primary[500]:colors.neutral[200]}`,borderRadius:radius.md,outline:'none',cursor:disabled?'not-allowed':'pointer',appearance:'none',WebkitAppearance:'none',boxShadow:focus?`0 0 0 3px ${colors.primary[50]}`:'none',transition:transition.fast}}>
          {placeholder&&<option value="" disabled>{placeholder}</option>}
          {options.map(o=><option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.neutral[400]} strokeWidth="2.5" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {error&&<p style={{fontSize:11,fontWeight:600,color:colors.danger[600],margin:0}}>{error}</p>}
    </div>
  );
}

/* ─── FORM: RadioGroup ─── */
export function RadioGroup({label,value,onChange,options,direction='horizontal',error}:RadioGroupProps){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {label&&<label style={{fontSize:11,fontWeight:700,color:colors.neutral[500],textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</label>}
      <div style={{display:'flex',flexDirection:direction==='vertical'?'column':'row',flexWrap:'wrap',gap:direction==='horizontal'?6:4}}>
        {options.map(o=>{const active=value===o.value;return(
          <button key={o.value} type="button" onClick={()=>!o.disabled&&onChange(o.value)} disabled={o.disabled} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:radius.md,border:`1.5px solid ${active?colors.primary[500]:colors.neutral[200]}`,background:active?colors.primary[50]:'white',cursor:o.disabled?'not-allowed':'pointer',transition:transition.fast,opacity:o.disabled?0.5:1,textAlign:'left'}}>
            <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${active?colors.primary[500]:colors.neutral[300]}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {active&&<div style={{width:8,height:8,borderRadius:'50%',background:colors.primary[500]}}/>}
            </div>
            <div><span style={{fontSize:13,fontWeight:active?700:500,color:active?colors.primary[700]:colors.neutral[700]}}>{o.label}</span>{o.description&&<p style={{fontSize:11,color:colors.neutral[400],margin:0}}>{o.description}</p>}</div>
          </button>
        );})}
      </div>
      {error&&<p style={{fontSize:11,fontWeight:600,color:colors.danger[600],margin:0}}>{error}</p>}
    </div>
  );
}

/* ─── FORM: SearchBar ─── */
const SB_SIZE={sm:{h:32,px:10,fs:12,icon:13},md:{h:38,px:12,fs:13,icon:14}};
export function SearchBar({value,onChange,placeholder='Tìm kiếm...',onClear,width,size='md',style}:SearchBarProps){
  const [focus,setFocus]=useState(false);const s=SB_SIZE[size];
  return(
    <div style={{position:'relative',display:'flex',alignItems:'center',width,...style}}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" stroke={focus?colors.primary[500]:colors.neutral[400]} strokeWidth="2.5" style={{position:'absolute',left:s.px,pointerEvents:'none',transition:transition.fast}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{width:'100%',height:s.h,paddingLeft:s.px+s.icon+4,paddingRight:value?32:s.px,fontSize:s.fs,fontWeight:600,fontFamily:typography.fontFamily,color:colors.neutral[900],background:'white',border:`1.5px solid ${focus?colors.primary[500]:colors.neutral[200]}`,borderRadius:radius.md,outline:'none',transition:transition.fast,boxShadow:focus?`0 0 0 3px ${colors.primary[50]}`:'0 1px 3px rgba(0,0,0,0.06)'}}/>
      {value&&<button onClick={()=>{onChange('');onClear?.();}} style={{position:'absolute',right:s.px,background:'none',border:'none',cursor:'pointer',color:colors.neutral[400],display:'flex',alignItems:'center',padding:2,borderRadius:4}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
    </div>
  );
}

/* ─── DATA DISPLAY: StatCard ─── */
export function StatCard({label,value,sub,gradient,icon:Icon,trend,trendLabel,onClick,clickable=!!onClick}:StatCardProps){
  const [hov,setHov]=useState(false);const hasDelta=trend!=null;
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:gradient,borderRadius:radius.xl,padding:'20px 20px 16px',position:'relative',overflow:'hidden',minWidth:0,boxShadow:hov?shadows.xl:shadows.md,transform:hov&&clickable?'translateY(-3px)':'translateY(0)',transition:transition.normal,cursor:clickable?'pointer':'default'}}>
      <div style={{position:'absolute',right:-16,top:-16,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.12)',pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14,position:'relative'}}>
        <div style={{width:42,height:42,borderRadius:radius.md,background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={20} color="white"/></div>
        {hasDelta&&<span style={{display:'flex',alignItems:'center',gap:2,fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:radius.sm,background:'rgba(255,255,255,0.25)',color:'white'}}>{trend!>0?'↑':trend!<0?'↓':'→'} {Math.abs(trend!)}</span>}
      </div>
      <div style={{fontSize:30,fontWeight:800,color:'white',lineHeight:1.1,position:'relative',fontFamily:typography.fontFamily}}>{value}</div>
      <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.9)',marginTop:4,position:'relative'}}>{label}</div>
      {sub&&<div style={{fontSize:12,color:'rgba(255,255,255,0.65)',marginTop:2,position:'relative'}}>{sub}</div>}
      {trendLabel&&hasDelta&&<div style={{fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:4,position:'relative'}}>{trendLabel}</div>}
    </div>
  );
}

/* ─── DATA DISPLAY: DataTable ─── */
export function DataTable<T extends Record<string,any>>({columns,data,rowKey,loading=false,emptyIcon='📋',emptyText='Không có dữ liệu',emptyAction,striped=true,hoverable=true,page,perPage=10,total,onPageChange,scrollX=true,style}:DataTableProps<T>){
  const [sortKey,setSortKey]=useState<string|null>(null),[sortDir,setSortDir]=useState<'asc'|'desc'>('asc'),[hovRow,setHovRow]=useState<any>(null);
  const sorted=useMemo(()=>{if(!sortKey) return data;return[...data].sort((a,b)=>{const cmp=String(a[sortKey]).localeCompare(String(b[sortKey]),'vi');return sortDir==='asc'?cmp:-cmp;});},[data,sortKey,sortDir]);
  const handleSort=(key:string)=>{if(sortKey===key)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(key);setSortDir('asc');}};
  const TH:React.CSSProperties={padding:'11px 14px',fontSize:11,fontWeight:700,color:colors.neutral[500],textTransform:'uppercase',letterSpacing:'0.08em',background:colors.neutral[50],whiteSpace:'nowrap',userSelect:'none',borderBottom:`2px solid ${colors.neutral[200]}`};
  const TD_B:React.CSSProperties={padding:'13px 14px',fontSize:15,color:colors.neutral[800],fontWeight:500,borderBottom:`1px solid ${colors.neutral[50]}`,fontFamily:typography.fontFamily};
  return(
    <div style={{background:'white',borderRadius:radius.lg,border:`1px solid ${colors.neutral[200]}`,boxShadow:shadows.sm,overflow:'hidden',...style}}>
      {loading&&<div style={{height:4,background:colors.neutral[100],overflow:'hidden',position:'relative'}}><div style={{height:'100%',width:'40%',background:colors.primary[500],animation:'dsLoad 1.2s ease-in-out infinite',borderRadius:4}}/><style>{`@keyframes dsLoad{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}`}</style></div>}
      <div style={{overflowX:scrollX?'auto':undefined}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{columns.map(col=><th key={String(col.key)} onClick={col.sortable?()=>handleSort(String(col.key)):undefined} style={{...TH,textAlign:col.align||'left',cursor:col.sortable?'pointer':'default',width:col.width,...col.headerStyle}}><span style={{display:'inline-flex',alignItems:'center',gap:4}}>{col.label}{col.sortable&&<span style={{opacity:sortKey===String(col.key)?1:0.4}}>{sortKey===String(col.key)&&sortDir==='asc'?'↑':'↓'}</span>}</span></th>)}</tr></thead>
          <tbody>
            {sorted.length===0?(<tr><td colSpan={columns.length} style={{padding:'48px 16px',textAlign:'center'}}><div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}><span style={{fontSize:40}}>{emptyIcon}</span><p style={{color:colors.neutral[400],fontStyle:'italic',fontSize:14,margin:0}}>{emptyText}</p>{emptyAction&&<button onClick={emptyAction.onClick} style={{padding:'8px 20px',background:colors.primary[500],color:'white',border:'none',borderRadius:radius.md,fontWeight:700,fontSize:13,cursor:'pointer'}}>{emptyAction.label}</button>}</div></td></tr>):
            sorted.map((row,idx)=>{const key=row[rowKey];const isHov=hoverable&&hovRow===key;const isStripe=striped&&idx%2!==0;return(<tr key={String(key)} onMouseEnter={()=>hoverable&&setHovRow(key)} onMouseLeave={()=>hoverable&&setHovRow(null)} style={{background:isHov?'#f8f7ff':isStripe?'#fafcff':'white',transition:transition.fast}}>{columns.map(col=>{const val=String(col.key) in row?row[col.key as keyof T]:undefined;return<td key={String(col.key)} style={{...TD_B,textAlign:col.align||'left',...col.cellStyle}}>{col.render?col.render(val,row,idx):String(val??'—')}</td>;})}</tr>);})}
          </tbody>
        </table>
      </div>
      {total!==undefined&&onPageChange&&page!==undefined&&(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderTop:`1px solid ${colors.neutral[100]}`,background:colors.neutral[50]}}><span style={{fontSize:12,fontWeight:600,color:colors.neutral[400]}}>{(page-1)*perPage+1}–{Math.min(page*perPage,total)} / {total}</span><div style={{display:'flex',gap:4}}>{[...Array(Math.ceil(total/perPage))].map((_,i)=>{const p=i+1,active=p===page;return<button key={p} onClick={()=>onPageChange(p)} style={{width:32,height:32,borderRadius:radius.md,border:`1px solid ${active?colors.primary[500]:colors.neutral[200]}`,background:active?colors.primary[500]:'white',color:active?'white':colors.neutral[600],fontWeight:700,fontSize:12,cursor:'pointer',transition:transition.fast}}>{p}</button>;})}</div></div>)}
    </div>
  );
}

/* ─── DATA DISPLAY: TableActions ─── */
const TA_C={default:{bg:colors.neutral[100],hover:colors.neutral[200],color:colors.neutral[600]},primary:{bg:colors.primary[50],hover:colors.primary[100],color:colors.primary[600]},warning:{bg:colors.warning[50],hover:colors.warning[200],color:colors.warning[600]},danger:{bg:colors.danger[50],hover:colors.danger[200],color:colors.danger[600]}};
export function TableActions({actions,compact=false}:TableActionsProps){
  const [hovIdx,setHovIdx]=useState<number|null>(null);
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:compact?4:6}}>
      {actions.filter(a=>!a.hidden).map((a,i)=>{const c=TA_C[a.intent||'default']||TA_C.default;return(
        <div key={i} style={{position:'relative'}}>
          <button onClick={a.disabled?undefined:a.onClick} disabled={a.disabled} onMouseEnter={()=>setHovIdx(i)} onMouseLeave={()=>setHovIdx(null)} aria-label={a.label} style={{width:compact?30:34,height:compact?30:34,borderRadius:radius.sm,background:hovIdx===i?c.hover:c.bg,border:'none',cursor:a.disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:c.color,opacity:a.disabled?0.4:1,transform:hovIdx===i?'scale(1.08)':'scale(1)',transition:transition.fast}}>{a.icon}</button>
          {hovIdx===i&&<div style={{position:'absolute',bottom:'calc(100% + 5px)',left:'50%',transform:'translateX(-50%)',background:colors.neutral[900],color:'white',fontSize:11,fontWeight:700,padding:'3px 7px',borderRadius:5,whiteSpace:'nowrap',pointerEvents:'none',zIndex:99}}>{a.label}</div>}
        </div>
      );})}
    </div>
  );
}

/* ─── DATA DISPLAY: AttendancePicker ─── */
const ST_CFG:Record<AttendanceStatus,{label:string;bg:string;border:string;color:string;activeBg:string}>={
  present:{label:'Có mặt',bg:'#f0fdf4',border:'#86efac',color:'#15803d',activeBg:'#16a34a'},
  late:   {label:'Muộn',  bg:'#fffbeb',border:'#fcd34d',color:'#b45309',activeBg:'#d97706'},
  absent: {label:'Vắng',  bg:'#fff1f2',border:'#fecaca',color:'#be123c',activeBg:'#e11d48'},
};
export function AttendancePicker({students,onChange,readOnly=false}:AttendancePickerProps){
  const update=(id:string,status:AttendanceStatus)=>onChange(students.map(s=>s.id===id?{...s,status}:s));
  const bulkSet=(status:AttendanceStatus)=>onChange(students.map(s=>({...s,status})));
  const counts={
    present:students.filter(s=>s.status==='present').length,
    late:students.filter(s=>s.status==='late').length,
    absent:students.filter(s=>s.status==='absent').length,
  };
  return(
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {/* Dòng tổng kết + nút chọn tất cả */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {(['present','late','absent'] as AttendanceStatus[]).map(s=>{const c=ST_CFG[s];return(
            <span key={s} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:999,background:c.bg,border:`1px solid ${c.border}`,fontSize:12,fontWeight:700,color:c.color}}>
              {c.label}: {counts[s]}
            </span>
          );})}
        </div>
        {!readOnly&&(
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {(['present','late','absent'] as AttendanceStatus[]).map(s=>{const c=ST_CFG[s];return(
              <button key={s} onClick={()=>bulkSet(s)} style={{padding:'3px 8px',borderRadius:999,border:`1px solid ${c.border}`,background:c.bg,color:c.color,fontWeight:700,fontSize:10,cursor:'pointer'}}>
                Tất cả: {c.label}
              </button>
            );})}
          </div>
        )}
      </div>
      {/* Danh sách học sinh — tên KHÔNG bị cắt */}
      <div style={{background:'white',borderRadius:radius.lg,border:`1px solid ${colors.neutral[200]}`,overflow:'hidden'}}>
        {students.map((s,idx)=>{
          const activeStatus=ST_CFG[s.status];
          return(
            <div key={s.id} style={{padding:'10px 14px',borderBottom:idx<students.length-1?`1px solid ${colors.neutral[100]}`:'none',background:idx%2===0?'white':colors.neutral[50]}}>
              {/* Hàng 1: STT + Tên đầy đủ + Mã */}
              <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:readOnly?0:8}}>
                <span style={{fontSize:11,fontWeight:700,color:colors.neutral[300],width:18,flexShrink:0,textAlign:'center',paddingTop:2}}>{idx+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:colors.neutral[900],margin:0,lineHeight:1.4,wordBreak:'break-word'}}>{s.name}</p>
                  <p style={{fontSize:11,color:colors.neutral[400],margin:'1px 0 0'}}>{s.id}</p>
                </div>
                {readOnly&&(
                  <span style={{padding:'3px 9px',borderRadius:999,background:activeStatus.bg,border:`1px solid ${activeStatus.border}`,fontSize:11,fontWeight:700,color:activeStatus.color,flexShrink:0,whiteSpace:'nowrap'}}>
                    {activeStatus.label}
                  </span>
                )}
              </div>
              {/* Hàng 2: 3 nút trạng thái — chiều rộng đều nhau */}
              {!readOnly&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,paddingLeft:26}}>
                  {(['present','late','absent'] as AttendanceStatus[]).map(st=>{
                    const c=ST_CFG[st],isActive=s.status===st;
                    return(
                      <button key={st} onClick={()=>update(s.id,st)}
                        style={{padding:'7px 4px',borderRadius:8,border:`1.5px solid ${isActive?c.activeBg:c.border}`,background:isActive?c.activeBg:c.bg,color:isActive?'white':c.color,fontWeight:700,fontSize:12,cursor:'pointer',transition:'all 0.12s',boxShadow:isActive?'0 2px 6px rgba(0,0,0,0.12)':'none',textAlign:'center'}}>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── FEEDBACK: Badge ─── */
const BC:Record<BadgeColor,{solid:string;text:string;subtle:string;subtleText:string;border:string}>={
  indigo:{solid:colors.primary[500],text:'white',subtle:colors.primary[50],subtleText:colors.primary[700],border:colors.primary[200]},
  teal:{solid:colors.teal[500],text:'white',subtle:colors.teal[50],subtleText:colors.teal[600],border:'#99f6e4'},
  emerald:{solid:colors.success[500],text:'white',subtle:colors.success[50],subtleText:colors.success[600],border:colors.success[200]},
  amber:{solid:colors.warning[500],text:'white',subtle:colors.warning[50],subtleText:colors.warning[600],border:colors.warning[200]},
  rose:{solid:colors.danger[500],text:'white',subtle:colors.danger[50],subtleText:colors.danger[600],border:colors.danger[200]},
  sky:{solid:colors.info[500],text:'white',subtle:colors.info[50],subtleText:colors.info[600],border:'#bae6fd'},
  violet:{solid:colors.secondary[500],text:'white',subtle:colors.secondary[50],subtleText:colors.secondary[600],border:'#ddd6fe'},
  slate:{solid:colors.neutral[500],text:'white',subtle:colors.neutral[50],subtleText:colors.neutral[600],border:colors.neutral[200]},
};
export function Badge({children,color='indigo',variant='subtle',size='md',dot=false,onRemove}:BadgeProps){
  const c=BC[color];const fs=size==='sm'?10:12;const py=size==='sm'?'2px':'3px';const px=size==='sm'?'6px':'9px';
  let bg:string,textColor:string,border:string;
  if(variant==='solid'){bg=c.solid;textColor=c.text;border='transparent';}
  else if(variant==='outline'){bg='transparent';textColor=c.subtleText;border=c.border;}
  else{bg=c.subtle;textColor=c.subtleText;border=c.border;}
  return<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:`${py} ${px}`,borderRadius:9999,background:bg,border:`1px solid ${border}`,color:textColor,fontSize:fs,fontWeight:700,fontFamily:typography.fontFamily,whiteSpace:'nowrap',lineHeight:1.4}}>{dot&&<span style={{width:6,height:6,borderRadius:'50%',background:textColor,flexShrink:0}}/>}{children}{onRemove&&<span onClick={onRemove} style={{cursor:'pointer',display:'inline-flex',alignItems:'center',marginLeft:2,opacity:0.7}}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg></span>}</span>;
}

/* ─── FEEDBACK: Pager ─── */
export function Pager({page,total,perPage,setPage,showTotal=true}:PagerProps){
  const totalPages=Math.ceil(total/perPage);if(totalPages<=1&&!showTotal) return null;
  const from=(page-1)*perPage+1,to=Math.min(page*perPage,total);
  const pages=[...Array(totalPages)].map((_,i)=>i+1).filter(p=>Math.abs(p-page)<=2||p===1||p===totalPages).reduce<(number|'...')[]>((acc,p,i,arr)=>{if(i>0&&p-(arr[i-1] as number)>1) acc.push('...');acc.push(p);return acc;},[]);
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderTop:`1px solid ${colors.neutral[100]}`,background:colors.neutral[50]}}>
      {showTotal?<span style={{fontSize:12,fontWeight:600,color:colors.neutral[400]}}>{from}–{to} / {total} mục</span>:<span/>}
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        <button onClick={()=>setPage(Math.max(1,page-1))} disabled={page<=1} style={{width:32,height:32,borderRadius:radius.md,border:`1px solid ${colors.neutral[200]}`,background:'white',cursor:page<=1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:colors.neutral[page<=1?300:500],transition:transition.fast,opacity:page<=1?0.4:1}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
        {pages.map((p,i)=>p==='...'?<span key={`e${i}`} style={{width:32,textAlign:'center',color:colors.neutral[400],fontSize:12,fontWeight:700}}>…</span>:<button key={p} onClick={()=>setPage(p as number)} style={{width:32,height:32,borderRadius:radius.md,border:`1px solid ${p===page?colors.primary[500]:colors.neutral[200]}`,background:p===page?colors.primary[500]:'white',color:p===page?'white':colors.neutral[600],fontWeight:700,fontSize:12,cursor:'pointer',transition:transition.fast}}>{p}</button>)}
        <button onClick={()=>setPage(Math.min(totalPages,page+1))} disabled={page>=totalPages} style={{width:32,height:32,borderRadius:radius.md,border:`1px solid ${colors.neutral[200]}`,background:'white',cursor:page>=totalPages?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:colors.neutral[page>=totalPages?300:500],transition:transition.fast,opacity:page>=totalPages?0.4:1}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
    </div>
  );
}

/* ─── FEEDBACK: ConnectionStatus ─── */
const CONN={
  connected:{label:'Đã kết nối',color:'#059669',bg:'#ecfdf5',border:'#a7f3d0',dot:'#10b981',pulse:false},
  disconnected:{label:'Mất kết nối',color:'#e11d48',bg:'#fff1f2',border:'#fecaca',dot:'#f43f5e',pulse:true},
  loading:{label:'Đang đồng bộ...',color:'#d97706',bg:'#fffbeb',border:'#fde68a',dot:'#f59e0b',pulse:true},
  error:{label:'Lỗi kết nối',color:'#be123c',bg:'#fff1f2',border:'#fecaca',dot:'#e11d48',pulse:false},
};
export function ConnectionStatus({state,lastSynced,onRetry,onSync,compact=false}:ConnectionStatusProps){
  const c=CONN[state];
  if(compact) return<div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:radius.md,background:c.bg,border:`1px solid ${c.border}`}}><span style={{width:7,height:7,borderRadius:'50%',background:c.dot,flexShrink:0,animation:c.pulse?'dsPulse 1.2s ease-in-out infinite':undefined}}/><style>{`@keyframes dsPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style><span style={{fontSize:11,fontWeight:700,color:c.color}}>{c.label}</span>{state==='disconnected'&&onRetry&&<button onClick={onRetry} style={{fontSize:11,fontWeight:700,color:c.color,background:'none',border:'none',cursor:'pointer',textDecoration:'underline',padding:0}}>Thử lại</button>}</div>;
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:radius.lg,background:c.bg,border:`1px solid ${c.border}`}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{display:'block',width:10,height:10,borderRadius:'50%',background:c.dot,animation:c.pulse?'dsPulse 1.2s ease-in-out infinite':undefined}}/>
        <div><p style={{fontSize:13,fontWeight:700,color:c.color,margin:0}}>{c.label}</p>{lastSynced&&<p style={{fontSize:11,color:colors.neutral[400],margin:0}}>Cập nhật: {lastSynced}</p>}</div>
      </div>
      <div style={{display:'flex',gap:8}}>
        {onSync&&state==='connected'&&<button onClick={onSync} style={{padding:'5px 12px',borderRadius:radius.sm,border:`1px solid ${c.border}`,background:'white',color:c.color,fontWeight:700,fontSize:12,cursor:'pointer'}}>🔄 Đồng bộ</button>}
        {onRetry&&(state==='disconnected'||state==='error')&&<button onClick={onRetry} style={{padding:'5px 12px',borderRadius:radius.sm,background:c.dot,border:'none',color:'white',fontWeight:700,fontSize:12,cursor:'pointer'}}>Thử lại</button>}
      </div>
    </div>
  );
}

/* ─── FEEDBACK: QuickActionGroup ─── */
export function QuickActionGroup({actions,columns,minWidth=140}:QuickActionGroupProps){
  return<div style={{display:'grid',gridTemplateColumns:columns?`repeat(${columns},1fr)`:`repeat(auto-fit,minmax(${minWidth}px,1fr))`,gap:12}}>{actions.map((a,i)=>{const [hov,setHov]=useState(false);return<button key={i} onClick={a.onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:a.color,border:'none',cursor:'pointer',borderRadius:radius.xl,padding:'14px 12px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'white',fontWeight:700,fontSize:13,fontFamily:typography.fontFamily,boxShadow:hov?a.shadow:`0 4px 12px rgba(0,0,0,0.15)`,transform:hov?'translateY(-2px) scale(1.02)':'none',transition:transition.normal}}><a.icon size={20} color="white"/><span style={{textAlign:'center',lineHeight:1.3}}>{a.label}</span></button>;})}</div>;
}

/* ─── NAVIGATION: FilterTabs ─── */
export function FilterTabs({tabs,active,onChange,variant='pill',size='md'}:FilterTabsProps){
  const fs=size==='sm'?12:13,ph=size==='sm'?'7px 12px':'8px 16px';
  if(variant==='segment') return<div style={{display:'flex',gap:3,padding:3,background:colors.neutral[100],borderRadius:radius.lg,width:'fit-content'}}>{tabs.map(t=>{const isA=t.id===active;return<button key={t.id} onClick={()=>!t.disabled&&onChange(t.id)} disabled={t.disabled} style={{display:'flex',alignItems:'center',gap:6,padding:ph,borderRadius:radius.md,border:'none',cursor:t.disabled?'not-allowed':'pointer',fontWeight:700,fontSize:fs,whiteSpace:'nowrap',transition:transition.fast,opacity:t.disabled?0.4:1,background:isA?'white':'transparent',color:isA?colors.neutral[900]:colors.neutral[500],boxShadow:isA?shadows.sm:'none'}}>{t.icon&&<span style={{display:'flex',alignItems:'center'}}>{t.icon}</span>}{t.label}{t.count!==undefined&&<span style={{fontSize:fs-1,fontWeight:800,background:isA?colors.primary[100]:colors.neutral[200],color:isA?colors.primary[600]:colors.neutral[500],padding:'1px 6px',borderRadius:9999}}>{t.count}</span>}</button>;})}</div>;
  if(variant==='underline') return<div style={{display:'flex',gap:0,borderBottom:`2px solid ${colors.neutral[200]}`}}>{tabs.map(t=>{const isA=t.id===active;return<button key={t.id} onClick={()=>!t.disabled&&onChange(t.id)} disabled={t.disabled} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px 12px',border:'none',borderBottom:`3px solid ${isA?colors.primary[500]:'transparent'}`,marginBottom:-2,background:'transparent',cursor:t.disabled?'not-allowed':'pointer',fontWeight:700,fontSize:fs,color:isA?colors.primary[600]:colors.neutral[400],whiteSpace:'nowrap',opacity:t.disabled?0.4:1,transition:transition.fast}}>{t.icon&&<span style={{display:'flex',alignItems:'center'}}>{t.icon}</span>}{t.label}{t.count!==undefined&&<span style={{fontSize:fs-1,fontWeight:800,background:isA?colors.primary[50]:colors.neutral[100],color:isA?colors.primary[600]:colors.neutral[400],padding:'1px 6px',borderRadius:9999}}>{t.count}</span>}</button>;})}</div>;
  return<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{tabs.map(t=>{const isA=t.id===active;return<button key={t.id} onClick={()=>!t.disabled&&onChange(t.id)} disabled={t.disabled} style={{display:'flex',alignItems:'center',gap:6,padding:ph,borderRadius:radius.lg,border:`1.5px solid ${isA?colors.primary[500]:colors.neutral[200]}`,background:isA?colors.primary[50]:'white',color:isA?colors.primary[700]:colors.neutral[500],fontWeight:700,fontSize:fs,cursor:t.disabled?'not-allowed':'pointer',whiteSpace:'nowrap',opacity:t.disabled?0.4:1,transition:transition.fast,boxShadow:isA?`0 0 0 1px ${colors.primary[500]}`:'none'}}>{t.icon&&<span style={{display:'flex',alignItems:'center'}}>{t.icon}</span>}{t.label}{t.count!==undefined&&<span style={{fontSize:fs-1,fontWeight:800,background:isA?colors.primary[500]:colors.neutral[100],color:isA?'white':colors.neutral[400],padding:'1px 6px',borderRadius:9999}}>{t.count}</span>}</button>;})}</div>;
}

/* ─── NAVIGATION: FilterChip ─── */
const CC:Record<string,{bg:string;border:string;color:string;activeBg:string;activeText:string}>={
  indigo:{bg:colors.primary[50],border:colors.primary[200],color:colors.primary[700],activeBg:colors.primary[500],activeText:'white'},
  teal:{bg:colors.teal[50],border:'#99f6e4',color:colors.teal[600],activeBg:colors.teal[500],activeText:'white'},
  emerald:{bg:colors.success[50],border:colors.success[200],color:colors.success[600],activeBg:colors.success[500],activeText:'white'},
  amber:{bg:colors.warning[50],border:colors.warning[200],color:colors.warning[600],activeBg:colors.warning[500],activeText:'white'},
  rose:{bg:colors.danger[50],border:colors.danger[200],color:colors.danger[600],activeBg:colors.danger[500],activeText:'white'},
  slate:{bg:colors.neutral[50],border:colors.neutral[200],color:colors.neutral[600],activeBg:colors.neutral[500],activeText:'white'},
  sky:{bg:colors.info[50],border:'#bae6fd',color:colors.info[600],activeBg:colors.info[500],activeText:'white'},
  violet:{bg:colors.secondary[50],border:'#ddd6fe',color:colors.secondary[600],activeBg:colors.secondary[500],activeText:'white'},
};
export function FilterChip({label,count,active=false,onClick,onRemove,color='indigo'}:FilterChipProps){
  const c=CC[color]||CC.indigo;
  return<button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:9999,border:`1.5px solid ${active?c.activeBg:c.border}`,background:active?c.activeBg:c.bg,color:active?c.activeText:c.color,fontWeight:700,fontSize:12,cursor:'pointer',transition:transition.fast,boxShadow:active?shadows.sm:'none'}}>{label}{count!==undefined&&<span style={{fontSize:11,fontWeight:800,background:active?'rgba(255,255,255,0.25)':c.border,color:active?c.activeText:c.color,padding:'1px 6px',borderRadius:9999,lineHeight:1.4}}>{count}</span>}{onRemove&&<span onClick={e=>{e.stopPropagation();onRemove();}} style={{width:14,height:14,borderRadius:'50%',background:'rgba(0,0,0,0.12)',display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginLeft:2}}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg></span>}</button>;
}

/* ─── NAVIGATION: NavBar (stub - app uses Layout.tsx directly) ─── */
export const NavBar = memo(({items,active,onNavigate,centerName='App'}:NavBarProps) => {
  return (
    <nav style={{display:'flex',gap:4}}>
      {items.map(({id,label,icon:Icon})=>{
        const isActive=active===id;
        return<button key={id} onClick={()=>onNavigate(id)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:6,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,background:isActive?'#6366f1':'transparent',color:isActive?'white':'#64748b'}}><Icon size={13}/>{label}</button>;
      })}
    </nav>
  );
});
