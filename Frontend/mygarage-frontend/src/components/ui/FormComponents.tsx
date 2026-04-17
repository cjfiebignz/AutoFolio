import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseFormProps {
  label: string;
}

interface FormInputProps extends BaseFormProps, InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

export function FormInput({ label, prefix, suffix, id, ...props }: FormInputProps) {
  const inputId = id || props.name;
  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 ml-1"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-4 text-sm font-bold text-muted opacity-40">{prefix}</span>}
        <input 
          id={inputId}
          {...props}
          className={`h-12 w-full rounded-2xl border border-border-subtle bg-foreground/[0.03] px-4 text-sm font-bold text-foreground placeholder:text-muted/30 focus:border-border-strong focus:bg-foreground/[0.05] focus:outline-none transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} disabled:opacity-50`}
        />
        {suffix && <span className="absolute right-4 text-[10px] font-black uppercase text-muted opacity-40">{suffix}</span>}
      </div>
    </div>
  );
}

interface FormSelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps extends BaseFormProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: FormSelectOption[];
}

export function FormSelect({ label, options, ...props }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 ml-1">{label}</label>
      <div className="relative">
        <select 
          {...props}
          className="h-12 w-full rounded-2xl border border-border-subtle bg-foreground/[0.03] px-4 text-sm font-bold text-foreground focus:border-border-strong focus:bg-foreground/[0.05] focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted opacity-40">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m6 9 6 6 6-9" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface FormTextAreaProps extends BaseFormProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function FormTextArea({ label, ...props }: FormTextAreaProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 ml-1">{label}</label>
      <textarea 
        {...props}
        className="w-full rounded-2xl border border-border-subtle bg-foreground/[0.03] p-4 text-sm font-bold text-foreground placeholder:text-muted/30 focus:border-border-strong focus:bg-foreground/[0.05] focus:outline-none transition-all resize-none disabled:opacity-50"
      />
    </div>
  );
}

export function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2 px-1 border-b border-border-subtle pb-2 mb-4">
        {icon && <div className="text-muted opacity-40">{icon}</div>}
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-40">{title}</h3>
      </header>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}
