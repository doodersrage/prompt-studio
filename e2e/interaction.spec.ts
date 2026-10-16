import { test, expect } from "@playwright/test";
import { gotoStable } from "./helpers/navigation";

// Generate is Prompt Studio's (Castcut's "/" is Film): runs against the classic app.
test("generate accepts keywords without server error", async ({ page }) => {
  await gotoStable(page, "/?hintSource=manual");
  const manualHints = page.getByRole("button", { name: "Manual hints", exact: true });
  if (await manualHints.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await manualHints.click();
  }
  const keywords = page.getByLabel(/Scene idea or keywords/i);
  await expect(keywords).toBeVisible({ timeout: 60_000 });
  await keywords.click();
  await keywords.fill("neon alley, rain, black cat");
  await expect(keywords).toHaveValue(/neon alley/);
  await expect(page.getByRole("button", { name: /Generate scene prompt/i })).toBeEnabled({
    timeout: 15_000,
  });
});
