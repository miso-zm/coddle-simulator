import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/storage/database/auth";
import { getRecordsByUserId } from "@/storage/database/game-record-repo";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const records = await getRecordsByUserId(user.id);
  const winCount = records.filter((r) => r.result === "win").length;
  const bestScore = records.length
    ? Math.max(...records.map((r) => r.finalScore))
    : 0;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-pink-500 hover:text-pink-600 mb-6 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        {/* 用户信息卡 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-pink-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{user.username}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                加入于 {new Date(user.created_at).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-pink-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-500">{records.length}</div>
              <div className="text-xs text-gray-400 mt-1">总场次</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{winCount}</div>
              <div className="text-xs text-gray-400 mt-1">通关次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{bestScore}</div>
              <div className="text-xs text-gray-400 mt-1">最高好感度</div>
            </div>
          </div>
        </div>

        {/* 历史记录 */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">游戏记录</h2>

        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-pink-50">
            <div className="text-5xl mb-4">🎮</div>
            <p className="text-gray-400 text-sm">还没有游戏记录</p>
            <p className="text-gray-300 text-xs mt-1">快去玩一局吧～</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-pink-50 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {record.scenario}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        record.result === "win"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {record.result === "win" ? "通关" : "失败"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(record.playedAt || "")}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-pink-500">
                    {record.finalScore}
                  </div>
                  <div className="text-xs text-gray-400">最终好感度</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
