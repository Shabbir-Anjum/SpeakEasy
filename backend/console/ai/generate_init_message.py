import openai

def generate_next_init_question(last_info_msg_ai, init, applicant, input):
    prompt = f"""
    ASK IF USER IS READY: {init}
    USER NAME : {applicant.name}
    THIS IS THE LAST MESSAGE YOU SAID TO THE USER: {last_info_msg_ai}

    YOUR TASK: Some user data is missing, you need to ask the user for information about his : {input}

    Based on the user data above, generate the next question where you will ask the user to provide you with information that is missing, in this case that is {input}.
    DO NOT INCLUDE ANY GREETING TO THE USER, be professional. If there is an information about user name, use the name when you are asking the user with further questions.
    Also note that you are VOICE assistant, so talk like real human who is an interviewer and you are asking the user with basic questions to get information about him.

    If ASK IF USER IS READY is equal to 1, ask the user to tell you when he is ready to start with the interview.
    Next Question:
    """

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates pre-interview questions. You are still not started with the interview."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=400,
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()
