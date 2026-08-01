"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqCategory } from "@/lib/data/faqs";

export function FaqPageClient({ categories }: { categories: FaqCategory[] }) {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, query]);

  return (
    <div className="mt-10">
      <div className="sticky top-20 z-10 -mx-4 bg-background/95 px-4 py-4 backdrop-blur-md">
        <div className="relative mx-auto max-w-lg">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs…"
            className="h-12 rounded-full pl-11"
          />
        </div>
      </div>

      {query.trim() ? (
        <div className="mt-8">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((c) => (
              <div key={c.slug} className="mb-8">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gold">{c.label}</h2>
                <FaqAccordion items={c.items} />
              </div>
            ))
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No results for &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          )}
        </div>
      ) : (
        <Tabs defaultValue={categories[0]?.slug} className="mt-8">
          <TabsList className="mb-8 flex h-auto w-full flex-wrap justify-center gap-2 bg-transparent p-0">
            {categories.map((c) => (
              <TabsTrigger
                key={c.slug}
                value={c.slug}
                className="flex-none rounded-full border border-border px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((c) => (
            <TabsContent key={c.slug} value={c.slug}>
              <FaqAccordion items={c.items} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
