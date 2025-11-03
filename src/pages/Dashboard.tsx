import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import StudentDashboard from "@/components/StudentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching role:", error);
        setLoading(false);
        return;
      }

      const roles = (data || []).map((r: { role: string }) => r.role);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("teacher")) setRole("teacher");
      else if (roles.includes("student")) setRole("student");
      else setRole("student");

      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: t("dashboard.signout"),
      description: "Come back soon!",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">{t("app.title")}</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/settings")} variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {t("dashboard.signout")}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {role === "admin" ? (
          <AdminDashboard user={user!} />
        ) : role === "teacher" ? (
          <TeacherDashboard user={user!} />
        ) : (
          <StudentDashboard user={user!} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;