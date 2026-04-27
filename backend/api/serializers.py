from rest_framework import serializers
from .models import User, Driver, Vehicle, Ticket


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'password',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
            'email': {'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'PERSONNEL'),
            is_active=validated_data.get('is_active', True),
        )
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            'id',       
            'code',      
            'name',
            'contact',
            'status',
            'is_archived',
            'created_at',
            'updated_at',
        ]

class VehicleSerializer(serializers.ModelSerializer):

    active_driver_name = serializers.CharField(source='active_driver.name', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'code', 'plate_number', 'route', 'status', 'active_driver', 'active_driver_name', 'is_archived', 'created_at', 'updated_at'
        ]


class TicketSerializer(serializers.ModelSerializer):
    # For writing (creating): accept just IDs
    vehicle_id = serializers.IntegerField(write_only=True, required=True)
    driver_id = serializers.IntegerField(write_only=True, required=True)
    
    # For reading: return full nested objects
    vehicle = VehicleSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)
    active_user = serializers.StringRelatedField(read_only=True)
    active_user_name = serializers.CharField(source='active_user.username', read_only=True, required=False, allow_null=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        extra_kwargs = {
            'collection_amount': {'required': False} 
        }
    
    def create(self, validated_data):
        # Replace vehicle_id and driver_id with actual objects
        vehicle_id = validated_data.pop('vehicle_id')
        driver_id = validated_data.pop('driver_id')
        
        vehicle = Vehicle.objects.get(id=vehicle_id)

        if not driver_id and vehicle.active_driver_id:
            driver_id = vehicle.active_driver_id

        driver = Driver.objects.get(id=driver_id)
        
        return Ticket.objects.create(
            vehicle=vehicle,
            driver=driver,
            **validated_data
        )