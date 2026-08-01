"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardHero, DashboardSection, KpiGrid, StatusChip } from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";

// Ported from screens/dashboard/code/widgets/roles/housekeeping.widget.js
type Task = {
  id: string;
  property: string;
  unit: string;
  time: string;
  cleaningType: string;
  priority: "High" | "Medium" | "Low" | "Urgent";
  status: "Pending" | "In Progress" | "Completed";
  guestCheckoutTime: string;
  nextGuestCheckinTime: string;
  specialInstructions: string;
  notesFromOps: string;
  checklist: Record<string, string[]>;
  checklistState: Record<string, boolean>;
  photos: Record<string, boolean>;
  startedAt: number | null;
  endedAt: number | null;
};

const INITIAL_TASKS: Task[] = [
  {
    id: "hkp-1001",
    property: "Pinnacle Apartment",
    unit: "A-402",
    time: "11:00 AM",
    cleaningType: "Checkout Cleaning",
    priority: "High",
    status: "Pending",
    guestCheckoutTime: "10:00 AM",
    nextGuestCheckinTime: "4:00 PM",
    specialInstructions: "Extra focus on balcony glass and AC filter wipe.",
    notesFromOps: "VIP check-in expected. Use premium linen set.",
    checklist: {
      Bedroom: ["Change bedsheets", "Dust surfaces", "Check wardrobe"],
      Bathroom: ["Clean toilet", "Replace toiletries", "Mop floor"],
      Kitchen: ["Wash utensils", "Clean stove", "Check gas"],
    },
    checklistState: {},
    photos: { livingRoom: false, bedroom: false, bathroom: false, kitchen: false },
    startedAt: null,
    endedAt: null,
  },
  {
    id: "hkp-1002",
    property: "Villa Green Nest",
    unit: "Villa",
    time: "1:00 PM",
    cleaningType: "Stay-over Cleaning",
    priority: "Medium",
    status: "Pending",
    guestCheckoutTime: "—",
    nextGuestCheckinTime: "—",
    specialInstructions: "Guest requested fresh towels only.",
    notesFromOps: "Do not disturb personal belongings.",
    checklist: {
      Bedroom: ["Change towels", "Dust surfaces"],
      Bathroom: ["Restock toiletries", "Mop floor"],
      Kitchen: ["Wipe counters"],
    },
    checklistState: {},
    photos: { livingRoom: false, bedroom: false, bathroom: false, kitchen: false },
    startedAt: null,
    endedAt: null,
  },
];

export function HousekeepingDashboard({ userName }: { userName: string }) {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedId, setSelectedId] = useState(tasks[0].id);
  const [issueType, setIssueType] = useState("Broken Appliance");
  const [issueDescription, setIssueDescription] = useState("");

  const selected = tasks.find((t) => t.id === selectedId)!;

  const checklistComplete = useMemo(() => {
    const entries = Object.entries(selected.checklist).flatMap(([section, items]) =>
      items.map((_, i) => `${section}::${i}`)
    );
    return entries.every((key) => selected.checklistState[key]);
  }, [selected]);

  const photosComplete = Object.values(selected.photos).every(Boolean);

  function updateTask(id: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function toggleChecklist(key: string) {
    updateTask(selected.id, { checklistState: { ...selected.checklistState, [key]: !selected.checklistState[key] } });
  }

  function togglePhoto(key: string) {
    updateTask(selected.id, { photos: { ...selected.photos, [key]: !selected.photos[key] } });
  }

  function startTask() {
    updateTask(selected.id, { startedAt: Date.now(), status: selected.status === "Pending" ? "In Progress" : selected.status });
    toast.success("Task started.");
  }

  function endTask() {
    if (!selected.startedAt) {
      toast.error("Start the task before ending it.");
      return;
    }
    updateTask(selected.id, { endedAt: Date.now() });
    toast.success("Task ended.");
  }

  function markComplete() {
    if (!selected.startedAt) return toast.error("Start the task first.");
    if (!checklistComplete) return toast.error("Complete the full checklist first.");
    if (!photosComplete) return toast.error("Upload all 4 mandatory photos first.");
    updateTask(selected.id, { status: "Completed", endedAt: selected.endedAt ?? Date.now() });
    toast.success("Task marked complete.");
  }

  function reportIssue() {
    if (!issueDescription.trim()) return toast.error("Add a short description.");
    toast.success(`Maintenance issue created and routed to maintenance for ${selected.property}.`);
    setIssueDescription("");
  }

  const summary = {
    checkouts: tasks.filter((t) => t.cleaningType === "Checkout Cleaning").length,
    cleaningToday: tasks.length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  };

  return (
    <>
      <DashboardHero eyebrow="Housekeeping Console" userName={userName} description="Your cleaning schedule, checklists, and photo verification for today's turnovers." />

      <DashboardSection title="Today's Overview">
        <KpiGrid
          items={[
            { label: "Today's Checkouts", value: String(summary.checkouts), note: "Departing guests" },
            { label: "Cleaning Tasks", value: String(summary.cleaningToday), note: "Assigned to you" },
            { label: "In Progress", value: String(summary.inProgress), note: "Currently underway" },
            { label: "Completed Today", value: String(summary.completed), note: "Fully verified" },
          ]}
        />
      </DashboardSection>

      <DashboardSection title="Today's Cleaning Schedule">
        <div className="space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedId(task.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors",
                task.id === selectedId ? "border-primary bg-soft" : "border-border hover:bg-soft"
              )}
            >
              <div>
                <p className="text-sm font-semibold text-primary">{task.time} — {task.property} ({task.unit})</p>
                <p className="text-xs text-muted-foreground">{task.cleaningType}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip done={task.priority === "High" || task.priority === "Urgent"} label={task.priority} />
                <StatusChip done={task.status === "Completed"} label={task.status} />
              </div>
            </button>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title={`Task Detail — ${selected.property} (${selected.unit})`}>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <p><span className="font-semibold text-primary">Guest checkout:</span> {selected.guestCheckoutTime}</p>
          <p><span className="font-semibold text-primary">Next check-in:</span> {selected.nextGuestCheckinTime}</p>
          <p className="sm:col-span-2 text-muted-foreground">{selected.specialInstructions}</p>
          <p className="sm:col-span-2 text-muted-foreground">Ops note: {selected.notesFromOps}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {Object.entries(selected.checklist).map(([section, items]) => (
            <div key={section}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{section}</p>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const key = `${section}::${i}`;
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={!!selected.checklistState[key]} onCheckedChange={() => toggleChecklist(key)} />
                      {item}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Mandatory Photos</p>
          <div className="flex flex-wrap gap-3">
            {Object.keys(selected.photos).map((key) => (
              <button
                key={key}
                onClick={() => togglePhoto(key)}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs"
              >
                {selected.photos[key] ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="rounded-full" onClick={startTask}>Start Task</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={endTask}>End Task</Button>
          <Button variant="gold" size="sm" className="rounded-full" onClick={markComplete}>Mark Complete</Button>
        </div>
      </DashboardSection>

      <DashboardSection title="Report Issue">
        <div className="max-w-md space-y-4">
          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Broken Appliance", "Leakage", "Missing Item", "Damage"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the issue"
            rows={3}
          />
          <Button variant="outline" className="rounded-full" onClick={reportIssue}>Report Maintenance Issue</Button>
        </div>
      </DashboardSection>
    </>
  );
}
