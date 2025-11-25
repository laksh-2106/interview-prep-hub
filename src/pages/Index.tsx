import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Target, Trophy, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
            Ace Your Next
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Interview
            </span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Practice with curated interview questions across technical, behavioral, and system design categories. Track your progress and build confidence.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            {user ? (
              <Button
                size="lg"
                className="group"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="group"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="group rounded-2xl border bg-card p-8 transition-all hover:shadow-lg animate-slide-up">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Curated Questions</h3>
            <p className="text-muted-foreground">
              Access a comprehensive library of interview questions across multiple categories and difficulty levels.
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-8 transition-all hover:shadow-lg animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your preparation journey, save your answers, and mark questions as completed.
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-8 transition-all hover:shadow-lg animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Real-World Prep</h3>
            <p className="text-muted-foreground">
              Practice with questions from actual interviews, complete with tips and example answers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border bg-gradient-to-br from-primary/5 to-accent/5 p-12 text-center shadow-xl">
            <h2 className="mb-4 text-3xl font-bold">Ready to start preparing?</h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Join now and get access to hundreds of interview questions
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Free Account
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
