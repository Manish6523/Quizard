"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Loader2, Percent, Users, Target, HelpCircle } from "lucide-react";
import { toast } from "sonner";

// Main Analytics Page Component
export default function AnalyticsPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading, fetchQuizAnalytics } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (quizId) {
        setLoading(true);
        const response = await fetchQuizAnalytics(quizId);
        if (response.success) {
          setAnalytics({
            title: response.analytics.title,
            quizzes: response.analytics.quizzes,
            quiz_attempts: response.analytics.quiz_attempts.reverse(),
          });
        } else {
          toast.error("Failed to load analytics", {
            description: response.error,
          });
          router.push("/dashboard/quizzes");
        }
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      loadAnalytics();
    }
  }, [quizId, user, authLoading, fetchQuizAnalytics, router]);

  // Memoized calculations for summary stats
  const summaryStats = useMemo(() => {
    if (
      !analytics ||
      !analytics.quiz_attempts ||
      analytics.quiz_attempts.length === 0
    ) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        totalQuestions: analytics?.quizzes?.length || 0,
      };
    }
    const attempts = analytics.quiz_attempts;
    const totalQuestions = analytics.quizzes.length;
    const totalScore = attempts.reduce(
      (sum, attempt) => sum + attempt.score,
      0
    );

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(
        (totalScore / attempts.length / totalQuestions) * 100
      ),
      totalQuestions: totalQuestions,
    };
  }, [analytics]);

  // Memoized calculation for question breakdown (Bar Chart)
  const questionBreakdown = useMemo(() => {
    if (
      !analytics ||
      !analytics.quiz_attempts ||
      !analytics.quizzes ||
      analytics.quiz_attempts.length === 0
    )
      return [];

    const correctness = analytics.quizzes.map((q, index) => ({
      name: `Q${index + 1}`,
      correct: 0,
      incorrect: 0,
    }));

    analytics.quiz_attempts.forEach((attempt) => {
      if (Array.isArray(attempt.submitted_answers)) {
        attempt.submitted_answers.forEach((submittedAnswer, index) => {
          const question = analytics.quizzes[index];
          if (question) {
            if (submittedAnswer === question.answer) {
              correctness[index].correct++;
            } else {
              correctness[index].incorrect++;
            }
          }
        });
      }
    });

    return correctness;
  }, [analytics]);

  // Memoized calculation for attempts over time (Line Chart)
  const attemptsOverTime = useMemo(() => {
    if (!analytics || !analytics.quiz_attempts) return [];
    const attemptsByDate = {};
    analytics.quiz_attempts.forEach((attempt) => {
      const date = new Date(attempt.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!attemptsByDate[date]) {
        attemptsByDate[date] = 0;
      }
      attemptsByDate[date]++;
    });
    return Object.entries(attemptsByDate).map(([date, attempts]) => ({
      date,
      attempts,
    }));
  }, [analytics]);

  // Memoized calculation for score distribution (Radial Chart)
  const scoreDistribution = useMemo(() => {
    if (
      !analytics ||
      !analytics.quiz_attempts ||
      analytics.quiz_attempts.length === 0
    )
      return [];
    const totalQuestions = analytics.quizzes.length;
    const distribution = { excellent: 0, good: 0, needsImprovement: 0 };
    analytics.quiz_attempts.forEach((attempt) => {
      const percentage = (attempt.score / totalQuestions) * 100;
      if (percentage >= 80) distribution.excellent++;
      else if (percentage >= 60) distribution.good++;
      else distribution.needsImprovement++;
    });
    return [
      {
        name: "Excellent (80%+)",
        value: distribution.excellent,
        fill: "#22c55e",
      },
      { name: "Good (60-79%)", value: distribution.good, fill: "#f59e0b" },
      {
        name: "Needs Improvement (<60%)",
        value: distribution.needsImprovement,
        fill: "#ef4444",
      },
    ];
  }, [analytics]);

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Analytics Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not load analytics for this quiz.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 mt-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Quiz Analytics</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Results for{" "}
          <span className="font-semibold text-primary">{analytics.title}</span>
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Users />}
          title="Total Attempts"
          value={summaryStats.totalAttempts}
        />
        <StatCard
          icon={<Target />}
          title="Average Score"
          value={`${summaryStats.averageScore}%`}
        />
        <StatCard
          icon={<HelpCircle />}
          title="Total Questions"
          value={summaryStats.totalQuestions}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Attempts over Time Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Attempts Over Time</CardTitle>
              <CardDescription>
                How many students took the quiz each day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attemptsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attempts"
                    stroke="#8884d8"
                    name="Attempts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Question Breakdown Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Question Performance</CardTitle>
              <CardDescription>
                Correct vs. incorrect answers for each question.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="correct"
                    stackId="a"
                    fill="#82ca9d"
                    name="Correct"
                  />
                  <Bar
                    dataKey="incorrect"
                    stackId="a"
                    fill="#ff8042"
                    name="Incorrect"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Score Distribution Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>
                Performance brackets across all attempts.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  data={scoreDistribution}
                  innerRadius="30%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" background />
                  <Tooltip />
                  <Legend
                    iconSize={10}
                    width={120}
                    height={140}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Attempts Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.quiz_attempts.map((attempt, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">
                          {attempt.participant_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(attempt.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {attempt.score}/{summaryStats.totalQuestions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ icon, title, value }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
