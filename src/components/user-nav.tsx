"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Loader2 } from "lucide-react";

interface UserInfo {
  id: number;
  username: string;
  created_at: string;
}

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const resp = await fetch("/api/auth/me");
      const data = await resp.json();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-pink-100/50">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{user.username}</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="p-2 rounded-full hover:bg-white/70 transition-all text-gray-500 hover:text-pink-500 disabled:opacity-50"
          title="退出登录"
        >
          {logoutLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
      >
        登录
      </Link>
      <Link
        href="/register"
        className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-orange-400 rounded-full shadow-md shadow-pink-200/50 hover:shadow-pink-300/50 hover:scale-[1.03] active:scale-[0.97] transition-all"
      >
        注册
      </Link>
    </div>
  );
}
