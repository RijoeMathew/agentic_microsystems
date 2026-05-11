import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type MicrosystemStatus = 'Active' | 'Learning' | 'Queued';

type Microsystem = {
  id: string;
  name: string;
  icon: 'hub' | 'database' | 'routing' | 'insight' | 'shield' | 'signal';
  role: string;
  agent: string;
  api: string;
  status: MicrosystemStatus;
  latency: string;
  accentColor: string;
  position: {
    x: number;
    y: number;
  };
  connections: string[];
  description: string;
};

type MicrosystemPosition = Microsystem['position'];
type MicrosystemPositions = Record<string, MicrosystemPosition>;
type NetworkMode = 'view' | 'edit';
type NodeDragState = {
  id: string;
  hasMoved: boolean;
  pointerId: number;
  startX: number;
  startY: number;
};
type ConnectionDraft = {
  fromId: string;
  point: MicrosystemPosition;
  targetId: string | null;
};

const canvasGridSize = 22;
const canvasGridInset = 16;

const microsystems: Microsystem[] = [
  {
    id: 'orchestrator',
    name: 'Flow Core',
    icon: 'hub',
    role: 'Orchestration',
    agent: 'Coordinator Agent',
    api: '/api/demo/orchestrate',
    status: 'Active',
    latency: '42 ms',
    accentColor: '#38bdf8',
    position: { x: 50, y: 45 },
    connections: ['memory', 'routing', 'insight', 'guardrail'],
    description: 'Routes intent, assigns demo work, and keeps the micro-agent loop synchronized.',
  },
  {
    id: 'memory',
    name: 'Memory Mesh',
    icon: 'database',
    role: 'Context Store',
    agent: 'Recall Agent',
    api: '/api/demo/memory',
    status: 'Learning',
    latency: '58 ms',
    accentColor: '#a855f7',
    position: { x: 22, y: 28 },
    connections: ['orchestrator', 'insight', 'signal'],
    description: 'Simulates shared context, recent decisions, and reusable knowledge fragments.',
  },
  {
    id: 'routing',
    name: 'API Relay',
    icon: 'routing',
    role: 'Interface Layer',
    agent: 'Gateway Agent',
    api: '/api/demo/relay',
    status: 'Active',
    latency: '31 ms',
    accentColor: '#22c55e',
    position: { x: 78, y: 27 },
    connections: ['orchestrator', 'guardrail'],
    description: 'Represents future API handoffs between agents, services, and external tools.',
  },
  {
    id: 'insight',
    name: 'Insight Lab',
    icon: 'insight',
    role: 'Reasoning Cell',
    agent: 'Synthesis Agent',
    api: '/api/demo/insights',
    status: 'Active',
    latency: '64 ms',
    accentColor: '#f59e0b',
    position: { x: 30, y: 72 },
    connections: ['orchestrator', 'memory', 'signal'],
    description: 'Combines mock signals into a concise decision trail for the demo ecosystem.',
  },
  {
    id: 'guardrail',
    name: 'Trust Gate',
    icon: 'shield',
    role: 'Policy Check',
    agent: 'Safety Agent',
    api: '/api/demo/guardrails',
    status: 'Queued',
    latency: '77 ms',
    accentColor: '#fb7185',
    position: { x: 74, y: 72 },
    connections: ['orchestrator', 'routing', 'signal'],
    description: 'Models validation, policy checks, and release gates before a system acts.',
  },
  {
    id: 'signal',
    name: 'Signal Node',
    icon: 'signal',
    role: 'Telemetry',
    agent: 'Observer Agent',
    api: '/api/demo/signals',
    status: 'Learning',
    latency: '49 ms',
    accentColor: '#60a5fa',
    position: { x: 51, y: 86 },
    connections: ['memory', 'insight', 'guardrail'],
    description: 'Captures fictional health, usage, and feedback signals for future automation.',
  },
];

const initialPositions = microsystems.reduce<MicrosystemPositions>((positions, system) => {
  positions[system.id] = system.position;
  return positions;
}, {});

