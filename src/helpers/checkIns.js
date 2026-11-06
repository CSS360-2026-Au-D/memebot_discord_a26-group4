import { loadDB, updateDB, createUser } from "./manDataBase";

const CHANNEL_NAME = process.env.CHANNEL_NAME;
const FETCH_LIMIT = 100; // the most messages discord returns per request

// uses the time on the machine running the bot
const isBeforeDeadline = (date) => date.getHours() < 23 || date.getMinutes() < 59;

const fetchMessagesBetween = async (channel, since, until) => {
  const messages = [];
  let before;

  while (true) {
    const batch = await channel.messages.fetch({ limit: FETCH_LIMIT, before });
    messages.push(
      ...batch.filter((m) => m.createdTimestamp > since && m.createdTimestamp <= until).values()
    );

    // discord returns newest first, so the last message is the oldest in the batch
    const oldest = batch.last();
    if (batch.size < FETCH_LIMIT || oldest.createdTimestamp <= since) return messages;
    before = oldest.id;
  }
};

const findCheckedInUsers = async (client, since, until) => {
  const userIds = new Set();

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.find((c) => c.name === CHANNEL_NAME);
    if (!channel) continue;

    for (const message of await fetchMessagesBetween(channel, since, until.getTime())) {
      if (!message.author.bot && isBeforeDeadline(message.createdAt)) {
        userIds.add(message.author.id);
      }
    }
  }

  return userIds;
};

// Goes through the messages sent since the last scan, up to `until`, and checks in their authors
export async function processCheckIns(client, until = new Date()) {
  // last_online is the point the messages have been scanned up to
  const { last_online: lastOnline } = await loadDB();

  // on the very first run there is no last_online, so there is nothing to compare against
  const userIds = lastOnline
    ? await findCheckedInUsers(client, new Date(lastOnline).getTime(), until)
    : new Set();

  // load again so users added while the messages were being fetched aren't overwritten
  const database = await loadDB();
  for (const userId of userIds) {
    let user = database.users.find((u) => u.user_id === userId);
    if (!user) {
      user = createUser(userId);
      database.users.push(user);
    }
    user.dailyCheckin = true;
  }

  // only saved after the scan succeeds, so a failed scan is retried on the next start
  database.last_online = until.toISOString();
  await updateDB(database);
  console.log(`Checked in ${userIds.size} user(s) from messages since ${lastOnline ?? "first run"}`);
}
