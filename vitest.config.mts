import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import type { Reporter } from "vitest/reporters";

// A test that did not run proves nothing. When a setup hook fails (for example
// the test database cannot start), Vitest reports that file's tests as
// "skipped"; this makes any skipped test an explicit, loud failure.
const failOnSkipped: Reporter = {
  onTestRunEnd(testModules) {
    const skipped = testModules.flatMap((m) => [...m.children.allTests("skipped")]);
    if (skipped.length === 0) return;
    console.error(
      `\nFAILED: ${skipped.length} test(s) did not run:\n` +
        skipped.map((t) => `  - ${t.module.relativeModuleId} > ${t.fullName}`).join("\n") +
        "\nSkipped tests are treated as failures. Fix the setup error reported above.\n",
    );
    process.exitCode = 1;
  },
};

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { reporters: ["default", failOnSkipped] },
});
