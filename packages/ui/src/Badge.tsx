import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-950 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950 text-amber-400 border border-amber-800/60',
    danger: 'bg-rose-950 text-rose-400 border border-rose-800/60',
    info: 'bg-sky-950 text-sky-400 border border-sky-800/60',
    purple: 'bg-indigo-950 text-indigo-400 border border-indigo-800/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
