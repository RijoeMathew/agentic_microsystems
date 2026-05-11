import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type MicrosystemStatus = 'Active' | 'Learning' | 'Queued';

type Microsystem = {
  id: string;
  name: string;
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

const microsystems: Microsystem[] = [
  {
    id: 'orchestrator',
    name: 'Flow Core',
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

const connectionPairs = microsystems.flatMap((system) =>
  system.connections
    .filter((connectionId) => system.id < connectionId)
    .map((connectionId) => ({
      from: system,
      to: microsystems.find((item) => item.id === connectionId),
    }))
    .filter((pair): pair is { from: Microsystem; to: Microsystem } => Boolean(pair.to)),
);

export function MicrosystemNetwork() {
  const [selectedId, setSelectedId] = useState<string | null>('orchestrator');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedSystem = microsystems.find((system) => system.id === selectedId) ?? null;
  const activeSystem = selectedSystem ?? microsystems.find((system) => system.id === hoveredId) ?? microsystems[0];
  const connectedSystems = useMemo(
    () => {
      if (!selectedSystem) {
        return [];
      }

      return selectedSystem.connections
        .map((connectionId) => microsystems.find((system) => system.id === connectionId))
        .filter((system): system is Microsystem => Boolean(system));
    },
    [selectedSystem],
  );

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
    <section className="microsystem-network" aria-label="Interactive microsystem demo">
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
              <motion.line
                x1={from.position.x}
                y1={from.position.y}
                x2={to.position.x}
                y2={to.position.y}
                className={isActive ? 'network-line network-line-active' : 'network-line'}
                stroke={isActive ? activeSystem.accentColor : 'rgba(255,255,255,0.2)'}
                filter={isActive ? 'url(#connectionGlow)' : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isActive ? 0.95 : 0.42 }}
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
      </svg>

      {microsystems.map((system, index) => {
        const isSelected = system.id === selectedId;

        return (
          <motion.button
            key={system.id}
            type="button"
            className={isSelected ? 'network-node network-node-selected' : 'network-node'}
            style={{
              left: `${system.position.x}%`,
              top: `${system.position.y}%`,
              '--node-color': system.accentColor,
            } as CSSProperties}
            aria-pressed={isSelected}
            aria-label={`${system.name}, ${system.role}`}
            onClick={() => setSelectedId(system.id)}
            onMouseEnter={() => setHoveredId(system.id)}
            onMouseLeave={() => setHoveredId(null)}
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.08, type: 'spring', stiffness: 180, damping: 16 }}
          >
            <span className="node-pulse"></span>
            <span className="node-core"></span>
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
