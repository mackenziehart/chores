import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { fetchPartners } from "@/lib/partnersLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, PRIORITIES, RECURRENCES } from "@shared/schema";
import type { Chore, Partner, Room } from "@shared/schema";
import { cn } from "@/lib/utils";

const choreFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.date().nullable().optional(),
  recurrence: z.string().nullable().optional(),
  category: z.string(),
  priority: z.string(),
  roomId: z.string().nullable().optional(),
  completed: z.boolean(),
});

type ChoreFormValues = z.infer<typeof choreFormSchema>;

interface ChoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editChore?: Chore | null;
}

export function ChoreFormDialog({ open, onOpenChange, editChore }: ChoreFormDialogProps) {
  const { toast } = useToast();
  const { data: partners } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    queryFn: fetchPartners,
  });
  const { data: roomsList } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });

  const form = useForm<ChoreFormValues>({
    resolver: zodResolver(choreFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: null,
      dueDate: null,
      recurrence: null,
      category: "general",
      priority: "medium",
      roomId: null,
      completed: false,
    },
    values: editChore
      ? {
          title: editChore.title,
          description: editChore.description || "",
          assigneeId: editChore.assigneeId || null,
          dueDate: editChore.dueDate ? new Date(editChore.dueDate) : null,
          recurrence: editChore.recurrence || null,
          category: editChore.category,
          priority: editChore.priority,
          roomId: editChore.roomId || null,
          completed: editChore.completed,
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (values: ChoreFormValues) => {
      const body = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assigneeId: values.assigneeId || null,
        recurrence: values.recurrence || null,
        roomId: values.roomId || null,
      };
      await apiRequest("POST", "/api/chores", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({ title: "Chore created!" });
      form.reset();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ChoreFormValues) => {
      const body = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assigneeId: values.assigneeId || null,
        recurrence: values.recurrence || null,
        roomId: values.roomId || null,
      };
      await apiRequest("PATCH", `/api/chores/${editChore!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({ title: "Chore updated!" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/chores/${editChore!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({ title: "Chore deleted" });
      onOpenChange(false);
    },
  });

  const onSubmit = (values: ChoreFormValues) => {
    if (editChore) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editChore ? "Edit Chore" : "New Chore"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vacuum the living room" {...field} data-testid="input-chore-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional details..."
                      className="resize-none"
                      {...field}
                      data-testid="input-chore-description"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-assignee">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {partners?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {roomsList && roomsList.length > 0 && (
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-room">
                          <SelectValue placeholder="No room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No room</SelectItem>
                        {roomsList.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-due-date"
                        >
                          <CalendarIcon className="mr-2 w-4 h-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date || null)}
                        initialFocus
                      />
                      {field.value && (
                        <div className="p-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => field.onChange(null)}
                          >
                            Clear date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-recurrence">
                        <SelectValue placeholder="No repeat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No repeat</SelectItem>
                      {RECURRENCES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1" data-testid="button-save-chore">
                {isPending ? "Saving..." : editChore ? "Update" : "Create Chore"}
              </Button>
              {editChore && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-chore"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
