import React from 'react';
import { Layers, Plus, Trash2, Eye, Lock, Check, Stamp, Sparkles } from 'lucide-react';
import { Tile, TileCluster } from '../types/game';

interface ClusterManagerProps {
  tiles: Tile[];
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  clusters: TileCluster[];
  setClusters: React.Dispatch<React.SetStateAction<TileCluster[]>>;
  isPro: boolean;
  onRequirePro: (featureName: string, featureDescription: string) => void;
  clusterSelectionMode: string | null; // cluster ID currently selecting placed tiles
  setClusterSelectionMode: (clusterId: string | null) => void;
  clusterPlacementMode: string | null; // cluster ID currently being stamped / placed on grid
  setClusterPlacementMode: (clusterId: string | null) => void;
  highlightedClusterId: string | null;
  setHighlightedClusterId: (clusterId: string | null) => void;
}

const CLUSTER_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#d946ef'
];

export const ClusterManager: React.FC<ClusterManagerProps> = ({
  tiles,
  setTiles,
  clusters,
  setClusters,
  isPro,
  onRequirePro,
  clusterSelectionMode,
  setClusterSelectionMode,
  clusterPlacementMode,
  setClusterPlacementMode,
  highlightedClusterId,
  setHighlightedClusterId,
}) => {
  const handleCreateCluster = () => {
    if (!isPro) {
      onRequirePro(
        'Cluster Feature',
        'Grouping tiles into cohesive clusters (up to 35 clusters, max 5 tiles per cluster) is a Pro Studio feature.'
      );
      return;
    }

    if (clusters.length >= 35) {
      alert('Maximum limit of 35 clusters reached.');
      return;
    }

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

  const handleDeleteCluster = (clusterId: string) => {
    // Unassign clusterId from tiles
    setTiles(prev => prev.map(t => t.clusterId === clusterId ? { ...t, clusterId: undefined } : t));
    setClusters(prev => prev.filter(c => c.id !== clusterId));
    if (clusterSelectionMode === clusterId) setClusterSelectionMode(null);
    if (clusterPlacementMode === clusterId) setClusterPlacementMode(null);
    if (highlightedClusterId === clusterId) setHighlightedClusterId(null);
  };

  const handleFinishClusterBuilding = () => {
    setClusterSelectionMode(null);
  };

  const handleStartPlacingCluster = (cluster: TileCluster) => {
    if (!isPro) {
      onRequirePro(
        'Place Cluster Feature',
        'Placing custom tile clusters onto the grid is a Pro Studio feature.'
      );
      return;
    }

    if (!cluster.items || cluster.items.length === 0) {
      alert(`Cluster "${cluster.name}" is empty. First select tiles placed on the grid to define this cluster.`);
      return;
    }

    if (clusterPlacementMode === cluster.id) {
      setClusterPlacementMode(null);
    } else {
      setClusterPlacementMode(cluster.id);
      setClusterSelectionMode(null);
    }
  };

  const activeBuildingCluster = clusters.find(c => c.id === clusterSelectionMode);
  const activePlacingCluster = clusters.find(c => c.id === clusterPlacementMode);

  return (
    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Tile Clusters</span>
          <span className="text-[10px] font-mono text-slate-400 font-normal">
            ({clusters.length}/35)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
          <button
            onClick={handleCreateCluster}
            disabled={clusters.length >= 35}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3 h-3" /> New Cluster
          </button>
        </div>
      </div>

      {/* Mode 1: Selecting tiles already placed on grid */}
      {clusterSelectionMode && activeBuildingCluster && (
        <div className="bg-amber-950/80 border border-amber-500/60 p-2.5 rounded-md space-y-1.5 animate-pulse">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
            <span>Group Tiles into {activeBuildingCluster.name}</span>
            <span className="font-mono bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-500/50 text-amber-200 font-bold">
              {activeBuildingCluster.tileIds.length}/5 Selected
            </span>
          </div>
          <p className="text-[10px] text-amber-300/90 leading-tight">
            Click tiles on grid to select/highlight them (max 5). Press <kbd className="bg-slate-900 border border-amber-500/50 px-1 rounded text-amber-200 font-mono font-bold">Ctrl + G</kbd> or click button below to save group.
          </p>
          <button
            onClick={handleFinishClusterBuilding}
            className="w-full bg-amber-500 text-slate-950 font-black text-[10px] py-1.5 rounded flex items-center justify-center gap-1.5 hover:bg-amber-400 cursor-pointer shadow-md transition-all uppercase tracking-wide"
          >
            <Check className="w-3.5 h-3.5" /> Group into Cluster (Ctrl + G)
          </button>
        </div>
      )}

      {/* Mode 2: Placing Cluster on Grid */}
      {clusterPlacementMode && activePlacingCluster && (
        <div className="bg-cyan-950/80 border border-cyan-500/60 p-2 rounded-md space-y-1.5 animate-pulse">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-200">
            <span className="flex items-center gap-1">
              <Stamp className="w-3.5 h-3.5 text-cyan-400" />
              Placing {activePlacingCluster.name} ({activePlacingCluster.items?.length || 0} tiles)
            </span>
          </div>
          <p className="text-[10px] text-cyan-300/90 leading-tight">
            Click on any grid position on the canvas to place/stamp this entire cluster onto the board.
          </p>
          <button
            onClick={() => setClusterPlacementMode(null)}
            className="w-full bg-cyan-500 text-slate-950 font-bold text-[10px] py-1 rounded flex items-center justify-center gap-1 hover:bg-cyan-400 cursor-pointer"
          >
            Done Placing Cluster
          </button>
        </div>
      )}

      {clusters.length === 0 ? (
        <p className="text-[10px] text-slate-500 italic py-1">
          No clusters created yet. Select tiles placed on the grid to form custom cohesive clusters (up to 35 clusters, max 5 tiles each).
        </p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {clusters.map(cluster => {
            const isBuilding = clusterSelectionMode === cluster.id;
            const isPlacing = clusterPlacementMode === cluster.id;
            const isHighlighted = highlightedClusterId === cluster.id;
            const tileCount = cluster.tileIds.length;

            return (
              <div
                key={cluster.id}
                className={`p-1.5 rounded border flex items-center justify-between text-xs transition-colors ${
                  isPlacing
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-lg'
                    : isBuilding
                    ? 'bg-amber-900/40 border-amber-500'
                    : isHighlighted
                    ? 'bg-slate-800 border-cyan-400'
                    : 'bg-slate-950/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <div className="truncate">
                    <span className="font-bold text-slate-200 truncate text-[11px] block leading-tight">{cluster.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 block leading-tight">
                      {tileCount}/5 tiles
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Select placed tiles */}
                  <button
                    onClick={() => {
                      setClusterSelectionMode(isBuilding ? null : cluster.id);
                      setClusterPlacementMode(null);
                    }}
                    title={isBuilding ? 'Done selecting' : 'Select tiles already on grid'}
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors ${
                      isBuilding
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isBuilding ? 'Done' : 'Select'}
                  </button>

                  {/* Place / Stamp Cluster on grid */}
                  <button
                    onClick={() => handleStartPlacingCluster(cluster)}
                    title="Place this Cluster on the grid"
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                      isPlacing
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-extrabold'
                        : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                    }`}
                  >
                    <Stamp className="w-2.5 h-2.5" />
                    <span>Place</span>
                  </button>

                  <button
                    onClick={() => setHighlightedClusterId(isHighlighted ? null : cluster.id)}
                    title="Highlight cluster tiles on board"
                    className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                      isHighlighted ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleDeleteCluster(cluster.id)}
                    title="Delete cluster definition"
                    className="p-1 rounded text-red-400 hover:bg-red-950/50 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
