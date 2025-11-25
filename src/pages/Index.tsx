import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Video, Crown, Eye, Settings, BookOpen, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden transition-colors duration-700">
      {/* 🌤️ Light Mode Background - School/Learning Theme */}
      <div className="absolute inset-0 animate-gradient bg-[length:600%_600%] bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:hidden" />

      {/* 🌙 Dark Mode Background - School/Learning Theme */}
      <div className="absolute inset-0 animate-gradient bg-[length:600%_600%] bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b] hidden dark:block" />

      {/* Floating study icons (visible in both modes) */}
      <img src="https://cdn-icons-png.flaticon.com/512/3313/3313884.png" alt="book" className="absolute w-12 animate-float left-[10%] top-[20%]" style={{ animationDelay: "0s" }} />
      <img src="https://cdn-icons-png.flaticon.com/512/1157/1157000.png" alt="pencil" className="absolute w-10 animate-float left-[30%] top-[40%]" style={{ animationDelay: "3s" }} />
      <img src="https://cdn-icons-png.flaticon.com/512/3081/3081871.png" alt="lamp" className="absolute w-10 animate-float left-[50%] top-[60%]" style={{ animationDelay: "6s" }} />
      <img src="https://cdn-icons-png.flaticon.com/512/2942/2942076.png" alt="graduation" className="absolute w-12 animate-float left-[70%] top-[30%]" style={{ animationDelay: "9s" }} />
      <img src="https://cdn-icons-png.flaticon.com/512/1055/1055646.png" alt="paper" className="absolute w-10 animate-float left-[90%] top-[50%]" style={{ animationDelay: "12s" }} />

      <header className="relative z-10 border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t("app.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/settings")} variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button onClick={() => navigate("/auth")}>{t("get.started")}</Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("landing.hero.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("landing.hero.subtitle")}
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            {t("landing.hero.cta")}
          </Button>
        </section>

        <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          <div className="bg-card p-6 rounded-lg border text-center">
            <Video className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("landing.feature.quality.title")}</h3>
            <p className="text-muted-foreground">
              {t("landing.feature.quality.desc")}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border text-center">
            <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("landing.feature.free.title")}</h3>
            <p className="text-muted-foreground">
              {t("landing.feature.free.desc")}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border text-center">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("landing.feature.premium.title")}</h3>
            <p className="text-muted-foreground">
              {t("landing.feature.premium.desc")}
            </p>
          </div>
        </section>

        <section className="bg-card p-8 rounded-lg border max-w-3xl mx-auto text-center mb-16">
          <h3 className="text-2xl font-bold mb-4">{t("landing.teacher.title")}</h3>
          <p className="text-muted-foreground mb-6">
            {t("landing.teacher.desc")}
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            {t("landing.teacher.cta")}
          </Button>
        </section>

        <section className="bg-card p-8 rounded-lg border max-w-3xl mx-auto text-center mb-16">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">{t("landing.about.title")}</h3>
          <p className="text-muted-foreground text-lg">
            {t("landing.about.desc")}
          </p>
        </section>

        <section className="bg-card p-8 rounded-lg border max-w-3xl mx-auto text-center mb-16">
          <h3 className="text-2xl font-bold mb-6">{t("landing.creators")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { ar: "سعد", en: "Saad" },
              { ar: "البراء", en: "Braa" },
              { ar: "علي", en: "Ali" },
              { ar: "يوسف", en: "Yousef" },
              { ar: "كريم", en: "Kareem" },
            ].map((creator) => (
              <div key={creator.en} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold text-lg">{creator.ar}</p>
                <p className="text-sm text-muted-foreground">{creator.en}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card p-8 rounded-lg border max-w-3xl mx-auto text-center">
          <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">{t("landing.contact.title")}</h3>
          <p className="text-muted-foreground mb-4">{t("landing.contact.desc")}</p>
          <a 
            href="tel:0788212294" 
            className="text-2xl font-bold text-primary hover:underline"
          >
            0788212294
          </a>
        </section>
      </main>
    </div>
  );
};

export default Index;
