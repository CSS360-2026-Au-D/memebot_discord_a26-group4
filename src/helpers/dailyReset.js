import { loadDB, updateDB } from "./manDataBase";
import { processCheckIns } from "./checkIns";

const COINS_PER_CHECKIN = 10;

// uses the time on the machine running the bot
const nextMidnightAfter = (date) => {
  const midnight = new Date(date);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
};

const payAndReset = async (client, midnight) => {
  // flags need to include every message from the day that just ended
  await processCheckIns(client, midnight);

  const database = await loadDB();
  let paidUsers = 0;
  for (const user of database.users) {
    if (user.dailyCheckin) {
      user.coins += COINS_PER_CHECKIN;
      paidUsers++;
    }
    user.dailyCheckin = false;
  }

  database.last_reset = midnight.toISOString();
  await updateDB(database);
  console.log(`Daily reset for ${midnight.toISOString()}: paid ${paidUsers} user(s)`);
};

// Runs every midnight that has passed since the last reset, one day at a time,
// so days the bot was offline are still paid out correctly
export async function runDueResets(client) {
  const database = await loadDB();

  // on the very first run there is no last_reset, so start counting from now
  if (!database.last_reset) {
    database.last_reset = new Date().toISOString();
    await updateDB(database);
    return;
  }

  let midnight = nextMidnightAfter(new Date(database.last_reset));
  while (midnight <= new Date()) {
    await payAndReset(client, midnight);
    midnight = nextMidnightAfter(midnight);
  }
}

// Sets a timer for the next midnight, which sets the following one once it has run
export function scheduleDailyReset(client) {
  const now = new Date();

  setTimeout(async () => {
    try {
      await runDueResets(client);
    } catch (error) {
      console.error("Error running daily reset:", error);
    }
    scheduleDailyReset(client);
  }, nextMidnightAfter(now) - now);
}
