import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Mail, Megaphone, User as UserIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  title: string;
  content: string;
  is_broadcast: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

interface AdminMessagesProps {
  onCountChange?: (count: number) => void;
}

const AdminMessages = ({ onCountChange }: AdminMessagesProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = new Set<string>();
      data?.forEach((m) => {
        userIds.add(m.sender_id);
        if (m.recipient_id) userIds.add(m.recipient_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      const enriched = (data || []).map((m) => ({
        ...m,
        sender_name: profileMap.get(m.sender_id) || "Unknown",
        recipient_name: m.recipient_id ? profileMap.get(m.recipient_id) || "Unknown" : null,
      }));

      setMessages(enriched);
      onCountChange?.(enriched.length);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Message deleted successfully" });
      fetchMessages();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Loading messages...</p>;
  }

  if (messages.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No messages yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          All Messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((msg) => (
              <TableRow key={msg.id}>
                <TableCell>
                  {msg.is_broadcast ? (
                    <Badge variant="secondary"><Megaphone className="h-3 w-3 mr-1" />Broadcast</Badge>
                  ) : (
                    <Badge variant="outline"><UserIcon className="h-3 w-3 mr-1" />Direct</Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{msg.title}</TableCell>
                <TableCell>{msg.sender_name}</TableCell>
                <TableCell>{msg.recipient_name || "All Students"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(msg.created_at)}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this message.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(msg.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminMessages;
