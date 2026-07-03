import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import { LogIn, UserPlus, BookOpen } from "lucide-react";

/**
 * Login / Signup page.
 * – Toggle between modes
 * – Hashes password via AuthContext before sending to API
 * – Redirects to /dashboard on success
 */
export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username required";
    if (!password || password.length < 4) e.password = "Min 4 characters";
    if (mode === "signup" && !whatsappNumber.trim()) e.whatsappNumber = "WhatsApp number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password, whatsappNumber);
      }
      navigate("/dashboard");
    } catch (err) {
      if (err.message === "ACCOUNT_PENDING") {
        setToast({ message: "Your account is pending admin approval.", type: "info" });
      } else {
        setToast({ message: err.message || "Something went wrong", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-page__orb login-page__orb--1" />
      <div className="login-page__orb login-page__orb--2" />
      <div className="login-page__orb login-page__orb--3" />

      <div className="login-card">
        <div className="login-card__header">
          <BookOpen size={36} className="login-card__icon" />
          <h1 className="login-card__title">استعن بالله ولا تعجز</h1>
          <p className="login-card__subtitle">El-Dawly Daily Reports</p>
        </div>

        {/* Mode tabs */}
        <div className="login-card__tabs">
          <button
            className={`login-card__tab ${mode === "login" ? "login-card__tab--active" : ""}`}
            onClick={() => { setMode("login"); setErrors({}); }}
          >
            <LogIn size={16} /> Login
          </button>
          <button
            className={`login-card__tab ${mode === "signup" ? "login-card__tab--active" : ""}`}
            onClick={() => { setMode("signup"); setErrors({}); }}
          >
            <UserPlus size={16} /> Sign Up
          </button>
        </div>

        <form className="login-card__form" onSubmit={handleSubmit}>
          <Input
            id="login-username"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
            autoComplete="username"
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {mode === "signup" && (
            <Input
              id="login-whatsapp"
              label="WhatsApp Number (e.g. +2010...)"
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              error={errors.whatsappNumber}
            />
          )}

          <Button type="submit" loading={loading}>
            {mode === "login" ? (
              <><LogIn size={16} /> Login</>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </Button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
