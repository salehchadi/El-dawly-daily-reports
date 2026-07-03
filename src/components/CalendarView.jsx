import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, MessageSquareWarning } from "lucide-react";
import { WEEKEND_EMPTY_TOOLTIP, getRandomEmptyQuote, getRandomExcuseMock } from "../utils/quotes";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Toast from "./ui/Toast";

export default function CalendarView({ reports = [], deadlines = [], onExcuseSubmitted }) {
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(new Date());
  
  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [excuseModalDate, setExcuseModalDate] = useState(null);
  
  const [excuseText, setExcuseText] = useState("");
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [toast, setToast] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const getLocalString = (dVal) => {
    if (!dVal) return "";
    const d = new Date(dVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const reportMap = useMemo(() => {
    const m = {};
    reports.forEach((r) => {
      const key = getLocalString(r.date);
      m[key] = { hours: Number(r.hours), text: r.text };
    });
    return m;
  }, [reports]);

  const deadlinesMap = useMemo(() => {
    const m = {};
    deadlines.forEach((d) => {
      if (d.status !== "Pending") return; // Only show pending deadlines on calendar
      const key = getLocalString(d.target_date);
      if (!m[key]) m[key] = [];
      m[key].push(d);
    });
    return m;
  }, [deadlines]);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let currentDay = 1 - firstDay;

  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (currentDay >= 1 && currentDay <= daysInMonth) {
        week.push(currentDay);
      } else {
        week.push(null);
      }
      currentDay++;
    }
    if (week.some((d) => d !== null)) weeks.push(week);
  }

  const today = new Date();
  const todayStr = getLocalString(today);
  const joinDate = user.join_date ? new Date(user.join_date) : new Date("2000-01-01");

  const monthHasReports = reports.some((r) => {
    const key = getLocalString(r.date);
    const rMonth = parseInt(key.split("-")[1], 10) - 1;
    const rYear = parseInt(key.split("-")[0], 10);
    return rMonth === month && rYear === year;
  });

  const monthLabel = viewDate.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

  const handleCellClick = (report, dateStr, isRed, isFuture, isTodayEmpty) => {
    if (isFuture) {
      setErrorModal("احنا فين واليوم ده فين يا عم الحاج؟ ركز في يومك!");
      return;
    }
    if (isTodayEmpty) {
      setErrorModal("اليوم لسه مخلصش، بطل مرقعة وقوم ذاكر!");
      return;
    }

    if (report && report.hours > 0) {
      // Valid report
      setSelectedReport({ ...report, date: dateStr });
    } else if (isRed || (report && report.hours === 0)) {
      // Past day with no report, or existing excuse
      setExcuseModalDate({ dateStr, report });
      setExcuseText(report ? report.text : "");
    }
  };

  const handleSubmitExcuse = async (e) => {
    e.preventDefault();
    if (!excuseText.trim()) return;

    setSubmittingExcuse(true);
    try {
      await apiRequest("submitReport", {
        username: user.username,
        date: excuseModalDate.dateStr,
        report_text: excuseText,
        hours_studied: 0,
      });

      setToast({ message: getRandomExcuseMock(), type: "error" });
      setExcuseModalDate(null);
      setExcuseText("");
      if (onExcuseSubmitted) onExcuseSubmitted();
    } catch (err) {
      setToast({ message: err.message || "فشل تسجيل العذر", type: "error" });
    } finally {
      setSubmittingExcuse(false);
    }
  };

  return (
    <div className="calendar" style={{ width: "100%" }}>
      <div className="calendar__header">
        <button className="calendar__nav" onClick={prevMonth}><ChevronLeft size={24} /></button>
        <h3 className="calendar__month" style={{ fontSize: "2.5rem" }}>{monthLabel}</h3>
        <button className="calendar__nav" onClick={nextMonth}><ChevronRight size={24} /></button>
      </div>

      {!monthHasReports && (
        <div className="empty-state empty-state--calendar" style={{ padding: "2rem", textAlign: "center", background: "var(--color-warning)", border: "3px solid #000", marginBottom: "1rem" }}>
          <span className="empty-state__text" style={{ fontSize: "1.5rem", fontWeight: "900" }}>{getRandomEmptyQuote()}</span>
        </div>
      )}

      <div className="calendar__grid-wrapper">
        <div className="calendar__weekdays">
          {["حد", "اتنين", "تلات", "اربع", "خميس", "جمعة", "سبت"].map((d) => (
            <span key={d} className="calendar__weekday" style={{ fontSize: "1.5rem" }}>{d}</span>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="calendar__week" style={{ gap: "12px", marginBottom: "12px" }}>
            {week.map((day, di) => {
              if (day === null) {
                return <span key={di} className="calendar__cell calendar__cell--empty" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const cellDate = new Date(dateStr);
              const report = reportMap[dateStr];
              const dayDeadlines = deadlinesMap[dateStr] || [];
              
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              const joinDateStr = getLocalString(joinDate);
              
              let statusClass = "";
              let isRed = false;
              let isExcuse = false;

              if (report && report.hours > 0) {
                statusClass = "calendar__cell--green";
              } else if (report && report.hours === 0) {
                statusClass = "calendar__cell--red";
                isExcuse = true;
              } else if (dateStr < todayStr && dateStr >= joinDateStr) {
                statusClass = "calendar__cell--red";
                isRed = true;
              }

              const isTodayEmpty = isToday && !report;

              return (
                <button
                  key={di}
                  className={`calendar__cell ${statusClass} ${isToday ? "calendar__cell--today" : ""}`}
                  onClick={() => handleCellClick(report, dateStr, isRed, isFuture, isTodayEmpty)}
                  style={{ border: "4px solid #000", fontFamily: "inherit", fontSize: "2rem", aspectRatio: "1/1", width: "100%", position: "relative" }}
                >
                  {day}
                  
                  <div style={{ position: "absolute", bottom: "4px", display: "flex", gap: "4px", justifyContent: "center", width: "100%" }}>
                    {dayDeadlines.length > 0 && <span title="في ديدلاين هنا!" style={{ fontSize: "1.2rem" }}>🚩</span>}
                    {isExcuse && <span title="حجة بليدة" style={{ fontSize: "1.2rem" }}>📝</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <Modal open={!!selectedReport} onClose={() => setSelectedReport(null)} title={selectedReport?.date}>
        {selectedReport && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "3rem", fontWeight: "900", color: "var(--color-success)", margin: "0", textShadow: "2px 2px 0px #000" }}>
              {selectedReport.hours} ساعات كفاح
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", background: "var(--bg-secondary)", padding: "1rem", border: "4px solid #000", marginTop: "1rem", whiteSpace: "pre-line" }}>
              {selectedReport.text}
            </p>
            <p style={{ fontSize: "1.2rem", color: "var(--color-accent)", marginTop: "1rem", fontWeight: "900" }}>عاش يا بطل، كمل!</p>
          </div>
        )}
      </Modal>

      <Modal open={!!errorModal} onClose={() => setErrorModal(null)} title="رسالة من النظام">
        {errorModal && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h1 style={{ fontSize: "3rem", color: "var(--color-danger)", marginBottom: "1rem" }}>🔴</h1>
            <p style={{ fontSize: "2rem", fontWeight: "900", color: "var(--color-danger)" }}>
              {errorModal}
            </p>
          </div>
        )}
      </Modal>

      <Modal open={!!excuseModalDate} onClose={() => setExcuseModalDate(null)} title="سجل أعذارك الواهية">
        {excuseModalDate && (
          <div style={{ textAlign: "center", direction: "rtl" }}>
            <h1 style={{ fontSize: "2.5rem", color: "var(--color-danger)", marginBottom: "1rem" }}>يوم {excuseModalDate.dateStr} كنت متخاذل!</h1>
            
            {excuseModalDate.report ? (
              <div>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>عذرك البليد كان:</p>
                <div style={{ background: "var(--bg-secondary)", padding: "1rem", border: "4px solid #000", fontSize: "1.2rem", whiteSpace: "pre-line" }}>
                  {excuseModalDate.report.text}
                </div>
                <p style={{ marginTop: "1rem", fontSize: "1.2rem", color: "var(--color-danger)", fontWeight: "900" }}>اللون هيفضل أحمر برضو!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitExcuse}>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>اكتب حجتك، يمكن حد يصدقك:</p>
                <textarea
                  className="input-group__field"
                  rows="4"
                  value={excuseText}
                  onChange={(e) => setExcuseText(e.target.value)}
                  placeholder="قولنا كنت بتعمل ايه بدل المذاكرة..."
                  style={{ width: "100%", marginBottom: "1rem" }}
                  required
                />
                <Button type="submit" loading={submittingExcuse} variant="danger" style={{ width: "100%" }}>
                  <MessageSquareWarning size={20} /> سجل العذر
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
