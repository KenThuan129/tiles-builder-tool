import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Gift, Lock, Boxes, Layers, Check, MousePointer, Move, Trash2, Copy,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Sparkles, ChevronUp, ChevronDown, Wand2,
  Gem, Award, Package, Heart, Zap, RotateCw, RotateCcw, RefreshCw, Eye
} from 'lucide-react';
import {
  Tile, BoosterAvailability, TileCluster, BoardMorphismConfig, TileSpectrumEntry, EditorTool,
  BoardTimerConfig, BossBattleConfig, SweetDeliveryConfig, DeliveryOrderItem
} from '../types/game';
import {
  INTRINSIC_BOARD_SIZE, STACK_OFFSET_PX, GIFT_SIZES, GIFT_THEMES, DEFAULT_GIFT_THEME,
  ICONS, COLORS, THEME_DOT_COLORS, COMBINE_SHAPES, CONVERTIBLE_MECHANICS, applyMechanicToTile
} from '../constants/gameConfig';
import {
  isTileFree, isGiftBlocked, isChainLocked, calculateHiddenSafety
} from '../utils/gameHelpers';
import {
  MorphismScope, MorphismTransformType, MorphismSymmetryType,
  transformTileList, generateSymmetricTiles, bakeMorphismToTiles
} from '../utils/morphismHelpers';

