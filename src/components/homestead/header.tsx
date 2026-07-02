"use client";

import { Calendar, Cloud, Leaf, MapPin } from "lucide-react";
import { seasonOf } from "./types";

export function Header() {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Hearthstead
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
                The Homestead Journal
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A quiet ledger for chores, plantings, and the turn of the seasons.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-secondary-foreground ring-1 ring-border">
              <Calendar className="h-3.5 w-3.5" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-primary ring-1 ring-primary/30">
              <Leaf className="h-3.5 w-3.5" />
              {seasonOf()} work
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-accent-foreground ring-1 ring-accent/30">
              <Cloud className="h-3.5 w-3.5" />
              Mild &amp; fair
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-muted-foreground ring-1 ring-border">
              <MapPin className="h-3.5 w-3.5" />
              Hillside plot
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
