from django.urls import path
from . import views
 
urlpatterns = [
    # API endpoints for meeting history
    path('api/meetings/', views.get_meeting_history, name='meeting_history'),
    path('api/meetings/<str:meeting_id>/', views.get_meeting_detail, name='meeting_detail'),
    path('api/meetings/create/', views.save_meeting, name='save_meeting'),
    path('api/recordings/save/', views.save_recording, name='save_recording'),
    path('api/meetings/<str:meeting_id>/end/', views.end_meeting, name='end_meeting'),
    path('api/meetings/<str:meeting_id>/delete/', views.delete_meeting, name='delete_meeting'),
    

] 