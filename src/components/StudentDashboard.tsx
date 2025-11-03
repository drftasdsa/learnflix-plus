import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";
import VideoList from "./VideoList";
import SubscriptionCard from "./SubscriptionCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["عربي", "English", "علوم حياتية", "كيمياء", "علوم ارض", "رياضيات"];

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
    <div className="space-y-6">
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
            <Label htmlFor="category-filter">Filter by Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <VideoList userId={user.id} isTeacher={false} selectedCategory={selectedCategory === "all" ? undefined : selectedCategory} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;