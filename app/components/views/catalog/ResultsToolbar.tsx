"use client";

import { Button } from "@components/ui/button";
import { Grid as GridIcon, List as ListIcon } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  viewMode: "grid" | "list";
  onViewMode: (m: "grid" | "list") => void;
  rightSlot?: React.ReactNode;
};

export default function ResultsToolbar({ title, subtitle, viewMode, onViewMode, rightSlot }: Props) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{title}</h1>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {rightSlot}
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => onViewMode("grid")}>
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => onViewMode("list")}>
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
