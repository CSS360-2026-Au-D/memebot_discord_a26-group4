import { expect } from 'chai';
import {
  calculateScore,
  canSplitPair,
  determineOutcome
} from '../src/events/blackjack.js';

describe('Blackjack Unit Tests', () => {
  it('checks calculate score function', () => {
    // Numeric cards
    expect(calculateScore([{ suit: '♥', value: '2' }, { suit: '♣', value: '7' }])).to.equal(9);
    // Face cards (J, Q, K as 10)
    expect(calculateScore([{ suit: '♥', value: 'J' }, { suit: '♦', value: 'Q' }])).to.equal(20);
    // Single Ace as 11 when under 21
    expect(calculateScore([{ suit: '♠', value: 'A' }, { suit: '♥', value: '9' }])).to.equal(20);
    // Ace reduced to 1 when exceeding 21
    expect(calculateScore([
      { suit: '♠', value: 'A' },
      { suit: '♥', value: '9' },
      { suit: '♣', value: '5' }
    ])).to.equal(15);
  });

  it('checks split function', () => {
    // Valid pairs (matching rank or 10-value cards)
    expect(canSplitPair([{ suit: '♠', value: '8' }, { suit: '♦', value: '8' }])).to.be.true;
    expect(canSplitPair([{ suit: '♠', value: '10' }, { suit: '♦', value: 'K' }])).to.be.true;
    // Invalid pairs
    expect(canSplitPair([{ suit: '♠', value: '7' }, { suit: '♦', value: '9' }])).to.be.false;
    expect(canSplitPair([
      { suit: '♠', value: '8' },
      { suit: '♦', value: '8' },
      { suit: '♥', value: '8' }
    ])).to.be.false;
  });

  it('checks player draws 21 game end', () => {
    // Player draws 21 (e.g. 10 + 6 + 5 = 21)
    const playerHand = [
      { suit: '♠', value: '10' },
      { suit: '♦', value: '6' },
      { suit: '♣', value: '5' }
    ];
    expect(calculateScore(playerHand)).to.equal(21);

    // If dealer also has 21, game ends immediately in a push (Yellow)
    const dealer21 = [{ suit: '♥', value: 'A' }, { suit: '♣', value: 'K' }];
    const pushResult = determineOutcome(playerHand, dealer21);
    expect(pushResult.outcome).to.equal('push');
    expect(pushResult.color).to.equal('Yellow');

    // If dealer does not have 21, game ends immediately in a win (Green)
    const dealer17 = [{ suit: '♥', value: '10' }, { suit: '♣', value: '7' }];
    const winResult = determineOutcome(playerHand, dealer17);
    expect(winResult.outcome).to.equal('win');
    expect(winResult.color).to.equal('Green');
  });
});
