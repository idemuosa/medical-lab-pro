from rest_framework import serializers
from .models import Invoice, Payment, InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = '__all__'

    def get_status(self, obj):
        if obj.quantity <= 0: return 'Out of Stock'
        if obj.quantity <= obj.min_stock_level: return 'Low Stock'
        return 'Healthy'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
