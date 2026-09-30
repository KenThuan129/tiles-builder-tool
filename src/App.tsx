import React, { useState, useEffect, useMemo } from 'react';
import {
  ViewportPresetKey, Tile, DifficultyMod, ThemeWeights,
  IconPoolEntry, ThemeIconRegistry, BoosterAvailability, SuggestParams,
  ValidatedImportData, ImportWarning, TileCluster, BotPersona, MoveLogItem, MoveSequencePayload,
  BoardMorphismConfig, TileSpectrumEntry, EditorTool,
  BoardTimerConfig, BoardRandomConfig, BossBattleConfig, SweetDeliveryConfig
} from './types/game';
import {
  VIEWPORT_PRESETS, INTRINSIC_BOARD_SIZE, WEIGHTS, ICONS, COLORS,
  ALL_THEMES, GIFT_SIZES, INITIAL_DIFFICULTY_MODS, DISTRIBUTION_PATTERNS,
  COMBINE_SHAPES, BOOSTER_TYPES, BOOSTER_PRESETS, BOOSTER_CAPS,
  BOOSTER_MEDIANS, BYTES_VERSION
} from './constants/gameConfig';
import {
  getIconBudget, getBoosterBand, calculateBoosterRelief, calculateBoosterMultiplier,
  generateId, isOverlapping, isTileCoveredByOther, isChainLocked, isTileFree,
  buildStackDepthMap, assignIconsBudgetAware, buildIconAssignmentPlan,
  assignIconsFromPool, checkComboBalance, isGiftBlocked, resolveSpecialMechanics,
  formTripletGroups, buildThemeQueue, countInitialMatches, findMagnetTargets,
  shuffleIcons, findLastIndex
} from './utils/gameHelpers';
import { convertToBytes } from './utils/bytesConverter';
import { loadLicenseFromStorage, LicenseData } from './utils/licenseService';
import { getBotNextMove } from './utils/botSimulator';

import { Header } from './components/Header';
import { BuilderSidebar } from './components/BuilderSidebar';
import { BoardCanvas } from './components/BoardCanvas';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { LandingPage } from './components/LandingPage';
import { BotPlayerControls } from './components/BotPlayerControls';

import { SuggestLevelModal } from './components/modals/SuggestLevelModal';
import { ExportJsonModal } from './components/modals/ExportJsonModal';
import { ExportBytesModal } from './components/modals/ExportBytesModal';
import { ImportJsonModal } from './components/modals/ImportJsonModal';
import { ImportConfirmModal } from './components/modals/ImportConfirmModal';
import { ImportThemeModal } from './components/modals/ImportThemeModal';
import { SubscribeModal } from './components/modals/SubscribeModal';
import { KeyActivationModal } from './components/modals/KeyActivationModal';
import { ProLockModal } from './components/modals/ProLockModal';
import { SimulateMoveSequenceModal } from './components/modals/SimulateMoveSequenceModal';
import { MoveLogExportModal } from './components/modals/MoveLogExportModal';
import { LifetimeProLockModal } from './components/modals/LifetimeProLockModal';

