import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 开启静态导出，解决 Netlify 部署 404
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;