// generates a value for a player hand
// each hand should have a unique value unless its equivalent e.g. to players have ace high

// every hand has a tier (flush, pair, high card)
const Tier = {
    ROYAL_FLUSH:    { name: 'royal flush',      tier: 9, },
    STRAIGHT_FLUSH: { name: 'straight flush',   tier: 8, },
    QUADS:          { name: 'four of a kind',   tier: 7, },
    FULL_HOUSE:     { name: 'full house',       tier: 6, },
    FLUSH:          { name: 'flush',            tier: 5, },
    STRAIGHT:       { name: 'straight',         tier: 4, },
    TRIPLES:        { name: 'three of a kind',  tier: 3, },
    TWO_PAIR:       { name: 'two pair',         tier: 2, },
    PAIR:           { name: 'pair',             tier: 1, },
    HIGH_CARD:      { name: 'high card',        tier: 0, },
};

// each combination for each tier has a logic to resolves who better (high card, runoff high card)
// highest card in tier hand, then high card then next high card, etc
// 2-10 J Q K A e.g. 2-14 highest card wins 

// suits are ignored for runoff, they only count toward the goal of creating the tier

// recive the 5 card hand

// sort hand from highest to lowest
// check for flush
// check for 

// return tier(plus high card in tier) plus rest of cards sorted in order highest to lowest as ints