import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { LogOut, Code, Users, Network, Crown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Question {
  id: string;
  title: string;
  difficulty: string;
  category_id: string;
}

const iconMap: Record<string, any> = {
  Code,
  Users,
  Network,
  Crown,
  Lightbulb,
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load categories",
      });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const fetchQuestions = async (categoryId?: string) => {
    let query = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions",
      });
    } else {
      setQuestions(data || []);
    }
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    fetchQuestions(categoryId || undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">InterviewPrep</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-8 animate-fade-in">
          <h2 className="mb-4 text-xl font-semibold">Categories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => {
              const Icon = iconMap[category.icon] || Code;
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                    selectedCategory === category.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() =>
                    handleCategoryFilter(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Questions */}
        <section className="animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedCategory
                ? `${
                    categories.find((c) => c.id === selectedCategory)?.name
                  } Questions`
                : "All Questions"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {questions.length} questions
            </span>
          </div>
          <div className="grid gap-4">
            {questions.map((question) => (
              <Card
                key={question.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate(`/question/${question.id}`)}
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex-1">
                    <h3 className="font-medium">{question.title}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={getDifficultyColor(question.difficulty)}
                  >
                    {question.difficulty}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {questions.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No questions found in this category
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
