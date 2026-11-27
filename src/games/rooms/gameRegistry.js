// Every game gets:
//   channel    - the private room channel to play in
//   playerIds  - Discord user IDs of everyone in the room (host first)
//   onFinish() - call when the game ends; it brings the room panel back
//   room       - the room object
//
// Both games are placeholders until the teammates finish them.
// To plug one in: import its start function and replace the stub below.
 
const stub = (name) => async (channel, playerIds, onFinish) => {
  await channel.send(`🚧 **${name}** isn't ready yet. Players: ${playerIds.map(id => `<@${id}>`).join(', ')}`);
  onFinish();
};
 
export const games = {
  blackjack: { label: 'Start Blackjack', start: stub('Blackjack') },
  poker:     { label: 'Start Poker',     start: stub('Poker') },
};