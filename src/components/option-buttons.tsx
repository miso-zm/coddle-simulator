"use client";

import type { ChatOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OptionButtonsProps {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  disabled?: boolean;
  selectedIndex?: number | null;
}

export function OptionButtons({
  options,
  onSelect,
  disabled = false,
  selectedIndex = null,
}: OptionButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isDisabled = disabled && !isSelected;

        return (
          <button
            key={index}
            onClick={() => !disabled && onSelect(option)}
            disabled={disabled}
            className={cn(
              "quick-reply-bubble w-full text-left px-4 py-2.5 text-[14.5px] leading-relaxed text-gray-800",
              "transition-all duration-200 ease-out",
              isSelected && "bg-white ring-2 ring-pink-300/50 scale-[0.99]",
              isDisabled && "opacity-50 cursor-not-allowed",
            )}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <span className="text-pink-400 font-medium mr-2 text-[13px]">
              {index + 1}
            </span>
            {option.text}
          </button>
        );
      })}
    </div>
  );
}
