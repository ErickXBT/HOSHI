import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  let [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(settingsTable).values({}).returning();
  }
  res.json(settings);
});

router.patch("/", async (req, res) => {
  const body = UpdateSettingsBody.parse(req.body);
  let [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(settingsTable).values({}).returning();
  }
  const [updated] = await db.update(settingsTable).set(body).returning();
  res.json(updated);
});

export default router;
