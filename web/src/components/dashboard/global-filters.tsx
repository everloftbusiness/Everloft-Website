"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetKey, RangeKey } from "@/lib/dashboard/role-profiles";

const ASSET_LABELS: Record<AssetKey, string> = {
  all: "All Properties",
  marari: "Marari Cove",
  kadavanthra: "Kadavanthra Suites",
  wayanad: "Wayanad Ridge",
};

const RANGE_LABELS: Record<RangeKey, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function GlobalFilters({
  allowedAssets,
  allowedRanges,
  asset,
  range,
}: {
  allowedAssets: AssetKey[];
  allowedRanges: RangeKey[];
  asset: AssetKey;
  range: RangeKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (allowedAssets.length <= 1 && allowedRanges.length <= 1) return null;

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {allowedAssets.length > 1 && (
        <Select value={asset} onValueChange={(v) => update("asset", v)}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedAssets.map((a) => (
              <SelectItem key={a} value={a}>
                {ASSET_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {allowedRanges.length > 1 && (
        <Select value={range} onValueChange={(v) => update("range", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedRanges.map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
