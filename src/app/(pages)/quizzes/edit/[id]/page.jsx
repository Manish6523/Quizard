// app/dashboard/quiz/edit/[id]/page.js

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, PlusCircle, Save, Loader2, ArrowLeft, Zap, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import client from "@/api/client";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import useAuth from "@/hook/useAuth";

// --- Payment Prompt Dialog Component ---
const PaymentPromptDialog = ({ isOpen, onOpenChange }) => {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/payments');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Your current plan allows for a maximum of 10 questions per quiz. Please upgrade to a premium plan to save quizzes with more questions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpgrade}>Upgrade Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// --- Skeleton for Loading State ---
const EditQuizSkeleton = () => ( 
  <div className="space-y-6 container max-w-4xl mx-auto p-6">
    <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
    <Card>
      <CardHeader>
        <div className="h-6 w-1/2 rounded-md bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      </CardContent>
    </Card>
    {Array.from({ length: 2 }).map((_, index) => (
      <Card key={index}>
        <CardHeader>
          <div className="h-5 w-1/3 rounded-md bg-muted animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          <div className="space-y-2 pl-4">
            <div className="h-8 w-3/4 rounded-md bg-muted animate-pulse" />
            <div className="h-8 w-3/4 rounded-md bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function EditQuizPage() {
  const router = useRouter();
  const {user} = useAuth(); 
  const { id: quizId } = useParams(); // Get quiz ID from URL params

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch quiz data on component mount
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;

      setLoading(true);
      const { data, error } = await client
        .from("quiz_sets")
        .select("title, quizzes")
        .eq("id", quizId)
        .single();

      if (error) {
        setError("Failed to fetch quiz details.");
        console.error("Error fetching quiz:", error);
      } else if (data) {
        setTitle(data.title);
        setQuestions(data.quizzes || []);
      }

      setLoading(false);
    };

    fetchQuiz();
  }, [quizId]);

  // --- Handlers for updating state ---

  const handleQuestionTextChange = (qIndex, newText) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].question = newText;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, newText) => {
    const updatedQuestions = [...questions];
    const oldOptionText = updatedQuestions[qIndex].options[oIndex];
    if (updatedQuestions[qIndex].answer === oldOptionText) {
      updatedQuestions[qIndex].answer = newText;
    }
    updatedQuestions[qIndex].options[oIndex] = newText;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, newCorrectAnswerText) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].answer = newCorrectAnswerText;
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (qIndex) => {
    const updatedQuestions = questions.filter((_, index) => index !== qIndex);
    setQuestions(updatedQuestions);
  };
  
  const addQuestion = () => {
    const newQuestion = {
      question: "New Question",
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
    };
    setQuestions([...questions, newQuestion]);
  };

  // --- Save logic ---

  const handleSaveChanges = async () => {
    // Check for free feature limit BEFORE saving
    if (questions.length > 10 && user?.profile?.plan_id == "free") {
      setIsPaymentModalOpen(true);
      return; // Stop the save process
    }

    setSaving(true);
    setError("");

    const { error: saveError } = await client
      .from("quiz_sets")
      .update({
        title: title,
        quizzes: questions,
      })
      .eq("id", quizId);

    if (saveError) {
      setError("Failed to save changes. Please try again.");
      console.error("Save error:", saveError);
      toast.error("Failed to save changes.");
    } else {
      toast.success("Quiz updated successfully!");
      router.push("/dashboard");
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="p-6"><EditQuizSkeleton /></div>;
  }

  return (
    <>
      <PaymentPromptDialog isOpen={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} title={''} />
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 mt-20">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Edit Quiz</h1>
        </div>

        <Card>
          <CardHeader>
            <Label htmlFor="quiz-title" className="text-lg font-semibold">
              Quiz Title
            </Label>
          </CardHeader>
          <CardContent>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl"
              placeholder="Enter the title of your quiz"
            />
          </CardContent>
        </Card>

        {questions.map((q, qIndex) => (
          <Card key={q.id || qIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Question {qIndex + 1}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteQuestion(qIndex)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor={`q-text-${qIndex}`}>Question Text</Label>
              <Textarea
                id={`q-text-${qIndex}`}
                value={q.question}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                placeholder="Enter your question"
                className="text-base"
              />

              <Label>Options (Select the correct one)</Label>
              <RadioGroup
                value={q.answer}
                onValueChange={(newValue) => handleCorrectAnswerChange(qIndex, newValue)}
              >
                {q.options?.map((optionText, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <RadioGroupItem value={optionText} id={`q${qIndex}-o${oIndex}`} />
                    <Input
                      value={optionText}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      className={`flex-1 ${optionText === q.answer ? `border-green-500` : ""}`}
                    />
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={addQuestion}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
          </Button>
          <Button onClick={handleSaveChanges} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </>
  );
}
