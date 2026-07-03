import { Loader2 } from "lucide-react";

/**
 * Primary button with loading state and variants.
 */
export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...rest
}) {
  return (
    <button
      className={`btn btn--${variant} ${loading ? "btn--loading" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={16} className="btn__spinner" />}
      {children}
    </button>
  );
}
