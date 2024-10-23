import { Livepeer } from "@livepeer/ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Destructure with default values to prevent undefined
    const { 
      prompt = '', 
      width = 1024, 
      height = 1024 
    } = body;
    console.log(prompt,'backend')
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
    const fullPrompt = `Create a professional avatar of an interviewer for a ${prompt} with a serious and focused expression. The person should be dressed in formal business attire and positioned at a desk with relevant tools for the role, such as a laptop, notepad, or job-specific equipment. Surrounding elements can include symbols or references related to the job, such as code snippets for IT roles, cooking utensils for chef roles, or design documents for creative roles. The background should reflect a modern interview setting, and the text '${prompt} Interviewer' should be included in a clean, minimalistic font near the avatar. The overall appearance should be professional, authoritative, and suitable for an interview context.`;

    // Initialize Livepeer client
    const livepeerAI = new Livepeer({
      httpBearer: process.env.LIVEPEER_API,
    });

    // Generate the image
    const result = await livepeerAI.generate.textToImage({
      prompt: fullPrompt, // Fixed: changed fullpromt to prompt parameter name
      modelId: "black-forest-labs/FLUX.1-dev",
      width: width,
      height: height,
    });

    // Debug log
    console.log("Livepeer API response:", result);

    // Validate response
    if (!result.imageResponse?.images || result.imageResponse.images.length === 0) {
      throw new Error("No image generated from the API");
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      images: result.imageResponse.images
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