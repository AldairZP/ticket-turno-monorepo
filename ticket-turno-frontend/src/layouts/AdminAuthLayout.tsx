import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getMenuLinkClass(isActive: boolean) {
  return isActive ? "menu-link active" : "menu-link";
}

export function AdminAuthLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-main">
          <div className="brand-pill" aria-hidden>
            SE
          </div>
          <h1>Panel Administrativo</h1>
          <div className="step-chip" aria-label="Modulo privado">
            ADM
          </div>
        </div>
        <nav className="menu" aria-label="Menu administrativo">
          <NavLink
            to="/admin/tickets/generar"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Generar
          </NavLink>
          <NavLink
            to="/admin/tickets/consultar"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Consultar
          </NavLink>
          <NavLink
            to="/admin/tickets/actualizar"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Actualizar
          </NavLink>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/catalogos"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Catalogos
          </NavLink>
          <button type="button" className="menu-button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </nav>
      </header>

      <main className="layout">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Acceso privado con JWT y control de sesion activo.</p>
      </footer>
    </div>
  );
}
