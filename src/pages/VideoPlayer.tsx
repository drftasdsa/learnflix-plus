import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const VideoPlayer = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) {
        setError("Video ID is missing");
        setLoading(false);
        return;
      }

      try {
        // Get video details
        const { data: video, error: videoError } = await supabase
          .from("videos")
          .select("*")
          .eq("id", videoId)
          .single();

        if (videoError || !video) {
          setError("Video not found");
          setLoading(false);
          return;
        }

        setVideoTitle(video.title);

        // Extract storage path
        const extractStoragePath = (url: string): string => {
          if (url.includes('/storage/v1/object/public/videos/')) {
            return url.split('/storage/v1/object/public/videos/')[1];
          } else if (url.startsWith('videos/')) {
            return url.replace('videos/', '');
          } else {
            return url;
          }
        };

        const videoPath = extractStoragePath(video.video_url);

        // Get signed URL
        const { data: signedData, error: signedError } = await supabase.storage
          .from('videos')
          .createSignedUrl(videoPath, 3600);

        if (signedError || !signedData) {
          setError("Failed to load video");
          setLoading(false);
          return;
        }

        setVideoUrl(signedData.signedUrl);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "An error occurred");
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">{t("video.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg">{error}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="container mx-auto py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/20 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        
        <h1 className="text-white text-xl font-bold mb-4 px-4">{videoTitle}</h1>
        
        <div className="w-full max-w-5xl mx-auto">
          {videoUrl && (
            <video
              controls
              autoPlay
              playsInline
              className="w-full rounded-lg"
              controlsList="nodownload"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
