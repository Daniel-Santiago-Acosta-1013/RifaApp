import type { Page } from "@playwright/test";
import type { User } from "../src/types";

type StorageSeed = {
  user?: User;
  mode?: "buy" | "sell";
  participantId?: string;
};

export const seedStorage = async (page: Page, seed: StorageSeed) => {
  await page.addInitScript(
    (data) => {
      if (data.user) {
        localStorage.setItem("rifaapp_user", JSON.stringify(data.user));
      }
      if (data.mode) {
        localStorage.setItem("rifaapp_mode", data.mode);
      }
      if (data.participant) {
        const map = { [data.participant.email.toLowerCase()]: data.participant.id };
        localStorage.setItem("rifaapp_participants", JSON.stringify(map));
      }
    },
    {
      user: seed.user ?? null,
      mode: seed.mode ?? null,
      participant: seed.participantId && seed.user ? { email: seed.user.email, id: seed.participantId } : null,
    },
  );
};
