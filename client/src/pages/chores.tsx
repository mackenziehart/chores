import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, ListChecks, Filter } from "lucide-react";
import type { Chore, Partner, Room } from "@shared/schema";
import { CATEGORIES } from "@shared/schema";
import { ChoreCard } from "@/components/chore-card";
import { ChoreFormDialog } from "@/components/chore-form-dialog";

export default function ChoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChore, setEditChore] = useState<Chore | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const { data: chores, isLoading } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });

  const { data: partners } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const { data: roomsList } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const getPartner = (id: string | null) => partners?.find((p) => p.id === id);
  const getRoom = (id: string | null) => roomsList?.find((r) => r.id === id);

  const activeChores = chores?.filter((c) => !c.completed) || [];
  const completedChores = chores?.filter((c) => c.completed) || [];

  const filterChores = (list: Chore[]) => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        result = result.filter((c) => !c.assigneeId);
      } else {
        result = result.filter((c) => c.assigneeId === assigneeFilter);
      }
    }
    return result;
  };

  const filteredActive = filterChores(activeChores);
  const filteredCompleted = filterChores(completedChores);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">All Chores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeChores.length} active, {completedChores.length} completed
          </p>
        </div>
        <Button
          onClick={() => {
            setEditChore(null);
            setDialogOpen(true);
          }}
          data-testid="button-new-chore"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chore
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-chores"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-category">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-assignee">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {partners?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="active">
        <TabsList data-testid="tabs-chore-status">
          <TabsTrigger value="active">
            Active ({filteredActive.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filteredCompleted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {filteredActive.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ListChecks className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {activeChores.length === 0
                    ? "No chores yet. Add your first one!"
                    : "No chores match your filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredActive.map((chore) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  partner={getPartner(chore.assigneeId)}
                  room={getRoom(chore.roomId)}
                  onEdit={(c) => {
                    setEditChore(c);
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {filteredCompleted.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No completed chores yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredCompleted.map((chore) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  partner={getPartner(chore.assigneeId)}
                  room={getRoom(chore.roomId)}
                  onEdit={(c) => {
                    setEditChore(c);
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ChoreFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditChore(null);
        }}
        editChore={editChore}
      />
    </div>
  );
}
