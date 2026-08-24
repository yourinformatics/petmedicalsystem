import { useState } from "react";
import { createPrescription } from "../../../api/api.js";

const initialForm = {
  pet: "",
  medical_record: "",
  medicine_name: "",
  dosage: "",
  duration: "",
  instructions: "",
};

function AdminPrescriptionForm({ pets, medicalRecords }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableRecords = medicalRecords.filter(
    (record) => Number(record.pet) === Number(form.pet),
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "pet" ? { medical_record: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createPrescription({
        medical_record: Number(form.medical_record),
        medicine_name: form.medicine_name.trim(),
        dosage: form.dosage.trim(),
        duration: form.duration.trim(),
        instructions: form.instructions.trim(),
      });

      setForm(initialForm);
      setSuccess("A gyógyszer felírása sikeres.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="adminHealthForm" onSubmit={handleSubmit}>
      <h2>Gyógyszer felírása</h2>

      <label htmlFor="prescriptionPetAdmin">Kisállat</label>
      <select
        id="prescriptionPetAdmin"
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

      <label htmlFor="medicalRecordAdmin">Orvosi kezelés</label>
      <select
        id="medicalRecordAdmin"
        name="medical_record"
        value={form.medical_record}
        onChange={handleChange}
        disabled={!form.pet}
        required
      >
        <option value="">Válassz kezelést</option>
        {availableRecords.map((record) => (
          <option key={record.id} value={record.id}>
            {record.diagnosis}
          </option>
        ))}
      </select>

      <label htmlFor="medicineName">Gyógyszer neve</label>
      <input
        id="medicineName"
        name="medicine_name"
        value={form.medicine_name}
        onChange={handleChange}
        required
      />

      <label htmlFor="dosage">Adagolás</label>
      <input
        id="dosage"
        name="dosage"
        value={form.dosage}
        onChange={handleChange}
        required
      />

      <label htmlFor="duration">Időtartam</label>
      <input
        id="duration"
        name="duration"
        value={form.duration}
        onChange={handleChange}
        required
      />

      <label htmlFor="instructions">Utasítás</label>
      <textarea
        id="instructions"
        name="instructions"
        value={form.instructions}
        onChange={handleChange}
      />

      {error && <p className="adminFormError" role="alert">{error}</p>}
      {success && <p className="adminFormSuccess">{success}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Mentés..." : "Gyógyszer felírása"}
      </button>
    </form>
  );
}

export default AdminPrescriptionForm;
