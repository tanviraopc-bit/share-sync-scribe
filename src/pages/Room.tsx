import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Users, Home, Loader2 } from "lucide-react";

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!roomCode) {
      navigate("/");
      return;
    }

    const initRoom = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("room_code", roomCode)
          .maybeSingle();

        if (error) {
          console.error("Room fetch error:", error);
          toast.error("Failed to load room");
          navigate("/");
          return;
        }

        if (!data) {
          toast.error("Room not found");
          navigate("/");
          return;
        }

        setRoomId(data.id);
        setContent(data.content || "");
      } catch (err) {
        console.error("Unexpected error loading room:", err);
        toast.error("Failed to load room");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    initRoom();
  }, [roomCode, navigate]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload: any) => {
          setContent(payload.new.content || "");
          setIsSyncing(false);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [roomId]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsSyncing(true);

    if (!roomId) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("rooms")
          .update({ content: newContent })
          .eq("id", roomId);

        if (error) {
          console.error("Update error:", error);
          toast.error("Failed to sync changes");
          setIsSyncing(false);
        }
      } catch (err) {
        console.error("Unexpected sync error:", err);
        toast.error("Failed to sync changes");
        setIsSyncing(false);
      }
    }, 300);
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!");
    }
  };

  const copyContent = () => {
    if (!content) {
      toast.error("No content to copy");
      return;
    }
    navigator.clipboard.writeText(content);
    toast.success("Content copied!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary/20"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Room</h1>
              <p className="text-sm text-muted-foreground">
                Code: <span className="text-primary font-mono">{roomCode}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{onlineUsers} online</span>
            </div>
            <Button variant="outline" size="sm" onClick={copyRoomCode}>
              <Copy className="h-4 w-4" />
              Copy Code
            </Button>
          </div>
        </div>

        {/* Content Editor */}
        <div className="glass-effect rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Shared Content</h2>
              {isSyncing && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Syncing...
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={copyContent} disabled={!content}>
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start typing or paste your content here... Changes sync in real-time!"
            className="min-h-[400px] bg-background/50 border-border/50 focus:border-primary resize-none text-base font-mono"
          />
          <p className="text-xs text-muted-foreground text-center">
            All changes are synced in real-time across all devices
          </p>
        </div>
      </div>
    </div>
  );
};

export default Room;
