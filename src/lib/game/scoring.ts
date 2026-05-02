import type { Answer, Round } from '@/types/game';
import { getPointMultiplier } from './state-machine';

export function calculateRoundPoints(
  revealedRanks: number[],
  answers: Answer[],
  roundNumber: number,
): number {
  const multiplier = getPointMultiplier(roundNumber);
  return revealedRanks.reduce((total, rank) => {
    const answer = answers.find((a) => a.rank === rank);
    return total + (answer ? answer.points * multiplier : 0);
  }, 0);
}

export function isAllAnswersRevealed(revealed: number[], totalAnswers: number): boolean {
  return revealed.length >= totalAnswers;
}

export function hasThreeStrikes(strikes: number): boolean {
  return strikes >= 3;
}

export function getUnrevealedAnswers(answers: Answer[], revealed: number[]): Answer[] {
  return answers.filter((a) => !revealed.includes(a.rank));
}
