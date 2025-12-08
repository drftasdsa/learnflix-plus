import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check, Sparkles } from "lucide-react";
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
    <Card className={`glass overflow-hidden ${hasActiveSubscription ? 'border-accent/50' : 'gradient-border'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasActiveSubscription ? 'bg-accent/10' : 'bg-primary/10'}`}>
            <Crown className={`h-5 w-5 ${hasActiveSubscription ? 'text-accent' : 'text-primary'}`} />
          </div>
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
          <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <span className="font-medium text-accent">{t("subscription.active.badge")}</span>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {[
                t("subscription.benefit.unlimited"),
                t("subscription.benefit.hd"),
                t("subscription.benefit.noads"),
                t("subscription.benefit.ai"),
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4 pt-2">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold gradient-text">1 JOD/month</p>
                <p className="text-sm text-muted-foreground">{t("subscription.price")}</p>
              </div>
              <div id="paypal-container-RNRYCK75FERFW" className="flex justify-center"></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
