import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import { FOOTER_SPY_TEXT, getRandomSidebarMeme } from "../utils/quotes";
import Card from "../components/ui/Card";
import ReportForm from "../components/ReportForm";
import ProgressChart from "../components/ProgressChart";
import CalendarView from "../components/CalendarView";
import Deadlines from "../components/Deadlines";
import { LogOut, Shield, Flame, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sidebarMeme, setSidebarMeme] = useState(getRandomSidebarMeme());

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [reportsData, deadlinesData] = await Promise.all([
        apiRequest("getUserData", { username: user.username }),
        apiRequest("getDeadlines", { username: user.username })
      ]);
      setReports(reportsData.reports || []);
      setDeadlines(deadlinesData.deadlines || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoadingData(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setSidebarMeme(getRandomSidebarMeme()), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalHours = reports.reduce((s, r) => s + Number(r.hours || 0), 0);
  
  // Calculate Streak
  let streak = 0;
  const getLocalString = (dVal) => {
    const d = new Date(dVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const today = getLocalString(new Date());
  
  // Only count valid reports (hours > 0) towards the streak
  const validReports = reports.filter(r => Number(r.hours) > 0);
  const sortedDates = [...new Set(validReports.map(r => getLocalString(r.date)))].sort().reverse();
  
  let checkDate = new Date();
  for (let i = 0; i < sortedDates.length; i++) {
    const dStr = getLocalString(checkDate);
    if (sortedDates.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dStr === today) {
      // If today is missing, check yesterday to keep streak alive
      checkDate.setDate(checkDate.getDate() - 1);
      const yStr = getLocalString(checkDate);
      if (sortedDates.includes(yStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <BookOpen size={24} />
          <span className="dashboard__brand-text">يوميات الدولي</span>
        </div>
        <nav className="dashboard__nav" style={{ display: "flex", gap: "1rem" }}>
          {user.isAdmin && (
            <button className="btn btn--warning" onClick={() => navigate("/admin")}>
              <Shield size={16} /> الإدارة
            </button>
          )}
          <button className="btn btn--danger" onClick={handleLogout}>
            <LogOut size={16} /> هروب
          </button>
        </nav>
      </header>

      <div className="dashboard__layout">
        
        {/* SIDE POP BAR / LEGENDS */}
        <aside className="dashboard__sidebar">
          <Card style={{ backgroundColor: "var(--color-warning)", transform: "rotate(2deg)" }}>
            <h3 style={{ fontSize: "1.5rem", borderBottom: "3px solid #000", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              <Flame size={24} style={{ display: "inline", verticalAlign: "middle" }} /> Streak: {streak} أيام
            </h3>
            <p style={{ fontSize: "1.2rem", fontWeight: "900", whiteSpace: "pre-line" }}>
              {sidebarMeme}
            </p>
          </Card>
          
          <Card style={{ marginTop: "1.5rem", transform: "rotate(-1deg)" }}>
            <h3 style={{ fontSize: "1.2rem", borderBottom: "3px solid #000", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              دليل النجاة (Legend)
            </h3>
            <ul style={{ listStyle: "none", fontSize: "1.1rem", fontWeight: "bold", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "inline-block", width: "24px", height: "24px", background: "var(--color-success)", border: "3px solid #000" }}></span>
                🟢 بطل وذاكرت
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "inline-block", width: "24px", height: "24px", background: "var(--color-danger)", border: "3px solid #000" }}></span>
                🔴 متخاذل ومكسل
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "inline-block", width: "24px", height: "24px", background: "#fff", border: "3px solid #000" }}></span>
                ⚪ لسه مجاش وقته
              </li>
            </ul>
          </Card>
        </aside>

        {/* MAIN CONTENT */}
        <main className="dashboard__main">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontSize: "3rem", textTransform: "uppercase", lineHeight: 1, textShadow: "4px 4px 0px var(--color-warning)" }}>
                عاش يا {user.username}!
              </h1>
              <p style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
                ساعات الكفاح: <strong>{totalHours.toFixed(1)}</strong> ساعة
              </p>
            </div>
          </div>

          <div className="dashboard__forms">
            <Card>
              <ReportForm onReportSubmitted={fetchData} />
            </Card>
            <Card>
              <Deadlines deadlines={deadlines} onUpdate={fetchData} />
            </Card>
          </div>

          {/* Weekly Progress Chart */}
          <Card>
            <ProgressChart reports={reports} />
          </Card>

          {/* THE BIG CALENDAR DOWN */}
          <Card style={{ padding: "2rem", border: "6px solid #000", boxShadow: "12px 12px 0px var(--color-accent)" }}>
            <h2 style={{ fontSize: "2rem", textAlign: "center", marginBottom: "1rem", textTransform: "uppercase", color: "var(--color-danger)" }}>
              سجل أعمالك
            </h2>
            <CalendarView reports={reports} deadlines={deadlines} onExcuseSubmitted={fetchData} />
          </Card>

        </main>
      </div>

      <footer className="dashboard__footer" style={{ textAlign: "center", padding: "2rem", fontWeight: "bold" }}>
        <span className="dashboard__footer-spy">{FOOTER_SPY_TEXT}</span>
      </footer>
    </div>
  );
}
