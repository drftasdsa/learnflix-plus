import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StudentSendMessageDialogProps {
  user: User;
}

const StudentSendMessageDialog = ({ user }: StudentSendMessageDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);

  const fetchTeachers = async () => {
    try {
      const { data: teacherRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");
      setTeacherIds(teacherRoles?.map(r => r.user_id) || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) fetchTeachers();
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("fillAllFields"),
      });
      return;
    }

    if (teacherIds.length === 0) {
      toast({ variant: "destructive", title: t("error"), description: "No teachers found" });
      return;
    }

    setSending(true);
    try {
      // Send to all teachers
      const inserts = teacherIds.map(tid => ({
        sender_id: user.id,
        recipient_id: tid,
        title: title.trim(),
        content: content.trim(),
        is_broadcast: false,
      }));
      const { error } = await supabase.from("messages").insert(inserts);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("messageSent"),
      });

      setOpen(false);
      setTitle("");
      setContent("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          {t("sendToTeacher")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sendToTeacher")}</DialogTitle>
          <DialogDescription>{t("sendMessageToTeacher")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          <div className="space-y-2">
            <Label htmlFor="student-msg-title">{t("messageTitle")}</Label>
            <Input
              id="student-msg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("messageTitlePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-msg-content">{t("messageContent")}</Label>
            <Textarea
              id="student-msg-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("messageContentPlaceholder")}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? t("sending") : t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentSendMessageDialog;
