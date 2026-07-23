import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '哄哄模拟器 - 你能哄好生气的TA吗？',
    template: '%s | 哄哄模拟器',
  },
  description:
    'AI扮演正在生气的对象，你能在10轮对话里把TA哄好吗？搞笑选项让你玩到停不下来！',
  keywords: ['哄哄模拟器', '情侣游戏', '哄对象', '恋爱游戏', 'AI游戏'],
  openGraph: {
    title: '哄哄模拟器 - 你能哄好生气的TA吗？',
    description:
      'AI扮演正在生气的对象，你能在10轮对话里把TA哄好吗？搞笑选项让你玩到停不下来！',
    type: 'website',
    locale: 'zh_CN',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B9D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#FFF5F7] antialiased">
        {children}
      </body>
    </html>
  );
}
