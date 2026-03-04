import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: true,
      proxy: {
        "/api": {
          target: env.HOST_ADDRESS || "http://localhost:3000",
        },
      },
    },
  };
});
