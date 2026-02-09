import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, MessageSquare, ShieldBan } from "lucide-react";

interface AdminOverviewProps {
  totalUsers: number;
  totalVideos: number;
  totalMessages: number;
  totalBanned: number;
}

const AdminOverview = ({ totalUsers, totalVideos, totalMessages, totalBanned }: AdminOverviewProps) => {
  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Total Videos", value: totalVideos, icon: Video, color: "text-green-500" },
    { label: "Total Messages", value: totalMessages, icon: MessageSquare, color: "text-purple-500" },
    { label: "Banned Users", value: totalBanned, icon: ShieldBan, color: "text-destructive" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminOverview;
