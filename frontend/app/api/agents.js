import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER;

export const fetchAgents = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/console/list`, {
      headers: {
        "User-Agent": "insomnia/9.3.2",
        Authorization: `JWT ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch agents');
  }
};

export const fetchAgentTalk = async (agentId, token, text) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/console/talk/${agentId}/`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "insomnia/9.3.2",
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify({"email":"mahrshabbir768@gmail.com","human_text": text }),
        });
        return response;
      } catch (error) {
        console.error('Error sending audio to backend:', error);
      }
      
};

export const generateSpeech = async (text, selectedVoice, XI_API_KEY) => {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}/stream`,
      {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': XI_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to generate speech');
  }
};

export const createAgent = async (formData, token) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/console/create/`,
      {
        method: 'POST',
        headers: {
          "User-Agent": "insomnia/9.3.2",
          Authorization: `JWT ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create agent');
    }

    return await response.json();
  } catch (error) {
    throw new Error('Failed to create agent: ' + error.message);
  }
};