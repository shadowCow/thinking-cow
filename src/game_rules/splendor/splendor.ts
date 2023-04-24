import { adt, assertNever } from '@/utils/adt';

export type SplendorState = {
  board: Board;
  cardStacks: Array<Array<Card>>;
  gems: GemCounts;
  unclaimedLocationTiles: Array<LocationTile>;
  players: Array<PlayerState>;
  playerTurn: number;
};

export type Board = Array<Array<Card | undefined>>;

export type Card = {
  name: string;
  points: number;
  color: GemColor;
  cost: ColoredGemCounts;
  avengerCount: number;
  hasTimeStone: boolean;
};

export type GemColor = 'purple' | 'red' | 'orange' | 'blue' | 'yellow';

export type GemCounts = ColoredGemCounts & WildGemCount;

export type ColoredGemCounts = {
  purple: number;
  red: number;
  orange: number;
  blue: number;
  yellow: number;
};
function coloredGemCounts(): ColoredGemCounts {
  return {
    purple: 0,
    red: 0,
    orange: 0,
    blue: 0,
    yellow: 0,
  };
}

export type WildGemCount = {
  wild: number;
};

export type PlayerState = {
  cards: Array<Card>;
  reservedCards: ReserveSlots;
  gems: GemCounts;
  locationTiles: Array<LocationTile>;
  hasAvengerTile: boolean;
};

export type ReserveSlots = Array<Card | undefined>;

export type LocationTile =
  | TriskelionTile
  | HellsKitchenNyc
  | Knowhere
  | Atlantis
  | Wakanda
  | Asgard
  | AvengersTowerNyc
  | Attilan;

export const triskelionTile = adt<'TriskelionTile', { purple: 4; orange: 4 }>(
  'TriskelionTile',
);
export type TriskelionTile = ReturnType<typeof triskelionTile>;

export const hellsKitchenNyc = adt<'HellsKitchenNyc', { orange: 4; yellow: 4 }>(
  'HellsKitchenNyc',
);
export type HellsKitchenNyc = ReturnType<typeof hellsKitchenNyc>;

export const knowhere = adt<'Knowhere', { red: 3; blue: 3; yellow: 3 }>(
  'Knowhere',
);
export type Knowhere = ReturnType<typeof knowhere>;

export const atlantis = adt<'Atlantis', { purple: 3; red: 3; blue: 3 }>(
  'Atlantis',
);
export type Atlantis = ReturnType<typeof atlantis>;

export const wakanda = adt<'Wakanda', { red: 4; blue: 4 }>('Wakanda');
export type Wakanda = ReturnType<typeof wakanda>;

export const asgard = adt<'Asgard', { purple: 3; orange: 3; yellow: 3 }>(
  'Asgard',
);
export type Asgard = ReturnType<typeof asgard>;

export const avengersTowerNyc = adt<'AvengersTowerNyc', { blue: 4; yellow: 4 }>(
  'AvengersTowerNyc',
);
export type AvengersTowerNyc = ReturnType<typeof avengersTowerNyc>;

export const attilan = adt<'Attilan', { purple: 4; red: 4 }>('Attilan');
export type Attilan = ReturnType<typeof attilan>;

export type SplendorMove = {
  playerIndex: number;
  action: SplendorAction;
};

export type SplendorAction =
  | TakeDifferentTokens
  | TakeSameTokens
  | ReserveCard
  | BuyReservedCard
  | RecruitCard;

export const takeDifferentTokens = adt<
  'TakeDifferentTokens',
  {
    take: ColoredGemCounts;
    giveBack: ColoredGemCounts;
  }
>('TakeDifferentTokens');
export type TakeDifferentTokens = ReturnType<typeof takeDifferentTokens>;

export const takeSameTokens = adt<
  'TakeSameTokens',
  { take: ColoredGemCounts; giveBack: ColoredGemCounts }
>('TakeSameTokens');
export type TakeSameTokens = ReturnType<typeof takeSameTokens>;

export const reserveCard = adt<
  'ReserveCard',
  { card: Card; giveBack: ColoredGemCounts }
>('ReserveCard');
export type ReserveCard = ReturnType<typeof reserveCard>;

export const buyReservedCard = adt<
  'BuyReservedCard',
  { reserveSlot: 1 | 2 | 3 }
>('BuyReservedCard');
export type BuyReservedCard = ReturnType<typeof buyReservedCard>;

export const recruitCard = adt<'RecruitCard', { card: CardBoardLocation }>(
  'RecruitCard',
);
export type RecruitCard = ReturnType<typeof recruitCard>;

export type CardBoardLocation = {
  tier: 1 | 2 | 3;
  slot: 1 | 2 | 3 | 4;
};

