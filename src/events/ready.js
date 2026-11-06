import { processCheckIns } from "../helpers/checkIns";
import { runDueResets, scheduleDailyReset } from "../helpers/dailyReset";

const event = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`
    ############################################################
    #  Logged in as ${client.user.username}!
    #  Serving ${client.guilds.cache.size} servers.
    #  Serving ${client.users.cache.size} users.
    ############################################################
  `);

    try {
      await runDueResets(client); // catches up on any midnights missed while offline
      await processCheckIns(client);
    } catch (error) {
      console.error("Error processing check-ins:", error);
    }

    scheduleDailyReset(client);
  },
};

export default event;
