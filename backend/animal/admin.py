from django.contrib import admin
from .models import (
    Owner,
    Pet,
    Appointment,
    MedicalRecord,
    Veterinarian,
    Vaccine,
    PetVaccination,
    Prescription
)


admin.site.register(Owner)
admin.site.register(Pet)
admin.site.register(MedicalRecord)
admin.site.register(Veterinarian)
admin.site.register(Vaccine)
admin.site.register(PetVaccination)
admin.site.register(Prescription)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'pet',
        'appointment_date',
        'veterinarian',
        'status'
    )

    list_filter = (
        'status',
        'appointment_date',
        'veterinarian'
    )

    search_fields = (
        'pet__name',
        'veterinarian__name'
    )

    actions = [
        'approve_appointments',
        'mark_completed',
        'cancel_appointments'
    ]

    @admin.action(description='Kijelölt időpontok elfogadása')
    def approve_appointments(self, request, queryset):
        queryset.update(status='scheduled')

    @admin.action(description='Kijelölt időpontok befejezettnek jelölése')
    def mark_completed(self, request, queryset):
        queryset.update(status='completed')

    @admin.action(description='Kijelölt időpontok lemondása')
    def cancel_appointments(self, request, queryset):
        queryset.update(status='cancelled')