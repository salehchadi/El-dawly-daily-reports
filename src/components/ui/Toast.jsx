import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

/**
 * Toast notification component.
 * Renders at the bottom-right corner, auto-dismisses after `duration` ms.
 *
 * @param {{ message: string, type?: "success"|"error"|"warning"|"info", duration?: number, onClose: () => void }} props
 */
export default function Toast({ message, type = "success", duration = 3500, onClose }) {
  const [exiting, setExiting] = useState(false);
  const onCloseRef = useRef(onClose);

  // Keep ref up to date without triggering re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onCloseRef.current(), 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const icon = type === "success" ? <CheckCircle size={20} /> :
               type === "error"   ? <AlertTriangle size={20} /> :
               type === "warning" ? <AlertTriangle size={20} /> : null;

  return (
    <div className={`toast toast--${type} ${exiting ? "toast--exit" : ""}`}>
      <span className="toast__icon">{icon}</span>
      <span className="toast__msg">{message}</span>
      <button className="toast__close" onClick={() => { setExiting(true); setTimeout(() => onCloseRef.current(), 400); }}>
        <X size={14} />
      </button>
    </div>
  );
}
