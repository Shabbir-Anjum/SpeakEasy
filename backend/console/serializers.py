from rest_framework import serializers
from console.models import Agent, Behaviour, Customer, Identity, \
                            Knowledge, KnowledgeFileItem, Order
from django.db import transaction
from django.core.files.base import ContentFile
from django.conf import settings

class IdentitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Identity
        fields = ['agent_name', 'language', 'voice', 'avatar']

    def update(self, instance, validated_data):
        if 'avatar' in validated_data:
            if instance.avatar:
                instance.avatar.delete()
            instance.avatar = validated_data['avatar']

        instance.agent_name = validated_data.get('agent_name', instance.agent_name)
        instance.language = validated_data.get('language', instance.language)
        instance.voice = validated_data.get('voice', instance.voice)

        instance.save()
        return instance

class BehaviourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Behaviour
        fields = ['agent_greeting', 'agent_prompt']

    def update(self, instance, validated_data):
        instance.agent_greeting = validated_data.get('agent_greeting', instance.agent_greeting)
        instance.agent_prompt = validated_data.get('agent_prompt', instance.agent_prompt)

class KnowledgeFileItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeFileItem
        fields = ['file_item']

    def update(self, instance, validated_data):
        if 'file_item' in validated_data:
            instance.file_item.delete()
            instance.file_item = validated_data['file_item']
        instance.save()
        return instance

# class KnowledgeFilesSerializer(serializers.ModelSerializer):
#     knowledge_files_set = KnowledgeFileItemSerializer(many=True, write_only=True)
#     class Meta:
#         model = KnowledgeFiles
#         fields = ['knowledge_files_set']

#     def create(self, validated_data):
#         knowledge_files_set_data = validated_data.pop('knowledge_files_set')
#         instance = KnowledgeFiles.objects.create(**validated_data)
#         for file in knowledge_files_set_data:
#             knowledge_file_item_serializer = KnowledgeFileItemSerializer(data=file)
#             if knowledge_file_item_serializer.is_valid(raise_exception=True):
#                 knowledge_file_item_serializer.save(knowledge_files=instance)
#         return instance

# class KnowledgeSerializer(serializers.ModelSerializer):
#     knowledge_set = KnowledgeFilesSerializer(required=False)
#     class Meta:
#         model = Knowledge
#         fields = ['agent_llm', 'custom_knowledge', 'knowledge_set']

#     def create(self, validated_data):
#         knowledge_files_data = validated_data.pop('knowledge_set', None)
#         knowledge_instance = Knowledge.objects.create(**validated_data)

#         if knowledge_files_data:
#             knowledge_files_serializer = KnowledgeFilesSerializer(data=knowledge_files_data)

#             if knowledge_files_serializer.is_valid():
#                 files_instance = knowledge_files_serializer.save(knowledge = knowledge_instance)

#         return knowledge_instance

