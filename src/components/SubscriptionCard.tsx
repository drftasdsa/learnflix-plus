import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionCardProps {
  userId?: string;
  hasActiveSubscription: boolean;
  onSubscriptionChange: () => void;
}

const SubscriptionCard = ({ userId, hasActiveSubscription, onSubscriptionChange }: SubscriptionCardProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasActiveSubscription) return;
    
    // Load PayPal SDK
    const loadPayPalScript = () => {
      if (document.getElementById('paypal-hosted-buttons-script')) {
        // Script already exists, try to render
        if (window.paypal?.HostedButtons) {
          renderPayPalButton();
        }
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'paypal-hosted-buttons-script';
      script.src = 'https://www.paypal.com/sdk/js?client-id=BAANataLP_HLKdLFeAP3329OpCxHRTeAoNaYCz1fHFpW1qXekg9RdyH6pYDPubS6dTtxG4kR2J86JUoc8M&components=hosted-buttons&disable-funding=venmo&currency=USD';
      script.async = true;
      script.onload = () => {
        // Wait a bit for PayPal to fully initialize
        setTimeout(() => {
          if (window.paypal?.HostedButtons) {
            renderPayPalButton();
          }
        }, 100);
      };
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
      };
      document.body.appendChild(script);
    };

    loadPayPalScript();

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
    if (container && window.paypal?.HostedButtons && !hasActiveSubscription) {
      try {
        container.innerHTML = '';
        window.paypal.HostedButtons({
          hostedButtonId: "RNRYCK75FERFW",
        }).render("#paypal-container-RNRYCK75FERFW");
      } catch (error) {
        console.error('Failed to render PayPal button:', error);
      }
    }
  };

  return (
    <Card className={`glass overflow-hidden ${hasActiveSubscription ? 'border-accent/50' : 'border-primary/20'}`}>
      <CardHeader className="text-center pb-2">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${hasActiveSubscription ? 'bg-accent/10' : 'bg-primary/10'}`}>
          <Crown className={`h-8 w-8 ${hasActiveSubscription ? 'text-accent' : 'text-primary'}`} />
        </div>
        <h3 className="text-2xl font-semibold tracking-normal">
          {t("subscription.title")}
        </h3>
        <p className="text-base text-muted-foreground mt-1.5 tracking-normal">
          {hasActiveSubscription 
            ? t("subscription.active")
            : t("subscription.upgrade")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasActiveSubscription ? (
          <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-accent/10 border border-accent/20">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold text-lg text-accent tracking-normal">{t("subscription.active.badge")}</span>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {[
                t("subscription.benefit.unlimited"),
                t("subscription.benefit.hd"),
                t("subscription.benefit.noads"),
                t("subscription.benefit.ai"),
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium tracking-normal">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <p className="text-4xl font-bold text-primary mb-1">1 JOD</p>
              <p className="text-muted-foreground tracking-normal">{t("subscription.price")}</p>
            </div>
            <div id="paypal-container-RNRYCK75FERFW" className="min-h-[50px] [&>*]:mx-auto"></div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
