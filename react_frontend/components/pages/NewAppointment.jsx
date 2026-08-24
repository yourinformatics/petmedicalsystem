import { useNavigate } from "react-router-dom";
import AppointmentsForm from "../elements/AppointmentsForm.jsx";
import "../../styles/NewAppointment.css";

function NewAppointmentPage() {
  const navigate = useNavigate();

  return (
    <section className="newAppointmentPage">
      <h1 className="newAppointmentTitle">Új időpont foglalása</h1>
      <AppointmentsForm
        onCreated={() => {
          // Sikeres mentés után visszalépünk a foglalások listájára.
          alert("Sikeres foglalás!");
          navigate("/appointments", { replace: true });
        }}
      />
    </section>
  );
}

export default NewAppointmentPage;
