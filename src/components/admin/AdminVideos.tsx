import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Video, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface VideoItem {
  id: string;
  title: string;
  category: string;
  teacher_id: string;
  created_at: string;
  teacher_name?: string;
}

interface AdminVideosProps {
  onCountChange?: (count: number) => void;
}

const AdminVideos = ({ onCountChange }: AdminVideosProps) => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, category, teacher_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const teacherIds = [...new Set(data?.map((v) => v.teacher_id) || [])];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", teacherIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      const enriched = (data || []).map((v) => ({
        ...v,
        teacher_name: profileMap.get(v.teacher_id) || "Unknown",
      }));

      setVideos(enriched);
      onCountChange?.(enriched.length);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase.from("videos").delete().eq("id", videoId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Video deleted successfully" });
      fetchVideos();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No videos uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          All Videos ({videos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{video.title}</TableCell>
                <TableCell><Badge variant="outline">{video.category}</Badge></TableCell>
                <TableCell>{video.teacher_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(video.created_at!).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{video.title}".</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(video.id)}>Delete</AlertDialogAction>
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

export default AdminVideos;
