"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from console.views import SecureFileAccessView, \
                          SecureAvatarAccessView, \
                          SecureVoiceAccessView

urlpatterns = [
    path('api/console/', include('console.urls')),
    path('api/auth', include('accounts.urls.custom')),
    path('api/media/files/<str:order_id>__<str:filename>', SecureFileAccessView.as_view(), name='secure-file-access'),
    path('api/media/avatars/<str:order_id>__<str:filename>', SecureAvatarAccessView.as_view(), name='secure-avatar-access'),
    path('api/media/voices/<str:voice>', SecureVoiceAccessView.as_view(), name='secure-voice-access')
]
