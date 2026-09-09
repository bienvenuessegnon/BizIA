type SpinnerProps = {
  label?: string;
  size?: "sm" | "md";
};

export function Spinner({ label = "Chargement…", size = "md" }: SpinnerProps) {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-live="polite">
      <span className="spinner__icon" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
