import { EmbedBuilder } from 'discord.js';

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aces += 1;
            score += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

function formatHand(hand, hideSecondCard = false) {
    if (hideSecondCard) {
        return `${hand[0].value}${hand[0].suit}, ❓`;
    }
    return hand.map(card => `${card.value}${card.suit}`).join(', ');
}

function canSplitPair(hand) {
    if (hand.length !== 2) return false;
    const v1 = hand[0].value;
    const v2 = hand[1].value;
    if (v1 === v2) return true;
    const tens = ['10', 'J', 'Q', 'K'];
    return tens.includes(v1) && tens.includes(v2);
}

export default {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;
        
        if (message.content.toLowerCase() !== '!blackjack') return;

        const deck = createDeck();
        let hands = [[deck.pop(), deck.pop()]];
        const botHand = [deck.pop(), deck.pop()];

        let currentHandIdx = 0;
        let hasSplit = false;

        let initialScore = calculateScore(hands[0]);
        let botVisibleScore = calculateScore([botHand[0]]);

        if (initialScore === 21) {
            const botScore = calculateScore(botHand);
            const embed = new EmbedBuilder()
                .setTitle('♠️♥️ Blackjack ♣️♦️')
                .setColor('Green')
                .setDescription('♠️♥️ **BLACKJACK!** You hit 21 immediately! You win! 🎉')
                .addFields(
                    { name: `Your Hand (Score: 21)`, value: formatHand(hands[0]), inline: true },
                    { name: `Bot's Hand (Score: ${botScore})`, value: formatHand(botHand), inline: true }
                );
            return message.reply({ embeds: [embed] });
        }

        let canSplit = canSplitPair(hands[0]);

        const embed = new EmbedBuilder()
            .setTitle('♠️♥️ Blackjack ♣️♦️')
            .setColor('Blurple')
            .setDescription(
                canSplit
                    ? 'Type **hit** to draw, **stand** to keep your hand, or **split** to split your pair.'
                    : 'Type **hit** to draw another card, or **stand** to keep your hand.'
            )
            .addFields(
                { name: `Your Hand (Score: ${initialScore})`, value: formatHand(hands[0]), inline: true },
                { name: `Bot's Hand (Score: ${botVisibleScore})`, value: formatHand(botHand, true), inline: true }
            );

        const gameMessage = await message.reply({ embeds: [embed] });

        const filter = (m) => {
            if (m.author.id !== message.author.id) return false;
            const choice = m.content.toLowerCase();
            if (['hit', 'stand'].includes(choice)) return true;
            if (choice === 'split' && canSplit) return true;
            return false;
        };

        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        async function resolveGame() {
            let botScore = calculateScore(botHand);
            const allBust = hands.every(h => calculateScore(h) > 21);
            const playerHas21 = !hasSplit
                ? calculateScore(hands[0]) === 21
                : hands.every(h => calculateScore(h) === 21 || calculateScore(h) > 21);

            // Dealer only draws if hands didn't all bust and player didn't hit 21
            if (!allBust && !playerHas21) {
                while (botScore < 17) {
                    botHand.push(deck.pop());
                    botScore = calculateScore(botHand);
                }
            }

            if (!hasSplit) {
                const playerScore = calculateScore(hands[0]);
                let resultText = '';
                let color = 'Red';

                if (playerScore > 21) {
                    resultText = '💥 **BUST!** You went over 21. The bot wins.';
                    color = 'Red';
                } else if (playerScore === 21) {
                    resultText = '🎉 **You Win!** You hit exactly 21!';
                    color = 'Green';
                } else if (botScore > 21) {
                    resultText = '🎉 **BOT BUSTED!** You win!';
                    color = 'Green';
                } else if (botScore > playerScore) {
                    resultText = '😔 **Bot Wins!** Better luck next time.';
                    color = 'Red';
                } else if (botScore < playerScore) {
                    resultText = '🎉 **You Win!** Congratulations!';
                    color = 'Green';
                } else {
                    resultText = "🤝 **Push!** It's a tie.";
                    color = 'Yellow';
                }

                embed.setColor(color)
                    .setDescription(resultText)
                    .setFields(
                        { name: `Your Hand (Score: ${playerScore})`, value: formatHand(hands[0]), inline: true },
                        { name: `Bot's Hand (Score: ${botScore})`, value: formatHand(botHand), inline: true }
                    );
            } else {
                let anyWin = false;
                let anyPush = false;
                const fields = [];

                for (let i = 0; i < hands.length; i++) {
                    const hScore = calculateScore(hands[i]);
                    let res = '';

                    if (hScore > 21) {
                        res = '💥 **BUST!** (Lost)';
                    } else if (hScore === 21) {
                        res = '🎉 **Win!** (Hit 21!)';
                        anyWin = true;
                    } else if (botScore > 21) {
                        res = '🎉 **Win!** (Bot Busted)';
                        anyWin = true;
                    } else if (hScore > botScore) {
                        res = '🎉 **Win!**';
                        anyWin = true;
                    } else if (hScore < botScore) {
                        res = '😔 **Lost**';
                    } else {
                        res = "🤝 **Push!** (Tie)";
                        anyPush = true;
                    }

                    fields.push({
                        name: `Hand ${i + 1} (Score: ${hScore})`,
                        value: `${formatHand(hands[i])}\n${res}`,
                        inline: true
                    });
                }

                fields.push({
                    name: `Bot's Hand (Score: ${botScore})`,
                    value: formatHand(botHand),
                    inline: true
                });

                let summary = '';
                let finalColor = 'Red';
                if (anyWin) {
                    summary = '🎉 **Game Over!** You won on your split hand(s)!';
                    finalColor = 'Green';
                } else if (anyPush) {
                    summary = "🤝 **Game Over!** You pushed with the bot.";
                    finalColor = 'Yellow';
                } else {
                    summary = '😔 **Game Over!** The bot wins.';
                    finalColor = 'Red';
                }

                embed.setColor(finalColor)
                    .setTitle('♠️♥️ Blackjack (Split Results) ♣️♦️')
                    .setDescription(summary)
                    .setFields(fields);
            }

            await gameMessage.edit({ embeds: [embed] });
            collector.stop('finished');
        }

        function updateSplitPlayingEmbed(statusMessage = '') {
            const fields = [];
            for (let i = 0; i < hands.length; i++) {
                const score = calculateScore(hands[i]);
                let label = '';
                if (i === currentHandIdx) {
                    label = ' 👉 **[Playing]**';
                } else if (i < currentHandIdx) {
                    label = score > 21 ? ' 💥 [Bust]' : ' 🛑 [Stood]';
                } else {
                    label = ' ⏳ [Waiting]';
                }

                fields.push({
                    name: `Hand ${i + 1} (Score: ${score})${label}`,
                    value: formatHand(hands[i]),
                    inline: true
                });
            }

            fields.push({
                name: `Bot's Hand (Score: ${botVisibleScore})`,
                value: formatHand(botHand, true),
                inline: true
            });

            const promptText = `Playing **Hand ${currentHandIdx + 1}** of ${hands.length}.\nType **hit** to draw, or **stand** to keep.`;
            const desc = statusMessage ? `${statusMessage}\n\n${promptText}` : promptText;

            embed.setTitle('♠️♥️ Blackjack (Split) ♣️♦️')
                .setColor('Blurple')
                .setDescription(desc)
                .setFields(fields);
        }

        collector.on('collect', async (m) => {
            const choice = m.content.toLowerCase();
            m.delete().catch(() => {});

            if (choice === 'split' && canSplit) {
                hasSplit = true;
                canSplit = false;

                const cardA = hands[0][0];
                const cardB = hands[0][1];
                hands = [
                    [cardA, deck.pop()],
                    [cardB, deck.pop()]
                ];
                currentHandIdx = 0;

                // Check if Hand 1 immediately hit 21
                if (calculateScore(hands[0]) === 21) {
                    currentHandIdx = 1;
                    if (calculateScore(hands[1]) === 21) {
                        return await resolveGame();
                    }
                    updateSplitPlayingEmbed('🌟 **Hand 1 hit 21!** Moved to Hand 2.');
                    return await gameMessage.edit({ embeds: [embed] });
                }

                updateSplitPlayingEmbed('✂️ **Split!** You now have two hands.');
                return await gameMessage.edit({ embeds: [embed] });
            }

            // Once any action is taken (hit or stand), split is no longer an option
            canSplit = false;

            if (!hasSplit) {
                const playerHand = hands[0];

                if (choice === 'hit') {
                    playerHand.push(deck.pop());
                    const playerScore = calculateScore(playerHand);

                    if (playerScore >= 21) {
                        return await resolveGame();
                    }

                    embed.setFields(
                        { name: `Your Hand (Score: ${playerScore})`, value: formatHand(playerHand), inline: true },
                        { name: `Bot's Hand (Score: ${botVisibleScore})`, value: formatHand(botHand, true), inline: true }
                    );
                    return await gameMessage.edit({ embeds: [embed] });
                } else if (choice === 'stand') {
                    return await resolveGame();
                }
            } else {
                const currentHand = hands[currentHandIdx];

                if (choice === 'hit') {
                    currentHand.push(deck.pop());
                    const currentScore = calculateScore(currentHand);

                    if (currentScore > 21) {
                        currentHandIdx++;
                        if (currentHandIdx >= hands.length) {
                            return await resolveGame();
                        }
                        updateSplitPlayingEmbed(`💥 **Hand ${currentHandIdx} BUSTED!**`);
                        return await gameMessage.edit({ embeds: [embed] });
                    } else if (currentScore === 21) {
                        currentHandIdx++;
                        if (currentHandIdx >= hands.length) {
                            return await resolveGame();
                        }
                        updateSplitPlayingEmbed(`🎯 **Hand ${currentHandIdx} hit 21!**`);
                        return await gameMessage.edit({ embeds: [embed] });
                    } else {
                        updateSplitPlayingEmbed();
                        return await gameMessage.edit({ embeds: [embed] });
                    }
                } else if (choice === 'stand') {
                    currentHandIdx++;
                    if (currentHandIdx >= hands.length) {
                        return await resolveGame();
                    }
                    updateSplitPlayingEmbed(`🛑 **Hand ${currentHandIdx} stood.**`);
                    return await gameMessage.edit({ embeds: [embed] });
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                embed.setColor('Red').setDescription('⏰ **Time is up!** The game was cancelled.');
                await gameMessage.edit({ embeds: [embed] }).catch(() => {});
            }
        });
    },
};
