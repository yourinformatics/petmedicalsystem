const API_BASE = "http://127.0.0.1:8000/api/";

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE}login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Sikertelen bejelentkezés.");
  }

  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);

  return data;
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");

  if (!refresh) {
    throw new Error("Nincs refresh token.");
  }

  const response = await fetch(`${API_BASE}token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await response.json();

  if (!response.ok) {
    clearTokens();
    throw new Error("Lejárt munkamenet.");
  }

  localStorage.setItem("accessToken", data.access);
  return data.access;
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export async function logout() {
  const access = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");

  try {
    if (access && refresh) {
      await fetch(`${API_BASE}logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh }),
      });
    }
  } finally {
    clearTokens();
  }
}

/*  Regisztrációs függvény */

export async function register(registrationData) {
  const response = await fetch(`${API_BASE}register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registrationData),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = Object.values(data)
      .flat()
      .join(" ");

    throw new Error(errorMessage || "Sikertelen regisztráció.");
  }

  return data;
}