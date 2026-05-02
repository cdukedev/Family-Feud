import type { GameStatus, RoundPhase, FastMoneyStatus } from '@/types/game';

// Valid game status transitions
const GAME_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  lobby: ['face_off'],
  face_off: ['main_round'],
  main_round: ['face_off', 'fast_money', 'finished'],
  fast_money: ['finished'],
  finished: ['lobby'], // play again
};

// Valid round phase transitions
const ROUND_TRANSITIONS: Record<RoundPhase, RoundPhase[]> = {
  face_off: ['playing'],
  playing: ['steal', 'complete'],
  steal: ['complete'],
  complete: [],
};

// Valid fast money transitions
const FAST_MONEY_TRANSITIONS: Record<FastMoneyStatus, FastMoneyStatus[]> = {
  player1_playing: ['player2_sequestered'],
  player2_sequestered: ['player2_playing'],
  player2_playing: ['reveal'],
  reveal: ['complete'],
  complete: [],
};

export function canTransitionGame(from: GameStatus, to: GameStatus): boolean {
  return GAME_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionRound(from: RoundPhase, to: RoundPhase): boolean {
  return ROUND_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionFastMoney(from: FastMoneyStatus, to: FastMoneyStatus): boolean {
  return FAST_MONEY_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getPointMultiplier(roundNumber: number): number {
  if (roundNumber <= 2) return 1;
  if (roundNumber === 3) return 2;
  return 3; // round 4+
}

export function getFaceOffPlayerIndex(roundNumber: number, teamSize: number): number {
  return (roundNumber - 1) % teamSize;
}

export function getNextPlayerIndex(currentIndex: number, teamSize: number): number {
  return (currentIndex + 1) % teamSize;
}

export function shouldGoToFastMoney(
  currentRound: number,
  totalRounds: number,
  team1Score: number,
  team2Score: number,
): { goToFastMoney: boolean; needsSuddenDeath: boolean } {
  if (currentRound < totalRounds) {
    return { goToFastMoney: false, needsSuddenDeath: false };
  }
  if (team1Score === team2Score) {
    return { goToFastMoney: false, needsSuddenDeath: true };
  }
  return { goToFastMoney: true, needsSuddenDeath: false };
}
