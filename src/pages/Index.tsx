import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Video, Crown, Eye } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">LearnFlix Plus</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Quality Education at Your Fingertips
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join our platform where teachers share knowledge and students learn without limits
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            Start Learning Now
          </Button>
        </section>

        <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          <div className="bg-card p-6 rounded-lg border text-center">
            <Video className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quality Content</h3>
            <p className="text-muted-foreground">
              Access educational videos uploaded by experienced teachers
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border text-center">
            <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Free Access</h3>
            <p className="text-muted-foreground">
              Watch videos up to 2 times for free in standard quality
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border text-center">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Premium Benefits</h3>
            <p className="text-muted-foreground">
              Upgrade for unlimited views, downloads, and HD quality (Coming Soon)
            </p>
          </div>
        </section>

        <section className="bg-card p-8 rounded-lg border max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Are you a teacher?</h3>
          <p className="text-muted-foreground mb-6">
            Share your knowledge with students around Jordan. Upload videos and help students succeed.
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign Up as Teacher
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Index;
