'use client';

import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { BuzzerScreen } from './BuzzerScreen';
import { AnswerScreen } from './AnswerScreen';
import { WaitingScreen } from './WaitingScreen';
import { PlayOrPassScreen } from './PlayOrPassScreen';
import { StealHuddleScreen } from './StealHuddleScreen';
import { FastMoneyScreen } from './FastMoneyScreen';
import { SequesterScreen } from './SequesterScreen';
import { HostOverridePanel } from './HostOverridePanel';
import type { PhoneUIState } from '@/types/game';

interface PhoneControllerProps {
  playerId: string;
  gameId: string;
}

export function PhoneController({ playerId, gameId }: PhoneControllerProps) {
  const {
    game,
    currentRound,
    teams,
    teamMembers,
    players,
    fastMoney,
    currentTurnPlayerId,
    buzzerArmed,
    answers,
  } = useGameStore();

  // Determine which team this player is on
  const playerTeam = useMemo(() => {
    const membership = teamMembers.find((m) => m.player_id === playerId);
    return membership ? teams.find((t) => t.id === membership.team_id) : null;
  }, [teamMembers, teams, playerId]);

  const opponentTeam = useMemo(() => {
    return teams.find((t) => t.id !== playerTeam?.id) || null;
  }, [teams, playerTeam]);

  // Determine Phone UI state
  const phoneState = useMemo((): PhoneUIState => {
    if (!game || game.status === 'lobby') return 'lobby';
    if (game.status === 'finished') return 'game_over';

    if (game.status === 'fast_money' && fastMoney) {
      if (fastMoney.status === 'player2_sequestered' && playerId === fastMoney.player2_id) {
        return 'fast_money_sequester';
      }
      if (
        (fastMoney.status === 'player1_playing' && playerId === fastMoney.player1_id) ||
        (fastMoney.status === 'player2_playing' && playerId === fastMoney.player2_id)
      ) {
        return 'fast_money_active';
      }
      if (fastMoney.status === 'reveal' || fastMoney.status === 'complete') {
        return 'fast_money_reveal';
      }
      return 'waiting_for_teammate';
    }

    if (!currentRound) return 'waiting_for_teammate';

    // Face-off phase
    if (currentRound.phase === 'face_off') {
      // Check if this player is one of the face-off players
      const roundIdx = (currentRound.round_number - 1) % Math.max(
        teams[0]?.player_order?.length || 1, 1
      );
      const faceOffPlayer1 = teams[0]?.player_order[roundIdx];
      const faceOffPlayer2 = teams[1]?.player_order[roundIdx];
      const isFaceOffPlayer = playerId === faceOffPlayer1 || playerId === faceOffPlayer2;

      if (isFaceOffPlayer) {
        if (!currentRound.face_off_winner) {
          // Check if this player has already answered
          const isFirstSlot = currentRound.face_off_answer1_player === playerId;
          const isSecondSlot = currentRound.face_off_answer2_player === playerId;
          const hasAnswered = isFirstSlot || isSecondSlot;

          if (hasAnswered) {
            return 'face_off_waiting'; // Answered, waiting for other player
          }
          // Check if player has buzzed (via buzzer events tracked in state)
          // If no buzzer events yet, show buzzer; otherwise show answer screen
          return buzzerArmed ? 'face_off_buzzer' : 'face_off_answer';
        }
        if (currentRound.face_off_winner === playerId) {
          return 'play_or_pass';
        }
        return 'waiting_for_teammate';
      }
      return 'face_off_waiting';
    }

    // Steal phase
    if (currentRound.phase === 'steal') {
      const isControllingTeam = playerTeam?.id === currentRound.controlling_team;
      if (!isControllingTeam) {
        return 'steal_huddle';
      }
      return 'waiting_for_teammate';
    }

    // Playing phase
    if (currentRound.phase === 'playing') {
      if (currentTurnPlayerId === playerId) {
        return 'your_turn';
      }
      return 'waiting_for_teammate';
    }

    return 'waiting_for_teammate';
  }, [game, currentRound, teams, fastMoney, playerId, currentTurnPlayerId, playerTeam, buzzerArmed]);

  const isHost = game?.host_player === playerId;

  // Render based on phone state
  const renderScreen = () => {
    switch (phoneState) {
      case 'lobby':
      case 'team_setup':
        return <WaitingScreen message="Waiting for the game to start..." />;

      case 'face_off_waiting':
        return <WaitingScreen message="Face-Off in progress! Watch the TV!" />;

      case 'face_off_buzzer':
        return currentRound && playerTeam ? (
          <BuzzerScreen
            roundId={currentRound.id}
            playerId={playerId}
            teamId={playerTeam.id}
          />
        ) : null;

      case 'face_off_answer':
      case 'your_turn':
        return currentRound && playerTeam ? (
          <AnswerScreen
            roundId={currentRound.id}
            questionId={currentRound.question_id}
            playerId={playerId}
            teamId={playerTeam.id}
            timeLimit={game?.settings.answer_window_seconds || 10}
            phase={currentRound.phase}
          />
        ) : null;

      case 'play_or_pass':
        return currentRound && playerTeam && opponentTeam ? (
          <PlayOrPassScreen
            roundId={currentRound.id}
            playerTeamId={playerTeam.id}
            opponentTeamId={opponentTeam.id}
            playerTeamName={playerTeam.name}
            opponentTeamName={opponentTeam.name}
          />
        ) : null;

      case 'steal_huddle':
        return currentRound && playerTeam ? (
          <StealHuddleScreen
            roundId={currentRound.id}
            questionId={currentRound.question_id}
            playerId={playerId}
            teamId={playerTeam.id}
            isDesignatedStealer={
              playerTeam.player_order[0] === playerId // First in order is designated stealer
            }
          />
        ) : null;

      case 'fast_money_sequester':
        return <SequesterScreen />;

      case 'fast_money_active':
        return (
          <FastMoneyScreen
            playerId={playerId}
            isPlayer1={fastMoney?.player1_id === playerId}
          />
        );

      case 'fast_money_reveal':
        return <WaitingScreen message="Watch the TV for the Grand Reveal!" />;

      case 'game_over':
        return <WaitingScreen message="Game Over! Check the TV for final scores!" />;

      case 'waiting_for_teammate':
      default:
        return <WaitingScreen />;
    }
  };

  return (
    <div className="relative">
      {renderScreen()}

      {/* Host override panel */}
      {isHost && currentRound && (
        <HostOverridePanel
          roundId={currentRound.id}
          lastAnswerPlayerId={null}
          lastAnswerCorrect={null}
        />
      )}
    </div>
  );
}
