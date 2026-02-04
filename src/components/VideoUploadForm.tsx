import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface VideoUploadFormProps {
  user: User;
  onUploadComplete?: () => void;
}

const VideoUploadForm = ({ user, onUploadComplete }: VideoUploadFormProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("عربي");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const categories = ["عربي", "English", "علوم حياتية", "كيمياء", "علوم ارض", "رياضيات"];

  const uploadFileWithProgress = async (
    file: File,
    path: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(path);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      // Get the upload URL
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          reject(new Error("Not authenticated"));
          return;
        }

        const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/videos/${path}`;
        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
        xhr.setRequestHeader("x-upsert", "true");
        xhr.send(file);
      });
    });
  };

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
    setUploadProgress(0);

    try {
      // Upload video with progress tracking
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      
      await uploadFileWithProgress(videoFile, videoFileName, (progress) => {
        // Video upload is 90% of the total progress
        setUploadProgress(Math.round(progress * 0.9));
      });

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
        setUploadProgress(95);
      }

      // Create video record
      const { error: dbError } = await supabase
        .from("videos")
        .insert({
          title,
          description,
          category: category as any,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          teacher_id: user.id,
          quality_standard: videoUrl,
          quality_hd: videoUrl,
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Success!",
        description: "Video uploaded successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("عربي");
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
      
      onUploadComplete?.();
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
              disabled={uploading}
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
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video File</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              required
              disabled={uploading}
            />
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? `Uploading... ${uploadProgress}%` : "Upload Video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploadForm;
