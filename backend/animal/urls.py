from django.urls import path
from rest_framework.routers import DefaultRouter
import rest_framework_simplejwt.views

from .views import (
    RegistrationView,
    CurrentUserView,
    OwnerViewSet,
    PetViewSet,
    AppointmentViewSet,
    MedicalRecordViewSet,
    VeterinarianViewSet,
    VaccineViewSet,
    PetVaccinationViewSet,
    PrescriptionViewSet,
    LogoutView,
)

router = DefaultRouter()

router.register(r'owners', OwnerViewSet)
router.register(r'pets', PetViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'veterinarians', VeterinarianViewSet)
router.register(r'vaccines', VaccineViewSet)
router.register(r'pet-vaccinations', PetVaccinationViewSet)
router.register(r'prescriptions', PrescriptionViewSet)

urlpatterns = router.urls + [
    path(
        "me/",
        CurrentUserView.as_view(),
        name="current_user",
    ),
    path(
        "login/",
        rest_framework_simplejwt.views.TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "token/refresh/",
        rest_framework_simplejwt.views.TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
    "register/",
    RegistrationView.as_view(),
    name="register",
    ),
]
