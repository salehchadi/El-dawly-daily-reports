import { useState } from "react";
import { ListTodo, Plus, Flag } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Toast from "./ui/Toast";

export default function Deadlines({ deadlines, onUpdate }) {
  const { user } = useAuth();
  const [taskName, setTaskName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!taskName.trim() || !targetDate) return;
    
    setAdding(true);
    try {
      await apiRequest("addDeadline", {
        username: user.username,
        task_name: taskName,
        target_date: targetDate
      });
      setTaskName("");
      setTargetDate("");
      setToast({ message: "تم إضافة الديدلاين بنجاح", type: "success" });
      if (onUpdate) onUpdate();
    } catch (err) {
      setToast({ message: err.message || "فشل إضافة الديدلاين", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await apiRequest("updateDeadline", {
        id,
        username: user.username,
        newStatus
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to update deadline status:", err);
    }
  };

  return (
    <div className="deadlines" style={{ direction: "rtl", fontFamily: "var(--font)" }}>
      <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.5rem" }}>
        <ListTodo size={24} /> ديدلاينز الموت
      </h3>
      
      <form onSubmit={handleAdd} className="deadlines__form" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <Input 
          id="task_name"
          label="اسم التاسك"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="مثال: أخلص كورس الريأكت"
          style={{ flex: "1 1 200px" }}
        />
        <Input 
          id="target_date"
          label="يوم التسليم"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          style={{ flex: "1 1 150px" }}
        />
        <Button type="submit" loading={adding} disabled={!taskName.trim() || !targetDate} style={{ flex: "1 1 auto" }}>
          <Plus size={16} /> ضيف الديدلاين
        </Button>
      </form>

      {!deadlines || deadlines.length === 0 ? (
        <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontWeight: "bold", fontSize: "1.2rem", background: "#f0f0f0", border: "3px solid #000" }}>
          مفيش أي ديدلاينز... ناوي ترتاح ولا إيه؟
        </div>
      ) : (
        <ul className="deadlines__list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {deadlines.map((d) => (
            <li key={d.id} className="deadlines__item" style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              padding: "1rem",
              background: d.status === "Completed" ? "var(--color-success)" : d.status === "Canceled" ? "var(--color-secondary)" : "#fff",
              border: "4px solid #000",
              boxShadow: "2px 2px 0px #000",
              opacity: d.status === "Canceled" ? 0.7 : 1
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                <Flag size={20} color={d.status === "Pending" ? "var(--color-danger)" : "#000"} />
                <span style={{ 
                  textDecoration: (d.status === "Completed" || d.status === "Canceled") ? "line-through" : "none",
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  color: "#000"
                }}>
                  {d.task_name}
                </span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "1rem", fontWeight: "bold", background: "#000", color: "#fff", padding: "0.2rem 0.5rem" }}>
                  {typeof d.target_date === "string" ? d.target_date.split("T")[0] : new Date(d.target_date).toISOString().split("T")[0]}
                </span>
                
                <select 
                  value={d.status}
                  onChange={(e) => changeStatus(d.id, e.target.value)}
                  style={{
                    padding: "0.5rem",
                    border: "3px solid #000",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    cursor: "pointer",
                    background: "#fff"
                  }}
                >
                  <option value="Pending">قيد التنفيذ</option>
                  <option value="Completed">خلصان</option>
                  <option value="Canceled">اتلغى</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
