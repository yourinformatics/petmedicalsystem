
import {
  clearTokens,
  getAccessToken,
  refreshAccessToken,
} from "../components/services/auth.js";

const API_BASE = "http://127.0.0.1:8000/api/";
let refreshRequest = null;

async function sendRequest(endpoint, options, accessToken) {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

async function getRefreshedAccessToken() {
  if (!refreshRequest) {
    refreshRequest = refreshAccessToken().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

async function apiRequest(endpoint, options = {}) {
  let response = await sendRequest(endpoint, options, getAccessToken());

  if (response.status === 401) {
    try {
      const newAccessToken = await getRefreshedAccessToken();
      response = await sendRequest(endpoint, options, newAccessToken);
    } catch (error) {
      clearTokens();
      window.location.replace("/login");
      throw error;
    }
  }

  const data = response.status === 204
    ? null
    : await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || JSON.stringify(data));
  }

  return data;
}

export function getPets() {
  return apiRequest("pets/");
}

export function getCurrentUser() {
  return apiRequest("me/");
}

export function createPet(formData) {
  return apiRequest("pets/", {
    method: "POST",
    body: formData,
  });
}

export function removePet(id) {
  return apiRequest(`pets/${id}/`, {
    method: "DELETE",
  });
}

export function getAppointments() {
  return apiRequest("appointments/");
}

export function getOccupiedAppointmentSlots() {
  return apiRequest("appointments/occupied-slots/");
}

export function getOwners() {
  return apiRequest("owners/");
}

export function getVeterinarians() {
  return apiRequest("veterinarians/");
}

export function getPetVaccinations(petId) {
  return apiRequest(`pet-vaccinations/?pet=${encodeURIComponent(petId)}`);
}

export function getMedicalRecords(petId) {
  const filter = petId
    ? `?appointment__pet=${encodeURIComponent(petId)}`
    : "";

  return apiRequest(`medical-records/${filter}`);
}

export function getPrescriptions(petId) {
  return apiRequest(
    `prescriptions/?medical_record__appointment__pet=${encodeURIComponent(petId)}`,
  );
}

export function getVaccines() {
  return apiRequest("vaccines/");
}

export function createMedicalRecord(record) {
  return apiRequest("medical-records/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });
}

export function createPetVaccination(vaccination) {
  return apiRequest("pet-vaccinations/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vaccination),
  });
}

export function createPrescription(prescription) {
  return apiRequest("prescriptions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prescription),
  });
}

export function createVaccine(vaccine) {
  return apiRequest("vaccines/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vaccine),
  });
}

/*Új  Foglalás postja */
export function createAppointment(appointment) {
  return apiRequest("appointments/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(appointment),
  });
}

/* Foglalás státusz módosítás */

export function updateAppointmentStatus(id, status) {
  return apiRequest(`appointments/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}
