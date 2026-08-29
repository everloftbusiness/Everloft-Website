"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trash2,
  Info,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarBlock } from "@/features/properties/services/ical-sync.service";

interface PropertyCalendarGridProps {
  blocks: CalendarBlock[];
  onSelectDateRange?: (startDate: string, endDate: string) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export function PropertyCalendarGrid({
  blocks,
  onSelectDateRange,
  onDeleteBlock,
}: PropertyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Date Math for Grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  function formatYmd(year: number, monthZeroBased: number, day: number): string {
    const m = String(monthZeroBased + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  // Get blocks covering a specific date
  function getBlocksForDate(dateStr: string): CalendarBlock[] {
    return blocks.filter((b) => dateStr >= b.startDate && dateStr < b.endDate);
  }

  // Channel badge color helpers
  function getBlockBadgeStyle(block: CalendarBlock) {
    const ch = (block.channelName || block.reason || "").toLowerCase();
    if (ch.includes("airbnb")) {
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    }
    if (ch.includes("vrbo")) {
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
    }
    if (ch.includes("booking")) {
      return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
    }
    if (ch.includes("agoda")) {
      return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
    }
    if (block.reason === "guest_booking") {
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
    // Manual block / Maintenance
    return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  }

  function getChannelLabel(block: CalendarBlock) {
    if (block.channelName) return block.channelName;
    if (block.reason === "airbnb_sync") return "Airbnb";
    if (block.reason === "guest_booking") return "Direct Booking";
    return "Manual Block";
  }

  function handleDayClick(dateStr: string) {
    if (!onSelectDateRange) return;

    if (!selectionStart) {
      setSelectionStart(dateStr);
    } else {
      if (dateStr >= selectionStart) {
        onSelectDateRange(selectionStart, dateStr);
      } else {
        onSelectDateRange(dateStr, selectionStart);
      }
      setSelectionStart(null);
    }
  }

  const todayStr = formatYmd(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Grid cells generation
  const gridCells = [];

  // Padding days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const pDay = prevMonthLastDay - i;
    const pDateStr = formatYmd(year, month - 1, pDay);
    gridCells.push({
      dateStr: pDateStr,
      dayNumber: pDay,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = formatYmd(year, month, d);
    gridCells.push({
      dateStr: dStr,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Padding days for next month to complete grid row
  const remainingCells = (7 - (gridCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nDateStr = formatYmd(year, month + 1, n);
    gridCells.push({
      dateStr: nDateStr,
      dayNumber: n,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xs">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-muted-foreground">
              Visual monthly calendar view with channel sync &amp; manual blocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="rounded-xl text-xs font-semibold">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend Badge Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-muted-foreground mr-1">Legend:</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Airbnb
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> VRBO
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          <span className="h-2 w-2 rounded-full bg-purple-500" /> Booking.com
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Manual Block / Maintenance
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Direct Booking
        </span>
      </div>

      {selectionStart && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Start date selected: <strong className="font-mono">{selectionStart}</strong>. Click an end date on the calendar below to auto-fill the block form.
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectionStart(null)} className="h-7 text-xs text-amber-700 hover:text-amber-900">
            Cancel
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {weekDays.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border border-b border-l border-r border-border rounded-b-2xl overflow-hidden">
            {gridCells.map((cell, idx) => {
              const activeBlocks = getBlocksForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isSelectedStart = cell.dateStr === selectionStart;

              return (
                <div
                  key={`${cell.dateStr}_${idx}`}
                  onClick={() => cell.isCurrentMonth && handleDayClick(cell.dateStr)}
                  className={`min-h-[96px] p-2 flex flex-col justify-between transition-colors relative cursor-pointer group ${
                    cell.isCurrentMonth ? "bg-card hover:bg-muted/40" : "bg-muted/20 opacity-40"
                  } ${isSelectedStart ? "ring-2 ring-amber-500 ring-inset bg-amber-50/20" : ""}`}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isToday
                          ? "bg-amber-500 text-white shadow-xs"
                          : cell.isCurrentMonth
                          ? "text-foreground group-hover:text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {activeBlocks.length > 0 && (
                      <Lock className="h-3 w-3 text-rose-500 shrink-0" />
                    )}
                  </div>

                  {/* Block Badges */}
                  <div className="mt-1 space-y-1">
                    {activeBlocks.slice(0, 2).map((b) => (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBlock(b);
                        }}
                        className={`w-full text-left truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold border transition-all hover:scale-[1.02] ${getBlockBadgeStyle(
                          b
                        )}`}
                      >
                        {getChannelLabel(b)}
                      </button>
                    ))}
                    {activeBlocks.length > 2 && (
                      <span className="text-[9px] font-bold text-muted-foreground block text-right">
                        +{activeBlocks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Popover / Modal for Selected Block */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${getBlockBadgeStyle(selectedBlock)}`}>
                  {getChannelLabel(selectedBlock)}
                </span>
                <h4 className="font-serif text-base font-bold text-foreground">Block Details</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBlock(null)} className="h-7 w-7 rounded-full p-0">
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-2xl border border-border">
                <div>
                  <span className="text-muted-foreground font-medium">Start Date</span>
                  <p className="font-mono font-bold text-foreground mt-0.5">{selectedBlock.startDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">End Date</span>
                  <p className="font-mono font-bold text-foreground mt-0.5">{selectedBlock.endDate}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-medium">Notes / Source</span>
                <p className="font-medium text-foreground mt-0.5 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border">
                  {selectedBlock.notes || selectedBlock.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setSelectedBlock(null)} className="rounded-full text-xs font-semibold">
                Close
              </Button>
              {onDeleteBlock && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDeleteBlock(selectedBlock.id);
                    setSelectedBlock(null);
                  }}
                  className="rounded-full text-xs font-bold"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove Block
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
