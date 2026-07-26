"use client";

import type { ChatOption } from "@/lib/types";

interface OptionButtonsProps {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  disabled?: boolean;
}

export function OptionButtons({ options, onSelect, disabled }: OptionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {options.map((option, index) => (
        <button
          key={`${option.text}-${index}`}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="option-btn w-full px-4 py-3 text-left flex items-center gap-3 text-[15px] leading-snug text-gray-700 hover:text-pink-600 group"
        >
          <span className="option-number">{index + 1}</span>
          <span className="flex-1 font-medium">{option.text}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-pink-300 group-hover:text-pink-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
