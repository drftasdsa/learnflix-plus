import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Video, Crown, Eye, Settings, BookOpen, Phone, Download, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("app.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/settings")} variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button onClick={() => navigate("/auth")} className="rounded-full press-effect">
              {t("get.started")}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-20">
        {/* Hero Section */}
        <section className="text-center py-16 stagger-children">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 gradient-text leading-tight">
            {t("landing.hero.title")}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-base px-8 py-6 rounded-full glow press-effect animate-pulse-glow"
            >
              {t("landing.hero.cta")}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base px-8 py-6 rounded-full press-effect"
            >
              <a href="https://median.co/share/lppzxjn#apk" target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" />
                Download App
              </a>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="glass card-hover text-center">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Video className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>{t("landing.feature.quality.title")}</CardTitle>
              <CardDescription>{t("landing.feature.quality.desc")}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass card-hover text-center">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-7 w-7 text-accent" />
              </div>
              <CardTitle>{t("landing.feature.free.title")}</CardTitle>
              <CardDescription>{t("landing.feature.free.desc")}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass card-hover text-center sm:col-span-1 col-span-2 mx-auto w-full max-w-sm sm:max-w-none">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>{t("landing.feature.premium.title")}</CardTitle>
              <CardDescription>{t("landing.feature.premium.desc")}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Teacher CTA */}
        <section className="max-w-3xl mx-auto">
          <Card className="glass gradient-border overflow-hidden">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">{t("landing.teacher.title")}</h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                {t("landing.teacher.desc")}
              </p>
              <Button variant="outline" onClick={() => navigate("/auth")} className="rounded-full press-effect">
                {t("landing.teacher.cta")}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* About Section */}
        <section className="max-w-3xl mx-auto">
          <Card className="glass text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t("landing.about.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {t("landing.about.desc")}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Creators Section */}
        <section className="max-w-3xl mx-auto">
          <Card className="glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("landing.creators")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { ar: "سعد", en: "Saad" },
                  { ar: "البراء", en: "Braa" },
                  { ar: "علي", en: "Ali" },
                  { ar: "يوسف", en: "Yousef" },
                  { ar: "كريم", en: "Kareem" },
                ].map((creator) => (
                  <div key={creator.en} className="bg-secondary/50 p-4 rounded-xl text-center card-hover">
                    <p className="font-semibold text-lg">{creator.ar}</p>
                    <p className="text-sm text-muted-foreground">{creator.en}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="max-w-md mx-auto pb-8">
          <Card className="glass text-center">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">{t("landing.contact.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t("landing.contact.desc")}</p>
              <a 
                href="tel:0788212294" 
                className="text-2xl font-bold gradient-text underline-animate"
              >
                0788212294
              </a>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
