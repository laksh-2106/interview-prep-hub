import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  tips: string;
  example_answer: string;
}

interface UserProgress {
  id?: string;
  status: string;
  notes: string;
}

const QuestionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<UserProgress>({
    status: "not_started",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuestion();
    fetchProgress();
  }, [id]);

  const fetchQuestion = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load question",
      });
      navigate("/dashboard");
    } else {
      setQuestion(data);
    }
    setLoading(false);
  };

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("user_progress")
      .select("*")
      .eq("question_id", id)
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setProgress(data);
    }
  };

  const saveProgress = async (status: string) => {
    setSaving(true);

    const progressData = {
      user_id: user?.id,
      question_id: id,
      status,
      notes: progress.notes,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    };

    const { error } = progress.id
      ? await supabase
          .from("user_progress")
          .update(progressData)
          .eq("id", progress.id)
      : await supabase.from("user_progress").insert(progressData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progress",
      });
    } else {
      toast({
        title: "Success",
        description: "Progress saved successfully",
      });
      fetchProgress();
    }

    setSaving(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6 animate-fade-in">
          {/* Question Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{question.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {question.description}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={getDifficultyColor(question.difficulty)}
                >
                  {question.difficulty}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Tips */}
          {question.tips && (
            <Card className="border-info/20 bg-info/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-info" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{question.tips}</p>
              </CardContent>
            </Card>
          )}

          {/* Your Answer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Practice Answer</CardTitle>
              <CardDescription>
                Write your answer here to practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={progress.notes}
                onChange={(e) =>
                  setProgress({ ...progress, notes: e.target.value })
                }
                placeholder="Start typing your answer..."
                className="min-h-[200px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => saveProgress("in_progress")}
                  disabled={saving}
                  variant="outline"
                >
                  Save Progress
                </Button>
                <Button
                  onClick={() => saveProgress("completed")}
                  disabled={saving}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example Answer */}
          {question.example_answer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Example Answer</CardTitle>
                <CardDescription>
                  A sample answer for reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {question.example_answer}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuestionDetail;