const initialConnectionIds = microsystems.flatMap((system) =>
  system.connections
    .filter((connectionId) => system.id < connectionId)
    .map((connectionId) => getConnectionId(system.id, connectionId)),
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getConnectionId(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join('__');
}

function getConnectionIdsForSystem(systemId: string, connectionIds: string[]) {
  return connectionIds
    .map((connectionId) => connectionId.split('__'))
    .filter(([firstId, secondId]) => firstId === systemId || secondId === systemId)
    .map(([firstId, secondId]) => (firstId === systemId ? secondId : firstId))
    .filter((id): id is string => Boolean(id));
}

function NodeIcon({ icon }: { icon: Microsystem['icon'] }) {
  switch (icon) {
    case 'hub':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" />
          <circle cx="5.5" cy="6.5" r="2" />
          <circle cx="18.5" cy="6.5" r="2" />
          <circle cx="6.5" cy="18" r="2" />
          <circle cx="17.5" cy="18" r="2" />
          <path d="M9.6 9.9 7.1 8.1M14.4 9.9l2.5-1.8M9.8 14.1l-2 2M14.2 14.1l2 2" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <ellipse cx="12" cy="6" rx="6.8" ry="3" />
          <path d="M5.2 6v6c0 1.7 3 3 6.8 3s6.8-1.3 6.8-3V6" />
          <path d="M5.2 12v5.2c0 1.7 3 3 6.8 3s6.8-1.3 6.8-3V12" />
        </svg>
      );
    case 'routing':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h9.5c2.2 0 3.5 1.2 3.5 3.2V18" />
          <path d="m14 4 3 3-3 3" />
          <path d="M4 17h7.5c1.9 0 3.1-1.1 3.1-3.1V6" />
          <path d="m17.8 15.2-2.8 2.8-2.8-2.8" />
        </svg>
      );
    case 'insight':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 16.8 9.1 12l3.2 2.6L18.8 7" />
          <path d="M17.2 7h1.6v1.6" />
          <path d="M6.3 6.4 7 4.2l.7 2.2 2.2.7-2.2.7L7 10l-.7-2.2-2.2-.7z" />
          <path d="M17.3 16.2 18 14l.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7z" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5 18.5 6v5.2c0 4.2-2.5 7.5-6.5 9.3-4-1.8-6.5-5.1-6.5-9.3V6z" />
          <path d="m8.8 12.1 2.1 2.1 4.5-4.7" />
        </svg>
      );
    case 'signal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="17" r="2.1" />
          <path d="M7.8 13.2a6 6 0 0 1 8.4 0" />
          <path d="M4.8 10.2a10.2 10.2 0 0 1 14.4 0" />
          <path d="M2.6 7.4a13.6 13.6 0 0 1 18.8 0" />
        </svg>
      );
  }
}

