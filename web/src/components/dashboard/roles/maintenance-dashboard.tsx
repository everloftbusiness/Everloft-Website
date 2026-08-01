"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

// Ported from screens/dashboard/code/widgets/roles/maintenance.widget.js
type Task = {
  id: string;
  property: string;
  unit: string;
  issueType: string;
  category: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Pending" | "In Progress" | "Waiting for Parts" | "Completed";
  reportedBy: string;
  requiredMaterials: string;
  notes: string;
  completionDate: number | null;
};

const INITIAL_TASKS: Task[] = [
  {
    id: "mnt-1001",
    property: "Pinnacle Apartment",
    unit: "A-402",
    issueType: "AC repair",
    category: "Electrical",
    description: "AC not cooling, needs gas refill and filter check.",
    priority: "High",
    status: "In Progress",
    reportedBy: "Front Office",
    requiredMaterials: "R32 refrigerant, filter",
    notes: "Guest check-in at 4 PM. Prioritize closure before noon.",
    completionDate: null,
  },
  {
    id: "mnt-1002",
    property: "Villa Green Nest",
    unit: "Villa",
    issueType: "Plumbing",
    category: "Plumbing",
    description: "Leak under kitchen sink.",
    priority: "Urgent",
    status: "Pending",
    reportedBy: "Housekeeping",
    requiredMaterials: "Pipe seal, wrench",
    notes: "Water damage risk to cabinet — urgent.",
    completionDate: null,
  },
  {
    id: "mnt-1003",
    property: "Pinnacle Apartment",
    unit: "Corridor",
    issueType: "Electrical",
    category: "Electrical",
    description: "Corridor light flickering.",
    priority: "Medium",
    status: "Waiting for Parts",
    reportedBy: "Operations",
    requiredMaterials: "LED tube",
    notes: "Ordered, awaiting delivery.",
    completionDate: null,
  },
  {
    id: "mnt-1004",
    property: "Villa Green Nest",
    unit: "Bedroom 2",
    issueType: "Furniture",
    category: "Carpentry",
    description: "Wardrobe hinge loose.",
    priority: "Low",
    status: "Completed",
    reportedBy: "Guest",
    requiredMaterials: "Hinge screws",
    notes: "Resolved during routine check.",
    completionDate: Date.now() - 86400000,
  },
];

const STATUS_OPTIONS: Task["status"][] = ["Pending", "In Progress", "Waiting for Parts", "Completed"];

export function MaintenanceDashboard({ userName }: { userName: string }) {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedId, setSelectedId] = useState(tasks[0].id);
  const [expenseEnabled, setExpenseEnabled] = useState(false);
  const [materialCost, setMaterialCost] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [pendingClaims, setPendingClaims] = useState(0);

  const selected = tasks.find((t) => t.id === selectedId)!;

  function updateStatus(status: Task["status"]) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, status, completionDate: status === "Completed" ? Date.now() : null }
          : t
      )
    );
    toast.success(`Status updated to ${status}.`);
  }

  function submitExpense() {
    const cost = Number(materialCost);
    if (!cost || cost <= 0) return toast.error("Enter a valid material cost.");
    if (!expenseDescription.trim()) return toast.error("Add a description.");
    setPendingClaims((n) => n + 1);
    setMaterialCost("");
    setExpenseDescription("");
    setExpenseEnabled(false);
    toast.success(`Expense submitted. Pending operations_admin approval (${pendingClaims + 1} request(s)).`);
  }

  const now = new Date();
  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    completedThisMonth: tasks.filter(
      (t) => t.status === "Completed" && t.completionDate && new Date(t.completionDate).getMonth() === now.getMonth()
    ).length,
  };

  return (
    <>
      <DashboardHero eyebrow="Maintenance Console" userName={userName} description="Your assigned repair tickets, property access details, and expense claims." />

      <DashboardSection title="Overview">
        <KpiGrid
          items={[
            { label: "Total Assigned", value: String(summary.total), note: "Active tickets" },
            { label: "Pending", value: String(summary.pending), note: "Not yet started" },
            { label: "In Progress", value: String(summary.inProgress), note: "Currently underway" },
            { label: "Completed This Month", value: String(summary.completedThisMonth), note: "Closed tickets" },
          ]}
        />
      </DashboardSection>

      <DashboardSection title="My Assigned Tasks">
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
                <p className="text-sm font-semibold text-primary">{task.property} — {task.issueType}</p>
                <p className="text-xs text-muted-foreground">{task.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip done={task.priority === "High" || task.priority === "Urgent"} label={task.priority} />
                <StatusChip done={task.status === "Completed"} label={task.status} />
              </div>
            </button>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title={`Task Detail — ${selected.property}`}>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <p><span className="font-semibold text-primary">Reported by:</span> {selected.reportedBy}</p>
          <p><span className="font-semibold text-primary">Required materials:</span> {selected.requiredMaterials}</p>
          <p className="sm:col-span-2 text-muted-foreground">{selected.description}</p>
          <p className="sm:col-span-2 text-muted-foreground">Notes: {selected.notes}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Select value={selected.status} onValueChange={(v) => updateStatus(v as Task["status"])}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="gold" size="sm" className="rounded-full" onClick={() => updateStatus(selected.status)}>
            Update Status
          </Button>
        </div>
      </DashboardSection>

      <DashboardSection title="Expense Entry (Optional – Controlled)">
        <label className="mb-4 flex items-center gap-2 text-sm">
          <Checkbox checked={expenseEnabled} onCheckedChange={(v) => setExpenseEnabled(!!v)} />
          I need to submit a material expense claim
        </label>
        {expenseEnabled && (
          <div className="max-w-md space-y-4">
            <Input
              type="number"
              placeholder="Material cost (INR)"
              value={materialCost}
              onChange={(e) => setMaterialCost(e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              rows={3}
            />
            <Button variant="outline" className="rounded-full" onClick={submitExpense}>
              Submit Approval Request
            </Button>
            <p className="text-xs text-muted-foreground">
              Material expenses must be submitted as approval requests to operations_admin.
              {pendingClaims > 0 && ` (${pendingClaims} pending)`}
            </p>
          </div>
        )}
      </DashboardSection>
    </>
  );
}
