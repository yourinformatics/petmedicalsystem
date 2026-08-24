import { useState } from "react";
import {
  createPetVaccination,
  createVaccine,
} from "../../../api/api.js";

const initialVaccination = {
  pet: "",
  vaccine: "",
  veterinarian: "",
  administered_date: "",
  expiration_date: "",
  batch_number: "",
};

const initialVaccine = {
  name: "",
  target_disease: "",
  validity_months: "12",
};

function AdminVaccinationForm({ pets, vaccines, veterinarians, onVaccineCreated }) {
  const [vaccination, setVaccination] = useState(initialVaccination);
  const [vaccine, setVaccine] = useState(initialVaccine);
  const [vaccinationError, setVaccinationError] = useState("");
  const [vaccinationSuccess, setVaccinationSuccess] = useState("");
  const [vaccineError, setVaccineError] = useState("");
  const [vaccineSuccess, setVaccineSuccess] = useState("");
  const [vaccinationSubmitting, setVaccinationSubmitting] = useState(false);
  const [vaccineSubmitting, setVaccineSubmitting] = useState(false);

  function handleVaccinationChange(event) {
    const { name, value } = event.target;
    setVaccination((previous) => ({ ...previous, [name]: value }));
  }

  function handleVaccineChange(event) {
    const { name, value } = event.target;
    setVaccine((previous) => ({ ...previous, [name]: value }));
  }

  async function handleVaccinationSubmit(event) {
    event.preventDefault();
    setVaccinationError("");
    setVaccinationSuccess("");
    setVaccinationSubmitting(true);

    try {
      await createPetVaccination({
        pet: Number(vaccination.pet),
        vaccine: Number(vaccination.vaccine),
        veterinarian: vaccination.veterinarian
          ? Number(vaccination.veterinarian)
          : null,
        administered_date: vaccination.administered_date,
        expiration_date: vaccination.expiration_date,
        batch_number: vaccination.batch_number.trim(),
      });

      setVaccination(initialVaccination);
      setVaccinationSuccess("Az oltás rögzítve lett.");
    } catch (err) {
      setVaccinationError(err.message);
    } finally {
      setVaccinationSubmitting(false);
    }
  }

  async function handleVaccineSubmit(event) {
    event.preventDefault();
    setVaccineError("");
    setVaccineSuccess("");
    setVaccineSubmitting(true);

    try {
      const createdVaccine = await createVaccine({
        name: vaccine.name.trim(),
        target_disease: vaccine.target_disease.trim(),
        validity_months: Number(vaccine.validity_months),
      });

      onVaccineCreated(createdVaccine);
      setVaccine(initialVaccine);
      setVaccineSuccess("Az új oltástípus létrejött.");
    } catch (err) {
      setVaccineError(err.message);
    } finally {
      setVaccineSubmitting(false);
    }
  }

  return (
    <div className="adminVaccinationForms">
      <form className="adminHealthForm" onSubmit={handleVaccinationSubmit}>
        <h2>Oltás rögzítése</h2>

        <label htmlFor="vaccinationPetAdmin">Kisállat</label>
        <select
          id="vaccinationPetAdmin"
          name="pet"
          value={vaccination.pet}
          onChange={handleVaccinationChange}
          required
        >
          <option value="">Válassz kisállatot</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>{pet.label}</option>
          ))}
        </select>

        <label htmlFor="vaccineAdmin">Oltás</label>
        <select
          id="vaccineAdmin"
          name="vaccine"
          value={vaccination.vaccine}
          onChange={handleVaccinationChange}
          required
        >
          <option value="">Válassz oltást</option>
          {vaccines.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <label htmlFor="vaccinationVet">Állatorvos</label>
        <select
          id="vaccinationVet"
          name="veterinarian"
          value={vaccination.veterinarian}
          onChange={handleVaccinationChange}
        >
          <option value="">Nincs kijelölve</option>
          {veterinarians.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
          ))}
        </select>

        <label htmlFor="administeredDate">Beadás dátuma</label>
        <input
          id="administeredDate"
          name="administered_date"
          type="date"
          value={vaccination.administered_date}
          onChange={handleVaccinationChange}
          required
        />

        <label htmlFor="expirationDate">Lejárat dátuma</label>
        <input
          id="expirationDate"
          name="expiration_date"
          type="date"
          min={vaccination.administered_date}
          value={vaccination.expiration_date}
          onChange={handleVaccinationChange}
          required
        />

        <label htmlFor="batchNumber">Gyártási szám</label>
        <input
          id="batchNumber"
          name="batch_number"
          value={vaccination.batch_number}
          onChange={handleVaccinationChange}
        />

        {vaccinationError && (
          <p className="adminFormError" role="alert">{vaccinationError}</p>
        )}
        {vaccinationSuccess && (
          <p className="adminFormSuccess">{vaccinationSuccess}</p>
        )}

        <button type="submit" disabled={vaccinationSubmitting}>
          {vaccinationSubmitting ? "Mentés..." : "Oltás mentése"}
        </button>
      </form>

      <form className="adminHealthForm" onSubmit={handleVaccineSubmit}>
        <h2>Új oltástípus</h2>

        <label htmlFor="vaccineName">Megnevezés</label>
        <input
          id="vaccineName"
          name="name"
          value={vaccine.name}
          onChange={handleVaccineChange}
          required
        />

        <label htmlFor="targetDisease">Célbetegség</label>
        <input
          id="targetDisease"
          name="target_disease"
          value={vaccine.target_disease}
          onChange={handleVaccineChange}
          required
        />

        <label htmlFor="validityMonths">Érvényesség hónapban</label>
        <input
          id="validityMonths"
          name="validity_months"
          type="number"
          min="1"
          value={vaccine.validity_months}
          onChange={handleVaccineChange}
          required
        />

        {vaccineError && (
          <p className="adminFormError" role="alert">{vaccineError}</p>
        )}
        {vaccineSuccess && (
          <p className="adminFormSuccess">{vaccineSuccess}</p>
        )}

        <button type="submit" disabled={vaccineSubmitting}>
          {vaccineSubmitting ? "Mentés..." : "Oltástípus létrehozása"}
        </button>
      </form>
    </div>
  );
}

export default AdminVaccinationForm;
