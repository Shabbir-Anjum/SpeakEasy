from django.urls import path, include
from console.views import AgentViewSet, ManageAgentViewSet, \
                    GetAgentsViewSet, GetAgentViewSet, \
                    interview_session_create, interview_session_flow

agent_create = AgentViewSet.as_view({
    'post': 'create'
})

agent_list = GetAgentsViewSet.as_view({
    'get': 'list'
})

single_agent = GetAgentViewSet.as_view({
    'get': 'retrieve'
})

agent_update_delete = ManageAgentViewSet.as_view({
    'patch': 'update',
    'delete': 'destroy'
})

urlpatterns = [
    path('create/', agent_create, name='create-agent'),
    path('list/', agent_list, name='list-agents'),
    path('list/<uuid:order_id>/', single_agent, name='single-agent'),
    path('manage/<uuid:id>/', agent_update_delete, name='update-agent'),
    path('sync/<uuid:agent_id>/', interview_session_create, name='sync-agent'),
    path('talk/<uuid:agent_id>/', interview_session_flow, name='talk-with-agent')
]
