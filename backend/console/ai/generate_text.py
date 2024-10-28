import openai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class AIInterviewer:
    def __init__(self, agent):
        self.agent_prompt = agent.behaviour.agent_prompt
        self.custom_knowledge = agent.knowledge.custom_knowledge
        self.model_name = agent.knowledge.agent_llm

    def generate_next_question(self, text, last_question, n_questions, current_score):
        prompt = f"""
        {self.agent_prompt}
        Custom Knowledge: {self.custom_knowledge}
        Last Question: {last_question}
        Human's Answer: {text}
        Number of Questions Asked: {n_questions}
        Current Score: {current_score}
        Based on the information above, generate the next interview question. The question should be relevant to the previous question and answer, and appropriate for the current stage of the interview (considering the number of questions asked and the current score).
        Be professional, but include some phrases like : "Good", "Not bad", "Let's start then", "Awesome", "Excelent", "Can be better" or something like that before the genrated question.
        Decide the init phrase based on how relevant is Last Question with Human's Answer.
        Next Question:
        """

        response = openai.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are a helpful VOICE assistant that generates interview questions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.6,
        )

        return response.choices[0].message.content.strip()


    def generate_ideal_answer(self, question, user_skills):
        prompt = f"""
        Custom Knowledge: {self.custom_knowledge}
        User Skills: {user_skills}
        Question: {question}
        Based on the custom knowledge and the user's skills, generate an ideal answer to the given question. The answer should be comprehensive and demonstrate the expected knowledge for someone with the specified skills.
        Ideal Answer:
        """

        response = openai.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates ideal answers based on user skills."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.5,
        )

        return response.choices[0].message.content.strip()


    @staticmethod
    def calculate_answer_similarity(ideal_answer, human_answer):
        vectorizer = TfidfVectorizer().fit_transform([ideal_answer, human_answer])
        cosine_sim = cosine_similarity(vectorizer[0:1], vectorizer[1:2])
        return cosine_sim[0][0]

def ai_interviewer(text, session):
    interviewer = AIInterviewer(session.order.agent)

    ideal_answer = interviewer.generate_ideal_answer(session.last_question, session.applicant.skills)
    answer_similarity = AIInterviewer.calculate_answer_similarity(ideal_answer, text)

    question_score = answer_similarity * 100

    if session.n_questions == 0:
        session.score = question_score + 10
        if session.score > 100:
            session.score = 100
    else:
        session.score = (session.score * session.n_questions + question_score + 10) / (session.n_questions + 1)
        if session.score > 100:
            session.score = 100

    session.n_questions += 1

    if session.n_questions >= 10 or (session.n_questions >= 5 and session.score < 50):
        session.final = 1
        next_question = None
    else:
        next_question = interviewer.generate_next_question(
            text=text,
            last_question=session.last_question,
            n_questions=session.n_questions,
            current_score=session.score
        )

    session.save()

    return session.score, next_question
