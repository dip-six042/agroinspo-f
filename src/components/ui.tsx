import React from 'react';
import { initials } from '../lib/api';

export const WRAP = 'max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12';

export const Avatar: React.FC<{ name: string; src?: string; size?: number; className?: string }> = ({ name, src, size = 40, className = '' }) =>
  src ? (
    <img src={src} alt="" style={{ width: size, height: size }} className={`rounded-full object-cover bg-stone-200 shrink-0 ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      className={`rounded-full bg-mist text-ink font-medium flex items-center justify-center shrink-0 ${className}`}
    >
      {initials(name)}
    </span>
  );

export const Field: React.FC<{
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ id, label, hint, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-[13px] font-medium mb-1.5">
      {label}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 text-[12px] text-rose-700">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-[12px] text-slate-500">{hint}</p>
    ) : null}
  </div>
);

export const inputClass =
  'w-full h-11 px-4 rounded-full border border-stone-300 bg-white text-[14px] text-ink placeholder:text-slate-400 focus:outline-none focus:border-ink transition-colors disabled:bg-stone-100';
export const textareaClass =
  'w-full px-4 py-3 rounded-2xl border border-stone-300 bg-white text-[14px] text-ink placeholder:text-slate-400 focus:outline-none focus:border-ink transition-colors resize-y';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'lime' | 'ink' | 'outline' | 'ghost' | 'danger'; busy?: boolean }
> = ({ variant = 'ink', busy, className = '', children, disabled, ...rest }) => {
  const styles = {
    lime: 'bg-lime hover:bg-lime-deep text-ink',
    ink: 'bg-ink hover:bg-black text-white',
    outline: 'border border-stone-300 hover:border-ink text-ink bg-transparent',
    ghost: 'text-ink hover:bg-stone-100',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white'
  }[variant];
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {busy && <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

export const Notice: React.FC<{ tone?: 'info' | 'error' | 'success'; children: React.ReactNode; className?: string }> = ({
  tone = 'info',
  children,
  className = ''
}) => {
  const styles = {
    info: 'bg-mist text-slate-700',
    error: 'bg-rose-50 text-rose-800 border border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${styles} ${className}`}>
      {children}
    </div>
  );
};

export const Chip: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`h-9 px-4 rounded-full border text-[13px] transition-colors ${
      selected ? 'bg-lime border-lime text-ink' : 'border-stone-300 hover:border-ink text-ink'
    }`}
  >
    {children}
  </button>
);

/** Small "• Label" kicker used across the site. */
export const Kicker: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'text-slate-600' }) => (
  <span className={`kicker ${className}`}>{children}</span>
);

/** Accessible dialog: closes on Escape and backdrop click, traps nothing fancy. */
export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl`}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-stone-100 z-10">
          <h2 className="font-display text-[22px] font-normal leading-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 rounded-full hover:bg-stone-100 text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const PILL_TONES = {
  neutral: 'bg-mist text-slate-700',
  good: 'bg-emerald-50 text-emerald-700',
  lime: 'bg-lime text-ink',
  warn: 'bg-amber-50 text-amber-800',
  bad: 'bg-rose-50 text-rose-800',
  ink: 'bg-ink text-white'
};
export const Pill: React.FC<{ tone?: keyof typeof PILL_TONES; children: React.ReactNode; className?: string }> = ({ tone = 'neutral', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${PILL_TONES[tone]} ${className}`}>{children}</span>
);

export const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-[13px] px-5 py-3 rounded-full shadow-xl max-w-[calc(100vw-2rem)]">
      {message}
    </div>
  );
};

export const naira = (n: number) => `₦\u2002${Math.round(n).toLocaleString('en-NG')}`;
export const selectClass = 'h-11 px-4 rounded-full border border-stone-300 bg-white text-[14px] focus:outline-none focus:border-ink';
