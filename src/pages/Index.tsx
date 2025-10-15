import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Share2, Plus, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    setIsCreating(true);
    const code = generateRoomCode();

    const { data, error } = await supabase
      .from("rooms")
      .insert({ room_code: code, content: "" })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast.error("Failed to create room");
      return;
    }

    toast.success("Room created!");
    navigate(`/room/${code}`);
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .single();

    if (error || !data) {
      toast.error("Room not found");
      return;
    }

    navigate(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
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
              >
                <LogIn className="h-5 w-5" />
                Join Room
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
