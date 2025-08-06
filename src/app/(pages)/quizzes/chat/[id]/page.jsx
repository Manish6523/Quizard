"use client";

import { ChatSidebar } from "@/components/ChatSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import useAuth from "@/hook/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  CheckCircle,
  Loader2,
  Settings,
  SendHorizontal,
  Save,
  Paperclip,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import ThemeToggler from "@/components/ThemeToggler";

// Helper component to view a quiz within the chat log.
function QuizViewer({ quizData, onSave, isSaving }) {
  if (!quizData || !quizData.questions) return null;
  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Generated Quiz: {quizData.title}
      </h3>
      {quizData.questions.map((q, qIndex) => (
        <Card key={qIndex} className="shadow-sm mt-4 bg-white dark:bg-zinc-900">
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
                  "flex items-center justify-between p-3 rounded-md border text-sm",
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
      ))}
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
    <div className="flex items-center space-x-3 text-muted border-foreground">
      <div className="w-8 h-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
      <span className="text-primary">Generating...</span>
    </div>
  );
}

// New Skeleton Loader Component
function ChatSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4 animate-pulse">
        <div className="h-9 w-9 rounded-full bg-muted border flex-shrink-0"></div>
        <div className="w-3/4 p-4 rounded-lg bg-muted border">
          <div className="h-4 bg-secondary dark:bg-primary border rounded w-5/6"></div>
          <div className="h-4 bg-secondary dark:bg-primary border rounded w-1/2 mt-2"></div>
        </div>
      </div>
      <div className="flex items-start gap-4 justify-end animate-pulse">
        <div className="w-1/2 p-4 rounded-lg bg-muted border">
          <div className="h-4 bg-secondary dark:bg-primary border rounded w-full"></div>
        </div>
        <div className="h-9 w-9 rounded-full bg-muted border flex-shrink-0"></div>
      </div>
      <div className="flex items-start gap-4 animate-pulse">
        <div className="h-9 w-9 rounded-full bg-muted border flex-shrink-0"></div>
        <div className="w-2/3 p-4 rounded-lg bg-muted border">
          <div className="h-4 bg-secondary dark:bg-primary border rounded w-full"></div>
        </div>
      </div>
      <div className="flex items-start gap-4 justify-end animate-pulse">
        <div className="w-1/2 p-4 rounded-lg bg-muted border">
          <div className="h-4 bg-secondary dark:bg-primary border rounded w-full"></div>
        </div>
        <div className="h-9 w-9 rounded-full bg-muted border flex-shrink-0"></div>
      </div>
      <div className="flex items-start gap-4 animate-pulse">
        <div className="h-9 w-9 rounded-full bg-muted border flex-shrink-0"></div>
        <div className="w-3/4 p-4 rounded-lg bg-muted border">
          <div className="h-4 bg-secondary dark:bg-primary border rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { id } = useParams();
  const {
    getChatById,
    saveChatToSupabase,
    getQuiz,
    saveQuizToSupabase,
    coin,
    fetchChats,
    avatar,
    loading: loadingAuth,
    user,
  } = useAuth();

  const [chatId, setChatId] = useState(id);
  const [messages, setMessages] = useState([]);
  const [chatslist, setchatslist] = useState([]);
  const [userInput, setUserInput] = useState({
    title: "",
    prompt: "",
    numQuestions: "5",
    difficulty: "medium",
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false); // For AI responses
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (chatId) {
        setPageLoading(true);
        const response = await getChatById(chatId);
        if (response && response.success) {
          setChatId(response.chat.id);
          setUserInput((prev) => ({ ...prev, title: response.chat.title }));
          setMessages(response.chat.history || []);
        } else {
          console.error("Failed to fetch chat:", response?.error);
          toast.error("Failed to load chat", {
            description: response?.error,
          });
          router.push("/dashboard/quizzes/new");
        }
        setPageLoading(false);
      } else {
        setPageLoading(false);
      }
    };
    fetchChat();
  }, [chatId, id]);

  useEffect(() => {
    if (!loadingAuth) {
      fetchchatslist();
    }
  }, [loadingAuth]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchchatslist = async () => {
    try {
      const chats = await fetchChats();
      setchatslist(chats);
    } catch (error) {
      console.error("Failed to fetch chats list:", error);
      toast.error("Failed to load chats list");
    }
  };

  const handleSaveChat = async (mes) => {
    if (messages.length === 0) {
      toast.info("There is nothing to save.");
      return;
    }

    setIsSavingChat(true);

    try {
      const response = await saveChatToSupabase({
        messages: mes || messages,
        title: userInput.title || "Untitled Chat",
        chatId: chatId,
      });
      
      fetchchatslist();

      if (response.success && response.chatId) {
        if (!chatId) {
          setChatId(response.chatId);
          router.replace(`/dashboard/quizzes/chat/${response.chatId}`);
        }
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (err) {
      toast.error("Failed to save chat", { description: err.message });
    } finally {
      setIsSavingChat(false);
    }
  };

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

    const userPrompt = {
      role: "user",
      type: "message",
      content: userInput.prompt,
    };

    const currentMessages = [...messages, userPrompt];
    setMessages(currentMessages);
    setLoading(true);
    setUserInput((prev) => ({ ...prev, prompt: "" }));

    try {
      const response = await getQuiz(
        userPrompt.content,
        userInput.numQuestions,
        userInput.difficulty,
        messages
      );

      if (response && response.success) {
        const aiResponse = response.quiz;
        const newMessages = [...currentMessages, aiResponse];
        setMessages(newMessages);
        await handleSaveChat(newMessages);

        if (aiResponse && aiResponse.type === "quiz") {
          toast.success("Quiz generated successfully!");
        }
      } else {
        throw new Error(
          response.error || "Failed to get a response from the AI."
        );
      }
    } catch (error) {
      const errorMessage = {
        role: "ai",
        type: "message",
        content: [{ message: error.message }],
      };
      const newMessages = [...currentMessages, errorMessage];
      setMessages(newMessages);
      await handleSaveChat(newMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async (quizToSave) => {
    if (!quizToSave) return;
    setIsSavingQuiz(true);
    try {
      const response = await saveQuizToSupabase(quizToSave);
      if (response.error) {
        toast.error("Error saving quiz", { description: response.error });
      } else {
        toast.success("Quiz saved successfully!");
        // router.push(`/dashboard/quizzes/edit/${response.quizId}`);
      }
    } catch (error) {
      toast.error("Failed to save quiz", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSavingQuiz(false);
    }
  };

  return (
    <SidebarProvider>
      <ChatSidebar chatslist={chatslist} />
      <SidebarInset>
        <div className="relative flex flex-col h-screen">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b sticky top-0 z-10 bg-background shadow-2xl  backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/quizzes/new">Chat</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    {/* <BreadcrumbPage>{userInput.title || "Chat"}</BreadcrumbPage> */}
                    <input
                      value={userInput.title}
                      onChange={(e) =>
                        setUserInput((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                       onBlur={() => {
                        handleSaveChat();
                        fetchchatslist();
                      }}
                      className="ring-0 outline-0 focus:outline-2 rounded-sm p-1  w-[100px] md:w-[200px] "
                    />
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 mr-5">
              <Badge variant={"outline"}>
                <Coins className="text-amber-500 mr-2 h-4 w-4" />
                {coin}
              </Badge>
              <ThemeToggler />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-6">
            {pageLoading ? (
              <ChatSkeleton />
            ) : (
              <AnimatePresence>
                {messages.map((msg, index) => {
                  const role = msg.role;
                  const type = msg.type;
                  let content = msg.content;
                  let quizContent = msg.data;

                  if (role === "ai" && type === "quiz") {
                    quizContent = {
                      title: userInput.title,
                      questions: msg.content,
                    };
                  }

                  if (
                    role === "ai" &&
                    type === "message" &&
                    Array.isArray(content)
                  ) {
                    content = content[0]?.message;
                  }

                  return (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`flex items-start gap-4 ${
                        role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {role === "ai" && (
                        <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                          <Bot className="w-5 h-5" />
                        </div>
                      )}
                      <div
                        className={`max-w-2xl rounded-lg shadow-sm ${
                          role === "user"
                            ? "bg-primary text-primary-foreground w-fit px-4 py-3"
                            : type === "quiz"
                            ? "bg-muted border w-full p-3"
                            : "bg-muted border w-full px-4 py-3"
                        }`}
                      >
                        {type === "quiz" ? (
                          <QuizViewer
                            quizData={quizContent}
                            onSave={() => handleSaveQuiz(quizContent)}
                            isSaving={isSavingQuiz}
                          />
                        ) : (
                          <p className="text-sm leading-relaxed">{content}</p>
                        )}
                      </div>
                      {role === "user" && (
                        <div className="rounded-full bg-muted border flex-shrink-0">
                          <Avatar>
                            <AvatarImage src={avatar} />
                          </Avatar>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 justify-start"
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="max-w-xl rounded-lg px-4 py-3 bg-muted border shadow-sm">
                  <AiLoader />
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          <AnimatePresence>
            {messages.length > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="fixed bottom-28 left-4 z-30"
              >
                <Button
                  onClick={() => {
                    handleSaveChat();
                  }}
                  variant={"secondary"}
                  disabled={isSavingChat}
                  size={"icon"}
                  className="shadow-lg rounded-full border border-primary hover:-translate-y-1"
                >
                  {isSavingChat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 border-t bg-background/95 backdrop-blur-sm sticky bottom-0 z-20">
            <form onSubmit={handleGenerateQuiz} className="space-y-2">
              <div className="flex items-center gap-2">
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
                  <SheetContent>
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
                    className="resize-none w-full max-h-[40px] bg-background px-4 py-2 pr-24 text-sm ring-0 outline-0"
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
                    className="absolute z-10 right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
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
              {/* <div className="text-xs text-muted border-foreground">
                <span className="font-semibold text-primary">Title: </span>
                <Badge variant={"outline"} className={"ml-1"}>
                  {userInput.title || "Not set"}
                </Badge>
                <Badge variant={"outline"} className={"ml-1"}>
                  {userInput.numQuestions} Qs
                </Badge>
                <Badge variant={"outline"} className={"ml-1"}>
                  {userInput.difficulty}
                </Badge>
              </div> */}
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
