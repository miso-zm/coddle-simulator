interface AvatarProps {
  role: "partner" | "user";
  gender?: "girlfriend" | "boyfriend" | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
};

export function Avatar({ role, gender, size = "md" }: AvatarProps) {
  const sizeClass = sizeMap[size];

  if (role === "user") {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0 shadow-sm`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-1/2 h-1/2"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    );
  }

  // 对方头像 - 可爱卡通风格
  const isGirl = gender !== "boyfriend";
  const bgGradient = isGirl
    ? "from-pink-300 to-pink-500"
    : "from-blue-300 to-blue-500";

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden`}
    >
      <svg viewBox="0 0 24 24" className="w-4/5 h-4/5" fill="white">
        {/* 脸 */}
        <ellipse cx="12" cy="13" rx="7" ry="7" fill="white" opacity="0.95" />
        {/* 眼睛 */}
        <ellipse cx="9" cy="12" rx="1.2" ry="1.5" fill="#333" />
        <ellipse cx="15" cy="12" rx="1.2" ry="1.5" fill="#333" />
        {/* 腮红 */}
        <ellipse cx="7" cy="15" rx="1.5" ry="1" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="17" cy="15" rx="1.5" ry="1" fill="#FFB6C1" opacity="0.6" />
        {/* 嘴巴 */}
        <path
          d="M10 16 Q12 18 14 16"
          stroke="#333"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        {/* 刘海/头发 */}
        {isGirl ? (
          <path
            d="M5 9 Q12 3 19 9 Q18 7 15 6 Q12 4 9 6 Q6 7 5 9"
            fill="#8B4513"
          />
        ) : (
          <path
            d="M6 8 Q12 4 18 8 Q17 5 14 4.5 Q12 3 10 4.5 Q7 5 6 8"
            fill="#2C1810"
          />
        )}
      </svg>
    </div>
  );
}
