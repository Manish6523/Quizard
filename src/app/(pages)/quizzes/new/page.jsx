"use client";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, SendHorizontal, Settings } from "lucide-react";
import { motion } from "framer-motion";
import React, { use, useRef, useState } from "react";
import useAuth from "@/hook/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const Page = () => {
  const { getQuiz, saveChatToSupabase } = useAuth();

  // Ref for the hidden file input
  const fileInputRef = useRef(null);
  const router = useRouter();

  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const numberOfQuestions = [5, 10, 15, 20];

  // State to hold user's input and selections
  const [userInput, setUserInput] = useState({
    prompt: "",
    title: "My Quiz",
    numberOfQuestions: numberOfQuestions[0],
    difficulty: difficultyOptions[0].value,
    file: null,
  });

  const [chat, setChat] = useState([]);

  const [loading, setLoading] = useState(false);


  const handleSend = async () => {
    if (loading || !userInput.prompt) return;
    setLoading(true);

    const history = []

    const response = await getQuiz(
      userInput.prompt,
      userInput.numberOfQuestions,
      userInput.difficulty,
      history
    );

    if (response.success) {

      // Save the chat to Supabase
      let newChat = [
        { role: "user", type: "message", content: userInput.prompt },
        response.quiz,
      ];
      // console.log("New chat to save:", newChat);
      const saveResponse = await saveChatToSupabase({
        messages: newChat,
        title: userInput.title,
      })

      if (saveResponse.success) {
        // console.log("Chat saved successfully:", saveResponse);
      router.push(`/quizzes/chat/${saveResponse.chatId}`);
      }
    } else {
      toast.error("Failed to generate quiz: " + response.error);
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.main
      className="h-[85vh] md:h-screen container mx-auto p-2 flex items-center justify-center flex-col gap-10  md:gap-14"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated header */}
      <motion.header variants={itemVariants} className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-primary font-bold">
          Create Quiz with Quizard...
        </h1>
        <h3 className="text-muted-foreground mt-2 max-w-2xl">
          Provide a topic, upload a document, and let Quizard craft your
          questions.
        </h3>
      </motion.header>

      {/* Animated and responsive section */}
      <motion.section
        variants={itemVariants}
        className="w-full max-w-2xl border bg-secondary rounded-2xl md:rounded-3xl overflow-hidden p-3 shadow-lg"
      >
        <div>
          <textarea
            placeholder="Ask Quizard..."
            className="max-h-[200px] min-h-[40px] sm:min-h-[80px] p-1 pt-3 sm:pt-0 sm:p-3 w-full border-0 bg-secondary outline-0 ring-0 resize-none"
            value={userInput.prompt}
            onChange={(e) =>
              setUserInput({ ...userInput, prompt: e.target.value })
            }
          />
          <div className="sm:hidden flex gap-2 items-center">
            <Badge variant={"outline"} className={"sm:px-3 sm:py-2"}>
              {userInput.difficulty}
            </Badge>
            <Badge variant={"outline"} className={"sm:px-3 sm:py-2"}>
              {userInput.numberOfQuestions} Questions
            </Badge>
          </div>
          {/* Responsive controls for actions */}
          <div className="flex justify-between items-center mt-2 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={(e) =>
                  setUserInput({ ...userInput, file: e.target.files[0] })
                }
              />
              <Button
                variant="outline"
                className="rounded-full"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach File"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Settings Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="Quiz Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Quiz Settings</SheetTitle>
                    <SheetDescription>
                      Customize your quiz settings here. Click save when you're
                      done.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title :
                      </Label>
                      <Input
                        id="title"
                        value={userInput.title}
                        onChange={(e) =>
                          setUserInput({ ...userInput, title: e.target.value })
                        }
                        className="col-span-3"
                        placeholder="E.g., Roman History"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4">
                      <Label className="text-right">Difficulty :</Label>
                      <Select
                        value={userInput.difficulty}
                        onValueChange={(value) =>
                          setUserInput({ ...userInput, difficulty: value })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficultyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4">
                      <Label className="text-right">Questions :</Label>
                      <Select
                        value={userInput.numberOfQuestions.toString()}
                        onValueChange={(value) =>
                          setUserInput({
                            ...userInput,
                            numberOfQuestions: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Questions" />
                        </SelectTrigger>
                        <SelectContent>
                          {numberOfQuestions.map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Questions
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden sm:flex gap-2 items-center">
                <Badge variant={"outline"} className={"sm:px-3 sm:py-2"}>
                  {userInput.difficulty}
                </Badge>
                <Badge variant={"outline"} className={"sm:px-3 sm:py-2"}>
                  {userInput.numberOfQuestions} Questions
                </Badge>
              </div>
            </div>

            <Button
              className="rounded-full"
              size="icon"
              aria-label="Send"
              onClick={handleSend}
              disabled={!userInput.prompt || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.section>
    </motion.main>
  );
};

export default Page;
