import { Livepeer } from "@livepeer/ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Destructure with default value to prevent undefined
    const { prompt = '' } = body;

    // Validate prompt is provided
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Prompt is required and must be a string" 
        },
        { status: 400 }
      );
    }

    // Construct the full prompt
    const fullPrompt = `Write a comprehensive set of interview questions and expected answers for a ${prompt} position. Include:

1. Technical questions specific to ${prompt}
2. Common challenges in ${prompt} roles
3. Best practices in ${prompt}
4. Problem-solving scenarios related to ${prompt}
5. Experience-based questions for ${prompt} positions

Format the response with clear sections for questions and answers.`;

    // Initialize Livepeer client
    const livepeerAI = new Livepeer({
      httpBearer: process.env.LIVEPEER_API,
    });

    // Generate the text with proper parameters
    const result = await livepeerAI.generate.llm({
      prompt: fullPrompt,
      model: "anthropic/claude-2", // Changed from modelId to model
      max_tokens: 1000,            // Changed from maxTokens to max_tokens
      temperature: 0.7,
      detail: {                    // Added required detail object
        type: "interview",
        format: "text",
        style: "professional"
      }
    });

    // Debug log
    console.log("Livepeer API response:", result);

    // Validate response
    if (!result.text) {           // Changed from textResponse to text
      throw new Error("No text generated from the API");
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      text: result.text          // Changed from textResponse to text
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}