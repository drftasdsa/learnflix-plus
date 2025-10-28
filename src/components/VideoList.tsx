import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Eye, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  teacher_id: string;
  created_at: string;
  quality_standard: string;
  quality_hd: string;
}

interface VideoListProps {
  teacherId?: string;
  userId?: string;
  isTeacher: boolean;
}

const VideoList = ({ teacherId, userId, isTeacher }: VideoListProps) => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      let query = supabase.from("videos").select("*").order("created_at", { ascending: false });

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVideos(data || []);

      // Fetch view counts for students
      if (userId && !isTeacher) {
        const { data: viewData } = await supabase
          .from("video_views")
          .select("video_id, view_count")
          .eq("user_id", userId);

        const counts: Record<string, number> = {};
        viewData?.forEach((view) => {
          counts[view.video_id] = view.view_count;
        });
        setViewCounts(counts);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [teacherId, userId]);

  const handleWatch = async (video: Video) => {
    if (!userId) return;

    const currentViews = viewCounts[video.id] || 0;

    if (currentViews >= 2) {
      toast({
        variant: "destructive",
        title: "View limit reached",
        description: "You've watched this video 2 times. Upgrade to Premium for unlimited views!",
      });
      return;
    }

    // Increment view count
    const { error } = await supabase.rpc("increment_view_count", {
      p_video_id: video.id,
      p_user_id: userId,
    });

    if (error) {
      // If function doesn't exist, create view record manually
      const { data: existingView } = await supabase
        .from("video_views")
        .select("*")
        .eq("video_id", video.id)
        .eq("user_id", userId)
        .single();

      if (existingView) {
        await supabase
          .from("video_views")
          .update({ 
            view_count: existingView.view_count + 1,
            last_viewed_at: new Date().toISOString(),
          })
          .eq("id", existingView.id);
      } else {
        await supabase.from("video_views").insert({
          video_id: video.id,
          user_id: userId,
          view_count: 1,
        });
      }
    }

    setViewCounts({ ...viewCounts, [video.id]: currentViews + 1 });
    window.open(video.quality_standard, "_blank");
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const { error } = await supabase.from("videos").delete().eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Video deleted",
        description: "The video has been removed successfully",
      });
      fetchVideos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        {isTeacher ? "No videos uploaded yet" : "No videos available"}
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => {
        const views = viewCounts[video.id] || 0;
        const canWatch = isTeacher || views < 2;

        return (
          <Card key={video.id} className="overflow-hidden">
            <CardHeader className="p-0">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{video.title}</CardTitle>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {video.description}
                </p>
              )}
              {!isTeacher && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={views >= 2 ? "destructive" : "secondary"}>
                    <Eye className="h-3 w-3 mr-1" />
                    {views}/2 views
                  </Badge>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              {isTeacher ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(video.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleWatch(video)}
                    disabled={!canWatch}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {canWatch ? "Watch" : "Limit Reached"}
                  </Button>
                  {!canWatch && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Upgrade to Premium for unlimited views
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default VideoList;