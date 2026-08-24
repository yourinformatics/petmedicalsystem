from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from .models import (
    Owner,
    Pet,
    Veterinarian,
    Appointment,
    MedicalRecord,
    PetVaccination,
    Prescription,
    Vaccine,
)


class OwnerModelTest(TestCase):

    def test_create_owner(self):
        owner = Owner.objects.create(
            name="Teszt Elek",
            phone="06301234567",
            email="teszt@example.com"
        )

        self.assertEqual(owner.name, "Teszt Elek")


class PetModelTest(TestCase):

    def test_create_pet(self):

        owner = Owner.objects.create(
            name="Teszt",
            phone="111111",
            email="teszt@test.hu"
        )

        pet = Pet.objects.create(
            owner=owner,
            name="Morzsi",
            species="Dog",
            chip_number="ABC123"
        )

        self.assertEqual(pet.name, "Morzsi")
        self.assertEqual(pet.owner.name, "Teszt")


from django.utils import timezone

class AppointmentTest(TestCase):

    def test_create_appointment(self):

        owner = Owner.objects.create(
            name="Teszt",
            phone="123",
            email="teszt@test.hu"
        )

        pet = Pet.objects.create(
            owner=owner,
            name="Morzsi",
            species="Dog",
            chip_number="CHIP123"
        )

        vet = Veterinarian.objects.create(
            name="Dr. Kovács",
            phone="111",
            email="doktor@test.hu"
        )

        appointment = Appointment.objects.create(
            pet=pet,
            veterinarian=vet,
            appointment_date=timezone.now(),
            reason="Oltás"
        )

        self.assertEqual(appointment.status, "pending")


class PrescriptionTest(TestCase):

    def test_create_prescription(self):

        owner = Owner.objects.create(
            name="Teszt",
            phone="111",
            email="teszt@test.hu"
        )

        pet = Pet.objects.create(
            owner=owner,
            name="Morzsi",
            species="Dog",
            chip_number="AA111"
        )

        vet = Veterinarian.objects.create(
            name="Dr. Kiss",
            phone="111",
            email="kiss@test.hu"
        )

        appointment = Appointment.objects.create(
            pet=pet,
            veterinarian=vet,
            appointment_date=timezone.now(),
            reason="Vizsgálat"
        )

        record = MedicalRecord.objects.create(
            appointment=appointment,
            diagnosis="Láz",
            treatment="Pihenés"
        )

        prescription = Prescription.objects.create(
            medical_record=record,
            medicine_name="Amoxicillin",
            dosage="2x1",
            duration="7 nap"
        )

        self.assertEqual(
            prescription.medicine_name,
            "Amoxicillin"
        )

from rest_framework.test import APITestCase
from rest_framework import status


