import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const StudyAssistantChat = () => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isArabic = language === "ar";

  const title = isArabic ? "مساعد دراسي بالذكاء الاصطناعي" : "AI Study Assistant";
  const subtitle = isArabic
    ? "اسأل عن دروسك في أي مادة واحصل على مساعدة فورية (حتى 10 أسئلة يومياً مجاناً، وأسئلة غير محدودة مع الاشتراك المميز)."
    : "Ask questions about your subjects and get instant help (10 free questions per day, unlimited with Premium).";
  const placeholder = isArabic
    ? "اكتب سؤالاً عن دروسك (بالعربية أو بالإنجليزية)..."
    : "Ask a question about your lessons (in Arabic or English)...";
  const emptyState = isArabic
    ? "ابدأ بكتابة سؤالك الأول للتحدث مع المساعد."
    : "Ask your first question to start chatting with the assistant.";
  const sendLabel = isArabic ? "اسأل" : "Ask";
  const loadingLabel = isArabic ? "يفكر..." : "Thinking...";

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("study-assistant", {
        body: {
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) {
        console.error("Study assistant error:", error);
        throw error;
      }

      const typedData = data as { reply?: string; errorCode?: string; limit?: number } | null;

      if (typedData?.errorCode === "AI_DAILY_LIMIT") {
        const description = isArabic
          ? "لقد وصلت إلى الحد اليومي وهو 10 أسئلة للمساعد الذكي. قم بالترقية للاشتراك المميز للحصول على أسئلة غير محدودة."
          : "You have reached your daily limit of 10 AI assistant questions. Upgrade to Premium for unlimited questions.";

        toast({
          title: t("error"),
          description,
          variant: "destructive",
        });

        return;
      }

      const replyText = typedData?.reply;

      if (!replyText) {
        throw new Error("No response from study assistant");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error calling study assistant:", err);
      const description =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : isArabic
            ? "حدث خطأ أثناء الاتصال بالمساعد الدراسي. يرجى المحاولة مرة أخرى."
            : "Something went wrong while contacting the study assistant. Please try again.";

      toast({
        title: t("error"),
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-72 rounded-xl p-4 bg-secondary/30 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">{emptyState}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm bg-primary text-primary-foreground shadow-sm"
                        : "max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-card text-foreground border border-border/50 shadow-sm"
                    }
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-card text-muted-foreground border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[52px] max-h-32 resize-none bg-background/50 rounded-xl"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[52px] w-[52px] rounded-xl flex-shrink-0 press-effect"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyAssistantChat;
