import { useState, useEffect } from "react";
import "../../styles/PetsPage.css";
import {
  createPet,
  getCurrentUser,
  getOwners,
  getPets,
  removePet,
} from "../../api/api.js";

const PetsPage = () => {
  
  const [pets, setPets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");

  async function fetchPets() {
    try {
      const data = await getPets();
      setPets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Állatok lekérési hiba:", error);
      setPets([]);
    }
  }

  async function addPet(e) {
    e.preventDefault();

    const petName = document.getElementById("petName").value;
    const petSpecies = document.getElementById("petSpecies").value;
    const petBreed = document.getElementById("petBreed").value;
    const petBdate = document.getElementById("petBdate").value;
    const chipNumber = document.getElementById("chipNumber").value;
    const petImage = document.getElementById("petImage").files[0];

    const formData = new FormData();

    formData.append("name", petName);
    formData.append("species", petSpecies);
    formData.append("breed", petBreed);
    formData.append("chip_number", chipNumber);

    if (currentUser?.is_staff) {
      formData.append("owner", selectedOwner);
    }

    if (petBdate) {
    formData.append("birth_date", petBdate);
    }

    if (petImage) {
    formData.append("image", petImage);
    }
    try {
      await createPet(formData);
      console.log("Pet hozzáadva");
      await fetchPets();
    } catch (error) {
      console.error("Pet hozzáadási hiba:", error);
    }
  }

/* Állatok törlése API-n keresztül */

  async function deletePet(id) {
    const biztos = window.confirm("Biztosan törölni szeretnéd ezt az állatot?");
    if (!biztos) return;

    try {
      await removePet(id);
      setPets((prevpets) => prevpets.filter((pet) => pet.id !== id));
      console.log("Pet sikeresen törölve");
    } catch (error) {
      console.error("Hiba törlés közben:", error);
    }
  }
    

  useEffect(() => {
    let isActive = true;

    Promise.all([getCurrentUser(), getPets(), getOwners()])
      .then(([userData, petsData, ownersData]) => {
        if (!isActive) return;

        setCurrentUser(userData);
        setPets(Array.isArray(petsData) ? petsData : []);
        setOwners(Array.isArray(ownersData) ? ownersData : []);
        setSelectedOwner(
          userData.is_staff ? "" : String(userData.owner?.id ?? ""),
        );
      })
      .catch((error) => {
        console.error("Az állatok oldal betöltési hibája:", error);
        if (isActive) {
          setPets([]);
          setOwners([]);
          setSelectedOwner("");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <>

 <div className="headerSection">
        <h3>Állatok kezelése</h3>
        <br />
      </div>

      <div>
        <form onSubmit={addPet} className="kertForm">
          <label htmlFor="petName">Új kedvenc neve</label>
          <input type="text" name="petName" id="petName" />

          <label htmlFor="petSpecies">Fajta</label>
          <input type="text" name="petSpecies" id="petSpecies" />
          
          <label htmlFor="petBreed">Breed</label>
          <input type="number" name="petBreed" id="petBreed" />

          <label htmlFor="petBdate">Született</label>
          <input type="date" name="petBdate" id="petBdate" />

          <label htmlFor="chipNumber">Chip Szám</label>
          <input type="text" name="chipNumber" id="chipNumber" />

          <label htmlFor="petImage">Kép</label>
          <input type="file" name="image" id="petImage" accept="image/*"/>

          <label htmlFor="petOwner">Tulajdonos</label>
          {currentUser?.is_staff ? (
            <select
              id="petOwner"
              value={selectedOwner}
              onChange={(event) => setSelectedOwner(event.target.value)}
              required
            >
              <option value="">Válassz tulajdonost</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} - {owner.phone}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="petOwner"
              type="text"
              value={
                currentUser?.owner
                  ? `${currentUser.owner.name} - ${currentUser.owner.phone}`
                  : "Nincs tulajdonosi profil"
              }
              readOnly
            />
          )}

          <button type="submit" id="submitBTN" disabled={!selectedOwner}>
            Kedvenc hozzáadása
          </button>
        </form>
      </div>

  
      <div className="petsSection">
        {Array.isArray(pets) && pets.length > 0 ? (
          pets.map((pet) => (
            <div className="gardenCard" key={pet.id}>
              <img src={pet.image} alt={pet.name+" "+pet.species} />
              <h2>{pet.name}</h2>
              <p>{pet.species}</p>
              <p>{pet.breed}</p>
              <p>{pet.birth_date}</p>
              <p>{pet.chip_number}</p>
              <button type="button" onClick={() => deletePet(pet.id)}>
                Kedvenc törlése
              </button>
            </div>
          ))
        ) : (
          <h2 className="errText">
            Nincs elérhető állat vagy a lekérdezés nem sikerült!!!
          </h2>
        )}
      </div>
      <br /><br />
    </>
  );
};

export default PetsPage;
