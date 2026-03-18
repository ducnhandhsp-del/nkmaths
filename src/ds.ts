import type React from 'react';

export const colors = {
  primary:   { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca', grad:'linear-gradient(135deg,#6366f1,#4f46e5)' },
  secondary: { 50:'#f5f3ff',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed', grad:'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  success:   { 50:'#ecfdf5',200:'#a7f3d0',500:'#10b981',600:'#059669', grad:'linear-gradient(135deg,#10b981,#059669)' },
  warning:   { 50:'#fffbeb',200:'#fde68a',500:'#f59e0b',600:'#d97706', grad:'linear-gradient(135deg,#f59e0b,#d97706)' },
  danger:    { 50:'#fff1f2',200:'#fecaca',500:'#f43f5e',600:'#e11d48', grad:'linear-gradient(135deg,#f43f5e,#e11d48)' },
  info:      { 50:'#eff6ff',400:'#60a5fa',500:'#3b82f6',600:'#2563eb' },
  teal:      { 50:'#f0fdfa',500:'#14b8a6',600:'#0d9488', grad:'linear-gradient(135deg,#14b8a6,#0d9488)' },
  neutral:   { 0:'#ffffff',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a' },
  dark:      { grad:'linear-gradient(180deg,#0f1f3d 0%,#0a1628 100%)' },
} as const;

export const typography = {
  // Be Vietnam Pro trước, Nunito fallback — cả 2 đều có full Vietnamese glyph set
  fontFamily: "'Be Vietnam Pro', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif",
  fontSize:   { xs:10,sm:12,base:13,md:14,lg:16,xl:18,'2xl':22,'3xl':28,'4xl':36 },
  fontWeight: { normal:400,medium:500,semibold:600,bold:700,extrabold:800 },
  lineHeight: { tight:1.2,normal:1.5,loose:1.8 },
  letterSpacing: { tight:'-0.01em',normal:'0',wide:'0.04em',wider:'0.08em',widest:'0.12em' },
} as const;

export const spacing = { 1:4,2:8,3:12,4:16,5:20,6:24,7:28,8:32,10:40,12:48,16:64 } as const;
export const radius  = { sm:6,md:10,lg:14,xl:18,'2xl':22,full:9999 } as const;
export const shadows = {
  xs:'0 1px 3px rgba(0,0,0,0.06)', sm:'0 2px 8px rgba(0,0,0,0.07)',
  md:'0 4px 16px rgba(0,0,0,0.10)', lg:'0 8px 24px rgba(0,0,0,0.14)', xl:'0 12px 40px rgba(0,0,0,0.18)',
  primary:'0 8px 24px rgba(99,102,241,0.35)', success:'0 8px 24px rgba(5,150,105,0.35)',
  warning:'0 8px 24px rgba(245,158,11,0.35)', danger:'0 8px 24px rgba(225,29,72,0.35)',
} as const;
export const transition = { fast:'all 0.12s ease',normal:'all 0.18s ease',slow:'all 0.25s ease' } as const;
export const zIndex = { base:0,raised:10,dropdown:20,sticky:30,fab:40,header:50,modal:100,toast:200 } as const;
export const intent = {
  primary:   { bg:colors.primary[500],   hover:colors.primary[600],   light:colors.primary[50],   border:colors.primary[200],   text:colors.primary[600],   shadow:shadows.primary },
  secondary: { bg:colors.secondary[500], hover:colors.secondary[600], light:colors.secondary[50], border:'#ddd6fe',              text:colors.secondary[600], shadow:'0 8px 24px rgba(139,92,246,0.35)' },
  success:   { bg:colors.success[500],   hover:colors.success[600],   light:colors.success[50],   border:colors.success[200],   text:colors.success[600],   shadow:shadows.success },
  warning:   { bg:colors.warning[500],   hover:colors.warning[600],   light:colors.warning[50],   border:colors.warning[200],   text:colors.warning[600],   shadow:shadows.warning },
  danger:    { bg:colors.danger[500],    hover:colors.danger[600],    light:colors.danger[50],    border:colors.danger[200],    text:colors.danger[600],    shadow:shadows.danger  },
  neutral:   { bg:colors.neutral[700],   hover:colors.neutral[800],   light:colors.neutral[50],   border:colors.neutral[200],   text:colors.neutral[600],   shadow:shadows.md },
} as const;

export type IntentType  = keyof typeof intent;
export type ThemeRadius = keyof typeof radius;
export type Size    = 'xs'|'sm'|'md'|'lg'|'xl';
export type Intent  = 'primary'|'secondary'|'success'|'warning'|'danger'|'neutral';
export type Variant = 'solid'|'outline'|'ghost'|'text';
export type Align   = 'left'|'center'|'right';
export type BadgeColor = 'indigo'|'teal'|'emerald'|'amber'|'rose'|'sky'|'violet'|'slate';
export type AttendanceStatus = 'present'|'absent'|'late';
export type ConnectionState = 'connected'|'disconnected'|'loading'|'error';

export interface AttendanceStudent {
  id:string; name:string; classId?:string; status:AttendanceStatus; note?:string;
}
export interface SelectOption { value:string; label:string; disabled?:boolean; }
export interface RadioOption   { value:string; label:string; description?:string; disabled?:boolean; }
export interface TabItem { id:string; label:string; icon?:React.ReactNode; count?:number; disabled?:boolean; }
export interface NavItem {
  id:string; label:string; shortLabel?:string;
  icon:React.ComponentType<{size?:number;className?:string}>; color?:string; badge?:number;
}
export interface TableAction {
  icon:React.ReactNode; label:string; onClick:()=>void;
  intent?:'default'|'primary'|'warning'|'danger'; disabled?:boolean; hidden?:boolean;
}
export interface QuickAction {
  label:string; icon:React.ComponentType<{size?:number;color?:string}>;
  color:string; shadow:string; onClick:()=>void;
}

export interface ButtonProps {
  children:React.ReactNode; intent?:Intent; variant?:Variant; size?:Size;
  icon?:React.ReactNode; iconPosition?:'left'|'right'; loading?:boolean; disabled?:boolean;
  fullWidth?:boolean; onClick?:(e:React.MouseEvent)=>void; type?:'button'|'submit'|'reset';
  style?:React.CSSProperties;
}
export interface IconButtonProps {
  icon:React.ReactNode; label:string; intent?:'default'|'primary'|'warning'|'danger'|'success';
  size?:Size; onClick?:(e:React.MouseEvent)=>void; disabled?:boolean; tooltip?:string; style?:React.CSSProperties;
}
export interface BadgeProps {
  children:React.ReactNode; color?:BadgeColor; variant?:'solid'|'subtle'|'outline';
  size?:'sm'|'md'; dot?:boolean; onRemove?:()=>void;
}
export interface InputProps {
  label?:string; placeholder?:string; value:string; onChange:(value:string)=>void;
  type?:'text'|'email'|'password'|'number'|'date'|'month'|'search';
  error?:string; hint?:string; disabled?:boolean; required?:boolean;
  prefix?:React.ReactNode; suffix?:React.ReactNode; clearable?:boolean;
  size?:'sm'|'md'|'lg'; style?:React.CSSProperties;
}
export interface SelectProps {
  label?:string; value:string; onChange:(value:string)=>void; options:SelectOption[];
  placeholder?:string; error?:string; disabled?:boolean; size?:'sm'|'md'|'lg'; style?:React.CSSProperties;
}
export interface RadioGroupProps {
  label?:string; value:string; onChange:(value:string)=>void; options:RadioOption[];
  direction?:'horizontal'|'vertical'; error?:string;
}
export interface SearchBarProps {
  value:string; onChange:(value:string)=>void; placeholder?:string;
  onClear?:()=>void; width?:number|string; size?:'sm'|'md'; style?:React.CSSProperties;
}
export interface FilterChipProps {
  label:string; count?:number|string; active?:boolean;
  onClick?:()=>void; onRemove?:()=>void; color?:BadgeColor;
}
export interface FilterTabsProps {
  tabs:TabItem[]; active:string; onChange:(id:string)=>void;
  variant?:'pill'|'underline'|'segment'; size?:'sm'|'md';
}
export interface NavBarProps {
  items:NavItem[]; active:string; onNavigate:(id:string)=>void;
  variant?:'sidebar'|'bottom'|'topbar'; centerName?:string;
}
export interface StatCardProps {
  label:string; value:string|number; sub?:string; gradient:string;
  icon:React.ComponentType<{size?:number;color?:string}>;
  trend?:number|null; trendLabel?:string; onClick?:()=>void; clickable?:boolean;
}
export interface ColumnDef<T> {
  key:keyof T|string; label:string; width?:number|string; align?:Align; sortable?:boolean;
  render?:(value:any,row:T,index:number)=>React.ReactNode;
  headerStyle?:React.CSSProperties; cellStyle?:React.CSSProperties;
}
export interface DataTableProps<T extends Record<string,any>> {
  columns:ColumnDef<T>[]; data:T[]; rowKey:keyof T; loading?:boolean;
  emptyIcon?:string; emptyText?:string; emptyAction?:{label:string;onClick:()=>void};
  striped?:boolean; hoverable?:boolean; page?:number; perPage?:number; total?:number;
  onPageChange?:(page:number)=>void; scrollX?:boolean; style?:React.CSSProperties;
}
export interface TableActionsProps { actions:TableAction[]; compact?:boolean; }
export interface AttendancePickerProps {
  students:AttendanceStudent[]; onChange:(students:AttendanceStudent[])=>void; readOnly?:boolean;
}
export interface ConnectionStatusProps {
  state:ConnectionState; lastSynced?:string; onRetry?:()=>void; onSync?:()=>void; compact?:boolean;
}
export interface QuickActionGroupProps { actions:QuickAction[]; columns?:number; minWidth?:number; }
export interface PagerProps { page:number; total:number; perPage:number; setPage:(page:number)=>void; showTotal?:boolean; }
