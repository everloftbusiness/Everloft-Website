"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="outline" size="lg" className="rounded-full" onClick={() => window.print()}>
      <Download className="h-4 w-4" /> Download Invoice
    </Button>
  );
}
