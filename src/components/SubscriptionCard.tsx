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
    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).paypal && !hasActiveSubscription) {
        renderPayPalButton();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [hasActiveSubscription]);

  const renderPayPalButton = () => {
    const container = document.getElementById('paypal-button-container');
    if (!container || hasActiveSubscription) return;

    (window as any).paypal.Buttons({
      createOrder: async () => {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          const { data, error } = await supabase.functions.invoke('create-paypal-order', {
            body: { amount: 1, currency: 'JOD' },
          });

          if (error) throw error;
          return data.orderId;
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          });
          throw error;
        } finally {
          setLoading(false);
        }
      },
      onApprove: async (data: any) => {
        setLoading(true);
        try {
          const { error } = await supabase.functions.invoke('capture-paypal-payment', {
            body: { orderId: data.orderID },
          });

          if (error) throw error;

          toast({
            title: "Payment successful!",
            description: "Your premium subscription is now active.",
          });

          onSubscriptionChange();
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Payment failed",
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast({
          variant: "destructive",
          title: "Payment error",
          description: "Something went wrong with PayPal. Please try again.",
        });
        setLoading(false);
      },
    }).render('#paypal-button-container');
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
              <div id="paypal-button-container" className={loading ? "opacity-50 pointer-events-none" : ""}></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
