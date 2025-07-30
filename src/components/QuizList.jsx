"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  PlusCircle,
  BarChart3,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import useAuth from "@/hook/useAuth";
import { toast } from "sonner";

// --- Delete Confirmation Dialog Component ---
const DeleteConfirmationDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <Trash2 className="text-red-400 size-7" /> Are you absolutely
              sure?
            </div>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete this quiz
            and all of its associated data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Skeleton Component for Loading State ---
const QuizListSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-7 w-40 rounded-md bg-muted animate-pulse" />
      <div className="h-4 w-52 rounded-md bg-muted animate-pulse mt-2" />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quizToDeleteId, setQuizToDeleteId] = useState(null);

  const { user, fetchQuizzes, deleteQuizById } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const fetchedQuizzes = await fetchQuizzes();
        setQuizzes(fetchedQuizzes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load your quizzes.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteClick = (quizId) => {
    setQuizToDeleteId(quizId);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!quizToDeleteId) return;

    setIsDeleting(true);
    try {
      await deleteQuizById(quizToDeleteId);
      setQuizzes((prevQuizzes) =>
        prevQuizzes.filter((quiz) => quiz.id !== quizToDeleteId)
      );
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz.");
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setQuizToDeleteId(null);
    }
  };

  if (loading) {
    return <QuizListSkeleton />;
  }

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center p-10">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Quizzes Yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">
            Get started by creating your first AI-generated quiz.
          </p>
          <Button asChild>
            <Link href="/dashboard/quizzes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <DeleteConfirmationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Quizzes</CardTitle>
            <Button
              variant="outline"
              size={"icon"}
              title="Generate new Quiz"
              asChild
            >
              <Link href="/dashboard/quizzes/new">
                <PlusCircle />
              </Link>
            </Button>
          </div>
          <CardDescription>
            Here is a list of all the quizzes you have generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    <Badge
                      variant={
                        quiz.status === "published" ? "default" : "secondary"
                      }
                    >
                      {quiz.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on: {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/dashboard/quizzes/results/${quiz.id}`}>
                      <BarChart3 className="h-4 w-4" />
                      <span className="sr-only">View Results</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/dashboard/quizzes/edit/${quiz.id}`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit Quiz</span>
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(quiz.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Quiz</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
