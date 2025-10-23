import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { login as apiLogin } from "../../services/api";
import "./Login.css";

// Importamos ambos logos
import darkLogo from "../../assets/logo-universidad.png";
import lightLogo from "../../assets/logo-universidad2.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  // Recuperar tema guardado
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  // Aplicar tema al body
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await apiLogin(email, password);
      authLogin(data.access_token);

      const rol = data.rol;
      if (rol === "admin") navigate("/admin");
      else if (rol === "psicologo") navigate("/psicologo");
      else navigate("/");
    } catch (err: any) {
      setError(
        err?.response?.data?.msg || "Error al iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cambiar logo según el tema
  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  return (
    <section className="login-fullscreen">
      <div className="login-center-container">
        <div className="login-card">
          {/* Botón de cambio de tema */}
          <div className="theme-toggle-container">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
            >
              {theme === "dark" ? "🌞" : "🌙"}
            </button>
          </div>

          {/* Logo dinámico */}
          <div className="logo-container">
            <img
              src={currentLogo}
              alt="Logo Universidad"
              className="university-logo"
            />
          </div>

          <h2>INICIAR SESIÓN</h2>
          <div className="login-divider"></div>

          {error && <div className="error-message-login">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group-login">
              <label>CORREO ELECTRÓNICO</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </div>

            <div className="form-group-login">
              <label>CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "INGRESANDO..." : "INGRESAR"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
