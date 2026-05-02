'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/types/game';
import { motion } from 'framer-motion';

interface TeamSetupProps {
  players: Player[];
  gameId: string;
  onComplete: () => void;
}

interface TeamConfig {
  name: string;
  color: string;
  playerIds: string[];
}

export function TeamSetup({ players, gameId, onComplete }: TeamSetupProps) {
  const [team1, setTeam1] = useState<TeamConfig>({
    name: 'Team 1',
    color: '#E63946',
    playerIds: [],
  });
  const [team2, setTeam2] = useState<TeamConfig>({
    name: 'Team 2',
    color: '#457B9D',
    playerIds: [],
  });
  const [saving, setSaving] = useState(false);

  const unassigned = players.filter(
    (p) => !team1.playerIds.includes(p.id) && !team2.playerIds.includes(p.id),
  );

  const addToTeam = (playerId: string, team: 1 | 2) => {
    if (team === 1) {
      setTeam1((prev) => ({ ...prev, playerIds: [...prev.playerIds, playerId] }));
      setTeam2((prev) => ({
        ...prev,
        playerIds: prev.playerIds.filter((id) => id !== playerId),
      }));
    } else {
      setTeam2((prev) => ({ ...prev, playerIds: [...prev.playerIds, playerId] }));
      setTeam1((prev) => ({
        ...prev,
        playerIds: prev.playerIds.filter((id) => id !== playerId),
      }));
    }
  };

  const randomize = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    setTeam1((prev) => ({
      ...prev,
      playerIds: shuffled.slice(0, mid).map((p) => p.id),
    }));
    setTeam2((prev) => ({
      ...prev,
      playerIds: shuffled.slice(mid).map((p) => p.id),
    }));
  };

  const shuffleOrder = (teamNum: 1 | 2) => {
    const setter = teamNum === 1 ? setTeam1 : setTeam2;
    setter((prev) => ({
      ...prev,
      playerIds: [...prev.playerIds].sort(() => Math.random() - 0.5),
    }));
  };

  const saveTeams = async () => {
    if (team1.playerIds.length === 0 || team2.playerIds.length === 0) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Shuffle player orders
      const order1 = [...team1.playerIds].sort(() => Math.random() - 0.5);
      const order2 = [...team2.playerIds].sort(() => Math.random() - 0.5);

      // Create teams
      const { data: createdTeams, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            game_id: gameId,
            name: team1.name,
            color: team1.color,
            player_order: order1,
          },
          {
            game_id: gameId,
            name: team2.name,
            color: team2.color,
            player_order: order2,
          },
        ])
        .select();

      if (teamError) throw teamError;
      if (!createdTeams || createdTeams.length !== 2) throw new Error('Failed to create teams');

      // Create team memberships
      const memberships = [
        ...team1.playerIds.map((pid) => ({
          player_id: pid,
          team_id: createdTeams[0].id,
          game_id: gameId,
        })),
        ...team2.playerIds.map((pid) => ({
          player_id: pid,
          team_id: createdTeams[1].id,
          game_id: gameId,
        })),
      ];

      const { error: memberError } = await supabase
        .from('team_members')
        .insert(memberships);

      if (memberError) throw memberError;

      onComplete();
    } catch (err) {
      console.error('Failed to save teams:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.username || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Set Up Teams</h2>
        <p className="text-white/60 mt-1">Assign players to teams</p>
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="secondary" size="sm" onClick={randomize}>
          Random Split
        </Button>
      </div>

      {/* Unassigned players */}
      {unassigned.length > 0 && (
        <Card className="!bg-white/5">
          <p className="text-sm text-white/60 mb-3">Unassigned ({unassigned.length})</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <span className="bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                  {p.username}
                </span>
                <Button size="sm" variant="primary" onClick={() => addToTeam(p.id, 1)}>
                  1
                </Button>
                <Button size="sm" variant="secondary" onClick={() => addToTeam(p.id, 2)}>
                  2
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Teams side by side */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { config: team1, setConfig: setTeam1, num: 1 as const },
          { config: team2, setConfig: setTeam2, num: 2 as const },
        ].map(({ config, setConfig, num }) => (
          <Card key={num} className="!border-2" style={{ borderColor: config.color + '40' }}>
            <Input
              value={config.name}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              className="!text-center !text-sm !py-1.5 mb-3"
            />

            <div className="space-y-1.5 min-h-[100px]">
              {config.playerIds.map((id, idx) => (
                <motion.div
                  key={id}
                  layout
                  className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 text-sm"
                >
                  <span className="text-white/40 text-xs w-4">{idx + 1}</span>
                  <span className="flex-1">{getPlayerName(id)}</span>
                  <button
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        playerIds: prev.playerIds.filter((pid) => pid !== id),
                      }))
                    }
                    className="text-white/30 hover:text-white/60 text-xs"
                  >
                    x
                  </button>
                </motion.div>
              ))}
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => shuffleOrder(num)}
              className="w-full mt-2 !text-xs"
            >
              Shuffle Order
            </Button>
          </Card>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={saveTeams}
        disabled={saving || team1.playerIds.length === 0 || team2.playerIds.length === 0}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Lock Teams & Start Game'}
      </Button>
    </div>
  );
}
