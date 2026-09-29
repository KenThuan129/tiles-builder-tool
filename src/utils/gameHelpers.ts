import { Tile, BoosterAvailability, ThemeIconRegistry } from '../types/game';
import { GIFT_SIZES, BOOSTER_TYPES } from '../constants/gameConfig';

export function findLastIndex<T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) {
      return i;
    }
  }
  return -1;
}

export const getIconBudget = (levelNum: number) => {
  if (levelNum <= 3) return { maxIcons: 2, minRepeat: 2 };
  if (levelNum <= 7) return { maxIcons: 3, minRepeat: 2 };
  if (levelNum <= 12) return { maxIcons: 4, minRepeat: 2 };
  if (levelNum <= 20) return { maxIcons: 5, minRepeat: 2 };
  if (levelNum <= 40) return { maxIcons: 7, minRepeat: 1 };
  if (levelNum <= 80) return { maxIcons: 10, minRepeat: 1 };
  return { maxIcons: 15, minRepeat: 1 };
};

export const getBoosterBand = (levelNum: number): string => {
  if (levelNum <= 10) return '1-10';
  if (levelNum <= 30) return '11-30';
  if (levelNum <= 50) return '31-50';
  if (levelNum <= 80) return '51-80';
  if (levelNum <= 120) return '81-120';
  return '121+';
};

export const calculateBoosterRelief = (availability: BoosterAvailability | null): number => {
  if (!availability) return 0;
  let relief = 0;
  Object.entries(availability).forEach(([type, count]) => {
    if (count <= 0) return;
    const config = BOOSTER_TYPES[type];
    if (!config) return;
    if (config.diminishing) {
      relief += config.weight * Math.sqrt(count);
    } else {
      relief += config.weight * count;
    }
  });
  return relief;
};

export const calculateBoosterMultiplier = (relief: number): number => {
  return 1 + (relief / 10);
};

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const isOverlapping = (t1: { x: number; y: number }, t2: { x: number; y: number }): boolean => {
  const dx = Math.abs(t1.x - t2.x);
  const dy = Math.abs(t1.y - t2.y);
  return dx < 2 && dy < 2;
};

export const getCoverType = (t1: { x: number; y: number; z: number }, t2: { x: number; y: number; z: number }): 'stack' | 'diagonal' | null => {
  if (t2.z <= t1.z) return null;
  const dx = Math.abs(t1.x - t2.x);
  const dy = Math.abs(t1.y - t2.y);
  if (dx < 2 && dy < 2) {
    if (dx === 0 && dy === 0) return 'stack';
    return 'diagonal';
  }
  return null;
};

export const isTileCoveredByOther = (tile: Tile, allTiles: Tile[]): boolean => {
  return allTiles.some(t2 => {
    if (t2.z <= tile.z) return false;
    const dx = Math.abs(tile.x - t2.x);
    const dy = Math.abs(tile.y - t2.y);
    return dx < 2 && dy < 2;
  });
};

export const isChainLocked = (tile: Tile): boolean => {
  if (tile.mechanic !== 'chained1' && tile.mechanic !== 'chained2') return false;
  return (tile.chainClearedCount || 0) < (tile.chainLevel || 1);
};

export const isIceFrozen = (tile: Tile): boolean => {
  if (tile.mechanic !== 'ice2' && tile.mechanic !== 'ice3') return false;
  const req = tile.mechanic === 'ice3' ? 3 : 2;
  return (tile.iceMatchesRemaining ?? req) > 0;
};

export const isTileFree = (tile: Tile, allTiles: Tile[]): boolean => {
  if (isTileCoveredByOther(tile, allTiles)) return false;
  if (isChainLocked(tile)) return false;

  if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3') {
    const req = tile.mechanic === 'ice3' ? 3 : 2;
    if ((tile.iceMatchesRemaining ?? req) > 0) return false;
  }

  if (tile.mechanic === 'combined' && tile.combineGroupId) {
    const groupMates = allTiles.filter(t => t.combineGroupId === tile.combineGroupId);
    return groupMates.every(t => !isTileCoveredByOther(t, allTiles) && !isChainLocked(t) && !isIceFrozen(t));
  }
  return true;
};

export const buildStackDepthMap = (boardTiles: Tile[]): Map<string, number> => {
  const map = new Map<string, number>();
  if (!boardTiles || boardTiles.length === 0) return map;

  const positionGroups = new Map<string, Tile[]>();

  for (const t of boardTiles) {
    if (t.isGift) continue;
    const key = `${t.x},${t.y}`;
    let group = positionGroups.get(key);
    if (!group) {
      group = [];
      positionGroups.set(key, group);
    }
    group.push(t);
  }

  positionGroups.forEach(group => {
    if (group.length === 1) {
      map.set(group[0].id, 0);
      return;
    }
    group.sort((a, b) => a.z - b.z);
    for (let i = 0; i < group.length; i++) {
      map.set(group[i].id, i);
    }
  });

  return map;
};

