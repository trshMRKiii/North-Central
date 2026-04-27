from rest_framework import viewsets
from .models import User, Driver, Vehicle, Ticket
from .serializers import UserSerializer, DriverSerializer, VehicleSerializer, TicketSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def perform_create(self, serializer):
        #assign current user
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(active_user=self.request.user)
        else:
            # For unauthenticated requests, just save without a user
            serializer.save()
