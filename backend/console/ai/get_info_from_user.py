import openai

def get_information(text, info):
    prompt = f"""
    You are an assistant tasked with extracting specific information from a user's text.
    The user has provided the following text: {text}

    Please provide a **short summary** of the user's {info}. If the information is missing, return "Information about {info} is missing."
    """

    response = openai.chat.completions.create(
        model = "gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an assistant that searches for specific information in a text and provides a short summary."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.0,
    )

    return response.choices[0].message.content.strip()
