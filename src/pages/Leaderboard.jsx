import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import Card from "../components/ui/Card";
import ChaosEngine from "../components/ChaosEngine";
import { Trophy, Flame, Star, Clock, ArrowLeft, LogIn, BookOpen } from "lucide-react";

// ─── Sort options ──────────────────────────────────────────
const SORT_OPTIONS = [
  { key: "currentStreak", label: "🔥 الستريك الحالي" },
  { key: "bestStreak", label: "⭐ أعلى ستريك" },
  { key: "totalHours", label: "⏰ ساعات الكفاح" },
];

// ─── Easter egg hover roasts ───────────────────────────────
const HOVER_ROASTS = [
  "بيحاول يبقى حاجة في الحياة",
  "يا ترى بيذاكر ولا بيفتح يوتيوب؟",
  "الترتيب ده مش هيفضل كدا",
  "لو سقط هنضحك عليه",
  "بيحاول.. تحياتي",
  "ده ممكن يبقى حاجة لو ركز",
  "الستريك بتاعه على كف عفريت",
  "بيلعب على الحبل",
  "شغال على نفسه.. أو كدا بيقول",
  "المركز ده مش ضمان يا معلم",
  "هو ده ولا ده أخوه؟",
  "لو الكسل أولمبياد كان جاب دهب",
];

// ─── Bottom cycling quotes ─────────────────────────────────
const BOTTOM_QUOTES = [
  "قليل متصل خير من كثير منقطع",
  "اللي بيستسلم مش بيبان في الليدربورد",
  "ترتيبك = مجهودك، متزعلش",
  "الأول النهاردة ممكن يبقى الأخير بكرا",
  "الStreakات بتتبني يوم ورا يوم",
  "مفيش حد خد المركز الأول وهو قاعد",
  "الاستمرارية بتكسب دايماً",
  "الرجالة بتبان في الليدربورد",
];

/**
 * Public leaderboard page — accessible to everyone (no login required).
 * Shows rankings by current streak (default), best streak ever, or total hours.
 * Admin users are excluded from rankings.
 */
