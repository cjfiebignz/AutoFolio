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
        className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-4 text-sm font-bold text-white/20">{prefix}</span>}
        <input 
          id={inputId}
          {...props}
          className={`h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 text-sm font-bold text-white placeholder:text-white/15 focus:border-white/20 focus:bg-white/[0.05] focus:outline-none transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} disabled:opacity-50`}
        />
        {suffix && <span className="absolute right-4 text-[10px] font-black uppercase text-white/20">{suffix}</span>}
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
      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">{label}</label>
      <div className="relative">
        <select 
          {...props}
          className="h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-4 text-sm font-bold text-white focus:border-white/20 focus:bg-white/[0.05] focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
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
      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">{label}</label>
      <textarea 
        {...props}
        className="w-full rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm font-bold text-white placeholder:text-white/15 focus:border-white/20 focus:bg-white/[0.05] focus:outline-none transition-all resize-none disabled:opacity-50"
      />
    </div>
  );
}

export function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2 px-1">
        {icon && <div className="text-white/20">{icon}</div>}
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{title}</h3>
      </header>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}
