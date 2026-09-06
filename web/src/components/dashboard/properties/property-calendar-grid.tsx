"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trash2,
  Lock,
  Unlock,
  Plus,
  Sparkles,
  ShieldCheck,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultChannelColor } from "@/lib/calendar-channel-colors";
import type { CalendarBlock } from "@/features/properties/services/ical-sync.service";

interface PropertyCalendarGridProps {
  blocks: CalendarBlock[];
  channelColors?: Record<string, string>;
  onSelectDateRange?: (startDate: string, endDate: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onQuickBlock?: (startDate: string, endDate: string, notes?: string) => Promise<boolean | void>;
}

export function PropertyCalendarGrid({
  blocks,
  channelColors = {},
  onSelectDateRange,
  onDeleteBlock,
  onQuickBlock,
}: PropertyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);

  // Range Selection State
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [blockNotes, setBlockNotes] = useState<string>("Owner Stay / Maintenance");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  function formatYmdDate(dateObj: Date): string {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Returns effective start and end dates for a block, converting single-day blocks (startDate === endDate)
   * into a 1-night stay (check-in on startDate, check-out on next day).
   */
  function getEffectiveBlockDates(block: CalendarBlock): { startYmd: string; endYmd: string } {
    const startYmd = (block.startDate || "").slice(0, 10);
    let endYmd = (block.endDate || "").slice(0, 10);

    if (startYmd && endYmd && startYmd === endYmd) {
      const d = new Date(`${startYmd}T00:00:00`);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      endYmd = `${y}-${m}-${day}`;
    }

    return { startYmd, endYmd };
  }

  /**
   * Returns active blocks for a given date using PMS exclusive end-date logic [startDate, endDate)
   */
  function getBlocksForDate(dateStr: string): CalendarBlock[] {
    return blocks.filter((b) => {
      const { startYmd, endYmd } = getEffectiveBlockDates(b);
      return dateStr >= startYmd && dateStr < endYmd;
    });
  }

  function getGuestInitial(label: string) {
    const clean = label.replace(/^airbnb:\s*/i, "").trim();
    return (clean.charAt(0) || "A").toUpperCase();
  }

  function getBlockBarStyle(block: CalendarBlock) {
    const ch = (block.channelName || block.reason || "").toLowerCase();
    if (ch.includes("airbnb") || block.reason === "channel_sync") {
      return "bg-[#222222] text-white font-medium shadow-sm";
    }
    if (ch.includes("vrbo")) {
      return "bg-blue-600 text-white font-medium shadow-sm";
    }
    if (ch.includes("booking")) {
      return "bg-indigo-700 text-white font-medium shadow-sm";
    }
    if (block.reason === "guest_booking") {
      return "bg-emerald-700 text-white font-medium shadow-sm";
    }
    return "bg-neutral-800 text-white font-medium shadow-sm";
  }

  function getBlockColor(block: CalendarBlock): string | undefined {
    if (block.reason === "manual_block") return undefined;
    const channelName = block.channelName || block.reason;
    return channelColors[channelName.toLowerCase()] || defaultChannelColor(channelName);
  }

  function getChannelLabel(block: CalendarBlock) {
    if (block.notes && !block.notes.toLowerCase().startsWith("calendar block")) {
      return block.notes.replace(/^airbnb:\s*/i, "");
    }
    if (block.channelName) return block.channelName;
    if (block.reason && block.reason !== "manual_block" && block.reason !== "channel_sync" && block.reason !== "airbnb_sync") {
      return block.reason.replace(/^airbnb:\s*/i, "");
    }
    if (block.reason === "airbnb_sync") return "Airbnb";
    if (block.reason === "guest_booking") return "Direct Booking";
    return "Owner Block";
  }

  function handleDayClick(dateStr: string) {
    if (dateStr < formatYmdDate(new Date())) return;

    // A second click on either endpoint is an explicit deselect action.
    if (dateStr === rangeStart || dateStr === rangeEnd) {
      setRangeStart(null);
      setRangeEnd(null);
      return;
    }

    const activeOnDate = getBlocksForDate(dateStr);

    if (rangeStart && !rangeEnd) {
      let finalStart = rangeStart;
      let finalEnd = dateStr;
      if (dateStr < rangeStart) {
        finalStart = dateStr;
        finalEnd = rangeStart;
      }
      setRangeStart(finalStart);
      setRangeEnd(finalEnd);
      if (onSelectDateRange) onSelectDateRange(finalStart, finalEnd);
      return;
    }

    if (activeOnDate.length > 0) {
      setSelectedBlock(activeOnDate[0]);
      return;
    }

    setRangeStart(dateStr);
    setRangeEnd(null);
    if (onSelectDateRange) onSelectDateRange(dateStr, dateStr);
  }

  async function handleConfirmQuickBlock() {
    if (!rangeStart) return;
    const start = rangeStart;
    const end = rangeEnd || rangeStart;

    setIsSubmitting(true);
    try {
      if (onQuickBlock) {
        await onQuickBlock(start, end, blockNotes);
      }
      setRangeStart(null);
      setRangeEnd(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickUnblockRange() {
    if (!rangeStart || !onDeleteBlock) return;
    const start = rangeStart;
    const end = rangeEnd || rangeStart;

    const overlapping = blocks.filter(
      (b) => {
        const startYmd = (b.startDate || "").slice(0, 10);
        const endYmd = (b.endDate || "").slice(0, 10);
        return startYmd < end && endYmd > start;
      }
    );

    setIsSubmitting(true);
    try {
      for (const block of overlapping) {
        onDeleteBlock(block.id);
      }
      setRangeStart(null);
      setRangeEnd(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const todayStr = formatYmdDate(new Date());

  // Grid cells generation
  const gridCells = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const pDay = prevMonthLastDay - i;
    const pDateStr = formatYmdDate(new Date(year, month - 1, pDay));
    gridCells.push({
      dateStr: pDateStr,
      dayNumber: pDay,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = formatYmdDate(new Date(year, month, d));
    gridCells.push({
      dateStr: dStr,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  const remainingCells = (7 - (gridCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nDateStr = formatYmdDate(new Date(year, month + 1, n));
    gridCells.push({
      dateStr: nDateStr,
      dayNumber: n,
      isCurrentMonth: false,
    });
  }

  const effectiveStart = rangeStart;
  const effectiveEnd = rangeEnd || rangeStart || "";
  const overlappingSelectedBlocks = effectiveStart
    ? blocks.filter((b) => {
        const s = b.startDate.slice(0, 10);
        const e = b.endDate.slice(0, 10);
        return s < effectiveEnd && e > effectiveStart;
      })
    : [];
  const isSelectedRangeBlocked = overlappingSelectedBlocks.length > 0;

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xs relative font-sans">
      {/* Airbnb-Style Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-2xl font-bold text-foreground">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth} className="rounded-full h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="rounded-full text-xs font-semibold px-3 h-8">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="rounded-full h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Airbnb-Style Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="font-bold text-foreground">Legend:</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open / Available (₹2.6K)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-[#222222] text-white font-semibold shadow-xs">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Airbnb Reservation (Guest Stay)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-300 dark:border-neutral-700">
          <span className="h-2 w-2 rounded-full bg-neutral-400" /> Owner Blocked / Unavailable
        </span>
      </div>

      {/* Floating Action Bar */}
      {rangeStart && (
        <div className="sticky top-4 z-40 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-neutral-900 via-slate-900 to-black p-4 text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Selected Range
                </span>
              </div>
              <p className="text-sm font-bold text-white">
                {rangeStart} {rangeEnd && rangeEnd !== rangeStart ? `→ ${rangeEnd}` : "(Select end date)"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {!isSelectedRangeBlocked ? (
                <>
                  <Input
                    placeholder="Reason (e.g. Owner Stay)"
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    className="h-9 text-xs bg-white/10 border-white/20 text-white placeholder:text-slate-400 w-full sm:w-48"
                  />
                  <Button
                    onClick={handleConfirmQuickBlock}
                    disabled={isSubmitting}
                    className="h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 shadow-sm w-full sm:w-auto"
                  >
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                    Block Dates
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleQuickUnblockRange}
                  disabled={isSubmitting || !onDeleteBlock}
                  className="h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 shadow-sm w-full sm:w-auto"
                >
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  Unblock Dates ({overlappingSelectedBlocks.length})
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRangeStart(null);
                  setRangeEnd(null);
                }}
                className="h-9 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid Container */}
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

          {/* Days Grid (Exact Airbnb Soft Card Borders) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border border-b border-l border-r border-border rounded-b-2xl overflow-hidden">
            {gridCells.map((cell, idx) => {
              const activeBlocks = getBlocksForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              const isStart = cell.dateStr === rangeStart;
              const isEnd = cell.dateStr === rangeEnd;
              const isInRange =
                rangeStart &&
                rangeEnd &&
                cell.dateStr > rangeStart &&
                cell.dateStr < rangeEnd;

              const isBlocked = activeBlocks.length > 0;
              const isOwnerBlocked = activeBlocks.some((b) => b.reason === "manual_block");
              const isPastDate = cell.dateStr < todayStr;
              // The check-in cell owns the label that flows across a multi-day bar.
              // Put that cell above later siblings so their backgrounds cannot cover it.
              const startsBlock = blocks.some((b) => getEffectiveBlockDates(b).startYmd === cell.dateStr);

              let cellBg = cell.isCurrentMonth
                ? "bg-card hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50"
                : "bg-muted/20 opacity-30";

              if (isOwnerBlocked) {
                cellBg = "bg-neutral-200/90 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-300/80";
              }

              if (isStart || isEnd) {
                cellBg = "bg-neutral-900 text-white font-bold ring-2 ring-emerald-500 ring-inset";
              } else if (isInRange) {
                cellBg = "bg-emerald-200/60 dark:bg-emerald-900/40 font-semibold";
              }
              if (isPastDate) cellBg = "bg-muted/50 text-muted-foreground opacity-60 cursor-not-allowed";

              return (
                <div
                  key={`${cell.dateStr}_${idx}`}
                  onClick={() => cell.isCurrentMonth && !isPastDate && handleDayClick(cell.dateStr)}
                  aria-disabled={isPastDate}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors relative cursor-pointer group select-none ${startsBlock ? "z-30" : "z-0"} ${cellBg}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isStart || isEnd
                          ? "bg-white text-neutral-900 shadow-xs"
                          : isToday
                          ? "bg-rose-500 text-white shadow-xs font-black"
                          : cell.isCurrentMonth
                          ? "text-foreground group-hover:text-neutral-900 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isOwnerBlocked && (
                      <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                        Blocked
                      </span>
                    )}
                  </div>

                  {/* Clean Connected Horizontal Timeline Engine (Check-In to Check-Out) */}
                  <div className="mt-1 relative z-20 min-h-[30px] flex items-center -mx-[9px] w-[calc(100%+18px)]">
                    {(() => {
                      const dateStr = cell.dateStr;
                      const isWeekStart = idx % 7 === 0;
                      const isWeekEnd = idx % 7 === 6;

                      const checkoutBlock = blocks.find((b) => {
                        const { startYmd, endYmd } = getEffectiveBlockDates(b);
                        return endYmd === dateStr && startYmd !== dateStr;
                      });
                      const checkinBlock = blocks.find((b) => {
                        const { startYmd } = getEffectiveBlockDates(b);
                        return startYmd === dateStr;
                      });
                      const middleBlock = blocks.find((b) => {
                        const { startYmd, endYmd } = getEffectiveBlockDates(b);
                        return dateStr > startYmd && dateStr < endYmd;
                      });

                      // Case 1: Same-Day Turnover (Check-out AM connected to Check-in PM)
                      if (checkoutBlock && checkinBlock) {
                        return (
                          <div className="flex items-center justify-between w-full h-7 relative z-20">
                            {/* Check-Out AM Bar (Left 38% connected from left border - NO Out text & 100% solid opacity) */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlock(checkoutBlock);
                              }}
                              title={`Check-out: ${getChannelLabel(checkoutBlock)}`}
                              className={`w-[38%] h-full flex items-center justify-center rounded-r-md cursor-pointer shadow-xs ${getBlockBarStyle(
                                checkoutBlock
                              )}`}
                              style={{ backgroundColor: getBlockColor(checkoutBlock) }}
                            />

                            {/* Turnover Gap Divider */}
                            <div className="w-[4%] h-[2px] bg-neutral-400/40 dark:bg-neutral-600/40 rounded-full" />

                            {/* Check-In PM Bar (Right 58% connected to right border with initial avatar) */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlock(checkinBlock);
                              }}
                              title={`Check-in: ${getChannelLabel(checkinBlock)}`}
                              className={`w-[58%] h-full flex items-center text-[11px] font-bold rounded-l-full pl-1.5 cursor-pointer shadow-xs relative ${getBlockBarStyle(
                                checkinBlock
                              )}`}
                              style={{ backgroundColor: getBlockColor(checkinBlock) }}
                            >
                              <span className="flex items-center gap-1.5 whitespace-nowrap absolute left-1.5 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
                                <div className="h-4 w-4 rounded-full bg-neutral-700 text-white font-bold flex items-center justify-center text-[9px] shrink-0 border border-white/20">
                                  {getGuestInitial(getChannelLabel(checkinBlock))}
                                </div>
                                <span className="text-[10px] font-bold whitespace-nowrap z-40 drop-shadow-xs">
                                  {getChannelLabel(checkinBlock)}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Case 2: Check-Out Morning ONLY (100% solid bar connected from left border to check-out AM - NO Out text)
                      if (checkoutBlock && !checkinBlock) {
                        return (
                          <div className="flex items-center w-full h-7 relative z-20">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlock(checkoutBlock);
                              }}
                              title={`Check-out Morning: ${getChannelLabel(checkoutBlock)}`}
                              className={`w-[35%] h-full rounded-r-full cursor-pointer shadow-xs ${getBlockBarStyle(
                                checkoutBlock
                              )}`}
                              style={{ backgroundColor: getBlockColor(checkoutBlock) }}
                            />
                          </div>
                        );
                      }

                      // Case 3: Check-In Afternoon ONLY (Bar starting at check-in PM, label flowing continuously across stay dates)
                      if (checkinBlock && !checkoutBlock) {
                        return (
                          <div className="flex items-center w-full h-7 relative z-30 overflow-visible">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlock(checkinBlock);
                              }}
                              className={`w-[75%] ml-auto h-full flex items-center text-[11px] font-bold rounded-l-full pl-2 pr-1 shadow-sm cursor-pointer relative overflow-visible ${getBlockBarStyle(
                                checkinBlock
                              )}`}
                              style={{ backgroundColor: getBlockColor(checkinBlock) }}
                            >
                              <span className="flex items-center gap-1.5 whitespace-nowrap absolute left-2 top-1/2 -translate-y-1/2 z-40 pointer-events-none overflow-visible">
                                <div className="h-4.5 w-4.5 rounded-full bg-neutral-700 text-white font-bold flex items-center justify-center text-[9px] shrink-0 border border-white/20">
                                  {getGuestInitial(getChannelLabel(checkinBlock))}
                                </div>
                                <span className="font-bold text-white z-40 drop-shadow-xs whitespace-nowrap overflow-visible">
                                  {getChannelLabel(checkinBlock)}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Case 4: Middle Night Stay (100% Edge-to-Edge Solid Bar without narrow line gaps)
                      if (middleBlock) {
                        const shapeClasses = isWeekStart
                          ? "rounded-l-md pl-2 pr-1"
                          : isWeekEnd
                          ? "rounded-r-md px-1"
                          : "rounded-none px-1";

                        return (
                          <div className="flex items-center w-full h-7 relative z-20">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlock(middleBlock);
                              }}
                              className={`w-full h-full flex items-center text-[11px] font-bold shadow-xs cursor-pointer ${shapeClasses} ${getBlockBarStyle(
                                middleBlock
                              )}`}
                              style={{ backgroundColor: getBlockColor(middleBlock) }}
                            >
                              {isWeekStart ? (
                                <span className="flex items-center gap-1.5 px-0.5 whitespace-nowrap relative z-30">
                                  <div className="h-4.5 w-4.5 rounded-full bg-neutral-700 text-white font-bold flex items-center justify-center text-[9px] shrink-0 border border-white/20">
                                    {getGuestInitial(getChannelLabel(middleBlock))}
                                  </div>
                                  <span className="whitespace-nowrap font-bold text-white max-w-[270px] truncate z-30">
                                    {getChannelLabel(middleBlock)}
                                  </span>
                                </span>
                              ) : (
                                <span className="h-full w-full block bg-transparent" />
                              )}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>

                  {/* Airbnb Nightly Rate Display in Cell (Bottom) */}
                  <div className="text-[11px] font-bold text-foreground mt-1 flex items-center justify-between">
                    {isOwnerBlocked ? (
                      <span className="line-through text-neutral-400 font-normal">₹2.8K</span>
                    ) : (
                      <span>₹2.6K</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reservation Inspector & Double Booking Conflict Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-amber-400 font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-foreground">Reservation Inspector</h4>
                  <p className="text-xs text-muted-foreground">Detailed stay breakdown & channel source</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBlock(null)}
                className="h-8 w-8 rounded-full p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Overlap / Double Booking Warning Banner */}
            {(() => {
              const activeOnSelectedDate = getBlocksForDate(selectedBlock.startDate);
              if (activeOnSelectedDate.length > 1) {
                return (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-700 dark:text-rose-300 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold">⚠️ Double Booking / Overlap Conflict Detected!</p>
                      <p className="mt-0.5 opacity-90">
                        {activeOnSelectedDate.length} channels have conflicting blocks for these dates. Please resolve or unblock the incorrect feed.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Reservation Card Details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4 rounded-2xl border border-border">
                <div>
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Check-In (PM)</span>
                  <p className="font-mono font-bold text-sm text-foreground mt-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {selectedBlock.startDate}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Check-Out (AM)</span>
                  <p className="font-mono font-bold text-sm text-foreground mt-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    {selectedBlock.endDate}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/20 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground font-medium">Channel Source</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{getChannelLabel(selectedBlock)}</p>
                </div>
                <div className="bg-muted/20 p-3 rounded-xl border border-border">
                  <span className="text-muted-foreground font-medium">Block Type</span>
                  <p className="font-bold text-foreground text-sm mt-0.5 uppercase tracking-wide">{selectedBlock.reason}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Guest / Summary Notes</span>
                <p className="font-medium text-foreground mt-1 text-sm leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
                  {selectedBlock.notes || selectedBlock.reason}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedBlock(null)}
                className="rounded-full text-xs font-semibold px-5"
              >
                Close
              </Button>
              {onDeleteBlock && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDeleteBlock(selectedBlock.id);
                    setSelectedBlock(null);
                  }}
                  className="rounded-full text-xs font-bold px-5"
                >
                  <Unlock className="mr-1.5 h-3.5 w-3.5" /> Unblock This Reservation
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
