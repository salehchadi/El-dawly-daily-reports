import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

/**
 * Toast notification component.
 * Renders at the top-right corner, auto-dismisses after `duration` ms.
 *
 * @param {{ message: string, type?: "success"|"error"|"info", duration?: number, onClose: () => void }} props
 */
export default function Toast({ message, type = "success", duration = 3500, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icon = type === "success" ? <CheckCircle size={20} /> :
               type === "error"   ? <AlertTriangle size={20} /> : null;

  return (
    <div className={`toast toast--${type} ${exiting ? "toast--exit" : ""}`}>
      <span className="toast__icon">{icon}</span>
      <span className="toast__msg">{message}</span>
      <button className="toast__close" onClick={() => { setExiting(true); setTimeout(onClose, 400); }}>
        <X size={14} />
      </button>
    </div>
  );
}
