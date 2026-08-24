import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/auth.js";
import "../../styles/LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="loginPage">
      <form className="loginForm" onSubmit={handleSubmit}>
        <h1>Bejelentkezés</h1>

        <label htmlFor="username">Felhasználónév</label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Jelszó</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="loginError" role="alert">
            {error}
          </p>
        )}
          {/* Ha még nincs fiókod kiirás */}
          <p>
            Nincs még fiókod? <Link to="/register">Regisztráció</Link>
          </p>
          {/* -------------------------- */}
        <button type="submit" disabled={submitting}>
          {submitting ? "Bejelentkezés..." : "Belépés"}
        </button>
      </form>
    </section>
  );
}

export default LoginPage;