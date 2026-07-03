import { useState, useRef } from "react";
import { Send, MessageSquareWarning } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Toast from "./ui/Toast";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  getSuccessToast,
  VALIDATION_ERROR,
  RAGE_CLICK_TEXT,
  getRandomExcuseMock
} from "../utils/quotes";

export default function ReportForm({ onReportSubmitted }) {
  const { user } = useAuth();
  
  const getLocalString = (dVal) => {
    if (!dVal) return "";
    const d = new Date(dVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [date, setDate] = useState(getLocalString(new Date()));
  const [reportText, setReportText] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExcuse, setLoadingExcuse] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [rageModal, setRageModal] = useState(false);
  
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const validateReport = () => {
    const e = {};
    if (!reportText.trim()) e.reportText = "اكتب حاجة يا فاشل";
    const h = parseFloat(hours);
    if (!hours || isNaN(h) || h <= 0) e.hours = "دخل ساعات حقيقية";
    if (!date) e.date = "اختار يوم";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateExcuse = () => {
    const e = {};
    if (!reportText.trim()) e.reportText = "اكتب حجتك الاول";
    if (!date) e.date = "اختار يوم";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRageClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 3) {
      setRageModal(true);
      clickCountRef.current = 0;
    }
  };

  const resetRageClick = () => {
    clickCountRef.current = 0;
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (loading || loadingExcuse) return handleRageClick();
    if (!validateReport()) return;

    setLoading(true);
    resetRageClick();

    try {
      await apiRequest("submitReport", {
        username: user.username,
        date,
        report_text: reportText,
        hours_studied: parseFloat(hours),
      });

      const msg = getSuccessToast(parseFloat(hours));
      setToast({ message: msg, type: "success" });
      setReportText("");
      setHours("");
      if (onReportSubmitted) onReportSubmitted();
    } catch (err) {
      setToast({ message: err.message || "حصلت مشكلة", type: "error" });
    } finally {
      setLoading(false);
      clearTimeout(clickTimerRef.current);
    }
  };

  const handleSubmitExcuse = async (e) => {
    e.preventDefault();
    if (loading || loadingExcuse) return handleRageClick();
    if (!validateExcuse()) return;

    setLoadingExcuse(true);
    resetRageClick();

    try {
      await apiRequest("submitReport", {
        username: user.username,
        date,
        report_text: reportText,
        hours_studied: 0, // Excuse
      });

      setToast({ message: getRandomExcuseMock(), type: "error" });
      setReportText("");
      setHours("");
      if (onReportSubmitted) onReportSubmitted();
    } catch (err) {
      setToast({ message: err.message || "فشل تسجيل العذر", type: "error" });
    } finally {
      setLoadingExcuse(false);
      clearTimeout(clickTimerRef.current);
    }
  };

  return (
    <div style={{ direction: "rtl", fontFamily: "var(--font)" }}>
      <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.5rem" }}>
        <Send size={24} />
        سجل يومياتك
      </h2>

      <Input
        id="report-date"
        label="اليوم"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
      />

      <div className={`input-group ${errors.reportText ? "input-group--error" : ""}`}>
        <label htmlFor="report-text" className="input-group__label">عملت إيه؟ (أو إيه حجتك؟)</label>
        <textarea
          id="report-text"
          className="input-group__field input-group__field--textarea"
          rows={4}
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="مثال: خلصت كورس الريأكت... أو كنت نايم زي البطيخة"
        />
        {errors.reportText && <span className="input-group__error">{errors.reportText}</span>}
      </div>

      <Input
        id="report-hours"
        label="ساعات الكفاح (سيبها فاضية لو هتسجل عذر)"
        type="number"
        step="0.5"
        min="0"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        error={errors.hours}
        placeholder="مثال: 2.5"
      />

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        <Button onClick={handleSubmitReport} loading={loading} style={{ flex: "1 1 auto" }}>
          <Send size={16} />
          سجل كفاحك
        </Button>
        <Button onClick={handleSubmitExcuse} loading={loadingExcuse} variant="danger" style={{ flex: "1 1 auto" }}>
          <MessageSquareWarning size={16} />
          سجل عذرك البليد
        </Button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal open={rageModal} onClose={() => setRageModal(false)} title="">
        <p style={{ fontSize: "2rem", color: "var(--color-danger)", fontWeight: "900", textAlign: "center", padding: "2rem" }}>
          {RAGE_CLICK_TEXT}
        </p>
      </Modal>
    </div>
  );
}
