/**
 * Reusable card wrapper with glassmorphism styling.
 */
export default function Card({ children, className = "", ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}
