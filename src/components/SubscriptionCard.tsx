import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionCardProps {
  userId: string;
  hasActiveSubscription: boolean;
  onSubscriptionChange: () => void;
}

const SubscriptionCard = ({ userId, hasActiveSubscription, onSubscriptionChange }: SubscriptionCardProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load PayPal SDK
    if (!window.paypal && !hasActiveSubscription) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=BAANataLP_HLKdLFeAP3329OpCxHRTeAoNaYCz1fHFpW1qXekg9RdyH6pYDPubS6dTtxG4kR2J86JUoc8M&components=hosted-buttons&disable-funding=venmo&currency=USD';
      script.async = true;
      script.onload = () => renderPayPalButton();
      document.body.appendChild(script);
    } else if (window.paypal && !hasActiveSubscription) {
      renderPayPalButton();
    }

    // Check if returning from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      handlePayPalReturn(token);
    }
  }, [hasActiveSubscription]);

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

  const renderPayPalButton = () => {
    const container = document.getElementById('paypal-container-RNRYCK75FERFW');
    if (container && window.paypal && !hasActiveSubscription) {
      container.innerHTML = '';
      window.paypal.HostedButtons({
        hostedButtonId: "RNRYCK75FERFW",
      }).render("#paypal-container-RNRYCK75FERFW");
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          {t("subscription.title")}
        </CardTitle>
        <CardDescription>
          {hasActiveSubscription 
            ? t("subscription.active")
            : t("subscription.upgrade")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveSubscription ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>{t("subscription.active.badge")}</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t("subscription.benefit.unlimited")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t("subscription.benefit.hd")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t("subscription.benefit.noads")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t("subscription.benefit.ai")}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                {t("subscription.price")}
              </div>
              <div id="paypal-container-RNRYCK75FERFW"></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
