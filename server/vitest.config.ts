import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    /*
        npx vitest run --coverage
        to see tests with coverage
        But I just stuck it as a command in package.json
        Won't need it for TDD, but deffo later
         */
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [],
    },
  },
});
