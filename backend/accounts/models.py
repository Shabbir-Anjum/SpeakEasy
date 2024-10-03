from django.db import models
from django.contrib.auth.models import AbstractUser, \
                                        UserManager
# Create your models here.

class CustomUserManager(UserManager):
    def get_by_natural_key(self, username):
        return self.get(
            models.Q(**{self.model.USERNAME_FIELD: username}) |
            models.Q(**{self.model.EMAIL_FIELD: username})
        )
class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_email_confirmed = models.BooleanField(default=False)

    objects = CustomUserManager()
