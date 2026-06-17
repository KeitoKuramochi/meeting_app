import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 動的ページを 60 秒間クライアント側にキャッシュ
    // 農園に戻るたびにサーバー再取得しなくなる（FarmCharacters のポーリングで最新化）
    staleTimes: {
      dynamic: 60,
    },
  },
};

export default nextConfig;
