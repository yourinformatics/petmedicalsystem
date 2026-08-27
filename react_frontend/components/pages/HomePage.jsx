import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  ClipboardPlus,
  HeartPulse,
  PawPrint,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { getCurrentUser, getPets } from "../../api/api.js";
import "../../styles/HomePage.css";

function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Betolti a felhasznalot, normal user eseten pedig a sajat allatait.
  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((userData) => {
        if (!isActive) return [];

        setCurrentUser(userData);

        // Az admin kezdolapjan nem kerjuk le es nem mutatjuk az allatokat.
        if (userData.is_staff) {
          return [];
        }

        // A backend normal usernel csak a sajat allatokat adja vissza.
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

  const isAdmin = Boolean(currentUser?.is_staff);
  const displayName =
    currentUser?.owner?.name ||
    currentUser?.username ||
    "Felhasználó";

  return (
    <section className="homePage">
      <header className="homeWelcome">
        <div className="homeWelcomeContent">
          <p className="homeEyebrow">
            {isAdmin ? "Klinikai adminisztráció" : "Saját kisállatfiók"}
          </p>
          <h1>Üdvözlünk, {displayName}!</h1>
          <p className="homeWelcomeText">
            {isAdmin
              ? "Innen átláthatod a klinika állatait és foglalásait, valamint rögzítheted a kezeléseket, oltásokat és gyógyszereket."
              : "Itt egy helyen eléred kisállataid adatait, új időpontot foglalhatsz, és követheted az egészségügyi információikat."}
          </p>
        </div>

        <div className="homeWelcomeIcon" aria-hidden="true">
          {isAdmin ? <ShieldCheck /> : <HeartPulse />}
        </div>
      </header>

      {isAdmin ? (
        <section className="homeSection">
          <div className="homeSectionHeading">
            <div>
              <p className="homeSectionLabel">Gyors elérés</p>
              <h2>Adminisztráció</h2>
            </div>
            <p>Válassz egy kezelendő területet.</p>
          </div>

          <div className="adminHomeGrid">
            <article className="adminHomeCard">
              <div className="adminHomeCardIcon" aria-hidden="true">
                <PawPrint />
              </div>
              <h3>Állatok kezelése</h3>
              <p>Az összes állat és tulajdonos adatainak áttekintése és kezelése.</p>
              <Link to="/pets">
                Állatok megnyitása
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>

            <article className="adminHomeCard">
              <div className="adminHomeCardIcon" aria-hidden="true">
                <CalendarDays />
              </div>
              <h3>Foglalások</h3>
              <p>Időpontok áttekintése, valamint a foglalási státuszok módosítása.</p>
              <Link to="/appointments">
                Foglalások megnyitása
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>

            <article className="adminHomeCard">
              <div className="adminHomeCardIcon" aria-hidden="true">
                <ClipboardPlus />
              </div>
              <h3>Egészségügyi admin</h3>
              <p>Kezelések, oltások és felírt gyógyszerek gyors rögzítése.</p>
              <Link to="/admin/health">
                Admin oldal megnyitása
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>

            <article className="adminHomeCard">
              <div className="adminHomeCardIcon" aria-hidden="true">
                <Stethoscope />
              </div>
              <h3>Egészségügyi adatok</h3>
              <p>A klinikai előzmények gyors megnyitása kategóriánként.</p>
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
            <div>
              <p className="homeSectionLabel">Saját profil</p>
              <h2>Állataim</h2>
            </div>

            {pets.length > 0 && (
              <Link className="homeSecondaryLink" to="/pets">
                Állatok kezelése
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>

          {pets.length === 0 ? (
            <div className="homeEmptyState">
              <div className="homeEmptyIcon" aria-hidden="true">
                <PawPrint />
              </div>
              <h2>Még nincs rögzített állatod</h2>
              <p>
                Add hozzá kisállatodat, hogy időpontot foglalhass és elérhesd
                az egészségügyi adatait.
              </p>
              <Link to="/pets">
                Állat hozzáadása
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="homePetsGrid">
              {pets.map((pet) => (
                <article className="homePetCard" key={pet.id}>
                  {pet.image ? (
                    <img src={pet.image} alt={`${pet.name} képe`} />
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
                      <CalendarPlus aria-hidden="true" />
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
