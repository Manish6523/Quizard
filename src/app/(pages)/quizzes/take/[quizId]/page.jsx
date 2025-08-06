"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw, Loader2, Clock, ShieldCheck, Calculator } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import useAuth from "@/hook/useAuth";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


// Timer Component
const CountdownTimer = ({ seconds, onTimeUp, timerKey }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        setTimeLeft(seconds); // Reset timer when the key (e.g., question index) changes
    }, [seconds, timerKey]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;

    return (
        <Badge variant={timeLeft < 60 ? "destructive" : "secondary"} className="text-base sm:text-lg tabular-nums">
            <Clock className="mr-2 h-4 w-4" />
            {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
        </Badge>
    );
};

// Simple Calculator Component
const OnScreenCalculator = () => {
    const [display, setDisplay] = useState('');
    const handleInput = (value) => setDisplay(prev => prev + value);
    const calculateResult = () => {
        try {
            const result = new Function('return ' + display)();
            setDisplay(String(result));
        } catch (error) {
            setDisplay('Error');
        }
    };
    return (
        <div className="p-2 space-y-2">
            <Input readOnly value={display} className="text-right text-2xl font-mono h-12 mb-2"/>
            <div className="grid grid-cols-4 gap-2">
                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                    <Button key={btn} variant="outline" className="h-12 text-lg" onClick={() => btn === '=' ? calculateResult() : handleInput(btn)}>{btn}</Button>
                ))}
                <Button variant="destructive" className="col-span-4 h-12 text-lg" onClick={() => setDisplay('')}>Clear</Button>
            </div>
        </div>
    );
}