export const assignIconsFromRegistry = (tiles: Tile[], registry: ThemeIconRegistry | null): Map<string, number> => {
  const assignment = new Map<string, number>();
  if (!registry) return assignment;

  const groups = new Map<string, Tile[]>();
  tiles.forEach(t => {
    if (t.isGift) return;
    const gid = t.tripletGroupId || `solo-${t.id}`;
    if (!groups.has(gid)) groups.set(gid, []);
    groups.get(gid)!.push(t);
  });

  groups.forEach((groupTiles) => {
    const themeId = groupTiles[0].themeID || 'theme00';
    const pool = registry[themeId];
    if (!pool || pool.length === 0) return;
    const chosenIconId = pool[Math.floor(Math.random() * pool.length)];
    groupTiles.forEach(t => {
      assignment.set(t.id, chosenIconId);
    });
  });

  return assignment;
};

export const assignIconsBudgetAware = (
  tiles: Tile[],
  registry: ThemeIconRegistry | null,
  maxIconsTotal: number,
  minRepeat = 1
): Map<string, number> => {
  const assignment = new Map<string, number>();
  if (!registry) return assignment;

  const groups = new Map<string, { gid: string; themeId: string; tiles: Tile[] }>();
  tiles.forEach(t => {
    if (t.isGift) return;
    const gid = t.tripletGroupId || `solo-${t.id}`;
    if (!groups.has(gid)) {
      groups.set(gid, {
        gid,
        themeId: t.themeID || 'theme00',
        tiles: [],
      });
    }
    groups.get(gid)!.tiles.push(t);
  });

  const groupsByTheme = new Map<string, Array<{ gid: string; themeId: string; tiles: Tile[] }>>();
  groups.forEach(g => {
    if (!groupsByTheme.has(g.themeId)) groupsByTheme.set(g.themeId, []);
    groupsByTheme.get(g.themeId)!.push(g);
  });

  const totalGroups = groups.size;
  if (totalGroups === 0) return assignment;

  const themeIds = [...groupsByTheme.keys()];

  const budgetPerTheme = new Map<string, number>();
  let allocated = 0;

  themeIds.forEach((tid, idx) => {
    const themeGroupCount = groupsByTheme.get(tid)!.length;
    const poolSize = (registry[tid] || []).length;
    const share = themeGroupCount / totalGroups;

    let budget: number;
    if (idx === themeIds.length - 1) {
      budget = Math.max(1, maxIconsTotal - allocated);
    } else {
      budget = Math.max(1, Math.floor(maxIconsTotal * share));
    }

    budget = Math.min(budget, themeGroupCount, poolSize);
    budgetPerTheme.set(tid, budget);
    allocated += budget;
  });

  themeIds.forEach(tid => {
    const themeGroups = groupsByTheme.get(tid)!;
    const pool = registry[tid] || [];
    if (pool.length === 0 || themeGroups.length === 0) return;

    const iconBudget = Math.min(
      budgetPerTheme.get(tid) || 1,
      pool.length,
      themeGroups.length
    );

    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const chosenIcons = shuffledPool.slice(0, iconBudget);
    const numGroups = themeGroups.length;
    const shuffledGroupIdx = [...Array(numGroups).keys()].sort(() => Math.random() - 0.5);

    const counts = new Array(iconBudget).fill(0);

    if (iconBudget === 1) {
      counts[0] = numGroups;
    } else {
      for (let i = 0; i < iconBudget; i++) counts[i] = 1;
      let remaining = numGroups - iconBudget;

      const anchorExtraNeeded = Math.max(0, minRepeat - 1);
      const anchorExtra = Math.min(remaining, anchorExtraNeeded);
      counts[0] += anchorExtra;
      remaining -= anchorExtra;

      if (remaining > 0) {
        const base = Math.floor(remaining / iconBudget);
        const leftover = remaining % iconBudget;
        for (let i = 0; i < iconBudget; i++) {
          counts[i] += base;
          if (i < leftover) counts[i] += 1;
        }
      }
    }

    let cursor = 0;
    chosenIcons.forEach((iconId, iconIdx) => {
      const take = counts[iconIdx];
      for (let k = 0; k < take; k++) {
        const gi = shuffledGroupIdx[cursor++];
        const group = themeGroups[gi];
        group.tiles.forEach(t => assignment.set(t.id, iconId));
      }
    });
  });

  return assignment;
};

