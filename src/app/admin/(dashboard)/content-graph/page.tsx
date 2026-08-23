"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Share2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Info,
  ExternalLink,
  Layers,
  BookOpen,
  FolderTree,
  User,
  Tags,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { ContentGraphData, GraphNode, GraphLink } from "@/lib/content-graph";

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function ContentGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<ContentGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [includeTags, setIncludeTags] = useState(true);

  // Pan & Zoom state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content-graph?includeTags=${includeTags}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
        initSimulation(json.nodes || [], json.links || []);
      } else {
        toast.error(json.error || "Failed to load graph");
      }
    } catch (err: any) {
      console.error("Fetch graph error:", err);
      toast.error("Network error while connecting to graph API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [includeTags]);

  const initSimulation = (nodes: GraphNode[], links: GraphLink[]) => {
    const width = 900;
    const height = 650;

    // Initialize positions in a circle/spread
    const simNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = 180 + (i % 3) * 60;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      };
    });

    simNodesRef.current = simNodes;
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  // Run Physics Simulation loop on Canvas
  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodeMap = new Map<string, SimNode>();
    simNodesRef.current.forEach((n) => nodeMap.set(n.id, n));

    let iteration = 0;

    const render = () => {
      const { x: panX, y: panY, scale } = transformRef.current;
      const simNodes = simNodesRef.current;
      const links = data.links;

      // Physics steps (cooling down)
      if (iteration < 250 || draggedNodeRef.current) {
        iteration++;
        const alpha = Math.max(0.01, 1 - iteration / 250);

        // Repulsion between nodes
        for (let i = 0; i < simNodes.length; i++) {
          for (let j = i + 1; j < simNodes.length; j++) {
            const n1 = simNodes[i];
            const n2 = simNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 220) {
              const force = (800 / distSq) * alpha;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              n1.vx -= fx;
              n1.vy -= fy;
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        // Attraction along links
        for (const link of links) {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target) continue;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = link.type === "series" ? 70 : link.type === "author" ? 90 : 120;
          const force = (dist - desiredDist) * 0.05 * alpha;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }

        // Center gravity and velocity damping
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        for (const n of simNodes) {
          if (n === draggedNodeRef.current) continue;

          n.vx += (cx - n.x) * 0.002 * alpha;
          n.vy += (cy - n.y) * 0.002 * alpha;

          n.vx *= 0.85;
          n.vy *= 0.85;

          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // Draw frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

      // 1. Draw Links
      for (const link of links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (link.type === "series") {
          ctx.strokeStyle = "rgba(140, 47, 31, 0.4)"; // Vermilion
          ctx.lineWidth = 2;
        } else if (link.type === "author") {
          ctx.strokeStyle = "rgba(193, 68, 14, 0.35)"; // Ember
          ctx.lineWidth = 1.5;
        } else if (link.type === "recommendation") {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.4)"; // Emerald
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = "rgba(138, 127, 110, 0.2)"; // Rule
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Draw Nodes
      for (const n of simNodes) {
        const isSelected = selectedNode?.id === n.id;
        const radius = n.val;

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);

        if (n.type === "piece") {
          ctx.fillStyle = n.group === "DOCUMENTARY" ? "#C1440E" : "#8C2F1F";
        } else if (n.type === "series") {
          ctx.fillStyle = "#1F1B16";
        } else if (n.type === "author") {
          ctx.fillStyle = "#B4573F";
        } else {
          ctx.fillStyle = "#8A7F6E";
        }

        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#8C2F1F";
          ctx.lineWidth = 3;
          ctx.stroke();

          // Outer pulse ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 5, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(140, 47, 31, 0.5)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Draw Labels
        ctx.fillStyle = isSelected ? "#8C2F1F" : "#1F1B16";
        ctx.font = isSelected
          ? "bold 11px system-ui, serif"
          : "10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          n.name.length > 18 ? n.name.slice(0, 16) + "…" : n.name,
          n.x,
          n.y + radius + 12
        );
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [data, selectedNode]);

  // Handle Mouse Events for Pan/Zoom/Drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: panX, y: panY, scale } = transformRef.current;
    const graphX = (mouseX - panX) / scale;
    const graphY = (mouseY - panY) / scale;

    // Check if clicked a node
    for (const n of simNodesRef.current) {
      const dist = Math.hypot(n.x - graphX, n.y - graphY);
      if (dist <= n.val + 4) {
        draggedNodeRef.current = n;
        setSelectedNode(n);
        return;
      }
    }

    // Otherwise pan the canvas
    isDraggingRef.current = true;
    dragStartRef.current = { x: mouseX - panX, y: mouseY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedNodeRef.current) {
      const { x: panX, y: panY, scale } = transformRef.current;
      draggedNodeRef.current.x = (mouseX - panX) / scale;
      draggedNodeRef.current.y = (mouseY - panY) / scale;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      transformRef.current.x = mouseX - dragStartRef.current.x;
      transformRef.current.y = mouseY - dragStartRef.current.y;
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.3, Math.min(3, transformRef.current.scale * zoomFactor));
    transformRef.current.scale = newScale;
  };

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-accent">
            Editorial OS &bull; Knowledge Graph
          </span>
          <h1 className="font-serif text-2xl font-normal text-content mt-1">
            Content Relationship Graph
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1 max-w-2xl">
            Interactive topology mapping interconnected articles, serial installments, literary figures, and taxonomy hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchGraph}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content-soft hover:text-content hover:border-accent/40 transition"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-accent")} />
            Reset Layout
          </button>
        </div>
      </div>

      {/* Stats and Controls Strip */}
      {data && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          <div className="flex items-center gap-4 font-mono text-[11px] text-content-faint">
            <span>{data.stats.pieceCount} Pieces</span>
            <span>&bull;</span>
            <span>{data.stats.seriesCount} Series</span>
            <span>&bull;</span>
            <span>{data.stats.authorCount} Authors</span>
            <span>&bull;</span>
            <span>{data.stats.tagCount} Tags</span>
            <span>&bull;</span>
            <span>{data.stats.totalConnections} Links</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-content-soft">
              <input
                type="checkbox"
                checked={includeTags}
                onChange={(e) => setIncludeTags(e.target.checked)}
                className="rounded text-accent focus:ring-0"
              />
              <span>Include Tags</span>
            </label>

            {/* Legend */}
            <div className="flex items-center gap-3 pl-2 border-l border-rule">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8C2F1F]" /> Piece
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1F1B16]" /> Series
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#B4573F]" /> Author
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8A7F6E]" /> Tag
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Graph Canvas Viewport */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Canvas Area (8 or 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 relative rounded-sm border border-rule bg-journal-paper dark:bg-archive-panel overflow-hidden h-[620px]">
          <canvas
            ref={canvasRef}
            width={900}
            height={620}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          />

          {!loading && data && data.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-surface/80 backdrop-blur-xs">
              <Share2 className="h-10 w-10 text-accent mb-3 opacity-80" />
              <h3 className="font-serif text-base text-content">No Published Content Nodes Yet</h3>
              <p className="font-sans text-xs text-content-soft mt-1 max-w-sm">
                Create and publish essays, documentary pieces, and series to see the interactive knowledge graph populate.
              </p>
              <Link
                href="/admin/pieces/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-white hover:bg-accent/90 transition"
              >
                Create First Piece
              </Link>
            </div>
          )}

          {/* Floating Canvas Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-surface/90 backdrop-blur rounded border border-rule p-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                transformRef.current.scale = Math.min(3, transformRef.current.scale * 1.2);
              }}
              className="p-1.5 text-content-soft hover:text-content hover:bg-surface-raised rounded"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                transformRef.current.scale = Math.max(0.3, transformRef.current.scale * 0.8);
              }}
              className="p-1.5 text-content-soft hover:text-content hover:bg-surface-raised rounded"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1.5 text-content-soft hover:text-content hover:bg-surface-raised rounded"
              title="Reset View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selected Node Details Panel (4 or 3 cols) */}
        <div className="lg:col-span-4 xl:col-span-3 rounded-sm border border-rule bg-surface-raised p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-rule pb-3">
            <Info className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-sm font-semibold text-content">
              Node Inspector
            </h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
                  {selectedNode.type} &bull; {selectedNode.group}
                </span>
                <h4 className="font-bengali text-lg font-bold text-content mt-1 leading-snug" lang="bn">
                  {selectedNode.name}
                </h4>
              </div>

              {selectedNode.details && (
                <div className="rounded bg-surface p-3 border border-rule/60 space-y-2 font-mono text-[11px]">
                  {selectedNode.details.kind && (
                    <div className="flex justify-between">
                      <span className="text-content-faint">Kind:</span>
                      <span className="font-semibold text-content">{selectedNode.details.kind}</span>
                    </div>
                  )}
                  {selectedNode.details.views !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-content-faint">Views:</span>
                      <span className="font-semibold text-accent">{selectedNode.details.views}</span>
                    </div>
                  )}
                  {selectedNode.details.era && (
                    <div className="flex justify-between">
                      <span className="text-content-faint">Era:</span>
                      <span className="font-semibold text-content">{selectedNode.details.era}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-rule space-y-2">
                {selectedNode.type === "piece" && (
                  <Link
                    href={`/admin/pieces/${selectedNode.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-accent px-3 py-2 font-medium text-white hover:bg-accent/90 transition"
                  >
                    Open in Piece Editor <ExternalLink className="h-3 w-3" />
                  </Link>
                )}

                {selectedNode.type === "series" && (
                  <Link
                    href="/admin/series"
                    className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-rule bg-surface px-3 py-2 text-content hover:border-accent transition"
                  >
                    Manage Series <ExternalLink className="h-3 w-3" />
                  </Link>
                )}

                {selectedNode.type === "author" && (
                  <Link
                    href="/admin/taxonomy"
                    className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-rule bg-surface px-3 py-2 text-content hover:border-accent transition"
                  >
                    View in Taxonomy <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-content-faint space-y-2">
              <Share2 className="h-6 w-6 text-content-faint mx-auto opacity-60" />
              <p>Click any node in the relationship graph to inspect its taxonomy links and metadata.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
