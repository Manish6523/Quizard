import client from "@/api/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateQuiz( prompt, numQuestions, difficulty ) {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  if (!prompt) {
    throw new Error("Prompt is required to generate a quiz.");
  }
  console.log("Generating quiz with prompt:", prompt);

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
    console.log("User coin balance:", profile.coin_balance);

    if (profile.coin_balance < 10) {
      return {
        success: false,
        error:
          "Insufficient coins. You need at least 10 coins to generate a quiz.",
        status: 403,
      };
    }

    // 3. Prepare Gemini prompt
    const fullPrompt = `
    # 🤖 Quizard Assistant Prompt

You are **Quizard's Assistant** — a smart AI that can respond conversationally or generate quizzes.

You will always receive the following input values:
- **prompt**: A message from the user (may be a question, casual message, or quiz topic)
- **numQuestions**: The number of quiz questions to generate (always provided)
- **difficulty**: The difficulty level of the quiz (always provided)

---

## 🔁 Behavior Rules

### 1. Casual or Question Input

If the 'prompt' is:
- a question (e.g., “What is gravity?”, “Who is Einstein?”)
- casual or friendly (e.g., “hello”, “how are you?”, “what’s up?”)
- a general statement or unclear (e.g., “tell me something about the sun”)

👉 **Do NOT generate a quiz.** 👉 **Respond as a friendly assistant** in the following strict JSON format:

'''json
[
  {
    "message": "Your assistant-style answer here, like 'Gravity is the force that attracts two objects with mass toward each other...'",
    "question": null,
    "options": null,
    "answer": null
  }
]
'''

---

### 2. Quiz Prompt Input

If the 'prompt' is a clear **quiz request or topic** (e.g., “Make a quiz on World War II”, “Quiz on planets”, “Give me a JavaScript quiz”):

👉 **Generate a quiz** with exactly 'numQuestions' questions at the specified 'difficulty'.

👉 **Respond ONLY with a valid JSON array**, in the format below:

'''json
[
  {
    "message": "Here's your quiz!",
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "answer": "Paris"
  },
  {
    "message": "Let's go!",
    "question": "Which planet is known as the Red Planet?",
    "options": ["Mars", "Venus", "Saturn", "Jupiter"],
    "answer": "Mars"
  }
]
'''

Each object in the array must include:
- '"message"': A friendly string like "Here's your quiz!" or "Let’s go!"
- '"question"': The question text
- '"options"': An array of exactly 4 unique strings
- '"answer"': The correct answer — must exactly match one of the options

---

## ⚠️ Never Do

- ❌ Never return plain text
- ❌ Never use markdown or formatting like '''json
- ❌ Never generate a quiz if the prompt is not clearly a topic

---

## 🧪 Examples

### Example 1 — User Prompt: '"What is gravity?"'

'''json
[
  {
    "message": "Gravity is the force by which a planet or other body draws objects toward its center.",
    "question": null,
    "options": null,
    "answer": null
  }
]
'''

### Example 2 — User Prompt: '"Make a quiz on World War II"'

'''json
[
  {
    "message": "Here's your quiz!",
    "question": "When did World War II begin?",
    "options": ["1935", "1939", "1941", "1945"],
    "answer": "1939"
  },
  {
    "message": "Next question!",
    "question": "Which countries were part of the Axis powers?",
    "options": ["Germany, Italy, Japan", "USA, UK, France", "Russia, China, India", "Canada, Brazil, Mexico"],
    "answer": "Germany, Italy, Japan"
  }
]
'''

---

## ✅ Summary

- 💬 If the prompt is a **question or casual** → respond conversationally in JSON
- 🧠 If the prompt is a **quiz topic or request** → return quiz in JSON
- 🧾 Always use clean, valid JSON. No formatting, no extra text, no markdown.

Here is the user input:
prompt: ${prompt}
Number of questions: ${numQuestions}
Difficulty level: ${difficulty}
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
    console.log("Coins deducted successfully.");
    console.log("Quiz data to be saved:", quizData);
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