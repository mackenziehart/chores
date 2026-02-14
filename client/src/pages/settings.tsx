import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Palette, Users, Mail, Trash2, Plus, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import type { Partner, Settings } from "@shared/schema";

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

export default function SettingsPage() {
  const { toast } = useToast();
  const { primaryHue, accentHue, setPrimaryHue, setAccentHue } = useTheme();
  const [showNewPartner, setShowNewPartner] = useState(false);

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
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

  const handlePreset = (preset: { primary: number; accent: number }) => {
    setPrimaryHue(preset.primary);
    setAccentHue(preset.accent);
    saveSettingsMutation.mutate({ primaryHue: preset.primary, accentHue: preset.accent });
  };

  if (partnersLoading) {
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
