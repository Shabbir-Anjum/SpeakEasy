from django.contrib import admin
from django.urls import path, include

from accounts.views import LogoutView

urlpatterns = [
    path('/', include('accounts.urls.base')),
    path('/', include('djoser.urls.jwt')),
    path('/logout', LogoutView.as_view(), name='logout')
]
