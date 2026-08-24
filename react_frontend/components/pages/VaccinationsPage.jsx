import { useEffect, useState } from "react";
import {
  getOwners,
  getPets,
  getPetVaccinations,
} from "../../api/api.js";
import "../../styles/PetHealthPages.css";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("hu-HU").format(new Date(value));
}

function VaccinationsPage() {
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // A backend normál usernél csak a saját, adminnál minden állatot visszaad.
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

  // Állatváltáskor csak a kiválasztott állat oltásait kérjük le.
  async function handlePetChange(event) {
    const petId = event.target.value;
    setSelectedPet(petId);
    setVaccinations([]);
    setError("");

    if (!petId) return;

    setLoading(true);
    try {
      const data = await getPetVaccinations(petId);
      setVaccinations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="healthPage">
      <header className="healthHeader">
        <h1>Oltások</h1>
      </header>

      <div className="healthPetFilter">
        <label htmlFor="vaccinationPet">Kisállat</label>
        <select
          id="vaccinationPet"
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

      {!loading && selectedPet && vaccinations.length === 0 && !error && (
        <p className="healthEmpty">Ehhez az állathoz nincs rögzített oltás.</p>
      )}

      <div className="healthRecords">
        {vaccinations.map((vaccination) => (
          <article className="healthRecord" key={vaccination.id}>
            <h2>{vaccination.vaccine?.name ?? "Ismeretlen oltás"}</h2>
            <dl>
              <div>
                <dt>Betegség</dt>
                <dd>{vaccination.vaccine?.target_disease ?? "-"}</dd>
              </div>
              <div>
                <dt>Beadás dátuma</dt>
                <dd>{formatDate(vaccination.administered_date)}</dd>
              </div>
              <div>
                <dt>Lejárat</dt>
                <dd>{formatDate(vaccination.expiration_date)}</dd>
              </div>
              <div>
                <dt>Gyártási szám</dt>
                <dd>{vaccination.batch_number || "-"}</dd>
              </div>
              <div>
                <dt>Állatorvos</dt>
                <dd>{vaccination.veterinarian_name || "Nincs megadva"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export default VaccinationsPage;
