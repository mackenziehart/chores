import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Calendar, RotateCcw, Flag } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import type { Chore, Partner } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@shared/schema";

const categoryIcons: Record<string, string> = {
  general: "clipboard",
  cleaning: "sparkles",
  cooking: "chef-hat",
  shopping: "shopping-cart",
  laundry: "shirt",
  outdoor: "trees",
  pets: "paw-print",
  errands: "car",
};

const priorityColors: Record<string, string> = {
  low: "text-blue-600 dark:text-blue-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

function DueDateBadge({ date }: { date: Date }) {
  const d = new Date(date);
  const overdue = isPast(d) && !isToday(d);
  const today = isToday(d);
  const tomorrow = isTomorrow(d);

  let label = format(d, "MMM d");
  if (today) label = "Today";
  if (tomorrow) label = "Tomorrow";

  return (
    <Badge
      variant={overdue ? "destructive" : "secondary"}
      className="text-xs"
    >
      <Calendar className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

interface ChoreCardProps {
  chore: Chore;
  partner?: Partner | undefined;
  variant?: "default" | "overdue";
  onEdit?: (chore: Chore) => void;
}

export function ChoreCard({ chore, partner, variant = "default", onEdit }: ChoreCardProps) {
  const { toast } = useToast();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/chores/${chore.id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: chore.completed ? "Chore reopened" : "Chore completed!",
      });
    },
  });

  return (
    <Card
      className={`hover-elevate transition-all cursor-pointer ${
        variant === "overdue" ? "border-amber-300 dark:border-amber-700" : ""
      } ${chore.completed ? "opacity-60" : ""}`}
      onClick={() => onEdit?.(chore)}
      data-testid={`card-chore-${chore.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 mt-0.5"
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate();
            }}
            disabled={toggleMutation.isPending}
            data-testid={`button-toggle-chore-${chore.id}`}
          >
            {chore.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`font-medium leading-snug ${
                  chore.completed ? "line-through text-muted-foreground" : ""
                }`}
                data-testid={`text-chore-title-${chore.id}`}
              >
                {chore.title}
              </p>
              {chore.priority !== "medium" && (
                <Flag className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${priorityColors[chore.priority]}`} />
              )}
            </div>

            {chore.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {chore.description}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs capitalize">
                {chore.category}
              </Badge>

              {chore.dueDate && <DueDateBadge date={new Date(chore.dueDate)} />}

              {chore.recurrence && (
                <Badge variant="secondary" className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {chore.recurrence}
                </Badge>
              )}
            </div>

            {partner && (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                  style={{ backgroundColor: partner.avatarColor }}
                >
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-muted-foreground">
                  {partner.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
