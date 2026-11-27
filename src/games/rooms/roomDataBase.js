import { randomInt } from 'crypto';
 
// channelId -> { channel, guildId, number, hostId, password, members:Set, dealer, busy, timer }
export const rooms = new Map();
 
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
 
export function makePassword() {
  let pw;
  do {
    pw = Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  } while ([...rooms.values()].some(r => r.password === pw));
  return pw;
}
 
export function nextRoomNumber(guildId) {
  const used = new Set([...rooms.values()].filter(r => r.guildId === guildId).map(r => r.number));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}
 
export const findByPassword = (guildId, pw) =>
  [...rooms.values()].find(r => r.guildId === guildId && r.password === pw.trim().toUpperCase());
