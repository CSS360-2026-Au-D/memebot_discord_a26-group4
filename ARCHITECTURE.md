# Architecture

This document describes the main components of the Gracious Badger bot application and how they interact. Each section includes a short explanation and a diagram of the relevant design.

## Contents

- [Kevin - Slash Commands and Badger Den](#kevin--slash-commands-and-badger-den)
- [Harrison - Card and Deck](#harrison--card-and-deck)
- [Juan - Diagram title](#juan--diagram-title)
- [Shiv - Diagram title](#shiv--diagram-title)

---

## Interface Layer: Slash Commands and Badger Den

**Author:** Kevin

**Files:** `src/slashCommands.js`, `src/events/lobby.js`, `src/events/blackjackSlash.js`, `src/events/blackjack.js`

This layer is how users reach the bot. `src/slashCommands.js` registers two slash commands, `/badger-den` and `/blackjack`, with Discord for one server. `/badger-den` shows an embed that lists the available games. `/blackjack` starts the game by passing the interaction to the existing blackjack module, which was originally written for typed `!blackjack` messages.

### Figure 1: Control-Flow Graph of the Slash Command and Lobby Handlers

![Control-flow graph of the slash command and lobby handlers](docs/images/interaction-cfg.png)

*Both listeners run on every interaction and exit early if the command isn't theirs. The blackjack listener adapts the slash command to the original prefix-based game.*

**Patterns**

- **Event-driven:** each handler is its own `interactionCreate` listener that returns early unless the command name matches.
- **Adapter:** the blackjack handler builds a `fakeMessage` with `author`, `content`, `channel`, and `reply`, so `blackjack.js` runs unchanged.

**How to add a new command**

1. Add a `SlashCommandBuilder` entry to the `commands` array in `src/slashCommands.js`.
2. Create an event file that returns early unless `commandName` matches.
3. Run `node src/slashCommands.js` (it replaces the server's registered commands, so keep every command in the array), then restart the bot.

**Known limitations**

- `original.execute()` returns once the game's message collector starts, so the adapter's `try/catch` only covers setup errors, not errors during later hit/stand turns.
- The Badger Den handler has no error handling.

---

## Harrison - Card and Deck
### Description

`Card` represents one playing card. Its private `rank` and `suit` fields are validated when the card is created; getters provide read-only access, and `toString()` produces a compact display label (such as `A♠`).

`Deck` creates 52 `Card` objects for each requested standard deck. It stores the available cards in a private array, supports in-place Fisher-Yates shuffling, and draws cards from the end of that array. The `capacity` getter reports the initial number of cards, while `size` reports how many remain. Drawing from an empty deck returns `undefined`.

### Class diagram

```mermaid
classDiagram
    direction LR

    class Card {
        -rank: number
        -suit: Suit
        +constructor(rank, suit)
        +rank: number
        +suit: Suit
        +rankLabel: string
        +toString() string
    }

    class Deck {
        -decks: number
        -cards: Card[]
        -discarded: Card[]
        +constructor(decks = 1)
        +draw() Card
        +capacity: number
        +size: number
        +shuffle() void
    }

    Deck "1" *-- "0..*" Card : contains
```

**Design notes:** `Deck` creates and manages its contained cards. `draw()` removes a card from the deck and returns it; the returned card can continue to exist independently. `Suit` is an exported constant object rather than a JavaScript class. `#discarded` is declared but not yet used.

---

## Juan - Diagram title

### Description

*Briefly describe the component(s)*

### Diagram

```mermaid
flowchart TD
    %% Game Setup & Deal
    subgraph SETUP ["Game Setup & Dealing"]
        OpenGame["OPEN GAME"]
        JoinTry[/"PLAYER TRIES TO JOIN"/]
        EnoughCoins{"ENOUGH COINS?"}
        UnableJoin["UNABLE TO JOIN"]
        JoinGame["JOIN GAME"]
        StartGame["START GAME"]
        DesignateBlinds["DESIGNATE DEALER &<br/>BIG/SMALL BLIND"]
        PlaceBets["BIG/SMALL BLIND PLACE<br/>CORRESPONDING BETS"]
        ShuffleDeck["BUILD & SHUFFLE DECK"]
        DealCards["DEAL EACH PLAYER 1 BY 1<br/>UNTIL EVERYONE REACHES 5 CARDS"]

        OpenGame --> JoinGame
        JoinTry --> EnoughCoins
        EnoughCoins -- No --> UnableJoin
        EnoughCoins -- Yes --> JoinGame
        JoinGame --> StartGame
        StartGame --> DesignateBlinds
        DesignateBlinds --> PlaceBets
        PlaceBets --> ShuffleDeck
        ShuffleDeck --> DealCards
    end

    DealCards --> NextP1

    %% Betting Round 1
    subgraph BET1 ["Betting Round 1"]
        NextP1["NEXT PLAYER"]
        InputAct1[/"PLAYER INPUT ACTION"/]
        
        CheckPot1{"HAS POT<br/>INCREASED?"}
        CheckBB1{"IS PLAYER<br/>BIG BLIND?"}
        
        RemoveP1["REMOVE PLAYER<br/>FROM GAME"]
        
        CallChips1{"ENOUGH<br/>CHIPS?"}
        AllIn1["DESIGNATE ALL IN<br/>AND REMOVE FROM BETTING"]
        AllFoldCall1{"HAS EVERY PLAYER<br/>FOLDED OR CALLED?"}

        InputBet1[/"PLAYER INPUT BET"/]
        RaiseChips1{"ENOUGH<br/>CHIPS?"}
        IncPot1["INCREASE POT"]
        EndBet1["END BET ROUND 1"]

        NextP1 --> InputAct1
        
        InputAct1 -- CHECK --> CheckPot1
        CheckPot1 -- Yes --> CheckBB1
        CheckPot1 -- No --> NextP1
        CheckBB1 -- No --> NextP1
        CheckBB1 -- Yes --> EndBet1

        InputAct1 -- FOLD --> RemoveP1
        RemoveP1 --> AllFoldCall1

        InputAct1 -- CALL --> CallChips1
        CallChips1 -- Yes --> AllFoldCall1
        CallChips1 -- No --> AllIn1
        AllIn1 --> AllFoldCall1
        
        AllFoldCall1 -- No --> NextP1
        AllFoldCall1 -- Yes --> EndBet1

        InputAct1 -- RAISE --> InputBet1
        InputBet1 --> RaiseChips1
        RaiseChips1 -- No --> InputAct1
        RaiseChips1 -- Yes --> IncPot1
        IncPot1 --> NextP1
    end

    EndBet1 --> NextPDraw

    %% Draw Phase
    subgraph DRAW ["Draw Phase"]
        NextPDraw["NEXT PLAYER"]
        ChangeCards{"CHANGE<br/>CARDS?"}
        InputCards[/"PLAYER INPUT<br/>NUMBER OF CARDS"/]
        DiscardDeal["DISCARD AND<br/>DEAL CARDS"]
        AllChanged{"HAS EVERY PLAYER<br/>CHANGED OR SKIPPED?"}
        EndDraw["END DRAW PHASE"]

        NextPDraw --> ChangeCards
        ChangeCards -- YES --> InputCards
        InputCards --> DiscardDeal
        DiscardDeal --> AllChanged
        ChangeCards -- NO --> AllChanged
        
        AllChanged -- NO --> NextPDraw
        AllChanged -- YES --> EndDraw
    end

    EndDraw --> NextP2

    %% Betting Round 2
    subgraph BET2 ["Betting Round 2"]
        NextP2["NEXT PLAYER"]
        InputAct2[/"PLAYER INPUT ACTION"/]

        CheckPot2{"HAS POT<br/>INCREASED?"}
        BetPot2{"HAS POT<br/>INCREASED?"}

        RemoveP2["REMOVE PLAYER<br/>FROM GAME"]

        CallChips2{"ENOUGH<br/>CHIPS?"}
        AllIn2["DESIGNATE ALL IN<br/>AND REMOVE FROM BETTING"]
        AllFoldCall2{"HAS EVERY PLAYER<br/>FOLDED OR CALLED?"}

        InputBet2[/"PLAYER INPUT BET"/]
        RaiseChips2{"ENOUGH<br/>CHIPS?"}
        IncPot2["INCREASE POT"]
        EndBet2["END BET ROUND 2"]

        NextP2 --> InputAct2

        InputAct2 -- CHECK --> CheckPot2
        CheckPot2 -- No --> AllFoldCall2
        CheckPot2 -- Yes --> NextP2

        InputAct2 -- BET --> BetPot2
        BetPot2 -- No --> InputBet2
        BetPot2 -- Yes --> NextP2

        InputAct2 -- FOLD --> RemoveP2
        RemoveP2 --> AllFoldCall2

        InputAct2 -- CALL --> CallChips2
        CallChips2 -- Yes --> AllFoldCall2
        CallChips2 -- No --> AllIn2
        AllIn2 --> AllFoldCall2

        AllFoldCall2 -- NO --> NextP2
        AllFoldCall2 -- YES --> EndBet2

        InputAct2 -- RAISE --> InputBet2
        InputBet2 --> RaiseChips2
        RaiseChips2 -- No --> NextP2
        RaiseChips2 -- Yes --> IncPot2
        IncPot2 --> NextP2
    end

    EndBet2 --> EvalHands

    %% Showdown & Resolution
    subgraph SHOWDOWN ["Showdown & Pot Resolution"]
        EvalHands["EVALUATE PLAYERS HANDS<br/>(handRank)"]
        DetermineWinner["DETERMINE PLAYER WITH<br/>HIGHEST RANK HAND"]
        IsAllIn{"IS WINNING PLAYER<br/>ALL IN?"}
        AwardFull["AWARD FULL POT"]
        AwardPartial["WINNER AWARDED FROM EACH<br/>PLAYERS BET UP TO THEIR LAST BET"]

        EvalHands --> DetermineWinner
        DetermineWinner --> IsAllIn
        IsAllIn -- NO --> AwardFull
        IsAllIn -- YES --> AwardPartial
    end
```
---

## Shiv - Diagram title

### Description

*Briefly describe the component(s)*

### Diagram

*Insert diagram here.*

---
