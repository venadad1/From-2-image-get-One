import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio, ImageQuality } from "../types";
import { MODEL_STANDARD, MODEL_HIGH_RES } from "../constants";

export const generateMergedImage = async (
  image1Base64: string,
  image1Mime: string,
  image2Base64: string,
  image2Mime: string,
  prompt: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Helper function to execute the request with a specific model
  const makeRequest = async (model: string) => {
    const imageConfig: any = {
      aspectRatio: aspectRatio,
    };

    // Only add imageSize if using the Pro model (Flash Image doesn't support it)
    if (model === MODEL_HIGH_RES) {
      imageConfig.imageSize = "2K";
    }

    return await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `Merge these two images into one based on this description: ${prompt}. Ensure the result is a single cohesive image.`
          },
          {
            inlineData: {
              mimeType: image1Mime,
              data: image1Base64,
            },
          },
          {
            inlineData: {
              mimeType: image2Mime,
              data: image2Base64,
            },
          },
        ],
      },
      config: {
        imageConfig: imageConfig,
      },
    });
  };

  // Helper to extract the image string from the response
  const extractImageFromResponse = (response: GenerateContentResponse): string => {
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Check for text feedback (refusal or error explanation from model)
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
       throw new Error(response.candidates[0].content.parts[0].text);
    }

    throw new Error("No image generated. The model might have refused the request.");
  };

  // Determine initial target model
  const isHighRes = quality === ImageQuality.HIGH;
  const initialModel = isHighRes ? MODEL_HIGH_RES : MODEL_STANDARD;

  try {
    try {
      // Attempt generation with the selected model
      const response = await makeRequest(initialModel);
      return extractImageFromResponse(response);
    } catch (firstError: any) {
      // Check for Permission Denied (403) or Not Found (404) errors
      const isPermissionOrNotFoundError = 
        firstError.status === 403 || 
        firstError.status === 404 || 
        firstError.message?.includes("PERMISSION_DENIED") || 
        firstError.message?.includes("403");
      
      // If we were trying High Res and it failed with permissions, retry with Standard
      if (isHighRes && isPermissionOrNotFoundError) {
        console.warn(`High Res model (${MODEL_HIGH_RES}) failed with permission/access error. Falling back to Standard (${MODEL_STANDARD}).`);
        
        const fallbackResponse = await makeRequest(MODEL_STANDARD);
        return extractImageFromResponse(fallbackResponse);
      }
      
      // If it wasn't a recoverable permission error on High Res, rethrow
      throw firstError;
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // specific error mapping for UI clarity
    if (error.status === 403 || error.message?.includes("PERMISSION_DENIED")) {
      throw new Error("Permission denied. The API key does not have access to the generative AI models. Please check that the API key is valid and the API is enabled in your Google Cloud project.");
    }
    
    throw error;
  }
};