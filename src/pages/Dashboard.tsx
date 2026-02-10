import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import StudentDashboard from "@/components/StudentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

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
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check if user is banned
        const { data: banCheck } = await supabase
          .from('banned_users')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (banCheck) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          navigate("/auth");
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole("student"); // Default to student view for unauthenticated users
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching role:", error);
        }
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
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Alkhader Learn" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-foreground hidden sm:block">{t("app.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/settings")} variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            {user ? (
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                {t("dashboard.signout")}
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                {t("get.started")}
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {role === "admin" ? (
        <main className="container mx-auto px-4 py-8">
          <AdminDashboard user={user!} />
        </main>
      ) : role === "teacher" ? (
        <main className="container mx-auto px-4 py-8">
          <TeacherDashboard user={user!} />
        </main>
      ) : (
        <StudentDashboard user={user} />
      )}
    </div>
  );
};

export default Dashboard;