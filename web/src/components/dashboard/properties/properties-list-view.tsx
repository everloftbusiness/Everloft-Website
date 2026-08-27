"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Plus,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AirbnbImportDialog } from "@/components/dashboard/properties/airbnb-import-dialog";
import { updatePropertyStatusAction, deletePropertyAction } from "@/features/properties/actions/property.actions";
import type { PropertyListItem } from "@/features/properties/types/property.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropertiesListViewProps {
  initialProperties: PropertyListItem[];
  total: number;
  canCreate: boolean;
  userRole: string;
}

export function PropertiesListView({
  initialProperties,
  canCreate,
}: PropertiesListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "inactive">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter properties
  const filtered = initialProperties.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
      (p.typeName && p.typeName.toLowerCase().includes(search.toLowerCase()));

    const status = p.statusSlug || "draft";
    if (activeTab === "active") return matchesSearch && status === "active";
    if (activeTab === "draft") return matchesSearch && status === "draft";
    if (activeTab === "inactive") return matchesSearch && status === "inactive";
    return matchesSearch;
  });

  const activeCount = initialProperties.filter((p) => (p.statusSlug || "draft") === "active").length;
  const draftCount = initialProperties.filter((p) => (p.statusSlug || "draft") === "draft").length;
  const inactiveCount = initialProperties.filter((p) => (p.statusSlug || "draft") === "inactive").length;

  async function handleStatusChange(propertyId: string, newStatusSlug: string) {
    try {
      setLoadingId(propertyId);
      await updatePropertyStatusAction(propertyId, newStatusSlug);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update property status");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deletePropertyAction(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete property");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({initialProperties.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-emerald-600 text-white font-bold shadow-2xs"
                : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "draft"
                ? "bg-amber-500 text-white font-bold shadow-2xs"
                : "text-muted-foreground hover:text-amber-500"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Drafts ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inactive")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "inactive"
                ? "bg-slate-700 text-white font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            Inactive ({inactiveCount})
          </button>
        </div>

        {/* Search & Add Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="h-9 w-64 pl-8 text-xs bg-card"
            />
          </div>
          {canCreate && (
            <div className="flex items-center gap-2">
              <AirbnbImportDialog />
              <Button asChild variant="gold" size="sm" className="gap-1.5 font-bold">
                <Link href="/dashboard/properties/new">
                  <Plus className="h-4 w-4" />
                  Add Property
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Properties Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Type &amp; City</th>
                <th className="px-4 py-3">Setup Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((property) => {
                  const statusSlug = property.statusSlug || "draft";
                  const score = property.completionScore ?? 0;
                  const isBusy = loadingId === property.id;

                  return (
                    <tr key={property.id} className="hover:bg-muted/30 transition-colors">
                      {/* Property Cover Thumbnail & Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            {property.coverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={property.coverImageUrl}
                                alt={property.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Building2 className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/properties/${property.id}/setup`}
                              className="font-bold text-foreground hover:text-primary hover:underline line-clamp-1 text-sm"
                            >
                              {property.name}
                            </Link>
                            <span className="text-[11px] text-muted-foreground">
                              {property.internalCode || property.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type & City */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{property.typeName || "Villas & Homes"}</div>
                        <div className="text-[11px] text-muted-foreground">{property.city || "Bengaluru"}</div>
                      </td>

                      {/* Setup Progress */}
                      <td className="px-4 py-3">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>{score >= 100 ? "100% Ready" : `${score}% Completed`}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full transition-all ${
                                score >= 100 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Interactive Status Badge & Selector */}
                      <td className="px-4 py-3">
                        {isBusy ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all border ${
                                  statusSlug === "active"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : statusSlug === "inactive"
                                    ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30 hover:bg-slate-500/20"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    statusSlug === "active"
                                      ? "bg-emerald-500"
                                      : statusSlug === "inactive"
                                      ? "bg-slate-400"
                                      : "bg-amber-500"
                                  }`}
                                />
                                <span className="capitalize">{statusSlug}</span>
                                <span className="text-[9px] opacity-60">▼</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-36 text-xs">
                              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
                                Change Status
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(property.id, "active")}
                                className="gap-2 text-emerald-600 font-semibold cursor-pointer"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Active (Live)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(property.id, "draft")}
                                className="gap-2 text-amber-600 font-semibold cursor-pointer"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>Draft (Incomplete)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(property.id, "inactive")}
                                className="gap-2 text-slate-600 font-semibold cursor-pointer"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Inactive (Off Market)</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>

                      {/* Row Actions Dropdown */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 text-xs">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/properties/${property.id}/setup`} className="gap-2 cursor-pointer font-medium">
                                <Edit className="h-3.5 w-3.5 text-primary" />
                                <span>Edit &amp; Setup</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/properties/${property.slug}`}
                                target="_blank"
                                className="gap-2 cursor-pointer font-medium"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>View Live Site Page</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(property)}
                              className="gap-2 text-destructive font-semibold cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Property</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm font-semibold">No properties found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(val) => { if (!val) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>Confirm Delete Property</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.name}</strong>? This property will be removed from your active portfolio.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-1.5 font-bold"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>{isDeleting ? "Deleting..." : "Yes, Delete Property"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
