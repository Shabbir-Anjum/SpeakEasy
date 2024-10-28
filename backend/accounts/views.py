from djoser.views import UserViewSet
from djoser import signals
from djoser.conf import settings

from django.shortcuts import render
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, \
                                                            BlacklistedToken

from accounts.serializers import CustomUserSerializer
from accounts.tasks import send_activation_email, send_confirmation_email, \
                                                  send_password_reset_email


User = get_user_model()

class CustomUserViewSet(UserViewSet):

    def perform_create(self, serializer, *args, **kwargs):
        user = serializer.save(*args, **kwargs)
        signals.user_registered.send(
            sender=self.__class__, user=user, request=self.request
        )

        if settings.SEND_ACTIVATION_EMAIL:
            send_activation_email.delay(user.id)
        elif settings.SEND_CONFIRMATION_EMAIL:
            send_confirmation_email.delay(user.id)

    @action(["post"], detail=False)
    def resend_activation(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user(is_active=False)

        if not settings.SEND_ACTIVATION_EMAIL:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if user:
            send_activation_email.delay(user.id, resend = True)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(["post"], detail=False)
    def reset_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user()

        if user:
            send_password_reset_email.delay(user.id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = CustomUserSerializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = CustomUserSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)

        if instance == request.user:
            # blacklist the tokens
            tokens = OutstandingToken.objects.filter(user=request.user)
            for token in tokens:
                if not hasattr(token, 'blacklisted'):
                    blt, _ = BlacklistedToken.objects.create(token=token)
            instance.is_active = False
            instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(["get", "patch", "delete"], detail=False)
    def me(self, request, *args, **kwargs):
        self.get_object = self.get_instance
        if request.method == "GET":
            return self.retrieve(request, *args, **kwargs)
        elif request.method == "PATCH":
            return self.partial_update(request, *args, **kwargs)
        elif request.method == "DELETE":
            return self.destroy(request, *args, **kwargs)

    @action(["post"], detail=False, url_path=f"reset_{User.USERNAME_FIELD}")
    def reset_username(self, request, *args, **kwargs):
        # Override the method to do nothing
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(["post"], detail=False, url_path=f"reset_{User.USERNAME_FIELD}_confirm")
    def reset_username_confirm(self, request, *args, **kwargs):
        # Override the method to do nothing
        return Response(status=status.HTTP_204_NO_CONTENT)

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            tokens = OutstandingToken.objects.filter(user=request.user)
            for token in tokens:
                print(token)
                if not hasattr(token, 'blacklisted'):
                    blt, _ = BlacklistedToken.objects.get_or_create(token=token)

            return Response({"detail": "Successfully logged out."}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({"detail": "Logout failed. Try again later."}, status=status.HTTP_400_BAD_REQUEST)