export default function TakeQuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participantName, setParticipantName] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const { quizId } = useParams();
  const { user, loading: authLoading, fetchQuizById, submitQuizResult } = useAuth();

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) return;
      setLoading(true);
      try {
        const response = await fetchQuizById(quizId);
        if (response.error) {
          toast.error("Failed to load quiz", { description: response.error });
          setQuiz(null);
        } else {
          const now = new Date();
          const settings = response.quiz.settings;
          const startDate = settings?.availabilityWindow?.start ? new Date(settings.availabilityWindow.start) : null;
          const endDate = settings?.availabilityWindow?.end ? new Date(settings.availabilityWindow.end) : null;

          if (startDate && now < startDate) {
            toast.error("This quiz is not yet available.", { description: `It will open on ${startDate.toLocaleString()}.` });
            setQuiz(null);
          } else if (endDate && now > endDate) {
            toast.error("This quiz has already ended.", { description: `It closed on ${endDate.toLocaleString()}.` });
            setQuiz(null);
          } else {
            setQuiz(response.quiz);
            setSelectedAnswers(new Array(response.quiz.quizzes.length).fill(null));
            if (!response.quiz.settings?.accessCode) {
              setIsCodeVerified(true);
            }
            if (response.quiz.settings?.oneAttemptPerPerson) {
              const attemptedQuizzes = JSON.parse(localStorage.getItem("quizAttempts")) || {};
              if (attemptedQuizzes[quizId]) {
                  setHasAttempted(true);
                  toast.warning("You have already completed this quiz.");
              }
            }
          }
        }
      } catch (error) {
        toast.error("An error occurred while loading the quiz.");
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchQuizData();
    }
  }, [quizId, authLoading, fetchQuizById]);

  const currentQuestionData = useMemo(() => {
    if (!quiz) return null;
    const question = quiz.quizzes[currentQuestion];
    const options = quiz.settings?.shuffleAnswers ? [...question.options].sort(() => Math.random() - 0.5) : question.options;
    return { ...question, options };
  }, [quiz, currentQuestion]);

  const handleAnswerSelect = (value) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = value;
    setSelectedAnswers(newAnswers);
  };

  const calculateScore = () => {
    return quiz.quizzes.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.answer ? 1 : 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const score = calculateScore();

    try {
      const response = await submitQuizResult({
        quizId: quiz.id,
        participantName: participantName,
        score: score,
        submittedAnswers: selectedAnswers,
      });

      if (response.error) {
        toast.error("Submission Failed", { description: response.error });
      } else {
        toast.success("Your results have been saved!");
        if (quiz.settings?.oneAttemptPerPerson) {
            const attemptedQuizzes = JSON.parse(localStorage.getItem("quizAttempts")) || {};
            attemptedQuizzes[quizId] = true;
            localStorage.setItem("quizAttempts", JSON.stringify(attemptedQuizzes));
        }
        setShowResults(true);
      }
    } catch (error) {
      toast.error("An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.quizzes.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    const attemptedQuizzes = JSON.parse(localStorage.getItem("quizAttempts")) || {};
    delete attemptedQuizzes[quizId];
    localStorage.setItem("quizAttempts", JSON.stringify(attemptedQuizzes));
    
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.quizzes.length).fill(null));
    setShowResults(false);
    setIsStarted(false);
    setParticipantName("");
    setAccessCodeInput("");
    setIsCodeVerified(!quiz.settings?.accessCode);
    setHasAttempted(false);
  };
  
  const handleStartQuiz = () => {
    if (!participantName.trim()) {
        toast.error("Please enter your name to start the quiz.");
        return;
    }
    setIsStarted(true);
  };

  const handleVerifyAccessCode = () => {
      if (accessCodeInput === quiz.settings.accessCode) {
          toast.success("Access code verified!");
          setIsCodeVerified(true);
      } else {
          toast.error("Invalid access code.");
      }
  }

  const getScoreColor = (score) => {
    const percentage = (score / quiz.quizzes.length) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading || authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!quiz) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Quiz Not Found</CardTitle></CardHeader>
          <CardContent><p>This quiz could not be found or is no longer available.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="flex items-center justify-center p-4 pt-30">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription>This quiz has {quiz.quizzes.length} questions.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isCodeVerified ? (
              <div className="space-y-4">
                <Label htmlFor="accessCode">This quiz requires an access code.</Label>
                <Input id="accessCode" placeholder="Enter Access Code" value={accessCodeInput} onChange={(e) => setAccessCodeInput(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">Please enter your name to begin.</p>
                <Input placeholder="Your Name" value={participantName} onChange={(e) => setParticipantName(e.target.value)} disabled={hasAttempted} />
                {hasAttempted && <p className="text-sm text-red-500 mt-2">You have already completed this quiz.</p>}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {!isCodeVerified ? (
              <Button className="w-full" onClick={handleVerifyAccessCode}>Verify Code</Button>
            ) : (
              <Button className="w-full" onClick={handleStartQuiz} disabled={!participantName.trim() || hasAttempted}>Start Quiz</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / quiz.quizzes.length) * 100);

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 mt-12 sm:mt-22">
        <Card className={"bg-transparent border-0 shadow-none"}>
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl">Quiz Results for {participantName}</CardTitle>
            <CardDescription>{quiz.settings.feedbackAndResults?.customCompletionMessage || `Here's how you performed on the ${quiz.title} quiz`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <div className="text-center space-y-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold ${getScoreColor(score)}`}>
                {score}/{quiz.quizzes.length}
              </div>
              <div>
                <div className="text-3xl font-bold">{percentage}%</div>
                <div className="text-muted-foreground">Score</div>
              </div>
            </div>
            
            {quiz.settings.feedbackAndResults?.showCorrectAnswers && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Question Breakdown</h3>
                {quiz.quizzes.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.answer;

                  return (
                    <Card key={index} className="border-l-4" style={{ borderLeftColor: isCorrect ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)" }}>
                      <CardHeader>
                        <div className="flex items-start gap-2">
                          {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1">
                            <CardTitle className="text-sm">{question.question}</CardTitle>
                            {quiz.settings.feedbackAndResults?.showAnswerExplanations && (
                                <div className="mt-2 text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <span className="font-semibold">Explanation: </span>
                                    <span>{question.explanation || "No explanation provided."}</span>
                                </div>
                            )}
                            <div className="mt-2 space-y-1">
                              <div className="text-sm"><span className="font-medium text-green-600">Correct: </span><span>{question.answer}</span></div>
                              {!isCorrect && (<div className="text-sm"><span className="font-medium text-red-600">Your answer: </span><span>{userAnswer || "Not answered"}</span></div>)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={handleRestart} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Take Quiz Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quiz.quizzes.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 mt-20">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">{quiz.title}</h1>
          <div className="flex items-center gap-4">
            {quiz.settings?.inQuizExperience?.onScreenCalculator !== 'none' && (
                <Dialog>
                    <DialogTrigger asChild><Button variant="outline" size="icon"><Calculator className="h-4 w-4"/></Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Calculator</DialogTitle></DialogHeader><OnScreenCalculator/></DialogContent>
                </Dialog>
            )}
            {quiz.settings?.timeLimit > 0 && (
                <CountdownTimer seconds={quiz.settings.timeLimit} onTimeUp={handleSubmit} timerKey="total"/>
            )}
            {quiz.settings?.inQuizExperience?.timeLimitPerQuestion > 0 && (
                <CountdownTimer seconds={quiz.settings.inQuizExperience.timeLimitPerQuestion} onTimeUp={handleNext} timerKey={currentQuestion}/>
            )}
            <Badge variant="secondary">
              {currentQuestion + 1} / {quiz.quizzes.length}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg leading-relaxed">
            {currentQuestionData.question}
          </CardTitle>
          <CardDescription>
            Select the best answer from the options below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedAnswers[currentQuestion] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestionData.options.map((option, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label
                  htmlFor={`option-${index}`}
                  className="text-sm sm:text-base leading-relaxed cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || !quiz.settings?.inQuizExperience?.allowBacktracking}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion] || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && currentQuestion === quiz.quizzes.length -1 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            {currentQuestion === quiz.quizzes.length - 1
              ? "Finish Quiz"
              : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
