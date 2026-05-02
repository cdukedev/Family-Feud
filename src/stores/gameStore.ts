'use client';

import { create } from 'zustand';
import type {
  Game,
  Player,
  Team,
  TeamMember,
  Round,
  Answer,
  FastMoney,
  BuzzerEvent,
  PhoneUIState,
  ChatMessage,
} from '@/types/game';

interface GameStore {
  // Core state
  game: Game | null;
  currentRound: Round | null;
  teams: Team[];
  players: Player[];
  teamMembers: TeamMember[];
  answers: Answer[]; // answers for the current question
  fastMoney: FastMoney | null;
  buzzerEvents: BuzzerEvent[];

  // Local player
  currentPlayer: Player | null;
  currentPlayerTeam: Team | null;

  // UI state
  phoneUIState: PhoneUIState;
  buzzerArmed: boolean;
  currentTurnPlayerId: string | null;
  chatMessages: ChatMessage[];
  isConnected: boolean;

  // Actions
  setGame: (game: Game) => void;
  setCurrentRound: (round: Round | null) => void;
  setTeams: (teams: Team[]) => void;
  updateTeam: (team: Team) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  setAnswers: (answers: Answer[]) => void;
  setFastMoney: (fm: FastMoney | null) => void;
  setBuzzerEvents: (events: BuzzerEvent[]) => void;
  addBuzzerEvent: (event: BuzzerEvent) => void;

  setCurrentPlayer: (player: Player | null) => void;
  setCurrentPlayerTeam: (team: Team | null) => void;

  setPhoneUIState: (state: PhoneUIState) => void;
  setBuzzerArmed: (armed: boolean) => void;
  setCurrentTurnPlayerId: (playerId: string | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  setIsConnected: (connected: boolean) => void;

  // Computed helpers
  getPlayerTeam: (playerId: string) => Team | undefined;
  getTeamPlayers: (teamId: string) => Player[];
  isHost: () => boolean;
  isMyTurn: () => boolean;

  // Reset
  reset: () => void;
}

const initialState = {
  game: null,
  currentRound: null,
  teams: [],
  players: [],
  teamMembers: [],
  answers: [],
  fastMoney: null,
  buzzerEvents: [],
  currentPlayer: null,
  currentPlayerTeam: null,
  phoneUIState: 'lobby' as PhoneUIState,
  buzzerArmed: false,
  currentTurnPlayerId: null,
  chatMessages: [],
  isConnected: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setGame: (game) => set({ game }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setTeams: (teams) => set({ teams }),
  updateTeam: (team) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === team.id ? team : t)),
    })),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) =>
    set((state) => ({
      players: state.players.some((p) => p.id === player.id)
        ? state.players
        : [...state.players, player],
    })),
  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),
  setTeamMembers: (members) => set({ teamMembers: members }),
  setAnswers: (answers) => set({ answers }),
  setFastMoney: (fm) => set({ fastMoney: fm }),
  setBuzzerEvents: (events) => set({ buzzerEvents: events }),
  addBuzzerEvent: (event) =>
    set((state) => ({ buzzerEvents: [...state.buzzerEvents, event] })),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setCurrentPlayerTeam: (team) => set({ currentPlayerTeam: team }),

  setPhoneUIState: (state) => set({ phoneUIState: state }),
  setBuzzerArmed: (armed) => set({ buzzerArmed: armed }),
  setCurrentTurnPlayerId: (playerId) => set({ currentTurnPlayerId: playerId }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  setIsConnected: (connected) => set({ isConnected: connected }),

  getPlayerTeam: (playerId) => {
    const { teams, teamMembers } = get();
    const membership = teamMembers.find((m) => m.player_id === playerId);
    return membership ? teams.find((t) => t.id === membership.team_id) : undefined;
  },

  getTeamPlayers: (teamId) => {
    const { players, teamMembers } = get();
    const memberIds = teamMembers
      .filter((m) => m.team_id === teamId)
      .map((m) => m.player_id);
    return players.filter((p) => memberIds.includes(p.id));
  },

  isHost: () => {
    const { game, currentPlayer } = get();
    return game?.host_player === currentPlayer?.id;
  },

  isMyTurn: () => {
    const { currentTurnPlayerId, currentPlayer } = get();
    return currentTurnPlayerId === currentPlayer?.id;
  },

  reset: () => set(initialState),
}));