export const buildIconAssignmentPlan = (pool: Array<{ themeId: string; iconId: number; weight: number }>, totalTriplets: number) => {
  const active = pool.filter(p => p.weight > 0);
  if (active.length === 0) {
    throw new Error('Icon pool rỗng hoặc tất cả weight = 0');
  }

  const totalWeight = active.reduce((s, p) => s + p.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Tổng weight phải > 0');
  }

  const allocations = active.map(p => ({
    themeId: p.themeId,
    iconId: p.iconId,
    ideal: (p.weight / totalWeight) * totalTriplets,
    count: Math.floor((p.weight / totalWeight) * totalTriplets),
  }));

  const assigned = allocations.reduce((s, a) => s + a.count, 0);
  const remaining = totalTriplets - assigned;

  allocations.sort((a, b) => (b.ideal - b.count) - (a.ideal - a.count));

  for (let i = 0; i < remaining; i++) {
    allocations[i % allocations.length].count += 1;
  }

  return allocations;
};

export const assignIconsFromPool = (tiles: Tile[], plan: Array<{ themeId: string; iconId: number; count: number }>) => {
  const assignment = new Map<string, number>();
  const themeAssignment = new Map<string, string>();

  const groups = new Map<string, { gid: string; tiles: Tile[] }>();
  tiles.forEach(t => {
    if (t.isGift) return;
    const gid = t.tripletGroupId || `solo-${t.id}`;
    if (!groups.has(gid)) groups.set(gid, { gid, tiles: [] });
    groups.get(gid)!.tiles.push(t);
  });

  const groupList = [...groups.values()];
  const totalGroups = groupList.length;

  const planTotal = plan.reduce((s, p) => s + p.count, 0);
  let adjustedPlan = plan;

  if (planTotal !== totalGroups) {
    if (plan.length === 0 || totalGroups === 0) {
      throw new Error('Không thể assign: pool rỗng hoặc board rỗng.');
    }

    const poolFromPlan = plan.map(p => ({
      themeId: p.themeId,
      iconId: p.iconId,
      weight: p.count > 0 ? p.count : 1,
    }));

    adjustedPlan = buildIconAssignmentPlan(poolFromPlan, totalGroups);
  }

  const slots: Array<{ themeId: string; iconId: number }> = [];
  adjustedPlan.forEach(p => {
    for (let i = 0; i < p.count; i++) {
      slots.push({ themeId: p.themeId, iconId: p.iconId });
    }
  });

  const shuffledSlots = [...slots].sort(() => Math.random() - 0.5);

  groupList.forEach((group, idx) => {
    const slot = shuffledSlots[idx];
    if (!slot) return;
    group.tiles.forEach(t => {
      assignment.set(t.id, slot.iconId);
      themeAssignment.set(t.id, slot.themeId);
    });
  });

  return { assignment, themeAssignment };
};

export const checkComboBalance = (tiles: Tile[]) => {
  const combos = new Map<string, { themeId: string; iconId: number; count: number }>();

  tiles.forEach(t => {
    if (t.isGift) return;
    const themeId = t.themeID || 'theme00';
    const iconId = t.assignedIconId;
    if (iconId === undefined || iconId === null) return;
    const key = `${themeId}_${iconId}`;
    if (!combos.has(key)) {
      combos.set(key, { themeId, iconId, count: 0 });
    }
    combos.get(key)!.count++;
  });

  const comboList = [...combos.values()].map(c => ({
    ...c,
    remainder: c.count % 3,
  }));

  const balanced = comboList.every(c => c.remainder === 0);

  return { balanced, combos: comboList };
};

export const isGiftBlocked = (gift: Tile, allTiles: Tile[]): boolean => {
  const size = GIFT_SIZES[gift.mechanic || 'gift2x1'];
  if (!size) return false;

  const gEndX = gift.x + (size.cols - 1) * 2;
  const gEndY = gift.y + (size.rows - 1) * 2;

  return allTiles.some(t => {
    if (t.isGift) return false;
    if (t.z <= gift.z) return false;
    return !(
      t.x > gEndX ||
      t.x < gift.x ||
      t.y > gEndY ||
      t.y < gift.y
    );
  });
};

const CHAIN_NEIGHBOR_OFFSETS = [{ dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }];

