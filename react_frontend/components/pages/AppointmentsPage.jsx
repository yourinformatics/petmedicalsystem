import { useEffect, useState } from "react";
import {
  getAppointments,
  getCurrentUser,
  getOwners,
  getPets,
  getVeterinarians,
  updateAppointmentStatus,
} from "../../api/api.js";
import "../../styles/AppointmentsPage.css";

const statusLabels = {
  pending: "Függőben",
  scheduled: "Elfogadva",
  completed: "Befejezve",
  cancelled: "Lemondva",
};

function formatDate(value) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest",
  }).format(date);
}

function AppointmentsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [error, setError] = useState("");

  // A backend adminnál minden, normál usernél csak a saját adatokat adja vissza.
  useEffect(() => {
    let isActive = true;

    Promise.all([
      getCurrentUser(),
      getOwners(),
      getPets(),
      getAppointments(),
      getVeterinarians(),
    ])
      .then(([
        userData,
        ownersData,
        petsData,
        appointmentsData,
        veterinariansData,
      ]) => {
        if (!isActive) return;

        setCurrentUser(userData);
        setOwners(Array.isArray(ownersData) ? ownersData : []);
        setPets(Array.isArray(petsData) ? petsData : []);
        setAppointments(
          Array.isArray(appointmentsData) ? appointmentsData : [],
        );
        setVeterinarians(
          Array.isArray(veterinariansData) ? veterinariansData : [],
        );
      })
      .catch((err) => {
        if (isActive) setError(err.message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const ownersById = Object.fromEntries(
    owners.map((owner) => [owner.id, owner]),
  );
  const petsById = Object.fromEntries(pets.map((pet) => [pet.id, pet]));
  const veterinariansById = Object.fromEntries(
    veterinarians.map((veterinarian) => [veterinarian.id, veterinarian]),
  );

  // Ezt a vezérlőt csak admin kapja meg, de a backend is ellenőrzi a jogosultságot.
  async function handleStatusChange(appointmentId, newStatus) {
    if (!currentUser?.is_staff) return;

    try {
      const updatedAppointment = await updateAppointmentStatus(
        appointmentId,
        newStatus,
      );

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId
            ? updatedAppointment
            : appointment,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section
      className={`appointmentsSection${currentUser?.is_staff ? " isAdmin" : ""}`}
    >
      <table>
        <thead>
          <tr>
            <th>Foglalás dátuma</th>
            <th>Foglalás oka</th>
            <th>Státusz</th>
            {currentUser?.is_staff && <th>Tulajdonos</th>}
            <th>Kisállat</th>
            <th>Állatorvos</th>
          </tr>
        </thead>

        <tbody>
          {error ? (
            <tr className="errText">
              <td colSpan={currentUser?.is_staff ? 6 : 5}>{error}</td>
            </tr>
          ) : appointments.length > 0 ? (
            appointments.map((appointment) => {
              const pet = petsById[appointment.pet];
              const owner = ownersById[pet?.owner];

              return (
                <tr key={appointment.id}>
                  <td className="appointmentDateCell">
                    {formatDate(appointment.appointment_date)}
                  </td>
                  <td className="appointmentReasonCell">{appointment.reason}</td>
                  <td className="appointmentStatusCell">
                    {currentUser?.is_staff ? (
                      <select
                        className="appointmentStatus"
                        value={appointment.status}
                        onChange={(event) =>
                          handleStatusChange(
                            appointment.id,
                            event.target.value,
                          )
                        }
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`appointmentStatusBadge status-${appointment.status}`}
                      >
                        {statusLabels[appointment.status] ?? appointment.status}
                      </span>
                    )}
                  </td>
                  {currentUser?.is_staff && (
                    <td className="appointmentOwnerCell">
                      {owner?.name ?? "Ismeretlen tulajdonos"}
                    </td>
                  )}
                  <td className="appointmentPetCell">
                    {pet?.name ?? "Ismeretlen állat"}
                  </td>
                  <td className="appointmentVeterinarianCell">
                    {appointment.veterinarian === null
                      ? "Nincs kijelölve"
                      : veterinariansById[appointment.veterinarian]?.name
                        ?? "Ismeretlen állatorvos"}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr className="errText">
              <td colSpan={currentUser?.is_staff ? 6 : 5}>
                Nincs elérhető foglalás.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default AppointmentsPage;
