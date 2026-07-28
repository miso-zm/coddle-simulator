import { GameApp } from "@/components/game-app";
import { UserNav } from "@/components/user-nav";
import { Suspense } from "react";
import { getCurrentUser } from "@/storage/database/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      {/* 顶部用户栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-end pointer-events-none">
        <div className="pointer-events-auto">
          <UserNav initialUser={user} />
        </div>
      </div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">加载中…</div>}>
        <GameApp />
      </Suspense>
    </>
  );
}