export function transition(
  state: SplendorState,
  move: SplendorMove,
): SplendorState {
  if (isPlayerTurn(state, move)) {
    switch (move.action.kind) {
      case takeDifferentTokens.kind:
      case takeSameTokens.kind:
      case reserveCard.kind:
        return state;
      case buyReservedCard.kind:
        return doBuyReservedCard(state, move.action.value.reserveSlot);
      case recruitCard.kind:
        const card = getCardAtBoardLocation(state, move.action.value.card);
        if (
          card !== undefined &&
          canRecruitCard(state.players[state.playerTurn], card)
        ) {
          return doRecruitCard(state, move.action.value.card);
        }

        return state;
      default:
        assertNever(move.action);
    }
  } else {
    return state;
  }
}

function doBuyReservedCard(state: SplendorState, slot: number): SplendorState {
  const player = state.players[state.playerTurn];
  const card = player.reservedCards[slot];

  if (card !== undefined) {
    const nextPlayerState: PlayerState = {
      ...player,
      cards: player.cards.concat(card),
      reservedCards: player.reservedCards.filter((card, index) => {
        return index !== slot;
      }),
    };

    return {
      ...state,
      players: state.players.map((player, index) => {
        if (index === state.playerTurn) {
          return nextPlayerState;
        } else {
          return player;
        }
      }),
    };
  }

  return state;
}

function doRecruitCard(
  state: SplendorState,
  location: CardBoardLocation,
): SplendorState {
  const card = state.board[location.tier][location.slot];

  if (card !== undefined) {
    const nextBoard = [...state.board];
    const [replacementCard, ...nextStack] = state.cardStacks[location.tier];
    nextBoard[location.tier][location.slot] = replacementCard;

    const nextPlayerState = {
      ...state.players[state.playerTurn],
    };
    nextPlayerState.cards = state.players[state.playerTurn].cards.concat(card);

    return {
      ...state,
      cardStacks: state.cardStacks.map((stack, tier) => {
        if (tier === location.tier) {
          return nextStack;
        } else {
          return stack;
        }
      }),
      board: nextBoard,
      players: state.players.map((player, index) => {
        if (index === state.playerTurn) {
          return nextPlayerState;
        } else {
          return player;
        }
      }),
    };
  }

  return state;
}

function getCardAtBoardLocation(
  state: SplendorState,
  location: CardBoardLocation,
): Card | undefined {
  return state.board[location.tier][location.slot];
}

export function isPlayerTurn(
  state: SplendorState,
  move: SplendorMove,
): boolean {
  return state.playerTurn === move.playerIndex;
}

export function computePlayerScore(player: PlayerState): number {
  const pointsFromCards = player.cards.reduce(
    (acc, card) => acc + card.points,
    0,
  );
  const pointsFromLocationTiles = 3 * player.locationTiles.length;
  const pointsFromAvengerTile = player.hasAvengerTile ? 3 : 0;

  return pointsFromCards + pointsFromLocationTiles + pointsFromAvengerTile;
}

export function hasWinCon(player: PlayerState): boolean {
  const score = computePlayerScore(player);

  const hasTimeStone = player.cards.some((card) => card.hasTimeStone);

  return score >= 16 && hasTimeStone;
}

export function canRecruitCard(player: PlayerState, card: Card): boolean {
  const buyingPowerNoWilds = playerColoredGemCounts(player);

  const gemsNeeded = gemsNeededToBuy(card.cost, buyingPowerNoWilds);

  const totalShort = totalColoredGems(gemsNeeded);

  return player.gems.wild >= totalShort;
}

export function playerColoredGemCounts(player: PlayerState): ColoredGemCounts {
  const cardCounts = coloredGemCounts();

  player.cards.forEach((card) => {
    switch (card.color) {
      case 'purple':
        cardCounts.purple += 1;
        break;
      case 'red':
        cardCounts.red += 1;
        break;
      case 'orange':
        cardCounts.orange += 1;
        break;
      case 'blue':
        cardCounts.blue += 1;
        break;
      case 'yellow':
        cardCounts.yellow += 1;
        break;
      default:
        assertNever(card.color);
    }
  });

  return addColoredGemCounts(cardCounts, player.gems);
}

export function addColoredGemCounts(
  a: ColoredGemCounts,
  b: ColoredGemCounts,
): ColoredGemCounts {
  return {
    purple: a.purple + b.purple,
    red: a.red + b.red,
    orange: a.orange + b.orange,
    blue: a.blue + b.blue,
    yellow: a.yellow + b.yellow,
  };
}

export function gemsNeededToBuy(
  cost: ColoredGemCounts,
  playerGems: ColoredGemCounts,
): ColoredGemCounts {
  return {
    purple: Math.max(0, cost.purple - playerGems.purple),
    red: Math.max(0, cost.red - playerGems.red),
    orange: Math.max(0, cost.orange - playerGems.orange),
    blue: Math.max(0, cost.blue - playerGems.blue),
    yellow: Math.max(0, cost.yellow - playerGems.yellow),
  };
}

export function totalColoredGems(counts: ColoredGemCounts): number {
  return (
    counts.purple + counts.red + counts.orange + counts.blue + counts.yellow
  );
}

export function playerTotalGems(player: PlayerState): number {
  return totalColoredGems(player.gems) + player.gems.wild;
}
