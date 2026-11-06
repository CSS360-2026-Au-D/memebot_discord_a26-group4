import { userMention } from "discord.js";
import { loadDB } from "../helpers/manDataBase";
import { Deck } from '../games/cards/Deck.js';

const event = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return; // prevent infinite loop 
    if (message.content.at(0) !== "!") return; // not a command 

    switch (message.content.trim()) {
      case "!testwelcome":
        client.emit("guildMemberAdd", message.member);
        break;
      case "!checkusers":
        await message.reply(await getUsersReport(message.author.id));
        break;
      case "!testdraw":{
        const newDeck = new Deck();
        newDeck.shuffle();
        let messReply = `Creates a deck of size ${newDeck.size}, shuffles it\n`;
        for(let i=0; i<newDeck.capacity; ++i){
          const card = newDeck.draw();
          messReply += `${card}\n`;
        }
        message.reply(messReply);
        break;
        // old build code from package.json 
        //"build": "rm -rf build && esbuild src/*.js src/**/*.js --platform=node --format=cjs  --outdir=build --outbase=src",
      }
      default:
        message.reply("Not a reconized command");
    }
  },
};

const getUsersReport = async (authorId) => {
  const database = await loadDB();
  const users = database.users.filter((u) => u.user_id); // skip empty entries
  const you = users.find((u) => u.user_id === authorId);

  // only list the first 20 so the reply stays under discord's 2000 char limit
  const userList = users
    .slice(0, 20)
    .map((u) => `• ${userMention(u.user_id)} - coins: ${u.coins}, Has checked in: ${u.dailyCheckin}`)
    .join("\n");

  return {
    content: `**Users in database:** ${users.length}
${userList || "(none)"}${users.length > 20 ? `\n...and ${users.length - 20} more` : ""}

**You:** ${you ? `registered \`${JSON.stringify(you)}\`` : "not registered"}`,
    allowedMentions: { parse: [] }, // don't ping everyone in the list
  };
};

export default event;
