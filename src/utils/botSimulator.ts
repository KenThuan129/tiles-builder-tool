import { Tile, BotPersona, MoveLogItem } from '../types/game';
import { isTileFree, isGiftBlocked, isChainLocked } from './gameHelpers';
import { GIFT_SIZES } from '../constants/gameConfig';

export interface BotNextMoveResult {
  tileToPick: Tile | null;
  explanation: string;
}

/**
 * Checks if a tile is currently clickable / free on the board during play mode.
 */
export function getAvailableBoardTiles(playTiles: Tile[]): Tile[] {
  return playTiles.filter(t => {
    if (t.isGift) {
      return !isGiftBlocked(t, playTiles);
    }
    // Matchable tile check
    const free = isTileFree(t, playTiles);
    const chainLocked = (t.mechanic === 'chained1' || t.mechanic === 'chained2') && isChainLocked(t);
    const coveredByGift = playTiles.some(g =>
      g.isGift &&
      g.z < t.z &&
      t.x >= g.x && t.x <= g.x + ((GIFT_SIZES[g.mechanic || 'gift2x1']?.cols || 2) - 1) * 2 &&
      t.y >= g.y && t.y <= g.y + ((GIFT_SIZES[g.mechanic || 'gift2x1']?.rows || 1) - 1) * 2
    );

    return free && !chainLocked && !coveredByGift;
  });
}

/**
 * Calculates how many tiles are directly or indirectly uncovered on lower layers if `tile` is removed.
 */
function calculateUnblockScore(tile: Tile, allBoardTiles: Tile[]): number {
  const tilesBelow = allBoardTiles.filter(t => t.id !== tile.id && t.z < tile.z);
  let count = 0;
  for (const sub of tilesBelow) {
    const isOverlappedX = Math.abs(tile.x - sub.x) < 2;
    const isOverlappedY = Math.abs(tile.y - sub.y) < 2;
    if (isOverlappedX && isOverlappedY) {
      count++;
    }
  }
  return count;
}

/**
 * Evaluates the next best move for a given bot persona.
 */
export function getBotNextMove(
  persona: BotPersona,
  playTiles: Tile[],
  container: Tile[]
): BotNextMoveResult {
  const availableTiles = getAvailableBoardTiles(playTiles).filter(t => !t.isGift);

  if (availableTiles.length === 0) {
    return { tileToPick: null, explanation: 'No free tiles available on board.' };
  }

  // Count icons in container
  const containerIconCounts: Record<string, number> = {};
  container.forEach(t => {
    const key = `${t.baseIcon}_${t.color}`;
    containerIconCounts[key] = (containerIconCounts[key] || 0) + 1;
  });

  // CASUAL PERSONA
  if (persona === 'casual') {
    // 65% chance to pick matching tile if available, else 35% random pick
    const matchingInTray = availableTiles.filter(t => {
      const key = `${t.baseIcon}_${t.color}`;
      return (containerIconCounts[key] || 0) > 0;
    });

    if (matchingInTray.length > 0 && Math.random() < 0.65) {
      const chosen = matchingInTray[Math.floor(Math.random() * matchingInTray.length)];
      const count = containerIconCounts[`${chosen.baseIcon}_${chosen.color}`];
      return {
        tileToPick: chosen,
        explanation: `Casual Move: Picked ${chosen.baseIcon} tile (${chosen.color}) to pair with ${count} existing in tray.`
      };
    }

    const randomChosen = availableTiles[Math.floor(Math.random() * availableTiles.length)];
    return {
      tileToPick: randomChosen,
      explanation: `Casual Move: Picked available ${randomChosen.baseIcon} tile at (x:${randomChosen.x}, y:${randomChosen.y}, z:${randomChosen.z}).`
    };
  }

  // VETERAN PERSONA
  if (persona === 'veteran') {
    // 1. Check for immediate 3-match in tray
    const immediateMatchTile = availableTiles.find(t => {
      const key = `${t.baseIcon}_${t.color}`;
      return (containerIconCounts[key] || 0) === 2;
    });

    if (immediateMatchTile) {
      return {
        tileToPick: immediateMatchTile,
        explanation: `Veteran Tactic: Completing 3-match for ${immediateMatchTile.baseIcon} (${immediateMatchTile.color}) to clear tray space.`
      };
    }

    // 2. Check for pair building if tray isn't almost full
    if (container.length <= 4) {
      const pairTile = availableTiles.find(t => {
        const key = `${t.baseIcon}_${t.color}`;
        return (containerIconCounts[key] || 0) === 1;
      });
      if (pairTile) {
        return {
          tileToPick: pairTile,
          explanation: `Veteran Tactic: Building pair for ${pairTile.baseIcon} (${pairTile.color}).`
        };
      }
    }

    // 3. Pick tile that unblocks most underlying tiles
    let bestTile = availableTiles[0];
    let maxUnblocked = -1;

    for (const t of availableTiles) {
      const unblocked = calculateUnblockScore(t, playTiles);
      if (unblocked > maxUnblocked) {
        maxUnblocked = unblocked;
        bestTile = t;
      }
    }

    return {
      tileToPick: bestTile,
      explanation: `Veteran Move: Picked ${bestTile.baseIcon} on Z:${bestTile.z} to unblock ${maxUnblocked} underlying tiles.`
    };
  }

  // HARDCORE PERSONA (Optimal Heuristic Lookahead)
  let bestScoredTile = availableTiles[0];
  let highestScore = -Infinity;

  for (const t of availableTiles) {
    const key = `${t.baseIcon}_${t.color}`;
    const inTray = containerIconCounts[key] || 0;
    const unblockedCount = calculateUnblockScore(t, playTiles);

    let score = 0;

    // Highest priority: Immediate 3-match clear
    if (inTray === 2) {
      score += 200;
    } else if (inTray === 1) {
      score += 50;
      // Check if another matching tile exists on board
      const matchingOnBoard = availableTiles.filter(other => other.id !== t.id && `${other.baseIcon}_${other.color}` === key);
      if (matchingOnBoard.length >= 1) score += 30;
    } else {
      // New icon added to tray penalty if tray is full
      if (container.length >= 5) score -= 80;
      else if (container.length >= 4) score -= 30;
    }

    // Unblock depth reward
    score += unblockedCount * 25;

    // Cluster bonus if tile belongs to a cluster
    if (t.clusterId) {
      score += 20;
    }

    // Z-layer preference (prefer higher Z layers to clear upper obstacles)
    score += t.z * 5;

    if (score > highestScore) {
      highestScore = score;
      bestScoredTile = t;
    }
  }

  return {
    tileToPick: bestScoredTile,
    explanation: `Hardcore Analysis (Score: +${Math.round(highestScore)}): Optimal pick ${bestScoredTile.baseIcon} (${bestScoredTile.color}) on Z:${bestScoredTile.z}.`
  };
}
