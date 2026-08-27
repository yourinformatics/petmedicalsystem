import { useEffect, useState } from "react";
import {
  createAppointment,
  getCurrentUser,
  getOccupiedAppointmentSlots,
  getOwners,
  getPets,
  getVeterinarians,
} from "../../api/api.js";

const initialForm = {
  owner: "",
  pet: "",
  veterinarian: "",
  appointment_date: "",
  appointment_time: "",
  reason: "",
};

// 08:00 és 18:00 között félórás időpontokat készít.
const timeSlots = Array.from({ length: 20 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

// A mai dátumot a böngésző helyi időzónájában adja vissza.
function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AppointmentsForm({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [currentUser, setCurrentUser] = useState(null);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Egyszerre tölti be a legördülő listák és a foglaltság adatait.
  useEffect(() => {

  const requestedPetId = new URLSearchParams(
    window.location.search
  ).get("pet");

    Promise.all([
      getCurrentUser(),
      getOwners(),
      getPets(),
      getVeterinarians(),
      getOccupiedAppointmentSlots(),
    ])
      .then(([
        userData,
        ownersData,
        petsData,
        veterinariansData,
        appointmentsData,
      ]) => {
        setCurrentUser(userData);
        setOwners(Array.isArray(ownersData) ? ownersData : []);
        setPets(Array.isArray(petsData) ? petsData : []);
        setVeterinarians(
          Array.isArray(veterinariansData) ? veterinariansData : [],
        );
        setAppointments(
          Array.isArray(appointmentsData) ? appointmentsData : [],
        );


        // Url-ből olvasás a PET id beemelése miatt itt történik meg.

        
        const pets = Array.isArray(petsData) ? petsData : [];

        const requestedPetExists = pets.some(
          (pet) => String(pet.id) === requestedPetId
        );

        setForm((previous) => ({
          ...previous,
          owner: userData.is_staff
            ? ""
            : String(userData.owner?.id ?? ""),
          pet: requestedPetExists ? requestedPetId : "",
        }));


      })
      .catch((err) => setError(err.message));
  }, []);

  // Adminnál a kiválasztott tulajdonos állatai, usernél csak a saját állatok látszanak.
  const availablePets = currentUser?.is_staff
    ? pets.filter((pet) => Number(pet.owner) === Number(form.owner))
    : pets;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "owner" ? { pet: "" } : {}),
      ...(["veterinarian", "appointment_date"].includes(name)
        ? { appointment_time: "" }
        : {}),
    }));
  }

  // Megvizsgálja, hogy az idősáv az adott orvosnál már foglalt-e.
  function isTimeSlotUnavailable(time) {
    if (!form.appointment_date || !form.veterinarian) return false;

    const selectedTime = new Date(
      `${form.appointment_date}T${time}:00`,
    ).getTime();

    return appointments.some((appointment) => {
      const sameVeterinarian =
        Number(appointment.veterinarian) === Number(form.veterinarian);
      const sameTime =
        new Date(appointment.appointment_date).getTime() === selectedTime;
      const activeAppointment = appointment.status !== "cancelled";

      return sameVeterinarian && sameTime && activeAppointment;
    });
  }

  // Összeállítja és elküldi a Django API által várt adatokat.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isTimeSlotUnavailable(form.appointment_time)) {
      setError("A kiválasztott időpont már nem elérhető.");
      return;
    }

    setSubmitting(true);

    try {
      const appointmentDate = new Date(
        `${form.appointment_date}T${form.appointment_time}:00`,
      ).toISOString();

      const createdAppointment = await createAppointment({
        pet: Number(form.pet),
        veterinarian: Number(form.veterinarian),
        appointment_date: appointmentDate,
        reason: form.reason.trim(),
      });

      setAppointments((previous) => [...previous, createdAppointment]);
      setForm({
        ...initialForm,
        owner: currentUser?.is_staff
          ? ""
          : String(currentUser?.owner?.id ?? ""),
      });
      onCreated?.(createdAppointment);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="appointmentForm" onSubmit={handleSubmit}>
      {/* Admin választhat tulajdonost, normál usernél a saját profil rögzített. */}
      <label htmlFor="owner">Tulajdonos</label>
      {currentUser?.is_staff ? (
        <select
          id="owner"
          name="owner"
          value={form.owner}
          onChange={handleChange}
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
          id="owner"
          type="text"
          value={
            currentUser?.owner
              ? `${currentUser.owner.name} - ${currentUser.owner.phone}`
              : "Nincs tulajdonosi profil"
          }
          readOnly
        />
      )}

      {/* A backendnek az állat azonosítóját küldjük. */}
      <label htmlFor="pet">Kisállat</label>
      <select
        id="pet"
        name="pet"
        value={form.pet}
        onChange={handleChange}
        disabled={!form.owner}
        required
      >
        <option value="">Válassz kisállatot</option>
        {availablePets.map((pet) => (
          <option key={pet.id} value={pet.id}>{pet.name} - {pet.chip_number} </option>
        ))}
      </select>

      {/* Az orvos alapján számoljuk ki a foglalt időpontokat. */}
      <label htmlFor="veterinarian">Állatorvos</label>
      <select
        id="veterinarian"
        name="veterinarian"
        value={form.veterinarian}
        onChange={handleChange}
        required
      >
        <option value="">Válassz állatorvost</option>
        {veterinarians.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
        ))}
      </select>

      {/* Először napot, majd egy elérhető félórás idősávot választunk. */}
      <label htmlFor="appointment_date">Dátum</label>
      <input
        id="appointment_date"
        name="appointment_date"
        type="date"
        min={getToday()}
        value={form.appointment_date}
        onChange={handleChange}
        required
      />

      <label htmlFor="appointment_time">Időpont</label>
      <select
        id="appointment_time"
        name="appointment_time"
        value={form.appointment_time}
        onChange={handleChange}
        disabled={!form.appointment_date || !form.veterinarian}
        required
      >
        <option value="">Válassz időpontot</option>
        {timeSlots.map((time) => {
          const unavailable = isTimeSlotUnavailable(time);

          return (
            <option key={time} value={time} disabled={unavailable}>
              {time}{unavailable ? " - Foglalt" : ""}
            </option>
          );
        })}
      </select>

      <label htmlFor="reason">Foglalás oka</label>
      <textarea
        id="reason"
        name="reason"
        value={form.reason}
        onChange={handleChange}
        required
      />

      {/* A szerver validációs hibája az űrlapon jelenik meg. */}
      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Mentés..." : "Időpont foglalása"}
      </button>
    </form>
  );
}

export default AppointmentsForm;
