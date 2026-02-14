import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, AlertTriangle, ListChecks, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Chore, Partner } from "@shared/schema";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ChoreCard } from "@/components/chore-card";

function StatCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant: "default" | "success" | "warning" | "total";
}) {
  const colorMap = {
    default: "text-primary",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    total: "text-blue-600 dark:text-blue-400",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`${colorMap[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: chores, isLoading: choresLoading } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const isLoading = choresLoading || partnersLoading;

  const activeChores = chores?.filter((c) => !c.completed) || [];
  const completedToday =
    chores?.filter(
      (c) => c.completed && c.completedAt && isToday(new Date(c.completedAt))
    ) || [];
  const overdueChores = activeChores.filter(
    (c) => c.dueDate && isPast(new Date(c.dueDate)) && !isToday(new Date(c.dueDate))
  );
  const upcomingChores = activeChores
    .filter((c) => c.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const getPartner = (id: string | null) =>
    partners?.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your household at a glance
          </p>
        </div>
        <Link href="/chores">
          <Button data-testid="button-add-chore-dashboard">
            <Plus className="w-4 h-4 mr-2" />
            Add Chore
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active"
          value={activeChores.length}
          icon={ListChecks}
          variant="total"
        />
        <StatCard
          title="Overdue"
          value={overdueChores.length}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Done Today"
          value={completedToday.length}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Upcoming"
          value={upcomingChores.length}
          icon={Clock}
          variant="default"
        />
      </div>

      {overdueChores.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-semibold text-amber-700 dark:text-amber-300">
              Overdue
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {overdueChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                partner={getPartner(chore.assigneeId)}
                variant="overdue"
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h2 className="font-semibold">Upcoming Chores</h2>
          <Link href="/chores">
            <Button variant="ghost" size="sm" data-testid="link-view-all-chores">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        {upcomingChores.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No upcoming chores with due dates.
              </p>
              <Link href="/chores">
                <Button variant="outline" className="mt-4" data-testid="button-add-first-chore">
                  Add your first chore
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                partner={getPartner(chore.assigneeId)}
              />
            ))}
          </div>
        )}
      </div>

      {partners && partners.length >= 2 && (
        <div>
          <h2 className="font-semibold mb-3">Partner Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {partners.map((partner) => {
              const assigned = activeChores.filter(
                (c) => c.assigneeId === partner.id
              );
              const done = completedToday.filter(
                (c) => c.completedById === partner.id
              );
              return (
                <Card key={partner.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                        style={{ backgroundColor: partner.avatarColor }}
                      >
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" data-testid={`text-partner-name-${partner.id}`}>
                          {partner.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {assigned.length} active
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            {done.length} done today
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
