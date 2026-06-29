import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Activity, Radio, Brain, X, Minus } from "lucide-react";
import { MyraaAudioSession } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";

interface MicrophoneDetectorHUDProps {
  session: MyraaAudioSession | null;
  state: string; // "disconnected" | "connecting" | "listening" | "speaking"
  onClose?: () => void;
  thoughtLogs?: Array<{ id: string; time: string; type: string; message: string }>;
}

export const MicrophoneDetectorHUD: React.FC<MicrophoneDetectorHUDProps> = ({
  session,
  state,
  onClose,
  thoughtLogs = []
}) => {
  const [vol, setVol] = useState<number>(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState<boolean>(false);
  const [frequencyBars, setFrequencyBars] = useState<number[]>(Array(15).fill(3));
  const requestRef = useRef<number | null>(null);

  // local mini state
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"eq" | "brain">("eq");

  // Smooth tracker for peaking values
  const [peakVol, setPeakVol] = useState<number>(0);

  useEffect(() => {
    // Keep peak moving down slowly
    const peakInterval = setInterval(() => {
      setPeakVol((prev) => Math.max(0, Math.round(prev * 0.95)));
    }, 200);

    return () => clearInterval(peakInterval);
  }, []);

  useEffect(() => {
    // Keep updating real-time mic amplitude and spectrum components
    const updateMicMetrics = () => {
      let computedVol = 0;
      let bars = Array(15).fill(3);

      const isActive = state === "listening" || state === "speaking";

      if (isActive && session && session.inputAnalyser) {
        const analyser = session.inputAnalyser;
        const bufferLength = analyser.fftSize;
        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);

        // 1. Calculate Average Root Mean Square (RMS) for precise acoustic amplitude
        let sumSquared = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (timeData[i] - 128) / 128; // Normalize to [-1.0, 1.0]
          sumSquared += val * val;
        }
        const rms = Math.sqrt(sumSquared / bufferLength);
        
        // Scale and smooth volume value for beautiful UI response
        computedVol = Math.round(rms * 350); 
        if (computedVol > 100) computedVol = 100;

        // 2. Extract frequency data for live EQ bands
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);

        // Standard logarithmic scaling or sampling over frequency ranges
        const totalBars = 15;
        const step = Math.floor(freqData.length / (totalBars * 2.5)); // focus on speech bands

        for (let j = 0; j < totalBars; j++) {
          const bucketValue = freqData[j * step] || 0;
          // Scale to max height of 32px
          const scaledHeight = Math.max(3, Math.round((bucketValue / 255) * 28) + 3);
          bars[j] = scaledHeight;
        }

        // Keep peak volume updated
        setPeakVol((prev) => Math.max(prev, computedVol));
      } else {
        // If inactive, simulate slight ambient floating noise if connected in background, 
        // else absolute zero
        if (state === "connecting") {
          // slight connection ripple simulation
          bars = Array(15).fill(0).map(() => Math.floor(Math.random() * 5) + 3);
        } else {
          bars = Array(15).fill(3);
        }
      }

      setVol(computedVol);
      setIsVoiceDetected(computedVol > 12);
      setFrequencyBars(bars);

      requestRef.current = requestAnimationFrame(updateMicMetrics);
    };

    requestRef.current = requestAnimationFrame(updateMicMetrics);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [session, state]);

  const isConnected = state === "listening" || state === "speaking";

  const getLogTypeBadgeColor = (type: string) => {
    const lowercase = type.toLowerCase();
    if (lowercase.includes("cogni")) return "text-fuchsia-400 border-fuchsia-500/25 bg-fuchsia-500/5";
    if (lowercase.includes("learn") || lowercase.includes("memor")) return "text-emerald-400 border-emerald-500/25 bg-emerald-500/5";
    if (lowercase.includes("speech") || lowercase.includes("voice")) return "text-cyan-400 border-cyan-500/25 bg-cyan-500/5";
    if (lowercase.includes("err") || lowercase.includes("crit")) return "text-rose-400 border-rose-500/25 bg-rose-500/5";
    return "text-indigo-400 border-indigo-500/25 bg-indigo-500/5";
  };

  if (isMinimized) {
    return (
      <motion.div
        layoutId="mic-hud-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => setIsMinimized(false)}
        className="pointer-events-auto cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 select-none font-mono relative backdrop-blur-md shadow-lg"
        title="Click to restore Microphone Equalizer"
      >
        <div className="relative flex items-center justify-center">
          {isConnected && isVoiceDetected && (
            <span className="absolute -inset-1 rounded-full border border-emerald-400/40 animate-ping opacity-75" />
          )}
          {isConnected ? (
            <Brain size={14} className={`text-cyan-400 ${isVoiceDetected ? 'animate-pulse' : ''}`} />
          ) : (
            <Brain size={14} className="text-slate-500" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[7.5px] font-bold text-slate-400 tracking-wider uppercase leading-none">MIC DETECTOR</span>
          <span className="text-[8px] font-bold text-[#22d3ee] mt-0.5 leading-none flex items-center gap-1">
            {isConnected ? `ACTIVE: ${vol}%` : "OFFLINE"}
          </span>
        </div>

        {/* Small inline actions */}
        <div className="flex items-center gap-1 pl-1 border-l border-white/5 opacity-40 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-0.5 hover:text-white text-slate-400 transition"
            title="Expand Detector"
          >
            <Activity size={10} />
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-0.5 hover:text-rose-400 text-slate-400 transition"
              title="Remove Detector"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId="mic-hud-container"
      initial={{ opacity: 0, x: -50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      className="pointer-events-auto w-80 bg-slate-950/85 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-2xl relative select-none font-mono"
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between gap-2.5 pb-2 cursor-default border-b border-white/5 mb-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Brain size={14} className="text-cyan-400 animate-pulse shrink-0" />
          ) : (
            <Brain size={14} className="text-slate-500 shrink-0" />
          )}
          <span className="text-[10px] font-bold tracking-widest text-[#93c1ff] uppercase">
            MOYNA COGNITIVE LINK
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 font-bold">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Minimize to mini-logo badge"
          >
            <Minus size={11} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Remove/Close panel"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher Deck */}
      <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-white/5 mb-3.5 select-none text-[8.5px] font-bold">
        <button
          onClick={() => setActiveTab("eq")}
          className={`flex-1 py-1 rounded-md tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "eq" 
              ? "bg-cyan-500 text-slate-950" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Activity size={10} />
          <span>MIC SENSORS</span>
        </button>
        <button
          onClick={() => setActiveTab("brain")}
          className={`flex-1 py-1 rounded-md tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "brain" 
              ? "bg-cyan-500 text-slate-950" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Brain size={10} />
          <span>DEEP THINKING</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "eq" ? (
          <motion.div
            key="eq-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col gap-3"
          >
            {/* Visualizer bars / Equalizer */}
            <div className="bg-slate-900/40 rounded-xl border border-white/5 p-3 flex flex-col justify-center items-center h-20">
              {isConnected ? (
                <div className="flex items-end gap-1 h-12 w-full justify-center px-2">
                  {frequencyBars.map((barHeight, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ height: `${barHeight}px` }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`w-1.5 rounded-t-sm transition-colors duration-150 ${
                        isVoiceDetected 
                          ? "bg-gradient-to-t from-emerald-500 via-cyan-400 to-indigo-500" 
                          : "bg-gradient-to-t from-slate-600 to-slate-400"
                      }`}
                      style={{ maxHeight: "36px" }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-1">
                  <MicOff size={16} className="text-slate-600 mb-1 animate-pulse" />
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Acoustic Link Dormant</p>
                  <p className="text-[8px] text-slate-600 mt-0.5">Please wake Moyna to start sensing</p>
                </div>
              )}
            </div>

            {/* Level Metrics */}
            <div className="space-y-2 mt-1 px-1">
              {/* Waveform Signal meter */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-sans">
                  <span className="flex items-center gap-1">
                    <Volume2 size={10} className={vol > 0 ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                    Signal Amplitude
                  </span>
                  <span className="font-mono text-[9px] text-[#22d3ee] font-bold">{vol}%</span>
                </div>
                
                {/* LED Segment Bar */}
                <div className="h-1.5 rounded bg-slate-900 flex overflow-hidden gap-[1px]">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const threshold = (i / 20) * 100;
                    const isActive = isConnected && vol >= threshold;
                    const isPeak = isConnected && peakVol >= threshold && peakVol > 0;
                    
                    let ledBg = "bg-slate-950";
                    if (isActive) {
                      ledBg = i < 11 
                        ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]" 
                        : i < 16 
                          ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]" 
                          : "bg-rose-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]";
                    } else if (isPeak) {
                      ledBg = "bg-sky-500/30";
                    }

                    return (
                      <div 
                        key={i} 
                        className={`flex-1 h-full rounded-sm transition-all duration-100 ${ledBg}`} 
                      />
                    );
                  })}
                </div>
              </div>

              {/* Indicator Status Row */}
              <div className="flex items-center justify-between text-[8px] pt-1.5 border-t border-white/5 text-slate-500">
                {isConnected ? (
                  <span className="flex items-center gap-1 uppercase tracking-wider text-[8px] text-[#22d3ee] font-bold">
                    <Radio size={9} className="text-[#22d3ee] animate-spin" />
                    Freq Range: Speech (16kHz)
                  </span>
                ) : (
                  <span className="uppercase tracking-wider text-slate-600 font-bold">
                    System: Offline Standard
                  </span>
                )}

                <AnimatePresence mode="wait">
                  {isVoiceDetected && isConnected ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[7.5px] tracking-widest uppercase animate-pulse border border-emerald-500/20"
                    >
                      AUDIO ACTIVE
                    </motion.span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-600 text-[7.5px] uppercase tracking-widest border border-white/5">
                      SILENT
                    </span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="brain-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col gap-2.5 h-[190px]"
          >
            {/* Terminal Console Viewport */}
            <div className="flex-1 overflow-y-auto bg-slate-950/60 rounded-xl border border-white/5 p-3 flex flex-col gap-2 relative scrollbar-thin select-text">
              {thoughtLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-slate-600 py-4 font-sans">
                  <Brain size={20} className="text-slate-700 animate-pulse mb-1.5" />
                  <p className="text-[9px] uppercase tracking-widest leading-none">Cognitive stream empty</p>
                  <p className="text-[8px] mt-1 leading-none">Wake up Moyna to see thoughts</p>
                </div>
              ) : (
                thoughtLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="text-[8px] leading-normal flex flex-col gap-0.5 text-left border-l border-white/5 pl-2 select-text font-mono">
                    <div className="flex items-center gap-1.5 select-all">
                      <span className="text-[7.5px] text-slate-500 font-normal">{log.time}</span>
                      <span className={`px-1 rounded-[3px] text-[6.5px] font-bold uppercase tracking-wider border select-none ${getLogTypeBadgeColor(log.type)}`}>
                        {log.type}
                      </span>
                    </div>
                    <span className="text-slate-300 font-medium select-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Cognition active indicators */}
            <div className="flex items-center justify-between text-[7.5px] uppercase text-slate-500 pt-1.5 border-t border-white/5 px-1 font-mono tracking-wider">
              {state === "thinking" ? (
                <span className="text-cyan-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  COG_ENG: Reasoning Step...
                </span>
              ) : state === "speaking" ? (
                <span className="text-purple-400 flex items-center gap-1">
                  <Activity size={8} className="animate-pulse" />
                  VOCALIZATION WAVE_OUT
                </span>
              ) : isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                  AWAITING HUMAN AUDIO
                </span>
              ) : (
                <span>CORE SYSTEM STANDBY</span>
              )}

              <span>REASONING ACTIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

