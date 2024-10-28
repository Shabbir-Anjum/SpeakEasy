from celery import shared_task

from djoser.conf import settings
from djoser.compat import get_user_email
from django.contrib.auth import get_user_model

import logging
logger = logging.getLogger(__name__)

User = get_user_model()

def build_email_context(user):
    return {'user': user}

@shared_task
def send_activation_email(user_id, resend = False):
    try:
        user = User.objects.get(pk=user_id)
        context = build_email_context(user)
        to = [get_user_email(user)]

        email = settings.EMAIL.activation(None, context)
        email.send(to)
        if resend:
            logger.info("Resend activation email sent to user ID %s", user.id)
        else:
            logger.info("Activation email sent to user ID %s", user_id)

    except User.DoesNotExist:
        logger.error("User with ID %s does not exist.", user_id)
    except Exception as e:
        logger.error("Error sending activation email to user ID %s: %s", user_id, str(e))

@shared_task
def send_confirmation_email(user_id):
    try:
        user = User.objects.get(pk=user_id)
        context = build_email_context(user)
        to = [get_user_email(user)]

        email = settings.EMAIL.confirmation(None, context)
        email.send(to)
        logger.info("Confirmation email sent to user ID %s", user_id)

    except User.DoesNotExist:
        logger.error("User with ID %s does not exist.", user_id)
    except Exception as e:
        logger.error("Error sending confirmation email to user ID %s: %s", user_id, str(e))

@shared_task
def send_password_reset_email(user_id):
    try:
        user = User.objects.get(pk=user_id)
        context = {'user': user}
        to = [get_user_email(user)]

        email = settings.EMAIL.password_reset(None, context)
        email.send(to)
        logger.info("Password reset email sent to user ID %s", user_id)

    except User.DoesNotExist:
        logger.error("User with ID %s does not exist.", user_id)
    except Exception as e:
        logger.error("Error sending password reset email to user ID %s: %s", user_id, str(e))