export function MicrosystemNetwork() {
  const networkRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<NodeDragState | null>(null);
  const suppressClickRef = useRef(false);
  const [mode, setMode] = useState<NetworkMode>('view');
  const [positions, setPositions] = useState<MicrosystemPositions>(initialPositions);
  const [connectionIds, setConnectionIds] = useState<string[]>(initialConnectionIds);
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const systems = useMemo(
    () =>
      microsystems.map((system) => ({
        ...system,
        connections: getConnectionIdsForSystem(system.id, connectionIds),
        position: positions[system.id] ?? system.position,
      })),
    [connectionIds, positions],
  );

  const connectionPairs = useMemo(
    () =>
      connectionIds
        .map((connectionId) => {
          const [fromId, toId] = connectionId.split('__');

          return {
            from: systems.find((system) => system.id === fromId),
            to: systems.find((system) => system.id === toId),
          };
        })
        .filter((pair): pair is { from: Microsystem; to: Microsystem } => Boolean(pair.from && pair.to)),
    [connectionIds, systems],
  );

  const connectionDraftSource = useMemo(
    () => systems.find((system) => system.id === connectionDraft?.fromId) ?? null,
    [connectionDraft, systems],
  );

  const selectedSystem = systems.find((system) => system.id === selectedId) ?? null;
  const activeSystem = selectedSystem ?? systems.find((system) => system.id === hoveredId) ?? systems[0];
  const connectedSystems = useMemo(
    () => {
      if (!selectedSystem) {
        return [];
      }

      return selectedSystem.connections
        .map((connectionId) => systems.find((system) => system.id === connectionId))
        .filter((system): system is Microsystem => Boolean(system));
    },
    [selectedSystem, systems],
  );

  function snapToCanvasGrid(value: number, edge: number, size: number) {
    const snappedValue = canvasGridInset + Math.round((value - canvasGridInset) / canvasGridSize) * canvasGridSize;
    return clamp(snappedValue, edge, size - edge);
  }

  function getCanvasPosition(clientX: number, clientY: number): MicrosystemPosition | null {
    const networkElement = networkRef.current;

    if (!networkElement) {
      return null;
    }

    const bounds = networkElement.getBoundingClientRect();

    return {
      x: clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((clientY - bounds.top) / bounds.height) * 100, 0, 100),
    };
  }

  function getNodeIdFromPoint(clientX: number, clientY: number) {
    const target = document.elementFromPoint(clientX, clientY);
    const node = target?.closest<HTMLButtonElement>('.network-node');

    return node?.dataset.nodeId ?? null;
  }

  function updateNodePosition(id: string, clientX: number, clientY: number) {
    const networkElement = networkRef.current;
    const nodeElement = networkElement?.querySelector<HTMLButtonElement>(`[data-node-id="${id}"]`);

    if (!networkElement || !nodeElement) {
      return;
    }

    const bounds = networkElement.getBoundingClientRect();
    const edgeX = nodeElement.offsetWidth / 2;
    const edgeY = nodeElement.offsetHeight / 2;
    const localX = clientX - bounds.left;
    const localY = clientY - bounds.top;
    const snappedX = snapToCanvasGrid(localX, edgeX, bounds.width);
    const snappedY = snapToCanvasGrid(localY, edgeY, bounds.height);
    const nextPosition = {
      x: (snappedX / bounds.width) * 100,
      y: (snappedY / bounds.height) * 100,
    };

    setPositions((currentPositions) => ({
      ...currentPositions,
      [id]: nextPosition,
    }));
  }

  function handleNodePointerDown(id: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (mode !== 'edit') {
      return;
    }

    if (event.button === 2) {
      const point = getCanvasPosition(event.clientX, event.clientY);

      if (!point) {
        return;
      }

      event.preventDefault();
      setSelectedId(null);
      setConnectionDraft({ fromId: id, point, targetId: null });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      id,
      hasMoved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleNodePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (connectionDraft && event.buttons === 2) {
      const point = getCanvasPosition(event.clientX, event.clientY);

      if (!point) {
        return;
      }

      const targetId = getNodeIdFromPoint(event.clientX, event.clientY);
      setConnectionDraft({
        ...connectionDraft,
        point,
        targetId: targetId && targetId !== connectionDraft.fromId ? targetId : null,
      });
      return;
    }

    if (mode !== 'edit') {
      return;
    }

    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.hasMoved && Math.hypot(deltaX, deltaY) < 4) {
      return;
    }

    dragState.hasMoved = true;
    setDraggingId(dragState.id);
    setSelectedId(null);
    updateNodePosition(dragState.id, event.clientX, event.clientY);
  }

  function finishNodePointerInteraction(event: ReactPointerEvent<HTMLButtonElement>) {
    if (connectionDraft) {
      const targetId = getNodeIdFromPoint(event.clientX, event.clientY);

      if (targetId && targetId !== connectionDraft.fromId) {
        const nextConnectionId = getConnectionId(connectionDraft.fromId, targetId);

        setConnectionIds((currentConnectionIds) =>
          currentConnectionIds.includes(nextConnectionId)
            ? currentConnectionIds.filter((connectionId) => connectionId !== nextConnectionId)
            : [...currentConnectionIds, nextConnectionId],
        );
      }

      setConnectionDraft(null);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      return;
    }

    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (dragState.hasMoved) {
      updateNodePosition(dragState.id, event.clientX, event.clientY);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragStateRef.current = null;
    setDraggingId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (event.target.closest('.network-node, .network-popover')) {
        return;
      }

      setSelectedId(null);
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const popoverHorizontal = selectedSystem && selectedSystem.position.x > 50 ? 'west' : 'east';
  const popoverVertical = selectedSystem && selectedSystem.position.y > 50 ? 'north' : 'south';

  return (
    <section
      ref={networkRef}
      className={`microsystem-network microsystem-network-${mode}`}
      aria-label="Interactive microsystem demo"
      onContextMenu={(event) => {
        if (mode === 'edit') {
          event.preventDefault();
        }
      }}
    >
      <div className="network-mode-toggle" role="group" aria-label="Network mode">
        <button
          type="button"
          className={
            mode === 'view'
              ? 'network-mode-button network-mode-button-view network-mode-button-active'
              : 'network-mode-button network-mode-button-view'
          }
          aria-pressed={mode === 'view'}
          onClick={() => {
            setMode('view');
            setConnectionDraft(null);
            setDraggingId(null);
          }}
        >
          View
        </button>
        <button
          type="button"
          className={
            mode === 'edit'
              ? 'network-mode-button network-mode-button-edit network-mode-button-active'
              : 'network-mode-button network-mode-button-edit'
          }
          aria-pressed={mode === 'edit'}
          onClick={() => {
            setMode('edit');
            setSelectedId(null);
          }}
        >
          Edit
        </button>
      </div>

      <div className="network-orbit network-orbit-a"></div>
      <div className="network-orbit network-orbit-b"></div>

      <svg className="network-lines" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <filter id="connectionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.25" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connectionPairs.map(({ from, to }, index) => {
          const isActive =
            from.id === selectedId ||
            to.id === selectedId ||
            from.id === hoveredId ||
            to.id === hoveredId;
          const flowColor = isActive ? activeSystem.accentColor : 'rgba(125, 211, 252, 0.5)';

          return (
            <g key={`${from.id}-${to.id}`}>
              <line
                x1={from.position.x}
                y1={from.position.y}
                x2={to.position.x}
                y2={to.position.y}
                className={isActive ? 'network-line-base network-line-base-active' : 'network-line-base'}
                stroke={isActive ? activeSystem.accentColor : 'rgba(125, 211, 252, 0.34)'}
              />

              <motion.line
                x1={from.position.x}
                y1={from.position.y}
                x2={to.position.x}
                y2={to.position.y}
                className={isActive ? 'network-line network-line-active' : 'network-line'}
                stroke={isActive ? activeSystem.accentColor : 'rgba(226, 246, 255, 0.48)'}
                filter={isActive ? 'url(#connectionGlow)' : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isActive ? 0.95 : 0.58 }}
                transition={{ delay: index * 0.08, duration: 0.9, ease: 'easeOut' }}
              />

              <motion.circle
                className={isActive ? 'network-flow-particle network-flow-particle-active' : 'network-flow-particle'}
                r={isActive ? 1.15 : 0.75}
                fill={flowColor}
                filter={isActive ? 'url(#connectionGlow)' : undefined}
                initial={{
                  cx: from.position.x,
                  cy: from.position.y,
                  opacity: 0,
                }}
                animate={{
                  cx: [from.position.x, to.position.x],
                  cy: [from.position.y, to.position.y],
                  opacity: isActive ? [0, 1, 1, 0] : [0, 0.55, 0.55, 0],
                }}
                transition={{
                  delay: index * 0.18,
                  duration: isActive ? 1.7 : 3.1,
                  ease: 'linear',
                  repeat: Infinity,
                  repeatDelay: isActive ? 0.35 : 1.2,
                }}
              />

              <motion.circle
                className="network-flow-particle network-flow-particle-return"
                r={isActive ? 0.85 : 0.55}
                fill={flowColor}
                initial={{
                  cx: to.position.x,
                  cy: to.position.y,
                  opacity: 0,
                }}
                animate={{
                  cx: [to.position.x, from.position.x],
                  cy: [to.position.y, from.position.y],
                  opacity: isActive ? [0, 0.78, 0.78, 0] : [0, 0.32, 0.32, 0],
                }}
                transition={{
                  delay: 0.85 + index * 0.18,
                  duration: isActive ? 2.2 : 4,
                  ease: 'linear',
                  repeat: Infinity,
                  repeatDelay: isActive ? 0.45 : 1.5,
                }}
              />
            </g>
          );
        })}

        {connectionDraft && connectionDraftSource && (
          <line
            x1={connectionDraftSource.position.x}
            y1={connectionDraftSource.position.y}
            x2={connectionDraft.point.x}
            y2={connectionDraft.point.y}
            className={connectionDraft.targetId ? 'network-draft-line network-draft-line-target' : 'network-draft-line'}
          />
        )}
      </svg>

      {systems.map((system, index) => {
        const isSelected = system.id === selectedId;
        const isDragging = system.id === draggingId;

        return (
          <motion.button
            key={system.id}
            type="button"
            data-node-id={system.id}
            className={[
              'network-node',
              isSelected ? 'network-node-selected' : '',
              isDragging ? 'network-node-dragging' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              left: `${system.position.x}%`,
              top: `${system.position.y}%`,
              '--node-color': system.accentColor,
            } as CSSProperties}
            aria-pressed={isSelected}
            aria-label={`${system.name}, ${system.role}`}
            onClick={() => {
              if (suppressClickRef.current) {
                return;
              }

              setSelectedId(system.id);
            }}
            onPointerDown={(event) => handleNodePointerDown(system.id, event)}
            onPointerMove={handleNodePointerMove}
            onPointerUp={finishNodePointerInteraction}
            onPointerCancel={finishNodePointerInteraction}
            onContextMenu={(event) => {
              if (mode === 'edit') {
                event.preventDefault();
              }
            }}
            onMouseEnter={() => setHoveredId(system.id)}
            onMouseLeave={() => setHoveredId(null)}
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.08, type: 'spring', stiffness: 180, damping: 16 }}
          >
            <span className="node-pulse"></span>
            <span className="node-core">
              <NodeIcon icon={system.icon} />
            </span>
            <span className="node-label">{system.name}</span>
          </motion.button>
        );
      })}

      {selectedSystem && (
        <motion.article
          key={selectedSystem.id}
          className={`network-popover network-popover-${popoverHorizontal} network-popover-${popoverVertical}`}
          style={{
            '--popover-color': selectedSystem.accentColor,
          } as CSSProperties}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="popover-topline">
            <span className="popover-role">{selectedSystem.role}</span>
            <span className={`popover-status status-${selectedSystem.status.toLowerCase()}`}>
              {selectedSystem.status}
            </span>
          </div>
          <h2>{selectedSystem.name}</h2>
          <p>{selectedSystem.description}</p>

          <dl className="popover-details">
            <div>
              <dt>Agent</dt>
              <dd>{selectedSystem.agent}</dd>
            </div>
            <div>
              <dt>API</dt>
              <dd>{selectedSystem.api}</dd>
            </div>
            <div>
              <dt>Latency</dt>
              <dd>{selectedSystem.latency}</dd>
            </div>
            <div>
              <dt>Links</dt>
              <dd>{connectedSystems.length} systems</dd>
            </div>
          </dl>

          <div className="popover-connections" aria-label="Connected systems">
            {connectedSystems.map((system) => (
              <span key={system.id}>{system.name}</span>
            ))}
          </div>
        </motion.article>
      )}
    </section>
  );
}
