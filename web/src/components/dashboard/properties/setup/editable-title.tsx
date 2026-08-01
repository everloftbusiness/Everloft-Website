"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, Loader2 } from "lucide-react";
import { saveTitleAction } from "@/features/properties/actions/onboarding.actions";

export function EditableTitle({ propertyId, initialName }: { propertyId: string; initialName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function commit() {
    if (!value.trim() || value === initialName) {
      setValue(initialName);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("name", value.trim());
      await saveTitleAction(propertyId, formData);
      router.refresh();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(initialName);
              setEditing(false);
            }
          }}
          autoFocus
          maxLength={80}
          className="rounded-md border border-input bg-transparent px-2 py-1 text-xl font-bold text-primary outline-none focus:border-ring"
        />
        {saving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Check className="h-4 w-4 text-green-600" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 text-left"
      title="Click to rename"
    >
      <h1 className="text-xl font-bold text-primary">{value}</h1>
      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
