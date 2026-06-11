import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVATARS, AvatarOption } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useUpdateUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarId?: string | null;
  onSaved?: (avatarId: string) => void;
  firstTime?: boolean;
}

export function AvatarPicker({ open, onOpenChange, currentAvatarId, onSaved, firstTime }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string | null>(currentAvatarId ?? null);
  const [tab, setTab] = useState<"male" | "female">("male");
  const updateProfile = useUpdateUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const maleAvatars = AVATARS.filter((a) => a.gender === "male");
  const femaleAvatars = AVATARS.filter((a) => a.gender === "female");

  const handleSave = async () => {
    if (!selected) return;
    try {
      await updateProfile.mutateAsync({ data: { avatar: selected } });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Avatar updated!", description: "Your avatar has been saved." });
      onSaved?.(selected);
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err?.message ?? "Could not save avatar." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {firstTime ? "Choose Your Avatar" : "Change Avatar"}
          </DialogTitle>
          <DialogDescription>
            {firstTime
              ? "Pick an avatar to personalize your profile. You can change it anytime in settings."
              : "Select an avatar to represent you on OfferLoots."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "male" | "female")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="male">Male</TabsTrigger>
            <TabsTrigger value="female">Female</TabsTrigger>
          </TabsList>

          <TabsContent value="male">
            <AvatarGrid avatars={maleAvatars} selected={selected} onSelect={setSelected} />
          </TabsContent>
          <TabsContent value="female">
            <AvatarGrid avatars={femaleAvatars} selected={selected} onSelect={setSelected} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-2">
          {!firstTime && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={!selected || updateProfile.isPending} className="min-w-[120px]">
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {firstTime ? "Get Started!" : "Save Avatar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AvatarGrid({
  avatars, selected, onSelect,
}: {
  avatars: AvatarOption[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {avatars.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={cn(
            "relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer bg-muted/40 aspect-square",
            selected === avatar.id
              ? "border-primary ring-2 ring-primary/30 scale-105"
              : "border-transparent hover:border-primary/50"
          )}
        >
          <img
            src={avatar.url}
            alt={avatar.label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {selected === avatar.id && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="bg-primary rounded-full p-0.5">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
