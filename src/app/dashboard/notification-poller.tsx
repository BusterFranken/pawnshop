"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NotificationPoller() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/dashboard/notifications?unreadOnly=true");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unreadCount);
        }
      } catch {
        // ignore
      }
    }

    poll();
    const interval = setInterval(() => {
      poll();
      router.refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <Badge variant="destructive" className="text-xs">
          {unread} new
        </Badge>
      )}
    </div>
  );
}