export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("currentStreak");
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [roastText, setRoastText] = useState("");
  const [bottomQuote, setBottomQuote] = useState(
    BOTTOM_QUOTES[Math.floor(Math.random() * BOTTOM_QUOTES.length)]
  );

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const result = await apiRequest("getLeaderboard", {});
        setData(result.leaderboard || []);
      } catch (err) {
        setError(err.message || "فشل تحميل الليدربورد");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();

    // Cycle bottom quote every 8 seconds
    const interval = setInterval(() => {
      setBottomQuote(BOTTOM_QUOTES[Math.floor(Math.random() * BOTTOM_QUOTES.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Sort leaderboard based on selected metric
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortBy === "currentStreak") return b.currentStreak - a.currentStreak || b.bestStreak - a.bestStreak;
      if (sortBy === "bestStreak") return b.bestStreak - a.bestStreak || b.currentStreak - a.currentStreak;
      if (sortBy === "totalHours") return b.totalHours - a.totalHours;
      return 0;
    });
  }, [data, sortBy]);

  /** Fun rank titles based on position */
  const getRankTitle = (index, total) => {
    const person = sorted[index];
    if (person.totalHours === 0) return "👻 شبح";
    if (index === 0) return "👑 ملك الاستمرارية";
    if (index === 1) return "⚡ الوحش";
    if (index === 2) return "🔥 ماكينة";
    if (total > 4 && index < total * 0.25) return "💪 بطل";
    if (total > 4 && index < total * 0.5) return "🚶 ماشي الحال";
    if (total > 4 && index < total * 0.75) return "😴 نايم في العسل";
    if (index === total - 1 && total > 3) return "💀 في رحمة الله";
    return "🐌 سلحفاة";
  };

  /** Medal/position indicator */
  const getMedal = (index) => {
    if (index === 0) return <span className="leaderboard__medal leaderboard__medal--gold">🥇</span>;
    if (index === 1) return <span className="leaderboard__medal leaderboard__medal--silver">🥈</span>;
    if (index === 2) return <span className="leaderboard__medal leaderboard__medal--bronze">🥉</span>;
    return <span className="leaderboard__position">{index + 1}</span>;
  };

  /** Easter egg: confetti on clicking #1 */
  const handleFirstClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  /** Random roast on hover */
  const handleRowHover = (idx) => {
    setHoveredRow(idx);
    setRoastText(HOVER_ROASTS[Math.floor(Math.random() * HOVER_ROASTS.length)]);
  };

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="leaderboard" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--color-warning)", flexDirection: "column", gap: "1rem" }}>
        <Trophy size={64} style={{ animation: "pulse 1s infinite alternate" }} />
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, animation: "pulse 1s infinite alternate" }}>
          جاري تحميل الليدربورد...
        </h1>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────
  if (error) {
    return (
      <div className="leaderboard" style={{ padding: "2rem", direction: "rtl", fontFamily: "var(--font)" }}>
        <Card>
          <p style={{ fontSize: "2rem", color: "var(--color-danger)", fontWeight: 900 }}>❌ {error}</p>
          <button className="btn btn--primary" onClick={() => window.location.reload()} style={{ marginTop: "1rem" }}>
            حاول تاني
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="leaderboard" style={{ direction: "rtl", fontFamily: "var(--font)", minHeight: "100vh" }}>
      <ChaosEngine />

      {/* ─── Header ──────────────────────────────────────── */}
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <Trophy size={24} />
          <span className="dashboard__brand-text">لوحة المتصدرين</span>
        </div>
        <nav className="dashboard__nav" style={{ display: "flex", gap: "1rem" }}>
          {user ? (
            <button className="btn btn--warning" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} /> الميدان
            </button>
          ) : (
            <button className="btn btn--warning" onClick={() => navigate("/login")}>
              <LogIn size={16} /> دخول
            </button>
          )}
        </nav>
      </header>

      <main style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>

        {/* ─── Hero Banner ─────────────────────────────────── */}
        <Card style={{
          background: "var(--color-dark)",
          color: "#fff",
          textAlign: "center",
          padding: "3rem 2rem",
          transform: "rotate(-0.8deg)",
          marginBottom: "2rem",
          border: "6px solid var(--color-warning)",
          boxShadow: "12px 12px 0px var(--color-accent)"
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🏆</div>
          <h1 style={{
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            fontWeight: 900,
            color: "var(--color-warning)",
            textShadow: "3px 3px 0px rgba(0,0,0,0.5)",
            marginBottom: "1rem"
          }}>
            لوحة المتصدرين
          </h1>
          <p style={{
            fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
            fontWeight: 900,
            color: "#fff",
            borderTop: "3px solid var(--color-warning)",
            borderBottom: "3px solid var(--color-warning)",
            padding: "1rem 0",
            margin: "1rem auto",
            maxWidth: "600px",
            fontStyle: "italic"
          }}>
            « قليل متصل خير من كثير منقطع »
          </p>
          <p style={{ fontSize: "1.1rem", color: "var(--color-warning)", opacity: 0.85 }}>
            شوف مين أكتر واحد ثابت على المذاكرة ومين محتاج نفضة
          </p>
        </Card>

        {/* ─── Sort Tabs ──────────────────────────────────── */}
        <div style={{
          display: "flex", gap: "0.5rem", marginBottom: "2rem",
          flexWrap: "wrap", justifyContent: "center"
        }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`btn ${sortBy === opt.key ? "btn--primary" : ""}`}
              onClick={() => setSortBy(opt.key)}
              style={{
                fontSize: "1.05rem",
                ...(sortBy !== opt.key ? { background: "#fff" } : {})
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ─── Leaderboard Table ──────────────────────────── */}
        {sorted.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🦗</div>
            <h2 style={{ fontSize: "2rem", color: "var(--color-danger)" }}>مفيش حد لسه!</h2>
            <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>اللي هيسجل الأول هيبقى ملك الليدربورد</p>
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden", border: "6px solid var(--color-dark)" }}>
            <div className="table-wrapper" style={{ border: "none" }}>
              <table className="data-table leaderboard__table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "center", width: "65px" }}>#</th>
                    <th>الاسم</th>
                    <th
                      className={`leaderboard__th-sort ${sortBy === "currentStreak" ? "leaderboard__th-sort--active" : ""}`}
                      onClick={() => setSortBy("currentStreak")}
                    >
                      🔥 الحالي
                    </th>
                    <th
                      className={`leaderboard__th-sort ${sortBy === "bestStreak" ? "leaderboard__th-sort--active" : ""}`}
                      onClick={() => setSortBy("bestStreak")}
                    >
                      ⭐ الأعلى
                    </th>
                    <th
                      className={`leaderboard__th-sort ${sortBy === "totalHours" ? "leaderboard__th-sort--active" : ""}`}
                      onClick={() => setSortBy("totalHours")}
                    >
                      ⏰ الساعات
                    </th>
                    <th>اللقب</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((person, idx) => {
                    const isMe = user && user.username === person.username;
                    const isFirst = idx === 0;
                    const isLast = idx === sorted.length - 1 && sorted.length > 3;
                    const isGhost = person.totalHours === 0;
                    const isHovered = hoveredRow === idx;

                    let rowBg = "transparent";
                    if (isFirst) rowBg = "rgba(255, 204, 0, 0.18)";
                    else if (idx === 1) rowBg = "rgba(192, 192, 192, 0.12)";
                    else if (idx === 2) rowBg = "rgba(205, 127, 50, 0.12)";
                    if (isMe) rowBg = "rgba(98, 0, 234, 0.12)";

                    return (
                      <tr
                        key={person.username}
                        className={`leaderboard__row ${isMe ? "leaderboard__row--me" : ""} ${isFirst ? "leaderboard__row--first" : ""}`}
                        style={{ background: rowBg, cursor: isFirst ? "pointer" : "default", position: "relative" }}
                        onClick={isFirst ? handleFirstClick : undefined}
                        onMouseEnter={() => handleRowHover(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ textAlign: "center" }}>
                          {getMedal(idx)}
                        </td>
                        <td style={{
                          fontWeight: 900,
                          fontSize: isFirst ? "1.35rem" : "1.15rem",
                          textDecoration: isGhost ? "line-through" : "none",
                          opacity: isGhost ? 0.5 : 1,
                        }}>
                          {person.displayName || person.username}
                          {isMe && (
                            <span className="leaderboard__me-badge">أنت 👈</span>
                          )}
                          {isGhost && (
                            <span className="leaderboard__ghost-badge">شبح</span>
                          )}
                          {/* Hover roast tooltip */}
                          {isHovered && (
                            <div className="leaderboard__roast-tooltip">
                              {roastText}
                            </div>
                          )}
                        </td>
                        <td style={{
                          textAlign: "center", fontSize: "1.3rem", fontWeight: 900,
                          color: person.currentStreak > 0 ? "var(--color-danger)" : "#bbb"
                        }}>
                          {person.currentStreak} {person.currentStreak > 0 ? "🔥" : ""}
                        </td>
                        <td style={{
                          textAlign: "center", fontSize: "1.3rem", fontWeight: 900,
                          color: person.bestStreak > 0 ? "var(--color-accent)" : "#bbb"
                        }}>
                          {person.bestStreak} {person.bestStreak > 0 ? "⭐" : ""}
                        </td>
                        <td style={{
                          textAlign: "center", fontSize: "1.3rem", fontWeight: 900,
                          color: person.totalHours > 0 ? "var(--color-dark)" : "#bbb"
                        }}>
                          {person.totalHours}
                        </td>
                        <td style={{ fontWeight: 900, fontSize: "1.05rem" }}>
                          {getRankTitle(idx, sorted.length)}
                          {isLast && (
                            <div className="leaderboard__last-roast">
                              مبروك عليك المركز الأخير 🎉
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ─── User Position Card (if logged in) ──────────── */}
        {user && sorted.length > 0 && (() => {
          const myIdx = sorted.findIndex(p => p.username === user.username);
          if (myIdx === -1) return null;
          return (
            <Card style={{
              textAlign: "center",
              marginTop: "1.5rem",
              background: "var(--color-accent)",
              color: "#fff",
              transform: "rotate(-0.5deg)",
              border: "4px solid var(--color-dark)"
            }}>
              <p style={{ fontSize: "1.4rem", fontWeight: 900 }}>
                🎯 ترتيبك: #{myIdx + 1} من {sorted.length} — {getRankTitle(myIdx, sorted.length)}
              </p>
              {myIdx === 0 && <p style={{ fontSize: "1.1rem", marginTop: "0.5rem" }}>عاش يا معلم! فضل كدا 💪</p>}
              {myIdx === sorted.length - 1 && sorted.length > 3 && (
                <p style={{ fontSize: "1.1rem", marginTop: "0.5rem" }}>يلا بينا نطلع من هنا 🏃</p>
              )}
            </Card>
          );
        })()}

        {/* ─── Bottom Quote (cycles) ──────────────────────── */}
        <Card style={{
          textAlign: "center",
          marginTop: "2rem",
          background: "var(--color-warning)",
          transform: "rotate(0.8deg)",
        }}>
          <p className="leaderboard__bottom-quote">
            « {bottomQuote} »
          </p>
        </Card>

        {/* ─── Stats Summary ──────────────────────────────── */}
        {sorted.length > 0 && (
          <div className="leaderboard__stats">
            <Card style={{ flex: "1 1 200px", textAlign: "center", transform: "rotate(-1deg)" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--color-danger)" }}>
                {Math.max(...sorted.map(p => p.currentStreak))}
              </div>
              <div style={{ fontWeight: 900, fontSize: "1rem" }}>🔥 أعلى ستريك حالي</div>
            </Card>
            <Card style={{ flex: "1 1 200px", textAlign: "center", transform: "rotate(1deg)" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--color-accent)" }}>
                {Math.max(...sorted.map(p => p.bestStreak))}
              </div>
              <div style={{ fontWeight: 900, fontSize: "1rem" }}>⭐ أعلى ستريك في التاريخ</div>
            </Card>
            <Card style={{ flex: "1 1 200px", textAlign: "center", transform: "rotate(-0.5deg)" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--color-success)" }}>
                {sorted.reduce((s, p) => s + p.totalHours, 0).toFixed(1)}
              </div>
              <div style={{ fontWeight: 900, fontSize: "1rem" }}>⏰ إجمالي ساعات الجميع</div>
            </Card>
          </div>
        )}
      </main>

      {/* ─── Confetti easter egg (clicking #1) ────────────── */}
      {showConfetti && (
        <div className="confetti-overlay">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${8 + Math.random() * 14}px`,
                height: `${8 + Math.random() * 14}px`,
                background: ["#ff2a2a", "#ffcc00", "#00d26a", "#6200ea", "#ff6b6b", "#00bcd4", "#ff9800"][
                  Math.floor(Math.random() * 7)
                ],
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
            />
          ))}
          <h1 className="confetti-text">🏆 يا معلم! 🏆</h1>
        </div>
      )}

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="dashboard__footer" style={{ textAlign: "center", padding: "2rem", fontWeight: "bold" }}>
        <span style={{ opacity: 0.5 }}>El-Dawly Daily Reports — لأن الاستمرارية أهم من الكمية</span>
      </footer>
    </div>
  );
}
