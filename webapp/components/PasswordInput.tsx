"use client";

import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  className = "",
  required,
  autoComplete = "current-password",
  ariaShowLabel = "Құпия сөзді көрсету",
  ariaHideLabel = "Құпия сөзді жасыру",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  required?: boolean;
  autoComplete?: string;
  ariaShowLabel?: string;
  ariaHideLabel?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`w-full h-12 rounded-xl border border-ink-200 pl-4 pr-12 focus:border-gold-500 outline-none ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? ariaHideLabel : ariaShowLabel}
        tabIndex={-1}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-gold-600 hover:bg-gold-50 transition-colors"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 5.2A10.9 10.9 0 0112 5c6 0 9.5 7 9.5 7a14.6 14.6 0 01-3.1 3.9M6.2 6.6C3.6 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.3 0 2.5-.3 3.5-.8" />
            <path d="M9.9 9.9a3 3 0 004.2 4.2" />
          </svg>
        )}
      </button>
    </div>
  );
}
