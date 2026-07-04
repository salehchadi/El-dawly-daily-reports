import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import SHA256 from "crypto-js/sha256";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import { ArrowLeft, Users, Clock, Shield, BookOpen, MessageCircle, Key, Check, Search } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Date filter for Red/Green overview
  const [overviewDate, setOverviewDate] = useState(new Date().toISOString().split("T")[0]);
  const [overviewFilter, setOverviewFilter] = useState("all"); // "all", "green", "red"

  // User Management filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "approved"

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      const result = await apiRequest("getAdminData", {
        adminUsername: user?.username,
      });
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const safeFormatDate = (val) => {
    try {
      if (!val) return "—";
      if (typeof val === "string") return val.split("T")[0];
      return new Date(val).toISOString().split("T")[0];
    } catch { return "—"; }
  };

  useEffect(() => {
    if (user?.username) {
      fetchAdmin();
    }
  }, [user?.username]);

  const handleAction = async (targetUsername, action) => {
    if (action === "delete" && !window.confirm(`هل أنت متأكد من حذف ${targetUsername} نهائياً؟`)) return;

    try {
      await apiRequest(action + "User", { adminUsername: user.username, targetUsername });
      const msgs = {
        approve: `تم تفعيل ${targetUsername}`,
        suspend: `تم إيقاف ${targetUsername}`,
        delete: `تم حذف ${targetUsername}`
      };
      setToast({ message: msgs[action], type: "success" });
      fetchAdmin();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleResetPassword = async (targetUsername) => {
    const newPassword = prompt(`اكتب الباسورد الجديد لـ ${targetUsername}:`);
    if (!newPassword) return;
    
    try {
      const newPasswordHash = SHA256(newPassword).toString();
      await apiRequest("resetPassword", { adminUsername: user.username, targetUsername, newPasswordHash });
      setToast({ message: `تم تغيير باسورد ${targetUsername}`, type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="admin-page" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--color-warning)" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "900", animation: "pulse 1s infinite alternate" }}>جاري التحميل...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page" style={{ padding: "2rem" }}>
        <Card>
          <p style={{ fontSize: "2rem", color: "var(--color-danger)", fontWeight: "900" }}>❌ {error}</p>
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            ارجع للوحة التحكم
          </Button>
        </Card>
      </div>
    );
  }

  const allUsers = data?.allUsers || [];
  const allReports = data?.allReports || [];

  const pendingUsers = allUsers.filter(u => u[4] === "pending");
  const approvedUsers = allUsers.filter(u => u[4] !== "pending");
  const totalHours = allReports.reduce((s, r) => s + Number(r[4] || 0), 0);

  // Filter User Management
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = String(u[0] || "").toLowerCase().includes(searchQuery.toLowerCase()) || String(u[2] || "").includes(searchQuery);
    const matchesStatus = statusFilter === "all" ? true : u[4] === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Red/Green status for the overview date
  const getLocalString = (dVal) => {
    const d = new Date(dVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const overviewData = approvedUsers.map(u => {
    const username = u[0];
    const whatsapp = u[2];
    const joinDate = new Date(u[3]);
    const targetDate = new Date(overviewDate);
    
    const report = allReports.find(r => r[1] === username && getLocalString(r[2]) === overviewDate);
    
    let status = "gray";
    if (report && Number(report[4]) > 0) {
      status = "green";
    } else if (report && Number(report[4]) === 0) {
      status = "red"; // Excuse
    } else if (getLocalString(targetDate) >= getLocalString(joinDate) && getLocalString(targetDate) <= getLocalString(new Date())) {
      status = "red"; // Missed
    }

    return { username, whatsapp, status, report };
  }).filter(u => {
    if (overviewFilter === "green") return u.status === "green";
    if (overviewFilter === "red") return u.status === "red";
    return true;
  });

  return (
    <div className="admin-page" style={{ direction: "rtl", fontFamily: "var(--font)" }}>
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <BookOpen size={24} />
          <span className="dashboard__brand-text">الإدارة العليا</span>
        </div>
        <nav className="dashboard__nav">
          <button className="btn btn--warning" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} /> رجوع للميدان
          </button>
        </nav>
      </header>

      <main className="dashboard__main" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        
        <section style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <Card style={{ flex: "1 1 300px", textAlign: "center", background: "var(--color-dark)", color: "#fff" }}>
            <Users size={32} style={{ color: "var(--color-warning)", marginBottom: "0.5rem" }} />
            <div style={{ fontSize: "3rem", fontWeight: "900", lineHeight: 1 }}>{allUsers.length}</div>
            <div style={{ fontSize: "1.2rem", color: "var(--color-warning)" }}>إجمالي الرجالة</div>
          </Card>
          <Card style={{ flex: "1 1 300px", textAlign: "center", background: "var(--color-accent)", color: "#fff" }}>
            <Clock size={32} style={{ color: "var(--color-warning)", marginBottom: "0.5rem" }} />
            <div style={{ fontSize: "3rem", fontWeight: "900", lineHeight: 1 }}>{totalHours.toFixed(1)}</div>
            <div style={{ fontSize: "1.2rem", color: "var(--color-warning)" }}>إجمالي ساعات الكفاح</div>
          </Card>
        </section>

        {/* Approvals Section */}
        {pendingUsers.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <Card style={{ border: "4px solid var(--color-warning)" }}>
              <h3 className="section-title" style={{ background: "var(--color-warning)", color: "var(--color-dark)" }}>⚠️ منتظرين التفعيل</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>رقم الواتس</th>
                      <th>تاريخ الانضمام</th>
                      <th>أكشن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 900 }}>{u[0]}</td>
                        <td style={{ direction: "ltr", textAlign: "right" }}>{u[2]}</td>
                        <td>{safeFormatDate(u[3])}</td>
                        <td>
                          <Button variant="primary" onClick={() => handleAction(u[0], "approve")}>
                            <Check size={16} /> فّعل البطل
                          </Button>
                          <Button variant="danger" onClick={() => handleAction(u[0], "delete")} style={{ marginRight: "0.5rem" }}>
                            حذف
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        {/* Daily Red/Green Overview */}
        <section style={{ marginBottom: "2rem" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h3 className="section-title" style={{ margin: 0 }}>📅 كشف الغياب اليومي</h3>
              
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <Input 
                  id="overview_date"
                  type="date"
                  value={overviewDate}
                  onChange={(e) => setOverviewDate(e.target.value)}
                  style={{ margin: 0 }}
                />
                <select 
                  style={{ padding: "0.8rem", border: "4px solid #000", fontSize: "1.1rem", fontWeight: "900", cursor: "pointer", background: "var(--color-warning)" }}
                  value={overviewFilter}
                  onChange={(e) => setOverviewFilter(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="green">🟢 الرجالة بس</option>
                  <option value="red">🔴 المتخاذلين بس</option>
                </select>
              </div>
            </div>
            
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الحالة</th>
                    <th>الاسم</th>
                    <th>التقرير</th>
                    <th>أكشن</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewData.map((u, i) => (
                    <tr key={i} style={{ 
                      background: u.status === "green" ? "rgba(34, 197, 94, 0.2)" : u.status === "red" ? "rgba(239, 68, 68, 0.2)" : "transparent" 
                    }}>
                      <td style={{ fontSize: "1.5rem" }}>
                        {u.status === "green" ? "🟢" : u.status === "red" ? "🔴" : "⚪"}
                      </td>
                      <td style={{ fontWeight: 900, fontSize: "1.2rem" }}>{u.username}</td>
                      <td>
                        {u.report ? (
                          <div style={{ fontWeight: "bold" }}>{u.report[4]} ساعات - {u.report[3]}</div>
                        ) : "مفيش تقرير"}
                      </td>
                      <td>
                        <a href={`https://wa.me/${String(u.whatsapp || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{ padding: "0.5rem 1rem", textDecoration: "none" }}>
                          <MessageCircle size={16} /> {u.status === "green" ? "شجعه ع الواتس" : "هزأه ع الواتس"}
                        </a>
                      </td>
                    </tr>
                  ))}
                  {overviewData.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "2rem", fontWeight: "bold" }}>مفيش حد مطابق للبحث</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* All Users Management */}
        <section>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h3 className="section-title" style={{ margin: 0 }}>👥 إدارة جميع الرجالة</h3>
              
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", background: "#f0f0f0", padding: "0.5rem", border: "4px solid #000" }}>
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم أو الرقم..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: "1.1rem", fontWeight: "bold", width: "200px" }}
                />
                <select 
                  style={{ border: "none", borderRight: "3px solid #000", paddingRight: "0.5rem", background: "transparent", outline: "none", fontSize: "1.1rem", fontWeight: "bold" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="approved">مُفعل</option>
                  <option value="pending">في الانتظار</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الواتس</th>
                    <th>الحالة</th>
                    <th>أكشن</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 900 }}>{u[0]}</td>
                      <td style={{ direction: "ltr", textAlign: "right" }}>{u[2]}</td>
                      <td>
                        <span style={{ 
                          background: u[4] === "approved" ? "var(--color-success)" : u[4] === "suspended" ? "var(--color-danger)" : "var(--color-warning)",
                          padding: "0.2rem 0.5rem",
                          border: "2px solid #000",
                          fontWeight: "bold",
                          color: u[4] === "suspended" ? "#fff" : "#000"
                        }}>
                          {u[4] === "approved" ? "مُفعل" : u[4] === "suspended" ? "موقوف" : "منتظر"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        <select 
                          onChange={(e) => {
                            if(e.target.value) {
                              handleAction(u[0], e.target.value);
                              e.target.value = "";
                            }
                          }}
                          style={{ padding: "0.5rem", border: "3px solid #000", fontWeight: "bold" }}
                        >
                          <option value="">أكشن...</option>
                          {u[4] !== "approved" && <option value="approve">تفعيل</option>}
                          {u[4] !== "suspended" && <option value="suspend">إيقاف</option>}
                          <option value="delete">حذف نهائي</option>
                        </select>
                        <Button variant="ghost" onClick={() => handleResetPassword(u[0])}>
                          <Key size={16} /> باسورد
                        </Button>
                        <a href={`https://wa.me/${String(u[2] || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{ padding: "0.5rem 1rem", textDecoration: "none" }}>
                          <MessageCircle size={16} /> رسالة
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "2rem", fontWeight: "bold" }}>مفيش حد مطابق للبحث</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
