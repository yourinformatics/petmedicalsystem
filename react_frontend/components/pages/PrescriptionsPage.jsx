import { useEffect, useState } from "react";
import {
  getPets,
  getPrescriptions,
} from "../../api/api.js";
import "../../styles/PetHealthPages.css";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function PrescriptionsPage() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    getPets()
      .then((petsData) => {
        if (!isActive) return;

        setPets(Array.isArray(petsData) ? petsData : []);
      })
      .catch((err) => {
        if (isActive) setError(err.message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handlePetChange(event) {
    const petId = event.target.value;
    setSelectedPet(petId);
    setPrescriptions([]);
    setError("");

    if (!petId) return;

    setLoading(true);
    try {
      const data = await getPrescriptions(petId);
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="healthPage">
      <header className="healthHeader">
        <h1>Gyógyszerek</h1>
      </header>

      <div className="healthPetFilter">
        <label htmlFor="prescriptionPet">Kisállat</label>
        <select
          id="prescriptionPet"
          value={selectedPet}
          onChange={handlePetChange}
        >
          <option value="">Válassz kisállatot</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} - {pet.chip_number}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="healthError" role="alert">{error}</p>}
      {loading && <p className="healthEmpty">Betöltés...</p>}

      {!loading && selectedPet && prescriptions.length === 0 && !error && (
        <p className="healthEmpty">Ehhez az állathoz nincs felírt gyógyszer.</p>
      )}

      <div className="healthRecords">
        {prescriptions.map((prescription) => (
          <article className="healthRecord" key={prescription.id}>
            <h2>{prescription.medicine_name}</h2>
            <dl>
              <div>
                <dt>Vizsgálat dátuma</dt>
                <dd>{formatDate(prescription.appointment_date)}</dd>
              </div>
              <div>
                <dt>Adagolás</dt>
                <dd>{prescription.dosage}</dd>
              </div>
              <div>
                <dt>Időtartam</dt>
                <dd>{prescription.duration}</dd>
              </div>
              <div className="healthRecordWide">
                <dt>Utasítás</dt>
                <dd>{prescription.instructions || "Nincs külön utasítás"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PrescriptionsPage;
