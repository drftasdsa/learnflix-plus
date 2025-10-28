import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Crown } from "lucide-react";
import VideoList from "./VideoList";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <Crown className="h-4 w-4" />
        <AlertDescription>
          Free users can watch each video up to 2 times in standard quality. Upgrade to Premium (3 JOD) for unlimited views, downloads, and HD quality!
          <Button variant="outline" size="sm" className="ml-4" disabled>
            Upgrade to Premium (Coming Soon)
          </Button>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Available Videos
          </CardTitle>
          <CardDescription>Browse and watch educational content</CardDescription>
        </CardHeader>
        <CardContent>
          <VideoList userId={user.id} isTeacher={false} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;