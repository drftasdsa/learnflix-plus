import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Mail } from "lucide-react";
import VideoList from "./VideoList";
import VideoUploadForm from "./VideoUploadForm";
import SendMessageDialog from "./SendMessageDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Messaging Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("messages")}
          </CardTitle>
          <CardDescription>{t("sendMessage")}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <SendMessageDialog user={user} />
          <Button variant="outline" onClick={() => navigate("/messages")}>
            {t("messages")}
          </Button>
        </CardContent>
      </Card>

      <VideoUploadForm user={user} onUploadComplete={handleUploadComplete} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoList key={refreshKey} teacherId={user.id} isTeacher={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;