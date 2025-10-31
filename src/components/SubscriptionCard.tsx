import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check } from "lucide-react";

interface SubscriptionCardProps {
  userId: string;
  hasActiveSubscription: boolean;
  onSubscriptionChange: () => void;
}

const SubscriptionCard = ({ userId, hasActiveSubscription, onSubscriptionChange }: SubscriptionCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          is_active: true,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Premium activated!",
        description: "You now have unlimited access to all videos.",
      });

      onSubscriptionChange();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Premium Subscription
        </CardTitle>
        <CardDescription>
          {hasActiveSubscription 
            ? "You have unlimited access to all videos" 
            : "Upgrade to watch unlimited videos"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveSubscription ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>Active Premium Subscription</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Unlimited video views</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>HD quality streaming</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>No ads</span>
              </div>
            </div>
            <Button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Subscribe Now"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
