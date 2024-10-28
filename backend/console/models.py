from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from uuid import uuid4

from django.core.validators import MinValueValidator, MaxValueValidator

import os

User = get_user_model()

class Identity(models.Model):
    agent_name = models.CharField(max_length=25)

    LANGUAGE_EN = 'english'
    LANGUAGE_SA = 'arabic'
    LANGUAGE_BG = 'bulgarian'
    LANGUAGE_CN = 'chinese'
    LANGUAGE_HR = 'croatian'
    LANGUAGE_CZ = 'czech'
    LANGUAGE_DK = 'danish'
    LANGUAGE_NL = 'dutch'
    LANGUAGE_PH = 'filipino'
    LANGUAGE_FI = 'finnish'
    LANGUAGE_FR = 'french'
    LANGUAGE_DE = 'german'
    LANGUAGE_GR = 'greek'
    LANGUAGE_IN = 'hindi'
    LANGUAGE_HU = 'hungarian'
    LANGUAGE_ID = 'indonesian'
    LANGUAGE_IT = 'italian'
    LANGUAGE_JP = 'japanese'
    LANGUAGE_KR = 'korean'
    LANGUAGE_MY = 'malay'
    LANGUAGE_NO = 'norwegian'
    LANGUAGE_PL = 'polish'
    LANGUAGE_PR = 'portuguese'
    LANGUAGE_RO = 'romanian'
    LANGUAGE_RU = 'russian'
    LANGUAGE_SK = 'slovak'
    LANGUAGE_ES = 'spanish'
    LANGUAGE_SE = 'swedish'
    LANGUAGE_TR = 'turkish'
    LANGUAGE_UA = 'ukrainian'
    LANGUAGE_VN = 'vietnamese'

    LANGUAGE_CHOICES = [
        (LANGUAGE_EN, 'English'),
        (LANGUAGE_SA, 'Arabic'),
        (LANGUAGE_BG, 'Bulgarian'),
        (LANGUAGE_CN, 'Chinese'),
        (LANGUAGE_HR, 'Croatian'),
        (LANGUAGE_CZ, 'Czech'),
        (LANGUAGE_DK, 'Danish'),
        (LANGUAGE_NL, 'Dutch'),
        (LANGUAGE_PH, 'Filipino'),
        (LANGUAGE_FI, 'Finnish'),
        (LANGUAGE_FR, 'French'),
        (LANGUAGE_DE, 'German'),
        (LANGUAGE_GR, 'Greek'),
        (LANGUAGE_IN, 'Hindi'),
        (LANGUAGE_HU, 'Hungarian'),
        (LANGUAGE_ID, 'Indonesian'),
        (LANGUAGE_IT, 'Italian'),
        (LANGUAGE_JP, 'Japanese'),
        (LANGUAGE_KR, 'Korean'),
        (LANGUAGE_MY, 'Malay'),
        (LANGUAGE_NO, 'Norwegian'),
        (LANGUAGE_PL, 'Polish'),
        (LANGUAGE_PR, 'Portuguese'),
        (LANGUAGE_RO, 'Romanian'),
        (LANGUAGE_RU, 'Russian'),
        (LANGUAGE_SK, 'Slovak'),
        (LANGUAGE_ES, 'Spanish'),
        (LANGUAGE_SE, 'Swedish'),
        (LANGUAGE_TR, 'Turkish'),
        (LANGUAGE_UA, 'Ukrainian'),
        (LANGUAGE_VN, 'Vietnamese'),
    ]

    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default=LANGUAGE_EN)


    VOICE_ADAM = 'adam'
    VOICE_ALICE = 'alice'
    VOICE_BILL = 'bill'
    VOICE_BRIAN = 'brian'
    VOICE_CALLUM = 'callum'
    VOICE_CHARLIE = 'charlie'
    VOICE_CHARLOTTE = 'charlotte'
    VOICE_CHRIS = 'chris'
    VOICE_DANIEL = 'daniel'
    VOICE_GEORGE = 'george'
    VOICE_LIAM = 'liam'
    VOICE_LILY = 'lily'
    VOICE_MATILDA = 'matilda'
    VOICE_SARAH = 'sarah'

    VOICE_CHOICES = [
        (VOICE_ADAM, 'Adam'),
        (VOICE_ALICE, 'Alice'),
        (VOICE_BILL, 'Bill'),
        (VOICE_BRIAN, 'Brian'),
        (VOICE_CALLUM, 'Callum'),
        (VOICE_CHARLIE, 'Charlie'),
        (VOICE_CHARLOTTE, 'Charlotte'),
        (VOICE_CHRIS, 'Chris'),
        (VOICE_DANIEL, 'Daniel'),
        (VOICE_GEORGE, 'George'),
        (VOICE_LIAM, 'Liam'),
        (VOICE_LILY, 'Lily'),
        (VOICE_MATILDA, 'Matilda'),
        (VOICE_SARAH, 'Sarah'),
    ]

    voice = models.CharField(max_length=9, choices=VOICE_CHOICES, default=VOICE_ADAM)

    avatar = models.URLField(max_length=200, null=True, blank=True)

