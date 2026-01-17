
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const HANDLE_QUOTA_ERROR = (error: any) => {
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
    return "The Matchmaker is currently observing a high volume of requests. Compatibility insights will resume shortly.";
  }
  return null;
};

export async function refineBio(currentBio: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Refine this dating bio for a serious marriage-focused platform in Nepal. Make it respectful and authentic: "${currentBio}"`,
      config: {
        systemInstruction: "You are a professional marriage consultant in Nepal.",
      }
    });
    return response.text || currentBio;
  } catch (error) {
    const quotaMsg = HANDLE_QUOTA_ERROR(error);
    if (quotaMsg) return currentBio;
    console.error("Gemini refineBio error:", error);
    return currentBio;
  }
}

export async function getMatchCompatibility(user1: Partial<UserProfile>, user2: UserProfile): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze compatibility between ${user1.name || 'User'} and ${user2.name} for marriage. Consider professions: ${user1.profession} and ${user2.profession}. Keep it under 80 words.`,
      config: {
        systemInstruction: "You are a traditional Nepali Matchmaker. Focus on values and professional compatibility.",
      }
    });
    return response.text || "Compatibility analysis unavailable.";
  } catch (error: any) {
    const quotaMsg = HANDLE_QUOTA_ERROR(error);
    if (quotaMsg) return quotaMsg;
    console.error("Gemini compatibility error:", error);
    return "Pairā insights are currently being refreshed.";
  }
}

export async function getProfileSuggestions(profile: Partial<UserProfile>): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 short profile suggestions for: ${JSON.stringify(profile)}`,
      config: {
        systemInstruction: "Provide actionable profile advice.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return ["Highlight your values", "Add professional details", "Share your hobbies"];
  }
}
