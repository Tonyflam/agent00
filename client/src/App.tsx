import { useState, useEffect, useCallback } from 'react';
import { fetchDashboard, fetchBlockchainStatus, createWebSocket, executeTask, startDemo, stopDemo } from './lib/api';
import type { DashboardData, SessionData, NegotiationMsg, BlockchainStatus } from './lib/api';

// ═══════════════════════════════════════════════════════
//                    ICONS (inline SVG)
// ═══════════════════════════════════════════════════════

function IconBot({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;
}
function IconZap({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>;
}
function IconChart({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
}
function IconShield({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>;
}
function IconGlobe({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
}
function IconPlay({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>;
}
function IconStop({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>;
}
function IconClock({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function IconSend({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>;
}

// ═══════════════════════════════════════════════════════
//                    MAIN APP
// ═══════════════════════════════════════════════════════

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [blockchain, setBlockchain] = useState<BlockchainStatus | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'agents' | 'activity' | 'execute'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [wsEvents, setWsEvents] = useState<any[]>([]);
  const [demoRunning, setDemoRunning] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);

  // Fetch dashboard data
  const loadData = useCallback(async () => {
    try {
      const [result, chain] = await Promise.all([fetchDashboard(), fetchBlockchainStatus()]);
      setData(result);
      setBlockchain(chain);
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = createWebSocket();
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            setWsEvents(prev => [msg, ...prev].slice(0, 50));
            // Auto-refresh on important events
            if (['session:completed', 'session:created'].includes(msg.event)) {
              loadData();
            }
          } catch {}
        };
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch {}
    };
    connect();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <h2 className="text-xl font-bold gradient-text">Loading NEXUS Network...</h2>
          <p className="text-gray-500 mt-2">Connecting to agent commerce mesh</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-t-0 border-x-0 rounded-none px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <IconZap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text tracking-tight">NEXUS</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Agent Commerce Protocol</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex gap-1 bg-gray-900/50 p-1 rounded-xl">
            {[
              { id: 'dashboard' as const, label: 'Dashboard', icon: <IconChart className="w-4 h-4" /> },
              { id: 'agents' as const, label: 'Agents', icon: <IconBot className="w-4 h-4" /> },
              { id: 'activity' as const, label: 'Activity', icon: <IconGlobe className="w-4 h-4" /> },
              { id: 'execute' as const, label: 'Execute', icon: <IconSend className="w-4 h-4" /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 shadow-inner'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Protocol badges */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="pill-cyan">x402</span>
            <span className="pill-purple">A2A</span>
            <span className="pill-green">ERC-8004</span>
            <span className="pill-amber">SKALE</span>
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <div className="flex items-center gap-1.5">
              <div className={`status-dot ${demoRunning ? 'status-active' : 'status-offline'}`} />
              <span className="text-xs text-gray-400">{demoRunning ? 'Live' : 'Paused'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto p-6">
        {tab === 'dashboard' && data && (
          <DashboardView
            data={data}
            blockchain={blockchain}
            events={wsEvents}
            demoRunning={demoRunning}
            onToggleDemo={async () => {
              if (demoRunning) {
                await stopDemo();
              } else {
                await startDemo(12000);
              }
              setDemoRunning(!demoRunning);
            }}
            onSelectSession={setSelectedSession}
          />
        )}
        {tab === 'agents' && data && <AgentsView agents={data.agents} />}
        {tab === 'activity' && data && (
          <ActivityView
            sessions={data.recentSessions}
            payments={data.recentPayments}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
          />
        )}
        {tab === 'execute' && <ExecuteView onComplete={loadData} />}
      </main>

      {/* Negotiation Modal */}
      {selectedSession && (
        <NegotiationModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//                  DASHBOARD VIEW
// ═══════════════════════════════════════════════════════

function DashboardView({
  data, blockchain, events, demoRunning, onToggleDemo, onSelectSession,
}: {
  data: DashboardData;
  blockchain: BlockchainStatus | null;
  events: any[];
  demoRunning: boolean;
  onToggleDemo: () => void;
  onSelectSession: (s: SessionData) => void;
}) {
  const o = data.overview;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Active Agents" value={o.activeAgents} icon={<IconBot className="w-5 h-5 text-cyan-400" />} color="cyan" />
        <StatCard label="Total Skills" value={o.totalSkills} icon={<IconZap className="w-5 h-5 text-purple-400" />} color="purple" />
        <StatCard label="Reputation" value={`${o.averageReputation}%`} icon={<IconShield className="w-5 h-5 text-emerald-400" />} color="green" />
        <StatCard label="Transactions" value={o.totalTransactions} icon={<IconChart className="w-5 h-5 text-amber-400" />} color="amber" />
        <StatCard label="Sessions" value={o.completedSessions} icon={<IconGlobe className="w-5 h-5 text-blue-400" />} color="blue" />
        <StatCard label="Volume" value={`$${o.totalVolume}`} icon={<IconZap className="w-5 h-5 text-pink-400" />} color="pink" />
      </div>

      {/* Demo Control + Protocol Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white">Autonomous Commerce Demo</h3>
              <p className="text-xs text-gray-400 mt-1">AI agents discovering, negotiating, paying, and delivering services autonomously</p>
            </div>
            <button onClick={onToggleDemo} className={demoRunning ? 'btn-secondary' : 'btn-primary'}>
              {demoRunning ? <><IconStop className="w-4 h-4 inline mr-1" /> Pause</> : <><IconPlay className="w-4 h-4 inline mr-1" /> Start</>}
            </button>
          </div>
          
          {/* Live Event Feed */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <IconBot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Waiting for agent activity...</p>
              </div>
            ) : (
              events.slice(0, 8).map((evt, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-800/30 animate-slide-in">
                  <div className={`mt-0.5 status-dot ${
                    evt.event?.includes('completed') ? 'status-active' :
                    evt.event?.includes('failed') ? 'bg-red-400 shadow-red-400/50' :
                    'status-busy'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-300 truncate">
                      {formatEventName(evt.event)}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {evt.data?.taskDescription || evt.data?.message?.content || evt.data?.id?.slice(0, 8) || 'Processing...'}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-600 whitespace-nowrap">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-bold text-white mb-4">Protocol Stack</h3>
          <div className="space-y-3">
            <ProtocolRow name="x402" status="active" detail="HTTP-native payments" color="cyan" />
            <ProtocolRow name="A2A" status="active" detail="Agent discovery (Google)" color="purple" />
            <ProtocolRow name="ERC-8004" status="active" detail="Identity + Reputation" color="green" />
            <ProtocolRow name="SKALE" status="active" detail="Gasless blockchain" color="amber" />
            <ProtocolRow name="Gemini AI" status="active" detail="Agent intelligence" color="pink" />
            <ProtocolRow name="MCP" status="active" detail="AI IDE integration" color="blue" />
          </div>
          {blockchain && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SKALE Blockchain</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span className={blockchain.connected ? 'text-emerald-400' : 'text-red-400'}>
                    {blockchain.connected ? '● Connected' : '○ Disconnected'}
                  </span>
                </div>
                {blockchain.chainId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Chain ID</span>
                    <span className="text-gray-300 font-mono">{blockchain.chainId}</span>
                  </div>
                )}
                {blockchain.blockNumber && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Block</span>
                    <span className="text-gray-300 font-mono">#{blockchain.blockNumber.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Contracts</span>
                  <span className="text-gray-300">
                    {Object.values(blockchain.contracts).filter(c => c.deployed).length}/3 deployed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Overview + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-bold text-white mb-4">Agent Network</h3>
          <div className="space-y-3">
            {data.agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-gray-700/50">
                  <IconBot className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">{agent.name}</span>
                    <div className={`status-dot ${agent.status === 'active' ? 'status-active' : 'status-busy'}`} />
                    {agent.erc8004Id && <span className="text-[10px] text-gray-500">#{agent.erc8004Id}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {agent.skills.slice(0, 2).map(s => (
                      <span key={s.id} className="text-[10px] text-gray-500">{s.name}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">{agent.reputation.score}%</div>
                  <div className="text-[10px] text-gray-500">{agent.transactions} txns</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-bold text-white mb-4">Recent Commerce Sessions</h3>
          <div className="space-y-2">
            {data.recentSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <IconClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sessions yet. Start the demo!</p>
              </div>
            ) : (
              data.recentSessions.slice(0, 6).map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className="w-full text-left p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-200 truncate flex-1 mr-2">
                      {session.taskDescription.slice(0, 50)}...
                    </span>
                    <SessionStatusBadge status={session.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {session.agreedPrice && (
                      <span className="text-xs text-cyan-400">${session.agreedPrice.toFixed(4)}</span>
                    )}
                    <span className="text-xs text-gray-500">{session.negotiation?.length || 0} msgs</span>
                    {session.duration && (
                      <span className="text-xs text-gray-500">{(session.duration / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//                   AGENTS VIEW
// ═══════════════════════════════════════════════════════

function AgentsView({ agents }: { agents: DashboardData['agents'] }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Agent Registry</h2>
          <p className="text-sm text-gray-400 mt-1">ERC-8004 registered agents with A2A discovery cards</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill-green">{agents.filter(a => a.status === 'active').length} Active</span>
          <span className="pill-cyan">{agents.length} Total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card-hover p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
                {agent.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{agent.name}</h3>
                  <div className={`status-dot ${agent.status === 'active' ? 'status-active' : 'status-busy'}`} />
                </div>
                {agent.erc8004Id && (
                  <span className="text-[10px] text-gray-500">ERC-8004 Agent #{agent.erc8004Id} · SKALE BITE V2</span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{agent.description}</p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {agent.skills.map(skill => (
                <span key={skill.id} className="pill-cyan">
                  {skill.name} · {skill.price}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-800/50">
              <div>
                <div className="text-lg font-bold text-emerald-400">{agent.reputation.score}%</div>
                <div className="text-[10px] text-gray-500">Reputation</div>
              </div>
              <div>
                <div className="text-lg font-bold text-cyan-400">{agent.transactions}</div>
                <div className="text-[10px] text-gray-500">Transactions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">${agent.earnings}</div>
                <div className="text-[10px] text-gray-500">Earnings</div>
              </div>
            </div>

            {/* Protocol badges */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-800/50">
              <span className="text-[10px] text-gray-500">Protocols:</span>
              <span className="pill bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">x402</span>
              <span className="pill bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">A2A</span>
              <span className="pill bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">ERC-8004</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//                   ACTIVITY VIEW
// ═══════════════════════════════════════════════════════

function ActivityView({
  sessions, payments, selectedSession, onSelectSession,
}: {
  sessions: SessionData[];
  payments: any[];
  selectedSession: SessionData | null;
  onSelectSession: (s: SessionData) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold gradient-text">Commerce Activity</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-white mb-4">Commerce Sessions</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="w-full text-left p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-200 truncate flex-1 mr-2">
                    {session.taskDescription.slice(0, 60)}
                  </span>
                  <SessionStatusBadge status={session.status} />
                </div>
                <div className="flex items-center gap-3">
                  {session.agreedPrice && <span className="text-xs text-cyan-400 font-mono">${session.agreedPrice.toFixed(4)}</span>}
                  <span className="text-[10px] text-gray-500">{session.negotiation?.length || 0} negotiation rounds</span>
                  {session.duration && <span className="text-[10px] text-gray-500">{(session.duration / 1000).toFixed(1)}s</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-white mb-4">x402 Payment Ledger</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {payments.map((payment: any) => (
              <div key={payment.id} className="p-3 rounded-xl bg-gray-800/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-cyan-400">{payment.amount}</span>
                  <span className={`pill ${payment.status === 'settled' ? 'pill-green' : 'pill-amber'}`}>
                    {payment.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono truncate">
                    tx: {payment.txHash?.slice(0, 16)}...
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(payment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//                   EXECUTE VIEW
// ═══════════════════════════════════════════════════════

function ExecuteView({ onComplete }: { onComplete: () => void }) {
  const [task, setTask] = useState('');
  const [capability, setCapability] = useState('data');
  const [budget, setBudget] = useState('0.05');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SessionData | null>(null);

  const handleExecute = async () => {
    if (!task) return;
    setRunning(true);
    setResult(null);
    try {
      const session = await executeTask(task, capability, parseFloat(budget));
      setResult(session);
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Execute Commerce Session</h2>
        <p className="text-sm text-gray-400 mt-1">
          Submit a task and watch autonomous agents discover, negotiate, pay, and deliver
        </p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Task Description</label>
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="e.g., Analyze the DeFi market trends and identify top opportunities..."
            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Required Capability</label>
            <select
              value={capability}
              onChange={e => setCapability(e.target.value)}
              className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              <option value="data">Data Analysis</option>
              <option value="writing">Content Writing</option>
              <option value="code">Code Review</option>
              <option value="market">Market Research</option>
              <option value="translation">Translation</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Max Budget (USD)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              step="0.001"
              min="0.001"
              className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleExecute}
          disabled={running || !task}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Agents Working...
            </>
          ) : (
            <>
              <IconSend className="w-4 h-4" />
              Execute Autonomous Commerce Session
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card p-6 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Session Result</h3>
            <SessionStatusBadge status={result.status} />
          </div>

          {result.agreedPrice && (
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-gray-800/30">
              <div>
                <div className="text-xs text-gray-500">Agreed Price</div>
                <div className="text-lg font-bold text-cyan-400">${result.agreedPrice.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Negotiation Rounds</div>
                <div className="text-lg font-bold text-purple-400">{result.negotiation?.length || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Duration</div>
                <div className="text-lg font-bold text-emerald-400">{result.duration ? `${(result.duration / 1000).toFixed(1)}s` : 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Negotiation History */}
          {result.negotiation && result.negotiation.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Negotiation History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.negotiation.map((msg: NegotiationMsg, i: number) => (
                  <NegotiationBubble key={i} msg={msg} />
                ))}
              </div>
            </div>
          )}

          {/* Deliverable */}
          {result.result && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Deliverable</h4>
              <div className="p-4 rounded-xl bg-gray-800/30 text-sm text-gray-300 whitespace-pre-wrap max-h-72 overflow-y-auto font-mono text-xs">
                {result.result}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//              NEGOTIATION MODAL
// ═══════════════════════════════════════════════════════

function NegotiationModal({ session, onClose }: { session: SessionData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card neon-border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white">Commerce Session</h3>
            <p className="text-xs text-gray-500 font-mono">{session.id.slice(0, 16)}...</p>
          </div>
          <div className="flex items-center gap-3">
            <SessionStatusBadge status={session.status} />
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">&times;</button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-800/30 mb-4">
          <div className="text-xs text-gray-500">Task</div>
          <div className="text-sm text-gray-200">{session.taskDescription}</div>
        </div>

        {session.agreedPrice && (
          <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <div>
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-lg font-bold text-cyan-400">${session.agreedPrice.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Network</div>
              <div className="text-sm text-gray-300">SKALE (gasless)</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Protocol</div>
              <div className="text-sm text-gray-300">x402</div>
            </div>
          </div>
        )}

        {/* Negotiation Chat */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Agent Negotiation</h4>
          <div className="space-y-2">
            {session.negotiation?.map((msg, i) => (
              <NegotiationBubble key={i} msg={msg} />
            ))}
          </div>
        </div>

        {/* Deliverable */}
        {session.result && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Deliverable</h4>
            <div className="p-4 rounded-xl bg-gray-800/30 text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
              {session.result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//              SHARED COMPONENTS
// ═══════════════════════════════════════════════════════

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    green: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colorMap[color]} border rounded-2xl`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function ProtocolRow({ name, status, detail, color }: { name: string; status: string; detail: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400', purple: 'text-purple-400', green: 'text-emerald-400',
    amber: 'text-amber-400', pink: 'text-pink-400', blue: 'text-blue-400',
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/30">
      <div className={`status-dot ${status === 'active' ? 'status-active' : 'status-offline'}`} />
      <div className="flex-1">
        <span className={`text-sm font-medium ${colorMap[color]}`}>{name}</span>
        <p className="text-[10px] text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'pill-green',
    executing: 'pill-amber',
    negotiating: 'pill-purple',
    paying: 'pill-cyan',
    discovering: 'pill-cyan',
    failed: 'pill bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return <span className={styles[status] || 'pill-cyan'}>{status}</span>;
}

function NegotiationBubble({ msg }: { msg: NegotiationMsg }) {
  const isClient = msg.from.includes('Client') || msg.from.includes('Web') || msg.from.includes('Auto');
  
  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] p-2.5 rounded-xl text-xs ${
        isClient
          ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-100'
          : 'bg-purple-500/10 border border-purple-500/20 text-purple-100'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{msg.from}</span>
          {msg.priceProposal && (
            <span className="font-mono font-bold">${msg.priceProposal.toFixed(4)}</span>
          )}
          <span className={`pill text-[9px] ${
            msg.type === 'accept' ? 'pill-green' :
            msg.type === 'reject' ? 'pill bg-red-500/10 text-red-400 border-red-500/20' :
            'pill bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>{msg.type}</span>
        </div>
        <p className="text-gray-300">{msg.content}</p>
      </div>
    </div>
  );
}

function formatEventName(event: string): string {
  const names: Record<string, string> = {
    'session:created': 'New Commerce Session',
    'session:updated': 'Session Updated',
    'session:completed': 'Session Completed',
    'session:failed': 'Session Failed',
    'negotiation:message': 'Agent Negotiation',
    'connected': 'Connected to Network',
  };
  return names[event] || event;
}