class Behaviour(models.Model):
    agent_greeting = models.CharField(
        max_length=250,
        default = "Hello! I am your AI interviewer. Shall we start with basic setup before starting the real journey?"
    )
    agent_prompt = models.TextField(
        default='''
        As an AI interviewer, your role is to conduct an interview by combining candidate's skills and experience and other user's data.
        If the candidate meets the basic requirements for the position, proceed to ask between 3 and 10 relevant questions.
        Evaluate each response based on predefined criteria and accumulate a score.
        If the candidate does not meet initial requirements, gently inform them.
        After all questions are answered, calculate their final score to determine their qualification for the role.
        Provide feedback based on the score, stating whether they are suitable for the position.
        Finally, ensure to clear any session data or memory pertaining to this interview process.'''
    )

class Knowledge(models.Model):

    LLM_GPT4o_mini = "gpt-4o-mini"
    LLM_GPT4o = "gpt-4o"

    LLM_CHOICES = [
        (LLM_GPT4o_mini, 'GPT 4o mini'),
        (LLM_GPT4o, 'GPT 4o'),
    ]

    agent_llm = models.CharField(max_length=11, choices=LLM_CHOICES, default=LLM_GPT4o_mini)
    custom_knowledge = models.TextField(null=False, blank=False)

class KnowledgeFileItem(models.Model):
    file_item = models.FileField(upload_to='files/', null=True, blank=True)
    knowledge = models.OneToOneField(Knowledge, on_delete=models.CASCADE)

    STATUS_INDEX = 'Indexed'
    STATUS_ACTIVE = 'Active'
    STATUS_ERROR = 'Errored'

    STATUS_CHOICES = [
        (STATUS_INDEX, 'Index'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ERROR, 'Error')
    ]
    status_url = models.CharField(
        max_length=7, choices=STATUS_CHOICES, default=STATUS_INDEX, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.file_item:
            self.status_url = self.status_url or self.STATUS_INDEX
        else:
            self.status_url = None

        super().save(*args, **kwargs)


# class KnowledgeFiles(models.Model):
#     knowledge = models.OneToOneField(Knowledge, on_delete=models.CASCADE, related_name='files')

# class KnowledgeFileItem(models.Model):
#     file_item = models.FileField(upload_to='knowledge_files/', null=True, blank=True)
#     knowledge_files = models.ForeignKey(KnowledgeFiles, on_delete=models.CASCADE)

#     STATUS_INDEX = 'Indexed'
#     STATUS_ACTIVE = 'Active'
#     STATUS_ERROR = 'Errored'

#     STATUS_CHOICES = [
#         (STATUS_INDEX, 'Index'),
#         (STATUS_ACTIVE, 'Active'),
#         (STATUS_ERROR, 'Error')
#     ]
#     status_url = models.CharField(
#         max_length=7, choices=STATUS_CHOICES, default=STATUS_INDEX)

class Customer(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

class Agent(models.Model):
    identity = models.OneToOneField(Identity, on_delete=models.CASCADE)
    behaviour = models.OneToOneField(Behaviour, on_delete=models.CASCADE)
    knowledge = models.OneToOneField(Knowledge, on_delete=models.CASCADE)

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='+', blank=False, null = False)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.BooleanField(default=False)

class Applicant(models.Model):
    email = models.EmailField(max_length=70, blank=False)
    name = models.TextField(null=True, blank=True, default = '')
    skills = models.TextField(null=True, blank=True, default = '')
    level = models.TextField(null=True, blank=True, default = '')
    past_experience = models.TextField(null=True, blank=True, default = '')
    impressive_work = models.TextField(null=True, blank=True, default = '')
    excitement = models.TextField(null=True, blank=True, default = '')
    other_information = models.TextField(null=True, blank=True, default = '')

class Session(models.Model):
    order = models.ForeignKey(Order, on_delete = models.CASCADE, related_name='+', blank=False, null = False)
    n_questions = models.IntegerField(default=0)
    get_just_happend = models.BooleanField(default=False)
    last_info_msg_ai = models.TextField(null=True, blank=True, default = '')
    last_info_msg_human = models.TextField(null=True, blank=True, default = '')
    last_question = models.TextField(null=True, blank=True, default = '')
    last_answer  = models.TextField(null=True, blank=True, default = '')

    init = models.BooleanField(default=False)
    ready = models.BooleanField(default=False)

    score = models.FloatField(
        blank=False,
        default=0.0,
        null=False,
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(100.0)
        ]
    )
    final = models.BooleanField(default=False)
    confidence = models.FloatField(
        blank=False,
        default=100.0,
        null=False,
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(100.0)
        ]
    )
    # applicant = models.OneToOneField(Applicant, on_delete=models.CASCADE)
    applicant = models.ForeignKey(Applicant, on_delete = models.CASCADE, related_name='+', blank=False, null = False)
