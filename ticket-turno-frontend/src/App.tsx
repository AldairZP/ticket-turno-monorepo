import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAdminAuth } from "./components/RequireAdminAuth";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthLayout } from "./layouts/AdminAuthLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { CatalogCrudPage } from "./pages/CatalogCrudPage";
import { GenerateTicketPage } from "./pages/GenerateTicketPage";
import { TicketLookupPage } from "./pages/TicketLookupPage";
import { TicketUpdatePage } from "./pages/TicketUpdatePage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Navigate to="/tickets/generar" replace />} />
            <Route path="/tickets/generar" element={<GenerateTicketPage />} />
            <Route path="/tickets/consultar" element={<TicketLookupPage />} />
            <Route path="/tickets/actualizar" element={<TicketUpdatePage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAdminAuth>
                <AdminAuthLayout />
              </RequireAdminAuth>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="catalogos" element={<CatalogCrudPage />} />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/tickets/generar" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
