import { EmbedBuilder, userMention } from "discord.js";
import { addUserToDataBase } from "../helpers/manDataBase";
const CHANNEL_NAME = process.env.CHANNEL_NAME;

const event = {
  name: "guildMemberAdd",
  async execute(member) {
    const channel = member.guild.channels.cache.find(
      (channel) => channel.name === CHANNEL_NAME
    );

    /*
      TODO: Change getWelcomeMessage to getWelcomeMessageWithMeme to send a meme to welcome your user.
    */
    const welcomeMessage = await getWelcomeMessageWithMeme(member.id);
    channel.send(welcomeMessage);
    await addUserToDataBase(member.id);
  },
};

//
const getWelcomeMessageWithMeme = async (userId) => {
  /*
    this function returns a welcome message with a meme.
    Play around with the code here and customise the welcome message.

    TODO: Change this function to return different welcome message with a meme everytime a new user joins.
  */
  const meme = await getMeme();

  const welcomeMessages = [
    "Howdy new member here's a meme for you to enjoy!",
    "Here's a meme to brighten your day!",
    "Were happy to see you join the server!",
    "We have a card game bot! try /game to play!"
  ];
  const randomWelcomceMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  return {
    content: `Welcome ${userMention(userId)},
    ${randomWelcomceMessage}`,
    embeds: [meme],
  };
};

const getMeme = async () => {
  /*
    this function returns a meme.

    TODO: change this function to return a different meme randomly everytime a new user joins.
  */
  // could use loadFiles for dynamic loading but this was simpler
  const memePaths = [
    "https://raw.githubusercontent.com/SunnyPearl2006/memebot_discord_a26-group4/main/assets/JACKED.png",
    "https://raw.githubusercontent.com/SunnyPearl2006/memebot_discord_a26-group4/main/assets/MegaMeme.png",
    "https://raw.githubusercontent.com/SunnyPearl2006/memebot_discord_a26-group4/main/assets/OnFire.png",
    "https://raw.githubusercontent.com/SunnyPearl2006/memebot_discord_a26-group4/main/assets/Pepe.png",
  ];

  const randomMeme = memePaths[Math.floor(Math.random() * memePaths.length)];

  return new EmbedBuilder().setImage(randomMeme);
};

export default event;
