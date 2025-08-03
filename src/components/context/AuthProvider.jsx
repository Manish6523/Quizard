"use client";
import client from "@/api/client";
// 1. Import the new saveChat function
import {
  generateQuiz,
  saveQuiz,
  saveChat,
  fetchChatById,
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
  const getQuiz = async (prompt, numQuestions, difficulty) => {
    try {
      const response = await generateQuiz(prompt, numQuestions, difficulty);
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
      console.log("Fetched chats:", data);
      return data;
    }
  }

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
    fetchChats
  };

  return (
    <AuthContext.Provider value={{ ...states, ...actions }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
