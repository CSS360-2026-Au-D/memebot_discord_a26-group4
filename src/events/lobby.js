import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
const event = {
    name:"interactionCreate",
async execute(interaction) {
    if(!interaction.isChatInputCommand()) return;
    if(interaction.commandName !== "badger-den") return;
    const embed = new EmbedBuilder()
    .setColor("#a858f2")
            .setTitle(" Badger Den")
            .setDescription(
                "Welcome to the **Badger Den!**\n" +
                "Your home for games, competition, and fun.\n\n" +
 
                "━━━━━━━━━━━━━━━━━━━━\n" +
                "🎮 **AVAILABLE GAMES**\n\n" +
 
                "🂱 **Blackjack**\n" +
                "Test your luck and beat the dealer!\n" +
                "Use `/blackjack` to play.\n\n" +
 
         "♠️ **Poker**\n" +
"Challenge your friends in poker.\n" +
"Create or join a room below to play together."
)
            .setFooter({
                text: " Badger Den • Game Lobby"
            })
            .setTimestamp();
 
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("room:create").setLabel("Create Room").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("room:join").setLabel("Join Room").setStyle(ButtonStyle.Primary),
        );
 
        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    }
};
export default event;