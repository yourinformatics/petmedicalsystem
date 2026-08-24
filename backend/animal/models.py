from django.db import models
from django.conf import settings


class Owner(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    # Owner és user összekötése, hogy egyedi lekérdezések legyenek futtathatóak.
    user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="owner_profile",
    null=True,
    blank=True,
)
    def __str__(self):
        return self.name


class Pet(models.Model):
    owner = models.ForeignKey(
        Owner,
        on_delete=models.CASCADE,
        related_name="pets"
    )

    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)
    breed = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    chip_number = models.CharField(max_length=50, unique=True)

    image = models.ImageField(
        upload_to='pets/',
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name


class Veterinarian(models.Model):
    name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return self.name


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Függőben'),
        ('scheduled', 'Elfogadva'),
        ('completed', 'Befejezve'),
        ('cancelled', 'Lemondva'),
    ]

    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name='appointments'
    )

    veterinarian = models.ForeignKey(
        Veterinarian,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments'
    )

    appointment_date = models.DateTimeField()
    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    def __str__(self):
        return f"{self.pet.name} - {self.appointment_date.strftime('%Y-%m-%d %H:%M')}"


class MedicalRecord(models.Model):
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='medical_record',
        null=True,
        blank=True
    )

    diagnosis = models.TextField()
    treatment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.appointment:
            return (
                f"{self.appointment.pet.name} - "
                f"{self.appointment.appointment_date.strftime('%Y-%m-%d %H:%M')}"
            )

        return f"Medical record #{self.id}"


class Vaccine(models.Model):
    name = models.CharField(max_length=100)
    target_disease = models.CharField(max_length=150)
    validity_months = models.IntegerField(default=12)

    def __str__(self):
        return self.name


class PetVaccination(models.Model):
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name='vaccinations'
    )

    vaccine = models.ForeignKey(
        Vaccine,
        on_delete=models.PROTECT,
        related_name='administered_pets'
    )

    administered_date = models.DateField()
    expiration_date = models.DateField()

    batch_number = models.CharField(
        max_length=50,
        blank=True
    )

    veterinarian = models.ForeignKey(
        Veterinarian,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='performed_vaccinations'
    )

    def __str__(self):
        return f"{self.pet.name} - {self.vaccine.name} ({self.administered_date})"
    
class Prescription(models.Model):
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="prescriptions"
    )

    medicine_name = models.CharField(max_length=100)

    dosage = models.CharField(
        max_length=100,
        help_text="Pl.: 2x1 tabletta"
    )

    duration = models.CharField(
        max_length=100,
        help_text="Pl.: 7 nap"
    )

    instructions = models.TextField(
        blank=True,
        help_text="További utasítások"
    )

    def __str__(self):
        return f"{self.medicine_name} ({self.dosage})"