interface BoardCanvasProps {
  mode: 'edit' | 'play';
  gameState: 'playing' | 'won' | 'lost';
  tiles: Tile[];
  playTiles: Tile[];
  boardScale: number;
  stackDepthMap: Map<string, number>;
  layerViewMode: 'all' | 'cumulative' | 'isolated';
  activeLayer: number;
  setActiveLayer?: (layer: number) => void;
  activeGiftLayer: number;
  setActiveGiftLayer?: (layer: number) => void;
  giftPlacementMode: string | null;
  activeGiftType?: string;
  selectedTool: EditorTool;
  selectedTileIds?: Set<string>;
  setSelectedTileIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeThemes: string[];
  container: Tile[];
  boosterInventory: BoosterAvailability;
  slotExpandUsed: number;
  handleGridClick: (x: number, y: number) => void;
  handleTileClick: (tile: Tile) => void;
  stopPlayMode: () => void;
  handleUndo: () => void;
  handleMagnet: () => void;
  handleSwap: () => void;
  handleSlotExpand: () => void;
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  selectedMechanic?: string;
  selectedCombineShapeId?: string;
  boardMorphism?: BoardMorphismConfig;
  setBoardMorphism?: React.Dispatch<React.SetStateAction<BoardMorphismConfig>>;
  tileSpectrums?: TileSpectrumEntry[];
  boardTimer?: BoardTimerConfig;
  timeLeft?: number;
  bossBattle?: BossBattleConfig;
  bossHP?: number;
  playerHP?: number;
  sweetDelivery?: SweetDeliveryConfig;
  deliveryOrderItems?: DeliveryOrderItem[];
  completedOrders?: string[];
  bossScrambleMovesCount?: number;
  onBossScramble?: () => void;
  notificationMsg?: string | null;
  hasRevivedThisRun?: boolean;
  onRevive?: () => void;
  onAddTime?: () => void;
  // Clusters
  clusters?: TileCluster[];
  setClusters?: React.Dispatch<React.SetStateAction<TileCluster[]>>;
  clusterSelectionMode?: string | null;
  clusterPlacementMode?: string | null;
  highlightedClusterId?: string | null;
  onTileClusterToggle?: (tileId: string) => void;
  onPlaceClusterOnGrid?: (anchorX: number, anchorY: number, clusterId: string) => void;
  simulationCurrentTileId?: string | null;
}

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  mode,
  gameState,
  tiles,
  playTiles,
  boardScale,
  stackDepthMap,
  layerViewMode,
  activeLayer,
  setActiveLayer,
  activeGiftLayer,
  setActiveGiftLayer,
  giftPlacementMode,
  activeGiftType = 'golden',
  selectedTool,
  selectedTileIds: externalSelectedTileIds,
  setSelectedTileIds: externalSetSelectedTileIds,
  activeThemes,
  container,
  boosterInventory,
  handleGridClick,
  handleTileClick,
  stopPlayMode,
  handleUndo,
  handleMagnet,
  handleSwap,
  handleSlotExpand,
  setTiles,
  selectedMechanic,
  selectedCombineShapeId,
  boardMorphism,
  setBoardMorphism,
  tileSpectrums = [],
  boardTimer,
  timeLeft = 60,
  bossBattle,
  bossHP = 100,
  playerHP = 100,
  sweetDelivery,
  deliveryOrderItems = [],
  completedOrders = [],
  bossScrambleMovesCount = 0,
  onBossScramble,
  notificationMsg: externalNotificationMsg,
  hasRevivedThisRun = false,
  onRevive,
  onAddTime,
  clusters = [],
  setClusters,
  clusterSelectionMode = null,
  clusterPlacementMode = null,
  highlightedClusterId = null,
  onTileClusterToggle,
  onPlaceClusterOnGrid,
  simulationCurrentTileId = null,
}) => {
  const isPlayMode = mode === 'play';
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  // Marquee Selection & Bulk Operations State
  const [internalSelectedTileIds, setInternalSelectedTileIds] = useState<Set<string>>(new Set());
  const selectedTileIds = externalSelectedTileIds ?? internalSelectedTileIds;
  const setSelectedTileIds = externalSetSelectedTileIds ?? setInternalSelectedTileIds;
  const [isMechanicMenuOpen, setIsMechanicMenuOpen] = useState<boolean>(false);
  const [sourceMechFilter, setSourceMechFilter] = useState<string>('all');
  const [isMarqueeActive, setIsMarqueeActive] = useState<boolean>(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingMove, setIsDraggingMove] = useState<boolean>(false);
  const [dragMoveOrigin, setDragMoveOrigin] = useState<{ gx: number; gy: number } | null>(null);
  const [dragMoveDelta, setDragMoveDelta] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [internalNotificationMsg, setInternalNotificationMsg] = useState<string | null>(null);
  const notificationMsg = externalNotificationMsg || internalNotificationMsg;
  const setNotificationMsg = setInternalNotificationMsg;

  // Board Morphism Level Design Toolbar State
  const [canvasMorphismScope, setCanvasMorphismScope] = useState<MorphismScope>('all');

  const targetLayer = giftPlacementMode ? activeGiftLayer : activeLayer;

  const showNotification = useCallback((msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 2500);
  }, []);

  const handleCanvasTransform = (type: MorphismTransformType, overrideScope?: MorphismScope) => {
    const scopeToUse = overrideScope || canvasMorphismScope;
    setTiles(prev => {
      const next = transformTileList(prev, type, scopeToUse, targetLayer, selectedTileIds);
      return next;
    });
    const label = type === 'rotate90cw' ? 'Rotated 90° CW' :
      type === 'rotate90ccw' ? 'Rotated 90° CCW' :
      type === 'rotate180' ? 'Rotated 180°' :
      type === 'flipH' ? 'Flipped Horizontal' : 'Flipped Vertical';
    showNotification(`🌀 ${label} (${scopeToUse === 'all' ? 'All Tiles' : scopeToUse === 'layer' ? `Layer ${targetLayer}` : `${selectedTileIds.size} Selected`})`);
  };

  const handleCanvasSymmetry = (type: MorphismSymmetryType, overrideScope?: MorphismScope) => {
    const scopeToUse = overrideScope || canvasMorphismScope;
    setTiles(prev => {
      const { newTiles, addedCount } = generateSymmetricTiles(prev, type, scopeToUse, targetLayer, selectedTileIds);
      const symLabel = type === 'radial4' ? '4-Way Radial Symmetry' :
        type === 'rotational2' ? '2-Way Rotational Symmetry' :
        type === 'mirrorH' ? 'Horizontal Mirror' : 'Vertical Mirror';
      showNotification(`🌸 Generated ${symLabel} (+${addedCount} cloned tiles)!`);
      return newTiles;
    });
  };

  const getMorphismCoords = (tileX: number, tileY: number, wPx: number, hPx: number) => {
    let x = tileX * 20;
    let y = tileY * 20;
    let w = wPx;
    let h = hPx;

    const shouldApplyMorphism = boardMorphism?.enabled && (isPlayMode || boardMorphism?.previewInEditor);
    if (shouldApplyMorphism) {
      const cx = 240;
      const cy = 240;
      const tileCx = x + w / 2;
      const tileCy = y + h / 2;

      let x0 = tileCx - cx;
      let y0 = tileCy - cy;

      if (boardMorphism.mirroredHorizons) {
        x0 = -x0;
      }

      let x1 = x0;
      let y1 = y0;
      const angle = (boardMorphism.spinAngle || 0) % 360;

      if (angle === 90 || angle === -270) {
        x1 = -y0;
        y1 = x0;
        w = hPx;
        h = wPx;
      } else if (angle === 180 || angle === -180) {
        x1 = -x0;
        y1 = -y0;
      } else if (angle === 270 || angle === -90) {
        x1 = y0;
        y1 = -x0;
        w = hPx;
        h = wPx;
      }

      x = x1 + cx - w / 2;
      y = y1 + cy - h / 2;
    }

    return { x, y, w, h };
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 24);
        setContainerHeight(containerRef.current.clientHeight - (isPlayMode ? 140 : 48));
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isPlayMode]);

  // Compute effective scale to fit both viewport width and height smoothly
  const effectiveScale = useMemo(() => {
    let scale = boardScale;
    const targetPx = INTRINSIC_BOARD_SIZE * boardScale;
    if (containerWidth > 0 && targetPx > containerWidth) {
      scale = Math.min(scale, containerWidth / INTRINSIC_BOARD_SIZE);
    }
    if (containerHeight > 0 && isPlayMode) {
      const targetHeightPx = INTRINSIC_BOARD_SIZE * scale;
      if (targetHeightPx > containerHeight) {
        scale = Math.min(scale, Math.max(0.48, containerHeight / INTRINSIC_BOARD_SIZE));
      }
    }
    return Math.max(0.45, scale);
  }, [boardScale, containerWidth, containerHeight, isPlayMode]);

  // Clean up selection when switching to play mode or if selected tiles are deleted
  useEffect(() => {
    if (isPlayMode) {
      setSelectedTileIds(new Set());
    } else {
      setSelectedTileIds(prev => {
        const existingIds = new Set(tiles.map(t => t.id));
        const filtered = new Set([...prev].filter(id => existingIds.has(id)));
        return filtered.size === prev.size ? prev : filtered;
      });
    }
  }, [isPlayMode, tiles]);

  // Bulk Move
  const handleMoveSelected = useCallback((dx: number, dy: number) => {
    if (selectedTileIds.size === 0 || (dx === 0 && dy === 0)) return;
    const selectedList = tiles.filter(t => selectedTileIds.has(t.id));
    if (selectedList.length === 0) return;

    // Check boundaries (0 to 22 grid range)
    const outOfBounds = selectedList.some(t => {
      const newX = t.x + dx;
      const newY = t.y + dy;
      const w = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.cols || t.giftCols || 2) - 1) * 2 : 0;
      const h = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.rows || t.giftRows || 2) - 1) * 2 : 0;
      return newX < 0 || newX + w > 22 || newY < 0 || newY + h > 22;
    });

    if (outOfBounds) {
      showNotification('⚠️ Move blocked: Tiles reached board edge.');
      return;
    }

    // Check collisions with other non-selected tiles on same layer
    const nonSelectedSameLayer = tiles.filter(t => !selectedTileIds.has(t.id));
    const hasCollision = selectedList.some(t => {
      const newX = t.x + dx;
      const newY = t.y + dy;
      const tW = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.cols || t.giftCols || 2) - 1) * 2 + 1 : 1;
      const tH = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.rows || t.giftRows || 2) - 1) * 2 + 1 : 1;

      return nonSelectedSameLayer.some(other => {
        if (other.z !== t.z) return false;
        const oW = other.isGift ? ((GIFT_SIZES[other.mechanic || 'gift2x2']?.cols || other.giftCols || 2) - 1) * 2 + 1 : 1;
        const oH = other.isGift ? ((GIFT_SIZES[other.mechanic || 'gift2x2']?.rows || other.giftRows || 2) - 1) * 2 + 1 : 1;
        return !(
          newX + tW <= other.x ||
          newX >= other.x + oW ||
          newY + tH <= other.y ||
          newY >= other.y + oH
        );
      });
    });

    if (hasCollision) {
      showNotification('⚠️ Move blocked: Space occupied by other tiles on same layer.');
      return;
    }

    setTiles(prev =>
      prev.map(t => {
        if (selectedTileIds.has(t.id)) {
          return {
            ...t,
            x: t.x + dx,
            y: t.y + dy,
          };
        }
        return t;
      })
    );
  }, [selectedTileIds, tiles, setTiles]);

  // Bulk Layer Shift
  const handleShiftLayer = useCallback((deltaZ: number) => {
    if (selectedTileIds.size === 0) return;
    const selectedList = tiles.filter(t => selectedTileIds.has(t.id));
    if (selectedList.length === 0) return;

    const currentZ = selectedList[0].z;
    const targetZ = giftPlacementMode
      ? Math.max(0.5, Math.min(4.5, currentZ + deltaZ))
      : Math.max(0, Math.min(5, currentZ + deltaZ));

    if (targetZ === currentZ) {
      showNotification(`⚠️ Already at Layer ${targetZ}.`);
      return;
    }

    setTiles(prev =>
      prev.map(t => {
        if (selectedTileIds.has(t.id)) {
          return { ...t, z: targetZ };
        }
        return t;
      })
    );

    if (giftPlacementMode && setActiveGiftLayer) {
      setActiveGiftLayer(targetZ);
    } else if (setActiveLayer) {
      setActiveLayer(targetZ);
    }
    showNotification(`Moved ${selectedTileIds.size} tiles to Layer ${targetZ}.`);
  }, [selectedTileIds, tiles, giftPlacementMode, setActiveGiftLayer, setActiveLayer, setTiles]);

  // Bulk Delete
  const handleDeleteSelected = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    const count = selectedTileIds.size;
    setTiles(prev => prev.filter(t => !selectedTileIds.has(t.id)));
    setSelectedTileIds(new Set());
    showNotification(`Deleted ${count} tiles.`);
  }, [selectedTileIds, setTiles]);

  // Bulk Duplicate
  const handleDuplicateSelected = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    const selectedList = tiles.filter(t => selectedTileIds.has(t.id));
    if (selectedList.length === 0) return;

    const newIds = new Set<string>();
    const duplicated: Tile[] = [];

    selectedList.forEach(t => {
      const newId = `dup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      newIds.add(newId);
      const shiftX = t.x + 2 <= 22 ? 2 : (t.x - 2 >= 0 ? -2 : 0);
      const shiftY = t.y + 2 <= 22 ? 2 : (t.y - 2 >= 0 ? -2 : 0);
      duplicated.push({
        ...t,
        id: newId,
        x: t.x + shiftX,
        y: t.y + shiftY,
        tripletGroupId: t.tripletGroupId ? `tg-${newId}` : undefined,
        combineGroupId: t.combineGroupId ? `combo-${newId}` : undefined,
      });
    });

    setTiles(prev => [...prev, ...duplicated]);
    setSelectedTileIds(newIds);
    showNotification(`Duplicated ${duplicated.length} tiles.`);
  }, [selectedTileIds, tiles, setTiles]);

  // Non-gift tiles in selection
  const nonGiftSelectedTiles = useMemo(() => {
    return tiles.filter(t => selectedTileIds.has(t.id) && !t.isGift);
  }, [tiles, selectedTileIds]);

  // Breakdown of mechanics in non-gift selected tiles
  const selectedMechanicsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nonGiftSelectedTiles.forEach(t => {
      const m = t.mechanic || 'normal';
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [nonGiftSelectedTiles]);

  const uniqueSelectedMechanics = useMemo(() => {
    return Object.keys(selectedMechanicsCounts);
  }, [selectedMechanicsCounts]);

  // Transform selected matching tiles into another mechanic (strictly excluding Gift)
  const handleConvertSelectedTiles = useCallback((targetMechId: string, sourceFilter: string = 'all') => {
    if (nonGiftSelectedTiles.length === 0) return;
    let convertedCount = 0;
    setTiles(prev =>
      prev.map(t => {
        if (t.isGift) return t; // strictly preserve gifts
        if (!selectedTileIds.has(t.id)) return t;
        const currentMech = t.mechanic || 'normal';
        if (sourceFilter !== 'all' && currentMech !== sourceFilter) return t;
        convertedCount++;
        return applyMechanicToTile(t, targetMechId);
      })
    );
    const targetOption = CONVERTIBLE_MECHANICS.find(m => m.id === targetMechId);
    showNotification(`Transformed ${convertedCount} selected tile${convertedCount > 1 ? 's' : ''} to ${targetOption?.label || targetMechId}.`);
    setIsMechanicMenuOpen(false);
  }, [nonGiftSelectedTiles, selectedTileIds, setTiles, showNotification]);

  // Transform all tiles with source mechanic across entire level into target mechanic
  const handleConvertAllInLevel = useCallback((sourceMech: string, targetMechId: string) => {
    let convertedCount = 0;
    setTiles(prev =>
      prev.map(t => {
        if (t.isGift) return t; // strictly preserve gifts
        const currentMech = t.mechanic || 'normal';
        if (currentMech !== sourceMech) return t;
        convertedCount++;
        return applyMechanicToTile(t, targetMechId);
      })
    );
    const targetOption = CONVERTIBLE_MECHANICS.find(m => m.id === targetMechId);
    showNotification(`Converted all ${convertedCount} '${sourceMech}' tiles in level to ${targetOption?.label || targetMechId}.`);
    setIsMechanicMenuOpen(false);
  }, [setTiles, showNotification]);

  // Bulk Apply Current Mechanic
  const handleApplyMechanicToSelected = useCallback((mech: string) => {
    if (selectedTileIds.size === 0) return;
    setTiles(prev =>
      prev.map(t => {
        if (selectedTileIds.has(t.id)) {
          return {
            ...t,
            mechanic: mech,
            movesRemaining: mech === 'eventItem' ? 4 : undefined
          };
        }
        return t;
      })
    );
    showNotification(`Applied '${mech}' mechanic to ${selectedTileIds.size} tiles.`);
  }, [selectedTileIds, setTiles]);

  // Bulk Select All on Active Layer
  const handleSelectAllOnLayer = useCallback(() => {
    const layerTiles = tiles.filter(t => t.z === targetLayer);
    setSelectedTileIds(new Set(layerTiles.map(t => t.id)));
    showNotification(`Selected all ${layerTiles.length} tiles on Layer ${targetLayer}.`);
  }, [tiles, targetLayer]);

  // Convert Selected to Cluster
  const handleCreateClusterFromSelected = useCallback(() => {
    if (selectedTileIds.size === 0 || !setClusters) return;
    const selectedList = tiles.filter(t => selectedTileIds.has(t.id));
    if (selectedList.length === 0) return;

    const minX = Math.min(...selectedList.map(t => t.x));
    const minY = Math.min(...selectedList.map(t => t.y));
    const minZ = Math.min(...selectedList.map(t => t.z));

    const clusterId = `cluster_${Date.now()}`;
    const nextNumber = clusters.length + 1;
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];
    const color = colors[(nextNumber - 1) % colors.length];

    const items = selectedList.map(t => ({
      relX: t.x - minX,
      relY: t.y - minY,
      relZ: t.z - minZ,
      mechanic: t.mechanic,
      themeID: t.themeID,
      baseIcon: t.baseIcon,
      color: t.color
    }));

    const newCluster: TileCluster = {
      id: clusterId,
      name: `Cluster #${nextNumber}`,
      color,
      tileIds: selectedList.map(t => t.id),
      items
    };

    setClusters(prev => [...prev, newCluster]);
    // Associate tiles
    setTiles(prev =>
      prev.map(t => {
        if (selectedTileIds.has(t.id)) {
          return { ...t, clusterId };
        }
        return t;
      })
    );
    showNotification(`Saved ${selectedList.length} tiles as '${newCluster.name}'.`);
  }, [selectedTileIds, tiles, clusters, setClusters, setTiles]);

  // Keyboard Shortcuts for Bulk Actions in Edit Mode
  useEffect(() => {
    if (mode !== 'edit') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (selectedTileIds.size > 0) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleMoveSelected(0, -2);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleMoveSelected(0, 2);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleMoveSelected(-2, 0);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleMoveSelected(2, 0);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteSelected();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedTileIds(new Set());
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicateSelected();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && selectedTool === 'select') {
        e.preventDefault();
        handleSelectAllOnLayer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode,
    selectedTool,
    selectedTileIds,
    handleMoveSelected,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleSelectAllOnLayer
  ]);

  // Marquee Pointer Event Handlers
  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || clusterSelectionMode || clusterPlacementMode) return;
    if (selectedTool !== 'select') return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gx = (e.clientX - rect.left) / (20 * effectiveScale);
    const gy = (e.clientY - rect.top) / (20 * effectiveScale);

    // Check if clicked directly on an already selected tile to initiate drag-move
    const clickedTile = tiles.find(t => {
      if (t.z !== targetLayer) return false;
      const w = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.cols || t.giftCols || 2) - 1) * 2 + 2 : 2;
      const h = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.rows || t.giftRows || 2) - 1) * 2 + 2 : 2;
      return gx >= t.x && gx <= t.x + w && gy >= t.y && gy <= t.y + h;
    });

    if (clickedTile && selectedTileIds.has(clickedTile.id)) {
      // Start drag move of the whole selected group
      setIsDraggingMove(true);
      setDragMoveOrigin({ gx, gy });
      setDragMoveDelta({ dx: 0, dy: 0 });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Start Marquee drag selection
    setIsMarqueeActive(true);
    setMarqueeStart({ x: gx, y: gy });
    setMarqueeCurrent({ x: gx, y: gy });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (clickedTile) {
        setSelectedTileIds(new Set([clickedTile.id]));
      } else {
        setSelectedTileIds(new Set());
      }
    } else if (clickedTile) {
      setSelectedTileIds(prev => {
        const next = new Set(prev);
        if (next.has(clickedTile.id)) {
          next.delete(clickedTile.id);
        } else {
          next.add(clickedTile.id);
        }
        return next;
      });
    }
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || selectedTool !== 'select') return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gx = (e.clientX - rect.left) / (20 * effectiveScale);
    const gy = (e.clientY - rect.top) / (20 * effectiveScale);

    if (isDraggingMove && dragMoveOrigin) {
      const rawDx = gx - dragMoveOrigin.gx;
      const rawDy = gy - dragMoveOrigin.gy;
      const snappedDx = Math.round(rawDx / 2) * 2;
      const snappedDy = Math.round(rawDy / 2) * 2;
      setDragMoveDelta({ dx: snappedDx, dy: snappedDy });
      return;
    }

    if (isMarqueeActive && marqueeStart) {
      setMarqueeCurrent({ x: gx, y: gy });

      const minX = Math.min(marqueeStart.x, gx);
      const maxX = Math.max(marqueeStart.x, gx);
      const minY = Math.min(marqueeStart.y, gy);
      const maxY = Math.max(marqueeStart.y, gy);

      const newlySelected = new Set(e.shiftKey ? selectedTileIds : []);
      tiles.forEach(t => {
        if (t.z !== targetLayer) return;
        const w = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.cols || t.giftCols || 2) - 1) * 2 + 2 : 2;
        const h = t.isGift ? ((GIFT_SIZES[t.mechanic || 'gift2x2']?.rows || t.giftRows || 2) - 1) * 2 + 2 : 2;
        const overlaps = !(t.x + w <= minX || t.x >= maxX || t.y + h <= minY || t.y >= maxY);
        if (overlaps) {
          newlySelected.add(t.id);
        }
      });
      setSelectedTileIds(newlySelected);
    }
  };

  const handleBoardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || selectedTool !== 'select') return;

    if (isDraggingMove) {
      if (dragMoveDelta.dx !== 0 || dragMoveDelta.dy !== 0) {
        handleMoveSelected(dragMoveDelta.dx, dragMoveDelta.dy);
      }
      setIsDraggingMove(false);
      setDragMoveOrigin(null);
      setDragMoveDelta({ dx: 0, dy: 0 });
    }

    if (isMarqueeActive) {
      setIsMarqueeActive(false);
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    }
  };

  const renderTile = (tile: Tile, isPlayMode = false) => {
    const isFree = isPlayMode ? isTileFree(tile, playTiles) : isTileFree(tile, tiles);
    const isEdit = mode === 'edit';
    const stackDepth = stackDepthMap.get(tile.id) ?? 0;
    const isSelected = isEdit && selectedTileIds.has(tile.id);

    const isHiddenByLayerView = isEdit && (
      (layerViewMode === 'cumulative' && tile.z > activeLayer) ||
      (layerViewMode === 'isolated' && tile.z !== activeLayer)
    );

    if (isHiddenByLayerView) return null;

    let content: React.ReactNode = null;
    let bgColor = isEdit ? 'bg-slate-600' : '';
    let borderColor = isEdit ? 'border-slate-800' : '';

    const giftSize = tile.isGift
      ? (GIFT_SIZES[tile.mechanic || ''] || (tile.giftCols && tile.giftRows ? { cols: tile.giftCols, rows: tile.giftRows, name: `Gift ${tile.giftCols}×${tile.giftRows}` } : GIFT_SIZES.gift2x2))
      : null;

    const widthPx = giftSize
      ? ((((giftSize.cols - 1) * 20) + 40 - 4))
      : 40;
    const heightPx = giftSize
      ? ((((giftSize.rows - 1) * 20) + 40 - 4))
      : 40;

    const dragGx = isSelected && isDraggingMove ? dragMoveDelta.dx : 0;
    const dragGy = isSelected && isDraggingMove ? dragMoveDelta.dy : 0;
    const pos = getMorphismCoords(tile.x + dragGx, tile.y + dragGy, widthPx, heightPx);

    if (tile.isGift) {
      const size = giftSize || { cols: tile.giftCols || 2, rows: tile.giftRows || 2, name: `Gift ${tile.giftCols || 2}×${tile.giftRows || 2}` };
      const giftTypeKey = tile.giftType || (tile.giftVisual !== undefined ? Object.keys(GIFT_THEMES).find(k => GIFT_THEMES[k].visualId === tile.giftVisual) : 'golden') || 'golden';
      const theme = GIFT_THEMES[giftTypeKey] || GIFT_THEMES.golden;
      const activeBoard = isPlayMode ? playTiles : tiles;
      const isCovered = isGiftBlocked(tile, activeBoard);

      const renderThemeIcon = (className = "w-6 h-6") => {
        switch (theme.id) {
          case 'mystery':
            return <Sparkles className={className} />;
          case 'crystal':
            return <Gem className={className} />;
          case 'ruby':
            return <Heart className={className} />;
          case 'emerald':
            return <Award className={className} />;
          case 'chest':
            return <Package className={className} />;
          case 'tech':
            return <Zap className={className} />;
          case 'golden':
          default:
            return <Gift className={className} />;
        }
      };

      const isMini = size.cols <= 1 && size.rows <= 1;
      const isNarrowH = size.rows === 1;
      const isNarrowV = size.cols === 1;

      if (!isPlayMode) {
        const isHiddenByLayerView = (() => {
          if (giftPlacementMode) {
            if (layerViewMode === 'cumulative') return tile.z > activeGiftLayer;
            if (layerViewMode === 'isolated') return tile.z !== activeGiftLayer;
            return false;
          } else {
            if (layerViewMode === 'isolated') return tile.z !== activeLayer - 0.5;
            if (layerViewMode === 'cumulative') return tile.z > activeLayer;
            return false;
          }
        })();
        if (isHiddenByLayerView) return null;
      }

      const baseZIndex = Math.floor(tile.z) * 10 + 5;

      if (!isPlayMode) {
        return (
          <div
            key={tile.id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'erase') {
                setTiles(prev => prev.filter(t => t.id !== tile.id));
                showNotification(`Removed Gift Box (${size.cols}×${size.rows})`);
              } else if (selectedTool === 'gift') {
                // In gift tool: clicking a gift cycles theme
                const themesList = Object.keys(GIFT_THEMES);
                const currentIdx = themesList.indexOf(tile.giftType || 'golden');
                const nextType = themesList[(currentIdx + 1) % themesList.length];
                const themeConfig = GIFT_THEMES[nextType] || GIFT_THEMES.golden;
                setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, giftType: nextType, giftVisual: themeConfig.visualId } : t));
                showNotification(`Changed Gift theme to ${themeConfig.label}. (Hover ✕ to delete)`);
              } else if (selectedTool === 'select') {
                setSelectedTileIds(prev => {
                  const next = new Set(e.shiftKey ? prev : []);
                  if (next.has(tile.id)) next.delete(tile.id);
                  else next.add(tile.id);
                  return next;
                });
              }
            }}
            className={`absolute rounded-xl shadow-lg flex items-center justify-center transition-all cursor-pointer overflow-hidden
              ${isCovered
                ? `${theme.playCoveredBg} border-2 border-dashed`
                : `${theme.editBg} border-2 shadow-md`}
              ${giftPlacementMode && tile.z !== activeGiftLayer ? 'opacity-50' : ''}
              ${!giftPlacementMode && tile.z !== activeLayer - 0.5 && tile.z !== activeLayer ? 'opacity-60' : ''}
              ${isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-50 scale-102' : ''}
            `}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${pos.w}px`,
              height: `${pos.h}px`,
              zIndex: isSelected ? 100 : tile.z * 10,
              transform: `translateY(${stackDepth * -STACK_OFFSET_PX}px)`,
              boxShadow: stackDepth > 0
                ? `0 ${2 + stackDepth}px ${4 + stackDepth * 2}px rgba(0,0,0,${0.25 + stackDepth * 0.1})`
                : undefined
            }}
          >
            {/* Horizontal Ribbon Cross */}
            {!isCovered && !isMini && (
              <div
                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 ${isNarrowH ? 'h-1.5' : 'h-2.5 sm:h-3'} ${theme.ribbonColor} shadow-inner pointer-events-none opacity-90`}
              />
            )}
            {/* Vertical Ribbon Cross */}
            {!isCovered && !isMini && (
              <div
                className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 ${isNarrowV ? 'w-1.5' : 'w-2.5 sm:w-3'} ${theme.ribbonColor} shadow-inner pointer-events-none opacity-90`}
              />
            )}

            {/* Centerpiece Theme Medallion */}
            <div className={`relative z-10 p-1 rounded-full ${isCovered ? 'bg-slate-950/60' : 'bg-slate-950/40 backdrop-blur-xs border border-white/30'} flex items-center justify-center shadow`}>
              {renderThemeIcon(`${isMini ? 'w-3.5 h-3.5' : size.cols >= 3 && size.rows >= 3 ? 'w-8 h-8' : 'w-5 h-5'} ${isCovered ? 'text-slate-500' : 'text-white drop-shadow'}`)}
            </div>

            {/* Theme Badge for Medium/Large Gifts */}
            {size.cols >= 2 && size.rows >= 2 && !isCovered && (
              <span className="absolute top-1 right-1 text-[7px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-black/40 text-white/90 border border-white/20">
                {theme.label.split(' ')[0]}
              </span>
            )}

            {/* Dimension Badge */}
            <span className={`absolute bottom-0.5 right-1 text-[9px] font-black font-mono ${isCovered ? 'text-slate-500' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'}`}>
              {size.cols}×{size.rows}
            </span>

            {/* Layer Badge */}
            <span className="absolute top-0.5 left-1 text-[8px] font-black text-white/90 drop-shadow">
              L{tile.z}
            </span>

            {/* Quick Delete Badge on Gift (when in gift or erase tool) */}
            {mode === 'edit' && (selectedTool === 'gift' || selectedTool === 'erase') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTiles(prev => prev.filter(t => t.id !== tile.id));
                  showNotification(`Removed Gift Box (${size.cols}×${size.rows})`);
                }}
                title="Remove this Gift Box"
                className="absolute top-1 right-1 z-40 p-1 bg-red-600/90 hover:bg-red-500 text-white rounded-md shadow-md transition-transform hover:scale-110 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}

            {isSelected && (
              <div className="absolute -top-2 -left-2 bg-cyan-400 text-slate-950 rounded-full p-0.5 shadow-lg border border-slate-900 font-black z-30 animate-bounce">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}

            {isCovered && (
              <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-amber-800 shadow">
                <Lock className="w-3 h-3 text-amber-500" />
              </div>
            )}
          </div>
        );
      }

      if (isCovered) {
        return (
          <div
            key={tile.id}
            className={`absolute rounded-xl pointer-events-none border-2 border-dashed ${theme.playCoveredBg} backdrop-blur-[2px] overflow-hidden`}
            style={{
              left: `${pos.x + 2}px`,
              top: `${pos.y + 2}px`,
              width: `${pos.w}px`,
              height: `${pos.h}px`,
              zIndex: baseZIndex,
              filter: 'brightness(0.35) saturate(0.6)'
            }}
          >
            {/* Subtle Covered Cross Silhouette */}
            {!isMini && (
              <>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-white/5 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-white/5 pointer-events-none" />
              </>
            )}
            <div className="w-full h-full relative flex items-center justify-center">
              {renderThemeIcon(`${isMini ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-slate-700 mx-auto mt-0.5`)}
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-slate-600 font-mono">
                {size.cols}×{size.rows}
              </span>
              <div className="absolute top-0.5 left-1">
                <Lock className="w-2.5 h-2.5 text-slate-600" />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          key={tile.id}
          className={`absolute rounded-xl shadow-2xl flex items-center justify-center pointer-events-none overflow-hidden
            ${theme.playRevealedBg} 
            border-2 animate-pulse`}
          style={{
            left: `${pos.x + 2}px`,
            top: `${pos.y + 2}px`,
            width: `${pos.w}px`,
            height: `${pos.h}px`,
            zIndex: baseZIndex,
            boxShadow: `0 0 35px ${theme.glowColor}, 0 0 70px ${theme.glowColor.replace('0.9', '0.45')}`
          }}
        >
          {/* Radiant Ribbon Cross */}
          {!isMini && (
            <>
              <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 ${isNarrowH ? 'h-2' : 'h-3 sm:h-4'} ${theme.ribbonColor} shadow-md pointer-events-none z-0`} />
              <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 ${isNarrowV ? 'w-2' : 'w-3 sm:w-4'} ${theme.ribbonColor} shadow-md pointer-events-none z-0`} />
            </>
          )}

          <div className="w-full h-full relative flex items-center justify-center animate-pulse z-10">
            {/* Prismatic corner starbursts */}
            <div className={`absolute -top-1 -left-1 text-sm animate-ping ${theme.sparkleColor}`}>✦</div>
            <div className={`absolute -top-1 -right-1 text-sm animate-ping ${theme.sparkleColor}`} style={{ animationDelay: '150ms' }}>✦</div>
            <div className={`absolute -bottom-1 -left-1 text-sm animate-ping ${theme.sparkleColor}`} style={{ animationDelay: '300ms' }}>✦</div>
            <div className={`absolute -bottom-1 -right-1 text-sm animate-ping ${theme.sparkleColor}`} style={{ animationDelay: '450ms' }}>✦</div>

            {/* Medallion */}
            <div className="p-1 rounded-full bg-slate-950/40 backdrop-blur-xs border border-white/40 shadow-xl flex items-center justify-center">
              {renderThemeIcon(`${isMini ? 'w-4 h-4' : size.cols >= 3 && size.rows >= 3 ? 'w-10 h-10' : 'w-7 h-7'} text-white drop-shadow-lg`)}
            </div>

            {/* Theme Tag */}
            {size.cols >= 2 && size.rows >= 2 && (
              <span className="absolute top-1 left-1.5 text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-black/50 text-white border border-white/30 drop-shadow">
                {theme.label.split(' ')[0]}
              </span>
            )}

            {/* Dimensions */}
            <span className="absolute bottom-1 right-1.5 text-[10px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] font-mono z-10">
              {size.cols}×{size.rows}
            </span>
          </div>
        </div>
      );
    }

    if (isPlayMode) {
      if (tile.mechanic === 'hidden' && !tile.isRevealed) {
        content = (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-300 drop-shadow">?</span>
            <span className={`text-[7px] font-black uppercase tracking-wider px-1 rounded-full ${
              tile.hiddenState === 'unsafe'
                ? 'text-amber-300 bg-amber-950/80 border border-amber-500/60'
                : 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/60'
            }`}>
              {tile.hiddenState === 'unsafe' ? 'Unsafe' : 'Safe'}
            </span>
          </div>
        );
        bgColor = 'bg-slate-700';
        borderColor = 'border-slate-900';
      } else {
        const IconComponent = tile.baseIcon ? ICONS[tile.baseIcon] : null;
        const colorObj = COLORS.find(c => c.id === tile.color);
        content = IconComponent ? (
          <IconComponent className={`w-6 h-6 ${colorObj ? colorObj.class : 'text-slate-800'}`} />
        ) : null;
        bgColor = colorObj ? colorObj.bg : 'bg-slate-100';
        borderColor = colorObj ? colorObj.border : 'border-slate-300';
      }
    } else {
      content = <span className="text-[9px] font-bold text-slate-300 font-mono">L{tile.z}</span>;
    }

    let overlay: React.ReactNode = null;

    if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3' || tile.mechanic === 'ice') {
      const defaultReq = tile.mechanic === 'ice3' ? 3 : 2;
      const req = tile.iceMatchesRemaining ?? defaultReq;
      const frozen = isPlayMode ? req > 0 : true;
      if (frozen) {
        overlay = (
          <div className="absolute inset-0 bg-cyan-400/40 border-2 border-cyan-200 rounded-lg backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
            <span className="text-xs font-black text-white drop-shadow-md">
              {isPlayMode ? req : `${req}❄`}
            </span>
          </div>
        );
      }
    }

    if (tile.mechanic?.startsWith('chained')) {
      const locked = isPlayMode ? isChainLocked(tile) : true;
      if (locked) {
        overlay = (
          <div className="absolute inset-0 border-4 border-gray-800 border-dashed rounded-lg opacity-70 z-10 pointer-events-none flex items-end justify-center pb-0.5">
            <span className="text-[9px] font-bold text-gray-200 bg-slate-900/70 px-1 rounded">
              {isPlayMode
                ? `${tile.chainClearedCount || 0}/${tile.chainLevel || (tile.mechanic === 'chained2' ? 2 : 1)}`
                : `Lv${tile.chainLevel || (tile.mechanic === 'chained2' ? 2 : 1)}`}
            </span>
          </div>
        );
      }
    }

    if (tile.mechanic === 'combined') {
      overlay = (
        <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg z-10 pointer-events-none flex items-start justify-end p-0.5 shadow-[inset_0_0_6px_rgba(16,185,129,0.3)]">
          <span className="text-[9px] font-black text-white bg-emerald-600 border border-emerald-300 px-1 py-0.2 rounded-full shadow-sm leading-none">
            C
          </span>
        </div>
      );
    }

    if (tile.mechanic === 'hidden') {
      const isSafe = tile.hiddenState !== 'unsafe';
      overlay = (
        <div className="absolute inset-0 border-2 border-purple-400/80 rounded-lg z-10 pointer-events-none flex flex-col justify-between p-0.5 shadow-[inset_0_0_8px_rgba(168,85,247,0.35)]">
          <div className="flex items-center justify-between w-full">
            <span
              title={isSafe ? `Safe Hidden Item: Available icons confined strictly to sitting layer ${tile.z}` : `Unsafe Hidden Item: Higher chance of randomness across all layers`}
              className={`text-[7px] font-black px-1 py-0.2 rounded leading-none shadow-sm ${
                isSafe
                  ? 'bg-cyan-500 text-slate-950 border border-cyan-200'
                  : 'bg-amber-500 text-slate-950 border border-amber-200'
              }`}
            >
              {isSafe ? '🛡️Safe' : '⚠️Unsafe'}
            </span>
            <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950/90 px-1 py-0.2 rounded border border-purple-700/60 leading-none">
              L{tile.z}
            </span>
          </div>
          {!isPlayMode && (
            <div className="flex items-center justify-center pb-0.5">
              <span className="text-xs font-black text-purple-300 drop-shadow">?</span>
            </div>
          )}
        </div>
      );
    }

    if (isPlayMode && !tile.isGift) {
      const coveringGift = playTiles.find(g => {
        if (!g.isGift || g.z >= tile.z) return false;
        const gSize = GIFT_SIZES[g.mechanic || ''] || (g.giftCols && g.giftRows ? { cols: g.giftCols, rows: g.giftRows } : { cols: 2, rows: 2 });
        return tile.x >= g.x && tile.x <= g.x + ((gSize.cols - 1) * 2) &&
               tile.y >= g.y && tile.y <= g.y + ((gSize.rows - 1) * 2);
      });
      if (coveringGift) {
        overlay = (
          <>
            {overlay}
            <div className="absolute top-0.5 left-0.5 z-20">
              <Lock className="w-2.5 h-2.5 text-amber-400/70" />
            </div>
          </>
        );
      }
    }

    const tileCluster = tile.clusterId ? clusters.find(c => c.id === tile.clusterId) : null;
    const isClusterHighlighted = highlightedClusterId && tile.clusterId === highlightedClusterId;
    const isClusterBuilding = clusterSelectionMode && tile.clusterId === clusterSelectionMode;
    const isSimCurrent = simulationCurrentTileId === tile.id;

    const isSpectrumTile = tileSpectrums.some(s =>
      (s.targetType === 'theme' && tile.themeID === s.targetValue) ||
      (s.targetType === 'icon' && tile.baseIcon === s.targetValue)
    );

    return (
      <div
        key={tile.id}
        onClick={(e) => {
          if (clusterSelectionMode && onTileClusterToggle) {
            e.stopPropagation();
            onTileClusterToggle(tile.id);
            return;
          }
          if (isEdit && selectedTool === 'select') {
            e.stopPropagation();
            setSelectedTileIds(prev => {
              const next = new Set(e.shiftKey ? prev : []);
              if (next.has(tile.id)) next.delete(tile.id);
              else next.add(tile.id);
              return next;
            });
            return;
          }
          handleTileClick(tile);
        }}
        className={`absolute rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-all duration-200
          ${bgColor} ${borderColor} border-b-4
          ${isEdit && tile.z !== activeLayer ? 'opacity-40 grayscale' : 'opacity-100'}
          ${tile.mechanic === 'combined' ? 'border-emerald-400 ring-2 ring-emerald-500/80' : ''}
          ${isSpectrumTile ? 'ring-2 ring-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)]' : ''}
          ${isPlayMode && !isFree ? 'brightness-50 shadow-none border-b-2' : 'hover:brightness-110 hover:-translate-y-1'}
          ${isClusterHighlighted ? 'ring-4 ring-cyan-400 shadow-cyan-500/50 scale-105 z-30' : ''}
          ${isClusterBuilding ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-xl shadow-amber-500/60 scale-105 z-30 animate-pulse' : ''}
          ${isSimCurrent ? 'ring-4 ring-purple-400 ring-offset-2 ring-offset-slate-900 animate-bounce z-40' : ''}
          ${isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.9)] z-50 scale-105' : ''}
        `}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${pos.w}px`,
          height: `${pos.h}px`,
          zIndex: isSelected ? 100 : (clusterSelectionMode ? (100 + tile.z * 10) : (tile.z * 10)),
          transform: `translateY(${stackDepth * -STACK_OFFSET_PX}px)`,
          boxShadow: stackDepth > 0
            ? `inset 0 2px 0 rgba(255,255,255,0.3), 0 ${3 + stackDepth * 2}px ${6 + stackDepth * 3}px rgba(0,0,0,${0.3 + stackDepth * 0.1})`
            : undefined
        }}
      >
        <div className="w-full h-full relative flex items-center justify-center">
          {content}
          {overlay}

          {/* Selected Highlight Checkmark */}
          {isSelected && (
            <div
              className="absolute -top-1.5 -left-1.5 bg-cyan-400 text-slate-950 rounded-full p-0.5 shadow-lg border border-slate-900 font-black z-30 animate-bounce"
              title="Selected"
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}

          {/* Cluster Selection Highlight Badge */}
          {isClusterBuilding && (
            <div
              className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-lg border border-slate-900 font-black z-30 animate-bounce"
              title="Selected for Cluster Group"
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}

          {/* Cluster Badge */}
          {tileCluster && (
            <div
              className="absolute -bottom-1 -left-1 text-[8px] font-extrabold text-white px-1 rounded-full shadow border border-slate-900 flex items-center gap-0.5 z-20"
              style={{ backgroundColor: tileCluster.color }}
              title={`Cluster: ${tileCluster.name}`}
            >
              <Layers className="w-2 h-2" />
              <span>{tileCluster.name.replace('Cluster #', 'C')}</span>
            </div>
          )}

          {isEdit && activeThemes.length > 1 && tile.themeID && (
            <div
              className={`absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-slate-900/80 shadow-sm ${
                THEME_DOT_COLORS[tile.themeID] || 'bg-slate-500'
              }`}
              title={tile.themeID}
            />
          )}
          {isSpectrumTile && (
            <div
              className="absolute -top-1.5 -right-1.5 text-[8px] bg-purple-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center z-20 border border-purple-300 shadow font-black animate-pulse"
              title="Tiles-spectrum active"
            >
              ✨
            </div>
          )}
          {tile.mechanic === 'eventItem' && (tile.movesRemaining ?? 0) > 0 && (
            <div className={`absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-20 border shadow ${
              (tile.movesRemaining ?? 0) <= 1
                ? 'bg-red-600 border-red-300 animate-pulse'
                : 'bg-amber-600 border-yellow-300'
            }`}>
              {tile.movesRemaining}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto flex items-start justify-center relative p-3 sm:p-8 bg-slate-900 w-full min-h-0 select-none"
    >
      {mode === 'play' && gameState !== 'playing' && (
        <div className="absolute inset-0 z-[110] bg-slate-900/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-700 text-center shadow-2xl max-w-sm w-full space-y-4">
            <h2 className="text-2xl font-bold mb-2">
              {gameState === 'won' ? '🎉 Level Cleared!' : '💔 Game Over'}
            </h2>
            <p className="text-slate-400 text-sm">
              {gameState === 'won'
                ? 'All tiles successfully matched!'
                : 'Tray overflowed, player HP depleted, or timer reached 0!'}
            </p>

            {gameState === 'lost' && !hasRevivedThisRun && onRevive ? (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-rose-500/30 space-y-3">
                <p className="text-xs text-rose-300 font-semibold leading-relaxed">
                  ❤️ <strong>Revive Booster is Available!</strong><br />
                  Return 5 tiles from your tray to the board and trigger an icon shuffle to keep your run alive. (Can only be used once per run)
                </p>
                <button
                  onClick={onRevive}
                  className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-rose-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Use Revive Booster</span>
                </button>
              </div>
            ) : null}

            <button
              onClick={stopPlayMode}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              {gameState === 'lost' && !hasRevivedThisRun && onRevive ? 'Give Up' : 'Return to Editor'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notificationMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-slate-950/95 border border-cyan-500/70 text-cyan-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 max-w-full pb-20">
        {mode === 'edit' && selectedTool === 'select' && (
          <div className="bg-cyan-950/90 border border-cyan-500/70 px-3.5 py-1.5 rounded-full text-cyan-200 text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
            <MousePointer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Marquee Select Mode: Drag across grid to select tiles on Layer {targetLayer} • Arrow keys to nudge • Drag to move • Del to delete
            </span>
          </div>
        )}

        {mode === 'edit' && selectedMechanic === 'combined' && selectedTool !== 'select' && (
          <div className="bg-emerald-950/90 border border-emerald-500/80 px-3.5 py-1.5 rounded-full text-emerald-200 text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span>
              Combined Placement Mode: Click grid canvas to place {COMBINE_SHAPES.find(s => s.id === selectedCombineShapeId)?.name || 'Combined Cluster'}
            </span>
          </div>
        )}

        {mode === 'edit' && selectedMechanic === 'gift' && giftPlacementMode && selectedTool !== 'select' && (
          <div className="bg-amber-950/90 border border-amber-500/80 px-3.5 py-1.5 rounded-full text-amber-200 text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>
              🎁 Gift Placement Mode: Click grid canvas to place {GIFT_THEMES[activeGiftType]?.label || 'Gift'} ({GIFT_SIZES[giftPlacementMode]?.name || 'Gift Box'}) on Gift Layer {activeGiftLayer}
            </span>
          </div>
        )}

        {/* Board Morphism & Level Design Toolbar in Edit Mode */}
        {mode === 'edit' && (
          <div className="w-full max-w-xl bg-slate-900/95 border border-purple-500/50 rounded-2xl px-3 py-2 shadow-xl backdrop-blur flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-purple-300 font-bold">
                <span className="text-sm">🌀</span>
                <span>Morphism:</span>
              </div>

              {/* Scope selector */}
              <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                {(['all', 'layer', 'selected'] as MorphismScope[]).map(sc => (
                  <button
                    key={sc}
                    onClick={() => setCanvasMorphismScope(sc)}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      canvasMorphismScope === sc
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sc === 'all' ? `All (${tiles.length})` : sc === 'layer' ? `L${targetLayer}` : `Sel (${selectedTileIds.size})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => handleCanvasTransform('rotate90cw')}
                title="Rotate 90° Clockwise"
                className="px-2 py-1 bg-slate-800 hover:bg-purple-950/80 active:bg-purple-700 border border-slate-700 hover:border-purple-500 text-purple-200 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCw className="w-3 h-3 text-purple-400" />
                <span>90° CW</span>
              </button>
              <button
                onClick={() => handleCanvasTransform('rotate90ccw')}
                title="Rotate 90° Counter-Clockwise"
                className="px-2 py-1 bg-slate-800 hover:bg-purple-950/80 active:bg-purple-700 border border-slate-700 hover:border-purple-500 text-purple-200 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-purple-400" />
                <span>90° CCW</span>
              </button>
              <button
                onClick={() => handleCanvasTransform('rotate180')}
                title="Rotate 180°"
                className="px-2 py-1 bg-slate-800 hover:bg-purple-950/80 active:bg-purple-700 border border-slate-700 hover:border-purple-500 text-purple-200 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-purple-400" />
                <span>180°</span>
              </button>
              <button
                onClick={() => handleCanvasTransform('flipH')}
                title="Flip Horizontal (Mirror X)"
                className="px-2 py-1 bg-slate-800 hover:bg-purple-950/80 active:bg-purple-700 border border-slate-700 hover:border-purple-500 text-purple-200 rounded-lg font-bold text-[10px] flex items-center gap-0.5 cursor-pointer transition-colors"
              >
                <span>↔ Flip H</span>
              </button>
              <button
                onClick={() => handleCanvasSymmetry('radial4')}
                title="4-Way Radial Symmetry: Clone to all 4 quadrants (90°, 180°, 270°)"
                className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800 border border-purple-400/60 text-purple-100 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span>🌸 4-Way</span>
              </button>
              <button
                onClick={() => handleCanvasSymmetry('rotational2')}
                title="2-Way Rotational Symmetry: Clone 180°"
                className="px-2 py-1 bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-400/60 text-cyan-100 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span>☯️ 2-Way</span>
              </button>

              {boardMorphism?.enabled && boardMorphism?.previewInEditor && (
                <button
                  onClick={() => {
                    setTiles(prev => bakeMorphismToTiles(prev, boardMorphism.spinAngle, boardMorphism.mirroredHorizons));
                    if (setBoardMorphism) {
                      setBoardMorphism(prev => ({ ...prev, spinAngle: 0, mirroredHorizons: false }));
                    }
                    showNotification('✨ Baked live morphism into map tiles!');
                  }}
                  title="Bake current editor morphism angle into map tiles"
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Bake ({boardMorphism.spinAngle}°)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Unified Responsive Play Mode HUD Bar: Only shown when timer, boss, morphism, or spectrums are active */}
        {isPlayMode && (boardTimer?.enabled || bossBattle?.enabled || boardMorphism?.enabled || tileSpectrums.length > 0) && (
          <div className="w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur flex flex-wrap items-center justify-between gap-2 z-50 text-xs animate-in fade-in duration-150">
            {/* Left: Timer, Mirror, Spectrums */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {boardTimer?.enabled && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${timeLeft < 15 ? 'bg-rose-950/60 border-rose-500/80 text-rose-300 animate-pulse' : 'bg-slate-950/80 border-amber-500/40 text-amber-200'}`}>
                  <span className="text-xs">⏳</span>
                  <span className="font-mono text-xs font-black tracking-tight">{timeLeft}s</span>
                  {onAddTime && (
                    <button
                      onClick={onAddTime}
                      title="AddTime: +15 seconds"
                      className="ml-1 px-1.5 py-0.2 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-[9px] font-bold text-amber-300 rounded cursor-pointer transition-colors"
                    >
                      +15s
                    </button>
                  )}
                </div>
              )}

              {boardMorphism?.enabled && (
                <div className="flex items-center gap-1 bg-purple-950/80 border border-purple-500/50 text-purple-200 px-2 py-1 rounded-xl text-[10px] font-bold">
                  <span>🪞</span>
                  <span>{boardMorphism.spinAngle}°</span>
                  {boardMorphism.mirroredHorizons && <span className="text-purple-400">Flip</span>}
                </div>
              )}

              {tileSpectrums.length > 0 && (
                <div className="flex items-center gap-1 bg-purple-950/80 border border-purple-500/50 text-purple-300 px-2 py-1 rounded-xl text-[10px] font-bold">
                  <span>✨</span>
                  <span>{tileSpectrums.length} Spectrum</span>
                </div>
              )}
            </div>

            {/* Center: Boss Battle HP */}
            {bossBattle?.enabled && (
              <div className="flex items-center gap-2 bg-slate-950/80 border border-red-500/40 px-2.5 py-1 rounded-xl">
                {/* Boss HP */}
                <div className="flex items-center gap-1.5" title="Boss Health">
                  <span className="text-xs">👹</span>
                  <div className="w-14 sm:w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-300"
                      style={{ width: `${bossHP}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-red-300">{bossHP}%</span>
                </div>

                <div className="w-[1px] h-3 bg-slate-700" />

                {/* Player HP */}
                <div className="flex items-center gap-1.5" title="Player Health (Decreases on full tray)">
                  <span className="text-xs">🛡️</span>
                  <div className="w-14 sm:w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-300 ${playerHP <= 25 ? 'bg-rose-600 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                      style={{ width: `${playerHP}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-300">{playerHP}%</span>
                </div>
              </div>
            )}

            {/* End of Left/Center HUD */}
          </div>
        )}

        {/* Dedicated Sweet Delivery Option 1 Showcase Station (Color-Based / Standard Delivery) */}
        {isPlayMode && sweetDelivery?.enabled && !sweetDelivery.endlessOrder && (() => {
          const rawItems: DeliveryOrderItem[] = deliveryOrderItems.length > 0 ? deliveryOrderItems : sweetDelivery.orders.map((ord, idx) => ({
            id: `ord-${idx}`,
            icon: ord,
            color: undefined,
            status: completedOrders.map(String).includes(String(ord)) ? 'completed' : 'active'
          } as DeliveryOrderItem));

          const completedCount = rawItems.filter(o => o.status === 'completed' || completedOrders.includes(o.id) || completedOrders.includes(o.icon)).length;

          // Helper to resolve icon component reliably (never fallback to Gift)
          const getOrderIcon = (iconName: string | undefined) => {
            if (!iconName) return ICONS.Star;
            if (ICONS[iconName]) return ICONS[iconName];
            const norm = iconName.trim().toLowerCase();
            for (const [key, comp] of Object.entries(ICONS)) {
              if (key.toLowerCase() === norm) return comp;
            }
            const match = playTiles.find(t => (t.baseIcon && t.baseIcon.toLowerCase() === norm) || String(t.assignedIconId) === String(iconName));
            if (match?.baseIcon && ICONS[match.baseIcon]) {
              return ICONS[match.baseIcon];
            }
            return ICONS.Star;
          };

          // Helper to resolve color object reliably
          const getOrderColor = (colorName: string | undefined, iconName?: string) => {
            if (colorName) {
              const found = COLORS.find(c => c.id.toLowerCase() === colorName.toLowerCase());
              if (found) return found;
            }
            const match = playTiles.find(t => t.baseIcon === iconName && t.color);
            if (match?.color) {
              const found = COLORS.find(c => c.id.toLowerCase() === match.color!.toLowerCase());
              if (found) return found;
            }
            return COLORS[0];
          };

          // Process each order item: compute freed count on board, tray count, and resolve exact Icon and Color
          const ordersWithMeta = rawItems.map((ordItem, origIdx) => {
            const isCompleted = ordItem.status === 'completed' || 
              completedOrders.includes(ordItem.id) || 
              completedOrders.includes(ordItem.icon);

            const IconComp = getOrderIcon(ordItem.icon);
            const colorObj = getOrderColor(ordItem.color, ordItem.icon);
            const resolvedColor = colorObj.id;

            // How many matching tiles on the board are currently free (unblocked / clickable)?
            const freedCount = playTiles.filter(t => {
              if (t.isGift) return false;
              if (!isTileFree(t, playTiles)) return false;
              const matchIcon = t.baseIcon === ordItem.icon;
              if (sweetDelivery.colorBased) {
                return matchIcon && (t.color || 'yellow') === resolvedColor;
              }
              return matchIcon;
            }).length;

            // Count matching tiles currently in the player's main tray
            const inTrayCount = container.filter(t => {
              if (t.isGift) return false;
              const matchIcon = t.baseIcon === ordItem.icon;
              if (sweetDelivery.colorBased) {
                return matchIcon && (t.color || 'yellow') === resolvedColor;
              }
              return matchIcon;
            }).length;

            return {
              ...ordItem,
              origIdx,
              isCompleted,
              freedCount,
              inTrayCount,
              IconComp,
              colorObj,
              resolvedColor
            };
          });

          // If more than 4 orders are shown, prioritize from the orders that have the most icons freed displayed first
          const sortedOrders = [...ordersWithMeta].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
              return a.isCompleted ? 1 : -1;
            }
            if (b.freedCount !== a.freedCount) {
              return b.freedCount - a.freedCount;
            }
            if (b.inTrayCount !== a.inTrayCount) {
              return b.inTrayCount - a.inTrayCount;
            }
            return a.origIdx - b.origIdx;
          });

          // Max display on UI is 4 orders
          const displayedOrders = sortedOrders.slice(0, 4);

          return (
            <div className="w-full max-w-xl bg-slate-900/95 border-2 border-purple-500/60 rounded-2xl p-2.5 shadow-2xl backdrop-blur space-y-2 animate-in fade-in duration-200 z-40">
              {/* Header / Status Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🍬</span>
                  <span className="font-black text-purple-300 tracking-tight">
                    Sweet Delivery: {sweetDelivery.colorBased ? 'Option 1 (Color-Based)' : 'Orders'}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    sweetDelivery.colorBased
                      ? 'text-amber-300 bg-amber-950/80 border-amber-600/40'
                      : 'text-purple-300 bg-purple-950/80 border-purple-600/40'
                  }`}>
                    {sweetDelivery.colorBased ? '🎨 Exact Color + Icon' : 'Matching Icon'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950/90 px-2 py-0.5 rounded border border-amber-600/40">
                    Fulfilled: {completedCount} / {rawItems.length}
                  </span>

                  {rawItems.length > 4 && (
                    <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40" title="Max display on UI is 4 orders. Prioritized by most freed icons on the board.">
                      Top 4 of {rawItems.length} (Most Freed)
                    </span>
                  )}

                  {bossBattle?.enabled && onBossScramble && (
                    <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
                      <span className="text-[9px] font-mono text-red-300" title="Moves until next automatic Boss Scramble">
                        🌀 Scramble: {6 - (bossScrambleMovesCount % 6)}m
                      </span>
                      <button
                        onClick={onBossScramble}
                        title="Boss Scramble: Reshuffle delivery orders"
                        className="text-[9px] font-bold text-red-200 hover:text-white bg-red-800/60 hover:bg-red-700/80 px-1.5 py-0.2 rounded transition-colors cursor-pointer"
                      >
                        Scramble
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Informative Subheader */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                <span>
                  {sweetDelivery.colorBased
                    ? 'Only tiles matching BOTH the exact color and icon will fulfill each order.'
                    : 'Match 3 tiles of the target icon to fulfill each order.'}
                  {rawItems.length > 4 ? ' Prioritizing orders with the most freed tiles.' : ''}
                </span>
                {bossBattle?.enabled && (
                  <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0 ml-2">
                    ⚔️ Orders deal 25 DMG to Boss
                  </span>
                )}
              </div>

              {/* Orders Grid rendered similar to Option 2 to display the specific icons of each order required to complete */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {displayedOrders.map((ord) => {
                  const IconComp = ord.IconComp;
                  const colorObj = ord.colorObj;
                  const iconColorClass = colorObj ? colorObj.class : 'text-purple-300';
                  const inTrayCount = Math.min(3, ord.inTrayCount || 0);

                  return (
                    <div
                      key={ord.id || ord.origIdx}
                      className={`relative rounded-xl p-2 flex flex-col items-center justify-between gap-1 transition-all ${
                        ord.isCompleted
                          ? 'bg-emerald-950/40 border-2 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-900 border-2 border-purple-500 shadow-md ring-1 ring-purple-400/30'
                      }`}
                    >
                      {/* Top Badge */}
                      <div className="w-full flex items-center justify-between text-[9px] font-bold">
                        <span className={`px-1.5 py-0.2 rounded font-mono ${
                          ord.isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-purple-500 text-white'
                        }`}>
                          {ord.isCompleted ? '✓ DONE' : `ORDER #${ord.origIdx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] text-slate-300">
                          {ord.isCompleted ? '3/3' : `${inTrayCount}/3`}
                        </span>
                      </div>

                      {/* Icon & Requirement Label with detailed 3D tile showcase */}
                      <div className="flex flex-col items-center my-0.5">
                        <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center shadow-md ${colorObj?.bg || 'bg-slate-800'} ${colorObj?.border || 'border-slate-700'}`}>
                          <IconComp className={`w-5 h-5 ${iconColorClass}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-200 mt-1 truncate max-w-[80px]">
                          {ord.icon}
                        </span>
                        {colorObj && (
                          <span className={`text-[8px] font-bold font-mono px-1 rounded ${colorObj.class} bg-slate-950/80 border border-slate-700 uppercase`}>
                            {colorObj.id}
                          </span>
                        )}
                      </div>

                      {/* 3 Slots showing the specific icons of this order required to complete */}
                      <div className="w-full bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1 mt-0.5">
                        {[0, 1, 2].map((slotIdx) => {
                          if (ord.isCompleted) {
                            return (
                              <div
                                key={slotIdx}
                                className={`w-6 h-6 rounded flex items-center justify-center border shadow-xs animate-in zoom-in-75 duration-150 ${colorObj?.bg || 'bg-emerald-900'} border-emerald-400`}
                                title={`Delivered tile ${slotIdx + 1}/3: ${ord.icon} (${ord.resolvedColor})`}
                              >
                                <IconComp className="w-3.5 h-3.5 text-emerald-200" />
                              </div>
                            );
                          }

                          const hasInTray = slotIdx < inTrayCount;
                          if (hasInTray) {
                            return (
                              <div
                                key={slotIdx}
                                className={`w-6 h-6 rounded flex items-center justify-center border shadow-xs animate-in zoom-in-75 duration-150 ring-1 ring-amber-400/80 ${colorObj?.bg || 'bg-purple-900'} ${colorObj?.border || 'border-amber-400'}`}
                                title={`Collected in tray ${slotIdx + 1}/3: ${ord.icon} (${ord.resolvedColor})`}
                              >
                                <IconComp className={`w-3.5 h-3.5 ${colorObj?.class || 'text-amber-200'}`} />
                              </div>
                            );
                          }

                          return (
                            <div
                              key={slotIdx}
                              className={`w-6 h-6 rounded border border-dashed flex items-center justify-center shadow-xs transition-all opacity-70 ${colorObj?.bg || 'bg-slate-900'} ${colorObj?.border || 'border-purple-600/60'}`}
                              title={`Required tile ${slotIdx + 1}/3: ${ord.icon} (${ord.resolvedColor})`}
                            >
                              <IconComp className={`w-3.5 h-3.5 ${colorObj?.class || 'text-purple-300'}`} />
                            </div>
                          );
                        })}
                      </div>

                      {/* Status Caption */}
                      <span className={`text-[8px] font-semibold text-center mt-0.5 ${
                        ord.isCompleted ? 'text-emerald-400' : 'text-purple-300'
                      }`}>
                        {ord.isCompleted
                          ? 'Order Delivered!'
                          : inTrayCount > 0
                          ? `${inTrayCount}/3 in tray (${ord.freedCount} freed)`
                          : `${ord.freedCount} freed on board`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Dedicated Sweet Delivery Option 2 Level Progression Order Hub */}
        {isPlayMode && sweetDelivery?.enabled && sweetDelivery.endlessOrder && (() => {
          const totalOrdersCount = deliveryOrderItems.length;
          const completedCount = deliveryOrderItems.filter(o => o.status === 'completed' || (o.subTray?.length ?? 0) >= 3).length;

          // Helper to resolve icon component reliably (never fallback to Gift)
          const getOrderIcon = (iconName: string | undefined) => {
            if (!iconName) return ICONS.Star;
            if (ICONS[iconName]) return ICONS[iconName];
            const norm = iconName.trim().toLowerCase();
            for (const [key, comp] of Object.entries(ICONS)) {
              if (key.toLowerCase() === norm) return comp;
            }
            const match = playTiles.find(t => (t.baseIcon && t.baseIcon.toLowerCase() === norm) || String(t.assignedIconId) === String(iconName));
            if (match?.baseIcon && ICONS[match.baseIcon]) {
              return ICONS[match.baseIcon];
            }
            return ICONS.Star;
          };

          const getOrderColor = (colorName: string | undefined, iconName?: string) => {
            if (colorName) {
              const found = COLORS.find(c => c.id.toLowerCase() === colorName.toLowerCase());
              if (found) return found;
            }
            const match = playTiles.find(t => t.baseIcon === iconName && t.color);
            if (match?.color) {
              const found = COLORS.find(c => c.id.toLowerCase() === match.color!.toLowerCase());
              if (found) return found;
            }
            return COLORS[0];
          };

          // Order display according to the progression of level:
          // Find the earliest active or queued order to center the 4-slot window on current progression
          const firstUnfinishedIdx = deliveryOrderItems.findIndex(
            o => o.status === 'active' || o.status === 'queued'
          );
          let startIdx = 0;
          if (firstUnfinishedIdx !== -1) {
            // Anchor window so it progresses naturally from level start to end
            startIdx = Math.max(0, Math.min(firstUnfinishedIdx, deliveryOrderItems.length - 4));
          } else {
            startIdx = Math.max(0, deliveryOrderItems.length - 4);
          }
          const displayedItems = deliveryOrderItems.slice(startIdx, startIdx + 4);

          return (
            <div className="w-full max-w-xl bg-slate-900/95 border-2 border-purple-500/60 rounded-2xl p-2.5 shadow-2xl backdrop-blur space-y-2 animate-in fade-in duration-200 z-40">
              {/* Header / Status Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🍬</span>
                  <span className="font-black text-purple-300 tracking-tight">
                    Sweet Delivery: Option 2 (Level Progression)
                  </span>
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/40">
                    🎨 Color + Icon Match Req.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950/90 px-2 py-0.5 rounded border border-amber-600/40" title="Win when all tiles are cleared or all level orders are fulfilled!">
                    Fulfilled: {completedCount} / {totalOrdersCount}
                  </span>

                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40" title="Max main tray capacity in Option 2 is reduced to 4 slots. Deadlock = Lose!">
                    📦 Main Tray: {container.length}/4 Slots
                  </span>

                  {bossBattle?.enabled && onBossScramble && (
                    <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
                      <span className="text-[9px] font-mono text-red-300" title="Moves until next automatic Boss Scramble">
                        🌀 Scramble: {6 - (bossScrambleMovesCount % 6)}m
                      </span>
                      <button
                        onClick={onBossScramble}
                        title="Boss Scramble: Reshuffle active & queued orders"
                        className="text-[9px] font-bold text-red-200 hover:text-white bg-red-800/60 hover:bg-red-700/80 px-1.5 py-0.2 rounded transition-colors cursor-pointer"
                      >
                        Scramble
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory Rule Banner */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                <span>
                  Orders display according to level progression. <strong>Win by clearing all tiles or fulfilling all {totalOrdersCount} orders!</strong>
                </span>
                {bossBattle?.enabled && (
                  <span className="text-amber-400 font-bold shrink-0 ml-2">
                    ⚔️ -25 Boss HP / order
                  </span>
                )}
              </div>

              {/* Sub-Trays Grid (4 orders: 2 Active first, 2 Inactive until previous 2 complete) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {displayedItems.map((ord, idx) => {
                  const isActive = ord.status === 'active';
                  const isCompleted = ord.status === 'completed' || (ord.subTray?.length ?? 0) >= 3;

                  // Find original 1-based order progression number
                  const origIdx = deliveryOrderItems.findIndex(d => d.id === ord.id);
                  const orderNum = origIdx !== -1 ? origIdx + 1 : idx + 1;

                  const IconComp = getOrderIcon(ord.icon);
                  const colorObj = getOrderColor(ord.color, ord.icon);
                  const resolvedColor = colorObj.id;
                  const iconColorClass = colorObj ? colorObj.class : 'text-purple-300';
                  const subTrayCount = ord.subTray?.length || 0;

                  return (
                    <div
                      key={ord.id || idx}
                      className={`relative rounded-xl p-2 flex flex-col items-center justify-between gap-1 transition-all ${
                        isCompleted
                          ? 'bg-emerald-950/40 border-2 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : isActive
                          ? 'bg-slate-900 border-2 border-purple-500 shadow-md ring-1 ring-purple-400/30'
                          : 'bg-slate-950/70 border border-slate-800 opacity-65'
                      }`}
                    >
                      {/* Top Badge */}
                      <div className="w-full flex items-center justify-between text-[9px] font-bold">
                        <span className={`px-1.5 py-0.2 rounded font-mono ${
                          isCompleted
                            ? 'bg-emerald-500 text-slate-950'
                            : isActive
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isCompleted ? '✓ DONE' : isActive ? `ACTIVE #${orderNum}` : `QUEUED #${orderNum}`}
                        </span>

                        <span className="font-mono text-[10px] text-slate-300">
                          {isCompleted ? '3/3' : `${subTrayCount}/3`}
                        </span>
                      </div>

                      {/* Icon & Requirement Label with detailed 3D tile showcase */}
                      <div className="flex flex-col items-center my-0.5">
                        <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center shadow-md ${colorObj?.bg || 'bg-slate-800'} ${colorObj?.border || 'border-slate-700'}`}>
                          <IconComp className={`w-5 h-5 ${iconColorClass}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-200 mt-1 truncate max-w-[80px]">
                          {ord.icon}
                        </span>
                        {colorObj && (
                          <span className={`text-[8px] font-bold font-mono px-1 rounded ${colorObj.class} bg-slate-950/80 border border-slate-700 uppercase`}>
                            {colorObj.id}
                          </span>
                        )}
                      </div>

                      {/* Sub-Tray: 3 Slots containing ONLY matching tiles */}
                      <div className="w-full bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1 mt-0.5">
                        {[0, 1, 2].map(slotIdx => {
                          const tileInSlot = ord.subTray?.[slotIdx];
                          if (tileInSlot) {
                            const tileColorObj = COLORS.find(c => c.id === tileInSlot.color);
                            const TileIcon = ICONS[tileInSlot.baseIcon || ''] || ICONS.Star;
                            return (
                              <div
                                key={slotIdx}
                                className={`w-6 h-6 rounded flex items-center justify-center border shadow-xs animate-in zoom-in-75 duration-150 ${tileColorObj?.bg || 'bg-purple-900'} ${tileColorObj?.border || 'border-purple-400'}`}
                                title={`Delivered tile ${slotIdx + 1}/3: ${tileInSlot.baseIcon} (${tileInSlot.color})`}
                              >
                                <TileIcon className={`w-3.5 h-3.5 ${tileColorObj?.class || 'text-purple-200'}`} />
                              </div>
                            );
                          }

                          return (
                            <div
                              key={slotIdx}
                              className={`w-6 h-6 rounded border border-dashed flex items-center justify-center text-[9px] font-mono ${
                                isActive ? 'border-purple-600/60 text-purple-400/80 bg-slate-900/60' : 'border-slate-800 text-slate-700 bg-slate-950'
                              }`}
                              title={isActive ? `Slot ${slotIdx + 1}: Waiting for ${ord.icon} (${resolvedColor})` : 'Locked in queue'}
                            >
                              {isActive ? '+' : '🔒'}
                            </div>
                          );
                        })}
                      </div>

                      {/* Status Caption */}
                      <span className={`text-[8px] font-semibold text-center mt-0.5 ${
                        isCompleted ? 'text-emerald-400' : isActive ? 'text-purple-300' : 'text-slate-500'
                      }`}>
                        {isCompleted
                          ? 'Order Delivered!'
                          : isActive
                          ? 'Picks route here'
                          : 'Unlocks in next wave'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div
          className="relative"
          style={{
            width: `${INTRINSIC_BOARD_SIZE * effectiveScale}px`,
            height: `${INTRINSIC_BOARD_SIZE * effectiveScale}px`,
          }}
        >
          <div
            ref={boardRef}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            className="relative shadow-2xl select-none"
            style={{
              width: '480px',
              height: '480px',
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top left',
              backgroundImage:
                'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: '#0f172a',
              cursor: selectedTool === 'select' ? (isDraggingMove ? 'grabbing' : 'crosshair') : 'default'
            }}
          >
            {/* Grid Placement / Erasing Click Layer when not in Marquee Select */}
            {mode === 'edit' && selectedTool !== 'select' && (
              <div
                className={`absolute inset-0 z-40 ${clusterSelectionMode ? 'pointer-events-none' : ''}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor((e.clientX - rect.left) / (20 * effectiveScale));
                  const y = Math.floor((e.clientY - rect.top) / (20 * effectiveScale));
                  if (x <= 22 && y <= 22) {
                    if (clusterPlacementMode && onPlaceClusterOnGrid) {
                      onPlaceClusterOnGrid(x, y, clusterPlacementMode);
                      return;
                    }
                    handleGridClick(x, y);
                  }
                }}
              />
            )}

            {/* Render Marquee Selection Box */}
            {isMarqueeActive && marqueeStart && marqueeCurrent && (
              <div
                className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/15 rounded pointer-events-none z-[70] shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-none"
                style={{
                  left: `${Math.min(marqueeStart.x, marqueeCurrent.x) * 20}px`,
                  top: `${Math.min(marqueeStart.y, marqueeCurrent.y) * 20}px`,
                  width: `${Math.max(2, Math.abs(marqueeCurrent.x - marqueeStart.x) * 20)}px`,
                  height: `${Math.max(2, Math.abs(marqueeCurrent.y - marqueeStart.y) * 20)}px`,
                }}
              >
                <div className="absolute -top-7 left-0 bg-slate-900/90 text-cyan-300 border border-cyan-500/60 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                  <MousePointer className="w-3 h-3 text-cyan-400" />
                  <span>Selecting {selectedTileIds.size} tiles (L{targetLayer})</span>
                </div>
              </div>
            )}

            {(mode === 'play' ? playTiles : tiles).map(tile => renderTile(tile, mode === 'play'))}
          </div>
        </div>

        {/* Floating Bulk Action Bar for Selected Tiles */}
        {mode === 'edit' && selectedTileIds.size > 0 && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur flex flex-wrap items-center justify-center gap-2 max-w-[95vw] animate-in slide-in-from-bottom-3 duration-200">
            {/* Selected summary pill */}
            <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/60 px-3 py-1.5 rounded-xl text-cyan-200 text-xs font-black">
              <MousePointer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{selectedTileIds.size} Selected</span>
              <span className="bg-cyan-900 text-cyan-300 px-1.5 py-0.2 rounded font-mono text-[10px]">
                L{targetLayer}
              </span>
            </div>

            {/* D-Pad Nudge Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleMoveSelected(-2, 0)}
                title="Move Left 2 Grid Units (ArrowLeft)"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveSelected(0, -2)}
                  title="Move Up 2 Grid Units (ArrowUp)"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveSelected(0, 2)}
                  title="Move Down 2 Grid Units (ArrowDown)"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => handleMoveSelected(2, 0)}
                title="Move Right 2 Grid Units (ArrowRight)"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layer Shift Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleShiftLayer(1)}
                title="Move to Upper Layer (+1 Z-Layer)"
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>L+1</span>
              </button>
              <button
                onClick={() => handleShiftLayer(-1)}
                title="Move to Lower Layer (-1 Z-Layer)"
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>L-1</span>
              </button>
            </div>

            {/* Duplicate Button */}
            <button
              onClick={handleDuplicateSelected}
              title="Duplicate Selected Tiles (Ctrl+D)"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone</span>
            </button>

            {/* Morphism Rotate & Symmetry on Selection */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-purple-900/60">
              <button
                onClick={() => handleCanvasTransform('rotate90cw', 'selected')}
                title="Rotate Selected 90° Clockwise"
                className="p-1.5 bg-slate-800 hover:bg-purple-900 active:bg-purple-600 text-purple-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCanvasTransform('rotate90ccw', 'selected')}
                title="Rotate Selected 90° Counter-Clockwise"
                className="p-1.5 bg-slate-800 hover:bg-purple-900 active:bg-purple-600 text-purple-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCanvasTransform('flipH', 'selected')}
                title="Flip Selected Horizontal (Mirror X)"
                className="px-1.5 py-1 bg-slate-800 hover:bg-purple-900 active:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <span>↔</span>
              </button>
              <button
                onClick={() => handleCanvasSymmetry('radial4', 'selected')}
                title="4-Way Radial Symmetry: Clone Selected to 4 Quadrants"
                className="px-2 py-1 bg-purple-950/80 hover:bg-purple-900 active:bg-purple-600 border border-purple-500/50 text-purple-200 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>🌸 4-Way</span>
              </button>
            </div>

            {/* Change Special Mechanic Popover Button (strictly excluding Gift) */}
            <div className="relative">
              <button
                onClick={() => setIsMechanicMenuOpen(!isMechanicMenuOpen)}
                title="Change one or a set of same Special Mechanic tiles into the other (excluding Gift)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border ${
                  isMechanicMenuOpen
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMechanicMenuOpen ? 'animate-spin' : ''}`} />
                <span>Change Mechanic</span>
                <ChevronUp className={`w-3 h-3 transition-transform ${isMechanicMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Flyout Popover for Changing Mechanic */}
              {isMechanicMenuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-slate-950/95 border-2 border-amber-500/70 backdrop-blur-md rounded-2xl p-3 shadow-2xl text-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2.5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                        Change Mechanic
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-bold">
                        {nonGiftSelectedTiles.length} tile{nonGiftSelectedTiles.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setIsMechanicMenuOpen(false)}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Source Breakdown / Filter */}
                  {nonGiftSelectedTiles.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      No regular tiles in selection (Gift boxes are excluded from mechanic swapping).
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span>1. Mechanic in Selection:</span>
                          <span className="text-amber-400 font-mono">
                            {uniqueSelectedMechanics.length === 1 ? 'Uniform Set' : `${uniqueSelectedMechanics.length} Types`}
                          </span>
                        </div>

                        {uniqueSelectedMechanics.length === 1 ? (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                            <span className="text-slate-300">
                              All <span className="font-bold text-white">{nonGiftSelectedTiles.length}</span> tiles are:
                            </span>
                            <span className="font-black text-amber-300 uppercase font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60">
                              {CONVERTIBLE_MECHANICS.find(m => m.id === uniqueSelectedMechanics[0])?.shortLabel || uniqueSelectedMechanics[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                            <button
                              onClick={() => setSourceMechFilter('all')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                sourceMechFilter === 'all'
                                  ? 'bg-amber-500 text-slate-950 shadow font-black'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              All Selected ({nonGiftSelectedTiles.length})
                            </button>
                            {uniqueSelectedMechanics.map(mKey => {
                              const count = selectedMechanicsCounts[mKey];
                              const mOption = CONVERTIBLE_MECHANICS.find(m => m.id === mKey);
                              const label = mOption?.shortLabel || mKey;
                              return (
                                <button
                                  key={mKey}
                                  onClick={() => setSourceMechFilter(mKey)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                    sourceMechFilter === mKey
                                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                                >
                                  {label} ({count})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Hidden Item Safety controls if hidden tiles are selected */}
                      {nonGiftSelectedTiles.some(t => t.mechanic === 'hidden') && (
                        <div className="bg-purple-950/70 border border-purple-500/50 p-2 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-purple-200">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-purple-400" />
                              <span>Hidden Safety in Selection:</span>
                            </span>
                            <button
                              onClick={() => {
                                const selHidden = nonGiftSelectedTiles.filter(t => t.mechanic === 'hidden');
                                const rep = calculateHiddenSafety(selHidden);
                                showNotification(`Hidden Safety: ${rep.safeCount} Safe (layer-confined), ${rep.unsafeCount} Unsafe`);
                              }}
                              className="text-[9px] text-purple-300 hover:text-white underline cursor-pointer"
                            >
                              Calculate Safety
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setTiles(prev => prev.map(t => {
                                  if (selectedTileIds.has(t.id) && t.mechanic === 'hidden') {
                                    return { ...t, hiddenState: 'safe' };
                                  }
                                  return t;
                                }));
                                showNotification('Set selected hidden tiles to 🛡️ Safe (Layer-confined)');
                              }}
                              className="flex-1 py-1 rounded border border-cyan-500/60 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              🛡️ Set Safe (Layer)
                            </button>
                            <button
                              onClick={() => {
                                setTiles(prev => prev.map(t => {
                                  if (selectedTileIds.has(t.id) && t.mechanic === 'hidden') {
                                    return { ...t, hiddenState: 'unsafe' };
                                  }
                                  return t;
                                }));
                                showNotification('Set selected hidden tiles to ⚠️ Unsafe (Random)');
                              }}
                              className="flex-1 py-1 rounded border border-amber-500/60 bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              ⚠️ Set Unsafe (Random)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Target Mechanic Picker */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                          <span>2. Transform into:</span>
                          <span className="text-[9px] text-amber-400 font-semibold">(Except Gift)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                          {CONVERTIBLE_MECHANICS.map(mech => (
                            <button
                              key={mech.id}
                              onClick={() => handleConvertSelectedTiles(mech.id, uniqueSelectedMechanics.length === 1 ? 'all' : sourceMechFilter)}
                              className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${mech.colorClass}`}
                            >
                              <mech.icon className="w-3.5 h-3.5 shrink-0" />
                              <div className="truncate min-w-0">
                                <p className="font-bold text-[10px] truncate leading-tight">{mech.shortLabel}</p>
                                <p className="text-[8px] opacity-70 truncate leading-none">{mech.label.split('(')[0]}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Batch Convert All in Entire Level */}
                      {((uniqueSelectedMechanics.length === 1) || (sourceMechFilter !== 'all')) && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-medium">Level-wide conversion:</span>
                          <button
                            onClick={() => {
                              const src = uniqueSelectedMechanics.length === 1 ? uniqueSelectedMechanics[0] : sourceMechFilter;
                              const target = prompt(
                                `Convert all '${src}' tiles in entire level into which mechanic? Choose: normal, chained1, chained2, ice2, ice3, hidden, eventItem:`,
                                'ice2'
                              );
                              if (target && CONVERTIBLE_MECHANICS.some(m => m.id === target)) {
                                handleConvertAllInLevel(src, target);
                              }
                            }}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Convert All Matching in Level</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Save as Cluster Button */}
            {setClusters && (
              <button
                onClick={handleCreateClusterFromSelected}
                title="Save selected tiles as a new Tile Cluster"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Make Cluster</span>
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={handleDeleteSelected}
              title="Delete Selected Tiles (Delete / Backspace)"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedTileIds.size})</span>
            </button>

            {/* Deselect Button */}
            <button
              onClick={() => setSelectedTileIds(new Set())}
              title="Deselect All (Esc)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'play' && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl p-2 shadow-lg max-w-full">
            <button
              onClick={handleUndo}
              disabled={boosterInventory.undo <= 0 || container.length === 0}
              title="Undo: Revert last tile from tray"
              className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[72px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                boosterInventory.undo > 0 && container.length > 0
                  ? 'bg-blue-500/20 border-2 border-blue-500/50 hover:bg-blue-500/30 text-blue-300 cursor-pointer'
                  : 'bg-slate-900/60 border-2 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Undo</span>
              <span className="text-xs sm:text-sm font-mono font-black leading-tight mt-0.5">{boosterInventory.undo}</span>
            </button>

            <button
              onClick={handleMagnet}
              disabled={boosterInventory.magnet <= 0}
              title="Magnet: Create a match (works even with empty tray)"
              className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[72px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                boosterInventory.magnet > 0
                  ? 'bg-purple-500/20 border-2 border-purple-500/50 hover:bg-purple-500/30 text-purple-300 cursor-pointer'
                  : 'bg-slate-900/60 border-2 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Magnet</span>
              <span className="text-xs sm:text-sm font-mono font-black leading-tight mt-0.5">{boosterInventory.magnet}</span>
            </button>

            <button
              onClick={handleSwap}
              disabled={boosterInventory.swap <= 0}
              title="Swap: Shuffle all icons"
              className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[72px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                boosterInventory.swap > 0
                  ? 'bg-amber-500/20 border-2 border-amber-500/50 hover:bg-amber-500/30 text-amber-300 cursor-pointer'
                  : 'bg-slate-900/60 border-2 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Swap</span>
              <span className="text-xs sm:text-sm font-mono font-black leading-tight mt-0.5">{boosterInventory.swap}</span>
            </button>

            <button
              onClick={handleSlotExpand}
              disabled={boosterInventory.slotExpand <= 0}
              title="Slot Expand: +1 tray slot"
              className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[72px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all ${
                boosterInventory.slotExpand > 0
                  ? 'bg-emerald-500/20 border-2 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-300 cursor-pointer'
                  : 'bg-slate-900/60 border-2 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight">Slot+</span>
              <span className="text-xs sm:text-sm font-mono font-black leading-tight mt-0.5">{boosterInventory.slotExpand}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
