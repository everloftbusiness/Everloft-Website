"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Lock,
  Link2,
  Sparkles,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertyCalendarGrid } from "@/components/dashboard/properties/property-calendar-grid";
import {
  fetchCalendarDataAction,
  addICalFeedAction,
  deleteICalFeedAction,
  syncAllICalFeedsAction,
  saveManualCalendarBlockAction,
  deleteCalendarBlockAction,
} from "@/features/properties/actions/calendar-sync.actions";
import type { CalendarBlock, ICalChannelFeed } from "@/features/properties/services/ical-sync.service";

export function PropertyCalendarManager({
  propertyId,
  propertySlug,
  propertyName,
}: {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
}) {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [feeds, setFeeds] = useState<ICalChannelFeed[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Feed form state
  const [channelName, setChannelName] = useState("Airbnb");
  const [feedUrl, setFeedUrl] = useState("");

  // Manual block form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const everloftICalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/ical/${propertySlug}`
    : `https://www.everloft.co.in/api/ical/${propertySlug}`;

  useEffect(() => {
    async function loadData() {
      const data = await fetchCalendarDataAction(propertyId);
      setBlocks(data.blocks);
      setFeeds(data.feeds);
    }
    loadData();
  }, [propertyId]);

  async function handleAddFeed() {
    if (!feedUrl) {
      setMessage({ text: "Please paste a valid iCal feed URL.", type: "error" });
      return;
    }

    setIsAddingFeed(true);
    setMessage(null);
    try {
      const res = await addICalFeedAction(propertyId, channelName, feedUrl);
      if (res.success) {
        setMessage({ text: res.message, type: "success" });
        setFeedUrl("");
        const data = await fetchCalendarDataAction(propertyId);
        setBlocks(data.blocks);
        setFeeds(data.feeds);
      } else {
        setMessage({ text: res.message, type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to add calendar feed.", type: "error" });
    } finally {
      setIsAddingFeed(false);
    }
  }

  async function handleDeleteFeed(feedId: string) {
    setMessage(null);
    const res = await deleteICalFeedAction(propertyId, feedId);
    if (res.success) {
      setMessage({ text: res.message, type: "success" });
      const data = await fetchCalendarDataAction(propertyId);
      setBlocks(data.blocks);
      setFeeds(data.feeds);
    } else {
      setMessage({ text: res.message, type: "error" });
    }
  }

  async function handleSyncAll() {
    setIsSyncingAll(true);
    setMessage(null);
    try {
      const res = await syncAllICalFeedsAction(propertyId);
      if (res.success) {
        setMessage({ text: res.message, type: "success" });
        const data = await fetchCalendarDataAction(propertyId);
        setBlocks(data.blocks);
        setFeeds(data.feeds);
      } else {
        setMessage({ text: res.message, type: "error" });
      }
    } catch {
      setMessage({ text: "An error occurred during multi-channel sync.", type: "error" });
    } finally {
      setIsSyncingAll(false);
    }
  }

  async function handleAddManualBlock() {
    if (!startDate || !endDate) {
      setMessage({ text: "Start and End dates are required.", type: "error" });
      return;
    }

    setIsBlocking(true);
    setMessage(null);
    try {
      const res = await saveManualCalendarBlockAction(propertyId, startDate, endDate, notes);
      if (res.success && res.blocks) {
        setMessage({ text: res.message, type: "success" });
        setStartDate("");
        setEndDate("");
        setNotes("");
        setBlocks(res.blocks);
      } else {
        setMessage({ text: res.message, type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to add manual calendar block.", type: "error" });
    } finally {
      setIsBlocking(false);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    setMessage(null);
    const res = await deleteCalendarBlockAction(propertyId, blockId);
    if (res.success && res.blocks) {
      setMessage({ text: res.message, type: "success" });
      setBlocks(res.blocks);
    } else {
      setMessage({ text: res.message, type: "error" });
    }
  }

  function handleSelectDateRange(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
  }

  function copyICalLink() {
    navigator.clipboard.writeText(everloftICalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleQuickBlock(start: string, end: string, blockNotes?: string) {
    setMessage(null);
    // Instant optimistic update
    const tempId = `blk_${Date.now()}`;
    const newBlock: CalendarBlock = {
      id: tempId,
      propertyId,
      startDate: start.slice(0, 10),
      endDate: end.slice(0, 10),
      reason: "manual_block",
      notes: blockNotes || "Manual Block / Maintenance",
    };
    setBlocks((prev) => [...prev, newBlock]);

    try {
      const res = await saveManualCalendarBlockAction(propertyId, start, end, blockNotes);
      if (res.success && res.blocks) {
        setMessage({ text: res.message, type: "success" });
        setBlocks(res.blocks);
        return true;
      } else {
        setBlocks((prev) => prev.filter((b) => b.id !== tempId));
        setMessage({ text: res.message, type: "error" });
        return false;
      }
    } catch {
      setBlocks((prev) => prev.filter((b) => b.id !== tempId));
      setMessage({ text: "Failed to block dates.", type: "error" });
      return false;
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950 text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-400 border border-white/10">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Multi-Channel Calendar &amp; Sync Manager
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                Interactive calendar grid with 2-way iCal sync for Airbnb, VRBO, Booking.com &amp; custom channels.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncingAll ? "animate-spin" : ""}`} />
            {isSyncingAll ? "Syncing All Channels..." : "Sync All Connected Channels"}
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
              : "bg-rose-100 text-rose-900 border border-rose-300"
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. VISUAL INTERACTIVE AIRBNB-STYLE CALENDAR GRID */}
      <PropertyCalendarGrid
        blocks={blocks}
        onSelectDateRange={handleSelectDateRange}
        onDeleteBlock={handleDeleteBlock}
        onQuickBlock={handleQuickBlock}
      />

      {/* 2. MANUAL DATE BLOCKER FORM */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <h4 className="font-bold text-base text-foreground flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
          Manually Block Dates (Maintenance / Owner Stay)
        </h4>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Reason / Notes</Label>
            <Input placeholder="e.g. Owner Stay / Maintenance" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>
        </div>

        <Button onClick={handleAddManualBlock} disabled={isBlocking} className="mt-4 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold">
          <Plus className="mr-1.5 h-4 w-4" /> Block Dates Now
        </Button>
      </div>

      {/* 3. MULTI-CHANNEL ICAL FEEDS MANAGER */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Channel Feeds */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              <h4 className="font-bold text-base text-foreground">Connect External iCal Feed</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Import calendar feeds from Airbnb, VRBO, Booking.com, Agoda, or any website to automatically block dates on Everloft.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs font-semibold">Select Channel / Platform</Label>
                <select
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Airbnb">Airbnb</option>
                  <option value="VRBO">VRBO / HomeAway</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Agoda">Agoda</option>
                  <option value="Custom Website">Custom Website / Other</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">iCal Feed URL (.ics)</Label>
                <Input
                  placeholder="https://www.airbnb.com/calendar/ical/12345.ics..."
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="mt-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleAddFeed}
            disabled={isAddingFeed}
            className="w-full rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {isAddingFeed ? "Adding Channel Feed..." : "Add & Sync Channel Feed"}
          </Button>
        </div>

        {/* Export Everloft iCal Feed */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h4 className="font-bold text-base text-foreground">Export Everloft iCal Feed URL</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste this URL into Airbnb, VRBO, or Booking.com calendar import settings so direct Everloft bookings block dates on external channels.
            </p>

            <div className="mt-4 space-y-2">
              <Label className="text-xs font-semibold">Everloft iCal Feed URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={everloftICalUrl}
                  className="text-xs font-mono bg-muted/60"
                />
                <Button variant="outline" size="icon" onClick={copyICalLink} className="shrink-0 rounded-xl">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={copyICalLink} className="w-full rounded-full font-bold">
            {copied ? "Copied to Clipboard!" : "Copy Everloft iCal Feed Link"}
          </Button>
        </div>
      </div>

      {/* Connected Channels Table */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-base text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-500" /> Connected Calendar Feeds ({feeds.length})
          </h4>
          {feeds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="rounded-full text-xs font-bold"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
              Sync All
            </Button>
          )}
        </div>

        {feeds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">iCal Feed URL</th>
                  <th className="py-3 px-4">Last Synced</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feeds.map((feed) => (
                  <tr key={feed.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-bold">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {feed.channelName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground max-w-xs truncate">
                      {feed.icalUrl}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {feed.lastSyncedAt ? new Date(feed.lastSyncedAt).toLocaleString() : "Pending"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No external channel feeds connected. Paste an iCal URL above to connect Airbnb, VRBO, or Booking.com.
          </div>
        )}
      </div>

      {/* 4. ACTIVE BLOCKED & SYNCED RANGES LIST */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <h4 className="font-bold text-base text-foreground mb-4">
          All Active Blocked &amp; Synced Date Ranges ({blocks.length})
        </h4>

        {blocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Channel / Reason</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-semibold">{block.startDate}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{block.endDate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          block.channelName?.toLowerCase().includes("airbnb") || block.reason === "airbnb_sync"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : block.channelName?.toLowerCase().includes("vrbo")
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : block.channelName?.toLowerCase().includes("booking")
                            ? "bg-purple-100 text-purple-900 border border-purple-300"
                            : block.reason === "guest_booking"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-rose-100 text-rose-900 border border-rose-300"
                        }`}
                      >
                        {block.channelName || (block.reason === "airbnb_sync" ? "Airbnb" : block.reason === "guest_booking" ? "Direct" : "Manual Block")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{block.notes || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No calendar blocks currently set. Add a channel feed or block dates manually above.
          </div>
        )}
      </div>
    </div>
  );
}
