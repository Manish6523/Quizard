import client from "@/api/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateQuiz(prompt, numQuestions, difficulty, history) {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  if (!prompt) {
    throw new Error("Prompt is required to generate a quiz.");
  }

  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY."
    );
  }

  try {
    // 1. Get user session
    const { data } = await client.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) {
      return {
        success: false,
        error: "Please log in to generate a quiz.",
        status: 401,
      };
    }

    // 2. Fetch coin balance
    const { data: profile, error: balanceError } = await client
      .from("profiles")
      .select("coin_balance")
      .eq("id", sessionUser.id)
      .single();

    if (balanceError || !profile) {
      console.error("Error fetching coin balance:", balanceError);
      return {
        success: false,
        error: "Failed to fetch user coin balance.",
        status: 500,
      };
    }

    if (profile.coin_balance < 10) {
      return {
        success: false,
        error:
          "Insufficient coins. You need at least 10 coins to generate a quiz.",
        status: 403,
      };
    }
    const Convertedhistory = JSON.stringify(
      history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    // 3. Prepare Gemini prompt
    const fullPrompt = `You are Quizard's Assistant, a helpful AI that generates quizzes or engages in conversation.

Your primary task is to analyze the user's latest prompt along with the context of the previous conversation and return a single, valid JSON object.

---
## CONTEXT: PREVIOUS MESSAGES

Here is the history of the conversation so far. Use this to understand follow-up requests or context. If the history is empty, this is the start of the conversation.

${Convertedhistory}

---
## TASK: ANALYZE THE LATEST PROMPT

User's latest prompt: "${prompt}"

Based on this prompt and the conversation history, decide the continuation statement [
like 1st who is spiderman --> your Response should be a message with a brief description of spiderman,
suppose next user prompt is "its suits color" then your response should continue this statement with a message like "Spiderman's suit is red and blue."
]
 on one of the following two actions:

### Action 1: Respond Conversationally
If the prompt is a casual message (e.g., "hello", "how are you?"), a general question (e.g., "what is photosynthesis?"), or a follow-up that isn't a quiz request.

👉 **Your Response Format:**
'''json
{
  "type": "message",
  "role": "ai",
  "content": [
    {
      "message": "Your helpful, conversational response goes here."
    }
  ]
}
'''

### Action 2: Generate a Quiz
If the prompt is a clear request for a quiz (e.g., "make a quiz on World War II", "quiz me on space").

👉 **Quiz Parameters:**
- Number of Questions: ${numQuestions}
- Difficulty: ${difficulty}

👉 **Your Response Format:**
'''json
{
  "type": "quiz",
  "role": "ai",
  "content": [
    {
      "message": "First question",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "..."
    },
    {
      "message": "Next question!",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "..."
    }
  ]
}
'''

---
##  STRICT RULES

1.  **ALWAYS respond with a single, valid JSON object.** Do NOT include any text, explanations, or markdown (like \`\`\`json) outside of the JSON object.
2.  The root JSON object MUST have a "type" field ("message" or "quiz") and a "role" field ("ai").
3.  For quizzes, the "content" array must contain exactly ${numQuestions} objects.
4.  For quizzes, each question object must have "message", "question", "options" (an array of 4 strings), and "answer". The "answer" must be one of the strings from "options".
5.  For messages, the "content" array must contain exactly one object with a "message" string.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // 4. Call Gemini model
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const responseContent = response.text();

    // 5. Parse AI response
    let quizData;
    try {
      quizData = JSON.parse(responseContent);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      throw new Error("The AI returned an invalid format. Please try again.");
    }

    // 6. Deduct coins after successful quiz generation
    const { error: updateError } = await client
      .from("profiles")
      .update({ coin_balance: profile.coin_balance - 10 })
      .eq("id", sessionUser.id);

    if (updateError) {
      console.error("Error deducting coins:", updateError);
      return {
        success: false,
        error:
          "Quiz generated, but failed to deduct coins. Please contact support.",
        status: 500,
        quiz: quizData,
      };
    }
    // 7. Return quiz
    return {
      success: true,
      quiz: quizData,
      newBalance: profile.coin_balance - 10,
    };
  } catch (error) {
    console.error("Unexpected error in generateQuiz:", error);
    throw new Error("An unexpected error occurred while generating the quiz.");
  }
}

export async function saveQuiz(quizData) {
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    return { error: "You must be logged in to save a quiz." };
  }

  const { data: quizSet, error } = await client
    .from("quiz_sets")
    .insert({
      title: quizData.title,
      creator_id: user.id,
      quizzes: quizData.questions, // Save the questions array here
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving quiz:", error);
    return { error: "Failed to create the quiz." };
  }

  // 3. Return the new quiz ID for redirection
  return { success: true, quizId: quizSet.id };
}

// ⭐️ REVISED saveChat function ⭐️
export async function saveChat({ messages, title, chatId = null }) {
  try {
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { error: "You must be logged in." };

    const chatData = {
      user_id: user.id,
      title: title || "Untitled Chat",
      history: messages, // Store the entire message array in the JSONB column
    };

    let responseData;
    let responseError;

    if (chatId) {
      // --- UPDATE existing chat ---
      const { data, error } = await client
        .from("chats")
        .update(chatData)
        .eq("id", chatId)
        .eq("user_id", user.id) // Ensure user can only update their own chat
        .select("id")
        .single();
      responseData = data;
      responseError = error;
    } else {
      // --- INSERT new chat ---
      const { data, error } = await client
        .from("chats")
        .insert(chatData)
        .select("id")
        .single();
      responseData = data;
      responseError = error;
    }

    if (responseError) throw responseError;

    return { success: true, chatId: responseData.id };
  } catch (error) {
    console.error("Unexpected error in saveChat:", error);
    return { error: "An unexpected error occurred while saving the chat." };
  }
}

// ⭐️ REVISED fetchChatById function ⭐️
export async function fetchChatById(chatId) {
  try {
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { error: "You must be logged in." };

    const { data: chatData, error: chatError } = await client
      .from("chats")
      .select("id, title, history") // Select the history column
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (chatError || !chatData) {
      return { error: "Chat not found or permission denied." };
    }

    // The chat object now directly contains the history (messages)
    return { success: true, chat: chatData };
  } catch (error) {
    console.error("Unexpected error in fetchChatById:", error);
    return { error: "An unexpected error occurred." };
  }
}
