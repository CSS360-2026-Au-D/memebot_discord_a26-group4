import { playPoker } from './poker.js';

// =====================================================================================
// POKER <-> DISCORD GLUE
//
// The game rules live in src/games/poker/poker.js 
// This file is the bridge: it turns Discord users into poker players, and gives the
// game four functions it uses to talk to Discord and the database.
// =====================================================================================

const SMALL_BLIND = 5;
const BIG_BLIND = 10;

/**
 * WHO CALLS THIS: the lobby (Badger Den) code, once it has gathered 2-6 players.
 * WHAT IT DOES:   plays ONE hand, settles coins, then resolves so the lobby can take everyone back.
 *
 * @param {TextChannel} channel   where public play-by-play goes
 * @param {User[]} users          discord.js User objects, in seat order (2 to 6 of them)
 * @param {number} dealer         seat index of the dealer; the lobby should add 1 each hand
 * @returns the result object from playPoker (see bottom of this file)
 *
 * Example call from the lobby:
 *   const result = await startPokerGame(interaction.channel, players, dealerIndex);
 */
export async function startPokerGame(channel, users, dealer = 0) {
    // -------------------------------------------------------------------------------
    // 1. FORMAT PLAYERS   (TODO)
    //
    // playPoker needs:  [{ id, name, chips }, ...]
    //   id    -> user.id (the Discord id string; this is also what delta() receives)
    //   name  -> user.username or the server nickname
    //   chips -> how many coins they bring to the table. Must be a positive integer and
    //            NOT more than they actually have, since losses are taken from their coins.
    //
    // Players with 0 coins can't play (playPoker throws). New users start with 0 coins,
    // so the lobby should stop broke players from joining.
    // -------------------------------------------------------------------------------
    const players = users.map(user => ({
        id: user.id,
        name: user.username,
        chips: 0, // TODO: look up from the db
    }));

    // -------------------------------------------------------------------------------
    // 2. ANNOUNCE   (TODO)
    //
    // announce(text) gets one ready-to-print string per game event, e.g.
    //   "Bob posts small blind 5", "Alice raises to 40", "Carl wins 120"
    // It should post it in `channel` so everyone sees it. Nothing in it is secret.
    //
    // The game does NOT await announce, so:
    //   - catch errors inside it: channel.send(text).catch(console.error)
    //   - make annouce collect lines and flush them all at once so discord doesnt through a rate limit
    // -------------------------------------------------------------------------------
    let lines = [];
    const announce = text => { lines.push(text); };
    async function flush() {
        if (lines.length === 0) return;
        const message = lines.join('\n');
        lines = [];
        await channel.send(message).catch(console.error);
    }

    // -------------------------------------------------------------------------------
    // 3. GET ACTION  
    //
    // Called every time it's someone's turn to bet. Must return an OBJECT (not a string
    // or a number):
    //     { type: 'fold' }
    //     { type: 'check' }
    //     { type: 'call' }
    //     { type: 'raise', amount: 40 }   // amount = total to raise up to this round, not "by"
    //     { type: 'allin' }
    //
    // player = { id, name } of whoever is acting
    // view   = what to show them:
    //     hand        their 5 cards; String(card) gives "A♠". SHOW THIS PRIVATELY (ephemeral)
    //     chips       their remaining stack
    //     pot         total in the pot
    //     toCall      chips needed to call
    //     canCheck    true -> show Check instead of Call
    //     canRaise    false -> hide/disable Raise and All in
    //     minRaiseTo / maxRaiseTo   allowed raise range (maxRaiseTo = all in)
    //     error       null, or a message if their last answer was illegal; show it
    //
    // Suggested Discord flow:
    //     await flush();                           // post what happened since last turn
    //     send buttons [Fold] [Check|Call] [Raise] [All in], only usable by player.id
    //     wait with awaitMessageComponent({ filter, time: 60_000 })
    //     Raise button -> open a modal (text box) for the amount
    //     timeout -> return { type: 'fold' }      // don't let one AFK player stall the table
    //
    // Illegal answers are fine: the game re-asks (with view.error set) up to 3 times,
    // then checks or folds for them. Never throw on bad input; throwing ends the hand
    // with no coins moved.
    // -------------------------------------------------------------------------------
    async function getAction(player, view) {
        await flush();
        // TODO: replace with buttons. Until then everyone checks/calls.
        console.log(`[poker] ${player.name} to act`, view.toCall);
        return { type: 'call' };
    }

    // -------------------------------------------------------------------------------
    // 4. GET DISCARDS   (TODO)
    //
    // Called once per player in the draw phase. Must RETURN AN ARRAY of card positions
    // (0-4) to throw away. [] keeps the hand. At most view.maxDiscard (3) cards.
    //     [1, 4]   -> swap the 2nd and 5th cards
    //
    // view = { hand, maxDiscard }   (show the hand privately again)
    //
    // Suggested Discord flow: a StringSelectMenu with one option per card,
    // minValues 0, maxValues 3, value = "0".."4"; return values.map(Number).
    // Timeout -> return [].
    // -------------------------------------------------------------------------------
    async function getDiscards(player, view) {
        await flush();
        // TODO: replace with a select menu. Until then nobody discards.
        console.log(`[poker] ${player.name} drawing`, view.hand.length);
        return [];
    }

    // -------------------------------------------------------------------------------
    // 5. DELTA   (TODO)
    //
    // delta(id, amount) is called ONCE per player at the END of the hand with their net
    // result: +60 if they won 60, -25 if they lost 25. Players who broke even are skipped.
    // It should add `amount` to that user's coins and save.
    // The game awaits each call one at a time, so a read -> change -> write on
    // dataBase.json is safe within one game.
    // If anything crashes mid-hand, delta is never called and nobody's coins change.
    // -------------------------------------------------------------------------------
    async function delta(id, amount) {
        // TODO: loadDB(), find user with user_id === id, user.coins += amount, updateDB()
        console.log(`[poker] delta ${id} ${amount}`);
    }

    // -------------------------------------------------------------------------------
    // 6. PLAY + RESULTS
    //
    // playPoker throws if setup is invalid (wrong player count, 0 chips, duplicate ids)
    // or if one of the functions above throws. Either way, no coins move.
    // -------------------------------------------------------------------------------
    try {
        const result = await playPoker(players, {
            smallBlind: SMALL_BLIND,
            bigBlind: BIG_BLIND,
            dealer,
            announce, getAction, getDiscards, delta,
        });
        await flush(); // showdown + who won
        return result;
    } catch (err) {
        console.error(err);
        await channel.send('Poker hand cancelled because of an error. No coins were moved.').catch(() => {});
        throw err; // let the lobby decide what to do
    }
}

// What startPokerGame resolves to (straight from playPoker):
// {
//   pots:    [{ amount: 300, winners: ['<discord id>'] }, ...],   // main pot first, then side pots
//   players: [{ id, name, chips, net, folded, hand, handName }, ...]
//            net      = coins won (+) or lost (-) this hand
//            hand     = cards shown at showdown, or null if they folded / no showdown
//            handName = e.g. "two pair", or null
// }
// After this, the lobby puts everyone back in the Badger Den.