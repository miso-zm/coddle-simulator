import { GameApp } from "@/components/game-app";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">加载中…</div>}>
      <GameApp />
    </Suspense>
  );
}
