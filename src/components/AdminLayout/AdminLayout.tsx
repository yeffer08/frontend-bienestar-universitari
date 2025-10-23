// src/pages/admin/AdminLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useState } from "react";
import "./AdminLayout.css";
import universityLogoDark from "../../assets/logo-universidad.png";
import universityLogoLight from "../../assets/logo-universidad2.png";
import ModalDescargaReportes from "../ModalReporte/ModalReporte";

export default function AdminLayout() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre");

  // 1) Tema inicial: respeta lo que dejó Login (body[data-theme]) o localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const fromAttr = (document.body.getAttribute("data-theme") as "light" | "dark" | null);
    const fromLS = (localStorage.getItem("theme") as "light" | "dark" | null);
    return fromAttr || fromLS || "dark";
  });

  // 2) Evita FOUC: aplica el atributo antes del primer paint
  useLayoutEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // 3) Mantén sincronizado localStorage (sin sobreescribir si ya coincide)
  useEffect(() => {
    const current = localStorage.getItem("theme");
    if (current !== theme) localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  const logoSrc = theme === "dark" ? universityLogoDark : universityLogoLight;

  // 4) Logout que preserva el tema (NO usar localStorage.clear())
  const handleLogout = () => {
    const keepTheme = localStorage.getItem("theme"); // preservar
    // borra SOLO lo que corresponde a auth/usuario:
    localStorage.removeItem("access_token");
    localStorage.removeItem("nombre");
    localStorage.removeItem("rol");
    // ... cualquier otra clave específica de tu app
    if (keepTheme) localStorage.setItem("theme", keepTheme);
    navigate("/");
  };

  const [openReportes, setOpenReportes] = useState(false);

  return (
    <div className="admin-fullscreen">
      <div className="admin-container">
        {/* Encabezado */}
        <div className="admin-header">
          <div className="admin-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logoSrc} alt="Logo Universidad" className="logo-small" />
            <div>
              <h1>Panel de Administración</h1>
              <p className="admin-welcome">
                Bienvenido, <b>{nombre}</b>
              </p>
            </div>
          </div>

          <div className="admin-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Cambiar tema">
              {theme === "dark" ? "🌞" : "🌙"}
            </button>

            <nav className="admin-menu">
              <Link to="/admin"><button aria-label="Ver respuestas">📋 Respuestas</button></Link>
              <Link to="/admin/solicitudes"><button aria-label="Ver solicitudes de estudiantes">📨 Solicitudes</button></Link>
              <Link to="/admin/create-formulario"><button aria-label="Crear formulario">📝 Formulario</button></Link>
              <Link to="/admin/psicologos"><button aria-label="Gestión de psicólogos">👥 Psicólogos</button></Link>
              <button onClick={() => setOpenReportes(true)}>
              📊 Reportes
              </button>
              <button onClick={handleLogout} className="logout-btn" aria-label="Cerrar sesión">🔒 Cerrar Sesión</button>
            </nav>
          </div>
        </div>

        {/* Sub-vistas */}
        <Outlet />

        <ModalDescargaReportes
          isOpen={openReportes}
          onClose={() => setOpenReportes(false)}
        />
      </div>
    </div>
  );
}
