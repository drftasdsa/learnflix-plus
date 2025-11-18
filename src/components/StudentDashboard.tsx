import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, CheckCircle, Lock, Zap, Star } from "lucide-react";
import VideoList from "./VideoList";
import SubscriptionCard from "./SubscriptionCard";
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
import physicsBg from "@/assets/category-physics.jpeg";
import biologyBg from "@/assets/category-biology.jpeg";
import englishBg from "@/assets/category-english.jpeg";
import chemistryBg from "@/assets/category-chemistry-new.jpeg";
import mathBg from "@/assets/category-math.jpeg";

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const { t } = useLanguage();
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
  }, [user.id]);

  return (
    <div 
      className="space-y-0 min-h-screen bg-cover bg-center bg-fixed relative"
      style={getCategoryBackground() ? {
        backgroundImage: `url(${getCategoryBackground()})`,
      } : undefined}
    >
      {getCategoryBackground() && (
        <div className="fixed inset-0 bg-black/50 -z-10" />
      )}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10 animate-gradient" />
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              {t("landing.title")}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.subtitle")}
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card className="backdrop-blur-sm bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{t("landing.quality.title")}</CardTitle>
                  <CardDescription className="text-base">{t("landing.quality.desc")}</CardDescription>
                </CardHeader>
              </Card>

              <Card className="backdrop-blur-sm bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{t("landing.free.title")}</CardTitle>
                  <CardDescription className="text-base">{t("landing.free.desc")}</CardDescription>
                </CardHeader>
              </Card>

              <Card className="backdrop-blur-sm bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{t("landing.premium.title")}</CardTitle>
                  <CardDescription className="text-base">{t("landing.premium.desc")}</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="pt-8">
              <p className="text-muted-foreground animate-bounce">
                ↓ {t("student.scroll.down") || "Scroll down to explore categories"} ↓
              </p>
            </div>
          </div>
        </section>

        {/* Subscription Card */}
        <div className="px-4 py-6">
          <SubscriptionCard
            userId={user.id} 
            hasActiveSubscription={hasActiveSubscription}
            onSubscriptionChange={checkSubscription}
          />
        </div>

        {/* Categories Section */}
        <div className="px-4 pb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t("student.videos")}
              </CardTitle>
              <CardDescription>{t("student.videos.desc")}</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{t("student.filter")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`relative h-24 rounded-lg overflow-hidden transition-all ${
                  selectedCategory === "all" 
                    ? "ring-4 ring-primary shadow-lg scale-105" 
                    : "hover:scale-102 hover:shadow-md"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{t("student.all.categories")}</span>
                </div>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`relative h-24 rounded-lg overflow-hidden transition-all ${
                    selectedCategory === cat.name 
                      ? "ring-4 ring-primary shadow-lg scale-105" 
                      : "hover:scale-102 hover:shadow-md"
                  }`}
                >
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white font-bold text-lg drop-shadow-lg">{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <VideoList 
            userId={user.id} 
            isTeacher={false} 
            selectedCategory={selectedCategory === "all" ? undefined : selectedCategory}
            onShowPremiumDialog={() => setShowPremiumDialog(true)}
          />
        </CardContent>
          </Card>
        </div>

        {/* Premium Dialog */}
        <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                {t("premium.title")}
              </DialogTitle>
              <DialogDescription>
                {t("premium.desc")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{t("premium.feature.unlimited")}</p>
                  <p className="text-sm text-muted-foreground">{t("premium.feature.unlimited.desc")}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{t("premium.feature.hd")}</p>
                  <p className="text-sm text-muted-foreground">{t("premium.feature.hd.desc")}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{t("premium.feature.exclusive")}</p>
                  <p className="text-sm text-muted-foreground">{t("premium.feature.exclusive.desc")}</p>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">1 JOD/month</p>
                <p className="text-sm text-muted-foreground">{t("premium.price.desc")}</p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button onClick={() => {
                setShowPremiumDialog(false);
                // Scroll to subscription card
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="w-full">
                {t("premium.get")}
              </Button>
              <Button variant="outline" onClick={() => setShowPremiumDialog(false)} className="w-full">
                {t("premium.continue.free")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard;