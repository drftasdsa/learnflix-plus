import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";
import VideoList from "./VideoList";
import SubscriptionCard from "./SubscriptionCard";
import { supabase } from "@/integrations/supabase/client";
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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      className="space-y-6 min-h-screen bg-cover bg-center bg-fixed relative"
      style={getCategoryBackground() ? {
        backgroundImage: `url(${getCategoryBackground()})`,
      } : undefined}
    >
      {getCategoryBackground() && (
        <div className="fixed inset-0 bg-black/50 -z-10" />
      )}
      <div className="relative z-10">
        <SubscriptionCard
        userId={user.id} 
        hasActiveSubscription={hasActiveSubscription}
        onSubscriptionChange={checkSubscription}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Available Videos
          </CardTitle>
          <CardDescription>Browse and watch educational content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
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
                  <span className="text-white font-bold text-lg">All Categories</span>
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
          <VideoList userId={user.id} isTeacher={false} selectedCategory={selectedCategory === "all" ? undefined : selectedCategory} />
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;