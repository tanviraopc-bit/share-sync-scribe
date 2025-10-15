import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Share2, Plus, LogIn, AlertCircle } from "lucide-react";
import { z } from "zod";

const roomCodeSchema = z.string()
  .trim()
  .length(6, "Room code must be 6 characters")
  .regex(/^[A-Z0-9]+$/, "Room code must contain only letters and numbers");

const Index = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from("rooms").select("id").limit(1);
        if (error) {
          console.error("Connection error:", error);
          setConnectionStatus("error");
        } else {
          setConnectionStatus("connected");
        }
      } catch (err) {
        console.error("Connection check failed:", err);
        setConnectionStatus("error");
      }
    };
    checkConnection();
  }, []);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    if (connectionStatus === "error") {
      toast.error("Cannot connect to backend. Check deployment configuration.");
      return;
    }

    setIsCreating(true);
    try {
      const code = generateRoomCode();

      const { data, error } = await supabase
        .from("rooms")
        .insert({ room_code: code, content: "" })
        .select()
        .single();

      if (error) {
        console.error("Create room error:", error);
        toast.error("Failed to create room. Please try again.");
        return;
      }

      toast.success("Room created!");
      navigate(`/room/${code}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (connectionStatus === "error") {
      toast.error("Cannot connect to backend. Check deployment configuration.");
      return;
    }

    const validation = roomCodeSchema.safeParse(roomCode.toUpperCase());
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error("Join room error:", error);
        toast.error("Failed to join room. Please try again.");
        return;
      }

      if (!data) {
        toast.error("Room not found. Please check the code.");
        return;
      }

      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {connectionStatus === "error" && (
        <div className="w-full max-w-md mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="text-sm text-left">
            <p className="font-semibold text-destructive">Backend Connection Error</p>
            <p className="text-destructive/80">Configure environment variables in your deployment settings.</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary pulse-glow">
            <Share2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold gradient-text">
            ShareSync
          </h1>
          <p className="text-xl text-muted-foreground">
            Share content instantly across all your devices in real-time
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <Card className="glass-effect p-8 space-y-4 border-border/50">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Create Room</h2>
              <p className="text-sm text-muted-foreground">
                Start a new sharing session with a unique code
              </p>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={createRoom}
              disabled={isCreating}
            >
              <Plus className="h-5 w-5" />
              {isCreating ? "Creating..." : "Create New Room"}
            </Button>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Card className="glass-effect p-8 space-y-4 border-border/50">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Join Room</h2>
              <p className="text-sm text-muted-foreground">
                Enter a room code to join an existing session
              </p>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                className="text-center text-lg font-mono tracking-wider bg-background/50 border-border/50 focus:border-primary"
                maxLength={6}
              />
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={joinRoom}
                disabled={isJoining || connectionStatus === "error"}
              >
                <LogIn className="h-5 w-5" />
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="pt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            ✨ Real-time synchronization
          </p>
          <p className="text-sm text-muted-foreground">
            🔒 Secure room codes
          </p>
          <p className="text-sm text-muted-foreground">
            📱 Works across all devices
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
