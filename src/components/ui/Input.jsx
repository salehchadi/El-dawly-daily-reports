/**
 * Styled input with label and optional error.
 */
export default function Input({
  label,
  error,
  id,
  className = "",
  ...rest
}) {
  return (
    <div className={`input-group ${error ? "input-group--error" : ""} ${className}`}>
      {label && <label htmlFor={id} className="input-group__label">{label}</label>}
      <input id={id} className="input-group__field" {...rest} />
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}
