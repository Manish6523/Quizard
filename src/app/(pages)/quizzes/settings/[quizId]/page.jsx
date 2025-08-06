"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useAuth from "@/hook/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Share2,
  Settings,
  Clock,
  Lock,
  Eye,
  Calendar,
  MousePointerClick,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const router = useRouter();
  const { quizId } = useParams();

  const {
    user,
    loading: AuthLoading,
    fetchQuizById,
    updateQuizSettings,
  } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      if (quizId) {
        setLoading(true);
        const response = await fetchQuizById(quizId);
        if (response.success) {
          setQuiz(response.quiz);
          setSettings(response.quiz.settings || {});
        } else {
          toast.error("Failed to load quiz", { description: response.error });
          router.push("/dashboard");
        }
        setLoading(false);
      }
    };
    
    if (!AuthLoading && user) {
      loadQuiz();
    } else if (!AuthLoading && !user) {
      toast.error("You must be logged in to view this page.");
      router.push("/login");
    }
  }, [quizId, user, AuthLoading, fetchQuizById, router]);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleNestedSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [key]: value,
      },
    }));
  };

  const handleSave = async (status) => {
    setIsSaving(true);
    toast.loading(
      status === "published" ? "Publishing quiz..." : "Saving draft..."
    );

    const response = await updateQuizSettings({
      quizId: quiz.id,
      settings: settings,
      status: status,
    });

    toast.dismiss();
    setIsSaving(false);

    if (response.success) {
      toast.success(`Quiz successfully ${status}!`);
      if (status === "published") {
        prompt(
          "Share this link with your students:",
          `${window.location.origin}/quizzes/take/${quiz.id}`
        );
      }
    } else {
      toast.error("Failed to save quiz", { description: response.error });
    }
  };
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };

  if (loading || AuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Quiz not found or you do not have permission to edit it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 mt-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Quiz Settings
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Configure the experience for{" "}
          <span className="font-semibold text-primary">{quiz.title}</span>.
        </p>
      </header>

      <Tabs defaultValue="access" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="access"><Lock className="w-4 h-4 mr-2" />Access & Security</TabsTrigger>
          <TabsTrigger value="timing"><Clock className="w-4 h-4 mr-2" />Timing & Pacing</TabsTrigger>
          <TabsTrigger value="experience"><MousePointerClick className="w-4 h-4 mr-2" />In-Quiz Experience</TabsTrigger>
          <TabsTrigger value="feedback"><Eye className="w-4 h-4 mr-2" />Feedback & Results</TabsTrigger>
        </TabsList>

        <Card className="mt-6 shadow-sm">
          <CardContent className="pt-6">
            <TabsContent value="access" className="space-y-6">
              <CardTitle>Access & Security</CardTitle>
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code (Optional)</Label>
                <Input id="accessCode" placeholder="e.g., BIOLOGY101" value={settings.accessCode || ""} onChange={(e) => handleSettingChange("accessCode", e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                <Label htmlFor="oneAttempt" className="flex flex-col gap-1">
                  <span className="font-semibold">One Attempt Per Person</span>
                  <span className="text-xs text-muted-foreground">Prevents students from retaking the quiz.</span>
                </Label>
                <Switch id="oneAttempt" checked={settings.oneAttemptPerPerson || false} onCheckedChange={(checked) => handleSettingChange("oneAttemptPerPerson", checked)} />
              </div>
              <div className="space-y-4 rounded-lg border p-4 shadow-sm">
                <Label className="font-semibold">Availability Window</Label>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="datetime-local" value={formatDateForInput(settings.availabilityWindow?.start)} onChange={(e) => handleNestedSettingChange('availabilityWindow', 'start', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="datetime-local" value={formatDateForInput(settings.availabilityWindow?.end)} onChange={(e) => handleNestedSettingChange('availabilityWindow', 'end', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                    </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timing" className="space-y-6">
              <CardTitle>Timing & Pacing</CardTitle>
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Overall Time Limit (in minutes)</Label>
                <Input id="timeLimit" type="number" placeholder="0 for unlimited" value={(settings.timeLimit || 0) / 60} onChange={(e) => handleSettingChange("timeLimit", Number(e.target.value) * 60)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimitPerQuestion">Time Limit Per Question (in seconds)</Label>
                <Input id="timeLimitPerQuestion" type="number" placeholder="0 for unlimited" value={settings.inQuizExperience?.timeLimitPerQuestion || 0} onChange={(e) => handleNestedSettingChange('inQuizExperience', 'timeLimitPerQuestion', Number(e.target.value))} />
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-6">
                <CardTitle>In-Quiz Experience</CardTitle>
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                    <Label htmlFor="shuffleQuestions" className="flex flex-col gap-1">
                        <span className="font-semibold">Shuffle Questions</span>
                        <span className="text-xs text-muted-foreground">Randomize question order for each attempt.</span>
                    </Label>
                    <Switch id="shuffleQuestions" checked={settings.shuffleQuestions || false} onCheckedChange={(checked) => handleSettingChange("shuffleQuestions", checked)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                    <Label htmlFor="shuffleAnswers" className="flex flex-col gap-1">
                        <span className="font-semibold">Shuffle Answers</span>
                        <span className="text-xs text-muted-foreground">Randomize answer order for each question.</span>
                    </Label>
                    <Switch id="shuffleAnswers" checked={settings.shuffleAnswers || false} onCheckedChange={(checked) => handleSettingChange("shuffleAnswers", checked)} />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                    <Label htmlFor="allowBacktracking" className="flex flex-col gap-1">
                        <span className="font-semibold">Allow Backtracking</span>
                        <span className="text-xs text-muted-foreground">Allow students to go back to previous questions.</span>
                    </Label>
                    <Switch id="allowBacktracking" checked={settings.inQuizExperience?.allowBacktracking ?? true} onCheckedChange={(checked) => handleNestedSettingChange('inQuizExperience', 'allowBacktracking', checked)} />
                </div>
                <div className="space-y-2">
                    <Label>On-Screen Calculator</Label>
                    <Select value={settings.inQuizExperience?.onScreenCalculator || "none"} onValueChange={(value) => handleNestedSettingChange('inQuizExperience', 'onScreenCalculator', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="scientific">Scientific</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <CardTitle>Feedback & Results</CardTitle>
              <div className="space-y-2">
                <Label>When to Release Grades</Label>
                <Select value={settings.feedbackAndResults?.releaseGrades || "immediately"} onValueChange={(value) => handleNestedSettingChange('feedbackAndResults', 'releaseGrades', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately After Submission</SelectItem>
                    <SelectItem value="after_deadline">After Availability Window Ends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                <Label htmlFor="showCorrectAnswers" className="flex flex-col gap-1">
                  <span className="font-semibold">Show Correct Answers</span>
                  <span className="text-xs text-muted-foreground">Students can see the right answers after finishing.</span>
                </Label>
                <Switch id="showCorrectAnswers" checked={settings.feedbackAndResults?.showCorrectAnswers ?? true} onCheckedChange={(checked) => handleNestedSettingChange('feedbackAndResults', 'showCorrectAnswers', checked)} />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                <Label htmlFor="showAnswerExplanations" className="flex flex-col gap-1">
                  <span className="font-semibold">Show Answer Explanations</span>
                  <span className="text-xs text-muted-foreground">Show AI-generated explanations on the results page.</span>
                </Label>
                <Switch id="showAnswerExplanations" checked={settings.feedbackAndResults?.showAnswerExplanations ?? true} onCheckedChange={(checked) => handleNestedSettingChange('feedbackAndResults', 'showAnswerExplanations', checked)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customCompletionMessage">Custom Completion Message</Label>
                <Textarea id="customCompletionMessage" placeholder="e.g., Great job! Please review Chapter 5." value={settings.feedbackAndResults?.customCompletionMessage || ""} onChange={(e) => handleNestedSettingChange('feedbackAndResults', 'customCompletionMessage', e.target.value)} />
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <footer className="mt-8 flex justify-end gap-4 border-t pt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleSave("draft")}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" /> Save as Draft
        </Button>
        <Button
          size="lg"
          onClick={() => handleSave("published")}
          disabled={isSaving}
        >
          <Share2 className="mr-2 h-4 w-4" />
          {isSaving ? "Publishing..." : "Publish & Get Link"}
        </Button>
      </footer>
    </div>
  );
}
