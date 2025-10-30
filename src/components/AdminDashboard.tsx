import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserX, UserCheck, Video } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import VideoList from "./VideoList";

interface AdminDashboardProps {
  user: User;
}

interface BannedUser {
  id: string;
  user_id: string;
  reason: string | null;
  banned_at: string;
  profiles?: {
    full_name: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string | null;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBannedUsers();
    fetchAllUsers();
  }, []);

  const fetchBannedUsers = async () => {
    const { data, error } = await supabase
      .from("banned_users")
      .select("*")
      .order("banned_at", { ascending: false });

    if (error) {
      console.error("Error fetching banned users:", error);
      return;
    }

    // Fetch profile names separately
    if (data && data.length > 0) {
      const userIds = data.map(b => b.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedData = data.map(banned => ({
        ...banned,
        profiles: { full_name: profileMap.get(banned.user_id) || "Unknown User" }
      }));

      setBannedUsers(enrichedData);
    } else {
      setBannedUsers([]);
    }
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setAllUsers(data || []);
  };

  const handleBanUser = async () => {
    if (!selectedUserId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a user to ban",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("banned_users")
        .insert({
          user_id: selectedUserId,
          banned_by: user.id,
          reason: banReason || null,
        });

      if (error) throw error;

      toast({
        title: "User banned",
        description: "The user has been banned successfully",
      });

      setSelectedUserId("");
      setBanReason("");
      fetchBannedUsers();
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

  const handleUnbanUser = async (bannedUserId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("id", bannedUserId);

      if (error) throw error;

      toast({
        title: "User unbanned",
        description: "The user has been unbanned successfully",
      });

      fetchBannedUsers();
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

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Ban User
            </CardTitle>
            <CardDescription>Prevent a user from accessing the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">-- Select a user --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || "Unnamed User"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for banning..."
                rows={3}
              />
            </div>
            <Button onClick={handleBanUser} disabled={loading} className="w-full">
              {loading ? "Banning..." : "Ban User"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Banned Users
            </CardTitle>
            <CardDescription>
              {bannedUsers.length} user(s) currently banned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bannedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No banned users</p>
              ) : (
                bannedUsers.map((banned) => (
                  <div
                    key={banned.id}
                    className="flex items-start justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {banned.profiles?.full_name || "Unknown User"}
                      </p>
                      {banned.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {banned.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Banned on {new Date(banned.banned_at).toLocaleDateString()}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Unban
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unban User?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will restore the user's access to the platform.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUnbanUser(banned.id)}>
                            Unban
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            All Videos
          </CardTitle>
          <CardDescription>Manage all videos on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <VideoList isTeacher={true} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;