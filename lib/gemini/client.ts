import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API client
const getGenAI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API key is not set!");
    throw new Error("Gemini API key is missing. Please check your .env file.");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Academic Intelligence Engine
 * Uses Gemini for contextual rule explanation and academic reasoning
 */
export class AcademicIntelligenceEngine {
  private model: any;
  private genAI: any;

  constructor() {
    try {
      this.genAI = getGenAI();
      // Don't initialize model here - we'll try different models dynamically
      // This allows us to handle model availability issues gracefully
      this.model = null;
    } catch (error) {
      console.error("Failed to initialize Gemini API client:", error);
      this.model = null;
      this.genAI = null;
    }
  }

  // Helper method to list available models that support generateContent
  private async listAvailableModels(): Promise<string[]> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return [];
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Failed to list models:", response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      // Filter models that support generateContent and exclude embedding models
      const models = data.models
        ?.filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') &&
          !m.name?.includes('embedding') &&
          !m.name?.includes('imagen') &&
          !m.name?.includes('veo') &&
          !m.name?.includes('aqa')
        )
        ?.map((m: any) => m.name?.replace('models/', '')) || [];
      
      // Prioritize newer, stable models
      const prioritized = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-pro-latest',
      ];
      
      // Sort: prioritized first, then others
      const sorted = [
        ...prioritized.filter(m => models.includes(m)),
        ...models.filter(m => !prioritized.includes(m))
      ];
      
      console.log("Available models (filtered):", sorted);
      return sorted.length > 0 ? sorted : models;
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }

  // Helper method to try REST API directly as fallback
  private async tryRestAPI(prompt: string): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // First, try to list available models to see what we can use
    console.log("Attempting to list available models...");
    const availableModels = await this.listAvailableModels();
    
    // Use available models if we got them, otherwise use known working models
    const modelsToTry = availableModels.length > 0 
      ? availableModels.slice(0, 5) // Only try first 5 to avoid too many requests
      : [
          "gemini-2.5-flash",  // Known to work
          "gemini-2.5-pro",
          "gemini-2.0-flash",
          "gemini-flash-latest",
          "gemini-pro-latest",
        ];

    console.log(`Trying ${modelsToTry.length} models via REST API...`);

    for (const model of modelsToTry) {
      try {
        // Try v1beta endpoint first (most common)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        console.log(`Trying REST API with model: ${model}`);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        const responseText = await response.text();
        console.log(`Response status: ${response.status}, Response:`, responseText.substring(0, 200));

        if (response.ok) {
          const data = JSON.parse(responseText);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (text) {
            console.log(`✅ REST API success with model: ${model}`);
            return text;
          } else {
            console.warn(`Model ${model} returned empty text:`, data);
          }
        } else {
          const errorData = JSON.parse(responseText).catch(() => ({ error: responseText }));
          console.warn(`Model ${model} failed (${response.status}):`, errorData);
          
          // If it's a 404, try next model
          if (response.status === 404) {
            continue;
          }
          
          // If it's a 403, might be billing/permissions issue
          if (response.status === 403) {
            throw new Error(`Permission denied (403). Check:\n1. Billing is enabled\n2. API key has correct permissions\n3. Generative Language API is enabled\n\nError: ${JSON.stringify(errorData)}`);
          }
          
          // If it's a 401, API key issue
          if (response.status === 401) {
            throw new Error(`Invalid API key (401). Check your API key in .env file.\n\nError: ${JSON.stringify(errorData)}`);
          }
        }
      } catch (error: any) {
        // If it's a JSON parse error, log the raw response
        if (error.message?.includes("JSON")) {
          console.error(`JSON parse error for ${model}. Raw response might be HTML or error page.`);
        } else {
          console.warn(`REST API error for ${model}:`, error.message);
        }
        // Continue to next model unless it's a critical error
        if (error.message?.includes("Permission denied") || error.message?.includes("Invalid API key")) {
          throw error; // Don't continue if it's a permissions issue
        }
        continue;
      }
    }

    throw new Error("All REST API models failed. Check browser console for detailed errors.");
  }

  /**
   * Explain an academic rule contextually
   */
  async explainRule(ruleType: "UFM" | "Attendance" | "Passing", context?: string): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini API is not configured. Please check your API key in .env file.");
    }

    const prompt = this.buildRuleExplanationPrompt(ruleType, context);
    
    // Try SDK with newer model names that are actually available
    const modelsToTry = [
      "gemini-2.5-flash",  // Newest, most likely to work
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying SDK model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        // Update the default model if this one works
        this.model = model;
        console.log(`✅ Successfully using SDK model: ${modelName}`);
        return text;
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ SDK Model ${modelName} failed:`, error.message);
        // Continue to next model
        continue;
      }
    }
    
    // If SDK fails, try REST API directly
    console.log("SDK failed, trying REST API fallback...");
    try {
      return await this.tryRestAPI(prompt);
    } catch (restError: any) {
      lastError = restError;
      console.error("REST API fallback also failed:", restError);
    }
    
    // If all models failed, throw the last error with helpful message
    console.error("All models failed. Last error details:", {
      message: lastError?.message,
      status: lastError?.status,
      statusText: lastError?.statusText,
      code: lastError?.code,
      stack: lastError?.stack
    });
    
    // Provide specific error messages based on error type
    const errorMessage = lastError?.message || "";
    const errorStatus = lastError?.status || lastError?.code || "";
    
    // Check for billing-related errors
    if (errorMessage.includes("billing") || errorMessage.includes("BILLING_NOT_ENABLED") || errorStatus === 403) {
      throw new Error(`Billing may be required. Please:\n1. Go to Google Cloud Console → Billing\n2. Link a billing account to your project (free tier works)\n3. Some Gemini models require billing to be enabled\n\nError: ${errorMessage}`);
    }
    
    if (errorMessage.includes("API key") || errorMessage.includes("401") || errorStatus === 401) {
      throw new Error("Invalid API key. Please check:\n1. Your API key in .env file is correct\n2. API key has 'Generative Language API' enabled\n3. No extra spaces or quotes in the key");
    }
    
    if (errorMessage.includes("quota") || errorMessage.includes("429") || errorStatus === 429) {
      throw new Error("API quota exceeded. Please try again later or check your quotas in Google Cloud Console.");
    }
    
    if (errorMessage.includes("404") || errorMessage.includes("not found") || errorMessage.includes("not available") || errorStatus === 404) {
      throw new Error(`Model not found. This usually means:\n1. Billing needs to be enabled (even for free tier)\n2. The model name might be incorrect\n\nTry enabling billing:\nhttps://console.cloud.google.com/billing\n\nError details: ${errorMessage}`);
    }
    
    if (errorMessage.includes("PERMISSION_DENIED") || errorStatus === 403) {
      throw new Error("Permission denied. Please check:\n1. Generative Language API is enabled\n2. Your API key has correct permissions\n3. Billing is enabled for your project\n\nEnable billing: https://console.cloud.google.com/billing");
    }
    
    throw new Error(`Failed to get explanation.\n\nError: ${errorMessage}\nStatus: ${errorStatus}\n\nMost likely solution:\n1. Enable billing in Google Cloud Console (free tier works)\n2. Verify API key is correct\n3. Check that Generative Language API is enabled\n\nBilling: https://console.cloud.google.com/billing`);
  }

  /**
   * Analyze previous year questions and extract patterns
   */
  async analyzePYQ(questions: string[], subject?: string): Promise<{
    topics: string[];
    repetitionTrends: string;
    difficultySignals: string;
  }> {
    const prompt = `Analyze these previous year questions and provide:
1. Main topics covered
2. Repetition trends (which topics appear frequently)
3. Difficulty signals (easy/medium/hard patterns)

Questions:
${questions.join("\n\n")}

${subject ? `Subject: ${subject}` : ""}

Provide a structured analysis.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response (simplified - in production, use structured output)
      return {
        topics: this.extractTopics(text),
        repetitionTrends: text,
        difficultySignals: text,
      };
    } catch (error) {
      console.error("Error analyzing PYQ:", error);
      return {
        topics: [],
        repetitionTrends: "Analysis unavailable",
        difficultySignals: "Analysis unavailable",
      };
    }
  }

  /**
   * Explain an academic decision with reasoning
   */
  async explainDecision(decision: string, context: string): Promise<string> {
    const prompt = `As an academic intelligence system, explain this decision contextually:

Decision: ${decision}
Context: ${context}

Provide:
- Why this decision might have been made
- What factors likely influenced it
- What the student should understand about it

Use explain-why logic. Do not be authoritative. Ask clarifying questions if needed.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error explaining decision:", error);
      return "I'm having trouble explaining that decision right now.";
    }
  }

  private buildRuleExplanationPrompt(ruleType: string, context?: string): string {
    const basePrompts = {
      UFM: "Explain the Unfair Means (UFM) policy for college students. What constitutes unfair means? What are the consequences?",
      Attendance: "Explain attendance criteria for college courses. How is attendance calculated? What happens if attendance is low?",
      Passing: "Explain passing criteria for college courses. What are the minimum requirements? How are grades calculated?",
    };

    let prompt = basePrompts[ruleType as keyof typeof basePrompts] || "Explain this academic rule.";
    
    if (context) {
      prompt += `\n\nAdditional context: ${context}`;
    }

    prompt += "\n\nProvide a clear, contextual explanation. Use explain-why logic. Do not be authoritative.";

    return prompt;
  }

  private extractTopics(text: string): string[] {
    // Simple extraction - in production, use structured output or better parsing
    const topicMatches = text.match(/topics?[:\-]\s*([^\n]+)/i);
    if (topicMatches) {
      return topicMatches[1].split(",").map(t => t.trim());
    }
    return [];
  }

  /**
   * Get the examination policy document
   * This will be loaded from Firestore or a file once the PDF is processed
   */
  private getExaminationPolicy(): string {
    // Check environment variable first (for quick setup)
    if (process.env.NEXT_PUBLIC_EXAMINATION_POLICY) {
      return process.env.NEXT_PUBLIC_EXAMINATION_POLICY;
    }
    
    // TODO: Load from Firestore
    // const policy = await getDocument("policies", "examination");
    // return policy?.content || "";
    
    // Return empty if no policy is set - will show error to user
    return "";
  }

  /**
   * Answer questions about MPSTME college's Examination Policy
   */
  async answerExaminationPolicyQuestion(question: string): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini API is not configured. Please check your API key in .env file.");
    }

    const policy = this.getExaminationPolicy();
    
    if (!policy || policy.trim().length === 0) {
      throw new Error("Examination policy document is not loaded. Please contact the administrator.");
    }

    // Build the prompt with policy context and scope checking
    const prompt = `You are an AI assistant helping students understand the Examination Policy of MPSTME (Mukesh Patel School of Technology Management and Engineering) college.

EXAMINATION POLICY DOCUMENT:
${policy}

INSTRUCTIONS:
1. Answer questions ONLY about the Examination Policy of MPSTME college
2. Use the policy document above as your source of information
3. If the question is about examination policy, UFM (Unfair Means), grading, exam rules, or related topics, provide a helpful answer based on the policy
4. If the question is NOT related to examination policy (e.g., about attendance, fees, hostel, general college info), respond with:
   "I'm sorry, but I can only answer questions related to the Examination Policy of MPSTME college. Please ask about examination rules, UFM (Unfair Means), grading, exam schedules, or other examination-related topics."

5. Be clear, concise, and helpful
6. If you're unsure about something, say so rather than making up information
7. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only. For emphasis, you can use capitalization or simple formatting, but avoid **, *, __, _, etc.

STUDENT QUESTION: ${question}

Provide your response in plain text (no markdown formatting):`;

    // Use the same model selection logic as explainRule
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying SDK model for policy question: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        this.model = model;
        return text;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }
    
    // If SDK fails, try REST API
    console.log("SDK failed, trying REST API fallback for policy question...");
    try {
      return await this.tryRestAPI(prompt);
    } catch (restError: any) {
      lastError = restError;
      console.error("REST API fallback also failed:", restError);
    }

    throw new Error(`Failed to get answer: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Answer questions about attendance based on calculated results
   */
  async answerAttendanceQuestion(
    question: string,
    results: any[],
    subjects: any[]
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini API is not configured. Please check your API key in .env file.");
    }

    // Format results for context
    const resultsContext = results.map((r, idx) => {
      const subject = subjects[idx];
      return `Subject: ${r.subject}
- Total Hours: ${r.totalHours}
- Maximum Missable Hours: ${r.maxMissableHours || subject.maxMissableHours}
- Missed Hours: ${r.missedHours}
- Attended Hours: ${r.attendedHours}
- Attendance: ${r.attendancePercent.toFixed(1)}%
- Can Miss More: ${r.canMissMore} hours
- Status: ${r.isEligible ? "Eligible" : "Not Eligible (Exceeded " + (r.maxMissableHours || subject.maxMissableHours) + " hours limit)"}
- Minimum Required: ${subject.minAttendancePercent}%`;
    }).join("\n\n");

    const prompt = `You are an AI assistant helping a student understand their attendance status at MPSTME college.

STUDENT'S ATTENDANCE DATA:
${resultsContext}

ATTENDANCE RULES:
- 100% attendance is expected in all subjects
- Minimum 80% attendance required for most subjects (75% for Placement Training)
- Students below the threshold need re-admission
- Attendance is calculated from semester commencement date

INSTRUCTIONS:
1. Answer questions about the student's attendance status
2. Provide helpful insights and recommendations
3. Explain what they need to do to maintain eligibility
4. Calculate how many more hours they can miss if asked
5. Be clear, supportive, and actionable
6. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only.

STUDENT QUESTION: ${question}

Provide your response in plain text (no markdown formatting):`;

    // Use the same model selection logic
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying SDK model for attendance question: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        this.model = model;
        return text;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }
    
    // If SDK fails, try REST API
    console.log("SDK failed, trying REST API fallback for attendance question...");
    try {
      return await this.tryRestAPI(prompt);
    } catch (restError: any) {
      lastError = restError;
      console.error("REST API fallback also failed:", restError);
    }

    throw new Error(`Failed to get answer: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Generate a detailed summary of attendance results
   */
  async generateAttendanceSummary(
    results: any[],
    subjects: any[]
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini API is not configured. Please check your API key in .env file.");
    }

    // Format results for context
    const resultsContext = results.map((r, idx) => {
      const subject = subjects[idx];
      return `Subject: ${r.subject}
- Total Hours: ${r.totalHours}
- Maximum Missable Hours: ${r.maxMissableHours || subject.maxMissableHours}
- Hours Already Missed: ${r.missedHours}
- Hours Attended: ${r.attendedHours}
- Current Attendance: ${r.attendancePercent.toFixed(1)}%
- Hours Can Still Miss: ${r.canMissMore}
- Status: ${r.isEligible ? "Eligible for exams" : "NOT ELIGIBLE - Exceeded limit"}
- Minimum Required: ${subject.minAttendancePercent}%`;
    }).join("\n\n");

    const prompt = `You are an AI assistant helping a student understand their detailed attendance status at MPSTME college.

STUDENT'S ATTENDANCE DATA:
${resultsContext}

ATTENDANCE RULES:
- 100% attendance is expected in all subjects
- Minimum 80% attendance required for most subjects (75% for Placement Training)
- Students below the threshold or who exceed maximum missable hours need re-admission
- Attendance is calculated from semester commencement date

INSTRUCTIONS:
1. Provide a COMPREHENSIVE and DETAILED summary of the student's attendance status
2. For EACH subject, mention:
   - Current status (eligible/not eligible)
   - Hours missed vs maximum allowed
   - Hours they can still miss
   - Any warnings or concerns
3. Highlight subjects that are at risk or already ineligible
4. Provide actionable recommendations for each subject
5. Give an overall assessment
6. Be supportive but clear about consequences
7. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only.

Provide a detailed, comprehensive summary covering all subjects:`;

    // Use the same model selection logic
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying SDK model for attendance summary: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        this.model = model;
        return text;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }
    
    // If SDK fails, try REST API
    console.log("SDK failed, trying REST API fallback for attendance summary...");
    try {
      return await this.tryRestAPI(prompt);
    } catch (restError: any) {
      lastError = restError;
      console.error("REST API fallback also failed:", restError);
    }

    throw new Error(`Failed to get summary: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Answer questions about the schedule/timetable
   */
  async answerScheduleQuestion(
    question: string,
    timetable: any[]
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini API is not configured. Please check your API key in .env file.");
    }

    // Format timetable for context
    const timetableContext = timetable
      .filter((entry) => entry.type !== "break")
      .map((entry) => {
        return `Day: ${entry.day}
Time: ${entry.time}
Subject: ${entry.subject} (${entry.subjectCode})
Faculty: ${entry.faculty || "TBA"}
Room: ${entry.room || "TBA"}`;
      })
      .join("\n\n");

    const prompt = `You are an AI assistant helping a student with their class schedule at MPSTME college.

STUDENT'S TIMETABLE:
${timetableContext}

INSTRUCTIONS:
1. Answer questions about class timings, room locations, faculty, subjects, and schedule
2. Help students find when a specific class is scheduled
3. Provide information about room locations and faculty
4. Help with schedule-related queries
5. Be helpful, clear, and concise
6. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only.

STUDENT QUESTION: ${question}

Provide your response in plain text (no markdown formatting):`;

    // Use the same model selection logic
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying SDK model for schedule question: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        this.model = model;
        return text;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }
    
    // If SDK fails, try REST API
    console.log("SDK failed, trying REST API fallback for schedule question...");
    try {
      return await this.tryRestAPI(prompt);
    } catch (restError: any) {
      lastError = restError;
      console.error("REST API fallback also failed:", restError);
    }

    throw new Error(`Failed to get answer: ${lastError?.message || "Unknown error"}`);
  }
}

export const academicEngine = new AcademicIntelligenceEngine();
