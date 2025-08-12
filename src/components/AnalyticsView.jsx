"use client";
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
import { FileText, Users, Target, Loader2 } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useEffect, useState, useMemo } from "react";
import useAuth from "@/hook/useAuth";

// Skeleton Loader for the Analytics View
const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="h-28 bg-muted/50"></Card>
      <Card className="h-28 bg-muted/50"></Card>
      <Card className="h-28 bg-muted/50"></Card>
    </div>
    <Card className="h-96 bg-muted/50"></Card>
  </div>
);


export const AnalyticsView = () => {
  const { fetchOverallAnalytics } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      const response = await fetchOverallAnalytics();
      if (response.success) {
        setAnalyticsData(response.allQuizzes);
      } else {
        console.error("Failed to load analytics:", response.error);
      }
      setLoading(false);
    };
    loadAnalytics();
  }, [fetchOverallAnalytics]);

  const { summary, topQuizzes } = useMemo(() => {
    if (!analyticsData) {
      return { summary: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0 }, topQuizzes: [] };
    }

    const totalAttempts = analyticsData.reduce((sum, quiz) => sum + quiz.quiz_attempts.length, 0);
    
    const quizzesWithScores = analyticsData.filter(q => q.quiz_attempts.length > 0);
    const totalAverageScore = quizzesWithScores.reduce((sum, quiz) => {
        const quizTotalScore = quiz.quiz_attempts.reduce((s, att) => s + att.score, 0);
        return sum + (quizTotalScore / quiz.quiz_attempts.length);
    }, 0);
    
    const averageScore = quizzesWithScores.length > 0 ? Math.round(totalAverageScore / quizzesWithScores.length) : 0;

    const sortedQuizzes = [...analyticsData].sort((a, b) => b.quiz_attempts.length - a.quiz_attempts.length);

    return {
      summary: {
        totalQuizzes: analyticsData.length,
        totalAttempts,
        averageScore,
      },
      topQuizzes: sortedQuizzes.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          quiz_length: quiz.quizzes.length,
          attempts: quiz.quiz_attempts.length,
          avgScore: quiz.quiz_attempts.length > 0 ? Math.round(quiz.quiz_attempts.reduce((s, att) => s + att.score, 0) / quiz.quiz_attempts.length) : 0,
          trend: [{ attempts: 5 }, { attempts: 8 }, { attempts: 12 }, { attempts: 10 }, { attempts: 15 }]
      })),
    };
  }, [analyticsData]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuizzes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAttempts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Quizzes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Quizzes</CardTitle>
          <CardDescription>
            Your most popular quizzes based on the number of attempts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Title</TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead className="text-center">Recent Trend</TableHead>
                <TableHead className="text-right">Avg. Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <Link href={`/quizzes/analytics/${quiz.id}`} className="font-medium hover:underline">
                      {quiz.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">{quiz.attempts}</TableCell>
                  <TableCell className="text-center">
                    <div className="h-8 w-24 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={quiz.trend}>
                          <Line
                            type="monotone"
                            dataKey="attempts"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{quiz.avgScore}/{quiz.quiz_length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
