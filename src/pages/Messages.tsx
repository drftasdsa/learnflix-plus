import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, MailOpen, Megaphone, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  title: string;
  content: string;
  is_broadcast: boolean;
  created_at: string;
  read_at: string | null;
  sender_name?: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      fetchMessages(user.id);
    };
    getUser();
  }, [navigate]);

  const fetchMessages = async (userId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      const messagesWithNames = messagesData?.map(m => ({
        ...m,
        sender_name: profileMap.get(m.sender_id) || "Teacher"
      })) || [];

      setMessages(messagesWithNames);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (message: Message) => {
    if (message.read_at) return;
    
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", message.id);

      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, read_at: new Date().toISOString() } : m
      ));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    markAsRead(message);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = messages.filter(m => !m.read_at).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-green-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logo} alt="Alkhader Learn" className="h-8 w-8" />
            <h1 className="text-lg font-bold">{t("messages")}</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} {t("unread")}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : selectedMessage ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t("back")}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {selectedMessage.is_broadcast ? (
                  <Megaphone className="h-5 w-5 text-primary" />
                ) : (
                  <UserIcon className="h-5 w-5 text-blue-500" />
                )}
                <CardTitle>{selectedMessage.title}</CardTitle>
              </div>
              <div className="text-sm text-muted-foreground">
                {t("from")}: {selectedMessage.sender_name} • {formatDate(selectedMessage.created_at)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            </CardContent>
          </Card>
        ) : messages.length === 0 ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("noMessages")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${!message.read_at ? 'border-primary/50 bg-primary/5' : ''}`}
                onClick={() => openMessage(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {message.read_at ? (
                        <MailOpen className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Mail className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium truncate ${!message.read_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {message.title}
                        </span>
                        {message.is_broadcast && (
                          <Badge variant="secondary" className="shrink-0">
                            <Megaphone className="h-3 w-3 mr-1" />
                            {t("broadcast")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.sender_name} • {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
