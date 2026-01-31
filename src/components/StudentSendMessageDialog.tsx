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
  const [teachers, setTeachers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      // Get all teacher user_ids
      const { data: teacherRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (rolesError) throw rolesError;

      const teacherIds = teacherRoles?.map((r) => r.user_id) || [];

      if (teacherIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", teacherIds);

        if (profilesError) throw profilesError;
        setTeachers(profiles || []);
      }
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchTeachers();
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim() || !selectedTeacher) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("fillAllFields"),
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedTeacher,
        title: title.trim(),
        content: content.trim(),
        is_broadcast: false,
      });

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("messageSent"),
      });

      setOpen(false);
      setTitle("");
      setContent("");
      setSelectedTeacher("");
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
            <Label>{t("selectTeacher")}</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={loadingTeachers}
            >
              <option value="">{loadingTeachers ? t("loading") : t("selectTeacher")}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name || "Teacher"}
                </option>
              ))}
            </select>
          </div>

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
