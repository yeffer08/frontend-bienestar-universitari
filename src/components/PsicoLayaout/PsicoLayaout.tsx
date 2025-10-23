import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./PsicoLayaout.css";
import universityLogoDark from "../../assets/logo-universidad.png";
import universityLogoLight from "../../assets/logo-universidad2.png";
// Update the import path below if the file is in a different folder or has a different name/extension
import ModalDescargaReportes from "../ModalReporte/ModalReporte";

export default function PsychologistLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nombre = localStorage.getItem("nombre") || "Psicólogo/a";

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [openReportes, setOpenReportes] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const logoSrc = theme === "dark" ? universityLogoDark : universityLogoLight;

  return (
    <div className="psy-fullscreen">
      <div className="psy-container">
        <header className="psy-header">
          <div className="psy-brand">
            <img src={logoSrc} alt="Logo Universidad" className="logo-small" />
            <div>
              <h1>Panel de Psicología</h1>
              <p className="psy-welcome">
                Bienvenido, <b>{nombre}</b>
              </p>
            </div>
          </div>

          <nav className="psy-menu">
            <Link
              to="/psicologo"
              className={pathname === "/psicologo" ? "active" : ""}
            >
              <button>👨‍🎓 Estudiantes</button>
            </Link>

            <Link
              to="/psicologo/solicitudes"
              className={pathname.includes("/psicologo/solicitudes") ? "active" : ""}
            >
              <button>📨 Mis Solicitudes</button>
            </Link>

            <Link
              to="/psicologo/registrar-estudiante"
              className={pathname.includes("/psicologo/registrar-estudiante") ? "active" : ""}
            >
              <button>➕ Registrar</button>
            </Link>

            <button onClick={() => setOpenReportes(true)}>
              📊 Reportes
            </button>

            <button onClick={toggleTheme} className="theme-toggle">
              {theme === "dark" ? "🌞" : "🌙"}
            </button>

            <button onClick={handleLogout} className="logout-btn">
              🔒 Cerrar Sesión
            </button>
          </nav>
        </header>

        <main className="psy-main">
          <Outlet />
        </main>

        <ModalDescargaReportes
          isOpen={openReportes}
          onClose={() => setOpenReportes(false)}
        />
      </div>
    </div>
  );
}