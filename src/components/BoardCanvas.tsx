import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Gift, Lock, Boxes, Layers, Check, MousePointer, Move, Trash2, Copy,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Sparkles, ChevronUp, ChevronDown, Wand2
} from 'lucide-react';
import {
  Tile, BoosterAvailability, TileCluster, BoardMorphismConfig, TileSpectrumEntry, EditorTool,
  BoardTimerConfig, BossBattleConfig, SweetDeliveryConfig
} from '../types/game';
import {
  INTRINSIC_BOARD_SIZE, STACK_OFFSET_PX, GIFT_SIZES,
  ICONS, COLORS, THEME_DOT_COLORS, COMBINE_SHAPES
} from '../constants/gameConfig';
import {
  isTileFree, isGiftBlocked, isChainLocked
} from '../utils/gameHelpers';

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
  selectedTool: EditorTool;
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
  tileSpectrums?: TileSpectrumEntry[];
  boardTimer?: BoardTimerConfig;
  timeLeft?: number;
  bossBattle?: BossBattleConfig;
  bossHP?: number;
  playerHP?: number;
  sweetDelivery?: SweetDeliveryConfig;
  completedOrders?: string[];
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
  selectedTool,
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
  tileSpectrums = [],
  boardTimer,
  timeLeft = 60,
  bossBattle,
  bossHP = 100,
  playerHP = 100,
  sweetDelivery,
  completedOrders = [],
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

  // Marquee Selection & Bulk Operations State
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [isMarqueeActive, setIsMarqueeActive] = useState<boolean>(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingMove, setIsDraggingMove] = useState<boolean>(false);
  const [dragMoveOrigin, setDragMoveOrigin] = useState<{ gx: number; gy: number } | null>(null);
  const [dragMoveDelta, setDragMoveDelta] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const targetLayer = giftPlacementMode ? activeGiftLayer : activeLayer;

  const getMorphismCoords = (tileX: number, tileY: number, wPx: number, hPx: number) => {
    let x = tileX * 20;
    let y = tileY * 20;
    let w = wPx;
    let h = hPx;

    if (isPlayMode && boardMorphism?.enabled) {
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
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32); // 32px padding
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Compute effective scale to fit small screens smoothly
  const effectiveScale = useMemo(() => {
    const targetPx = INTRINSIC_BOARD_SIZE * boardScale;
    if (containerWidth > 0 && targetPx > containerWidth) {
      return containerWidth / INTRINSIC_BOARD_SIZE;
    }
    return boardScale;
  }, [boardScale, containerWidth]);

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

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 2500);
  };

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

    const widthPx = tile.isGift
      ? ((((GIFT_SIZES[tile.mechanic || 'gift2x2']?.cols || tile.giftCols || 2) - 1) * 20) + 40 - 4)
      : 40;
    const heightPx = tile.isGift
      ? ((((GIFT_SIZES[tile.mechanic || 'gift2x2']?.rows || tile.giftRows || 2) - 1) * 20) + 40 - 4)
      : 40;

    const dragGx = isSelected && isDraggingMove ? dragMoveDelta.dx : 0;
    const dragGy = isSelected && isDraggingMove ? dragMoveDelta.dy : 0;
    const pos = getMorphismCoords(tile.x + dragGx, tile.y + dragGy, widthPx, heightPx);

    if (tile.isGift) {
      const size = GIFT_SIZES[tile.mechanic || 'gift2x2'] || { cols: tile.giftCols || 2, rows: tile.giftRows || 2 };
      const activeBoard = isPlayMode ? playTiles : tiles;
      const isCovered = isGiftBlocked(tile, activeBoard);

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
                setTiles(tiles.filter(t => t.id !== tile.id));
              } else if (selectedTool === 'select') {
                setSelectedTileIds(prev => {
                  const next = new Set(e.shiftKey ? prev : []);
                  if (next.has(tile.id)) next.delete(tile.id);
                  else next.add(tile.id);
                  return next;
                });
              }
            }}
            className={`absolute rounded-lg shadow-lg flex items-center justify-center transition-all cursor-pointer
              ${isCovered
                ? 'bg-amber-950/70 border-2 border-amber-900 border-dashed'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-yellow-300'}
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
            <Gift className={`w-6 h-6 ${isCovered ? 'text-amber-700/60' : 'text-white'}`} />
            <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-bold ${isCovered ? 'text-amber-500/60' : 'text-white/90'}`}>
              {size.cols}×{size.rows}
            </span>
            <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white/70">
              L{tile.z}
            </span>

            {isSelected && (
              <div className="absolute -top-2 -left-2 bg-cyan-400 text-slate-950 rounded-full p-0.5 shadow-lg border border-slate-900 font-black z-30 animate-bounce">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}

            {isCovered && (
              <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-amber-800 shadow">
                <Lock className="w-3 h-3 text-amber-600" />
              </div>
            )}
          </div>
        );
      }

      if (isCovered) {
        return (
          <div
            key={tile.id}
            className="absolute rounded-lg pointer-events-none
              border-2 border-dashed border-amber-950/50 
              bg-slate-950/80 backdrop-blur-[2px]"
            style={{
              left: `${pos.x + 2}px`,
              top: `${pos.y + 2}px`,
              width: `${pos.w}px`,
              height: `${pos.h}px`,
              zIndex: baseZIndex,
              filter: 'brightness(0.3) saturate(0.5)'
            }}
          >
            <div className="w-full h-full relative flex items-center justify-center">
              <Gift className="w-6 h-6 text-slate-800 mx-auto mt-1" />
              <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-slate-700">
                {size.cols}×{size.rows}
              </span>
            </div>
          </div>
        );
      }

      return (
        <div
          key={tile.id}
          className="absolute rounded-lg shadow-2xl flex items-center justify-center pointer-events-none
            bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 
            border-2 border-yellow-200
            animate-pulse"
          style={{
            left: `${pos.x + 2}px`,
            top: `${pos.y + 2}px`,
            width: `${pos.w}px`,
            height: `${pos.h}px`,
            zIndex: baseZIndex,
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.95), 0 0 60px rgba(251, 191, 36, 0.5), 0 0 90px rgba(251, 191, 36, 0.3)'
          }}
        >
          <div className="w-full h-full relative flex items-center justify-center animate-pulse">
            <div className="absolute -top-2 -left-2 text-yellow-200 text-lg animate-ping">✦</div>
            <div className="absolute -top-2 -right-2 text-yellow-200 text-lg animate-ping" style={{ animationDelay: '150ms' }}>✦</div>
            <div className="absolute -bottom-2 -left-2 text-yellow-200 text-lg animate-ping" style={{ animationDelay: '300ms' }}>✦</div>
            <div className="absolute -bottom-2 -right-2 text-yellow-200 text-lg animate-ping" style={{ animationDelay: '450ms' }}>✦</div>
            <Gift className="w-8 h-8 text-white drop-shadow-lg relative z-10" strokeWidth={2.5} />
            <span className="absolute bottom-1 right-1 text-[10px] font-black text-white drop-shadow z-10">
              {size.cols}×{size.rows}
            </span>
          </div>
        </div>
      );
    }

    if (isPlayMode) {
      if (tile.mechanic === 'hidden' && !tile.isRevealed) {
        content = <span className="text-xl font-bold text-slate-400">?</span>;
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

    if (isPlayMode && !tile.isGift) {
      const coveringGift = playTiles.find(g =>
        g.isGift &&
        g.z < tile.z &&
        tile.x >= g.x && tile.x <= g.x + ((GIFT_SIZES[g.mechanic || 'gift2x2']?.cols || g.giftCols || 2) - 1) * 2 &&
        tile.y >= g.y && tile.y <= g.y + ((GIFT_SIZES[g.mechanic || 'gift2x2']?.rows || g.giftRows || 2) - 1) * 2
      );
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
              🎁 Gift Placement Mode: Click grid canvas to place {GIFT_SIZES[giftPlacementMode]?.name || 'Gift Box'} on Gift Layer {activeGiftLayer}
            </span>
          </div>
        )}

        {isPlayMode && boardMorphism?.enabled && (
          <div className="bg-purple-950/95 border-2 border-purple-400 px-4 py-2 rounded-xl text-purple-100 text-xs font-black shadow-2xl flex items-center gap-2 animate-bounce z-50">
            <span className="text-lg">🪞</span>
            <span>
              MIRROR MODE ACTIVATED — Board-morphism: Rotated {boardMorphism.spinAngle}° | Mirrored: {boardMorphism.mirroredHorizons ? 'YES' : 'NO'}
            </span>
          </div>
        )}

        {isPlayMode && tileSpectrums.length > 0 && (
          <div className="bg-purple-900/90 border border-purple-400/70 px-3 py-1.5 rounded-lg text-purple-200 text-xs font-bold shadow flex flex-wrap items-center gap-2 z-50">
            <span className="text-amber-300 font-extrabold flex items-center gap-1">
              ✨ Tiles-spectrum Active:
            </span>
            {tileSpectrums.map((s, idx) => (
              <span key={s.id} className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-700 font-mono text-[10px]">
                #{idx + 1} {s.targetValue} ({s.benefit.replace('_', ' ')})
              </span>
            ))}
          </div>
        )}

        {/* Board Timer Countdown Bar */}
        {isPlayMode && boardTimer?.enabled && (
          <div className={`w-full max-w-md bg-slate-900 border rounded-2xl p-3 flex flex-col items-center gap-2 shadow-xl animate-in fade-in zoom-in duration-200 z-50 ${timeLeft < 15 ? 'border-rose-500 animate-pulse bg-rose-950/20' : 'border-amber-500/50'}`}>
            <div className="flex items-center justify-between w-full text-xs font-bold text-amber-300">
              <span className="flex items-center gap-1">⏳ Board Timer Countdown</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm ${timeLeft < 15 ? 'text-rose-400 font-extrabold text-base animate-bounce' : 'text-amber-200'}`}>
                  {timeLeft} seconds
                </span>
                {onAddTime && (
                  <button
                    onClick={onAddTime}
                    title="AddTime: +15 seconds to level"
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-[10px] font-black text-amber-300 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <span>+15s</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${timeLeft < 15 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-300'}`}
                style={{ width: `${(timeLeft / boardTimer.duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* BOSS Battle HP/Player HP Bars */}
        {isPlayMode && bossBattle?.enabled && (
          <div className="w-full max-w-md bg-slate-900/90 border border-red-500/60 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-2xl animate-in fade-in zoom-in duration-200 z-50">
            {/* Boss HP Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-black text-red-400">
                <span className="flex items-center gap-1">👹 EVIL BOSS HP</span>
                <span className="font-mono text-sm">{bossHP}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400 transition-all duration-300 rounded-full animate-pulse"
                  style={{ width: `${bossHP}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-red-200/45 tracking-widest uppercase">
                  {bossHP === 0 ? 'DEFEATED' : 'STRIKE MATCHES TO DAMAGE'}
                </div>
              </div>
            </div>

            {/* Player HP Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-black text-emerald-400">
                <span className="flex items-center gap-1">🛡️ KNIGHT PLAYER HP</span>
                <span className="font-mono text-sm">{playerHP}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${playerHP <= 25 ? 'bg-rose-600 animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`}
                  style={{ width: `${playerHP}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-emerald-200/45 tracking-widest uppercase">
                  {playerHP <= 25 ? 'CRITICAL HP - HEAL / REVIVE NEEDED' : 'FULL TRAY CAUSES -25% DAMAGE'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sweet Delivery Active Orders */}
        {isPlayMode && sweetDelivery?.enabled && (() => {
          const isRegistryActive = playTiles.some(t => t.assignedIconId != null);
          const activeOrders = sweetDelivery.orders.filter(
            orderIcon => !completedOrders.map(String).includes(String(orderIcon))
          );

          if (activeOrders.length === 0) return null;

          return (
            <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xl animate-in fade-in zoom-in duration-200 z-50">
              <div className="border-b border-slate-800 pb-1.5 flex justify-center">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
                  🍬 SWEET DELIVERY CHALLENGE (Max Trays: 5 Slots)
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {activeOrders.map((orderIcon, idx) => {
                  let IconComp: React.ComponentType<{ className?: string }> = Gift;
                  let colorObj: any = null;

                  if (isRegistryActive) {
                    const matchedTile = playTiles.find(t => String(t.assignedIconId) === String(orderIcon));
                    if (matchedTile) {
                      IconComp = ICONS[matchedTile.baseIcon || ''] || Gift;
                      colorObj = COLORS.find(c => c.id === matchedTile.color);
                    }
                  } else {
                    IconComp = ICONS[orderIcon] || Gift;
                  }

                  const iconColorClass = colorObj ? colorObj.class : 'text-cyan-400';
                  const containerBgClass = colorObj ? colorObj.bg : 'bg-cyan-500/10';
                  const containerBorderClass = colorObj ? colorObj.border : 'border-cyan-500/30';

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border bg-slate-950/60 shadow-inner ${containerBorderClass} transition-all duration-300 hover:scale-105 hover:bg-slate-950/80`}
                    >
                      <div className={`flex items-center gap-1.5 p-2 rounded-xl border ${containerBgClass} ${containerBorderClass} shadow-md`}>
                        <IconComp className={`w-5 h-5 ${iconColorClass}`} />
                        <IconComp className={`w-5 h-5 ${iconColorClass}`} />
                        <IconComp className={`w-5 h-5 ${iconColorClass}`} />
                      </div>
                      {isRegistryActive && (
                        <span className="text-[10px] font-mono font-black text-slate-400 mt-2 tracking-wider">
                          ID: #{orderIcon}
                        </span>
                      )}
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

            {/* Convert Mechanic Button */}
            {selectedMechanic && selectedMechanic !== 'normal' && (
              <button
                onClick={() => handleApplyMechanicToSelected(selectedMechanic)}
                title={`Convert selected tiles to ${selectedMechanic}`}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Apply {selectedMechanic}</span>
              </button>
            )}

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