export default function App() {
  // Navigation & Monetization State
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [activeLicense, setActiveLicense] = useState<LicenseData | null>(null);

  // Modals for Subscription & Activation
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState<boolean>(false);
  const [isKeyActivationModalOpen, setIsKeyActivationModalOpen] = useState<boolean>(false);
  const [proLockState, setProLockState] = useState<{ isOpen: boolean; featureName: string; featureDescription: string }>({
    isOpen: false,
    featureName: '',
    featureDescription: '',
  });
  const [isLifetimeLockModalOpen, setIsLifetimeLockModalOpen] = useState<boolean>(false);

  const isLifetimePro = useMemo(() => {
    if (!activeLicense) return false;
    const plan = (activeLicense.planName || '').toLowerCase();
    return plan.includes('lifetime') || plan.includes('99');
  }, [activeLicense]);

  // Cluster State
  const [clusters, setClusters] = useState<TileCluster[]>([]);
  const [clusterSelectionMode, setClusterSelectionMode] = useState<string | null>(null);
  const [clusterPlacementMode, setClusterPlacementMode] = useState<string | null>(null);
  const [highlightedClusterId, setHighlightedClusterId] = useState<string | null>(null);

  // Bot Demonstration & Move Log State
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  const [botPersona, setBotPersona] = useState<BotPersona>('veteran');
  const [botSpeed, setBotSpeed] = useState<number>(1);
  const [moveLogs, setMoveLogs] = useState<MoveLogItem[]>([]);
  const [isMoveLogModalOpen, setIsMoveLogModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [simulationPayload, setSimulationPayload] = useState<MoveSequencePayload | null>(null);
  const [simCurrentStepIndex, setSimCurrentStepIndex] = useState<number>(0);

  // App Editor & Play State
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [levelNum, setLevelNum] = useState<number>(1);
  const [tiles, setTilesInternal] = useState<Tile[]>([]);

  // Undo/Redo stack for Tile Editing Mode
  const [editHistory, setEditHistory] = useState<Tile[][]>([]);
  const [editHistoryIndex, setEditHistoryIndex] = useState<number>(-1);

  // setTiles wrapper that records history state when in edit mode
  const setTiles = (value: React.SetStateAction<Tile[]>, skipHistory = false) => {
    setTilesInternal(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (!skipHistory) {
        setEditHistory(hPrev => {
          const sliced = hPrev.slice(0, editHistoryIndex + 1);
          const updated = [...sliced, next];
          if (updated.length > 50) updated.shift();
          return updated;
        });
        setEditHistoryIndex(hIdx => {
          const nextIdx = Math.min(hIdx + 1, 49);
          return nextIdx;
        });
      }
      return next;
    });
  };

  const handleEditUndo = () => {
    if (mode !== 'edit') return;
    if (editHistoryIndex > 0) {
      const prevIdx = editHistoryIndex - 1;
      setEditHistoryIndex(prevIdx);
      setTilesInternal(editHistory[prevIdx]);
    }
  };

  const handleEditRedo = () => {
    if (mode !== 'edit') return;
    if (editHistoryIndex < editHistory.length - 1) {
      const nextIdx = editHistoryIndex + 1;
      setEditHistoryIndex(nextIdx);
      setTilesInternal(editHistory[nextIdx]);
    }
  };

  const canUndoEdit = editHistoryIndex > 0;
  const canRedoEdit = editHistoryIndex < editHistory.length - 1;

  const handleCreateNewCluster = () => {
    if (!activeLicense) {
      triggerProLock(
        'Cluster Feature',
        'Grouping tiles into cohesive clusters (up to 35 clusters, max 5 tiles per cluster) is a Pro Studio feature.'
      );
      return;
    }

    if (clusters.length >= 35) {
      alert('Maximum limit of 35 clusters reached.');
      return;
    }

    const CLUSTER_COLORS = [
      '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#d946ef'
    ];

    const nextNumber = clusters.length + 1;
    const newClusterId = `cluster_${Date.now()}`;
    const newColor = CLUSTER_COLORS[(nextNumber - 1) % CLUSTER_COLORS.length];

    const newCluster: TileCluster = {
      id: newClusterId,
      name: `Cluster #${nextNumber}`,
      color: newColor,
      tileIds: [],
      items: [],
    };

    setClusters(prev => [...prev, newCluster]);
    setClusterSelectionMode(newClusterId);
    setClusterPlacementMode(null);
  };

  // Keyboard shortcuts for Tile Editor Undo/Redo & Cluster Grouping (Ctrl + G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'edit') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleEditRedo();
        } else {
          e.preventDefault();
          handleEditUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleEditRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (clusterSelectionMode) {
          setClusterSelectionMode(null);
        } else {
          handleCreateNewCluster();
        }
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 's') {
          setSelectedTool('select');
        } else if (e.key.toLowerCase() === 'p') {
          setSelectedTool('place');
        } else if (e.key.toLowerCase() === 'e') {
          setSelectedTool('erase');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, editHistoryIndex, editHistory, clusterSelectionMode, clusters, activeLicense]);
  const [viewportPreset, setViewportPreset] = useState<ViewportPresetKey>('tablet');

  // Drawer toggles for Mobile / Tablet viewports
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);

  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [activeGiftLayer, setActiveGiftLayer] = useState<number>(0.5);
  const [themeWeights, setThemeWeights] = useState<ThemeWeights>({
    theme00: 100,
    theme01: 0,
    theme02: 0,
  });
  const [distributionMode, setDistributionMode] = useState<'theme' | 'icon'>('theme');
  const [iconPool, setIconPool] = useState<IconPoolEntry[]>([]);

  const activeThemes = useMemo(
    () => ALL_THEMES.filter(t => themeWeights[t] > 0),
    [themeWeights]
  );
  const [layerViewMode, setLayerViewMode] = useState<'all' | 'cumulative' | 'isolated'>('all');
  const [selectedTool, setSelectedTool] = useState<EditorTool>('place');
  const [difficultyMods, setDifficultyMods] = useState<Record<string, DifficultyMod>>(INITIAL_DIFFICULTY_MODS);
  const [difficultyMod, setDifficultyMod] = useState<string>('modMedium');
  const [isModEditorOpen, setIsModEditorOpen] = useState<boolean>(false);
  const [giftPlacementMode, setGiftPlacementMode] = useState<string | null>(null);
  const [eventItemsCollected, setEventItemsCollected] = useState<number>(0);
  const [giftsRevealed, setGiftsRevealed] = useState<number>(0);

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isBytesModalOpen, setIsBytesModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string[] | null>(null);
  const [importPreview, setImportPreview] = useState<ValidatedImportData | null>(null);
  const [importConfirm, setImportConfirm] = useState<{ warnings: ImportWarning[]; onConfirm: () => void } | null>(null);

  const [iconColorRatio, setIconColorRatio] = useState<{ themeIconRatio: number; colorIconRatio: number }>({
    themeIconRatio: 85,
    colorIconRatio: 15
  });

  const [iconBudgetOverride, setIconBudgetOverride] = useState<number | null>(null);

  const currentIconBudget = useMemo(() => {
    if (iconBudgetOverride !== null) {
      return { maxIcons: iconBudgetOverride, minRepeat: 1 };
    }
    return getIconBudget(levelNum);
  }, [levelNum, iconBudgetOverride]);

  const [boosterPreset, setBoosterPreset] = useState<string>('none');
  const [boosterCustom, setBoosterCustom] = useState<BoosterAvailability>({
    undo: 0,
    magnet: 0,
    swap: 0,
    slotExpand: 0
  });

  const [themeIconRegistry, setThemeIconRegistry] = useState<ThemeIconRegistry | null>(null);
  const [isThemeImportModalOpen, setIsThemeImportModalOpen] = useState<boolean>(false);
  const [themeImportText, setThemeImportText] = useState<string>('');
  const [themeImportError, setThemeImportError] = useState<string[] | null>(null);
  const [themeImportPreview, setThemeImportPreview] = useState<any | null>(null);
  const [showOnlyUnbalanced, setShowOnlyUnbalanced] = useState<boolean>(false);

  const baseAvailability = boosterPreset === 'custom'
    ? boosterCustom
    : (BOOSTER_PRESETS[boosterPreset]?.availability || { undo: 0, magnet: 0, swap: 0, slotExpand: 0 });

  const [suggestParams, setSuggestParams] = useState<SuggestParams>({
    targetTiles: 45,
    layers: 3,
    stackRatio: 30,
    diagonalRatio: 30,
    layoutShape: 'pyramid',
    hiddenPct: 10,
    chained1Pct: 5,
    chained2Pct: 5,
    icePct: 10,
    combinedPct: 5,
    combinedMaxSize: 4,
    enableeventItemLeaf: true
  });

  const [distributionPattern, setDistributionPattern] = useState<string>('themeFocus');
  const [hybridSub1, setHybridSub1] = useState<string>('themeFocus');
  const [hybridSub2, setHybridSub2] = useState<string>('colorScatter');

  const [selectedMechanic, setSelectedMechanic] = useState<string>('normal');
  const [selectedCombineShapeId, setSelectedCombineShapeId] = useState<string>('4-square');
  const [combineTileCountFilter, setCombineTileCountFilter] = useState<number | 'all'>('all');

  const [chainLevel, setChainLevel] = useState<number>(1);
  const [iceMatchReq, setIceMatchReq] = useState<number>(2);

  // Board Mechanisms State
  const [boardMorphism, setBoardMorphism] = useState<BoardMorphismConfig>({
    enabled: false,
    spinAngle: 90,
    mirroredHorizons: false,
  });
  const [tileSpectrums, setTileSpectrums] = useState<TileSpectrumEntry[]>([]);

  const [boardTimer, setBoardTimer] = useState<BoardTimerConfig>({
    enabled: false,
    duration: 60,
  });

  const [boardRandom, setBoardRandom] = useState<BoardRandomConfig>({
    enabled: false,
    interval: 10,
  });

  const [bossBattle, setBossBattle] = useState<BossBattleConfig>({
    enabled: false,
    maxHP: 100,
  });

  const [sweetDelivery, setSweetDelivery] = useState<SweetDeliveryConfig>({
    enabled: false,
    orders: [], // Will be generated when starting the play mode
  });

  // Dynamic Board Mechanism Play States
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [bossHP, setBossHP] = useState<number>(100);
  const [playerHP, setPlayerHP] = useState<number>(100);
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);
  const [hasRevivedThisRun, setHasRevivedThisRun] = useState<boolean>(false);
  const [matchCountSinceLastShuffle, setMatchCountSinceLastShuffle] = useState<number>(0);
  const [hasPickedFirstTile, setHasPickedFirstTile] = useState<boolean>(false);

  const [playTiles, setPlayTiles] = useState<Tile[]>([]);
  const [container, setContainer] = useState<Tile[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [boosterInventory, setBoosterInventory] = useState<BoosterAvailability>({
    undo: 0, magnet: 0, swap: 0, slotExpand: 0
  });
  const [slotExpandUsed, setSlotExpandUsed] = useState<number>(0);
  const [showAnalyticsInPlay, setShowAnalyticsInPlay] = useState<boolean>(true);

  // Load saved license on mount
  useEffect(() => {
    const saved = loadLicenseFromStorage();
    if (saved) {
      setActiveLicense(saved);
    }
  }, []);

  const triggerProLock = (featureName: string, featureDescription: string) => {
    setProLockState({
      isOpen: true,
      featureName,
      featureDescription,
    });
  };

  const handleOpenImportJson = () => {
    if (!activeLicense) {
      triggerProLock('JSON Level Importer', 'Importing existing level JSON payloads requires a Pro Studio License.');
      return;
    }
    setIsImportModalOpen(true);
  };

  const handleOpenExportBytes = () => {
    if (!activeLicense) {
      triggerProLock('Native .bytes Game Engine Export', 'Exporting levels to native .bytes game engine format is a Pro Studio feature.');
      return;
    }
    setIsBytesModalOpen(true);
  };

  const handleOpenExportJson = () => {
    setIsExportModalOpen(true);
  };

  const matchableCount = tiles.filter(t => !t.isGift).length;
  const isPlayable = matchableCount > 0 && matchableCount % 3 === 0;

  const boardScale = useMemo(() => {
    return VIEWPORT_PRESETS[viewportPreset].width / INTRINSIC_BOARD_SIZE;
  }, [viewportPreset]);

  const stackDepthMap = useMemo(
    () => buildStackDepthMap(mode === 'play' ? playTiles : tiles),
    [tiles, playTiles, mode]
  );

  useEffect(() => {
    if (distributionPattern === 'hybrid') {
      const r1 = DISTRIBUTION_PATTERNS[hybridSub1]?.defaultRatio || { themeIconRatio: 50, colorIconRatio: 50 };
      const r2 = DISTRIBUTION_PATTERNS[hybridSub2]?.defaultRatio || { themeIconRatio: 50, colorIconRatio: 50 };
      setIconColorRatio({
        themeIconRatio: Math.round((r1.themeIconRatio + r2.themeIconRatio) / 2),
        colorIconRatio: Math.round((r1.colorIconRatio + r2.colorIconRatio) / 2)
      });
    } else {
      const def = DISTRIBUTION_PATTERNS[distributionPattern]?.defaultRatio;
      if (def) {
        setIconColorRatio({ ...def });
      }
    }
  }, [distributionPattern, hybridSub1, hybridSub2]);

  useEffect(() => {
    executeSuggestLevel(suggestParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryPlaceCombineCluster = (anchorX: number, anchorY: number, layerTilesSoFar: Tile[], maxSize: number, remainingSlots: number) => {
    const candidates = COMBINE_SHAPES
      .filter(s => s.size <= maxSize && s.size <= remainingSlots)
      .sort(() => Math.random() - 0.5);

    for (const shape of candidates) {
      const cells = shape.offsets.map(o => ({ x: anchorX + o.dx, y: anchorY + o.dy }));
      const valid = cells.every(c =>
        c.x >= 2 && c.x <= 20 && c.y >= 2 && c.y <= 20 &&
        !layerTilesSoFar.some(t => t.x === c.x && t.y === c.y)
      );
      if (valid) return cells;
    }
    return null;
  };

  const executeSuggestLevel = (params: SuggestParams) => {
    const generatedTiles: Tile[] = [];
    let id = 0;

    const numLayers = Math.min(Math.max(Number(params.layers) || 3, 2), 5);
    const targetCount = Math.min(Math.max(Number(params.targetTiles) || 30, 9), 150);
    const adjustedTarget = Math.floor(targetCount / 3) * 3;
    const stackRatioVal = Number(params.stackRatio) || 30;
    const diagonalRatioVal = Number(params.diagonalRatio) || 30;
    const shape = params.layoutShape || 'pyramid';
    const combinedMaxSize = Math.min(Math.max(Number(params.combinedMaxSize) || 4, 2), 5);

    const perLayerCount = Math.ceil(adjustedTarget / numLayers);

    for (let z = 0; z < numLayers; z++) {
      const layerTiles: Tile[] = [];
      let placedThisLayer = 0;
      const targetForThisLayer = (z === numLayers - 1)
        ? (adjustedTarget - generatedTiles.length)
        : Math.min(perLayerCount, adjustedTarget - generatedTiles.length);

      if (targetForThisLayer <= 0) break;

      const candidateCoords: Array<{ x: number; y: number }> = [];
      let seedX = 10, seedY = 10;

      if (shape === 'pyramid') {
        const margin = z * 2;
        seedX = 10; seedY = 10;
        const start = 2 + margin;
        const end = 20 - margin;
        for (let y = start; y <= end; y += 2) {
          for (let x = start; x <= end; x += 2) {
            candidateCoords.push({ x, y });
          }
        }
      } else if (shape === 'clusterCluster') {
        const centers = [
          { cx: 6 + z, cy: 6 }, { cx: 14 - z, cy: 6 },
          { cx: 10, cy: 12 + (z % 2) }, { cx: 6, cy: 15 }
        ];
        const chosenCenter = centers[z % centers.length];
        seedX = chosenCenter.cx; seedY = chosenCenter.cy;
        centers.forEach(c => {
          for (let dx = -3; dx <= 3; dx += 2) {
            for (let dy = -3; dy <= 3; dy += 2) {
              const nx = Math.max(2, Math.min(20, c.cx + dx));
              const ny = Math.max(2, Math.min(20, c.cy + dy));
              candidateCoords.push({ x: nx, y: ny });
            }
          }
        });
      } else if (shape === 'spiralWave') {
        seedX = 6 + (z * 2); seedY = 10;
        for (let i = 0; i < 24; i++) {
          const x = 3 + (i * 1.5) % 15;
          const y = Math.floor(5 + Math.sin(i * 0.8 + z) * 5 + 5);
          const snappedX = Math.round(x / 2) * 2;
          const snappedY = Math.round(y / 2) * 2;
          candidateCoords.push({ x: Math.max(2, Math.min(20, snappedX)), y: Math.max(2, Math.min(20, snappedY)) });
        }
      } else {
        seedX = z % 2 === 0 ? 6 : 14; seedY = 10;
        for (let y = 4; y <= 18; y += 2) {
          for (let x = 2; x <= 20; x += 2) {
            if (Math.abs(x - 10) > 2 + z) candidateCoords.push({ x, y });
          }
        }
      }

      const coordKey = (x: number, y: number) => `${x},${y}`;
      const candidateSet = new Set(candidateCoords.map(c => coordKey(c.x, c.y)));

      const seed = candidateCoords.reduce((closest, current) => {
        const distClosest = Math.abs(closest.x - seedX) + Math.abs(closest.y - seedY);
        const distCurrent = Math.abs(current.x - seedX) + Math.abs(current.y - seedY);
        return distCurrent < distClosest ? current : closest;
      }, candidateCoords[0] || { x: 10, y: 10 });

      const chosen = [seed];
      const chosenKeys = new Set([coordKey(seed.x, seed.y)]);
      const frontier = [seed];

      const GROW_OFFSETS = [
        { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
        { dx: 2, dy: 2 }, { dx: -2, dy: -2 }, { dx: 2, dy: -2 }, { dx: -2, dy: 2 },
        { dx: 4, dy: 0 }, { dx: -4, dy: 0 }, { dx: 0, dy: 4 }, { dx: 0, dy: -4 }
      ];

      while (chosen.length < targetForThisLayer && frontier.length > 0) {
        const idx = Math.floor(Math.random() * frontier.length);
        const current = frontier.splice(idx, 1)[0];
        const shuffledOffsets = [...GROW_OFFSETS].sort(() => Math.random() - 0.5);

        for (const offset of shuffledOffsets) {
          if (chosen.length >= targetForThisLayer) break;
          const nx = current.x + offset.dx;
          const ny = current.y + offset.dy;
          if (nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20) {
            const key = coordKey(nx, ny);
            if (candidateSet.has(key) && !chosenKeys.has(key)) {
              chosen.push({ x: nx, y: ny });
              chosenKeys.add(key);
              frontier.push({ x: nx, y: ny });
            }
          }
        }
      }

      if (chosen.length < targetForThisLayer) {
        const remaining = candidateCoords
          .filter(c => !chosenKeys.has(coordKey(c.x, c.y)))
          .sort(() => Math.random() - 0.5);
        for (const c of remaining) {
          if (chosen.length >= targetForThisLayer) break;
          chosen.push(c);
          chosenKeys.add(coordKey(c.x, c.y));
        }
      }

      for (let i = 0; i < chosen.length && placedThisLayer < targetForThisLayer; i++) {
        const coord = chosen[i];
        if (layerTiles.some(t => t.x === coord.x && t.y === coord.y)) continue;

        let posX = coord.x;
        let posY = coord.y;

        if (z > 0 && generatedTiles.filter(t => t.z === z - 1).length > 0) {
          const lowerLayerTiles = generatedTiles.filter(t => t.z === z - 1);
          const baseTile = lowerLayerTiles[Math.floor(Math.random() * lowerLayerTiles.length)];

          const rollCover = Math.random() * 100;
          if (rollCover < stackRatioVal) {
            posX = baseTile.x;
            posY = baseTile.y;
          } else if (rollCover < stackRatioVal + diagonalRatioVal) {
            const offsets = [{ dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }];
            const offset = offsets[Math.floor(Math.random() * offsets.length)];
            posX = Math.max(2, Math.min(20, baseTile.x + offset.dx));
            posY = Math.max(2, Math.min(20, baseTile.y + offset.dy));
          }
        }

        let mech = 'normal';
        let clusterCells: Array<{ x: number; y: number }> | null = null;
        const rollMech = Math.random() * 100;
        const pHidden = Number(params.hiddenPct) || 0;
        const pChained1 = Number(params.chained1Pct) || 0;
        const pChained2 = Number(params.chained2Pct) || 0;
        const pIce = Number(params.icePct) || 0;
        const pCombined = Number(params.combinedPct) || 0;

        if (z > 0 && rollMech < pHidden) {
          mech = 'hidden';
        } else if (rollMech < pHidden + pChained1) {
          mech = 'chained1';
        } else if (rollMech < pHidden + pChained1 + pChained2) {
          mech = 'chained2';
        } else if (rollMech < pHidden + pChained1 + pChained2 + pIce) {
          mech = Math.random() > 0.5 ? 'ice2' : 'ice3';
        } else if (rollMech < pHidden + pChained1 + pChained2 + pIce + pCombined) {
          const remainingSlots = targetForThisLayer - placedThisLayer;
          clusterCells = tryPlaceCombineCluster(posX, posY, layerTiles, combinedMaxSize, remainingSlots);
          mech = clusterCells ? 'combined' : 'normal';
        }

        if (clusterCells) {
          clusterCells.forEach(cell => {
            layerTiles.push({ id: `gen-${id++}`, x: cell.x, y: cell.y, z, mechanic: 'combined' });
            placedThisLayer++;
          });
        } else {
          layerTiles.push({ id: `gen-${id++}`, x: posX, y: posY, z, mechanic: mech });
          placedThisLayer++;
        }
      }

      generatedTiles.push(...layerTiles);
    }

    let remainder = generatedTiles.length % 3;
    if (remainder !== 0) {
      for (let i = generatedTiles.length - 1; i >= 0 && remainder > 0; i--) {
        generatedTiles.splice(i, 1);
        remainder--;
      }
    }

    if (params.enableeventItemLeaf) {
      const normalTiles = generatedTiles.filter(t => t.mechanic === 'normal');
      if (normalTiles.length >= 3) {
        const shuffled = [...normalTiles].sort(() => Math.random() - 0.5);
        for (let i = 0; i < 3; i++) {
          const target = generatedTiles.find(t => t.id === shuffled[i].id);
          if (target) {
            target.mechanic = 'eventItem';
            target.movesRemaining = 4;
          }
        }
      }
    }

    const completeTriplets = formTripletGroups(generatedTiles);
    const themeQueue = buildThemeQueue(themeWeights, completeTriplets);

    const groupThemeMap = new Map<string, string>();
    generatedTiles.forEach(t => {
      if (!t.tripletGroupId) return;
      if (!groupThemeMap.has(t.tripletGroupId)) {
        const idx = groupThemeMap.size;
        groupThemeMap.set(t.tripletGroupId, themeQueue[idx] || activeThemes[0]);
      }
      t.themeID = groupThemeMap.get(t.tripletGroupId);
    });

    setTiles(generatedTiles);
    setIsSuggestModalOpen(false);
  };

  const generateRandomLayout = () => {
    executeSuggestLevel(suggestParams);
  };

  const startPlayMode = () => {
    if (!isPlayable) return;

    const resolvedTiles = resolveSpecialMechanics(tiles.filter(t => !t.isGift));

    const eventItemTiles = resolvedTiles.filter(t => t.mechanic === 'eventItem');
    const otherMatchable = resolvedTiles.filter(t => t.mechanic !== 'eventItem');
    const totalMatchable = otherMatchable.length + eventItemTiles.length;

    if (totalMatchable % 3 !== 0) {
      alert(`Matchable tiles (${totalMatchable}) phải chia hết cho 3.`);
      return;
    }

    const modConfig = difficultyMods[difficultyMod] || difficultyMods.modMedium;
    const allPossible: Array<{ i: string; c: string }> = [];
    Object.keys(ICONS).forEach(icon => COLORS.forEach(c => allPossible.push({ i: icon, c: c.id })));
    const shuffledVariants = [...allPossible].sort(() => Math.random() - 0.5);
    const pool = shuffledVariants.slice(0, Math.min(modConfig.variants, shuffledVariants.length));

    const triplets: Array<{ i: string; c: string }> = [];
    const numSets = totalMatchable / 3;
    for (let i = 0; i < numSets; i++) {
      const v = pool[Math.floor(Math.random() * pool.length)];
      triplets.push(v, v, v);
    }
    triplets.sort(() => Math.random() - 0.5);

    let tIndex = 0;
    const initializedPlayTiles = resolvedTiles.map(t => {
      const assigned = triplets[tIndex++];
      return {
        ...t,
        baseIcon: assigned.i,
        color: assigned.c,
        iceMatchesRemaining: t.mechanic === 'ice3' ? 3 : t.mechanic === 'ice2' ? 2 : undefined,
        chainClearedCount: t.mechanic === 'chained1' || t.mechanic === 'chained2' ? 0 : undefined,
        isRevealed: t.mechanic !== 'hidden',
        movesRemaining: t.mechanic === 'eventItem' ? 4 : undefined,
        isEventItemActive: t.mechanic === 'eventItem'
      };
    });

    const giftTiles = tiles.filter(t => t.isGift).map(g => ({
      ...g,
      isRevealedInPlay: false
    }));

    setMode('play');
    setGameState('playing');
    setContainer([]);
    setEventItemsCollected(0);
    setGiftsRevealed(0);
    setPlayTiles([...initializedPlayTiles, ...giftTiles]);
    setBoosterInventory({ ...baseAvailability });
    setSlotExpandUsed(0);
    setMoveLogs([]);
    setIsBotActive(false);

    // Initialize mechanism run-time states
    setTimeLeft(boardTimer.enabled ? boardTimer.duration : 60);
    setBossHP(bossBattle.maxHP);
    setPlayerHP(100);
    setCompletedOrders([]);
    setHasRevivedThisRun(false);
    setMatchCountSinceLastShuffle(0);
    setHasPickedFirstTile(false);

    if (sweetDelivery.enabled) {
      const activeIcons = Array.from(new Set(initializedPlayTiles.map(t => t.baseIcon).filter(Boolean))) as string[];
      const shuffled = [...activeIcons].sort(() => Math.random() - 0.5);
      const deliveryOrders = shuffled.slice(0, 4);
      while (deliveryOrders.length < 4) {
        deliveryOrders.push(Object.keys(ICONS)[Math.floor(Math.random() * Object.keys(ICONS).length)]);
      }
      setSweetDelivery(prev => ({ ...prev, orders: deliveryOrders }));
    }

    setIsLeftSidebarOpen(false);
    setIsRightPanelOpen(false);
  };

  const stopPlayMode = () => {
    setMode('edit');
    setIsBotActive(false);
    setSimulationPayload(null);
  };

  const handleTileClusterToggle = (tileId: string) => {
    if (!clusterSelectionMode) return;
    const targetCluster = clusters.find(c => c.id === clusterSelectionMode);
    if (!targetCluster) return;

    const clickedTile = tiles.find(t => t.id === tileId);
    if (!clickedTile) return;

    const isAlreadyInCluster = targetCluster.tileIds.includes(tileId);
    let newTileIds: string[];
    let nextTiles: Tile[];

    if (isAlreadyInCluster) {
      newTileIds = targetCluster.tileIds.filter(id => id !== tileId);
      nextTiles = tiles.map(t => t.id === tileId ? { ...t, clusterId: undefined } : t);
    } else {
      if (targetCluster.tileIds.length >= 5) {
        alert('Cluster limit reached: Maximum 5 tiles per cluster.');
        return;
      }
      newTileIds = [...targetCluster.tileIds, tileId];
      nextTiles = tiles.map(t => t.id === tileId ? { ...t, clusterId: clusterSelectionMode } : t);
    }

    setTiles(nextTiles);

    // Recalculate relative offsets for cluster placement template using nextTiles
    const memberTiles = nextTiles.filter(t => newTileIds.includes(t.id));
    if (memberTiles.length === 0) {
      setClusters(prev => prev.map(c => c.id === clusterSelectionMode ? { ...c, tileIds: [], items: [] } : c));
      return;
    }

    const minX = Math.min(...memberTiles.map(t => t.x));
    const minY = Math.min(...memberTiles.map(t => t.y));
    const minZ = Math.min(...memberTiles.map(t => t.z));

    const clusterItems = memberTiles.map(t => ({
      relX: t.x - minX,
      relY: t.y - minY,
      relZ: t.z - minZ,
      mechanic: t.mechanic,
      themeID: t.themeID,
      baseIcon: t.baseIcon,
      color: t.color,
    }));

    setClusters(prev => prev.map(c => c.id === clusterSelectionMode ? { ...c, tileIds: newTileIds, items: clusterItems } : c));
  };

  const handlePlaceClusterOnGrid = (anchorX: number, anchorY: number, clusterId: string) => {
    const targetCluster = clusters.find(c => c.id === clusterId);
    if (!targetCluster || !targetCluster.items || targetCluster.items.length === 0) {
      alert('Selected cluster has no defined tiles. First select tiles placed on the grid.');
      return;
    }

    const stampedTiles: Tile[] = targetCluster.items.map(item => ({
      id: generateId(),
      x: anchorX + item.relX,
      y: anchorY + item.relY,
      z: activeLayer + item.relZ,
      mechanic: item.mechanic || 'normal',
      themeID: item.themeID || activeThemes[0] || 'theme00',
      baseIcon: item.baseIcon,
      color: item.color,
      clusterId: targetCluster.id,
    }));

    setTiles(prev => [...prev, ...stampedTiles]);
  };

  const buildMoveSequencePayload = useMemo<MoveSequencePayload>(() => {
    return {
      levelId: levelNum,
      createdAt: new Date().toISOString(),
      persona: isBotActive ? botPersona : 'human',
      totalMoves: moveLogs.length,
      completed: gameState === 'won',
      moves: moveLogs,
      levelSnapshot: {
        tilesCount: tiles.length,
        difficultyBand: difficultyMod,
      }
    };
  }, [levelNum, isBotActive, botPersona, moveLogs, gameState, tiles.length, difficultyMod]);

  // AI Bot Auto-Play Loop with Booster Usage Tendencies
  useEffect(() => {
    if (!isBotActive || mode !== 'play' || gameState !== 'playing') return;

    const intervalTime = Math.max(150, 1000 / botSpeed);
    const timer = setInterval(() => {
      if (simulationPayload) {
        setSimCurrentStepIndex(prev => {
          if (prev >= simulationPayload.moves.length - 1) {
            setIsBotActive(false);
            return prev;
          }
          return prev + 1;
        });
      } else {
        // Booster usage tendencies based on persona
        const trayMax = bossBattle.enabled || sweetDelivery.enabled ? (5 + slotExpandUsed) : (7 + slotExpandUsed);
        let usedBooster = false;

        if (container.length >= trayMax - 1) {
          let useBoosterProb = 0.2; // casual
          if (botPersona === 'veteran') useBoosterProb = 0.7;
          if (botPersona === 'hardcore') useBoosterProb = 0.95;

          if (Math.random() < useBoosterProb) {
            if (boosterInventory.slotExpand > 0) {
              handleSlotExpand();
              usedBooster = true;
            } else if (boosterInventory.magnet > 0) {
              const target = findMagnetTargets(playTiles, container);
              if (target && target.tilesToPull.length > 0) {
                handleMagnet();
                usedBooster = true;
              }
            } else if (boosterInventory.swap > 0) {
              handleSwap();
              usedBooster = true;
            } else if (boosterInventory.undo > 0) {
              handleUndo();
              usedBooster = true;
            }
          }
        }

        if (usedBooster) {
          return; // Skip picking a tile for this tick since we used a booster
        }

        const move = getBotNextMove(botPersona, playTiles, container);
        if (move.tileToPick) {
          handleTileClick(move.tileToPick, move.explanation);
        } else {
          setIsBotActive(false);
        }
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isBotActive, mode, gameState, botSpeed, playTiles, container, botPersona, simulationPayload, boosterInventory, slotExpandUsed, bossBattle, sweetDelivery]);

  // Bot Revive Check
  useEffect(() => {
    if (!isBotActive || mode !== 'play' || gameState !== 'lost' || hasRevivedThisRun) return;

    let reviveChance = 0.4; // casual
    if (botPersona === 'veteran') reviveChance = 0.8;
    if (botPersona === 'hardcore') reviveChance = 1.0;

    const timer = setTimeout(() => {
      if (Math.random() < reviveChance) {
        handleRevive();
      } else {
        setIsBotActive(false);
        console.log(`🤖 Bot (${botPersona}) decided to give up instead of reviving.`);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isBotActive, mode, gameState, botPersona, hasRevivedThisRun]);

  // Board Timer Countdown
  useEffect(() => {
    if (mode !== 'play' || gameState !== 'playing' || !boardTimer.enabled || !hasPickedFirstTile) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, gameState, boardTimer.enabled]);

  const handleUndo = () => {
    if (mode !== 'play' || gameState !== 'playing') return;
    if (boosterInventory.undo <= 0) return;
    if (container.length === 0) return;

    const lastTile = container[container.length - 1];

    setPlayTiles([...playTiles, lastTile]);
    setContainer(container.slice(0, -1));
    setBoosterInventory({ ...boosterInventory, undo: boosterInventory.undo - 1 });
  };

  const handleMagnet = () => {
    if (mode !== 'play' || gameState !== 'playing') return;
    if (boosterInventory.magnet <= 0) return;

    const result = findMagnetTargets(playTiles, container);
    if (!result || result.tilesToPull.length === 0) {
      alert('Không có tile nào trên board để Magnet pull.');
      return;
    }

    let workingBoard = [...playTiles];
    let workingContainer = [...container];

    result.tilesToPull.forEach(tileToPull => {
      workingBoard = workingBoard.filter(t => t.id !== tileToPull.id);

      const matchIndex = findLastIndex(workingContainer, (t: Tile) =>
        t.baseIcon === tileToPull.baseIcon && t.color === tileToPull.color
      );
      if (matchIndex !== -1) {
        workingContainer.splice(matchIndex + 1, 0, tileToPull);
      } else {
        workingContainer.push(tileToPull);
      }
    });

    let anyMatchOccurred = false;
    let loopGuard = 0;
    while (loopGuard++ < 10) {
      let foundMatch = false;
      for (let i = 0; i <= workingContainer.length - 3; i++) {
        if (
          workingContainer[i].baseIcon === workingContainer[i + 1].baseIcon &&
          workingContainer[i].baseIcon === workingContainer[i + 2].baseIcon &&
          workingContainer[i].color === workingContainer[i + 1].color &&
          workingContainer[i].color === workingContainer[i + 2].color
        ) {
          workingContainer.splice(i, 3);
          anyMatchOccurred = true;
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) break;
    }

    setPlayTiles(workingBoard);
    setContainer(workingContainer);
    setBoosterInventory({ ...boosterInventory, magnet: boosterInventory.magnet - 1 });

    const remainingTiles = workingBoard.filter(t => !t.isGift);
    const remainingGifts = workingBoard.filter(t => t.isGift);
    const totalGiftsInLevel = playTiles.filter(t => t.isGift).length;
    const allGiftsRevealed = totalGiftsInLevel > 0 && remainingGifts.length === 0;
    const trayMax = 7 + slotExpandUsed;

    if (workingContainer.length >= trayMax) {
      setGameState('lost');
    } else if (totalGiftsInLevel > 0) {
      if (allGiftsRevealed) setGameState('won');
    } else {
      if (remainingTiles.length === 0) setGameState('won');
    }
  };

  const handleSwap = () => {
    if (mode !== 'play' || gameState !== 'playing') return;
    if (boosterInventory.swap <= 0) return;

    const currentMatches = countInitialMatches(playTiles);
    const targetMatches = Math.max(1, currentMatches - 2);

    const newBoard = shuffleIcons(playTiles, targetMatches);
    if (!newBoard) return;

    setPlayTiles(newBoard);
    setBoosterInventory({ ...boosterInventory, swap: boosterInventory.swap - 1 });
  };

  const handleSlotExpand = () => {
    if (mode !== 'play' || gameState !== 'playing') return;
    if (boosterInventory.slotExpand <= 0) return;

    setSlotExpandUsed(prev => prev + 1);
    setBoosterInventory(prev => ({ ...prev, slotExpand: prev.slotExpand - 1 }));
  };

  const handleRevive = () => {
    if (mode !== 'play' || gameState !== 'lost' || hasRevivedThisRun) return;

    // Take up to 5 tiles from the container to put back on board
    let workingContainer = [...container];
    const tilesToReturn = workingContainer.splice(-5, 5);

    let placesFound = 0;
    const returnedWithCoords = tilesToReturn.map(rTile => {
      let placed = false;
      // Find empty coordinates on lowest layer
      for (let attempt = 0; attempt < 50; attempt++) {
        const rx = Math.floor(Math.random() * 10) * 2 + 2;
        const ry = Math.floor(Math.random() * 10) * 2 + 2;
        const overlapping = playTiles.some(t => t.z === 0 && isOverlapping(t, { x: rx, y: ry }));
        if (!overlapping) {
          rTile.x = rx;
          rTile.y = ry;
          rTile.z = 0;
          placed = true;
          break;
        }
      }
      if (!placed) {
        rTile.x = 2 + (placesFound * 2);
        rTile.y = 2;
        rTile.z = 0;
      }
      placesFound++;
      return rTile;
    });

    let workingBoard = [...playTiles, ...returnedWithCoords];

    // Trigger board shuffle (shuffle coordinates of all non-gift tiles on board)
    const matchableOnBoard = workingBoard.filter(t => !t.isGift);
    const shuffledBoard = shuffleIcons(matchableOnBoard, countInitialMatches(matchableOnBoard));
    if (shuffledBoard) {
      workingBoard = [...shuffledBoard, ...workingBoard.filter(t => t.isGift)];
    }

    setPlayTiles(workingBoard);
    setContainer(workingContainer);
    setHasRevivedThisRun(true);
    setGameState('playing');
    
    // Reset player HP back to 50% if in boss battle so they can keep playing
    if (bossBattle.enabled) {
      setPlayerHP(50);
    }
    // Also add +30 seconds to board timer if enabled to help them recover
    if (boardTimer.enabled) {
      setTimeLeft(prev => prev + 30);
    }

    // Add log
    const moveItem: MoveLogItem = {
      step: moveLogs.length + 1,
      tileId: `revive-${Date.now()}`,
      x: 0, y: 0, z: 0,
      timestamp: new Date().toLocaleTimeString(),
      personaUsed: isBotActive ? botPersona : 'human',
      actionType: 'booster_swap',
      explanation: `👼 REVIVE USED: Returned ${returnedWithCoords.length} tiles to the board, shuffled, and resumed game!`,
      trayStateAfter: workingContainer.map(t => ({ icon: t.baseIcon, color: t.color })),
      boardTilesRemaining: workingBoard.filter(t => !t.isGift).length,
    };
    setMoveLogs(prev => [...prev, moveItem]);
  };

  const redistributeThemes = () => {
    const matchableTiles = tiles.filter(t => !t.isGift);
    const giftTiles = tiles.filter(t => t.isGift);

    if (matchableTiles.length === 0) return;
    if (matchableTiles.length % 3 !== 0) {
      alert(`Số tile matchable (${matchableTiles.length}) không chia hết cho 3.`);
      return;
    }

    const shuffledTiles = [...matchableTiles].sort(() => Math.random() - 0.5);
    const numTriplets = Math.floor(shuffledTiles.length / 3);

    const rbPrefix = `tg-rb-${Date.now()}`;
    const rebuiltTriplets = shuffledTiles.map((t, idx) => {
      const tripletIdx = Math.floor(idx / 3);
      return {
        ...t,
        tripletGroupId: tripletIdx < numTriplets
          ? `${rbPrefix}-${tripletIdx}`
          : `${rbPrefix}-orphan-${t.id}`,
      };
    });

    const actualTripletCount = new Set(
      rebuiltTriplets.map(t => t.tripletGroupId)
    ).size;

    if (themeIconRegistry && distributionMode === 'icon') {
      if (iconPool.length === 0) {
        alert('Icon Pool rỗng. Thêm ít nhất 1 icon vào pool.');
        return;
      }

      for (const entry of iconPool) {
        const pool = themeIconRegistry[entry.themeId] || [];
        if (!pool.includes(entry.iconId)) {
          alert(
            `Icon ${entry.themeId}#${entry.iconId} không có trong registry. ` +
            `Kiểm tra lại pool.`
          );
          return;
        }
      }

      let plan;
      try {
        plan = buildIconAssignmentPlan(iconPool, actualTripletCount);
      } catch (e: any) {
        alert(`Không thể build plan: ${e.message}`);
        return;
      }

      const { assignment, themeAssignment } = assignIconsFromPool(
        rebuiltTriplets,
        plan
      );

      const themedTiles = rebuiltTriplets.map(t => ({
        ...t,
        assignedIconId: assignment.get(t.id) ?? null,
        themeID: themeAssignment.get(t.id) || t.themeID || 'theme00',
      }));

      setTiles([...themedTiles, ...giftTiles]);
      return;
    }

    const groupIds = [...new Set(rebuiltTriplets.map(t => t.tripletGroupId))];
    let themeQueue: string[];
    if (themeIconRegistry) {
      const registryThemes = Object.keys(themeIconRegistry);
      if (registryThemes.length === 0) {
        alert('Registry rỗng — không thể redistribute.');
        return;
      }
      const pool = groupIds.map(() =>
        registryThemes[Math.floor(Math.random() * registryThemes.length)]
      );
      themeQueue = pool.sort(() => Math.random() - 0.5);
    } else {
      themeQueue = buildThemeQueue(themeWeights, groupIds.length);
    }

    const themeByGroup = new Map<string, string>();
    groupIds.forEach((gid, i) => {
      themeByGroup.set(gid, themeQueue[i] || activeThemes[0]);
    });

    let themedTiles = rebuiltTriplets.map(t => ({
      ...t,
      themeID: themeByGroup.get(t.tripletGroupId!),
    }));

    if (themeIconRegistry) {
      const budget = currentIconBudget;
      const iconAssignment = assignIconsBudgetAware(
        themedTiles,
        themeIconRegistry,
        budget.maxIcons,
        budget.minRepeat
      );
      themedTiles = themedTiles.map(t => ({
        ...t,
        assignedIconId: iconAssignment.get(t.id) ?? null,
      }));
    } else {
      themedTiles = themedTiles.map(t => ({
        ...t,
        assignedIconId: undefined,
      }));
    }

    setTiles([...themedTiles, ...giftTiles]);
  };

  const handleTileClick = (tile: Tile, customExplanation?: string) => {
    if (mode === 'edit') return;
    if (gameState !== 'playing') return;
    if (!isTileFree(tile, playTiles)) return;

    if (!hasPickedFirstTile) {
      setHasPickedFirstTile(true);
    }

    let workingBoard = [...playTiles];
    if (tile.mechanic === 'hidden' && !tile.isRevealed) {
      workingBoard = workingBoard.map(t => t.id === tile.id ? { ...t, isRevealed: true } : t);
      tile = { ...tile, isRevealed: true };
    }

    const groupTiles = tile.mechanic === 'combined' && tile.combineGroupId
      ? workingBoard.filter(t => t.combineGroupId === tile.combineGroupId)
      : [tile];

    workingBoard = workingBoard.filter(t => !groupTiles.some(g => g.id === t.id));
    let workingContainer = [...container];
    let anyMatchOccurred = false;
    let matchedIcon: string | undefined = undefined;
    let matchedEventItemCount = 0;
    let matchedEventItemWithinWindow = 0;

    groupTiles.forEach(gTile => {
      const matchIndex = findLastIndex(workingContainer, (t: Tile) => t.baseIcon === gTile.baseIcon && t.color === gTile.color);
      if (matchIndex !== -1) {
        workingContainer.splice(matchIndex + 1, 0, gTile);
      } else {
        workingContainer.push(gTile);
      }

      for (let i = 0; i <= workingContainer.length - 3; i++) {
        if (
          workingContainer[i].baseIcon === workingContainer[i + 1].baseIcon &&
          workingContainer[i].baseIcon === workingContainer[i + 2].baseIcon &&
          workingContainer[i].color === workingContainer[i + 1].color &&
          workingContainer[i].color === workingContainer[i + 2].color
        ) {
          const matchedTriplet = workingContainer.splice(i, 3);
          anyMatchOccurred = true;
          matchedIcon = matchedTriplet[0].baseIcon;

          matchedTriplet.forEach(mt => {
            if (mt.mechanic === 'eventItem') {
              matchedEventItemCount++;
              if ((mt.movesRemaining ?? 0) > 0) {
                matchedEventItemWithinWindow++;
              }
            }
          });
          break;
        }
      }
    });

    const removedIds = new Set(groupTiles.map(t => t.id));
    workingBoard = workingBoard.map(t => {
      if ((t.mechanic === 'chained1' || t.mechanic === 'chained2') && Array.isArray(t.chainLinks)) {
        const clearedNow = t.chainLinks.filter(id => removedIds.has(id)).length;
        if (clearedNow > 0) return { ...t, chainClearedCount: (t.chainClearedCount || 0) + clearedNow };
      }
      return t;
    });

    let nextBossHP = bossHP;
    let nextCompletedOrders = [...completedOrders];

    if (anyMatchOccurred) {
      // Ice mechanics matching
      workingBoard = workingBoard.map(t => {
        if ((t.mechanic === 'ice2' || t.mechanic === 'ice3') && (t.iceMatchesRemaining || 0) > 0) {
          const isPhysicallyFree = !isTileCoveredByOther(t, workingBoard) && !isChainLocked(t);
          if (isPhysicallyFree) {
            return { ...t, iceMatchesRemaining: t.iceMatchesRemaining! - 1 };
          }
        }
        return t;
      });

      // Board Random: Increment match counter & shuffle if interval reached
      setMatchCountSinceLastShuffle(prev => {
        const nextCount = prev + 1;
        if (boardRandom.enabled && nextCount >= boardRandom.interval) {
          // Shuffle layout and icons of matchable board tiles (preserving z layers)
          const matchableByLayer: Record<number, Tile[]> = {};
          workingBoard.forEach(t => {
            if (!t.isGift) {
              (matchableByLayer[t.z] ||= []).push(t);
            }
          });

          Object.entries(matchableByLayer).forEach(([zStr, layerTiles]) => {
            const coords = layerTiles.map(t => ({ x: t.x, y: t.y }));
            const iconsColors = layerTiles.map(t => ({
              baseIcon: t.baseIcon,
              color: t.color,
              assignedIconId: t.assignedIconId,
              themeID: t.themeID,
              tripletGroupId: t.tripletGroupId
            }));

            // Shuffle
            coords.sort(() => Math.random() - 0.5);
            iconsColors.sort(() => Math.random() - 0.5);

            layerTiles.forEach((tile, idx) => {
              const coord = coords[idx];
              const ic = iconsColors[idx];
              tile.x = coord.x;
              tile.y = coord.y;
              tile.baseIcon = ic.baseIcon;
              tile.color = ic.color;
              tile.assignedIconId = ic.assignedIconId;
              tile.themeID = ic.themeID;
              tile.tripletGroupId = ic.tripletGroupId;
            });
          });

          return 0; // Reset counter
        }
        return nextCount;
      });

      // BOSS Battle: Deplete Boss HP by 25
      if (bossBattle.enabled) {
        nextBossHP = Math.max(0, bossHP - 25);
        setBossHP(nextBossHP);
      }

      // Sweet Delivery: Track completed orders
      if (sweetDelivery.enabled && matchedIcon && sweetDelivery.orders.includes(matchedIcon)) {
        if (!nextCompletedOrders.includes(matchedIcon)) {
          nextCompletedOrders = [...nextCompletedOrders, matchedIcon];
          setCompletedOrders(nextCompletedOrders);
        }
      }
    }

    workingBoard = workingBoard.map(t => {
      if (t.mechanic === 'eventItem' && t.isEventItemActive && (t.movesRemaining ?? 0) > 0) {
        const newRemaining = (t.movesRemaining || 0) - 1;
        if (newRemaining <= 0) {
          return {
            ...t,
            movesRemaining: 0,
            isEventItemActive: false,
            mechanic: 'normal'
          };
        }
        return { ...t, movesRemaining: newRemaining };
      }
      return t;
    });

    if (matchedEventItemCount > 0) {
      const withinWindowPoints = matchedEventItemWithinWindow * 2;
      const afterWindowPoints = (matchedEventItemCount - matchedEventItemWithinWindow) * 1;
      setEventItemsCollected(prev => prev + withinWindowPoints + afterWindowPoints);
    }
    const giftsInLevel = playTiles.filter(t => t.isGift);

    const stillBlocked = giftsInLevel.filter(g => isGiftBlocked(g, workingBoard));

    const newlyRevealedIds = new Set(
      giftsInLevel
        .filter(g => !stillBlocked.some(b => b.id === g.id))
        .map(g => g.id)
    );

    const revealedCount = giftsInLevel.length - stillBlocked.length;
    if (revealedCount !== giftsRevealed) {
      setGiftsRevealed(revealedCount);
    }

    if (newlyRevealedIds.size > 0) {
      workingBoard = workingBoard.filter(t => !newlyRevealedIds.has(t.id));
    }

    // Determine tray max capacity
    const trayMax = bossBattle.enabled || sweetDelivery.enabled ? (5 + slotExpandUsed) : (7 + slotExpandUsed);
    let bossFullTrayHandling = false;

    if (workingContainer.length >= trayMax) {
      if (bossBattle.enabled) {
        // Full tray in Boss Battle: Return 3 tiles to grid, shuffle board, player loses 25% HP
        bossFullTrayHandling = true;
        const returned = workingContainer.splice(-3, 3);
        
        let placesFound = 0;
        const returnedWithCoords = returned.map(rTile => {
          let placed = false;
          // Find empty coordinates on lowest layer
          for (let attempt = 0; attempt < 50; attempt++) {
            const rx = Math.floor(Math.random() * 10) * 2 + 2;
            const ry = Math.floor(Math.random() * 10) * 2 + 2;
            const overlapping = workingBoard.some(t => t.z === 0 && isOverlapping(t, { x: rx, y: ry }));
            if (!overlapping) {
              rTile.x = rx;
              rTile.y = ry;
              rTile.z = 0;
              placed = true;
              break;
            }
          }
          if (!placed) {
            rTile.x = 2 + (placesFound * 2);
            rTile.y = 2;
            rTile.z = 0;
          }
          placesFound++;
          return rTile;
        });

        workingBoard = [...workingBoard, ...returnedWithCoords];

        // Shuffle board icons
        const matchableOnBoard = workingBoard.filter(t => !t.isGift);
        const shuffledBoard = shuffleIcons(matchableOnBoard, countInitialMatches(matchableOnBoard));
        if (shuffledBoard) {
          workingBoard = [...shuffledBoard, ...workingBoard.filter(t => t.isGift)];
        }

        // Subtract player HP by 25
        setPlayerHP(prev => {
          const next = Math.max(0, prev - 25);
          if (next <= 0) {
            setGameState('lost');
          }
          return next;
        });
      } else {
        setGameState('lost');
      }
    }

    setPlayTiles(workingBoard);
    setContainer(workingContainer);

    // Record move log
    let moveExplanation = customExplanation || `${isBotActive ? botPersona : 'Human'} move: Picked ${tile.baseIcon || 'Tile'} (${tile.color || 'normal'}) at (x:${tile.x}, y:${tile.y}, z:${tile.z}).`;
    if (bossFullTrayHandling) {
      moveExplanation += " ⚠️ Tray full! returned 3 tiles to board, shuffled, and lost 25% Player HP.";
    }
    const moveItem: MoveLogItem = {
      step: moveLogs.length + 1,
      tileId: tile.id,
      x: tile.x,
      y: tile.y,
      z: tile.z,
      icon: tile.baseIcon,
      color: tile.color,
      mechanic: tile.mechanic,
      timestamp: new Date().toLocaleTimeString(),
      personaUsed: isBotActive ? botPersona : 'human',
      actionType: 'tile_click',
      explanation: moveExplanation,
      trayStateAfter: workingContainer.map(t => ({ icon: t.baseIcon, color: t.color })),
      boardTilesRemaining: workingBoard.filter(t => !t.isGift).length,
    };
    setMoveLogs(prev => [...prev, moveItem]);

    const remainingTiles = workingBoard.filter(t => !t.isGift);
    const remainingGifts = workingBoard.filter(t => t.isGift);
    const totalGiftsInLevel = giftsInLevel.length;
    const allGiftsRevealed = totalGiftsInLevel > 0 && remainingGifts.length === 0;

    // Resolve Win/Lose State
    if (gameState === 'playing') {
      if (sweetDelivery.enabled) {
        if (nextCompletedOrders.length >= sweetDelivery.orders.length) {
          setGameState('won');
        } else if (workingContainer.length >= trayMax && !bossBattle.enabled) {
          setGameState('lost');
        }
      } else if (bossBattle.enabled) {
        if (nextBossHP <= 0) {
          setGameState('won');
        } else if (playerHP <= 25 && bossFullTrayHandling) { // Player HP drops to 0
          setGameState('lost');
        } else if (workingContainer.length >= trayMax && !bossBattle.enabled) {
          setGameState('lost');
        }
      } else {
        if (workingContainer.length >= trayMax) {
          setGameState('lost');
        } else if (totalGiftsInLevel > 0) {
          if (allGiftsRevealed) setGameState('won');
        } else {
          if (remainingTiles.length === 0) setGameState('won');
        }
      }
    }
  };

  const handleGridClick = (x: number, y: number) => {
    if (mode !== 'edit' || isSuggestModalOpen) return;

    if (clusterSelectionMode) {
      // Find tile at (x, y) - checking highest Z layer first
      const clickedTiles = tiles.filter(t => {
        if (t.isGift) return false;
        return isOverlapping(t, { x, y });
      }).sort((a, b) => b.z - a.z);

      if (clickedTiles.length > 0) {
        handleTileClusterToggle(clickedTiles[0].id);
      }
      return;
    }

    if (giftPlacementMode) {
      const size = GIFT_SIZES[giftPlacementMode];
      if (!size) return;

      const snappedX = Math.floor(x / 2) * 2;
      const snappedY = Math.floor(y / 2) * 2;

      const endX = snappedX + (size.cols - 1) * 2;
      const endY = snappedY + (size.rows - 1) * 2;
      if (endX > 22 || endY > 22) {
        alert(`Gift ${size.name} vượt quá biên. Chọn vị trí khác.`);
        return;
      }

      const giftZ = activeGiftLayer;

      const newGift: Tile = {
        id: `gift-${generateId()}`,
        x: snappedX,
        y: snappedY,
        z: giftZ,
        mechanic: giftPlacementMode,
        giftCols: size.cols,
        giftRows: size.rows,
        isGift: true
      };

      const collides = tiles.some(t => {
        if (!t.isGift) return false;
        if (t.z !== giftZ) return false;
        const tCols = GIFT_SIZES[t.mechanic || 'gift2x2']?.cols || t.giftCols || 2;
        const tRows = GIFT_SIZES[t.mechanic || 'gift2x2']?.rows || t.giftRows || 2;
        const tWidth = (tCols - 1) * 2 + 1;
        const tHeight = (tRows - 1) * 2 + 1;
        const newWidth = (size.cols - 1) * 2 + 1;
        const newHeight = (size.rows - 1) * 2 + 1;
        return !(
          snappedX + newWidth <= t.x ||
          snappedX >= t.x + tWidth ||
          snappedY + newHeight <= t.y ||
          snappedY >= t.y + tHeight
        );
      });

      if (collides) {
        alert('Vị trí này đã có Gift khác trên cùng Gift Layer.');
        return;
      }

      setTiles([...tiles, newGift]);
      return;
    }

    if (selectedTool === 'place') {
      if (selectedMechanic === 'combined') {
        const shapeConfig = COMBINE_SHAPES.find(s => s.id === selectedCombineShapeId) || COMBINE_SHAPES[0];
        if (!shapeConfig) return;

        const exceeds = shapeConfig.offsets.some(off => x + off.dx > 22 || y + off.dy > 22);
        if (exceeds) {
          alert(`Combine cluster (${shapeConfig.name}) exceeds grid boundaries at this position.`);
          return;
        }

        const groupID = `combine-${generateId()}`;
        const newCombineTiles: Tile[] = shapeConfig.offsets.map(off => ({
          id: generateId(),
          x: x + off.dx,
          y: y + off.dy,
          z: activeLayer,
          mechanic: 'combined',
          combineGroupId: groupID,
          themeID: activeThemes[0] || 'theme00',
          tripletGroupId: `tg-manual-${generateId()}`
        }));

        setTiles(prev => [...prev, ...newCombineTiles]);
        return;
      }

      const occupied = tiles.some(t => t.z === activeLayer && isOverlapping(t, { x, y }));
      if (!occupied) {
        let mech = selectedMechanic;
        if (selectedMechanic === 'chained') {
          mech = chainLevel === 2 ? 'chained2' : 'chained1';
        } else if (selectedMechanic === 'ice') {
          mech = iceMatchReq >= 3 ? 'ice3' : 'ice2';
        }

        setTiles([...tiles, {
          id: generateId(),
          x, y, z: activeLayer,
          mechanic: mech,
          chainLevel: selectedMechanic === 'chained' ? chainLevel : undefined,
          iceMatchesRemaining: selectedMechanic === 'ice' ? iceMatchReq : undefined,
          themeID: activeThemes[0],
          tripletGroupId: `tg-manual-${generateId()}`,
          movesRemaining: selectedMechanic === 'eventItem' ? 4 : undefined
        }]);
      }
    } else if (selectedTool === 'erase') {
      const clickedTiles = tiles.filter(t => {
        if (t.isGift) {
          const size = GIFT_SIZES[t.mechanic || 'gift2x1'];
          if (!size) return false;
          const endX = t.x + (size.cols - 1) * 2;
          const endY = t.y + (size.rows - 1) * 2;
          return x >= t.x && x <= endX && y >= t.y && y <= endY;
        }
        return isOverlapping(t, { x, y }) && t.z === activeLayer;
      }).sort((a, b) => b.z - a.z);
      if (clickedTiles.length > 0) {
        setTiles(tiles.filter(t => t.id !== clickedTiles[0].id));
      }
    }
  };

  const buildExportJsonPayload = useMemo(() => {
    const modConfig = difficultyMods[difficultyMod] || difficultyMods.modMedium;

    const rawGifts = tiles.filter(t => t.isGift);
    const rawTiles = tiles.filter(t => !t.isGift);
    const resolvedTiles = resolveSpecialMechanics(rawTiles);

    const allPossibleIcons: Array<{ icon: string; color: string }> = [];
    Object.keys(ICONS).forEach(icon =>
      COLORS.forEach(c => allPossibleIcons.push({ icon, color: c.id }))
    );
    const shuffledVariants = [...allPossibleIcons].sort(() => Math.random() - 0.5);
    const variantPool = shuffledVariants.slice(
      0,
      Math.min(modConfig.variants, shuffledVariants.length)
    );

    const groupBuckets: Record<string, Tile[]> = {};
    resolvedTiles.forEach(tile => {
      const gid = tile.tripletGroupId || `tg-manual-${tile.id}`;
      (groupBuckets[gid] ||= []).push(tile);
    });

    const completeGroups: Tile[][] = [];
    const orphanTiles: Tile[] = [];
    Object.values(groupBuckets).forEach(group => {
      if (group.length === 3) completeGroups.push(group);
      else orphanTiles.push(...group);
    });

    let orphanIdx = 0;
    while (orphanTiles.length - orphanIdx >= 3) {
      completeGroups.push(orphanTiles.slice(orphanIdx, orphanIdx + 3));
      orphanIdx += 3;
    }
    const remainingOrphans = orphanTiles.slice(orphanIdx);
    if (remainingOrphans.length > 0) {
      console.warn(
        `[Export] ${remainingOrphans.length} tile(s) couldn't form a triplet ` +
        `and were assigned singleton icons:`,
        remainingOrphans.map(t => t.id)
      );
    }

    if (themeIconRegistry) {
      resolvedTiles.forEach(tile => {
        tile._assignedIconId = tile.assignedIconId ?? null;
        tile._assignedTheme = tile.themeID || 'theme00';
      });
    } else {
      completeGroups.forEach((group) => {
        const chosenVariant = variantPool[Math.floor(Math.random() * variantPool.length)];
        const groupTheme = group[0].themeID || activeThemes[0];
        group.forEach(tile => {
          tile._assignedIcon = chosenVariant.icon;
          tile._assignedColor = chosenVariant.color;
          tile._assignedTheme = groupTheme;
        });
      });

      remainingOrphans.forEach(tile => {
        const chosenVariant = variantPool[Math.floor(Math.random() * variantPool.length)];
        tile._assignedIcon = chosenVariant.icon;
        tile._assignedColor = chosenVariant.color;
        tile._assignedTheme = tile.themeID || activeThemes[0];
      });
    }

    const serializedTileItems = resolvedTiles.map(tile => {
      const item: any = {
        entity_type: 'tile',
        tile_id: tile.id,
        x: tile.x,
        y: tile.y,
        z: tile.z,
        themeID: tile._assignedTheme || tile.themeID || activeThemes[0],
      };

      if (themeIconRegistry) {
        item.icon = tile._assignedIconId;
        item.color = null;
      } else {
        item.icon = tile._assignedIcon;
        item.color = tile._assignedColor;
      }

      if (tile.mechanic && tile.mechanic !== 'normal') {
        const mechanicData: any = { name: tile.mechanic };

        if (tile.mechanic === 'chained1' || tile.mechanic === 'chained2') {
          mechanicData.chain_level = tile.chainLevel || (tile.mechanic === 'chained2' ? 2 : 1);
          mechanicData.chain_links = tile.chainLinks || [];
        } else if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3') {
          mechanicData.ice_matches_required = tile.mechanic === 'ice3' ? 3 : 2;
        } else if (tile.mechanic === 'combined') {
          mechanicData.combine_group_id = tile.combineGroupId || null;
        } else if (tile.mechanic === 'eventItem') {
          mechanicData.moves_required = 4;
          mechanicData.collect_value_within_window = 2;
          mechanicData.collect_value_after_window = 1;
        }

        item.special_mechanic = mechanicData;
      }

      return item;
    });

    const serializedGiftItems = rawGifts.map(gift => {
      const size = GIFT_SIZES[gift.mechanic || 'gift2x1'] || { cols: 2, rows: 1 };
      return {
        entity_type: 'gift',
        gift_id: gift.id,
        x: gift.x,
        y: gift.y,
        z: gift.z,
        size: { cols: size.cols, rows: size.rows }
      };
    });

    const combined = [...serializedTileItems, ...serializedGiftItems];

    const sortedSerializedItems = combined.sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;

      const aIsSpecial = !!a.special_mechanic;
      const bIsSpecial = !!b.special_mechanic;
      if (aIsSpecial !== bIsSpecial) {
        return aIsSpecial ? 1 : -1;
      }
      return 0;
    });

    const totalTilesCount = serializedTileItems.length;
    const totalGiftsCount = serializedGiftItems.length;
    const totalEventItemsCount = resolvedTiles.filter(t => t.mechanic === 'eventItem').length;
    const maxZ = sortedSerializedItems.length > 0
      ? Math.max(...sortedSerializedItems.map(t => t.z))
      : 0;

    const boosterBand = getBoosterBand(levelNum);
    const boosterCap = BOOSTER_CAPS[boosterBand] || null;
    const boosterMedian = BOOSTER_MEDIANS[boosterBand] || null;

    return {
      level_id: levelNum,
      icon_format: themeIconRegistry ? 'registry' : 'legacy',
      difficulty: {
        difficulty_mod_band: difficultyMod,
        variants_pool_size: modConfig.variants,
        distribution_pattern: distributionPattern,
        icon_color_ratios: iconColorRatio,
        initial_matches_on_start: modConfig.startingMatches,
        multiplier: modConfig.multiplier
      },
      boosters: {
        preset: boosterPreset,
        availability: baseAvailability,
        band: boosterBand,
        economy: boosterCap ? {
          cap: boosterCap,
          median: boosterMedian,
          rewardEasyMedium: { undo: 1 },
          rewardHardPlus: { magnet: 1, swap: 1 }
        } : null
      },
      map_info: {
        total_tiles: totalTilesCount,
        total_gifts: totalGiftsCount,
        total_event_items: totalEventItemsCount,
        max_z_layers: maxZ + 1,
        tiles: sortedSerializedItems
      },
      dev_note: "Generated via TilesBuilderTester Engine. Gifts are separate goal entities on fractional gift layers (0.5, 1.5, ...). Tiles use integer layers. Event Items require 4 matches; award 2 points while active, 1 point after. Boosters follow base + accumulator model."
    };
  }, [tiles, levelNum, difficultyMod, difficultyMods, distributionPattern,
    iconColorRatio, boosterPreset, boosterCustom, themeIconRegistry, currentIconBudget, activeThemes, baseAvailability]);

  const buildBytesPayload = useMemo(() => {
    try {
      return convertToBytes(buildExportJsonPayload);
    } catch (err: any) {
      console.error("Bytes conversion error:", err);
      return {
        bytes_version: BYTES_VERSION,
        tiles: [],
        gifts: [],
        DifficultyNew: "EASY",
        _error: err.message
      };
    }
  }, [buildExportJsonPayload]);

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildExportJsonPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `level_${levelNum}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    const jsonString = JSON.stringify(buildExportJsonPayload, null, 2);
    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('Đã copy toàn bộ JSON Level vào clipboard!');
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textarea);
  };

  const handleDownloadBytes = () => {
    if ((buildBytesPayload as any)._error) {
      alert(`Không thể export .bytes:\n${(buildBytesPayload as any)._error}`);
      return;
    }

    const jsonString = JSON.stringify(buildBytesPayload, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Level${levelNum}.bytes`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyBytes = () => {
    if ((buildBytesPayload as any)._error) {
      alert(`Không thể copy .bytes:\n${(buildBytesPayload as any)._error}`);
      return;
    }

    const jsonString = JSON.stringify(buildBytesPayload, null, 2);
    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert(`Đã copy .bytes (Level ${levelNum}) vào clipboard!\n` +
        `Tiles: ${buildBytesPayload.tiles.length}\n` +
        `Gifts: ${buildBytesPayload.gifts.length}\n` +
        `Difficulty: ${buildBytesPayload.DifficultyNew}`);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textarea);
  };

  const difficultyStats = useMemo(() => {
    const allTiles = mode === 'play' ? playTiles : tiles;
    const activeTiles = allTiles.filter(t => !t.isGift);
    const band = getBoosterBand(levelNum);
    const defaultBaseRelief = calculateBoosterRelief(baseAvailability);
    const defaultBaseMultiplier = calculateBoosterMultiplier(defaultBaseRelief);
    const defaultMedianInventory = BOOSTER_MEDIANS[band] || { undo: 0, magnet: 0, swap: 0, slotExpand: 0 };
    const defaultMedianRelief = calculateBoosterRelief(defaultMedianInventory);
    const defaultMedianMultiplier = calculateBoosterMultiplier(defaultMedianRelief);
    const defaultCapInventory = BOOSTER_CAPS[band] || { undo: 0, magnet: 0, swap: 0, slotExpand: 0 };
    const defaultCapRelief = calculateBoosterRelief(defaultCapInventory);
    const defaultCapMultiplier = calculateBoosterMultiplier(defaultCapRelief);

    const defaultStats = {
      total: 0, staticTotal: 0, coreSubtotal: 0, specialSubtotal: 0,
      breakdown: { tileCount: 0, icons: 0, colors: 0, stackCovers: 0, diagCovers: 0, mechanics: 0, maiPenalty: 0 },
      mai: WEIGHTS.mai.sweetSpot.toFixed(2),
      startingMatchesCount: 0, stackCoversCount: 0, diagCoversCount: 0,
      iconQuantities: {}, colorQuantities: {}, mechanicCounts: {},
      boosterBand: band,
      baseRelief: defaultBaseRelief,
      baseMultiplier: defaultBaseMultiplier,
      baseBoosterScore: 0,
      medianRelief: defaultMedianRelief,
      medianMultiplier: defaultMedianMultiplier,
      medianBoosterScore: 0,
      capRelief: defaultCapRelief,
      capMultiplier: defaultCapMultiplier,
      capBoosterScore: 0,
      baseAvailability,
      medianInventory: defaultMedianInventory,
      capInventory: defaultCapInventory,
      comboTriplets: {},
      iconAggregated: {},
    };

    if (!activeTiles || activeTiles.length === 0) return defaultStats;

    const breakdown = { tileCount: 0, icons: 0, colors: 0, stackCovers: 0, diagCovers: 0, mechanics: 0, maiPenalty: 0 };
    const mechanicCounts: Record<string, number> = {};

    const tCount = activeTiles.length;
    let tWeight = WEIGHTS.tileCount.base;
    if (tCount > 100) tWeight = WEIGHTS.tileCount.highCount;
    else if (levelNum <= 10) tWeight = WEIGHTS.tileCount.earlyLevel;
    breakdown.tileCount = tCount * tWeight;

    const modConfig = difficultyMods[difficultyMod] || difficultyMods.modMedium;

    let patFactor = 1.0;
    if (distributionPattern === 'hybrid') {
      const f1 = DISTRIBUTION_PATTERNS[hybridSub1]?.iconWeightFactor || 1.1;
      const f2 = DISTRIBUTION_PATTERNS[hybridSub2]?.iconWeightFactor || 1.3;
      patFactor = (f1 + f2) / 2;
    } else if (distributionPattern === 'random') {
      patFactor = 1.2;
    } else {
      patFactor = DISTRIBUTION_PATTERNS[distributionPattern]?.iconWeightFactor || 1.1;
    }

    const iconQuantities: Record<string, number> = {};
    const colorQuantities: Record<string, number> = {};
    activeTiles.forEach(t => {
      const iconKey = themeIconRegistry
        ? (t.assignedIconId ?? t._assignedIconId ?? 'unassigned')
        : (t.baseIcon || 'Star');
      const colorKey = t.color || 'red';

      if (t.mechanic !== 'eventItem') {
        iconQuantities[iconKey] = (iconQuantities[iconKey] || 0) + 1;
        colorQuantities[colorKey] = (colorQuantities[colorKey] || 0) + 1;
      }
      if (t.mechanic) {
        mechanicCounts[t.mechanic] = (mechanicCounts[t.mechanic] || 0) + 1;
      }
    });

    const activeIconKeysCount = Object.keys(iconQuantities).length > 0 ? Object.keys(iconQuantities).length : Math.min(modConfig.variants, Object.keys(ICONS).length);
    const activeColorKeysCount = Object.keys(colorQuantities).length > 0 ? Object.keys(colorQuantities).length : Math.max(0, modConfig.variants - Object.keys(ICONS).length);

    breakdown.icons = activeIconKeysCount * WEIGHTS.iconCount.theme * patFactor * (iconColorRatio.themeIconRatio / 100);
    breakdown.colors = activeColorKeysCount * WEIGHTS.iconCount.color * (iconColorRatio.colorIconRatio / 100);

    let stackCoversCount = 0;
    let diagCoversCount = 0;
    activeTiles.forEach(t1 => {
      let isStacked = false;
      let isDiag = false;
      activeTiles.forEach(t2 => {
        const coverType = (t1.x === t2.x && t1.y === t2.y && t2.z > t1.z) ? 'stack' : null;
        if (coverType === 'stack') isStacked = true;
        else if (t2.z > t1.z && Math.abs(t1.x - t2.x) < 2 && Math.abs(t1.y - t2.y) < 2) isDiag = true;
      });
      if (isStacked) stackCoversCount++;
      else if (isDiag) diagCoversCount++;
    });

    breakdown.stackCovers = stackCoversCount * WEIGHTS.layerCount.stack;
    breakdown.diagCovers = diagCoversCount * WEIGHTS.layerCount.diagonal;

    let mechScoreTotal = 0;
    Object.entries(mechanicCounts).forEach(([mechKey, count]) => {
      const perUnitWeight = WEIGHTS.mechanics[mechKey as keyof typeof WEIGHTS.mechanics] || 0;
      mechScoreTotal += count * perUnitWeight;
    });
    breakdown.mechanics = mechScoreTotal;

    const coreSubtotal = breakdown.tileCount + breakdown.icons + breakdown.colors + breakdown.stackCovers + breakdown.diagCovers;
    const specialSubtotal = breakdown.mechanics;
    const staticTotal = coreSubtotal + specialSubtotal;

    const freeTiles = activeTiles.filter(t => isTileFree(t, activeTiles));
    const estimatedFreeVariants = Math.min(freeTiles.length, modConfig.variants);
    let mai = estimatedFreeVariants === 0 ? WEIGHTS.mai.sweetSpot : freeTiles.length / estimatedFreeVariants;

    if (mai < WEIGHTS.mai.sweetSpot) {
      const shortfall = WEIGHTS.mai.sweetSpot - mai;
      if (mai >= WEIGHTS.mai.dangerThreshold) {
        breakdown.maiPenalty = shortfall * WEIGHTS.mai.base;
      } else {
        const dangerShortfall = WEIGHTS.mai.dangerThreshold - mai;
        const baseShortfall = WEIGHTS.mai.sweetSpot - WEIGHTS.mai.dangerThreshold;
        breakdown.maiPenalty = (baseShortfall * WEIGHTS.mai.base) +
          (dangerShortfall * WEIGHTS.mai.base * WEIGHTS.mai.dangerMultiplier);
      }
    }

    const boardSpecialMechs = {
      timerScore: boardTimer.enabled ? 15.0 * (60 / boardTimer.duration) : 0,
      randomScore: boardRandom.enabled ? -(15 - boardRandom.interval) : 0,
      bossScore: bossBattle.enabled ? 25.0 : 0,
      deliveryScore: sweetDelivery.enabled ? 20.0 : 0,
      total: 0
    };
    boardSpecialMechs.total = boardSpecialMechs.timerScore + boardSpecialMechs.randomScore + boardSpecialMechs.bossScore + boardSpecialMechs.deliveryScore;

    const totalRaw = staticTotal + breakdown.maiPenalty + boardSpecialMechs.total;
    let timerModifier = 1.0;
    if (boardTimer.enabled) {
      timerModifier = Math.max(0.7, 60 / boardTimer.duration);
    }
    const staticWithMod = totalRaw * modConfig.multiplier * timerModifier;

    const baseRelief = calculateBoosterRelief(baseAvailability);
    const baseMultiplier = calculateBoosterMultiplier(baseRelief);
    const baseBoosterScore = staticWithMod * baseMultiplier;

    const medianInventory = BOOSTER_MEDIANS[band] || { undo: 0, magnet: 0, swap: 0, slotExpand: 0 };
    const medianRelief = calculateBoosterRelief(medianInventory);
    const medianMultiplier = calculateBoosterMultiplier(medianRelief);
    const medianBoosterScore = staticWithMod * medianMultiplier;

    const capInventory = BOOSTER_CAPS[band] || { undo: 0, magnet: 0, swap: 0, slotExpand: 0 };
    const capRelief = calculateBoosterRelief(capInventory);
    const capMultiplier = calculateBoosterMultiplier(capRelief);
    const capBoosterScore = staticWithMod * capMultiplier;

    const finalScore = staticWithMod;

    const comboTriplets: Record<string, { themeId: string; iconId: number; tiles: number; triplets: number; remainder: number }> = {};

    if (themeIconRegistry) {
      activeTiles.forEach(t => {
        if (t.mechanic === 'eventItem') return;
        const themeId = t.themeID || 'theme00';
        const iconId = t.assignedIconId ?? t._assignedIconId;
        if (iconId === undefined || iconId === null) return;

        const key = `${themeId}_${iconId}`;
        if (!comboTriplets[key]) {
          comboTriplets[key] = { themeId, iconId, tiles: 0, triplets: 0, remainder: 0 };
        }
        comboTriplets[key].tiles += 1;
      });

      Object.values(comboTriplets).forEach(c => {
        c.triplets = Math.floor(c.tiles / 3);
        c.remainder = c.tiles % 3;
      });
    }

    const iconAggregated: Record<string, { iconId: number; tiles: number; triplets: number; remainder: number; themes: string[] }> = {};
    Object.values(comboTriplets).forEach(c => {
      const key = String(c.iconId);
      if (!iconAggregated[key]) {
        iconAggregated[key] = {
          iconId: c.iconId,
          tiles: 0,
          triplets: 0,
          remainder: 0,
          themes: [],
        };
      }
      iconAggregated[key].tiles += c.tiles;
      iconAggregated[key].triplets += c.triplets;
      iconAggregated[key].themes.push(c.themeId);
    });

    Object.values(iconAggregated).forEach(a => {
      a.remainder = a.tiles % 3;
    });

    return {
      total: finalScore,
      staticTotal, coreSubtotal, specialSubtotal, breakdown,
      mai: mai.toFixed(2),
      startingMatchesCount: modConfig.startingMatches,
      stackCoversCount, diagCoversCount,
      iconQuantities, colorQuantities, mechanicCounts,
      boosterBand: band,
      baseRelief,
      baseMultiplier,
      baseBoosterScore,
      medianRelief,
      medianMultiplier,
      medianBoosterScore,
      capRelief,
      capMultiplier,
      capBoosterScore,
      baseAvailability,
      medianInventory,
      capInventory,
      comboTriplets,
      iconAggregated,
      boardSpecialMechanics: boardSpecialMechs,
    };
  }, [tiles, playTiles, mode, levelNum, difficultyMod, difficultyMods,
    distributionPattern, hybridSub1, hybridSub2, iconColorRatio,
    baseAvailability, themeIconRegistry]);

  const validateImportJson = (jsonString: string) => {
    const errors: string[] = [];
    let parsed: any = null;

    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return { valid: false, errors: [`Invalid JSON syntax: ${e.message}`], data: null };
    }

    let isRegistryFormat = false;
    let formatSource = 'default';

    if (parsed.icon_format === 'registry') {
      isRegistryFormat = true;
      formatSource = 'flag';
    } else if (parsed.icon_format === 'legacy') {
      isRegistryFormat = false;
      formatSource = 'flag';
    } else if (parsed.map_info?.tiles) {
      const firstTile = parsed.map_info.tiles.find(
        (t: any) => t.entity_type !== 'gift'
      );
      if (firstTile && typeof firstTile.icon === 'number') {
        isRegistryFormat = true;
        formatSource = 'auto-detect';
      } else {
        isRegistryFormat = false;
        formatSource = 'auto-detect';
      }
    }

    if (!parsed.map_info || !Array.isArray(parsed.map_info.tiles)) {
      errors.push('Missing or invalid "map_info.tiles" array');
      return { valid: false, errors, data: null };
    }

    const rawEntries = parsed.map_info.tiles;
    if (rawEntries.length === 0) {
      errors.push('Tile array is empty');
      return { valid: false, errors, data: null };
    }

    const rawGiftEntries = rawEntries.filter((e: any) => e.entity_type === 'gift');
    const rawTileEntries = rawEntries.filter((e: any) => e.entity_type !== 'gift');

    if (rawTileEntries.length % 3 !== 0) {
      errors.push(`Tile count (${rawTileEntries.length}) must be divisible by 3 (gifts excluded — found ${rawGiftEntries.length} gifts)`);
    }

    const validMechanics = ['chained1', 'chained2', 'ice2', 'ice3', 'combined', 'hidden', 'eventItem'];
    const validatedTiles: any[] = [];
    const validatedGifts: any[] = [];
    const tileIdMap = new Map<string, any>();

    rawEntries.forEach((t: any, idx: number) => {
      if (t.entity_type === 'gift') {
        const prefix = `Gift[${idx}] (id=${t.gift_id ?? 'missing'})`;

        if (typeof t.gift_id === 'undefined') errors.push(`${prefix}: missing gift_id`);
        if (typeof t.x !== 'number' || t.x < 0 || t.x > 22) errors.push(`${prefix}: invalid x (${t.x})`);
        if (typeof t.y !== 'number' || t.y < 0 || t.y > 22) errors.push(`${prefix}: invalid y (${t.y})`);
        if (typeof t.z !== 'number' || t.z < 0 || t.z > 5) errors.push(`${prefix}: invalid z (${t.z})`);

        if (typeof t.z === 'number' && t.z % 1 !== 0.5) {
          errors.push(`${prefix}: gift z must be a fractional layer (X.5), got ${t.z}`);
        }

        if (!t.size || typeof t.size.cols !== 'number' || typeof t.size.rows !== 'number') {
          errors.push(`${prefix}: missing or invalid size { cols, rows }`);
        } else {
          const { cols, rows } = t.size;
          const validSizes = [
            { cols: 2, rows: 1 },
            { cols: 2, rows: 2 },
            { cols: 2, rows: 3 }
          ];
          const matchesValidSize = validSizes.some(s => s.cols === cols && s.rows === rows);
          if (!matchesValidSize) {
            errors.push(`${prefix}: unsupported gift size ${cols}×${rows} (must be 2×1, 2×2, or 2×3)`);
          }
        }

        validatedGifts.push({
          entity_type: 'gift',
          gift_id: t.gift_id,
          x: t.x,
          y: t.y,
          z: t.z,
          size: t.size
        });
        return;
      }

      const prefix = `Tile[${idx}] (id=${t.tile_id ?? 'missing'})`;

      if (typeof t.tile_id === 'undefined') errors.push(`${prefix}: missing tile_id`);
      if (typeof t.x !== 'number' || t.x < 0 || t.x > 22) errors.push(`${prefix}: invalid x (${t.x})`);
      if (typeof t.y !== 'number' || t.y < 0 || t.y > 22) errors.push(`${prefix}: invalid y (${t.y})`);
      if (typeof t.z !== 'number' || t.z < 0 || t.z > 5) errors.push(`${prefix}: invalid z (${t.z})`);

      if (typeof t.z === 'number' && t.z % 1 !== 0) {
        errors.push(`${prefix}: tile z must be an integer, got ${t.z}`);
      }

      if (isRegistryFormat) {
        if (t.icon !== undefined && t.icon !== null) {
          const valid = typeof t.icon === 'number' && Number.isInteger(t.icon) && t.icon > 0;
          if (!valid) {
            errors.push(`${prefix}: registry format requires icon as positive integer, got ${t.icon}`);
          }
        }
        if (t.color !== undefined && t.color !== null) {
          errors.push(`${prefix}: registry format requires color=null, got ${t.color}`);
        }
      } else {
        if (t.icon !== undefined && t.icon !== null) {
          const iconIsString = typeof t.icon === 'string';
          const iconIsNumber = typeof t.icon === 'number' && Number.isInteger(t.icon) && t.icon > 0;
          if (!iconIsString && !iconIsNumber) {
            errors.push(`${prefix}: icon must be string (legacy) or positive integer (registry), got ${typeof t.icon}`);
          }
        }
        if (t.color !== undefined && t.color !== null) {
          if (typeof t.color !== 'string') {
            errors.push(`${prefix}: color must be string or null, got ${typeof t.color}`);
          }
        }
      }

      let mechanic = 'normal';
      let mechanicData = null;

      if (t.special_mechanic) {
        if (!t.special_mechanic.name) {
          errors.push(`${prefix}: special_mechanic missing "name"`);
        } else if (!validMechanics.includes(t.special_mechanic.name)) {
          errors.push(`${prefix}: unknown mechanic "${t.special_mechanic.name}"`);
        } else {
          mechanic = t.special_mechanic.name;
          mechanicData = t.special_mechanic;

          if (mechanic === 'chained1' || mechanic === 'chained2') {
            if (!Array.isArray(mechanicData.chain_links) || mechanicData.chain_links.length === 0) {
              errors.push(`${prefix}: chained tile requires "chain_links" array`);
            }
          }
          if (mechanic === 'combined' && !mechanicData.combine_group_id) {
            errors.push(`${prefix}: combined tile requires "combine_group_id"`);
          }
          if (mechanic === 'eventItem') {
            const movesReq = mechanicData.moves_required ?? mechanicData.matches_required;
            if (typeof movesReq !== 'number' || movesReq < 1) {
              errors.push(`${prefix}: eventItem requires "moves_required" (number ≥ 1)`);
            }
          }
        }
      }

      tileIdMap.set(t.tile_id, { ...t, mechanic, mechanicData });
      validatedTiles.push({ ...t, mechanic, mechanicData });
    });

    validatedTiles.forEach(t => {
      if ((t.mechanic === 'chained1' || t.mechanic === 'chained2') && t.mechanicData?.chain_links) {
        t.mechanicData.chain_links.forEach((linkId: string) => {
          if (!tileIdMap.has(linkId)) {
            errors.push(`Tile[${t.tile_id}]: chain link references missing tile_id "${linkId}"`);
          }
        });
      }
    });

    const eventItemCount = validatedTiles.filter(t => t.mechanic === 'eventItem').length;
    if (eventItemCount !== 0 && eventItemCount !== 3) {
      errors.push(`eventItem Leaf tiles must be exactly 0 or 3 (found ${eventItemCount})`);
    }

    if (errors.length > 0) {
      return { valid: false, errors, data: null };
    }

    return {
      valid: true,
      errors: [],
      data: {
        parsed,
        tiles: validatedTiles,
        gifts: validatedGifts,
        isRegistryFormat,
        formatSource,
      }
    };
  };

  const validateThemeRegistryJson = (jsonString: string) => {
    const errors: string[] = [];
    let parsed: any = null;

    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return { valid: false, errors: [`Invalid JSON syntax: ${e.message}`], data: null };
    }

    if (!Array.isArray(parsed)) {
      return { valid: false, errors: ['Root must be an array'], data: null };
    }

    if (parsed.length === 0) {
      return { valid: false, errors: ['Array is empty'], data: null };
    }

    const registry: Record<string, number[]> = {};
    const seenThemes = new Set<string>();

    parsed.forEach((entry: any, idx: number) => {
      const prefix = `Entry[${idx}]`;

      if (!entry || typeof entry !== 'object') {
        errors.push(`${prefix}: not an object`);
        return;
      }

      if (typeof entry.themeID !== 'string' || entry.themeID.trim() === '') {
        errors.push(`${prefix}: missing or invalid themeID (must be non-empty string)`);
        return;
      }

      if (seenThemes.has(entry.themeID)) {
        errors.push(`${prefix}: duplicate themeID "${entry.themeID}"`);
        return;
      }
      seenThemes.add(entry.themeID);

      if (!Array.isArray(entry.themeIcons)) {
        errors.push(`${prefix} (${entry.themeID}): themeIcons must be an array`);
        return;
      }

      if (entry.themeIcons.length < 3) {
        errors.push(`${prefix} (${entry.themeID}): need at least 3 icons, got ${entry.themeIcons.length}`);
        return;
      }

      const validIcons: number[] = [];
      entry.themeIcons.forEach((iconId: any, iIdx: number) => {
        if (typeof iconId !== 'number' || !Number.isInteger(iconId) || iconId <= 0) {
          errors.push(`${prefix} (${entry.themeID}) icon[${iIdx}]: must be a positive integer, got ${iconId}`);
          return;
        }
        validIcons.push(iconId);
      });

      if (validIcons.length !== entry.themeIcons.length) {
        return;
      }

      registry[entry.themeID] = validIcons;
    });

    if (errors.length > 0) {
      return { valid: false, errors, data: null };
    }

    return { valid: true, errors: [], data: registry };
  };

  const convertImportedToInternalFormat = (validatedTiles: any[], validatedGifts: any[] = [], isRegistryFormat = false) => {
    const allPossible: Array<{ i: string; c: string }> = [];
    Object.keys(ICONS).forEach(icon =>
      COLORS.forEach(c => allPossible.push({ i: icon, c: c.id }))
    );

    const convertedTiles = validatedTiles.map((t, idx) => {
      const placeholder = allPossible[idx % allPossible.length];
      const hasRegistryIcon = typeof t.icon === 'number' && Number.isInteger(t.icon);

      const base: Tile = {
        id: t.tile_id || `import-${idx}`,
        x: t.x,
        y: t.y,
        z: t.z,
        mechanic: t.mechanic,
        themeID: t.themeID || 'theme00',
      };

      if (hasRegistryIcon) {
        base.assignedIconId = t.icon;
        base.baseIcon = placeholder.i;
        base.color = placeholder.c;
      } else {
        base.baseIcon = typeof t.icon === 'string' ? t.icon : placeholder.i;
        base.color = typeof t.color === 'string' ? t.color : placeholder.c;
        base.assignedIconId = undefined;
      }

      if (t.mechanic === 'chained1' || t.mechanic === 'chained2') {
        base.chainLinks = t.mechanicData.chain_links || [];
        base.chainLevel = t.mechanicData.chain_level || (t.mechanic === 'chained2' ? 2 : 1);
        base.chainClearedCount = 0;
      }
      if (t.mechanic === 'ice2' || t.mechanic === 'ice3') {
        base.iceMatchesRemaining = t.mechanicData.ice_matches_required || (t.mechanic === 'ice3' ? 3 : 2);
      }
      if (t.mechanic === 'combined') {
        base.combineGroupId = t.mechanicData.combine_group_id;
      }
      if (t.mechanic === 'eventItem') {
        base.movesRemaining = t.mechanicData.moves_required ?? 4;
      }
      if (t.mechanic === 'hidden') {
        base.isRevealed = false;
      }

      return base;
    });

    const convertedGifts: Tile[] = validatedGifts.map(g => {
      let mechanic = 'gift2x1';
      if (g.size.cols === 2 && g.size.rows === 2) mechanic = 'gift2x2';
      if (g.size.cols === 2 && g.size.rows === 3) mechanic = 'gift2x3';
      if (g.size.cols === 2 && g.size.rows === 1) mechanic = 'gift2x1';

      return {
        id: g.gift_id || `import-gift-${generateId()}`,
        x: g.x, y: g.y, z: g.z,
        mechanic,
        giftCols: g.size.cols,
        giftRows: g.size.rows,
        isGift: true
      };
    });

    const shuffled = [...convertedTiles].sort(() => Math.random() - 0.5);
    const completeTriplets = Math.floor(shuffled.length / 3);
    shuffled.forEach((tile, idx) => {
      const tripletIdx = Math.floor(idx / 3);
      tile.tripletGroupId = tripletIdx < completeTriplets
        ? `tg-import-${tripletIdx}`
        : `tg-import-orphan-${tile.id}`;
    });

    return {
      tiles: [...convertedTiles, ...convertedGifts],
      isRegistryMode: isRegistryFormat,
    };
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportJsonText(text);
      const result = validateImportJson(text);
      if (result.valid) {
        setImportError(null);
        setImportPreview(result.data);
      } else {
        setImportError(result.errors);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = (text: string) => {
    setImportJsonText(text);
    if (!text.trim()) {
      setImportError(null);
      setImportPreview(null);
      return;
    }
    const result = validateImportJson(text);
    if (result.valid) {
      setImportError(null);
      setImportPreview(result.data);
    } else {
      setImportError(result.errors);
      setImportPreview(null);
    }
  };

  const handleExecuteImport = () => {
    if (!importPreview) return;

    const isRegistryFormat = importPreview.isRegistryFormat || false;

    const { tiles: internalTiles } = convertImportedToInternalFormat(
      importPreview.tiles,
      importPreview.gifts || [],
      isRegistryFormat
    );

    const warnings: ImportWarning[] = [];

    if (isRegistryFormat && !themeIconRegistry) {
      warnings.push({
        type: 'no-registry',
        title: '⚠️ Tool chưa import Theme Registry',
        detail: `File dùng registry icon IDs. Tile sẽ hiển thị placeholder cho đến khi bạn import registry.\nMở Theme Weights → Import Theme.`,
      });
    }

    if (isRegistryFormat && themeIconRegistry) {
      const missingIcons = new Set<string>();
      internalTiles.forEach(t => {
        if (t.isGift) return;
        if (t.assignedIconId == null) return;
        const themeId = t.themeID || 'theme00';
        const pool = themeIconRegistry[themeId] || [];
        if (!pool.includes(t.assignedIconId)) {
          missingIcons.add(`${themeId}#${t.assignedIconId}`);
        }
      });
      if (missingIcons.size > 0) {
        warnings.push({
          type: 'missing-icons',
          title: `⚠️ ${missingIcons.size} icon ID không có trong registry`,
          detail: [...missingIcons].slice(0, 5).join('\n') +
            (missingIcons.size > 5 ? `\n... và ${missingIcons.size - 5} nữa` : ''),
        });
      }
    }

    const performLoad = () => {
      if (importPreview.parsed.level_id) {
        setLevelNum(importPreview.parsed.level_id);
      }
      if (importPreview.parsed.difficulty?.difficulty_mod_band) {
        const modKey = importPreview.parsed.difficulty.difficulty_mod_band;
        if (difficultyMods[modKey]) {
          setDifficultyMod(modKey);
        }
      }

      setTiles(internalTiles);
      setIsImportModalOpen(false);
      setImportJsonText('');
      setImportError(null);
      setImportPreview(null);
      setImportConfirm(null);
    };

    if (warnings.length > 0) {
      setImportConfirm({ warnings, onConfirm: performLoad });
    } else {
      performLoad();
    }
  };

  const handleThemeImportText = (text: string) => {
    setThemeImportText(text);
    if (!text.trim()) {
      setThemeImportError(null);
      setThemeImportPreview(null);
      return;
    }
    const result = validateThemeRegistryJson(text);
    if (result.valid) {
      setThemeImportError(null);
      setThemeImportPreview(result.data);
    } else {
      setThemeImportError(result.errors);
      setThemeImportPreview(null);
    }
  };

  const handleThemeImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => handleThemeImportText(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleExecuteThemeImport = () => {
    if (!themeImportPreview) return;
    setThemeIconRegistry(themeImportPreview);
    setIsThemeImportModalOpen(false);
    setThemeImportText('');
    setThemeImportError(null);
    setThemeImportPreview(null);
  };

  const handleClearThemeRegistry = () => {
    setThemeIconRegistry(null);
  };

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          activeLicense={activeLicense}
          onLaunchTool={() => setCurrentView('studio')}
          onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
          onOpenActivate={() => setIsKeyActivationModalOpen(true)}
        />

        <SubscribeModal
          isOpen={isSubscribeModalOpen}
          onClose={() => setIsSubscribeModalOpen(false)}
          onActivateSuccess={(license) => {
            setActiveLicense(license);
            setCurrentView('studio');
          }}
        />

        <KeyActivationModal
          isOpen={isKeyActivationModalOpen}
          onClose={() => setIsKeyActivationModalOpen(false)}
          activeLicense={activeLicense}
          onActivateSuccess={(license) => {
            setActiveLicense(license);
            setIsKeyActivationModalOpen(false);
          }}
          onDeactivate={() => setActiveLicense(null)}
          onOpenSubscribe={() => {
            setIsKeyActivationModalOpen(false);
            setIsSubscribeModalOpen(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col overflow-hidden h-screen">
      <Header
        mode={mode}
        viewportPreset={viewportPreset}
        setViewportPreset={setViewportPreset}
        isPlayable={isPlayable}
        startPlayMode={startPlayMode}
        stopPlayMode={stopPlayMode}
        onOpenImportJson={handleOpenImportJson}
        onOpenExportJson={handleOpenExportJson}
        onOpenExportBytes={handleOpenExportBytes}
        onOpenSimulateSequence={() => setIsSimulateModalOpen(true)}
        showAnalyticsInPlay={showAnalyticsInPlay}
        setShowAnalyticsInPlay={setShowAnalyticsInPlay}
        isLeftSidebarOpen={isLeftSidebarOpen}
        setIsLeftSidebarOpen={setIsLeftSidebarOpen}
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
        container={container}
        slotExpandUsed={slotExpandUsed}
        sweetDeliveryEnabled={sweetDelivery.enabled}
        bossBattleEnabled={bossBattle.enabled}
        tiles={tiles}
        giftsRevealed={giftsRevealed}
        eventItemsCollected={eventItemsCollected}
        activeLicense={activeLicense}
        onOpenLanding={() => setCurrentView('landing')}
        onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
        onOpenActivate={() => setIsKeyActivationModalOpen(true)}
        onUndoEdit={handleEditUndo}
        onRedoEdit={handleEditRedo}
        canUndoEdit={canUndoEdit}
        canRedoEdit={canRedoEdit}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden relative">
          <BuilderSidebar
            mode={mode}
            isOpenMobile={isLeftSidebarOpen}
            onCloseMobile={() => setIsLeftSidebarOpen(false)}
            levelNum={levelNum}
            setLevelNum={setLevelNum}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            giftPlacementMode={giftPlacementMode}
            setGiftPlacementMode={setGiftPlacementMode}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            activeGiftLayer={activeGiftLayer}
            setActiveGiftLayer={setActiveGiftLayer}
            layerViewMode={layerViewMode}
            setLayerViewMode={setLayerViewMode}
            difficultyMod={difficultyMod}
            setDifficultyMod={setDifficultyMod}
            difficultyMods={difficultyMods}
            setDifficultyMods={setDifficultyMods}
            isModEditorOpen={isModEditorOpen}
            setIsModEditorOpen={setIsModEditorOpen}
            distributionPattern={distributionPattern}
            setDistributionPattern={setDistributionPattern}
            hybridSub1={hybridSub1}
            setHybridSub1={setHybridSub1}
            hybridSub2={hybridSub2}
            setHybridSub2={setHybridSub2}
            iconColorRatio={iconColorRatio}
            setIconColorRatio={setIconColorRatio}
            themeWeights={themeWeights}
            setThemeWeights={setThemeWeights}
            activeThemes={activeThemes}
            themeIconRegistry={themeIconRegistry}
            distributionMode={distributionMode}
            setDistributionMode={setDistributionMode}
            iconPool={iconPool}
            setIconPool={setIconPool}
            iconBudgetOverride={iconBudgetOverride}
            setIconBudgetOverride={setIconBudgetOverride}
            currentIconBudget={currentIconBudget}
            showOnlyUnbalanced={showOnlyUnbalanced}
            setShowOnlyUnbalanced={setShowOnlyUnbalanced}
            selectedMechanic={selectedMechanic}
            setSelectedMechanic={setSelectedMechanic}
            selectedCombineShapeId={selectedCombineShapeId}
            setSelectedCombineShapeId={setSelectedCombineShapeId}
            combineTileCountFilter={combineTileCountFilter}
            setCombineTileCountFilter={setCombineTileCountFilter}
            chainLevel={chainLevel}
            setChainLevel={setChainLevel}
            iceMatchReq={iceMatchReq}
            setIceMatchReq={setIceMatchReq}
            boardMorphism={boardMorphism}
            setBoardMorphism={setBoardMorphism}
            tileSpectrums={tileSpectrums}
            setTileSpectrums={setTileSpectrums}
            boardTimer={boardTimer}
            setBoardTimer={setBoardTimer}
            boardRandom={boardRandom}
            setBoardRandom={setBoardRandom}
            bossBattle={bossBattle}
            setBossBattle={setBossBattle}
            sweetDelivery={sweetDelivery}
            setSweetDelivery={setSweetDelivery}
            boosterPreset={boosterPreset}
            setBoosterPreset={setBoosterPreset}
            boosterCustom={boosterCustom}
            setBoosterCustom={setBoosterCustom}
            baseAvailability={baseAvailability}
            tiles={tiles}
            playTiles={playTiles}
            setTiles={setTiles}
            generateRandomLayout={generateRandomLayout}
            setIsSuggestModalOpen={setIsSuggestModalOpen}
            setIsThemeImportModalOpen={setIsThemeImportModalOpen}
            handleClearThemeRegistry={handleClearThemeRegistry}
            redistributeThemes={redistributeThemes}
            difficultyStats={difficultyStats}
            clusters={clusters}
            setClusters={setClusters}
            clusterSelectionMode={clusterSelectionMode}
            setClusterSelectionMode={setClusterSelectionMode}
            clusterPlacementMode={clusterPlacementMode}
            setClusterPlacementMode={setClusterPlacementMode}
            highlightedClusterId={highlightedClusterId}
            setHighlightedClusterId={setHighlightedClusterId}
            activeLicense={activeLicense}
            onRequirePro={triggerProLock}
            onUndoEdit={handleEditUndo}
            onRedoEdit={handleEditRedo}
            canUndoEdit={canUndoEdit}
            canRedoEdit={canRedoEdit}
          />

          <BoardCanvas
            mode={mode}
            gameState={gameState}
            tiles={tiles}
            playTiles={playTiles}
            boardScale={boardScale}
            stackDepthMap={stackDepthMap}
            layerViewMode={layerViewMode}
            activeLayer={activeLayer}
            activeGiftLayer={activeGiftLayer}
            giftPlacementMode={giftPlacementMode}
            selectedTool={selectedTool}
            activeThemes={activeThemes}
            container={container}
            boosterInventory={boosterInventory}
            slotExpandUsed={slotExpandUsed}
            handleGridClick={handleGridClick}
            handleTileClick={handleTileClick}
            stopPlayMode={stopPlayMode}
            handleUndo={handleUndo}
            handleMagnet={handleMagnet}
            handleSwap={handleSwap}
            handleSlotExpand={handleSlotExpand}
            setTiles={setTiles}
            setActiveLayer={setActiveLayer}
            setActiveGiftLayer={setActiveGiftLayer}
            clusters={clusters}
            setClusters={setClusters}
            clusterSelectionMode={clusterSelectionMode}
            clusterPlacementMode={clusterPlacementMode}
            highlightedClusterId={highlightedClusterId}
            onTileClusterToggle={handleTileClusterToggle}
            onPlaceClusterOnGrid={handlePlaceClusterOnGrid}
            simulationCurrentTileId={simulationPayload?.moves[simCurrentStepIndex]?.tileId || null}
            selectedMechanic={selectedMechanic}
            selectedCombineShapeId={selectedCombineShapeId}
            boardMorphism={boardMorphism}
            tileSpectrums={tileSpectrums}
            boardTimer={boardTimer}
            timeLeft={timeLeft}
            bossBattle={bossBattle}
            bossHP={bossHP}
            playerHP={playerHP}
            sweetDelivery={sweetDelivery}
            completedOrders={completedOrders}
            hasRevivedThisRun={hasRevivedThisRun}
            onRevive={handleRevive}
          />

          <AnalyticsPanel
            mode={mode}
            showAnalyticsInPlay={showAnalyticsInPlay}
            isOpenMobile={isRightPanelOpen}
            onCloseMobile={() => setIsRightPanelOpen(false)}
            difficultyStats={difficultyStats}
            difficultyMod={difficultyMod}
            difficultyMods={difficultyMods}
            playTiles={playTiles}
            tiles={tiles}
            distributionPattern={distributionPattern}
            iconColorRatio={iconColorRatio}
            themeIconRegistry={themeIconRegistry}
            activeLicense={activeLicense}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
          />
        </div>

        {mode === 'play' && (
          <BotPlayerControls
            isBotActive={isBotActive}
            setIsBotActive={setIsBotActive}
            botPersona={botPersona}
            setBotPersona={setBotPersona}
            botSpeed={botSpeed}
            setBotSpeed={setBotSpeed}
            onStepBot={() => {
              const move = getBotNextMove(botPersona, playTiles, container);
              if (move.tileToPick) {
                handleTileClick(move.tileToPick, move.explanation);
              }
            }}
            moveLogs={moveLogs}
            onOpenExportLogs={() => setIsMoveLogModalOpen(true)}
            simulationPayload={simulationPayload}
            simCurrentStepIndex={simCurrentStepIndex}
            setSimCurrentStepIndex={setSimCurrentStepIndex}
            onStopSimulation={() => {
              setSimulationPayload(null);
              setIsBotActive(false);
            }}
            isLifetimePro={isLifetimePro}
            onRequireLifetimePro={() => setIsLifetimeLockModalOpen(true)}
          />
        )}
      </div>

      <SuggestLevelModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        suggestParams={suggestParams}
        setSuggestParams={setSuggestParams}
        executeSuggestLevel={executeSuggestLevel}
      />

      <ExportJsonModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportPayload={buildExportJsonPayload}
        handleCopyJson={handleCopyJson}
        handleDownloadJson={handleDownloadJson}
      />

      <ExportBytesModal
        isOpen={isBytesModalOpen}
        onClose={() => setIsBytesModalOpen(false)}
        bytesPayload={buildBytesPayload}
        levelNum={levelNum}
        handleCopyBytes={handleCopyBytes}
        handleDownloadBytes={handleDownloadBytes}
      />

      <ImportJsonModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importJsonText={importJsonText}
        handleImportText={handleImportText}
        handleImportFile={handleImportFile}
        importError={importError}
        importPreview={importPreview}
        themeIconRegistry={themeIconRegistry}
        handleExecuteImport={handleExecuteImport}
      />

      <ImportConfirmModal
        importConfirm={importConfirm}
        onCancel={() => setImportConfirm(null)}
      />

      <ImportThemeModal
        isOpen={isThemeImportModalOpen}
        onClose={() => setIsThemeImportModalOpen(false)}
        themeImportText={themeImportText}
        handleThemeImportText={handleThemeImportText}
        handleThemeImportFile={handleThemeImportFile}
        themeImportError={themeImportError}
        themeImportPreview={themeImportPreview}
        handleExecuteThemeImport={handleExecuteThemeImport}
      />

      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        onActivateSuccess={(license) => {
          setActiveLicense(license);
          setIsSubscribeModalOpen(false);
        }}
      />

      <KeyActivationModal
        isOpen={isKeyActivationModalOpen}
        onClose={() => setIsKeyActivationModalOpen(false)}
        activeLicense={activeLicense}
        onActivateSuccess={(license) => {
          setActiveLicense(license);
          setIsKeyActivationModalOpen(false);
        }}
        onDeactivate={() => setActiveLicense(null)}
        onOpenSubscribe={() => {
          setIsKeyActivationModalOpen(false);
          setIsSubscribeModalOpen(true);
        }}
      />

      <ProLockModal
        isOpen={proLockState.isOpen}
        onClose={() => setProLockState(prev => ({ ...prev, isOpen: false }))}
        featureName={proLockState.featureName}
        featureDescription={proLockState.featureDescription}
        onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
        onOpenActivate={() => setIsKeyActivationModalOpen(true)}
      />

      <SimulateMoveSequenceModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onStartSimulation={(payload) => {
          setSimulationPayload(payload);
          setSimCurrentStepIndex(0);
          startPlayMode();
        }}
      />

      <MoveLogExportModal
        isOpen={isMoveLogModalOpen}
        onClose={() => setIsMoveLogModalOpen(false)}
        sequencePayload={buildMoveSequencePayload}
      />

      <LifetimeProLockModal
        isOpen={isLifetimeLockModalOpen}
        onClose={() => setIsLifetimeLockModalOpen(false)}
        onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
        onOpenActivate={() => setIsKeyActivationModalOpen(true)}
      />
    </div>
  );
}
