"use client";

import { useState, useEffect } from "react";
import type { LocalRecords } from "@/lib/types";
import { getLocalRecords } from "@/lib/storage";
import { SCENES } from "@/lib/constants";

export function BestRecordsPanel() {
  const [records, setRecords] = useState<LocalRecords>({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setRecords(getLocalRecords());
  }, [isOpen]);

  const hasAnyRecord = Object.values(records).some(
    (r) => r.bestRounds > 0,
  );

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl text-sm text-gray-600 hover:bg-white/80 transition-colors btn-press"
      >
        <span>🏆 我的最佳战绩</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-white/80 backdrop-blur-sm rounded-xl animate-fade-in">
          {!hasAnyRecord ? (
            <p className="text-center text-sm text-gray-400 py-4">
              还没有战绩记录，快去挑战吧！
            </p>
          ) : (
            <div className="space-y-2">
              {SCENES.map((scene) => {
                const record = records[scene.id];
                if (!record || !record.bestRounds) return null;
                return (
                  <div
                    key={scene.id}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{scene.emoji}</span>
                      <span className="text-gray-700">{scene.title}</span>
                    </div>
                    <div className="text-pink-500 font-medium">
                      {record.bestRounds} 轮通关
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
