from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from console.models import Customer

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def user_customer_connection(sender, **kwargs):
  if kwargs['created']:
    Customer.objects.create(user=kwargs['instance'])