export const resolveSpecialMechanics = (rawTiles: Tile[]): Tile[] => {
  let workingTiles = rawTiles.map(t => ({ ...t }));

  workingTiles = workingTiles.filter(t => !t.isGift);

  workingTiles.forEach(tile => {
    if ((tile.mechanic === 'chained1' || tile.mechanic === 'chained2') && (!tile.chainLinks || tile.chainLinks.length < 2)) {
      const levelRequired = tile.mechanic === 'chained2' ? 2 : 1;
      const sameLayerNeighbors = CHAIN_NEIGHBOR_OFFSETS
        .map(o => workingTiles.find(t2 =>
          t2.z === tile.z && t2.x === tile.x + o.dx && t2.y === tile.y + o.dy && t2.id !== tile.id
        ))
        .filter(Boolean);

      if (sameLayerNeighbors.length >= levelRequired) {
        const picked = [...sameLayerNeighbors].sort(() => Math.random() - 0.5).slice(0, levelRequired);
        tile.chainLinks = picked.map(t => t!.id);
        tile.chainLevel = levelRequired;
      } else {
        tile.mechanic = 'normal';
        delete tile.chainLinks;
        delete tile.chainLevel;
      }
    }
    if (tile.mechanic === 'chained1' || tile.mechanic === 'chained2') {
      tile.chainClearedCount = tile.chainClearedCount || 0;
    }

    if (tile.mechanic === 'eventItem') {
      tile.movesRemaining = tile.movesRemaining ?? 4;
      tile.isEventItemActive = true;
    }
  });

  const visited = new Set<string>();
  workingTiles.forEach(tile => {
    if (tile.mechanic === 'combined' && !tile.combineGroupId && !visited.has(tile.id)) {
      const groupId = `combo-${tile.id}`;
      const stack = [tile];
      const group: Tile[] = [];
      visited.add(tile.id);
      while (stack.length) {
        const cur = stack.pop()!;
        group.push(cur);
        CHAIN_NEIGHBOR_OFFSETS.forEach(o => {
          const neighbor = workingTiles.find(t2 =>
            t2.z === cur.z && t2.x === cur.x + o.dx && t2.y === cur.y + o.dy &&
            t2.mechanic === 'combined' && !t2.combineGroupId && !visited.has(t2.id)
          );
          if (neighbor) { visited.add(neighbor.id); stack.push(neighbor); }
        });
      }
      group.forEach(t => { t.combineGroupId = groupId; });
    }
  });

  workingTiles.forEach(tile => {
    if (tile.mechanic === 'ice2') tile.iceMatchesRemaining = tile.iceMatchesRemaining ?? 2;
    if (tile.mechanic === 'ice3') tile.iceMatchesRemaining = tile.iceMatchesRemaining ?? 3;
  });

  return workingTiles;
};

export const formTripletGroups = (tiles: Tile[]): number => {
  const shuffled = [...tiles].sort(() => Math.random() - 0.5);
  const completeTriplets = Math.floor(shuffled.length / 3);

  shuffled.forEach((tile, idx) => {
    const tripletIdx = Math.floor(idx / 3);
    if (tripletIdx < completeTriplets) {
      tile.tripletGroupId = `tg-${tripletIdx}`;
    } else {
      tile.tripletGroupId = `tg-orphan-${tile.id}`;
    }
  });

  return completeTriplets;
};

export const buildThemeQueue = (themeWeights: Record<string, number>, count: number): string[] => {
  const active = Object.entries(themeWeights)
    .filter(([, w]) => w > 0)
    .map(([theme, weight]) => ({ theme, weight }));

  if (active.length === 0) {
    throw new Error('buildThemeQueue: at least one theme must have weight > 0');
  }

  if (active.length === 1) {
    return Array(count).fill(active[0].theme);
  }

  const totalWeight = active.reduce((s, t) => s + t.weight, 0);

  const allocations = active.map(t => ({
    theme: t.theme,
    ideal: (t.weight / totalWeight) * count,
    count: Math.floor((t.weight / totalWeight) * count),
  }));

  const assigned = allocations.reduce((s, a) => s + a.count, 0);
  const remaining = count - assigned;

  allocations.sort((a, b) => (b.ideal - b.count) - (a.ideal - a.count));
  for (let i = 0; i < remaining; i++) {
    allocations[i % allocations.length].count += 1;
  }

  const queue: string[] = [];
  allocations.forEach(a => {
    for (let i = 0; i < a.count; i++) queue.push(a.theme);
  });

  return queue.sort(() => Math.random() - 0.5);
};

