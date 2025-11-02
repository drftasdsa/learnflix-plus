import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Check if returning from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      handlePayPalReturn(token);
    }
  }, []);

  const handlePayPalReturn = async (orderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-paypal-payment', {
        body: { orderId },
      });

      if (error) throw error;

      toast({
        title: "Payment successful!",
        description: "Your premium subscription is now active.",
      });

      onSubscriptionChange();
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "Failed to process payment",
      });
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: { amount: 1, currency: 'JOD' },
      });

      if (error) throw error;

      if (data.approveUrl) {
        // Redirect to PayPal
        window.location.href = data.approveUrl;
      } else {
        throw new Error('No PayPal approval URL received');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create payment",
      });
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
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                Price: 1 JOD/month
              </div>
              <Button 
                onClick={handleSubscribe} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Redirecting to PayPal..." : "Pay with PayPal"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
