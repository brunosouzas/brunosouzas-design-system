// Vitest configuration: unit and integration tests under test/, run in Node.
// No test loads React components, fonts or Remotion's renderer, so the suite
// needs no browser and no network (design §5 and §6).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
