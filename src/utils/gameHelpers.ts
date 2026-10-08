import { Tile, BoosterAvailability, ThemeIconRegistry, DeliveryOrderItem, HiddenSafetyReport } from '../types/game';
import { GIFT_SIZES, BOOSTER_TYPES, ICONS, COLORS } from '../constants/gameConfig';

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
  const size = GIFT_SIZES[gift.mechanic || ''] || (gift.giftCols && gift.giftRows ? { cols: gift.giftCols, rows: gift.giftRows, name: `Gift ${gift.giftCols}×${gift.giftRows}` } : GIFT_SIZES.gift2x2);
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

export const generateLevelProgressionOrders = (
  boardTiles: Tile[],
  colorBased: boolean = true,
  maxOrdersLimit?: number
): DeliveryOrderItem[] => {
  const matchable = boardTiles.filter(t => !t.isGift && t.baseIcon);

  // Group tiles by (baseIcon + color)
  const groupMap = new Map<string, Tile[]>();
  matchable.forEach(t => {
    const color = t.color || 'yellow';
    const key = colorBased ? `${t.baseIcon}__${color}` : (t.baseIcon || 'Star');
    const list = groupMap.get(key) || [];
    list.push(t);
    groupMap.set(key, list);
  });

  interface TripletProgression {
    icon: string;
    color: string;
    tiles: Tile[];
    maxZ: number;
    avgZ: number;
    avgY: number;
    avgX: number;
  }

  const triplets: TripletProgression[] = [];

  groupMap.forEach((tileList) => {
    // Sort tiles within the group by z descending (topmost accessible layer first)
    const sorted = [...tileList].sort((a, b) => b.z - a.z);

    // Form triplets of 3 tiles
    for (let i = 0; i < sorted.length; i += 3) {
      const chunk = sorted.slice(i, i + 3);
      if (chunk.length >= 3) {
        const maxZ = Math.max(chunk[0].z, chunk[1].z, chunk[2].z);
        const avgZ = (chunk[0].z + chunk[1].z + chunk[2].z) / 3;
        const avgY = (chunk[0].y + chunk[1].y + chunk[2].y) / 3;
        const avgX = (chunk[0].x + chunk[1].x + chunk[2].x) / 3;

        triplets.push({
          icon: chunk[0].baseIcon!,
          color: chunk[0].color || 'yellow',
          tiles: chunk,
          maxZ,
          avgZ,
          avgY,
          avgX
        });
      }
    }
  });

  // Sort triplets according to progression of level:
  // Topmost accessible layers (highest maxZ / avgZ) appear first in the progression!
  triplets.sort((a, b) => {
    if (b.maxZ !== a.maxZ) return b.maxZ - a.maxZ;
    if (b.avgZ !== a.avgZ) return b.avgZ - a.avgZ;
    if (a.avgY !== b.avgY) return a.avgY - b.avgY;
    return a.avgX - b.avgX;
  });

  // If level doesn't have exact triplets or has leftover tiles, create minimum 4 orders if possible
  const selectedTriplets = maxOrdersLimit && maxOrdersLimit > 0
    ? triplets.slice(0, maxOrdersLimit)
    : triplets;

  // Fallback: if triplets is empty, generate from available pool
  if (selectedTriplets.length === 0) {
    return generateDeliveryOrdersFromBoard(boardTiles, colorBased, Math.max(4, maxOrdersLimit || 4), 'queued');
  }

  return selectedTriplets.map((trip, idx) => ({
    id: `ord-prog-${idx}-${trip.icon}-${trip.color}`,
    icon: trip.icon,
    color: trip.color,
    status: 'queued' as const,
    subTray: [],
    requiredCount: 3
  }));
};

