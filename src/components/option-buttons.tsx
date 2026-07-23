"use client";

import { cn } from "@/lib/utils";
import type { ChatOption } from "@/lib/types";

interface OptionButtonsProps {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  disabled?: boolean;
  selectedIndex?: number | null;
}

export function OptionButtons({
  options,
  onSelect,
  disabled,
  selectedIndex,
}: OptionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => !disabled && onSelect(option)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 text-left text-[15px] rounded-xl border transition-all duration-200 btn-press",
            "min-h-[44px]",
            selectedIndex === index
              ? "bg-pink-50 border-pink-300 text-pink-600"
              : "bg-white border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50/50 active:scale-[0.98]",
            disabled && selectedIndex !== index &&
              "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white",
          )}
        >
          <span className="mr-2 text-pink-400 text-sm font-medium">
            {index + 1}.
          </span>
          {option.text}
        </button>
      ))}
    </div>
  );
}
