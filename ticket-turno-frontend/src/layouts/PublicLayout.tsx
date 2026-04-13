import { NavLink, Outlet } from "react-router-dom";

function getMenuLinkClass(isActive: boolean) {
  return isActive ? "menu-link active" : "menu-link";
}

export function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-main">
          <div className="brand-pill" aria-hidden>
            SE
          </div>
          <h1>Sistema Generación Turnos</h1>
          <div className="step-chip" aria-label="Modulo publico">
            PUB
          </div>
        </div>
        <nav className="menu" aria-label="Menu principal">
          <NavLink
            to="/tickets/generar"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Generar
          </NavLink>
          <NavLink
            to="/tickets/consultar"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Consultar
          </NavLink>
          <NavLink
            to="/tickets/actualizar"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Actualizar
          </NavLink>
          <NavLink
            to="/admin/login"
            className={({ isActive }) => getMenuLinkClass(isActive)}
          >
            Admin Login
          </NavLink>
        </nav>
      </header>

      <main className="layout">
        <Outlet />
      </main>
    </div>
  );
}
