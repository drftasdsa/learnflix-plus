import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video } from "lucide-react";
import VideoList from "./VideoList";

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a video file",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload video to private bucket
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // Store the path, not public URL (bucket is now private)
      const videoUrl = `videos/${videoFileName}`;

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailFileName = `${user.id}/${Date.now()}_thumb_${thumbnailFile.name}`;
        const { error: thumbError } = await supabase.storage
          .from("videos")
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbError) throw thumbError;

        thumbnailUrl = `videos/${thumbnailFileName}`;
      }

      // Create video record
      const { error: dbError } = await supabase
        .from("videos")
        .insert({
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          teacher_id: user.id,
          quality_standard: videoUrl,
          quality_hd: videoUrl, // Same URL for now, can be different quality later
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Video uploaded successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Video
          </CardTitle>
          <CardDescription>Share your knowledge with students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Mathematics"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the video content..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Video File</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload Video"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoList teacherId={user.id} isTeacher={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;