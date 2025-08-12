"use client";
import client from "@/api/client";
// 1. Import the new saveChat function
import {
  generateQuiz,
  saveQuiz,
  saveChat,
  fetchChatById,
  submitQuizAttempt,
} from "@/app/functions";
import { createContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coin, setCoin] = useState(0);
  const [avatar, setAvatar] = useState("");

  const fetchUserWithProfile = async (sessionUser) => {
    try {
      const { data: profileData, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setUser(sessionUser); // fallback to just session user
      } else {
        setUser({ ...sessionUser, profile: profileData });
        setCoin(profileData?.coin_balance);
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      setUser(sessionUser); // fallback
    }
  };

  useEffect(() => {
    // Initial session check
    client.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user || null;
      if (sessionUser) {
        setAvatar(sessionUser?.user_metadata?.avatar_url || "");
        await fetchUserWithProfile(sessionUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = client.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user || null;
        if (sessionUser) {
          await fetchUserWithProfile(sessionUser);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const refetchUser = async () => {
    setLoading(true);
    const { data } = await client.auth.getSession();
    const sessionUser = data.session?.user || null;
    if (sessionUser) {
      await fetchUserWithProfile(sessionUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const fetchCoinBalance = async () => {
    if (!user) return;
    try {
      const { data: profileData, error } = await client
        .from("profiles")
        .select("coin_balance")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching coin balance:", error);
      } else {
        setCoin(profileData?.coin_balance || 0);
      }
    } catch (err) {
      console.error("Unexpected error fetching coin balance:", err);
    }
  };

  // ?------ Run function to fetch apis ------
  const getQuiz = async (prompt, numQuestions, difficulty, history) => {
    try {
      const response = await generateQuiz(
        prompt,
        numQuestions,
        difficulty,
        history
      );
      fetchCoinBalance(); // Update coin balance after generating quiz
      return response;
    } catch (error) {
      console.error("Error generating quiz:", error);
      throw error;
    }
  };

  const saveQuizToSupabase = async (quizData) => {
    try {
      const response = await saveQuiz(quizData);
      return response;
    } catch (error) {
      console.error("Error saving quiz:", error);
      throw error;
    }
  };

  const saveChatToSupabase = async ({ messages, title, chatId }) => {
    try {
      // Pass the optional chatId to the server function
      const response = await saveChat({ messages, title, chatId });
      return response;
    } catch (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  };
  const getChatById = async (chatId) => {
    try {
      const response = await fetchChatById(chatId);
      return response;
    } catch (error) {
      console.error("Error fetching chat:", error);
      throw error;
    }
  };

  // ?------ Run function for supabase ------
  const handleSignOut = async () => {
    try {
      await client.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const fetchQuizzes = async () => {
    if (!user) return;

    // Fetch quizzes from the 'quiz_sets' table
    const { data, error } = await client
      .from("quiz_sets")
      .select("id, title, status, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quizzes:", error);
    } else {
      return data;
    }
  };

  const deleteQuizById = async (quizId) => {
    if (!user) return;

    // Delete quiz from the 'quiz_sets' table
    const { error } = await client
      .from("quiz_sets")
      .delete()
      .eq("id", quizId)
      .eq("creator_id", user.id);

    if (error) {
      console.error("Error deleting quiz:", error);
    } else {
      return { success: true, MessageChannel };
    }
  };

  const fetchChats = async () => {
    if (!user) return;

    const { data, error } = await client
      .from("chats")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
    } else {
      // console.log("Fetched chats:", data);
      return data;
    }
  };
  // ?------ Run quizzes function for supabase ------
  const fetchQuizById = async (quizId) => {
    try {
      if (!user) return { error: "You must be logged in to fetch a quiz." };
      const { data: quizData, error: quizError } = await client
        .from("quiz_sets")
        .select("id, title, quizzes,settings,creator_id") // Select the quizzes column
        .eq("id", quizId)
        .single();

      if (quizError || !quizData) {
        return { error: "Quiz not found or permission denied." };
      }

      // The quiz object now directly contains the quizzes (questions)
      return { success: true, quiz: quizData };
    } catch (error) {
      console.error("Unexpected error in fetchQuizById:", error);
      return { error: "An unexpected error occurred." };
    }
  };

  const submitQuizResult = async ({
    quizId,
    participantName,
    score,
    submittedAnswers,
  }) => {
    try {
      const response = await submitQuizAttempt({
        quizId,
        participantName,
        score,
        submittedAnswers,
      });

      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (error) {
      console.error("Error in submitQuizAttempt wrapper:", error);
      return { error: error.message };
    }
  };

  // ?------ update settings ------
  const updateQuizSettings = async ({ quizId, settings, status }) => {
    if (!user) return { error: "You must be logged in to update settings." };
    if (!quizId) return { error: "Quiz ID is required." };

    try {
      const { error } = await client
        .from("quiz_sets")
        .update({
          settings: settings,
          status: status,
        })
        .eq("id", quizId)
        .eq("creator_id", user.id); // Security check

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating quiz settings:", error);
      return { error: "Failed to update the quiz settings." };
    }
  };

  // ?------ analytics functions ------
  const fetchQuizAnalytics = async (quizId) => {
    if (!user) return { error: "You must be logged in to view analytics." };
    if (!quizId) return { error: "Quiz ID is required." };

    try {
      // Fetch the quiz and all of its attempts, now including the new fields
      const { data, error } = await client
        .from("quiz_sets")
        .select(
          `
          title,
          quizzes, 
          quiz_attempts (
            participant_name,
            score,
            created_at,
            user_id,
            submitted_answers
          )
        `
        )
        .eq("id", quizId)
        .eq("creator_id", user.id) // Security: Ensures only the creator can see results
        .single();

      if (error) {
        throw error;
      }

      return { success: true, analytics: data };
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      return { error: "Failed to load quiz analytics." };
    }
  };

  const fetchOverallAnalytics = async () => {
    try {
      if (!user) return { error: "You must be logged in." };

      const { data, error } = await client
        .from("quiz_sets")
        .select(
          `
        id,
        title,
        quizzes,
        quiz_attempts (
          score
        )
      `
        )
        .eq("creator_id", user.id);

      if (error) throw error;
      return { success: true, allQuizzes: data };
    } catch (error) {
      console.error("Error fetching overall analytics:", error);
      return { error: "Failed to load overall quiz analytics." };
    }
  };

  const states = { user, loading, coin, avatar };
  const actions = {
    refetchUser,
    handleSignOut,
    getQuiz,
    saveQuizToSupabase,
    fetchQuizzes,
    deleteQuizById,
    getChatById,
    saveChatToSupabase,
    fetchChats,
    fetchQuizById,
    submitQuizResult,
    updateQuizSettings,
    fetchQuizAnalytics,
    fetchOverallAnalytics
  };

  return (
    <AuthContext.Provider value={{ ...states, ...actions }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
