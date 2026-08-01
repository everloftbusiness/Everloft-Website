"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { saveHouseRulePresetsAction } from "@/features/properties/actions/onboarding.actions";
import { STANDARD_HOUSE_RULES } from "@/lib/data/house-rules";

export function HouseRulesPresets({
  propertyId,
  initialPresets,
  initialCustomRules,
}: {
  propertyId: string;
  initialPresets: string[];
  initialCustomRules: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialPresets));
  const [customRules, setCustomRules] = useState<string[]>(initialCustomRules);
  const [newCustomRule, setNewCustomRule] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const visibleRules = useMemo(() => {
    if (!search.trim()) return STANDARD_HOUSE_RULES;
    const q = search.trim().toLowerCase();
    return STANDARD_HOUSE_RULES.filter((r) => r.toLowerCase().includes(q));
  }, [search]);

  function toggle(rule: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rule)) next.delete(rule);
      else next.add(rule);
      return next;
    });
  }

  function addCustomRule() {
    const trimmed = newCustomRule.trim();
    if (!trimmed) return;
    setCustomRules((prev) => [...prev, trimmed]);
    setNewCustomRule("");
  }

  function removeCustomRule(index: number) {
    setCustomRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setStatus("saving");
    try {
      await saveHouseRulePresetsAction(propertyId, Array.from(selected), customRules);
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="space-y-5 border-t border-border pt-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Standard rules</p>
        <div className="relative mb-3 w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rules..." className="h-8 pl-8 text-xs" />
        </div>
        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {visibleRules.map((rule) => (
            <label key={rule} className="flex items-start gap-2 rounded-lg border border-border p-2.5 text-sm">
              <Checkbox checked={selected.has(rule)} onCheckedChange={() => toggle(rule)} className="mt-0.5" />
              {rule}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Your own rules</p>
        <p className="mb-2 text-xs text-muted-foreground">
          For anything specific — e.g. exact quiet hours, parking instructions, or a rule not covered above.
        </p>
        <div className="mb-2 space-y-2">
          {customRules.map((rule, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
              {rule}
              <button type="button" onClick={() => removeCustomRule(i)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCustomRule}
            onChange={(e) => setNewCustomRule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomRule();
              }
            }}
            placeholder="e.g. Quiet hours strictly 10 PM–7 AM"
          />
          <Button type="button" variant="outline" size="sm" onClick={addCustomRule}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="gold" size="sm" onClick={handleSave} disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </Button>
        {status === "saved" && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        {status === "failed" && (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> Failed — try again
          </span>
        )}
      </div>
    </div>
  );
}