class KnowledgeSerializer(serializers.ModelSerializer):
    knowledge_set = KnowledgeFileItemSerializer(required=False)
    class Meta:
        model = Knowledge
        fields = ['agent_llm', 'custom_knowledge', 'knowledge_set']

    def create(self, validated_data):
        knowledge_set_data = validated_data.pop('knowledge_set', None)
        knowledge_instance = Knowledge.objects.create(**validated_data)

        if knowledge_set_data:
            knowledge_file_item_serializer = KnowledgeFileItemSerializer(data=knowledge_set_data)

            if knowledge_file_item_serializer.is_valid():
                file_item_instance = knowledge_file_item_serializer.save(knowledge = knowledge_instance)

        return knowledge_instance

    def update(self, instance, validated_data):
        knowledge_set_data = validated_data.pop('knowledge_set', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if knowledge_set_data:
            if hasattr(instance, 'knowledgefileitem'):
                knowledge_file_item_serializer = KnowledgeFileItemSerializer(instance.knowledgefileitem, data=knowledge_set_data)
            else:
                knowledge_file_item_serializer = KnowledgeFileItemSerializer(data=knowledge_set_data)

            if knowledge_file_item_serializer.is_valid():
                knowledge_file_item_serializer.save(knowledge=instance)

        instance.save()
        return instance

class AgentSerializer(serializers.ModelSerializer):
    identity = IdentitySerializer()
    behaviour = BehaviourSerializer()
    knowledge = KnowledgeSerializer()
    class Meta:
        model = Agent
        fields = ['identity', 'behaviour', 'knowledge']

    def create(self, validated_data):
        identity_data = validated_data.pop('identity')
        behaviour_data = validated_data.pop('behaviour')
        knowledge_data = validated_data.pop('knowledge')

        with transaction.atomic():
            identity_instance = IdentitySerializer.create(IdentitySerializer(), validated_data=identity_data)
            behaviour_instance = BehaviourSerializer.create(BehaviourSerializer(), validated_data=behaviour_data)
            knowledge_instance = KnowledgeSerializer.create(KnowledgeSerializer(), validated_data=knowledge_data)

            agent = Agent.objects.create(
                identity=identity_instance,
                behaviour=behaviour_instance,
                knowledge=knowledge_instance
            )
        return agent

    def update(self, instance, validated_data):
        identity_data = validated_data.pop('identity', None)
        behaviour_data = validated_data.pop('behaviour', None)
        knowledge_data = validated_data.pop('knowledge', None)

        with transaction.atomic():
            if identity_data:
                IdentitySerializer().update(instance.identity, identity_data)
            if behaviour_data:
                BehaviourSerializer().update(instance.behaviour, behaviour_data)
            if knowledge_data:
                KnowledgeSerializer().update(instance.knowledge, knowledge_data)

            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

        return instance

class OrderSerializer(serializers.ModelSerializer):
    agent = AgentSerializer()

    class Meta:
        model = Order
        fields = ['agent']

    def create(self, validated_data):
        agent_data = validated_data.pop('agent')
        user = self.context['request'].user

        if not user.is_authenticated:
            raise serializers.ValidationError("User is not valid")

        with transaction.atomic():
            agent_instance = AgentSerializer.create(AgentSerializer(), validated_data=agent_data)
            customer_instance, created = Customer.objects.get_or_create(user=user)

            order = Order.objects.create(
                agent=agent_instance,
                customer=customer_instance,
                **validated_data
            )
            # avatar_instance = order.agent.identity.avatar
            # if avatar_instance:
            #     _ , avatar_file_name = avatar_instance.name.split('/')
            #     avatar_new_name = f"{order.id}__{avatar_file_name}"

            #     with avatar_instance.open('rb') as f:
            #         avatar_content = f.read()
            #     avatar_instance.delete(save=False)
            #     avatar_instance.save(avatar_new_name, ContentFile(avatar_content), save=False)
            #     order.agent.identity.save()

            try:
                fileitem_instance = order.agent.knowledge.knowledgefileitem.file_item
                if fileitem_instance:
                    _ , fileitem_file_name = fileitem_instance.name.split('/')
                    fileitem_new_name = f"{order.id}__{fileitem_file_name}"

                    with fileitem_instance.open('rb') as f:
                        fileitem_content = f.read()
                    fileitem_instance.delete(save=False)
                    fileitem_instance.save(fileitem_new_name, ContentFile(fileitem_content), save=False)
                    order.agent.knowledge.knowledgefileitem.save()
            except:
                pass
        return order

    def update(self, instance, validated_data):
        agent_data = validated_data.pop('agent')
        user = self.context['request'].user

        if not user.is_authenticated:
            raise serializers.ValidationError("User is not valid")

        with transaction.atomic():
            if agent_data:
                AgentSerializer().update(instance.agent, agent_data)

                avatar_instance = instance.agent.identity.avatar
                if avatar_instance:
                    _ , avatar_file_name = avatar_instance.name.split('/')
                    avatar_new_name = f"{instance.id}__{avatar_file_name}"

                    with avatar_instance.open('rb') as f:
                        avatar_content = f.read()
                    avatar_instance.delete(save=False)
                    avatar_instance.save(avatar_new_name, ContentFile(avatar_content), save=False)
                    instance.agent.identity.save()

                try:
                    fileitem_instance = instance.agent.knowledge.knowledgefileitem.file_item
                    if fileitem_instance:
                        _ , fileitem_file_name = fileitem_instance.name.split('/')
                        fileitem_new_name = f"{instance.id}__{fileitem_file_name}"

                        with fileitem_instance.open('rb') as f:
                            fileitem_content = f.read()
                        fileitem_instance.delete(save=False)
                        fileitem_instance.save(fileitem_new_name, ContentFile(fileitem_content), save=False)
                        instance.agent.knowledge.knowledgefileitem.save()
                except:
                    pass

            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

        return instance


# class GetOrdersSerializer(serializers.ModelSerializer):
#     avatar = serializers.SerializerMethodField()
#     agent_name = serializers.SerializerMethodField()
#     language = serializers.SerializerMethodField()
#     voice = serializers.SerializerMethodField()
#     agent_llm = serializers.SerializerMethodField()
#     number_urls = serializers.SerializerMethodField()

#     class Meta:
#         model = Order
#         fields = [
#                     'avatar',
#                     'id',
#                     'agent_name',
#                     'status',
#                     'language',
#                     'voice',
#                     'agent_llm',
#                     'number_urls'
#         ]

#     def get_avatar(self, order):
#             avatar_field = getattr(order.agent.identity, 'avatar', None)
#             return avatar_field.url if avatar_field else None

#     def get_agent_name(self, order):
#         return getattr(order.agent.identity, 'agent_name', None) if order.agent.identity else None

#     def get_language(self, order):
#         return getattr(order.agent.identity, 'language', None) if order.agent.identity else None

#     def get_voice(self, order):
#         return getattr(order.agent.identity, 'voice', None) if order.agent.identity else None

#     def get_agent_llm(self, order):
#         return getattr(order.agent.knowledge, 'agent_llm', None) if order.agent.knowledge else None

#     def get_number_urls(self, order):
#         try:
#             if order.agent.knowledge.files:
#                 knowledge_file = order.agent.knowledge.files
#                 return knowledge_files.knowledgefileitem_set.count()
#         except AttributeError:
#             return 0

class GetOrdersSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    agent_name = serializers.SerializerMethodField()
    language = serializers.SerializerMethodField()
    voice = serializers.SerializerMethodField()
    agent_llm = serializers.SerializerMethodField()
    status_document = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
                    'avatar',
                    'id',
                    'agent_name',
                    'status',
                    'language',
                    'voice',
                    'agent_llm',
                    'status_document'
        ]

    def get_avatar(self, order):
            avatar_field = getattr(order.agent.identity, 'avatar', None)
            return avatar_field if avatar_field else None

    def get_agent_name(self, order):
        return getattr(order.agent.identity, 'agent_name', None) if order.agent.identity else None

    def get_language(self, order):
        return getattr(order.agent.identity, 'language', None) if order.agent.identity else None

    def get_voice(self, order):
        voice_name = getattr(order.agent.identity, 'voice')
        voice_id = settings.VOICE_MAP.get(voice_name)

        if voice_name and voice_id:
            return {
                'voice_id': voice_id,
                'voice_name': voice_name
            }
        return None

    def get_agent_llm(self, order):
        return getattr(order.agent.knowledge, 'agent_llm', None) if order.agent.knowledge else None

    def get_status_document(self, order):
        try:
            if order.agent.knowledge.knowledgefileitem:
                return order.agent.knowledge.knowledgefileitem.status_url
            return 0
        except AttributeError:
            return 0

