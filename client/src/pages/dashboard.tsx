import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle2, Clock, AlertTriangle, ListChecks, Plus, ArrowRight, ChevronDown, ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import type { Chore, Partner, Room } from "@shared/schema";
import { fetchPartners } from "@/lib/partnersLocalStorage";
import { fetchChores } from "@/lib/choresLocalStorage";
import { isPast, isToday } from "date-fns";
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

function RoomSection({
  roomName,
  roomChores,
  getPartner,
  getRoom,
  defaultOpen = true,
  testId,
}: {
  roomName: string;
  roomChores: Chore[];
  getPartner: (id: string | null) => Partner | undefined;
  getRoom: (id: string | null) => Room | undefined;
  defaultOpen?: boolean;
  testId: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const activeCount = roomChores.filter((c) => !c.completed).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center gap-2 w-full text-left py-2 group"
          data-testid={`button-toggle-room-${testId}`}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <Home className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold">{roomName}</span>
          <span className="text-xs text-muted-foreground ml-1">
            {activeCount} active
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-3 sm:grid-cols-2 mt-2 mb-4">
          {roomChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              partner={getPartner(chore.assigneeId)}
              room={getRoom(chore.roomId)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Dashboard() {
  const { data: chores, isLoading: choresLoading } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
    queryFn: fetchChores,
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    queryFn: fetchPartners,
  });

  const { data: roomsList, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const isLoading = choresLoading || partnersLoading || roomsLoading;

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
  const getRoom = (id: string | null) =>
    roomsList?.find((r) => r.id === id);

  const hasRooms = roomsList && roomsList.length > 0;

  const choresByRoom = (() => {
    if (!hasRooms) return [];
    const groups: { room: Room; chores: Chore[] }[] = [];
    for (const room of roomsList!) {
      const roomChores = activeChores.filter((c) => c.roomId === room.id);
      if (roomChores.length > 0) {
        groups.push({ room, chores: roomChores });
      }
    }
    return groups;
  })();

  const unassignedRoomChores = hasRooms
    ? activeChores.filter((c) => !c.roomId)
    : [];

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
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
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
                room={getRoom(chore.roomId)}
                variant="overdue"
              />
            ))}
          </div>
        </div>
      )}

      {hasRooms && (choresByRoom.length > 0 || unassignedRoomChores.length > 0) && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 className="font-semibold" data-testid="text-rooms-heading">By Room</h2>
            <Link href="/chores">
              <Button variant="ghost" size="sm" data-testid="link-view-all-chores-rooms">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            {choresByRoom.map(({ room, chores: roomChores }) => (
              <RoomSection
                key={room.id}
                roomName={room.name}
                roomChores={roomChores}
                getPartner={getPartner}
                getRoom={getRoom}
                testId={room.id}
              />
            ))}

            {unassignedRoomChores.length > 0 && (
              <RoomSection
                roomName="Other"
                roomChores={unassignedRoomChores}
                getPartner={getPartner}
                getRoom={getRoom}
                defaultOpen={false}
                testId="unassigned"
              />
            )}
          </div>
        </div>
      )}

      {!hasRooms && (
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
                  room={getRoom(chore.roomId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