class PetApiTest(APITestCase):

    def test_get_pets_requires_authentication(self):

        response = self.client.get("/api/pets/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class AppointmentPermissionApiTest(APITestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="normal_user",
            password="TestPassword123!"
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            password="TestPassword123!"
        )
        self.admin = User.objects.create_user(
            username="admin_user",
            password="TestPassword123!",
            is_staff=True
        )

        self.owner = Owner.objects.create(
            user=self.user,
            name="Saját Tulajdonos",
            phone="111",
            email="sajat@test.hu"
        )
        self.other_owner = Owner.objects.create(
            user=self.other_user,
            name="Másik Tulajdonos",
            phone="222",
            email="masik@test.hu"
        )

        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Saját állat",
            species="Dog",
            chip_number="OWN-PET-1"
        )
        self.other_pet = Pet.objects.create(
            owner=self.other_owner,
            name="Másik állat",
            species="Cat",
            chip_number="OTHER-PET-1"
        )
        self.veterinarian = Veterinarian.objects.create(
            name="Dr. Teszt",
            phone="333",
            email="vet@test.hu"
        )

    def appointment_data(self, pet):
        return {
            "pet": pet.id,
            "veterinarian": self.veterinarian.id,
            "appointment_date": timezone.now(),
            "reason": "Kontroll",
        }

    def create_appointment(self, pet, hours=0):
        return Appointment.objects.create(
            pet=pet,
            veterinarian=self.veterinarian,
            appointment_date=timezone.now() + timedelta(hours=hours),
            reason="Kontroll"
        )

    def test_user_can_book_for_own_pet(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/appointments/",
            self.appointment_data(self.pet),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_cannot_book_for_another_users_pet(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/appointments/",
            self.appointment_data(self.other_pet),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_book_for_another_users_pet(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/appointments/",
            self.appointment_data(self.other_pet),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_only_sees_own_appointments(self):
        own_appointment = self.create_appointment(self.pet)
        self.create_appointment(self.other_pet, hours=1)
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/appointments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [appointment["id"] for appointment in response.data],
            [own_appointment.id]
        )

    def test_admin_sees_every_appointment(self):
        self.create_appointment(self.pet)
        self.create_appointment(self.other_pet, hours=1)
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/appointments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_user_cannot_change_appointment_status(self):
        appointment = self.create_appointment(self.pet)
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f"/api/appointments/{appointment.id}/",
            {"status": "scheduled"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "pending")

    def test_admin_can_change_appointment_status(self):
        appointment = self.create_appointment(self.other_pet)
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/api/appointments/{appointment.id}/",
            {"status": "scheduled"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "scheduled")


class PetOwnerPermissionApiTest(APITestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="pet_user",
            password="TestPassword123!"
        )
        self.other_user = User.objects.create_user(
            username="other_pet_user",
            password="TestPassword123!"
        )
        self.admin = User.objects.create_user(
            username="pet_admin",
            password="TestPassword123!",
            is_staff=True
        )
        self.owner = Owner.objects.create(
            user=self.user,
            name="Saját Tulajdonos",
            phone="111",
            email="sajat-pet@test.hu"
        )
        self.other_owner = Owner.objects.create(
            user=self.other_user,
            name="Másik Tulajdonos",
            phone="222",
            email="masik-pet@test.hu"
        )

    def pet_data(self, owner):
        return {
            "owner": owner.id,
            "name": "Új állat",
            "species": "Dog",
            "breed": "Keverék",
            "chip_number": f"NEW-PET-{owner.id}",
        }

    def test_user_pet_is_always_assigned_to_current_owner(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/pets/",
            self.pet_data(self.other_owner),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["owner"], self.owner.id)

    def test_admin_can_assign_pet_to_selected_owner(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/pets/",
            self.pet_data(self.other_owner),
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["owner"], self.other_owner.id)


class HealthRecordsPermissionApiTest(APITestCase):

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="health_user",
            password="TestPassword123!"
        )
        self.other_user = User.objects.create_user(
            username="other_health_user",
            password="TestPassword123!"
        )
        self.admin = User.objects.create_user(
            username="health_admin",
            password="TestPassword123!",
            is_staff=True
        )

        self.owner = Owner.objects.create(
            user=self.user,
            name="Saját Tulajdonos",
            phone="111",
            email="health@test.hu"
        )
        self.other_owner = Owner.objects.create(
            user=self.other_user,
            name="Másik Tulajdonos",
            phone="222",
            email="other-health@test.hu"
        )
        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Saját állat",
            species="Dog",
            chip_number="HEALTH-PET-1"
        )
        self.other_pet = Pet.objects.create(
            owner=self.other_owner,
            name="Másik állat",
            species="Cat",
            chip_number="HEALTH-PET-2"
        )
        self.veterinarian = Veterinarian.objects.create(
            name="Dr. Egészség",
            phone="333",
            email="health-vet@test.hu"
        )
        self.vaccine = Vaccine.objects.create(
            name="Kombinált oltás",
            target_disease="Fertőző betegségek",
            validity_months=12
        )

        self.medical_record = self.create_health_records(self.pet, 0)
        self.other_medical_record = self.create_health_records(
            self.other_pet,
            1
        )

    def create_health_records(self, pet, days):
        appointment = Appointment.objects.create(
            pet=pet,
            veterinarian=self.veterinarian,
            appointment_date=timezone.now() + timedelta(days=days),
            reason="Vizsgálat",
            status="completed"
        )
        medical_record = MedicalRecord.objects.create(
            appointment=appointment,
            diagnosis="Teszt diagnózis",
            treatment="Teszt kezelés"
        )
        Prescription.objects.create(
            medical_record=medical_record,
            medicine_name="Teszt gyógyszer",
            dosage="2x1",
            duration="5 nap",
            instructions="Étkezés után"
        )
        PetVaccination.objects.create(
            pet=pet,
            vaccine=self.vaccine,
            administered_date=date.today(),
            expiration_date=date.today() + timedelta(days=365),
            veterinarian=self.veterinarian
        )
        return medical_record

    def test_user_only_sees_own_health_records(self):
        self.client.force_authenticate(user=self.user)

        vaccinations = self.client.get(
            f"/api/pet-vaccinations/?pet={self.pet.id}"
        )
        medical_records = self.client.get(
            f"/api/medical-records/?appointment__pet={self.pet.id}"
        )
        prescriptions = self.client.get(
            "/api/prescriptions/"
            f"?medical_record__appointment__pet={self.pet.id}"
        )

        self.assertEqual(len(vaccinations.data), 1)
        self.assertEqual(len(medical_records.data), 1)
        self.assertEqual(len(prescriptions.data), 1)
        self.assertEqual(medical_records.data[0]["pet"], self.pet.id)
        self.assertEqual(prescriptions.data[0]["pet"], self.pet.id)

    def test_user_cannot_read_another_pets_health_records(self):
        self.client.force_authenticate(user=self.user)

        vaccinations = self.client.get(
            f"/api/pet-vaccinations/?pet={self.other_pet.id}"
        )
        medical_records = self.client.get(
            f"/api/medical-records/?appointment__pet={self.other_pet.id}"
        )
        prescriptions = self.client.get(
            "/api/prescriptions/"
            f"?medical_record__appointment__pet={self.other_pet.id}"
        )

        self.assertEqual(vaccinations.data, [])
        self.assertEqual(medical_records.data, [])
        self.assertEqual(prescriptions.data, [])

    def test_admin_sees_every_health_record(self):
        self.client.force_authenticate(user=self.admin)

        self.assertEqual(len(self.client.get("/api/pet-vaccinations/").data), 2)
        self.assertEqual(len(self.client.get("/api/medical-records/").data), 2)
        self.assertEqual(len(self.client.get("/api/prescriptions/").data), 2)

    def test_user_cannot_create_vaccine(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/vaccines/",
            {
                "name": "Tiltott oltás",
                "target_disease": "Teszt",
                "validity_months": 12,
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_cannot_create_health_records(self):
        self.client.force_authenticate(user=self.user)

        medical_response = self.client.post(
            "/api/medical-records/",
            {
                "appointment": self.medical_record.appointment_id,
                "diagnosis": "Tiltott diagnózis",
                "treatment": "Tiltott kezelés",
            },
            format="json"
        )
        vaccination_response = self.client.post(
            "/api/pet-vaccinations/",
            {
                "pet": self.pet.id,
                "vaccine": self.vaccine.id,
                "administered_date": date.today(),
                "expiration_date": date.today() + timedelta(days=365),
            },
            format="json"
        )
        prescription_response = self.client.post(
            "/api/prescriptions/",
            {
                "medical_record": self.medical_record.id,
                "medicine_name": "Tiltott gyógyszer",
                "dosage": "1x1",
                "duration": "3 nap",
            },
            format="json"
        )

        self.assertEqual(
            medical_response.status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            vaccination_response.status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            prescription_response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_admin_can_create_every_health_record(self):
        self.client.force_authenticate(user=self.admin)
        appointment = Appointment.objects.create(
            pet=self.pet,
            veterinarian=self.veterinarian,
            appointment_date=timezone.now() + timedelta(days=10),
            reason="Admin vizsgálat",
            status="completed"
        )

        medical_response = self.client.post(
            "/api/medical-records/",
            {
                "appointment": appointment.id,
                "diagnosis": "Admin diagnózis",
                "treatment": "Admin kezelés",
            },
            format="json"
        )
        prescription_response = self.client.post(
            "/api/prescriptions/",
            {
                "medical_record": medical_response.data["id"],
                "medicine_name": "Admin gyógyszer",
                "dosage": "2x1",
                "duration": "7 nap",
                "instructions": "Étkezés után",
            },
            format="json"
        )
        vaccine_response = self.client.post(
            "/api/vaccines/",
            {
                "name": "Admin oltás",
                "target_disease": "Admin betegség",
                "validity_months": 12,
            },
            format="json"
        )
        vaccination_response = self.client.post(
            "/api/pet-vaccinations/",
            {
                "pet": self.pet.id,
                "vaccine": vaccine_response.data["id"],
                "veterinarian": self.veterinarian.id,
                "administered_date": date.today(),
                "expiration_date": date.today() + timedelta(days=365),
                "batch_number": "ADMIN-001",
            },
            format="json"
        )

        self.assertEqual(
            medical_response.status_code,
            status.HTTP_201_CREATED
        )
        self.assertEqual(
            prescription_response.status_code,
            status.HTTP_201_CREATED
        )
        self.assertEqual(
            vaccine_response.status_code,
            status.HTTP_201_CREATED
        )
        self.assertEqual(
            vaccination_response.status_code,
            status.HTTP_201_CREATED
        )
