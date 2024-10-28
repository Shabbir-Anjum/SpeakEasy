from django.shortcuts import render
from django.db import transaction
from django.http import FileResponse
from django.conf import settings

from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound

from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

from console.serializers import GetOrdersSerializer, OrderSerializer, \
                                GetOrderSerializer
from console.models import Customer, Order, KnowledgeFileItem, Session, Applicant
from console.ai.generate_text import ai_interviewer
from console.ai.generate_init_message import generate_next_init_question
from console.ai.get_info_from_user import get_information

from dotenv import load_dotenv

import os
load_dotenv()

class AgentViewSet(ModelViewSet):
    http_method_names = ['post']
    queryset = Order.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    serializer_class = OrderSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()

            return Response({"agent_id": f"{serializer.instance.id}"}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetAgentsViewSet(ModelViewSet):
    http_method_names = ['get']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return GetOrdersSerializer

    def get_queryset(self):
        customer_id = Customer.objects.only('id').get(user_id=self.request.user.id)
        return Order.objects.filter(customer_id = customer_id)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetAgentViewSet(ModelViewSet):
    http_method_names = ['get']
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_id'

    def get_serializer_class(self):
        return GetOrderSerializer

    def get_queryset(self):
        customer_id = Customer.objects.only('id').get(user_id=self.request.user.id)
        return Order.objects.filter(customer_id = customer_id)

    def retrieve(self, request, *args, **kwargs):
        order_id = self.kwargs.get(self.lookup_field)
        order = self.get_queryset().filter(id=order_id).first()

        if order is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ManageAgentViewSet(ModelViewSet):
    http_method_names = ['patch', 'delete']
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = 'id'

    def get_queryset(self):
        order_id = self.kwargs.get(self.lookup_field)
        customer = Customer.objects.only('id').get(user_id=self.request.user.id)
        return Order.objects.filter(id=order_id, customer=customer)

    @transaction.atomic
    def perform_destroy(self, instance):
        if instance.agent:
            if hasattr(instance.agent, 'identity'):
                identity = instance.agent.identity
                # if identity.avatar:
                #     identity.avatar.delete(save=False)
                identity.delete()

            if hasattr(instance.agent, 'behaviour'):
                instance.agent.behaviour.delete()

            if hasattr(instance.agent, 'knowledge'):
                knowledge = instance.agent.knowledge
                if hasattr(knowledge, 'knowledgefileitem'):
                    file_items = KnowledgeFileItem.objects.filter(knowledge=knowledge)
                    for file_item in file_items:
                        if file_item.file_item:
                            file_item.file_item.delete(save=False)
                        file_item.delete()
                knowledge.delete()

            # Delete the agent
            instance.agent.delete()

        # Delete the order
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic
    def update(self, request, *args, **kwargs):

        partial = kwargs.pop('partial', True)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid(raise_exception=True):
            updated_order_data = serializer.save()

            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SecureFileAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id, filename):
        try:
            order = Order.objects.get(id=order_id, customer__user_id=request.user.id)
        except Order.DoesNotExist:
            return Response({"detail": "You don't have permission to access this file"}, status=status.HTTP_403_FORBIDDEN)

        file_path = os.path.join(settings.MEDIA_ROOT, 'files', f"{order_id}__{filename}")
        if not os.path.exists(file_path):
            return Response({"detail": "File Not found"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'))

class SecureAvatarAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id, filename):
        try:
            order = Order.objects.get(id=order_id, customer__user_id=request.user.id)
        except Order.DoesNotExist:
            return Response({"detail": "You don't have permission to access this file"}, status=status.HTTP_403_FORBIDDEN)

        file_path = os.path.join(settings.MEDIA_ROOT, 'avatars', f"{order_id}__{filename}")
        if not os.path.exists(file_path):
            return Response({"detail": "File Not found"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'))

class SecureVoiceAccessView(APIView):
    def get(self, request, voice):
        file_path = os.path.join(settings.MEDIA_ROOT, 'voices', f"{voice}.mp3")
        if not os.path.exists(file_path):
            return Response({"detail": "File Not found"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'), content_type='audio/mpeg')

@api_view(['GET'])
def interview_session_create(request, agent_id):
    try:
        order = Order.objects.get(id=agent_id)
        data = request.data
        if request.user.is_authenticated:
            user_email = request.user.email
            if request.user.first_name:
                first_name=request.user.first_name
            else:
                first_name = None
        else:
            user_email = request.data.get('email')
            first_name = None
            if not user_email:
                return Response({"detail": "Email is missing"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            applicant, _ = Applicant.objects.get_or_create(email = user_email)
            print(applicant)
            applicant.name = first_name
            applicant.save()

            session, session_created = Session.objects.get_or_create(order=order, applicant=applicant)
            session.ready = False
            session.save()

            if session_created:
                greeting = order.agent.behaviour.agent_greeting
            else:
                greeting = f"Hello again, {session.order.agent.identity.agent_name} here. I am your interviewer and you and I have an open interview session. Shall we continue?"
            session.get_just_happend = True
            session.ready = False
            session.last_info_msg_ai = greeting
            session.save()

            return Response({
                "ai_text": greeting,
                "final": session.final,
                "score": session.score,
                "confidence" : session.confidence
            }, status=status.HTTP_200_OK)

    except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'{e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def interview_session_flow(request, agent_id):
    try:
        order = Order.objects.get(id=agent_id)
        data = request.data
        if request.user.is_authenticated:
            user_email = request.user.email
        else:
            user_email = request.data.get('email')
            if not user_email:
                return Response({"detail": "Email is missing"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            applicant = Applicant.objects.get(email = user_email)
            session = Session.objects.get(order=order, applicant=applicant)

            human_text = request.data.get('text')

            llm = ChatOpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'), model="gpt-4o-mini", temperature=0.2)

            if not session.init:
                session.ready = False
                session.save()

                if session.get_just_happend:

                    prompt = PromptTemplate(
                        input_variables=["text"],
                        template="Analyze the following text and determine if the user mentions that is ready to continue the interview process:\n\n{text}\n\nOutput '0' if the user is not ready and '1' if the user is ready."
                    )
                    formated_prompt = prompt.format(text=human_text)
                    response = llm.invoke(formated_prompt)

                    if hasattr(response, 'content'):
                        to_continue = response.content
                    elif hasattr(response, 'message'):
                        to_continue = response.message
                    else:
                        to_continue = response

                    if "0" in to_continue:
                        ai_text = "Then I will wait. Note that waiting can drastically reduce your score!"

                        session.last_info_msg_ai = ai_text
                        session.last_info_msg_human = human_text
                        session.save()
                    else:
                        if not applicant.name:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "NAME")
                        elif not applicant.skills:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "USER SKILLS")
                        elif not applicant.level:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "LEVEL OF KNOWLEDGE")
                        elif not applicant.past_experience:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "WORKING EXPERIENCE")
                        elif not applicant.impressive_work:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "SOMETHING USER IS PROUD OF")
                        elif not applicant.excitement:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "HOW MUCH IS THE USER EXCITED FOR THIS JOB")
                        elif not applicant.other_information:
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "OTHER INFORMATION THAT WILL BE GOOD TO KNOW")
                        else:
                            session.init = True
                            session.save()
                            ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = 1, applicant = session.applicant, input = "")

                        session.get_just_happend = False
                        session.last_info_msg_ai = ai_text
                        session.last_info_msg_human = human_text
                        session.save()
                else:
                    if not applicant.name:
                        store_info = get_information(text=human_text, info = "NAME")
                        applicant.name = store_info
                        applicant.save()
                    elif not applicant.skills:
                        store_info = get_information(text=human_text, info = "USER SKILLS")
                        applicant.skills = store_info
                        applicant.save()
                    elif not applicant.level:
                        store_info = get_information(text=human_text, info = "LEVEL OF KNOWLEDGE")
                        applicant.level = store_info
                        applicant.save()
                    elif not applicant.past_experience:
                        store_info = get_information(text=human_text, info = "WORKING EXPERIENCE")
                        applicant.past_experience = store_info
                        applicant.save()
                    elif not applicant.impressive_work:
                        store_info = get_information(text=human_text, info = "SOMETHING USER IS PROUD OF")
                        applicant.impressive_work = store_info
                        applicant.save()
                    elif not applicant.excitement:
                        store_info = get_information(text=human_text, info = "HOW MUCH IS THE USER EXCITED FOR THIS JOB")
                        applicant.excitement = store_info
                        applicant.save()
                    elif not applicant.other_information:
                        store_info = get_information(text=human_text, info = "INFORMATION THAT WILL BE GOOD TO KNOW FOR THE USER")
                        applicant.other_information = store_info
                        applicant.save()

                    # print(store_info)

                    if not applicant.name:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "NAME")
                    elif not applicant.skills:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "USER SKILLS")
                    elif not applicant.level:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "LEVEL OF KNOWLEDGE")
                    elif not applicant.past_experience:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "WORKING EXPERIENCE")
                    elif not applicant.impressive_work:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "SOMETHING USER IS PROUD OF")
                    elif not applicant.excitement:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "HOW MUCH IS THE USER EXCITED FOR THIS JOB")
                    elif not applicant.other_information:
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = session.init, applicant = session.applicant, input = "OTHER INFORMATION THAT WILL BE GOOD TO KNOW")
                    else:
                        session.init = True
                        session.save()
                        ai_text = generate_next_init_question(last_info_msg_ai=session.last_info_msg_ai, init = 1, applicant = session.applicant, input = "")

                    session.get_just_happend = False
                    session.last_info_msg_ai = ai_text
                    session.last_info_msg_human = human_text
                    session.save()
            elif not session.ready:
                prompt = PromptTemplate(
                    input_variables=["text"],
                    template="Analyze the following text and determine if the user mentions that is ready to start or continue the interview:\n\n{text}\n\nOutput '0' if the user is not ready and '1' if the user is ready."
                )
                formated_prompt = prompt.format(text=human_text)
                response = llm.invoke(formated_prompt)

                if hasattr(response, 'content'):
                    to_continue = response.content
                elif hasattr(response, 'message'):
                    to_continue = response.message
                else:
                    to_continue = response

                if "0" in to_continue:
                    ai_text = "Then I will wait. Note that waiting can drastically reduce your score!"
                else:
                    score, ai_text = ai_interviewer(text = human_text, session = session)
                    session.ready = True

                session.last_info_msg_human = human_text
                session.get_just_happend = False
                session.last_question = ai_text
                session.save()

            elif session.ready and session.init:
                score, ai_text = ai_interviewer(text = human_text, session = session)

                session.last_answer = human_text
                session.get_just_happend = False
                session.last_question = ai_text
                session.save()

                if session.final:
                    prompt = PromptTemplate(
                        input_variables=["score"],
                        template="You are voice assistant and you should do the following: -Thanks to the user for their time. -Give summary for the user based on their score :\n\n{score}\n\n<description for the score>The score should can go from 0 to 100 and for someone to pass the interview need to have score more than 45%</end of the description>. -Say that user did perfect or he should try again based on the score. -Say goodbay to the user."
                    )
                    formated_prompt = prompt.format(score=int(session.score))
                    response = llm.invoke(formated_prompt)

                    if hasattr(response, 'content'):
                        ai_text = response.content
                    elif hasattr(response, 'message'):
                        ai_text = response.message
                    else:
                        ai_text = response

                    session.last_info_msg_ai = ai_text
                    session.save()
            else:
                ai_text = "Some error occured, please try again with the interview later!"
                session.last_info_msg_ai = ai_text
                session.save()

            return Response({
                "ai_text": ai_text,
                "final": session.final,
                "score": session.score,
                "confidence" : session.confidence
            }, status=status.HTTP_200_OK)

    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'{e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # if session.n_questions == 0 and not session.last_question:
            #     session.ready = False
            #     session.save()

            #     ai_text = f"We started a interview process with you, can you tell me your skills, please?"

            # elif session.n_questions == 0 and not session.last_answer:
            #     session.ready = False
            #     session.save()

            #     llm = ChatOpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'), model="gpt-4o-mini", temperature=0)

            #     prompt = PromptTemplate(
            #         input_variables=["text"],
            #         template="Analyze the following text and determine if it mentions any skills:\n\n{text}\n\nOutput '0' if no skills are mentioned and '1' if skills are mentioned."
            #     )
            #     format_prompt = prompt.format(text=human_text)
            #     response = llm.invoke(format_prompt)

            #     if hasattr(response, 'content'):
            #         skills_provided = response.content
            #     elif hasattr(response, 'message'):
            #         skills_provided = response.message
            #     else:
            #         skills_provided = response

            #     print("------------------------------")
            #     print(skills_provided)

            #     if skills_provided == "0":
            #         missing_skills_prompt = PromptTemplate(
            #             input_variables=["text"],
            #             template="You are voice interviewer bot and the job applicant has not provided any skills. Analyze the following text for tone:\n\n{text}\n\nGenerate a polite message asking them to provide their skills again, or indicate if the text is offensive."
            #         )
            #         formated_missing_skills_prompt = missing_skills_prompt.format(text=human_text)
            #         response = llm.invoke(formated_missing_skills_prompt)

            #         if hasattr(response, 'content'):
            #             missing_skills_message = response.content
            #         elif hasattr(response, 'message'):
            #             missing_skills_message = response.message
            #         else:
            #             missing_skills_message = response

            #         ai_text = missing_skills_message
            #     else:
            #         skills_description_prompt = PromptTemplate(
            #             input_variables=["text"],
            #             template="Based on the following text: \n\n{text}\n\n, generate a short description that highlights the skills mentioned. \nProvide a concise summary for what the user know and what does not know!"
            #         )
            #         formated_skills_description_prompt = skills_description_prompt.format(text=human_text)
            #         response = llm.invoke(formated_skills_description_prompt)

            #         if hasattr(response, 'content'):
            #             short_description = response.content
            #         elif hasattr(response, 'message'):
            #             short_description = response.message
            #         else:
            #             short_description = response

            #         applicant.skills = short_description
            #         applicant.save()

            #         session.last_answer = short_description
            #         session.save()

            #         readiness_message_prompt = PromptTemplate(
            #             template="You are voice interviewer bot and the user just Generate a message to inform the user that their skills have been noted, and they will be asked questions based on their job description and skills. Ask them to give you information when they are ready."
            #         )
            #         formated_readiness_message_prompt = readiness_message_prompt.format()

            #         response = llm.invoke(formated_readiness_message_prompt)

            #         if hasattr(response, 'content'):
            #             ai_text = response.content
            #         elif hasattr(response, 'message'):
            #             ai_text = response.message
            #         else:
            #             ai_text = response

            # elif session.n_questions == 0 and session.last_answer and not session.ready:
            #     llm = ChatOpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'), model="gpt-4o-mini", temperature=0)

            #     prompt = PromptTemplate(
            #         input_variables=["text"],
            #         template="Analyze the following text and determine if the user mentions that is ready for starting the interview process:\n\n{text}\n\nOutput '0' if the user is not ready and '1' if the user is ready."
            #     )
            #     formated_prompt = prompt.format(text=human_text)
            #     response = llm.invoke(formated_prompt)

            #     if hasattr(response, 'content'):
            #         is_ready = response.content
            #     elif hasattr(response, 'message'):
            #         is_ready = response.message
            #     else:
            #         is_ready = response

            #     if is_ready == "0":
            #         user_said_no = PromptTemplate(
            #             input_variables=["text"],
            #             template="You are voice interviewer, and the user is not ready yet to be interviewed. Analyze the following text for tone:\n\n{text}\n\nGenerate a polite message that you are waiting on user to be ready to be interviewed. If the text is offensive indicate to the user to use more natural human language."
            #         )
            #         formated_user_said_no = user_said_no.format(text=human_text)
            #         response = llm.invoke(formated_user_said_no)

            #         if hasattr(response, 'content'):
            #             ai_text = response.content
            #         elif hasattr(response, 'message'):
            #             ai_text = response.message
            #         else:
            #             ai_text = response
            #     else:
            #         session.ready = True
            #         session.save()
            #         score, ai_text = ai_interviewer(text = human_text, session = session)
            # elif session.n_questions != 0 and session.ready == False:
            #     llm = ChatOpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'), model="gpt-4o-mini", temperature=0)
            #     previous_context_prompt = PromptTemplate(
            #         input_variables=["last_question"],
            #         template="You are voice interviewer. Ask the user if he is ready to continue with the interview:\n\nLast question: {last_question}\n\nAre you ready to continue?"
            #     )
            #     formated_previous_context_prompt = previous_context_prompt.format(last_question=session.last_question)
            #     response = llm.invoke(formated_previous_context_prompt)

            #     if hasattr(response, 'content'):
            #         ai_text = response.content
            #     elif hasattr(response, 'message'):
            #         ai_text = response.message
            #     else:
            #         ai_text = response
            # else:
            #     score, ai_text = ai_interviewer(text = human_text, session = session)

            #     if session.final:
            #         ai_text = f"Thanks for your time, we finished with the interview! Your score is {int(session.score)} percents. Have a good day."

        # return Response({
        #     "ai_text": ai_text,
        #     "final": session.final,
        #     "score": session.score,
        #     "confidence" : session.confidence
        # }, status=status.HTTP_200_OK)

    # except Order.DoesNotExist:
    #         return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    # except Exception as e:
    #     return Response({'error': f'{e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
