/**
 * Test script to verify Gemini API key and list available models
 * Run this in browser console or as a test endpoint
 */

export async function testGeminiAPI() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ API key not found in environment variables");
    return;
  }

  console.log("🔑 API Key found (first 10 chars):", apiKey.substring(0, 10) + "...");
  
  // Test 1: List available models
  console.log("\n📋 Test 1: Listing available models...");
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();
    
    if (listResponse.ok) {
      const models = listData.models?.map((m: any) => m.name) || [];
      console.log("✅ Available models:", models);
      return models;
    } else {
      console.error("❌ Failed to list models:", listData);
      return null;
    }
  } catch (error) {
    console.error("❌ Error listing models:", error);
    return null;
  }
}

// Test 2: Try a simple generation
export async function testGeminiGeneration() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "API key not found" };
  }

  console.log("\n🧪 Test 2: Testing content generation...");
  
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ];

  for (const model of modelsToTest) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Say hello in one word" }]
          }]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`✅ Model ${model} works! Response:`, text);
        return { success: true, model, text };
      } else {
        console.warn(`❌ Model ${model} failed:`, data);
      }
    } catch (error: any) {
      console.warn(`❌ Model ${model} error:`, error.message);
    }
  }

  return { success: false, error: "All models failed" };
}
