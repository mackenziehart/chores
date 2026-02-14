import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Users, Mail, Trash2, Plus, Save, Home, GripVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import { DEFAULT_ROOMS, ROOM_ICONS } from "@shared/schema";
import type { Partner, Settings, Room } from "@shared/schema";

const PRESET_COLORS = [
  { name: "Rose", primary: 345, accent: 24 },
  { name: "Violet", primary: 270, accent: 260 },
  { name: "Ocean", primary: 210, accent: 200 },
  { name: "Forest", primary: 150, accent: 140 },
  { name: "Sunset", primary: 20, accent: 30 },
  { name: "Lavender", primary: 280, accent: 270 },
  { name: "Teal", primary: 175, accent: 180 },
  { name: "Coral", primary: 10, accent: 15 },
];

const AVATAR_COLORS = [
  "#e57373", "#f06292", "#ba68c8", "#9575cd",
  "#7986cb", "#64b5f6", "#4fc3f7", "#4dd0e1",
  "#4db6ac", "#81c784", "#aed581", "#dce775",
  "#ffd54f", "#ffb74d", "#ff8a65", "#a1887f",
];

function PartnerEditor({ partner, onSave, onDelete }: {
  partner?: Partner;
  onSave: (data: { name: string; email: string; avatarColor: string }) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(partner?.name || "");
  const [email, setEmail] = useState(partner?.email || "");
  const [color, setColor] = useState(partner?.avatarColor || AVATAR_COLORS[0]);

  useEffect(() => {
    if (partner) {
      setName(partner.name);
      setEmail(partner.email || "");
      setColor(partner.avatarColor);
    }
  }, [partner]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 cursor-pointer"
          style={{ backgroundColor: color }}
        >
          {name ? name.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid={`input-partner-name-${partner?.id || "new"}`}
          />
          <Input
            placeholder="Email (for reminders)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={`input-partner-email-${partner?.id || "new"}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c}
            className={`w-6 h-6 rounded-full transition-all ${
              color === c ? "ring-2 ring-offset-2 ring-primary" : ""
            }`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            data-testid={`button-color-${c}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSave({ name, email, avatarColor: color })}
          disabled={!name.trim()}
          data-testid={`button-save-partner-${partner?.id || "new"}`}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Save
        </Button>
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            data-testid={`button-delete-partner-${partner?.id}`}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function RoomEditor({ room, onSave, onDelete }: {
  room: Room;
  onSave: (data: { name: string; icon: string }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [icon, setIcon] = useState(room.icon);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(room.name);
    setIcon(room.icon);
  }, [room]);

  if (!editing) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Home className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="flex-1 font-medium" data-testid={`text-room-name-${room.id}`}>{room.name}</span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            data-testid={`button-edit-room-${room.id}`}
          >
            Edit
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            data-testid={`button-delete-room-${room.id}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name"
          className="flex-1"
          data-testid={`input-room-name-${room.id}`}
        />
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger className="w-[140px]" data-testid={`select-room-icon-${room.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROOM_ICONS.map((ic) => (
              <SelectItem key={ic} value={ic} className="capitalize">
                {ic.replace(/-/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (name.trim()) {
              onSave({ name: name.trim(), icon });
              setEditing(false);
            }
          }}
          disabled={!name.trim()}
          data-testid={`button-save-room-${room.id}`}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setName(room.name);
            setIcon(room.icon);
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { primaryHue, accentHue, setPrimaryHue, setAccentHue } = useTheme();
  const [showNewPartner, setShowNewPartner] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomIcon, setNewRoomIcon] = useState("home");
  const [showNewRoom, setShowNewRoom] = useState(false);

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const { data: roomsList, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; avatarColor: string }) => {
      await apiRequest("POST", "/api/partners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partner added!" });
      setShowNewPartner(false);
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; email: string; avatarColor: string }) => {
      await apiRequest("PATCH", `/api/partners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partner updated!" });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partner removed" });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { primaryHue: number; accentHue: number }) => {
      await apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      toast({ title: "Theme saved!" });
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      await apiRequest("POST", "/api/rooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room added!" });
      setNewRoomName("");
      setNewRoomIcon("home");
      setShowNewRoom(false);
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; icon: string }) => {
      await apiRequest("PATCH", `/api/rooms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room updated!" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room removed" });
    },
  });

  const addDefaultRoomsMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < DEFAULT_ROOMS.length; i++) {
        await apiRequest("POST", "/api/rooms", {
          name: DEFAULT_ROOMS[i].name,
          icon: DEFAULT_ROOMS[i].icon,
          sortOrder: i,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Default rooms added!" });
    },
  });

  const handlePreset = (preset: { primary: number; accent: number }) => {
    setPrimaryHue(preset.primary);
    setAccentHue(preset.accent);
    saveSettingsMutation.mutate({ primaryHue: preset.primary, accentHue: preset.accent });
  };

  if (partnersLoading || roomsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize your experience
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Partners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add yourselves so you can assign chores and get email reminders.
          </p>

          {partners?.map((partner) => (
            <div key={partner.id}>
              <PartnerEditor
                partner={partner}
                onSave={(data) =>
                  updatePartnerMutation.mutate({ id: partner.id, ...data })
                }
                onDelete={() => deletePartnerMutation.mutate(partner.id)}
              />
              <Separator className="mt-4" />
            </div>
          ))}

          {showNewPartner ? (
            <PartnerEditor
              onSave={(data) => createPartnerMutation.mutate(data)}
            />
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowNewPartner(true)}
              disabled={(partners?.length || 0) >= 2}
              data-testid="button-add-partner"
            >
              <Plus className="w-4 h-4 mr-2" />
              {(partners?.length || 0) >= 2
                ? "Maximum 2 partners"
                : "Add Partner"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Rooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Organize your chores by room. Chores will be grouped by room on the dashboard.
          </p>

          {(!roomsList || roomsList.length === 0) && (
            <div className="text-center py-4">
              <Home className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No rooms yet. Start with the defaults or add your own.
              </p>
              <Button
                variant="outline"
                onClick={() => addDefaultRoomsMutation.mutate()}
                disabled={addDefaultRoomsMutation.isPending}
                data-testid="button-add-default-rooms"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addDefaultRoomsMutation.isPending ? "Adding..." : "Add Default Rooms"}
              </Button>
            </div>
          )}

          {roomsList && roomsList.length > 0 && (
            <div className="space-y-1 divide-y">
              {roomsList.map((room) => (
                <RoomEditor
                  key={room.id}
                  room={room}
                  onSave={(data) => updateRoomMutation.mutate({ id: room.id, ...data })}
                  onDelete={() => deleteRoomMutation.mutate(room.id)}
                />
              ))}
            </div>
          )}

          {showNewRoom ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room name"
                  className="flex-1"
                  data-testid="input-new-room-name"
                />
                <Select value={newRoomIcon} onValueChange={setNewRoomIcon}>
                  <SelectTrigger className="w-[140px]" data-testid="select-new-room-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_ICONS.map((ic) => (
                      <SelectItem key={ic} value={ic} className="capitalize">
                        {ic.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (newRoomName.trim()) {
                      createRoomMutation.mutate({ name: newRoomName.trim(), icon: newRoomIcon });
                    }
                  }}
                  disabled={!newRoomName.trim() || createRoomMutation.isPending}
                  data-testid="button-save-new-room"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {createRoomMutation.isPending ? "Adding..." : "Add Room"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowNewRoom(false);
                    setNewRoomName("");
                    setNewRoomIcon("home");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowNewRoom(true)}
              data-testid="button-add-room"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Color Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Choose a preset or customize your own color palette.
          </p>

          <div>
            <Label className="text-sm font-medium mb-2 block">Presets</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  className={`rounded-md p-2 text-center transition-all hover-elevate ${
                    primaryHue === preset.primary && accentHue === preset.accent
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                  onClick={() => handlePreset(preset)}
                  data-testid={`button-preset-${preset.name.toLowerCase()}`}
                >
                  <div className="flex gap-1 justify-center mb-1">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.primary}, 70%, 50%)` }}
                    />
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.accent}, 15%, 85%)` }}
                    />
                  </div>
                  <span className="text-xs">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Primary Color
              </Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(${primaryHue}, 70%, 50%)` }}
                />
                <Slider
                  value={[primaryHue]}
                  onValueChange={([v]) => setPrimaryHue(v)}
                  onValueCommit={([v]) =>
                    saveSettingsMutation.mutate({ primaryHue: v, accentHue })
                  }
                  min={0}
                  max={360}
                  step={1}
                  className="flex-1"
                  data-testid="slider-primary-hue"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Accent Color
              </Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(${accentHue}, 15%, 85%)` }}
                />
                <Slider
                  value={[accentHue]}
                  onValueChange={([v]) => setAccentHue(v)}
                  onValueCommit={([v]) =>
                    saveSettingsMutation.mutate({ primaryHue, accentHue: v })
                  }
                  min={0}
                  max={360}
                  step={1}
                  className="flex-1"
                  data-testid="slider-accent-hue"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Email Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When a partner has an email set and is assigned a chore with a due
            date, they'll receive a reminder email the day before it's due. Make
            sure to add email addresses to each partner above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