export const generateDeliveryOrdersFromBoard = (
  boardTiles: Tile[],
  colorBased: boolean | undefined,
  countNeeded: number,
  status: 'active' | 'queued' = 'queued'
): DeliveryOrderItem[] => {
  const countMap = new Map<string, { icon: string; color: string; count: number }>();
  boardTiles.forEach(t => {
    if (!t.baseIcon || t.isGift) return;
    const color = t.color || 'yellow';
    const key = colorBased ? `${t.baseIcon}__${color}` : t.baseIcon;
    const existing = countMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countMap.set(key, { icon: t.baseIcon, color, count: 1 });
    }
  });

  const available = Array.from(countMap.values());
  const with3 = available.filter(a => a.count >= 3);
  const pool = with3.length >= countNeeded ? with3 : (available.length > 0 ? available : []);

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const newOrders: DeliveryOrderItem[] = [];
  const pickedKeys = new Set<string>();

  for (let i = 0; i < countNeeded; i++) {
    let pick = shuffled.find(p => !pickedKeys.has(`${p.icon}__${p.color}`));
    if (!pick) {
      pick = shuffled[i % Math.max(1, shuffled.length)];
    }
    if (pick) {
      pickedKeys.add(`${pick.icon}__${pick.color}`);
    } else {
      pick = {
        icon: Object.keys(ICONS)[Math.floor(Math.random() * Object.keys(ICONS).length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)].id,
        count: 3
      };
    }

    newOrders.push({
      id: `ord-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      icon: pick.icon,
      color: pick.color,
      status,
      subTray: [],
      requiredCount: 3
    });
  }

  return newOrders;
};

export const transferMatchingTilesToSubTrays = (
  mainTray: Tile[],
  orders: DeliveryOrderItem[],
  forceExactColorMatch: boolean = true
): DeliveryOrderItem[] => {
  const updatedOrders = orders.map(o => ({
    ...o,
    subTray: [...(o.subTray || [])]
  }));

  for (const order of updatedOrders) {
    if (order.status !== 'active') continue;
    while ((order.subTray?.length ?? 0) < 3) {
      const matchIdx = mainTray.findIndex(t => {
        if (forceExactColorMatch) {
          return t.baseIcon === order.icon && (t.color || 'yellow') === (order.color || 'yellow');
        }
        return t.baseIcon === order.icon;
      });
      if (matchIdx !== -1) {
        const [pulled] = mainTray.splice(matchIdx, 1);
        order.subTray = [...(order.subTray || []), pulled];
      } else {
        break;
      }
    }
    if ((order.subTray?.length ?? 0) >= 3) {
      order.status = 'completed';
    }
  }

  return updatedOrders;
};

/**
 * Calculates the Safe or Unsafe hidden state of Hidden Item tiles in the level.
 * 
 * Safe State:
 *   - Spreads available icons exclusively on its sitting layer (t.z).
 *   - Other layers cannot be accounted for in the available options for placing icons inside.
 *   - Self-sufficient if sitting layer has enough tiles (>= 3 tiles) to form matching pairs.
 * 
 * Unsafe State:
 *   - Works as normal with higher chance of randomness drawn from the global pool across all layers.
 */
export const calculateHiddenSafety = (tiles: Tile[]): HiddenSafetyReport => {
  const matchable = tiles.filter(t => !t.isGift);
  const hiddenTiles = matchable.filter(t => t.mechanic === 'hidden');

  const byLayer: HiddenSafetyReport['byLayer'] = {};
  const tileDetails: HiddenSafetyReport['tileDetails'] = [];

  // Group tiles by layer
  const tilesByLayer: Record<number, Tile[]> = {};
  matchable.forEach(t => {
    if (!tilesByLayer[t.z]) tilesByLayer[t.z] = [];
    tilesByLayer[t.z].push(t);
  });

  // Populate byLayer stats
  Object.entries(tilesByLayer).forEach(([layerStr, lTiles]) => {
    const layer = Number(layerStr);
    const lHidden = lTiles.filter(t => t.mechanic === 'hidden');
    const availableIcons = Array.from(new Set(lTiles.map(t => t.baseIcon).filter(Boolean))) as string[];
    const isSelfSufficient = lTiles.length >= 3;

    byLayer[layer] = {
      layer,
      totalTiles: lTiles.length,
      hiddenTiles: lHidden.length,
      safeTiles: 0,
      unsafeTiles: 0,
      availableIcons,
      isSelfSufficient
    };
  });

  let safeCount = 0;
  let unsafeCount = 0;

  hiddenTiles.forEach(tile => {
    const layer = tile.z;
    const lTiles = tilesByLayer[layer] || [];
    const isSelfSufficient = lTiles.length >= 3;

    // Determine state
    let state: 'safe' | 'unsafe';
    let reason: string;

    if (tile.hiddenState === 'unsafe') {
      state = 'unsafe';
      reason = 'Unsafe: Configured as Unsafe (higher chance of randomness across all layers).';
    } else if (tile.hiddenState === 'safe') {
      if (isSelfSufficient) {
        state = 'safe';
        reason = `Safe: Icons spread exclusively on sitting Layer ${layer} (${lTiles.length} tiles on layer). Other layers cannot be accounted for.`;
      } else {
        state = 'unsafe';
        reason = `Unsafe: Layer ${layer} has only ${lTiles.length} tile(s) (< 3). Cannot sustain a self-contained match on sitting layer alone.`;
      }
    } else {
      // Auto-calculated state when not explicitly set
      if (isSelfSufficient) {
        state = 'safe';
        reason = `Safe (Auto): Sitting Layer ${layer} has ${lTiles.length} tiles (>= 3). Available icons confined to sitting layer.`;
      } else {
        state = 'unsafe';
        reason = `Unsafe (Auto): Sitting Layer ${layer} has only ${lTiles.length} tile(s). Requires other layers, increasing risk of deadlock/randomness.`;
      }
    }

    if (state === 'safe') {
      safeCount++;
      if (byLayer[layer]) byLayer[layer].safeTiles++;
    } else {
      unsafeCount++;
      if (byLayer[layer]) byLayer[layer].unsafeTiles++;
    }

    tileDetails.push({
      tileId: tile.id,
      x: tile.x,
      y: tile.y,
      z: tile.z,
      state,
      sittingLayer: layer,
      layerTileCount: lTiles.length,
      isSelfSufficient,
      reason
    });
  });

  return {
    totalHidden: hiddenTiles.length,
    safeCount,
    unsafeCount,
    byLayer,
    tileDetails
  };
};

/**
 * Automatically calculates and applies Safe/Unsafe hiddenState to tiles.
 */
export const calculateAndApplyHiddenSafety = (
  tiles: Tile[],
  targetMode: 'auto' | 'all-safe' | 'all-unsafe' = 'auto',
  targetTileIds?: Set<string>
): Tile[] => {
  const matchable = tiles.filter(t => !t.isGift);
  const tilesByLayer: Record<number, Tile[]> = {};
  matchable.forEach(t => {
    if (!tilesByLayer[t.z]) tilesByLayer[t.z] = [];
    tilesByLayer[t.z].push(t);
  });

  return tiles.map(tile => {
    if (tile.isGift || tile.mechanic !== 'hidden') return tile;
    if (targetTileIds && !targetTileIds.has(tile.id)) return tile;

    const layerTiles = tilesByLayer[tile.z] || [];
    const isSelfSufficient = layerTiles.length >= 3;

    let nextState: 'safe' | 'unsafe';
    if (targetMode === 'all-unsafe') {
      nextState = 'unsafe';
    } else if (targetMode === 'all-safe') {
      nextState = 'safe';
    } else {
      // auto
      nextState = isSelfSufficient ? 'safe' : 'unsafe';
    }

    return {
      ...tile,
      hiddenState: nextState
    };
  });
};

/**
 * Spreads available icons for Safe Hidden items on their sitting layer,
 * strictly forbidding other layers from accounting for the available options.
 * Unsafe hidden tiles work as normal with higher chance of randomness.
 */
export const distributeIconsWithHiddenSafety = (
  tiles: Tile[],
  pool: Array<{ i: string; c: string }>,
  allPossible: Array<{ i: string; c: string }>
): {
  tiles: Tile[];
  safeHiddenCount: number;
  unsafeHiddenCount: number;
} => {
  const matchable = tiles.filter(t => !t.isGift);
  const giftTiles = tiles.filter(t => t.isGift);

  if (matchable.length === 0) {
    return { tiles, safeHiddenCount: 0, unsafeHiddenCount: 0 };
  }

  // Identify safe and unsafe hidden tiles
  const safeHidden = matchable.filter(t => t.mechanic === 'hidden' && (t.hiddenState === 'safe' || t.hiddenState === undefined));
  const unsafeHidden = matchable.filter(t => t.mechanic === 'hidden' && t.hiddenState === 'unsafe');

  // Group tiles by layer
  const layerMap = new Map<number, Tile[]>();
  matchable.forEach(t => {
    const list = layerMap.get(t.z) || [];
    list.push(t);
    layerMap.set(t.z, list);
  });

  // Track assigned icon/color for each tile
  const assigned = new Map<string, { i: string; c: string }>();

  // For each layer with Safe Hidden tiles, allocate distinct triplets on that sitting layer first
  layerMap.forEach((layerTiles, layerZ) => {
    const layerSafeHidden = layerTiles.filter(t => t.mechanic === 'hidden' && (t.hiddenState === 'safe' || t.hiddenState === undefined));
    if (layerSafeHidden.length === 0) return;

    // Available pool dedicated for this sitting layer
    // Other layers CANNOT be accounted for
    const layerPool = [...pool].sort(() => Math.random() - 0.5);
    // Determine how many layer triplets can be dedicated
    const numLayerTriplets = Math.max(1, Math.ceil(layerSafeHidden.length / 3));

    // Choose icons for sitting layer
    const layerChosenIcons: Array<{ i: string; c: string }> = [];
    for (let k = 0; k < numLayerTriplets; k++) {
      layerChosenIcons.push(layerPool[k % layerPool.length]);
    }

    // Spread available icons on this sitting layer among safe hidden tiles and companion layer tiles
    let safeHiddenIdx = 0;
    layerSafeHidden.forEach(t => {
      const pick = layerChosenIcons[safeHiddenIdx % layerChosenIcons.length];
      assigned.set(t.id, pick);
      safeHiddenIdx++;
    });

    // Also place matching twin/triplet tiles on this same sitting layer if other tiles exist on this layer
    const remainingLayerTiles = layerTiles.filter(t => !assigned.has(t.id));
    let remIdx = 0;
    // For each safe hidden icon, ensure companion tiles on the same layer have this icon
    layerChosenIcons.forEach(icon => {
      const neededCompanions = 2;
      for (let c = 0; c < neededCompanions && remIdx < remainingLayerTiles.length; c++) {
        assigned.set(remainingLayerTiles[remIdx].id, icon);
        remIdx++;
      }
    });
  });

  // For all remaining unassigned tiles (including Unsafe Hidden tiles and normal tiles):
  // Unsafe works as normal with higher chance of randomness from pool or allPossible!
  const unassignedTiles = matchable.filter(t => !assigned.has(t.id));
  const remainingSets = Math.ceil(unassignedTiles.length / 3);
  const remainingTriplets: Array<{ i: string; c: string }> = [];

  for (let s = 0; s < remainingSets; s++) {
    // If unsafe hidden tiles exist, introduce higher chance of randomness (broader variants from allPossible)
    const sourcePool = unsafeHidden.length > 0 && Math.random() < 0.6 ? allPossible : pool;
    const v = sourcePool[Math.floor(Math.random() * sourcePool.length)];
    remainingTriplets.push(v, v, v);
  }
  remainingTriplets.sort(() => Math.random() - 0.5);

  let tripIdx = 0;
  unassignedTiles.forEach(t => {
    const pair = remainingTriplets[tripIdx++] || pool[Math.floor(Math.random() * pool.length)];
    assigned.set(t.id, pair);
  });

  const updatedTiles = matchable.map(t => {
    const pair = assigned.get(t.id);
    return {
      ...t,
      baseIcon: pair ? pair.i : t.baseIcon,
      color: pair ? pair.c : t.color,
    };
  });

  return {
    tiles: [...updatedTiles, ...giftTiles],
    safeHiddenCount: safeHidden.length,
    unsafeHiddenCount: unsafeHidden.length
  };
};

