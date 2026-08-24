from rest_framework import viewsets
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status



from .models import (
    Owner,
    Pet,
    Appointment,
    MedicalRecord,
    PetVaccination,
    Vaccine,
    Veterinarian,
    Prescription
)

from .serializers import (
    RegistrationSerializer,
    OwnerSerializer,
    PetSerializer,
    AppointmentSerializer,
    MedicalRecordSerializer,
    VeterinarianSerializer,
    VaccineSerializer,
    PetVaccinationReadSerializer,
    PetVaccinationWriteSerializer,
    PrescriptionSerializer,
)

#Regisztrációs nézet.

class RegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Sikeres regisztráció."},
            status=status.HTTP_201_CREATED
        )

# ----------------------

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        owner = Owner.objects.filter(user=request.user).first()

        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "is_staff": request.user.is_staff,
            "owner": OwnerSerializer(owner).data if owner else None,
        })


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or request.user.is_staff

class OwnerViewSet(viewsets.ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Owner.objects.all()

        return Owner.objects.filter(user=self.request.user)

class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["owner", "species"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Pet.objects.all()

        return Pet.objects.filter(
            owner__user=self.request.user
        )

    def get_current_owner(self):
        try:
            return Owner.objects.get(user=self.request.user)
        except Owner.DoesNotExist:
            raise ValidationError(
                "A felhasználóhoz nincs tulajdonosi profil rendelve."
            )

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            if serializer.validated_data.get("owner") is None:
                raise ValidationError({
                    "owner": "Adminisztrátorként válassz tulajdonost."
                })
            serializer.save()
        else:
            serializer.save(owner=self.get_current_owner())

    def perform_update(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(owner=self.get_current_owner())

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]  
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'pet', 'veterinarian']

    def get_queryset(self):
        queryset = Appointment.objects.select_related(
            "pet__owner",
            "veterinarian"
        )

        if self.request.user.is_staff:
            return queryset

        return queryset.filter(pet__owner__user=self.request.user)

    @action(detail=False, methods=["get"], url_path="occupied-slots")
    def occupied_slots(self, request):
        slots = Appointment.objects.filter(
            veterinarian__isnull=False
        ).exclude(
            status="cancelled"
        ).values(
            "appointment_date",
            "veterinarian",
            "status"
        )

        return Response(list(slots))

    def check_pet_permission(self, serializer):
        if self.request.user.is_staff:
            return

        pet = serializer.validated_data.get("pet")

        if pet is None and serializer.instance is not None:
            pet = serializer.instance.pet

        if pet is None or pet.owner.user_id != self.request.user.id:
            raise PermissionDenied(
                "Más felhasználó állatához nem hozhatsz létre foglalást."
            )

    def check_status_permission(self, serializer):
        if self.request.user.is_staff:
            return

        new_status = serializer.validated_data.get("status")
        current_status = (
            serializer.instance.status if serializer.instance else "pending"
        )

        if new_status is not None and new_status != current_status:
            raise PermissionDenied(
                "A foglalás státuszát csak adminisztrátor módosíthatja."
            )

    def perform_create(self, serializer):
        self.check_pet_permission(serializer)
        self.check_status_permission(serializer)

        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(status="pending")

    def perform_update(self, serializer):
        self.check_pet_permission(serializer)
        self.check_status_permission(serializer)
        serializer.save()


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["appointment", "appointment__pet"]

    def get_queryset(self):
        queryset = MedicalRecord.objects.select_related(
            "appointment__pet__owner"
        )

        if self.request.user.is_staff:
            return queryset

        return queryset.filter(
            appointment__pet__owner__user=self.request.user
        )


class VeterinarianViewSet(viewsets.ModelViewSet):
    queryset = Veterinarian.objects.all()
    serializer_class = VeterinarianSerializer
    permission_classes = [IsAuthenticated]


class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.all()
    serializer_class = VaccineSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class PetVaccinationViewSet(viewsets.ModelViewSet):
    queryset = PetVaccination.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['pet', 'vaccine']
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = PetVaccination.objects.select_related(
            "pet__owner",
            "vaccine",
            "veterinarian"
        )

        if self.request.user.is_staff:
            return queryset

        return queryset.filter(pet__owner__user=self.request.user)

    def get_serializer_class(self):
        """
        Automatikusan a megfelelő szerializálót választja ki 
        attól függően, hogy adatot olvasunk vagy írunk.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return PetVaccinationWriteSerializer
        return PetVaccinationReadSerializer
    
def pets_page(request):
    return render(request, "pets.html")

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "medical_record",
        "medical_record__appointment__pet",
    ]

    def get_queryset(self):
        queryset = Prescription.objects.select_related(
            "medical_record__appointment__pet__owner"
        )

        if self.request.user.is_staff:
            return queryset

        return queryset.filter(
            medical_record__appointment__pet__owner__user=self.request.user
        )


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Sikeres kijelentkezés."},
                status=status.HTTP_205_RESET_CONTENT
            )

        except Exception:
            return Response(
                {"error": "Érvénytelen token."},
                status=status.HTTP_400_BAD_REQUEST
            )
