import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  Link,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getAccessToken, logout } from "../components/services/auth.js";
import { getCurrentUser } from "../api/api.js";
import LoginPage from "../components/pages/LoginPage.jsx";
import HomePage from '../components/pages/HomePage.jsx'
import PetsPage from '../components/pages/PetsPage.jsx'
import '../styles/Menu.css'
import AppointmentsPage from '../components/pages/AppointmentsPage.jsx'
import NewAppointmentPage from '../components/pages/NewAppointment.jsx'
import RegisterPage from "../components/pages/RegisterPage.jsx";
import VaccinationsPage from "../components/pages/VaccinationsPage.jsx";
import MedicalRecordsPage from "../components/pages/MedicalRecordsPage.jsx";
import PrescriptionsPage from "../components/pages/PrescriptionsPage.jsx";
import AdminHealthPage from "../components/pages/AdminHealthPage.jsx";

function ProtectedRoute() {
  const accessToken = getAccessToken();

  return accessToken
    ? <Outlet />
    : <Navigate to="/login" replace />;
}

function AppMain() {

  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getAccessToken());
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  async function handleLogout() {
    await logout();
    setCurrentUser(null);
    closeMenu();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isActive = true;

    getCurrentUser()
      .then((user) => {
        if (isActive) setCurrentUser(user);
      })
      .catch(() => {
        if (isActive) setCurrentUser(null);
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {isAuthenticated && !isAuthPage && (
  <header className="siteHeader">
        <nav className="siteNav" aria-label="Fő navigáció">
          <Link className="menuLogo" to="/" onClick={closeMenu} aria-label="Klinika kezdőlap">
            <span className="menuLogoMark" aria-hidden="true">K</span>
            <span className="menuLogoText">Klinika</span>
          </Link>

          <button
            className={`menuToggle${menuOpen ? ' isOpen' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
            aria-expanded={menuOpen}
            aria-controls="primaryNavigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <div
            className={`menuLinks${menuOpen ? ' isOpen' : ''}`}
            id="primaryNavigation"
          >
            <NavLink
              className={({ isActive }) => `menuLink${isActive ? ' isActive' : ''}`}
              to="/"
              onClick={closeMenu}
            >
              Kezdőlap
            </NavLink>

            <NavLink
              className={({ isActive }) => `menuLink${isActive ? ' isActive' : ""}`}
              to="/appointments/new"
              onClick={closeMenu}
            >
              Időpont foglalás
            </NavLink>

            <NavLink
              className={({ isActive }) => `menuLink${isActive ? ' isActive' : ''}`}
              to="/pets"
              onClick={closeMenu}
            >
              Állataim
            </NavLink>

            <NavLink
              to="/appointments"
              end
              className={({ isActive }) =>
                `menuLink${isActive ? " isActive" : ""}`
              }
              onClick={closeMenu}
            >
              Foglalások
            </NavLink>

            <NavLink
              className={({ isActive }) => `menuLink${isActive ? ' isActive' : ''}`}
              to="/vaccinations"
              onClick={closeMenu}
            >
              Oltások
            </NavLink>

            <NavLink
              className={({ isActive }) => `menuLink${isActive ? ' isActive' : ''}`}
              to="/medical-records"
              onClick={closeMenu}
            >
              Kezelések
            </NavLink>

            <NavLink
              className={({ isActive }) => `menuLink${isActive ? ' isActive' : ''}`}
              to="/prescriptions"
              onClick={closeMenu}
            >
              Gyógyszerek
            </NavLink>

            {currentUser?.is_staff && (
              <NavLink
                className={({ isActive }) => `menuLink${isActive ? ' isActive' : ''}`}
                to="/admin/health"
                onClick={closeMenu}
              >
                Admin
              </NavLink>
            )}

            <button
              type="button"
              className="menuLink menuLogout"
              onClick={handleLogout}
            >
              Kijelentkezés
            </button>
            
          </div>
        </nav>
        </header>
)}

      <main>
        <Routes>
        {/* Nyilvános oldal */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Bejelentkezéshez kötött oldalak */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/vaccinations" element={<VaccinationsPage />} />
          <Route path="/medical-records" element={<MedicalRecordsPage />} />
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/admin/health" element={<AdminHealthPage />} />
          <Route
            path="/appointments/new"
            element={<NewAppointmentPage />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={getAccessToken() ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>
      </main>
    </>
  )
}

export default AppMain
