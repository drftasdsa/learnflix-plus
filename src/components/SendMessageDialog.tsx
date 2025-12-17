import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Megaphone } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
}

interface SendMessageDialogProps {
  user: User;
}

const SendMessageDialog = ({ user }: SendMessageDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [recipientId, setRecipientId] = useState<string>("");
  const [students, setStudents] = useState<Profile[]>([]);

  useEffect(() => {
    if (open && !isBroadcast) {
      fetchStudents();
    }
  }, [open, isBroadcast]);

  const fetchStudents = async () => {
    try {
      // Get all user IDs with student role
      const { data: studentRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");

      if (!studentRoles?.length) return;

      const studentIds = studentRoles.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      setStudents(profiles || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("fillAllFields")
      });
      return;
    }

    if (!isBroadcast && !recipientId) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("selectRecipient")
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: isBroadcast ? null : recipientId,
        title: title.trim(),
        content: content.trim(),
        is_broadcast: isBroadcast
      });

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("messageSent")
      });

      setTitle("");
      setContent("");
      setRecipientId("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("messageFailed")
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          {t("sendMessage")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sendMessage")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="broadcast" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              {t("broadcastToAll")}
            </Label>
            <Switch
              id="broadcast"
              checked={isBroadcast}
              onCheckedChange={setIsBroadcast}
            />
          </div>

          {!isBroadcast && (
            <div className="space-y-2">
              <Label htmlFor="recipient">{t("selectStudent")}</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStudent")} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name || "Unknown Student"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t("messageTitle")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("enterTitle")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("messageContent")}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("enterMessage")}
              rows={4}
            />
          </div>

          <Button onClick={handleSend} disabled={loading} className="w-full">
            {loading ? t("sending") : t("send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