class GetOrderSerializer(serializers.ModelSerializer):
    identity = serializers.SerializerMethodField()
    behaviour = serializers.SerializerMethodField()
    knowledge = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
                    'id',
                    'status',
                    'identity',
                    'behaviour',
                    'knowledge'
        ]

    def get_identity(self, order):
        if not hasattr(order, 'agent') or not order.agent:
            return None

        identity_field = getattr(order.agent, 'identity', None)
        if identity_field is None:
            return None

        voice_name = identity_field.voice
        voice_id = settings.VOICE_MAP.get(voice_name)

        return {
            'agent_name': identity_field.agent_name,
            'language': identity_field.language,
            'voice': {
                'voice_id': voice_id,
                'voice_name': voice_name
            },
            'avatar': identity_field.avatar if identity_field.avatar else None
        }

    def get_behaviour(self, order):
        if not hasattr(order, 'agent') or not order.agent:
            return None

        behaviour_field = getattr(order.agent, 'behaviour', None)
        if behaviour_field is None:
            return None

        return {
            'agent_greeting': behaviour_field.agent_greeting,
            'agent_prompt': behaviour_field.agent_prompt
        }

    def get_knowledge(self, order):
        if not hasattr(order, 'agent') or not order.agent:
            return None

        knowledge_field = getattr(order.agent, 'knowledge', None)
        if knowledge_field is None:
            return None

        try:
            item = knowledge_field.knowledgefileitem
            files = [
                {
                    'file_url': item.file_item.url if item.file_item else None,
                    'status': item.status_url
                }
            ]
        except:
            files = []

        return {
            'agent_llm': knowledge_field.agent_llm if knowledge_field.agent_llm else None,
            'custom_knowledge': knowledge_field.custom_knowledge if knowledge_field.custom_knowledge else None,
            'files': files if files else None,
        }

class ManageOrderSerializer(serializers.ModelSerializer):
    pass
