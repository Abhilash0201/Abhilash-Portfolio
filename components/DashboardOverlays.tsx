'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DashboardOverlaysProps {
  mouseX: number; // -1 to 1
  mouseY: number; // -1 to 1
  soundActive: boolean;
  slide: number; // 0 for hero, 1 for portfolio
}

export default function DashboardOverlays({
  mouseX,
  mouseY,
  soundActive,
  slide,
}: DashboardOverlaysProps) {
  const [modelAcc, setModelAcc] = useState(99.4);
  const [confidence, setConfidence] = useState(98.7);
  const [agentStep, setAgentStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const agentLogs = [
    'RETRIEVING VECTOR DATA...',
    'RANKING CANDIDATES...',
    'GENERATING SYNAPSE GRAPH...',
    'OPTIMIZING MODEL HYPERPARAMETERS...',
    'SYNTHESIZING PREDICTIVE OUTCOME...',
  ];

  // Random updates for simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setModelAcc((prev) => {
        const delta = (Math.random() - 0.5) * 0.08;
        return Math.min(99.9, Math.max(98.5, parseFloat((prev + delta).toFixed(2))));
      });
      setConfidence((prev) => {
        const delta = (Math.random() - 0.5) * 0.15;
        return Math.min(100.0, Math.max(97.0, parseFloat((prev + delta).toFixed(2))));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Cycle agent logs
  useEffect(() => {
    const logInterval = setInterval(() => {
      setAgentStep((prev) => (prev + 1) % agentLogs.length);
    }, 3500);
    return () => clearInterval(logInterval);
  }, []);

  // Neural activity wave canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!ctx || !canvas) return;
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      // Draw active dynamic waves
      const waveCount = soundActive ? 4 : 2;
      const baseFreq = soundActive ? 0.05 : 0.025;
      const speed = soundActive ? 0.15 : 0.06;

      phase += speed;

      for (let k = 0; k < waveCount; k++) {
        ctx.beginPath();
        ctx.lineWidth = k === 0 ? 2 : 1;
        
        // Dynamic colors: cool blue and warm orange
        if (k % 2 === 0) {
          ctx.strokeStyle = `rgba(168, 200, 255, ${0.7 - k * 0.15})`;
        } else {
          ctx.strokeStyle = `rgba(255, 140, 60, ${0.6 - k * 0.15})`;
        }

        for (let x = 0; x < w; x++) {
          const y =
            h / 2 +
            Math.sin(x * baseFreq + phase + k * 1.5) * (h * 0.3) * Math.sin(phase * 0.3) * Math.exp(-Math.pow(x - w / 2, 2) / Math.pow(w / 3, 2));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [soundActive]);

  // Render floating overlay widgets
  // Slide transition: if slide is 1, we fade out or translate the dashboard widgets into terminal layout
  const activeClass = slide === 0 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none';

  // Parallax helper styles
  const getParallaxStyle = (depth: number) => {
    const x = mouseX * depth * 20;
    const y = mouseY * depth * 20;
    const intensity = soundActive ? 1.2 : 1.0;
    return {
      transform: `translate3d(${x}px, ${y}px, 0) scale(${intensity})`,
      transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
    };
  };

  return (
    <div className={`absolute inset-0 z-10 overflow-hidden transition-all duration-1000 ${activeClass}`}>
      
      {/* ── Top-Left Panel: LLM Pipeline Flow ── */}
      <div
        className="absolute top-[4%] left-[3%] w-[260px] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,12,0.55)] backdrop-blur-md shadow-2xl text-[10px] text-white/70 font-mono tracking-wider transition-all duration-500 hover:border-[rgba(168,200,255,0.35)] hidden lg:block"
        style={getParallaxStyle(0.6)}
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-1.5 text-xs text-blue-400 font-semibold font-sans">
          <span>LLM PIPELINE</span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-white/5 p-1.5 rounded">
            <span>INPUT STAGE</span>
            <span className="text-white font-bold">EMBEDDING (1536d)</span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-1.5 rounded">
            <span>INDEX SEARCH</span>
            <span className="text-blue-300 font-bold">HNSW COSIM (k=10)</span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-1.5 rounded">
            <span>CONTEXT LEN</span>
            <span className="text-white font-bold">32,768 TOKENS</span>
          </div>
          <div className="flex justify-between items-center bg-[rgba(255,140,60,0.1)] p-1.5 rounded border border-[rgba(255,140,60,0.25)]">
            <span>AGENT STATE</span>
            <span className="text-orange-400 font-bold font-mono">ROUTING</span>
          </div>
        </div>
      </div>

      {/* ── Top-Right Panel: Neural Activity Canvas ── */}
      <div
        className="absolute top-[4%] right-[3%] w-[280px] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,12,0.55)] backdrop-blur-md shadow-2xl transition-all duration-500 hover:border-[rgba(255,140,60,0.35)] hidden lg:block"
        style={getParallaxStyle(0.8)}
      >
        <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-1.5 text-xs text-orange-400 font-semibold font-sans tracking-wide">
          <span>NEURAL ACTIVITY</span>
          <span className="text-[10px] text-white/50 font-mono">0.08Hz MOD</span>
        </div>
        <div className="h-16 w-full overflow-hidden bg-black/30 rounded-lg">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-white/40 font-mono">
          <span>BAND: GAUSSIAN</span>
          <span>GAIN: {soundActive ? '+18dB' : 'NORMAL'}</span>
        </div>
      </div>

      {/* ── Bottom-Left Panel: Live Agent Status Log ── */}
      <div
        className="absolute bottom-[10%] left-[3%] w-[250px] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,12,0.55)] backdrop-blur-md shadow-2xl transition-all duration-500 hover:border-[rgba(168,200,255,0.35)] hidden lg:block"
        style={getParallaxStyle(0.4)}
      >
        <div className="text-xs text-white/90 font-semibold mb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AGENT HOST ACTIVE</span>
        </div>
        <div className="font-mono text-[9px] text-emerald-400 space-y-1 bg-black/40 p-2.5 rounded-lg border border-emerald-950/50">
          <div className="text-white/40">&gt; EXEC --AGENT-DAEMON</div>
          <div className="animate-pulse">{agentLogs[agentStep]}</div>
          <div className="text-white/30">&gt; LATENCY: 28ms</div>
          <div className="text-white/30">&gt; THREADS: 64 active</div>
        </div>
      </div>

      {/* ── Bottom-Right Panel: Confidence Radial Chart ── */}
      <div
        className="absolute bottom-[10%] right-[3%] w-[240px] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,12,0.55)] backdrop-blur-md shadow-2xl flex items-center justify-between transition-all duration-500 hover:border-[rgba(255,140,60,0.35)] hidden lg:flex"
        style={getParallaxStyle(0.7)}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-white/80 font-semibold">PREDICTION</span>
          <span className="text-[10px] text-white/50 font-mono">CONFIDENCE RATE</span>
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 mt-1">
            {confidence}%
          </span>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-white/10"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-orange-500 transition-all duration-500"
              strokeWidth="2.5"
              strokeDasharray={`${confidence}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 140, 60, 0.8))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/80 font-bold">
            STAT
          </div>
        </div>
      </div>

      {/* ── Middle-Right: Model Accuracy ── */}
      <div
        className="absolute top-[45%] right-[2%] w-[200px] p-3.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,12,0.55)] backdrop-blur-md shadow-2xl transition-all duration-500 hover:border-white/20 hidden xl:block"
        style={getParallaxStyle(0.5)}
      >
        <div className="text-[10px] text-white/50 font-mono tracking-wider mb-1">ACCURACY METRIC</div>
        <div className="text-xl font-bold text-blue-400 font-mono">{modelAcc}%</div>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${modelAcc}%` }}
          />
        </div>
      </div>
      
    </div>
  );
}
