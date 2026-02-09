import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Video, MessageSquare, ShieldBan } from "lucide-react";
import AdminOverview from "./admin/AdminOverview";
import AdminVideos from "./admin/AdminVideos";
import AdminMessages from "./admin/AdminMessages";
import AdminBanManager from "./admin/AdminBanManager";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [videoCount, setVideoCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [bannedCount, setBannedCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setUserCount(count || 0);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-muted-foreground">Manage your platform</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <ShieldBan className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview
            totalUsers={userCount}
            totalVideos={videoCount}
            totalMessages={messageCount}
            totalBanned={bannedCount}
          />
        </TabsContent>

        <TabsContent value="videos">
          <AdminVideos onCountChange={setVideoCount} />
        </TabsContent>

        <TabsContent value="messages">
          <AdminMessages onCountChange={setMessageCount} />
        </TabsContent>

        <TabsContent value="users">
          <AdminBanManager user={user} onBannedCountChange={setBannedCount} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
