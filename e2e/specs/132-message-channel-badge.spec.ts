// The owner's Telegram account has its own chat; messages there do not appear in Home.
import { expect, open, rpc, test, until, world } from "./kit.ts";

const owner = { id: 4242, name: "Ana" };

test("the owner's Telegram conversation stays in its account chat", async ({ page }) => {
  const [{ channels }, { persons }] = await Promise.all([
    rpc<{ channels: Array<{ id: string; type: string; owner_thread: string }> }>("channels.list"),
    rpc<{ persons: Array<{ id: string; role: string }> }>("contacts.list"),
  ]);
  const tg = channels.find((c) => c.type === "telegram");
  const ownerPerson = persons.find((person) => person.role === "owner");
  expect(tg?.owner_thread).toBe("own");
  if (!tg) throw new Error("Telegram account missing");
  if (!ownerPerson) throw new Error("Owner contact missing");

  await world.telegram(owner, "Badge check from my phone");
  await until(async () =>
    (await world.sentTo(owner.id)).some((m) => m.text?.includes("Got it: Badge check from my phone")),
  );
  const ownerThread = await until(async () => {
    const { threads } = await rpc<{
      threads: Array<{ id: string; channel?: { id: string; person_id?: string } }>;
    }>("threads.list");
    return threads.find((thread) => thread.channel?.id === tg.id && thread.channel.person_id === ownerPerson.id);
  });
  await open(page, `#channel=${encodeURIComponent(tg.id)}&chat=${encodeURIComponent(ownerThread.id)}`);
  const main = page.getByRole("main");
  await expect(main.getByText("Badge check from my phone", { exact: true }).first()).toBeVisible();
  await expect(main.getByText("Got it: Badge check from my phone").first()).toBeVisible();
  await open(page, "#thread=home");
  await expect(page.getByRole("main").getByText("Badge check from my phone")).toHaveCount(0);
});
