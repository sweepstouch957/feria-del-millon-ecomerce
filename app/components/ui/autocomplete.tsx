"use client";

import * as React from "react";
import { Fragment, useMemo, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@lib/utils";

export type AutocompleteOption = {
    value: string; // id / value
    label: string; // texto que se muestra
};

type AutocompleteProps = {
    value?: string;
    onChange: (value: string) => void;
    options: AutocompleteOption[];

    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    /** Texto cuando no hay resultados */
    emptyText?: string;
};

export function Autocomplete({
    value,
    onChange,
    options,
    placeholder = "Selecciona…",
    disabled,
    loading,
    className,
    emptyText = "Sin resultados",
}: AutocompleteProps) {
    const selected = useMemo(
        () => options.find((o) => o.value === value) ?? null,
        [options, value]
    );

    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(q)
        );
    }, [options, query]);

    return (
        <Combobox
            value={selected}
            onChange={(opt: AutocompleteOption | null) => {
                if (!opt) {
                    onChange("");
                    return;
                }
                onChange(opt.value);
            }}
            disabled={disabled}
        >
            <div className={cn("relative", className)}>
                {/* Input */}
                <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <Combobox.Input
                        displayValue={(opt: AutocompleteOption | null) =>
                            opt?.label ?? ""
                        }
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={placeholder}
                        className="w-full border-none bg-transparent px-3 py-2 pr-8 text-sm text-gray-900 focus:outline-none"
                    />
                    <ChevronsUpDown className="pointer-events-none absolute inset-y-0 right-2 my-auto h-4 w-4 text-gray-400" />
                </div>

                {/* Dropdown */}
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setQuery("")}
                >
                    <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 text-sm shadow-lg">
                        {loading ? (
                            <div className="px-3 py-2 text-xs text-gray-500">
                                Cargando…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500">
                                {emptyText}
                            </div>
                        ) : (
                            filtered.map((opt) => (
                                <Combobox.Option
                                    key={opt.value}
                                    value={opt}
                                    className={({ active }) =>
                                        cn(
                                            "flex cursor-pointer select-none items-center gap-2 px-3 py-1.5 text-sm",
                                            active ? "bg-gray-100 text-gray-900" : "text-gray-900"
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    selected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="line-clamp-1">{opt.label}</span>
                                        </>
                                    )}
                                </Combobox.Option>
                            ))
                        )}
                    </Combobox.Options>
                </Transition>
            </div>
        </Combobox>
    );
}
