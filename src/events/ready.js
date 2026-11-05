import { SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("badger-den")
    .setDescription("Open the Badger Den")
    .toJSON(),
];

const event = {
  name: "ready",
  once: true,
  async execute(client) {
    try {
      if (process.env.GUILD_ID) {
        const guild =
          client.guilds.cache.get(process.env.GUILD_ID) ||
          (await client.guilds.fetch(process.env.GUILD_ID).catch(() => null));
        if (guild) {
          await guild.commands.set(commands);
          console.log("Slash commands registered automatically!");
        } else {
          console.warn(`Could not find guild with ID: ${process.env.GUILD_ID}`);
        }
      } else {
        await client.application.commands.set(commands);
        console.log("Global slash commands registered automatically!");
      }
    } catch (err) {
      console.error("Failed to auto-register slash commands:", err);
    }

    console.log(`
    ############################################################
    #  Logged in as ${client.user.username}!
    #  Serving ${client.guilds.cache.size} servers.
    #  Serving ${client.users.cache.size} users.
    ############################################################
  `);
  },
};

export default event;
