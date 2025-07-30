"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  User,
  CheckCircle,
  Paperclip,
  SendHorizontal,
  Settings,
  Loader2,
  Upload,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import useAuth from "@/hook/useAuth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// NOTE: These helper components can be moved to a shared file.
function QuizViewer({ quizData, onSave, isSaving }) {
  if (!quizData || !quizData.questions) return null;
  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Generated Quiz: {quizData.title}
      </h3>
      <div className="space-y-4">
        {quizData.questions.map((q, qIndex) => (
          <motion.div
            key={qIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: qIndex * 0.1 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Question {qIndex + 1}: {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, oIndex) => (
                  <div
                    key={oIndex}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md border text-sm transition-colors",
                      q.answer === opt
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-border"
                    )}
                  >
                    <span>{opt}</span>
                    {q.answer === opt && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full mt-6"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Generated Quiz"}
        </Button>
      )}
    </div>
  );
}

function AiLoader() {
  return (
    <div className="flex items-center space-x-3 text-muted-foreground">
      <div className="w-8 h-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
      <span>Generating your quiz... please wait.</span>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const initialChatId = params.id; // The ID from the URL

  const { getQuiz, saveQuizToSupabase, saveChatToSupabase, getChatById } =
    useAuth();

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // State
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState({
    title: "",
    prompt: "",
    numQuestions: "5",
    difficulty: "medium",
  });
  const [quizData, setQuizData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatId, setChatId] = useState(initialChatId);
  const [isSavingChat, setIsSavingChat] = useState(false);

  // --- DATA FETCHING on initial load ---
  useEffect(() => {
    if (!chatId) {
      setPageLoading(false);
      return;
    }

    const fetchAndSetChat = async () => {
      setPageLoading(true);
      const response = await getChatById(chatId);
      if (response.success && response.chat) {
        setMessages(response.chat.history || []);
        setUserInput((prev) => ({ ...prev, title: response.chat.title }));
      } else {
        toast.error("Failed to load chat", { description: response.error });
        router.push("/dashboard/quizzes/new"); // Redirect if chat not found
      }
      setPageLoading(false);
    };
    fetchAndSetChat();
  }, [chatId]);

  // Scroll to bottom effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handler for saving/updating the chat
  const handleSaveChat = async () => {
    if (messages.length === 0) {
      toast.info("There is nothing to save.");
      return;
    }

    setIsSavingChat(true);
    toast.loading(chatId ? "Updating your chat..." : "Saving your chat...");

    try {
      const response = await saveChatToSupabase({
        messages: messages,
        title: quizData?.title || userInput.title || "My AI Chat",
        chatId: chatId,
      });

      toast.dismiss();

      if (response.success && response.chatId) {
        if (!chatId) {
          setChatId(response.chatId);
          router.replace(`/dashboard/quizzes/chat/${response.chatId}`);
        }
        toast.success("Chat updated successfully!");
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to save chat", { description: err.message });
    } finally {
      setIsSavingChat(false);
    }
  };

  // --- Handlers for input, select, and quiz generation (identical to the 'new' page) ---
  const handleInputChange = (e) =>
    setUserInput((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelectChange = (name, value) =>
    setUserInput((prev) => ({ ...prev, [name]: value }));

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!userInput.prompt) {
      toast.error("Please enter a topic or a question.");
      return;
    }
    const userMessage = userInput.prompt;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setQuizData(null);
    try {
      const response = await getQuiz(
        userInput.prompt,
        userInput.numQuestions,
        userInput.difficulty
      );
      if (response.success === false) {
        toast.error("Generation Failed", { description: response.error });
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: response.error },
        ]);
        return;
      }
      const result = response.quiz;
      if (result && Array.isArray(result) && result.length > 0) {
        if (result[0].question !== null) {
          if (!userInput.title) {
            toast.error("Please set a title for your quiz in the settings.");
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                content: "Please set a title in settings and try again.",
              },
            ]);
            return;
          }
          const generatedQuiz = { title: userInput.title, questions: result };
          setQuizData(generatedQuiz);
          setMessages((prev) => [
            ...prev,
            { role: "ai", type: "quiz", data: generatedQuiz },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "ai", content: result[0].message },
          ]);
        }
      } else {
        toast.error("Invalid Response", {
          description: "The AI returned an unexpected format.",
        });
      }
    } catch (err) {
      toast.error("An Unexpected Error Occurred", {
        description: "Please check the console or try again.",
      });
    } finally {
      setLoading(false);
      setUserInput((prev) => ({ ...prev, prompt: "" }));
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizData) return;
    setIsSaving(true);
    try {
      const response = await saveQuizToSupabase(quizData);
      if (response.error) {
        toast.error("Error saving quiz", { description: response.error });
      } else {
        toast.success("Quiz saved successfully!");
        router.push(`/dashboard/quizzes/edit/${response.quizId}`);
      }
    } catch (error) {
      toast.error("Failed to save quiz", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-5rem)] max-w-2xl lg:max-w-4xl mx-auto">
      {/* Header */}
      {/* <div className="p-4 border-b">
        <h1 className="text-2xl font-bold truncate">
          {userInput.title || "Chat"}
        </h1>
        <p className="text-muted-foreground">
          Continue your conversation or add to your quiz.
        </p>
      </div> */}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "ai" && (
                <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-lg shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground w-fit px-4 py-3"
                    : msg.type === "quiz"
                    ? "bg-muted w-full p-3"
                    : "bg-muted w-full px-4 py-3"
                }`}
              >
                {msg.type === "quiz" ? (
                  <QuizViewer
                    quizData={msg.data}
                    onSave={handleSaveQuiz}
                    isSaving={isSaving}
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="p-2 rounded-full bg-muted flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 justify-start"
          >
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-xl rounded-lg px-4 py-3 bg-muted shadow-sm">
              <AiLoader />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating Save Button */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30"
          >
            <Button
              onClick={handleSaveChat}
              disabled={isSavingChat}
              variant="secondary"
              className="shadow-lg"
            >
              {isSavingChat ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Update Chat
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form Area */}
      <div className="p-4 mb-0 sm:mb-2 border-t sm:border rounded-2xl bg-background/95 backdrop-blur-sm sticky bottom-0 z-20">
        <form onSubmit={handleGenerateQuiz} className="space-y-2">
          <div className="flex items-end gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  type="button"
                  className="flex-shrink-0 rounded-full"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Quiz Settings</SheetTitle>
                  <SheetDescription>
                    Fine-tune the details for your quiz.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 p-4">
                  <div>
                    <Label htmlFor="title" className="mb-2 block">
                      Quiz Title
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={userInput.title}
                      onChange={handleInputChange}
                      placeholder="e.g., 'React Hooks'"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numQuestions" className="mb-2 block">
                        Questions
                      </Label>
                      <Select
                        name="numQuestions"
                        value={userInput.numQuestions}
                        onValueChange={(v) =>
                          handleSelectChange("numQuestions", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty" className="mb-2 block">
                        Difficulty
                      </Label>
                      <Select
                        name="difficulty"
                        value={userInput.difficulty}
                        onValueChange={(v) =>
                          handleSelectChange("difficulty", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="relative flex-1">
              <textarea
                name="prompt"
                value={userInput.prompt}
                onChange={handleInputChange}
                placeholder="Ask Quizard ( 10 coins )"
                className="resize-none w-full max-h-[40px] rounded-full bg-background px-4 py-2 pr-24 text-sm ring-0 outline-0"
                rows={1}
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && userInput.prompt) handleGenerateQuiz(e);
                  }
                }}
              />
              <input
                type="file"
                ref={fileInputRef}
                id="pdf-upload"
                accept="application/pdf"
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute z-10 right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                className="absolute z-10 right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                disabled={loading || !userInput.prompt}
              >
                <>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-4 h-4" />
                  )}
                </>
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground pl-12">
            <span className="font-semibold">Title: </span>
            <Badge variant={"outline"} className={"ml-1"}>
              {userInput.title || "Not set"}
            </Badge>
            <Badge variant={"outline"} className={"ml-1"}>
              {userInput.numQuestions} Qs
            </Badge>
            <Badge variant={"outline"} className={"ml-1"}>
              {userInput.difficulty}
            </Badge>
          </div>
        </form>
      </div>
    </div>
  );
}
