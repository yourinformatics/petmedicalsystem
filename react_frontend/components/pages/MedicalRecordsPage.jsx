import { useEffect, useState } from "react";
import {
  getMedicalRecords,
  getOwners,
  getPets,
} from "../../api/api.js";
import "../../styles/PetHealthPages.css";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function MedicalRecordsPage() {
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    Promise.all([getPets(), getOwners()])
      .then(([petsData, ownersData]) => {
        if (!isActive) return;
        setPets(Array.isArray(petsData) ? petsData : []);
        setOwners(Array.isArray(ownersData) ? ownersData : []);
      })
      .catch((err) => {
        if (isActive) setError(err.message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  function getPetLabel(pet) {
    const owner = owners.find((item) => item.id === pet.owner);
    return owner ? `${pet.name} - ${owner.name}` : pet.name;
  }

  async function handlePetChange(event) {
    const petId = event.target.value;
    setSelectedPet(petId);
    setRecords([]);
    setError("");

    if (!petId) return;

    setLoading(true);
    try {
      const data = await getMedicalRecords(petId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="healthPage">
      <header className="healthHeader">
        <h1>Orvosi kezelések</h1>
      </header>

      <div className="healthPetFilter">
        <label htmlFor="medicalRecordPet">Kisállat</label>
        <select
          id="medicalRecordPet"
          value={selectedPet}
          onChange={handlePetChange}
        >
          <option value="">Válassz kisállatot</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {getPetLabel(pet)} - {pet.chip_number}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="healthError" role="alert">{error}</p>}
      {loading && <p className="healthEmpty">Betöltés...</p>}

      {!loading && selectedPet && records.length === 0 && !error && (
        <p className="healthEmpty">Ehhez az állathoz nincs orvosi kezelés.</p>
      )}

      <div className="healthRecords">
        {records.map((record) => (
          <article className="healthRecord" key={record.id}>
            <h2>{record.diagnosis}</h2>
            <dl>
              <div>
                <dt>Vizsgálat időpontja</dt>
                <dd>{formatDate(record.appointment_date)}</dd>
              </div>
              <div className="healthRecordWide">
                <dt>Kezelés</dt>
                <dd>{record.treatment}</dd>
              </div>
              <div>
                <dt>Rögzítve</dt>
                <dd>{formatDate(record.created_at)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MedicalRecordsPage;
