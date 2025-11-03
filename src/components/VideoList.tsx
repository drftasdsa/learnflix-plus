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
  category: string;
}

interface VideoListProps {
  teacherId?: string;
  userId?: string;
  isTeacher: boolean;
  selectedCategory?: string;
}

const VideoList = ({ teacherId, userId, isTeacher, selectedCategory }: VideoListProps) => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      let query = supabase.from("videos").select("*").order("created_at", { ascending: false });

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      if (selectedCategory) {
        query = query.eq("category", selectedCategory as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVideos(data || []);

      // Generate signed URLs for thumbnails
      if (data) {
        const thumbnailPromises = data.map(async (video) => {
          if (video.thumbnail_url) {
            const path = extractStoragePath(video.thumbnail_url);
            const { data: signedData } = await supabase.storage
              .from('videos')
              .createSignedUrl(path, 3600);
            return { id: video.id, url: signedData?.signedUrl || '' };
          }
          return { id: video.id, url: '' };
        });

        const thumbnailResults = await Promise.all(thumbnailPromises);
        const thumbnailMap: Record<string, string> = {};
        thumbnailResults.forEach(({ id, url }) => {
          if (url) thumbnailMap[id] = url;
        });
        setThumbnailUrls(thumbnailMap);
      }

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

  // Helper function to extract storage path from URL or path string
  const extractStoragePath = (url: string): string => {
    if (url.includes('/storage/v1/object/public/videos/')) {
      // Old format: https://...supabase.co/storage/v1/object/public/videos/path/to/file.mp4
      return url.split('/storage/v1/object/public/videos/')[1];
    } else if (url.startsWith('videos/')) {
      // New format: videos/path/to/file.mp4
      return url.replace('videos/', '');
    } else {
      // Already in correct format: path/to/file.mp4
      return url;
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [teacherId, userId, selectedCategory]);

  const handleWatch = async (video: Video) => {
    try {
      const videoPath = extractStoragePath(video.video_url);

      // For teachers, get signed URL directly
      if (isTeacher) {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('videos')
          .createSignedUrl(videoPath, 3600);

        if (urlError || !signedUrlData) {
          toast({
            title: "Error",
            description: "Failed to access video",
            variant: "destructive",
          });
          return;
        }

        window.open(signedUrlData.signedUrl, '_blank');
        return;
      }

      // For students, enforce view limit server-side
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please log in to watch videos",
          variant: "destructive",
        });
        return;
      }

      // Call server-side function that validates view limit
      const { data: result, error } = await supabase
        .rpc('increment_view_count', {
          p_video_id: video.id
        });

      const typedResult = result as { success: boolean; error?: string; view_count?: number } | null;

      if (error || !typedResult?.success) {
        toast({
          title: "View limit reached",
          description: typedResult?.error || "You've reached your view limit. Upgrade to premium for unlimited access.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setViewCounts(prev => ({
        ...prev,
        [video.id]: typedResult.view_count || 0
      }));

      // Get signed URL for the video
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('videos')
        .createSignedUrl(videoPath, 3600);

      if (urlError || !signedUrlData) {
        toast({
          title: "Error",
          description: "Failed to access video",
          variant: "destructive",
        });
        return;
      }

      window.open(signedUrlData.signedUrl, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access video",
        variant: "destructive",
      });
    }
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
            {thumbnailUrls[video.id] ? (
              <img
                src={thumbnailUrls[video.id]}
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
              <Badge variant="outline" className="mb-2">{video.category}</Badge>
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
                <>
                  <Button
                    size="sm"
                    onClick={() => handleWatch(video)}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
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