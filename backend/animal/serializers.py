from rest_framework import serializers
from .models import Owner, Pet, Appointment, MedicalRecord,Veterinarian,Vaccine, PetVaccination, Prescription
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

User = get_user_model()
class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password]
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Ez a felhasználónév már foglalt."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Ezzel az e-mail-címmel már regisztráltak."
            )
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm": "A két jelszó nem egyezik."
            })

        return data

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")

        name = validated_data.pop("name")
        phone = validated_data.pop("phone")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password
        )

        Owner.objects.create(
            user=user,
            name=name,
            phone=phone,
            email=validated_data["email"]
        )

        return user

#Regisztrációs űrlap
    
class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Owner
        fields = "__all__"
        read_only_fields = ["user"]

# Backend oldalon felhasználóhoz kötés utáni leszűrés, a felhasználó csak a saját állatait látja majd emiatt.
class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = "__all__"
        extra_kwargs = {
            "owner": {"required": False}
        }


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

    def validate(self, data):
        appointment_date = data.get(
            "appointment_date",
            self.instance.appointment_date if self.instance else None
        )
        veterinarian = data.get(
            "veterinarian",
            self.instance.veterinarian if self.instance else None
        )
        appointment_status = data.get(
            "status",
            self.instance.status if self.instance else "pending"
        )

        if veterinarian and appointment_date and appointment_status != "cancelled":
            occupied = Appointment.objects.filter(
                veterinarian=veterinarian,
                appointment_date=appointment_date
            ).exclude(status="cancelled")

            if self.instance:
                occupied = occupied.exclude(pk=self.instance.pk)

            if occupied.exists():
                raise serializers.ValidationError({
                    "appointment_date": "Ez az időpont ennél az orvosnál már foglalt."
                })

        return data


class MedicalRecordSerializer(serializers.ModelSerializer):
    pet = serializers.IntegerField(
        source="appointment.pet_id",
        read_only=True,
        allow_null=True
    )
    pet_name = serializers.CharField(
        source="appointment.pet.name",
        read_only=True,
        allow_null=True
    )
    appointment_date = serializers.DateTimeField(
        source="appointment.appointment_date",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "appointment",
            "pet",
            "pet_name",
            "appointment_date",
            "diagnosis",
            "treatment",
            "created_at",
        ]

class VeterinarianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veterinarian
        fields = '__all__'

class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = '__all__'


class PetVaccinationReadSerializer(serializers.ModelSerializer):
    """Ezt használjuk LEKÉRDEZÉSKOR (GET), mert részletes adatokat ad vissza."""
    vaccine = VaccineSerializer(read_only=True)
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    veterinarian_name = serializers.CharField(source='veterinarian.name', read_only=True)

    class Meta:
        model = PetVaccination
        fields = [
            'id', 'pet', 'pet_name', 'vaccine', 
            'administered_date', 'expiration_date', 
            'batch_number', 'veterinarian', 'veterinarian_name'
        ]


class PetVaccinationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PetVaccination
        fields = '__all__'

    def validate(self, data):
        if data['expiration_date'] < data['administered_date']:
            raise serializers.ValidationError(
                {"expiration_date": "A lejárati dátum nem lehet a beadási dátum előtt!"}
            )
        return data
    
class PrescriptionSerializer(serializers.ModelSerializer):
    pet = serializers.IntegerField(
        source="medical_record.appointment.pet_id",
        read_only=True,
        allow_null=True
    )
    pet_name = serializers.CharField(
        source="medical_record.appointment.pet.name",
        read_only=True,
        allow_null=True
    )
    appointment_date = serializers.DateTimeField(
        source="medical_record.appointment.appointment_date",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Prescription
        fields = [
            "id",
            "medical_record",
            "pet",
            "pet_name",
            "appointment_date",
            "medicine_name",
            "dosage",
            "duration",
            "instructions",
        ]
