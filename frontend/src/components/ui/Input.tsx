"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  error?: string;
  valid?: boolean;
  hint?: string;
  endAdornment?: ReactNode;
};

export function Input({
  label,
  error,
  valid = false,
  hint,
  endAdornment,
  id,
  className = "",
  type = "text",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const fieldClass = [
    "field",
    error ? "field--error" : "",
    valid && !error ? "field--valid" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fieldClass}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="field__control">
        <input
          id={inputId}
          className="field__input"
          type={inputType}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? "Masquer" : "Afficher"}
          </button>
        )}
        {endAdornment}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {valid && !error && <span className="field__valid-icon" aria-hidden="true">✓</span>}
    </div>
  );
}
