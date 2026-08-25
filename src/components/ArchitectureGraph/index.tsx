import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Graph, GraphNode } from '../../lib/graph';
import NodeDetailPanel from '../NodeDetailPanel';
import './styles.css';

interface Props {
  graph: Graph;
}

const typeColor: Record<GraphNode['type'], string> = {
  architecture: '#2563eb',
  technology: '#7c3aed',
  concept: '#059669',
};

export default function ArchitectureGraph({ graph }: Props) {
  const nodesById = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of graph.nodes) map.set(n.id, n);
    return map;
  }, [graph]);

  const nodesByIdRecord = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, { id: n.id, name: n.name }])),
    [graph]
  );

  const rootIds = useMemo(
    () => graph.nodes.filter((n) => n.parent.length === 0).map((n) => n.id),
    [graph]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(rootIds));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleNodes = useMemo(
    () =>
      graph.nodes.filter(
        (n) => n.parent.length === 0 || n.parent.some((p) => expandedIds.has(p))
      ),
    [graph, expandedIds]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const flowNodes: Node[] = useMemo(
    () =>
      visibleNodes.map((n) => ({
        id: n.id,
        position: { x: n.x ?? 0, y: n.y ?? 0 },
        data: { label: n.name },
        style: {
          border: `2px solid ${typeColor[n.type]}`,
          borderRadius: 8,
          padding: 10,
          background: n.id === selectedId ? typeColor[n.type] : '#fff',
          color: n.id === selectedId ? '#fff' : '#1e293b',
          fontWeight: n.type === 'architecture' ? 700 : 500,
          fontSize: n.type === 'concept' ? 12 : 14,
        },
      })),
    [visibleNodes, selectedId]
  );

  const flowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const relatedSeen = new Set<string>();

    for (const n of visibleNodes) {
      for (const childId of n.children) {
        if (visibleIds.has(childId)) {
          edges.push({
            id: `parent-${n.id}-${childId}`,
            source: n.id,
            target: childId,
            type: 'smoothstep',
          });
        }
      }
      for (const relId of n.related) {
        if (!visibleIds.has(relId)) continue;
        const key = [n.id, relId].sort().join('|');
        if (relatedSeen.has(key)) continue;
        relatedSeen.add(key);
        edges.push({
          id: `related-${key}`,
          source: n.id,
          target: relId,
          style: { strokeDasharray: '4 4' },
        });
      }
    }
    return edges;
  }, [visibleNodes, visibleIds]);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      setSelectedId(node.id);
      const graphNode = nodesById.get(node.id);
      if (graphNode && graphNode.children.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(node.id)) {
            next.delete(node.id);
          } else {
            next.add(node.id);
          }
          return next;
        });
      }
    },
    [nodesById]
  );

  const selectedNode = selectedId ? nodesById.get(selectedId) ?? null : null;

  return (
    <div className="architecture-graph">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          nodesById={nodesByIdRecord}
          onClose={() => setSelectedId(null)}
          onSelectRelated={(id) => setSelectedId(id)}
        />
      )}
    </div>
  );
}