export const normalizeTripletGroups = (tiles: Tile[]): Tile[] => {
  const withGroup = tiles.filter(t => t.tripletGroupId);
  const withoutGroup = tiles.filter(t => !t.tripletGroupId);

  if (withoutGroup.length === 0) return tiles;

  const shuffled = [...withoutGroup].sort(() => Math.random() - 0.5);

  const basePrefix = `tg-norm-${Date.now()}`;
  shuffled.forEach((tile, i) => {
    const tripletIdx = Math.floor(i / 3);
    tile.tripletGroupId = `${basePrefix}-${tripletIdx}`;
  });

  return [...withGroup, ...shuffled];
};

export const countInitialMatches = (boardTiles: Tile[]): number => {
  const freeTiles = boardTiles.filter(t =>
    !t.isGift && isTileFree(t, boardTiles)
  );

  const groups: Record<string, number> = {};
  freeTiles.forEach(t => {
    const key = `${t.baseIcon}_${t.color}`;
    groups[key] = (groups[key] || 0) + 1;
  });

  return Object.values(groups).filter(count => count >= 3).length;
};

export const findMagnetTargets = (boardTiles: Tile[], container: Tile[]): { tilesToPull: Tile[]; matchedFromTray: boolean; noMatch?: boolean } | null => {
  const sortByPriority = (tiles: Tile[]) => {
    return [...tiles].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.x !== b.x) return b.x - a.x;
      return a.y - b.y;
    });
  };

  if (container.length > 0) {
    const trayCounts: Record<string, number> = {};
    const trayLatestIdx: Record<string, number> = {};
    container.forEach((t, idx) => {
      const key = `${t.baseIcon}_${t.color}`;
      trayCounts[key] = (trayCounts[key] || 0) + 1;
      trayLatestIdx[key] = idx;
    });

    const sortedKeys = Object.keys(trayCounts).sort((a, b) => {
      if (trayCounts[b] !== trayCounts[a]) return trayCounts[b] - trayCounts[a];
      return trayLatestIdx[b] - trayLatestIdx[a];
    });

    for (const targetKey of sortedKeys) {
      const [targetIcon, targetColor] = targetKey.split('_');

      const candidates = boardTiles.filter(t =>
        !t.isGift &&
        t.baseIcon === targetIcon &&
        t.color === targetColor &&
        isTileFree(t, boardTiles)
      );

      if (candidates.length > 0) {
        const sorted = sortByPriority(candidates);
        return {
          tilesToPull: [sorted[0]],
          matchedFromTray: true
        };
      }
    }
  }

  const freeTiles = boardTiles.filter(t => !t.isGift && isTileFree(t, boardTiles));
  const groups: Record<string, Tile[]> = {};
  freeTiles.forEach(t => {
    const key = `${t.baseIcon}_${t.color}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const validKeys = Object.keys(groups).filter(k => groups[k].length >= 3);

  if (validKeys.length > 0) {
    const sortedKeys = validKeys.sort((a, b) => {
      const aBest = sortByPriority(groups[a])[0];
      const bBest = sortByPriority(groups[b])[0];
      if (aBest.z !== bBest.z) return aBest.z - bBest.z;
      if (aBest.x !== bBest.x) return bBest.x - aBest.x;
      return aBest.y - bBest.y;
    });

    const chosenKey = sortedKeys[0];
    const sortedGroup = sortByPriority(groups[chosenKey]);

    const [targetIcon, targetColor] = chosenKey.split('_');
    const trayCount = container.filter(t =>
      t.baseIcon === targetIcon && t.color === targetColor
    ).length;

    const tilesNeeded = Math.max(0, 3 - trayCount);
    const tilesToPull = sortedGroup.slice(0, tilesNeeded);

    if (tilesToPull.length > 0) {
      return {
        tilesToPull,
        matchedFromTray: trayCount > 0
      };
    }
  }

  if (freeTiles.length > 0) {
    const sorted = sortByPriority(freeTiles);
    return {
      tilesToPull: [sorted[0]],
      matchedFromTray: false,
      noMatch: true
    };
  }

  return null;
};

export const shuffleIcons = (boardTiles: Tile[], targetMatches: number): Tile[] | null => {
  const nonGiftTiles = boardTiles.filter(t => !t.isGift);
  const pairs = nonGiftTiles.map(t => ({ icon: t.baseIcon, color: t.color }));

  let bestBoard: Tile[] | null = null;
  let bestMatchCount = -1;

  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);

    let idx = 0;
    const candidateBoard = boardTiles.map(t => {
      if (t.isGift) return t;
      const newPair = shuffled[idx++];
      return { ...t, baseIcon: newPair.icon, color: newPair.color };
    });

    const matchCount = countInitialMatches(candidateBoard);

    if (matchCount >= targetMatches) {
      return candidateBoard;
    }

    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestBoard = candidateBoard;
    }
  }

  return bestBoard;
};
