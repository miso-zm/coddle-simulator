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
    <div className="flex flex-col gap-1.5 w-full">
      <div className="text-[11px] text-gray-400 px-1 mb-0.5">
        选择你要说的话
      </div>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => !disabled && onSelect(option)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2.5 text-left text-[14px] rounded-2xl border transition-all duration-150 btn-press",
            "min-h-[40px] leading-relaxed",
            selectedIndex === index
              ? "bg-[#95EC69]/20 border-[#7ED321]/40 text-gray-800"
              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]",
            disabled && selectedIndex !== index &&
              "opacity-60 cursor-not-allowed hover:border-gray-200 hover:bg-white",
          )}
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}
