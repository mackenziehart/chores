import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, History as HistoryIcon } from "lucide-react";
import type { ChoreHistory, Partner } from "@shared/schema";
import { fetchPartners } from "@/lib/partnersLocalStorage";
import { fetchChoreHistory } from "@/lib/choresLocalStorage";
import { format, isToday, isYesterday, startOfDay } from "date-fns";

function groupByDate(items: ChoreHistory[]) {
  const groups: Record<string, ChoreHistory[]> = {};
  items.forEach((item) => {
    const key = startOfDay(new Date(item.completedAt)).toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d");
}

export default function HistoryPage() {
  const { data: history, isLoading: historyLoading } = useQuery<ChoreHistory[]>({
    queryKey: ["/api/history"],
    queryFn: fetchChoreHistory,
  });

  const { data: partners } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    queryFn: fetchPartners,
  });

  const getPartner = (id: string | null) => partners?.find((p) => p.id === id);

  if (historyLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const grouped = groupByDate(history || []);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {history?.length || 0} chores completed
        </p>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <HistoryIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No completed chores yet. Start checking things off!
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([dateKey, items]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {formatDateLabel(dateKey)}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {items.map((item) => {
                const partner = getPartner(item.completedById);
                return (
                  <Card key={item.id} data-testid={`card-history-${item.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate" data-testid={`text-history-title-${item.id}`}>
                          {item.choreTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.choreCategory}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.completedAt), "h:mm a")}
                          </span>
                        </div>
                      </div>
                      {partner && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                            style={{ backgroundColor: partner.avatarColor }}
                          >
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {partner.name}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
