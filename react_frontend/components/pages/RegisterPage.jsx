import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  login,
  register
} from "../services/auth.js";
import "../../styles/RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    password_confirm: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.password_confirm) {
      setError("A két jelszó nem egyezik.");
      return;
    }

    setSubmitting(true);

    try {
      await register(formData);

      // Sikeres regisztráció után automatikus belépés
      await login(formData.username.trim(), formData.password);

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="registerPage">
      <form className="registerForm" onSubmit={handleSubmit}>
        <h1>Regisztráció</h1>

        <label htmlFor="name">Teljes név</label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          required
        />

        <label htmlFor="username">Felhasználónév</label>
        <input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />

        <label htmlFor="email">E-mail-cím</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <label htmlFor="phone">Telefonszám</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          autoComplete="tel"
          required
        />

        <label htmlFor="password">Jelszó</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <label htmlFor="password_confirm">
          Jelszó ismétlése
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          value={formData.password_confirm}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="registerError" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Regisztráció..." : "Regisztráció"}
        </button>

        <p>
          Már van fiókod? <Link to="/login">Bejelentkezés</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
