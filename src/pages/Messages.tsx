import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, MailOpen, Megaphone, User as UserIcon, Send, Inbox, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentSendMessageDialog from "@/components/StudentSendMessageDialog";
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
  recipient_name?: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
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
      
      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const roles = roleData?.map(r => r.role) || [];
      if (roles.includes("teacher")) {
        setUserRole("teacher");
      } else if (roles.includes("admin")) {
        setUserRole("admin");
      }
      
      fetchMessages(user.id);
    };
    getUser();
  }, [navigate]);

  const fetchMessages = async (userId: string) => {
    try {
      // Fetch all messages user can see
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all unique user IDs (senders and recipients)
      const userIds = new Set<string>();
      messagesData?.forEach(m => {
        userIds.add(m.sender_id);
        if (m.recipient_id) userIds.add(m.recipient_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      const messagesWithNames = messagesData?.map(m => ({
        ...m,
        sender_name: profileMap.get(m.sender_id) || t("unknown"),
        recipient_name: m.recipient_id ? profileMap.get(m.recipient_id) || t("unknown") : null
      })) || [];

      // Split into received and sent
      const received = messagesWithNames.filter(m => 
        m.recipient_id === userId || m.is_broadcast
      );
      const sent = messagesWithNames.filter(m => m.sender_id === userId);

      setReceivedMessages(received);
      setSentMessages(sent);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failedToLoadMessages")
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (message: Message) => {
    if (message.read_at || message.sender_id === user?.id) return;
    
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", message.id);

      setReceivedMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, read_at: new Date().toISOString() } : m
      ));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
      setReceivedMessages(prev => prev.filter(m => m.id !== messageId));
      setSentMessages(prev => prev.filter(m => m.id !== messageId));
      setSelectedMessage(null);
      toast({ title: t("success"), description: "Message deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: t("error"), description: error.message });
    }
  };

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (message.recipient_id === user?.id || message.is_broadcast) {
      markAsRead(message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = receivedMessages.filter(m => !m.read_at && m.sender_id !== user?.id).length;

  const renderMessageList = (messages: Message[], isSent: boolean) => {
    if (messages.length === 0) {
      return (
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noMessages")}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {messages.map((message) => (
          <Card 
            key={message.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${!isSent && !message.read_at ? 'border-primary/50 bg-primary/5' : ''}`}
            onClick={() => openMessage(message)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isSent ? (
                    <Send className="h-5 w-5 text-muted-foreground" />
                  ) : message.read_at ? (
                    <MailOpen className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Mail className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium truncate ${!isSent && !message.read_at ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                    {isSent ? `${t("to")}: ${message.recipient_name || t("allStudents")}` : `${t("from")}: ${message.sender_name}`} • {formatDate(message.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
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
          {user && <StudentSendMessageDialog user={user} />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : selectedMessage ? (
          <Card>
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
                {selectedMessage.sender_id === user?.id 
                  ? `${t("to")}: ${selectedMessage.recipient_name || t("allStudents")}`
                  : `${t("from")}: ${selectedMessage.sender_name}`
                } • {formatDate(selectedMessage.created_at)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              {userRole === "admin" && (
                <Button variant="destructive" size="sm" className="mt-4" onClick={() => deleteMessage(selectedMessage.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Message
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="received" className="gap-2">
                <Inbox className="h-4 w-4" />
                {t("inbox")} {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <Send className="h-4 w-4" />
                {t("sent")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="received">
              {renderMessageList(receivedMessages, false)}
            </TabsContent>
            <TabsContent value="sent">
              {renderMessageList(sentMessages, true)}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Messages;
