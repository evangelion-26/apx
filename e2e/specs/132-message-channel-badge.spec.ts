// The owner's Telegram account has its own chat; messages there do not appear in Home.
import { ACCOUNT_NAME, expect, open, rpc, test, until, world } from "./kit.ts";

const owner = { id: 4242, name: "Ana" };

test("the owner's Telegram conversation stays in its account chat", async ({ page }) => {
  const { channels } = await rpc<{ channels: Array<{ id: string; type: string; owner_thread: string }> }>(
    "channels.list",
  );
  const tg = channels.find((c) => c.type === "telegram");
  expect(tg?.owner_thread).toBe("own");
  await world.telegram(owner, "Badge check from my phone");
  await until(async () =>
    (await world.sentTo(owner.id)).some((m) => m.text?.includes("Got it: Badge check from my phone")),
  );
  await open(page);
  await page.getByRole("button", { name: ACCOUNT_NAME.telegram, exact: true }).first().click();
  await page.locator(".chan__rows").getByRole("button", { name: /^(Vos|You)/ }).click();
  const main = page.getByRole("main");
  await expect(main.getByText("Badge check from my phone", { exact: true }).first()).toBeVisible();
  await expect(main.getByText("Got it: Badge check from my phone").first()).toBeVisible();
  await open(page, "#thread=home");
  await expect(page.getByRole("main").getByText("Badge check from my phone")).toHaveCount(0);
});
