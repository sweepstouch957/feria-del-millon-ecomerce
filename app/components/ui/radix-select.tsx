import * as Select from "@radix-ui/react-select";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { ChevronDown } from "lucide-react";
import React from "react";

export const RadixSelect: React.FC<{
  value?: string;
  onValueChange: (v: string) => void;
  items: { label: string; value: string }[] | string[];
  placeholder?: string;
  className?: string;
}> = ({
  value,
  onValueChange,
  items,
  placeholder = "Selecciona…",
  className,
}) => {
  const opts: { label: string; value: string }[] = Array.isArray(items)
    ? (items as any[]).map((i) =>
        typeof i === "string" ? { label: i, value: i } : i
      )
    : [];

  return (
    <Select.Root
      // 👇 si no hay selección, usa undefined (NO string vacío)
      value={value || undefined}
      onValueChange={onValueChange}
    >
      <Select.Trigger
        className={
          className ??
          "inline-flex w-full items-center justify-between rounded-xl border border-neutral-200 px-3 py-2.5 text-left text-sm outline-none"
        }
        aria-label="Select"
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="size-4 opacity-60" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
          position="popper"
        >
          {/* Puedes envolver el Viewport con ScrollArea si la lista es larga */}
          <ScrollArea.Root className="h-60 w-64">
            {/* 👇 El viewport DEBE ser el de Radix Select */}
            <Select.Viewport className="p-1">
              {opts.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-neutral-100"
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2">
                    ✓
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>

            <ScrollArea.Scrollbar
              orientation="vertical"
              className="flex select-none touch-none p-0.5"
            >
              <ScrollArea.Thumb className="flex-1 rounded bg-neutral-300" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};
