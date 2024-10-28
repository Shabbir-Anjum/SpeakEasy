from django import forms
from console.models import KnowledgeFileItem

class ModelFormWithFileField(forms.ModelForm):
    class Meta:
        model = KnowledgeFileItem
        fields = ['file_item', 'knowledge_files']
