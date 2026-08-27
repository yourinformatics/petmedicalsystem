import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, getPets } from "../../api/api.js";
import "../../styles/HomePage.css";

function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Betölti a felhasználót, normál user esetén pedig a saját állatait.
  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((userData) => {
        if (!isActive) return [];

        setCurrentUser(userData);

        // Az admin kezdőlapján nem kérjük le és nem mutatjuk az állatokat.
        if (userData.is_staff) {
          return [];
        }

        // A backend normál usernél csak a saját állatokat adja vissza.
        return getPets();
      })
      .then((petsData) => {
        if (!isActive) return;
        setPets(Array.isArray(petsData) ? petsData : []);
      })
      .catch((err) => {
        if (isActive) setError(err.message);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return <p className="homeMessage">Betöltés...</p>;
  }

  if (error) {
    return (
      <p className="homeMessage homeError" role="alert">
        {error}
      </p>
    );
  }

  const displayName =
    currentUser?.owner?.name ||
    currentUser?.username ||
    "Felhasználó";

  return (
    <section className="homePage">
      <header className="homeWelcome">
        <p>{currentUser?.is_staff ? "Adminisztráció" : "Klinika"}</p>
        <h1>Üdvözlünk, {displayName}!</h1>
      </header>

      {currentUser?.is_staff ? (
        <section className="homeSection">
          <div className="homeSectionHeading">
            <h2>Adminisztráció</h2>
          </div>

          <div className="adminHomeGrid">
            <article className="adminHomeCard">
              <h3>Állatok kezelése</h3>
              <p>Az összes állat és tulajdonos adatainak kezelése.</p>
              <Link to="/pets">Állatok megnyitása</Link>
            </article>

            <article className="adminHomeCard">
              <h3>Foglalások</h3>
              <p>Időpontok áttekintése és státuszok módosítása.</p>
              <Link to="/appointments">Foglalások megnyitása</Link>
            </article>

            <article className="adminHomeCard">
              <h3>Egészségügyi admin</h3>
              <p>Kezelések, oltások és gyógyszerek rögzítése.</p>
              <Link to="/admin/health">Admin oldal megnyitása</Link>
            </article>

            <article className="adminHomeCard">
              <h3>Egészségügyi adatok</h3>
              <div className="adminHomeLinks">
                <Link to="/vaccinations">Oltások</Link>
                <Link to="/medical-records">Kezelések</Link>
                <Link to="/prescriptions">Gyógyszerek</Link>
              </div>
            </article>
          </div>
        </section>
      ) : (
        <section className="homeSection">
          <div className="homeSectionHeading">
            <h2>Állataim</h2>
            {pets.length > 0 && (
              <Link className="homeSecondaryLink" to="/pets">
                Állatok kezelése
              </Link>
            )}
          </div>

          {pets.length === 0 ? (
            <div className="homeEmptyState">
              <h2>Még nincs rögzített állatod</h2>
              <p>Az első időpontfoglalás előtt add hozzá a kisállatodat.</p>
              <Link to="/pets">Állat hozzáadása</Link>
            </div>
          ) : (
            <div className="homePetsGrid">
              {pets.map((pet) => (
                <article className="homePetCard" key={pet.id}>
                  {pet.image ? (
                    <img
                      src={pet.image}
                      alt={`${pet.name} képe`}
                    />
                  ) : (
                    <div className="homePetPlaceholder" aria-hidden="true">
                      {pet.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="homePetContent">
                    <h3>{pet.name}</h3>

                    <dl>
                      <div>
                        <dt>Faj</dt>
                        <dd>{pet.species}</dd>
                      </div>

                      <div>
                        <dt>Fajta</dt>
                        <dd>{pet.breed || "Nincs megadva"}</dd>
                      </div>

                      <div>
                        <dt>Chipszám</dt>
                        <dd>{pet.chip_number}</dd>
                      </div>
                    </dl>

                    <Link to={`/appointments/new?pet=${pet.id}`}>
                      Időpont foglalása
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}

export default HomePage;