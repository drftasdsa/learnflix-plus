import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, CheckCircle, Lock, Zap, Star, BookOpen, Phone, Download, Mail } from "lucide-react";
import VideoList from "./VideoList";
import SubscriptionCard from "./SubscriptionCard";
import StudyAssistantChat from "./StudyAssistantChat";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import arabicBg from "@/assets/category-arabic.jpeg";
import biologyBg from "@/assets/category-biology.jpeg";
import englishBg from "@/assets/category-english.jpeg";
import chemistryBg from "@/assets/category-chemistry-new.jpeg";
import mathBg from "@/assets/category-math.jpeg";

interface StudentDashboardProps {
  user: User | null;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const categories = [
    { name: "عربي", image: arabicBg },
    { name: "English", image: englishBg },
    { name: "علوم حياتية", image: biologyBg },
    { name: "كيمياء", image: chemistryBg },
    { name: "رياضيات", image: mathBg },
  ];

  const getCategoryBackground = () => {
    if (selectedCategory === "all") return "";
    const category = categories.find(cat => cat.name === selectedCategory);
    return category?.image || "";
  };

  const checkSubscription = async () => {
    if (!user) {
      setHasActiveSubscription(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    setHasActiveSubscription(!!data);
  };

  useEffect(() => {
    checkSubscription();
  }, [user?.id]);

  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "hero", label: t("student.nav.hero") },
    { id: "subscription", label: t("student.nav.subscription") },
    { id: "assistant", label: t("student.nav.assistant") },
    { id: "videos", label: t("student.nav.videos") },
    { id: "about", label: t("student.nav.about") },
    { id: "contact", label: t("student.nav.contact") },
    { id: "messages", label: t("messages"), isLink: true },
  ];

  return (
    <div 
      className="min-h-screen bg-background relative"
      style={getCategoryBackground() ? {
        backgroundImage: `url(${getCategoryBackground()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : undefined}
    >
      {getCategoryBackground() && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10" />
      )}
      
      <div className="relative z-10">
        {/* Modern Navigation */}
        <nav className="sticky top-0 z-50 w-full glass border-b">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-1 sm:gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.isLink ? navigate("/messages") : handleScrollTo(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 press-effect ${item.isLink ? 'flex items-center gap-1' : ''}`}
              >
                {item.isLink && <Mail className="h-4 w-4" />}
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero Section */}
        <section
          id="hero"
          className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden"
        >
          {/* Background Gradient Orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="max-w-4xl mx-auto text-center space-y-8 relative stagger-children">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold gradient-text leading-tight">
              {t("landing.title")}
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.subtitle")}
            </p>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
              <Card className="glass card-hover glow-sm border-border/50">
                <CardHeader className="space-y-4 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{t("landing.quality.title")}</CardTitle>
                  <CardDescription className="text-sm">{t("landing.quality.desc")}</CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass card-hover glow-sm border-border/50">
                <CardHeader className="space-y-4 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                    <Zap className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{t("landing.free.title")}</CardTitle>
                  <CardDescription className="text-sm">{t("landing.free.desc")}</CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass card-hover glow-sm border-border/50 sm:col-span-1 col-span-2 mx-auto w-full max-w-sm sm:max-w-none">
                <CardHeader className="space-y-4 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Star className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{t("landing.premium.title")}</CardTitle>
                  <CardDescription className="text-sm">{t("landing.premium.desc")}</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="pt-8 flex flex-col items-center gap-6">
              <Button 
                size="lg" 
                asChild
                className="px-8 py-6 text-lg rounded-full glow press-effect animate-pulse-glow"
              >
                <a href="https://median.co/share/eeekywy#apk" target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download App
                </a>
              </Button>
              <p className="text-muted-foreground text-sm">
                ↓ {t("student.scroll.down") || "Scroll down to explore"} ↓
              </p>
            </div>
          </div>
        </section>

        {/* Subscription Card */}
        <div id="subscription" className="px-4 py-8 max-w-4xl mx-auto">
          <SubscriptionCard
            userId={user?.id} 
            hasActiveSubscription={hasActiveSubscription}
            onSubscriptionChange={checkSubscription}
          />
        </div>

        {/* Study Assistant */}
        <div id="assistant" className="px-4 pb-8 max-w-4xl mx-auto">
          <StudyAssistantChat />
        </div>

        {/* Videos Section */}
        <div id="videos" className="px-4 pb-8 max-w-6xl mx-auto">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                {t("student.videos")}
              </CardTitle>
              <CardDescription>{t("student.videos.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{t("student.filter")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`relative h-20 sm:h-24 rounded-xl overflow-hidden transition-all duration-300 press-effect ${
                      selectedCategory === "all" 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-glow scale-105" 
                        : "hover:scale-102"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm sm:text-base">{t("student.all.categories")}</span>
                    </div>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`relative h-20 sm:h-24 rounded-xl overflow-hidden transition-all duration-300 press-effect ${
                        selectedCategory === cat.name 
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-glow scale-105" 
                          : "hover:scale-102"
                      }`}
                    >
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-center pb-2">
                        <span className="text-white font-bold text-sm sm:text-base drop-shadow-lg">{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <VideoList 
                userId={user?.id} 
                isTeacher={false} 
                selectedCategory={selectedCategory === "all" ? undefined : selectedCategory}
                onShowPremiumDialog={() => setShowPremiumDialog(true)}
                hasActiveSubscription={hasActiveSubscription}
              />
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div id="about" className="px-4 pb-8 max-w-4xl mx-auto">
          <Card className="glass border-border/50 text-center">
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
        </div>

        {/* Contact Section */}
        <div id="contact" className="px-4 pb-12 max-w-md mx-auto">
          <Card className="glass border-border/50 text-center">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">{t("landing.contact.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{t("landing.contact.desc")}</p>
              <a 
                href="tel:0788212294" 
                className="text-xl font-bold gradient-text underline-animate"
              >
                0788212294
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Premium Dialog */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Star className="h-6 w-6 text-primary" />
              {t("premium.title")}
            </DialogTitle>
            <DialogDescription>
              {t("premium.desc")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t("premium.feature.unlimited")}</p>
                <p className="text-sm text-muted-foreground">{t("premium.feature.unlimited.desc")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t("premium.feature.hd")}</p>
                <p className="text-sm text-muted-foreground">{t("premium.feature.hd.desc")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="font-medium">{t("premium.feature.ai")}</p>
                <p className="text-sm text-muted-foreground">{t("premium.feature.ai.desc")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t("premium.feature.exclusive")}</p>
                <p className="text-sm text-muted-foreground">{t("premium.feature.exclusive.desc")}</p>
              </div>
            </div>

            <div className="gradient-border rounded-xl p-4 text-center bg-card">
              <p className="text-3xl font-bold gradient-text">1 JOD/month</p>
              <p className="text-sm text-muted-foreground">{t("premium.price.desc")}</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={() => {
              setShowPremiumDialog(false);
              handleScrollTo('subscription');
            }} className="w-full rounded-full press-effect">
              {t("premium.get")}
            </Button>
            <Button variant="ghost" onClick={() => {
              setShowPremiumDialog(false);
            }} className="w-full">
              {t("premium.continue.free")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
