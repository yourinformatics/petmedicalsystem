import { useState } from "react";
import { createMedicalRecord } from "../../../api/api.js";

const initialForm = {
  pet: "",
  appointment: "",
  diagnosis: "",
  treatment: "",
};

function formatAppointment(appointment) {
  const date = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(appointment.appointment_date));

  return `${date} - ${appointment.reason}`;
}

function AdminMedicalRecordForm({ pets, appointments, medicalRecords, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Csak a kiválasztott állat még kezelés nélküli foglalásai választhatók.
  const availableAppointments = appointments.filter((appointment) => {
    const belongsToPet = Number(appointment.pet) === Number(form.pet);
    const alreadyUsed = medicalRecords.some(
      (record) => record.appointment === appointment.id,
    );

    return belongsToPet && !alreadyUsed;
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "pet" ? { appointment: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const createdRecord = await createMedicalRecord({
        appointment: Number(form.appointment),
        diagnosis: form.diagnosis.trim(),
        treatment: form.treatment.trim(),
      });

      onCreated(createdRecord);
      setForm(initialForm);
      setSuccess("Az orvosi kezelés rögzítve lett.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="adminHealthForm" onSubmit={handleSubmit}>
      <h2>Új orvosi kezelés</h2>

      <label htmlFor="medicalPet">Kisállat</label>
      <select
        id="medicalPet"
        name="pet"
        value={form.pet}
        onChange={handleChange}
        required
      >
        <option value="">Válassz kisállatot</option>
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>{pet.label}</option>
        ))}
      </select>

      <label htmlFor="medicalAppointment">Foglalás</label>
      <select
        id="medicalAppointment"
        name="appointment"
        value={form.appointment}
        onChange={handleChange}
        disabled={!form.pet}
        required
      >
        <option value="">Válassz foglalást</option>
        {availableAppointments.map((appointment) => (
          <option key={appointment.id} value={appointment.id}>
            {formatAppointment(appointment)}
          </option>
        ))}
      </select>

      <label htmlFor="diagnosis">Diagnózis</label>
      <textarea
        id="diagnosis"
        name="diagnosis"
        value={form.diagnosis}
        onChange={handleChange}
        required
      />

      <label htmlFor="treatment">Kezelés</label>
      <textarea
        id="treatment"
        name="treatment"
        value={form.treatment}
        onChange={handleChange}
        required
      />

      {error && <p className="adminFormError" role="alert">{error}</p>}
      {success && <p className="adminFormSuccess">{success}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Mentés..." : "Kezelés mentése"}
      </button>
    </form>
  );
}

export default AdminMedicalRecordForm;
