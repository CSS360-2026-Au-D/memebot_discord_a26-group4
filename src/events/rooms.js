import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, MessageFlags,
  ModalBuilder, PermissionFlagsBits as P, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { rooms, makePassword, nextRoomNumber, findByPassword } from '../games/rooms/roomDataBase.js';
import { games } from '../games/rooms/gameRegistry.js';

const IDLE_MS = 30 * 60 * 1000;
const MAX_PLAYERS = 8;
const attempts = new Map(); // userId -> { count, until }

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

const panel = (room) => ({
  embeds: [new EmbedBuilder()
    .setColor('#a858f2')
    .setTitle(`🦡 Room ${room.number}`)
    .setDescription(
      `Host: <@${room.hostId}>\n` +
      `Players (${room.members.size}/${MAX_PLAYERS}): ${[...room.members].map(id => `<@${id}>`).join(', ')}\n\n` +
      `Host, pick a game to start.`
    )],
  components: [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('room:game:blackjack').setLabel(games.blackjack.label).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('room:game:poker').setLabel(games.poker.label).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('room:close').setLabel('Close Room').setStyle(ButtonStyle.Danger),
  )],
});

async function closeRoom(room) {
  clearTimeout(room.timer);
  rooms.delete(room.channel.id);
  await room.channel.delete().catch(() => {});
}

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    console.log('[rooms] got interaction:', interaction.type, interaction.customId);

    // ---------- CREATE ----------
    if (interaction.isButton() && interaction.customId === 'room:create') {
      if ([...rooms.values()].some(r => r.hostId === interaction.user.id)) {
        return interaction.reply(ephemeral('You already have a room open.'));
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const guild = interaction.guild;
        const number = nextRoomNumber(guild.id);
        const channel = await guild.channels.create({
          name: `room-${number}`,
          type: ChannelType.GuildText,
          parent: process.env.ROOMS_CATEGORY_ID || null, // optional: keep rooms in one category
          permissionOverwrites: [
            { id: guild.roles.everyone, deny: [P.ViewChannel] },
            { id: interaction.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
            { id: interaction.client.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.EmbedLinks, P.ManageChannels] },
          ],
        });

        const room = {
          channel, guildId: guild.id, number, hostId: interaction.user.id,
          password: makePassword(), members: new Set([interaction.user.id]),
          dealer: 0, busy: false,
        };
        room.timer = setTimeout(() => closeRoom(room), IDLE_MS);
        rooms.set(channel.id, room);

        await channel.send(panel(room));
        return interaction.editReply(
          `Room created: ${channel}\nPassword: **${room.password}**\nShare it with the people you want to play with.`
        );
      } catch (err) {
        console.error(err);
        return interaction.editReply(`Couldn't create the room: ${err.message}`);
      }
    }

    // ---------- JOIN (enter password) ----------
    if (interaction.isButton() && interaction.customId === 'room:join') {
      const modal = new ModalBuilder().setCustomId('room:joinModal').setTitle('Join a room')
        .addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('password').setLabel('Room password')
            .setStyle(TextInputStyle.Short).setMinLength(5).setMaxLength(5).setRequired(true)
        ));
      return interaction.showModal(modal);
    }

    // ---------- JOIN (password submitted) ----------
    if (interaction.isModalSubmit() && interaction.customId === 'room:joinModal') {
      const uid = interaction.user.id;
      const a = attempts.get(uid) ?? { count: 0, until: 0 };
      if (Date.now() < a.until) return interaction.reply(ephemeral('Too many wrong tries. Wait a minute.'));

      const room = findByPassword(interaction.guildId, interaction.fields.getTextInputValue('password'));
      if (!room) {
        a.count++;
        if (a.count >= 5) { a.count = 0; a.until = Date.now() + 60_000; }
        attempts.set(uid, a);
        return interaction.reply(ephemeral('Wrong password.'));
      }
      attempts.delete(uid);

      if (room.members.has(uid)) return interaction.reply(ephemeral(`You're already in ${room.channel}.`));
      if (room.busy) return interaction.reply(ephemeral('A game is in progress. Try again when it ends.'));
      if (room.members.size >= MAX_PLAYERS) return interaction.reply(ephemeral('That room is full.'));

      await room.channel.permissionOverwrites.edit(uid, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
      });
      room.members.add(uid);
      room.timer.refresh();
      await room.channel.send(`<@${uid}> joined the room!`);
      return interaction.reply(ephemeral(`You're in! Head to ${room.channel}.`));
    }

    // ---------- Buttons inside a room ----------
    if (!interaction.isButton() || !interaction.customId.startsWith('room:')) return;
    const room = rooms.get(interaction.channelId);
    if (!room) return;
    if (interaction.user.id !== room.hostId) return interaction.reply(ephemeral('Only the host can do that.'));
    room.timer.refresh();

    if (interaction.customId.startsWith('room:game:')) {
      const game = games[interaction.customId.split(':')[2]];
      if (!game || room.busy) return;
      room.busy = true;
      await interaction.update({ components: [] }); // hide the panel while a game runs
      const onFinish = () => {
        room.busy = false;
        room.timer.refresh();
        room.channel.send(panel(room)).catch(console.error);
      };
      try {
        return await game.start(room.channel, [...room.members], onFinish, room);
      } catch (err) {
        console.error(err);
        await room.channel.send('Something went wrong starting the game.').catch(() => {});
        return onFinish();
      }
    }

    if (interaction.customId === 'room:close') {
      await interaction.reply('Closing room…');
      return closeRoom(room);
    }
  },
};