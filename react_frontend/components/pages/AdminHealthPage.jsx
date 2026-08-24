import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getAppointments,
  getCurrentUser,
  getMedicalRecords,
  getOwners,
  getPets,
  getVaccines,
  getVeterinarians,
} from "../../api/api.js";
import AdminMedicalRecordForm from "../elements/admin/AdminMedicalRecordForm.jsx";
import AdminPrescriptionForm from "../elements/admin/AdminPrescriptionForm.jsx";
import AdminVaccinationForm from "../elements/admin/AdminVaccinationForm.jsx";
import "../../styles/AdminHealthPage.css";

function AdminHealthPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [activeTab, setActiveTab] = useState("medical");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getCurrentUser(),
      getPets(),
      getOwners(),
      getAppointments(),
      getMedicalRecords(),
      getVaccines(),
      getVeterinarians(),
    ])
      .then(([
        userData,
        petsData,
        ownersData,
        appointmentsData,
        recordsData,
        vaccinesData,
        veterinariansData,
      ]) => {
        if (!isActive) return;

        const owners = Array.isArray(ownersData) ? ownersData : [];
        const petsWithLabels = (Array.isArray(petsData) ? petsData : []).map(
          (pet) => {
            const owner = owners.find((item) => item.id === pet.owner);
            return {
              ...pet,
              label: owner ? `${pet.name} - ${owner.name}` : pet.name,
            };
          },
        );

        setCurrentUser(userData);
        setPets(petsWithLabels);
        setAppointments(
          Array.isArray(appointmentsData) ? appointmentsData : [],
        );
        setMedicalRecords(Array.isArray(recordsData) ? recordsData : []);
        setVaccines(Array.isArray(vaccinesData) ? vaccinesData : []);
        setVeterinarians(
          Array.isArray(veterinariansData) ? veterinariansData : [],
        );
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
    return <p className="adminHealthMessage">Betöltés...</p>;
  }

  if (error) {
    return <p className="adminHealthMessage isError">{error}</p>;
  }

  if (!currentUser?.is_staff) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="adminHealthPage">
      <header className="adminHealthHeader">
        <h1>Egészségügyi adminisztráció</h1>
      </header>

      <div className="adminHealthTabs" role="tablist" aria-label="Admin nézetek">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "medical"}
          className={activeTab === "medical" ? "isActive" : ""}
          onClick={() => setActiveTab("medical")}
        >
          Kezelés
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "vaccination"}
          className={activeTab === "vaccination" ? "isActive" : ""}
          onClick={() => setActiveTab("vaccination")}
        >
          Oltás
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "prescription"}
          className={activeTab === "prescription" ? "isActive" : ""}
          onClick={() => setActiveTab("prescription")}
        >
          Gyógyszer
        </button>
      </div>

      <div className="adminHealthPanel" role="tabpanel">
        {activeTab === "medical" && (
          <AdminMedicalRecordForm
            pets={pets}
            appointments={appointments}
            medicalRecords={medicalRecords}
            onCreated={(record) =>
              setMedicalRecords((previous) => [...previous, record])
            }
          />
        )}

        {activeTab === "vaccination" && (
          <AdminVaccinationForm
            pets={pets}
            vaccines={vaccines}
            veterinarians={veterinarians}
            onVaccineCreated={(vaccine) =>
              setVaccines((previous) => [...previous, vaccine])
            }
          />
        )}

        {activeTab === "prescription" && (
          <AdminPrescriptionForm
            pets={pets}
            medicalRecords={medicalRecords}
          />
        )}
      </div>
    </section>
  );
}

export default AdminHealthPage;
