import React, { useEffect, useRef, useState } from "react";
import { MyraaAudioSession, LiveState } from "../lib/audio";
import { Sparkles, Move, Upload, Trash2, Settings, FileVideo, Image, Check, HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Myraa3DModel } from "./Myraa3DModel";

// 2D Avatar local persistent IndexedDB storage
const DB_2D_NAME = "Myraa2DStorage";
const STORE_2D_NAME = "assets";

// Global in-memory fallback store when IndexedDB is restricted or unavailable (e.g. in sandboxed preview iframes)
const IN_MEMORY_2D_STORE: Record<string, { fileData: Blob; fileName: string; fileType: string }> = {};

function init2DDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_2D_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_2D_NAME)) {
          db.createObjectStore(STORE_2D_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("IndexedDB failed to open in this context. Using session memory.");
        resolve(null);
      };
    } catch (err) {
      console.warn("IndexedDB is restricted/blocked in this sandboxed environment. Using session memory fallback.", err);
      resolve(null);
    }
  });
}

function save2DAssetToDB(key: string, fileData: Blob, fileName: string, fileType: string): Promise<void> {
  // Always update in-memory store in case of session recovery or direct reads
  IN_MEMORY_2D_STORE[key] = { fileData, fileName, fileType };
  try {
    localStorage.setItem(`myraa_2d_meta_${key}`, JSON.stringify({ fileName, fileType }));
  } catch (e) {}

  return init2DDB().then((db) => {
    if (!db) return Promise.resolve(); // Safe silent fallback to in-memory store
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_2D_NAME, "readwrite");
        const store = transaction.objectStore(STORE_2D_NAME);
        const request = store.put({ fileData, fileName, fileType }, key);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          // Fallback to memory on error
          resolve();
        };
      } catch (err) {
        resolve(); // Fallback to memory on transaction error
      }
    });
  });
}

function get2DAssetFromDB(key: string): Promise<{ fileData: Blob; fileName: string; fileType: string } | null> {
  return init2DDB().then((db) => {
    if (!db) {
      return IN_MEMORY_2D_STORE[key] || null;
    }
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(STORE_2D_NAME, "readonly");
        const store = transaction.objectStore(STORE_2D_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || IN_MEMORY_2D_STORE[key] || null);
        request.onerror = () => resolve(IN_MEMORY_2D_STORE[key] || null);
      } catch (err) {
        resolve(IN_MEMORY_2D_STORE[key] || null);
      }
    });
  });
}

function delete2DAssetFromDB(key: string): Promise<void> {
  delete IN_MEMORY_2D_STORE[key];
  try {
    localStorage.removeItem(`myraa_2d_meta_${key}`);
  } catch (e) {}
  return init2DDB().then((db) => {
    if (!db) return Promise.resolve();
    return new Promise<void>((resolve) => {
      try {
        const transaction = db.transaction(STORE_2D_NAME, "readwrite");
        const store = transaction.objectStore(STORE_2D_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  });
}

export type MyraaEmotion = 
  | "idle" 
  | "happy" 
  | "excited" 
  | "curious" 
  | "thinking" 
  | "proud" 
  | "sad" 
  | "confused" 
  | "surprised" 
  | "embarrassed" 
  | "playful";

interface MyraaCoreVisualizerProps {
  session: MyraaAudioSession | null;
  state: LiveState;
  themeColor: string; // Violet, crimson, emerald, celestial, gold, rose, charcoal
  activeEmotion?: MyraaEmotion;
  characterState: "idle" | "thinking" | "talking";
}

export const MyraaCoreVisualizer: React.FC<MyraaCoreVisualizerProps> = ({
  session,
  state,
  themeColor,
  activeEmotion = "idle",
  characterState
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Video element refs for character state machine
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const thinkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const talkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [dismissError, setDismissError] = useState<boolean>(false);
  
  // Custom 2D uploaded avatar states
  const [customIdle, setCustomIdle] = useState<{ url: string; type: string; name: string } | null>(null);
  const [customThinking, setCustomThinking] = useState<{ url: string; type: string; name: string } | null>(null);
  const [customTalking, setCustomTalking] = useState<{ url: string; type: string; name: string } | null>(null);
  const [showSettings2D, setShowSettings2D] = useState<boolean>(false);
  const [uploadProgressState, setUploadProgressState] = useState<string | null>(null);

  // Load custom 2D media on mount
  useEffect(() => {
    let idleUrlToCleanup: string | null = null;
    let thinkingUrlToCleanup: string | null = null;
    let talkingUrlToCleanup: string | null = null;

    const loadCustom2DAssets = async () => {
      try {
        const savedIdle = await get2DAssetFromDB("idle");
        if (savedIdle) {
          const url = URL.createObjectURL(savedIdle.fileData);
          idleUrlToCleanup = url;
          setCustomIdle({ url, type: savedIdle.fileType, name: savedIdle.fileName });
        }

        const savedThinking = await get2DAssetFromDB("thinking");
        if (savedThinking) {
          const url = URL.createObjectURL(savedThinking.fileData);
          thinkingUrlToCleanup = url;
          setCustomThinking({ url, type: savedThinking.fileType, name: savedThinking.fileName });
        }

        const savedTalking = await get2DAssetFromDB("talking");
        if (savedTalking) {
          const url = URL.createObjectURL(savedTalking.fileData);
          talkingUrlToCleanup = url;
          setCustomTalking({ url, type: savedTalking.fileType, name: savedTalking.fileName });
        }
      } catch (err) {
        console.warn("Failed to load custom 2D assets from IndexedDB:", err);
      }
    };

    loadCustom2DAssets();

    return () => {
      if (idleUrlToCleanup) URL.revokeObjectURL(idleUrlToCleanup);
      if (thinkingUrlToCleanup) URL.revokeObjectURL(thinkingUrlToCleanup);
      if (talkingUrlToCleanup) URL.revokeObjectURL(talkingUrlToCleanup);
    };
  }, []);

  const handleUploadAsset = async (stateKey: "idle" | "thinking" | "talking", file: File) => {
    if (!file) return;
    setUploadProgressState(stateKey);
    try {
      await save2DAssetToDB(stateKey, file, file.name, file.type);
      
      let oldUrl: string | null = null;
      if (stateKey === "idle" && customIdle) oldUrl = customIdle.url;
      if (stateKey === "thinking" && customThinking) oldUrl = customThinking.url;
      if (stateKey === "talking" && customTalking) oldUrl = customTalking.url;
      if (oldUrl) URL.revokeObjectURL(oldUrl);

      const newUrl = URL.createObjectURL(file);
      const assetObj = { url: newUrl, type: file.type, name: file.name };

      if (stateKey === "idle") setCustomIdle(assetObj);
      if (stateKey === "thinking") setCustomThinking(assetObj);
      if (stateKey === "talking") setCustomTalking(assetObj);

      setHasError(false);
    } catch (err) {
      console.error("Failed to upload 2D custom model asset:", err);
      alert("Failed to save asset to dynamic persistent database.");
    } finally {
      setUploadProgressState(null);
    }
  };

  const handleClearAsset = async (stateKey: "idle" | "thinking" | "talking") => {
    try {
      await delete2DAssetFromDB(stateKey);
      
      let oldUrl: string | null = null;
      if (stateKey === "idle") {
        if (customIdle) oldUrl = customIdle.url;
        setCustomIdle(null);
      }
      if (stateKey === "thinking") {
        if (customThinking) oldUrl = customThinking.url;
        setCustomThinking(null);
      }
      if (stateKey === "talking") {
        if (customTalking) oldUrl = customTalking.url;
        setCustomTalking(null);
      }
      if (oldUrl) URL.revokeObjectURL(oldUrl);
    } catch (err) {
      console.error("Failed to clear 2D custom model asset:", err);
    }
  };

  const [widgetSize, setWidgetSize] = useState<"small" | "medium" | "large">("large");
  const [viewMode, setViewMode] = useState<"video" | "threeD">(() => {
    const saved = localStorage.getItem("myraa_view_mode");
    return (saved === "video" || saved === "threeD") ? saved : "video";
  });

  // Persist viewMode changes to localStorage
  useEffect(() => {
    localStorage.setItem("myraa_view_mode", viewMode);
  }, [viewMode]);

  // Listen to custom model loaded event and check IndexedDB on mount to auto-switch to 3D View mode
  useEffect(() => {
    const handleModelLoaded = () => {
      setViewMode("threeD");
    };

    const checkSavedModel = async () => {
      try {
        const DB_NAME = "Myraa3DStorage";
        const STORE_NAME = "models";
        const MODEL_KEY = "active_model";

        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains(STORE_NAME)) {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const getReq = store.get(MODEL_KEY);
            getReq.onsuccess = () => {
              if (getReq.result) {
                setViewMode("threeD");
              }
            };
          }
        };
      } catch (err) {
        console.warn("Could not auto-detect saved 3D model:", err);
      }
    };

    window.addEventListener("myraa-model-loaded", handleModelLoaded);
    checkSavedModel();

    return () => {
      window.removeEventListener("myraa-model-loaded", handleModelLoaded);
    };
  }, []);

  const handleVideoError = (videoName: string) => {
    console.warn(`[Moyna Web Video] Failed to load video source for: ${videoName}`);
    setHasError(true);
  };

  // Interaction and tracking references
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.4 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.4 });
  
  // Physics & Animation states
  const speechVolumeRef = useRef<number>(0);

  // Floating sci-fi background particle arrays
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
  }>>([]);

  // Synchronized video playback state manager (highly polished and flicker-free)
  // Keep all video elements looping and playing concurrently in the background.
  // This allows the CSS transition-opacity class to smoothly crossfade between
  // them without freezing, stuttering, resetting currentTime, or showing black frames.
  useEffect(() => {
    const playAll = () => {
      [idleVideoRef.current, thinkingVideoRef.current, talkingVideoRef.current].forEach((video) => {
        if (!video) return;
        try {
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.warn("Muted background video play deferred:", error);
            });
          }
        } catch (err) {}
      });
    };

    // Attempt to start playing them all initially
    playAll();

    // Re-check periodically or if user interaction triggers play permissions
    const handleUserInteraction = () => {
      playAll();
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [customIdle, customThinking, customTalking]);

  // Cursor position tracking hook
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Theme matching mapping function (extremely beautiful cinematic color tones)
  const getGlowColors = () => {
    switch (themeColor) {
      case "violet":
        return { primary: "rgba(147, 51, 234, 1)", secondary: "rgba(192, 38, 211, 0.8)", glow: "rgba(168, 85, 247, 0.7)" };
      case "crimson":
        return { primary: "rgba(225, 29, 72, 1)", secondary: "rgba(234, 88, 12, 0.8)", glow: "rgba(244, 63, 94, 0.7)" };
      case "emerald":
        return { primary: "rgba(5, 150, 105, 1)", secondary: "rgba(13, 148, 136, 0.8)", glow: "rgba(16, 185, 129, 0.7)" };
      case "celestial":
        return { primary: "rgba(2, 132, 199, 1)", secondary: "rgba(8, 145, 178, 0.8)", glow: "rgba(14, 165, 233, 0.7)" };
      case "gold":
        return { primary: "rgba(202, 138, 4, 1)", secondary: "rgba(217, 119, 6, 0.8)", glow: "rgba(234, 179, 8, 0.7)" };
      case "rose":
        return { primary: "rgba(219, 39, 119, 1)", secondary: "rgba(220, 38, 38, 0.8)", glow: "rgba(236, 72, 153, 0.7)" };
      default:
        return { primary: "rgba(34, 211, 238, 1)", secondary: "rgba(79, 70, 229, 0.8)", glow: "rgba(6, 182, 212, 0.7)" };
    }
  };

  // Main high speed Canvas graphics rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Generate responsive background floating stars
    const generateParticles = () => {
      const count = Math.min(60, Math.floor(width / 24));
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height + height * 0.1,
        speed: Math.random() * 0.35 + 0.12,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
      }));
    };

    generateParticles();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      generateParticles();
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const systemTime = performance.now();
      const colors = getGlowColors();

      // Dynamic Audio analysis fetching from real voice session
      let audioLevel = 0;
      let bufferLength = 64;
      const dataArray = new Uint8Array(bufferLength);
      let activeAnalyser = null;

      if (state === "speaking" && session?.outputAnalyser) {
        activeAnalyser = session.outputAnalyser;
      } else if (state === "listening" && session?.inputAnalyser) {
        activeAnalyser = session.inputAnalyser;
      }

      if (activeAnalyser) {
        try {
          activeAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          audioLevel = sum / bufferLength; // 0 to 255
        } catch (e) {}
      }

      // Smooth amplitude tracking for real-time particle excitation
      speechVolumeRef.current += (audioLevel / 255 - speechVolumeRef.current) * 0.2;

      // Cinematic ambient stardust sizing
      const baseScale = height / 440;
      const s = Math.max(0.95, Math.min(1.85, baseScale)); // scale multiplier

      // Smooth cursor mouse tracking lag
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05;

      const centerX = width / 2;

      // ==========================================
      // 1. DRAW GRAND STAGE VOLUMETRIC PROJECTOR BEAM (Cinematic Glow Backlight)
      // ==========================================
      ctx.save();
      const projectorCenterY = height + 40;
      const baseDiameterX = 280 * s;

      // Volumetric light beams shooting up from projector base
      const conicalBeamGrad = ctx.createLinearGradient(centerX, height * 0.25, centerX, height);
      conicalBeamGrad.addColorStop(0, "rgba(0,0,0,0)");
      conicalBeamGrad.addColorStop(0.4, colors.primary.replace("1)", "0.03)"));
      conicalBeamGrad.addColorStop(0.75, colors.primary.replace("1)", "0.08)"));
      conicalBeamGrad.addColorStop(1, colors.secondary.replace("0.8)", "0.18)"));

      ctx.fillStyle = conicalBeamGrad;
      ctx.beginPath();
      ctx.moveTo(centerX - baseDiameterX * 0.35, projectorCenterY - 145);
      ctx.lineTo(centerX + baseDiameterX * 0.35, projectorCenterY - 145);
      ctx.lineTo(centerX + baseDiameterX * 1.5, height);
      ctx.lineTo(centerX - baseDiameterX * 1.5, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ==========================================
      // 2. MINIMALIST ATMOSPHERE NEURAL FIELDS (SUBTLE GLITCH)
      // ==========================================
      const applyGlitch = (state === "connecting" && Math.random() < 0.1) || (Math.random() < 0.005);
      if (applyGlitch) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2);
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(236,72,153,0.03)" : "rgba(34,211,238,0.03)";
        ctx.fillRect(0, 0, width, height);
      }

      // ==========================================
      // 3. UPDATE AND DRAW HOLOGRAM NEURAL PARTICLES RISING (Cinematic Stardust)
      // ==========================================
      particlesRef.current.forEach((p) => {
        const riseSpeed = p.speed * (1 + speechVolumeRef.current * 1.8);
        p.y -= riseSpeed;
        
        // Horizontal drift sway
        p.x += Math.sin(p.y * 0.015 + p.size) * 0.4;
        
        // Transparency matches base lift height
        const currentOpacity = p.opacity * Math.max(0, p.y / height);

        // Recirculate particle if it reaches up too high near her crown
        if (p.y < height * 0.12) {
          p.y = height + Math.random() * 30;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = colors.primary.replace("1)", `${currentOpacity * 0.45})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * s, 0, Math.PI * 2);
        ctx.fill();
      });

      // ==========================================
      // 3.5. DRAW UNIQUE COMFORTING BREATHING AURAS (For Love & Sad Emotions)
      // ==========================================
      if (activeEmotion === "sad" || activeEmotion === "happy") {
        ctx.save();
        const breathSpeed = activeEmotion === "sad" ? 0.0012 : 0.0018; // Sad is slower and deeper
        const breathPhase = systemTime * breathSpeed;
        const breathScale = 1 + Math.sin(breathPhase) * 0.15; // Slow rise and fall
        
        // Aura colors: sweet pink/red of happy connection, gentle lilac/purple for sadness
        const coreShadowColor = activeEmotion === "happy" ? "rgba(244, 63, 94, 0.45)" : "rgba(147, 51, 234, 0.45)";

        // Draw multiple glowing harmonic rings around character center
        const coreY = height * 0.45;
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
          const ringIndexPhase = i * (Math.PI / ringCount);
          const currentRingScale = breathScale * (1 + i * 0.3);
          const opacity = Math.max(0, (1 - (i / ringCount)) * 0.4 * (0.6 + Math.cos(breathPhase + ringIndexPhase) * 0.4));
          
          ctx.strokeStyle = activeEmotion === "happy" 
            ? `rgba(236, 72, 153, ${opacity * (1 + speechVolumeRef.current)})` 
            : `rgba(168, 85, 247, ${opacity * (1 + speechVolumeRef.current)})`;
          
          ctx.lineWidth = (3 - i * 0.6) * s;
          ctx.setLineDash([12 * s, 18 * s]); // beautiful sci-fi dashed rings
          
          ctx.beginPath();
          // Slow orbital rotation for dashed comfort rings
          const rotationAngle = systemTime * 0.0003 * (i % 2 === 0 ? 1 : -1);
          ctx.arc(centerX, coreY, 110 * currentRingScale * s, rotationAngle, rotationAngle + Math.PI * 2);
          
          // Draw subtle glow shadow
          ctx.shadowBlur = 15 * s;
          ctx.shadowColor = coreShadowColor;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }

        // Draw floating radiant love/sad hearts or sparkles around the central core
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i * (Math.PI * 2) / particleCount) + (systemTime * 0.00015);
          // Gently pulsating radius
          const radius = (150 + Math.sin(systemTime * 0.001 + i) * 30) * s * breathScale;
          const px = centerX + Math.cos(angle) * radius;
          const py = coreY + Math.sin(angle) * radius;
          
          const size = (4 + Math.sin(systemTime * 0.002 + i) * 1.5) * s;
          const opacity = 0.4 + Math.sin(systemTime * 0.0015 + i) * 0.25;

          ctx.fillStyle = activeEmotion === "happy" 
            ? `rgba(244, 63, 94, ${opacity})` // warm pink
            : `rgba(192, 38, 211, ${opacity})`; // deep orchid
          
          if (activeEmotion === "happy") {
            // Draw a cute miniature vector glowing heart element on the canvas
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(size * 0.15, size * 0.15);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-5, -5, -10, 0, 0, 8);
            ctx.bezierCurveTo(10, 0, 5, -5, 0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else {
            // Draw a soft comforting teardrop star element
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.restore();
      }

      // ==========================================
      // 4. PROCEDURAL HOLOGRAPHIC ENERGY CORE (Active when videos are missing)
      // ==========================================
      if (hasError) {
        ctx.save();
        const coreY = height * 0.45;
        const baseRadius = 75 * s;
        // Expand core based on voice volume
        const currentRadius = baseRadius * (1 + speechVolumeRef.current * 0.85);
        const timeFactor = systemTime * 0.0022;

        // Draw deep core volumetric background glow
        const coreGlow = ctx.createRadialGradient(centerX, coreY, 5 * s, centerX, coreY, currentRadius * 1.8);
        coreGlow.addColorStop(0, colors.primary.replace("1)", "0.55"));
        coreGlow.addColorStop(0.35, colors.secondary.replace("0.8)", "0.22"));
        coreGlow.addColorStop(0.75, colors.glow.replace("0.7)", "0.06"));
        coreGlow.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(centerX, coreY, currentRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Draw orbiting bands with elegant particles
        const bandCount = 3;
        for (let b = 0; b < bandCount; b++) {
          const angleOffset = (b * Math.PI) / bandCount;
          const rotateSpeed = 0.00035 * (b % 2 === 0 ? 1 : -1);
          const currentRotation = systemTime * rotateSpeed + angleOffset;

          ctx.strokeStyle = b % 2 === 0 ? colors.primary : colors.secondary;
          ctx.lineWidth = (2 - b * 0.4) * s;
          ctx.beginPath();

          // Elliptical visual band rotation
          const rx = currentRadius * (1.15 + b * 0.22);
          const ry = rx * (0.32 + Math.sin(systemTime * 0.0006 + b) * 0.08);

          ctx.save();
          ctx.translate(centerX, coreY);
          ctx.rotate(currentRotation + Math.sin(systemTime * 0.0004) * 0.2);
          ctx.arc(0, 0, rx, 0, Math.PI * 2);
          
          ctx.shadowBlur = 12 * s;
          ctx.shadowColor = colors.primary;
          ctx.stroke();
          ctx.restore();
        }

        // Draw central fluid core wave structure (breathing, speaking)
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3.5 * s;
        ctx.beginPath();
        const points = 72;
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Undulating waves deformed by voice volume and emotion state
          let noise = Math.sin(angle * 5 + timeFactor) * 7 * s;
          noise += Math.cos(angle * 10 - timeFactor * 1.3) * 3 * s;
          
          // Modify wave frequencies based on state
          if (characterState === "thinking") {
            // Smart pulse
            noise += Math.sin(angle * 14 + timeFactor * 2.5) * 5 * s;
          } else if (characterState === "talking") {
            // Highly reactive voice spikes
            noise += Math.sin(angle * 20 + timeFactor * 4) * (12 + speechVolumeRef.current * 38) * s;
          }

          const r = currentRadius + noise;
          const px = centerX + Math.cos(angle) * r;
          const py = coreY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.shadowBlur = 18 * s;
        ctx.shadowColor = colors.glow;
        ctx.stroke();
        
        ctx.fillStyle = colors.secondary.replace("0.8)", "0.12");
        ctx.fill();
        ctx.restore();
      }

      if (applyGlitch) {
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [session, state, themeColor, activeEmotion, characterState]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      {/* 1. Behind Overlay / Atmospheric Backlight Glow (Z-index 0) */}
      <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none z-0">
        <div className={`w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 bg-gradient-to-tr transition-all duration-1000 ${
          themeColor === "violet" ? "from-purple-600/30 to-fuchsia-600/5" :
          themeColor === "crimson" ? "from-rose-600/30 to-orange-600/5" :
          themeColor === "emerald" ? "from-emerald-600/30 to-teal-600/5" :
          themeColor === "celestial" ? "from-sky-600/30 to-cyan-600/5" :
          themeColor === "gold" ? "from-amber-600/30 to-yellow-600/5" :
          themeColor === "rose" ? "from-rose-600/30 to-pink-600/5" :
          "from-indigo-600/30 to-cyan-600/5"
        }`} />
      </div>

      {/* 2. Character Videos state crossfade manager (Z-index 10) */}
      <div 
        id="moyna-animated-presence"
        className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-none"
      >
        <motion.div
          className={`relative p-1 rounded-[2.25rem] backdrop-blur-md flex flex-col items-center justify-center select-none pointer-events-auto scale-[0.95] sm:scale-100 transition-all duration-350 border border-white/10 shadow-[0_0_35px_rgba(0,0,0,0.9)] ${
            widgetSize === "small" ? "w-80 sm:w-[420px] aspect-[16/9]" :
            widgetSize === "medium" ? "w-[520px] sm:w-[720px] aspect-[16/9]" :
            "w-[94%] max-w-5xl md:max-h-[72vh] max-h-[62vh] aspect-[16/9]"
          }`}
        >
          {/* Stationary Bezel Glass Title Bar */}
          <div className="absolute -top-11 left-0 right-0 h-9 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-between px-3.5 z-45 shadow-lg select-none">
            <div className="flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#93c1ff]">MOYNA HOLOLINK CORE (STABILIZED)</span>
            </div>
            <div className="flex items-center gap-1 pointer-events-auto">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setWidgetSize("small"); }} 
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all border ${widgetSize === "small" ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-bold" : "text-slate-400 border-transparent hover:text-white"}`}
              >
                COMPACT
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setWidgetSize("medium"); }} 
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all border ${widgetSize === "medium" ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-bold" : "text-slate-400 border-transparent hover:text-white"}`}
              >
                FLOAT
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setWidgetSize("large"); }} 
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all border ${widgetSize === "large" ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-bold" : "text-slate-400 border-transparent hover:text-white"}`}
              >
                STAGE
              </button>
            </div>
          </div>

          {/* Glowing Ring Border effect mapping active colors */}
          <div className={`absolute inset-0 rounded-[2.25rem] pointer-events-none z-30 transition-all duration-1000 border-2 ${
            themeColor === "violet" ? "border-purple-500/20 shadow-[inset_0_0_15px_rgba(168,85,247,0.15)]" :
            themeColor === "crimson" ? "border-rose-500/20 shadow-[inset_0_0_15px_rgba(244,63,94,0.15)]" :
            themeColor === "emerald" ? "border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]" :
            themeColor === "celestial" ? "border-sky-500/20 shadow-[inset_0_0_15px_rgba(14,165,233,0.15)]" :
            themeColor === "gold" ? "border-amber-500/20 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)]" :
            themeColor === "rose" ? "border-rose-500/20 shadow-[inset_0_0_15px_rgba(244,63,94,0.15)]" :
            "border-cyan-500/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]"
          }`} />

          <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#05050f]/90">
            {/* Subtle Outer Ambient Shadow Cast */}
            <div className="absolute inset-0 rounded-2xl blur-[20px] opacity-20 bg-cyan-600/10 pointer-events-none mix-blend-screen" />

            {/* Ambient Sliding Mode Switcher Capsule (Z-index 60) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-black/65 backdrop-blur-md border border-white/10 rounded-full p-0.5 flex items-center shadow-lg pointer-events-auto">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewMode("video"); }}
                className={`relative px-4 py-1.5 rounded-full text-[9px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                  viewMode === "video"
                    ? "bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 border-cyan-400/40 text-cyan-200 font-bold shadow-md shadow-cyan-950/40"
                    : "text-slate-400 hover:text-slate-200 border-transparent text-slate-400"
                } border`}
              >
                2D Video Core
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewMode("threeD"); }}
                className={`relative px-4 py-1.5 rounded-full text-[9px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                  viewMode === "threeD"
                    ? "bg-gradient-to-r from-pink-500/25 to-violet-500/25 border-pink-400/40 text-pink-200 font-bold shadow-md shadow-pink-950/40"
                    : "text-slate-400 hover:text-slate-200 border-transparent text-slate-400"
                } border`}
              >
                3D Avatar
              </button>
            </div>

            {viewMode === "video" ? (
              <>
                {/* IDLE MODEL / VIDEO / IMAGE */}
                {customIdle ? (
                  customIdle.type.startsWith("video/") ? (
                    <video
                      ref={idleVideoRef}
                      src={customIdle.url}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        characterState === "idle" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                      }`}
                      style={{
                        maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                        WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      }}
                    />
                  ) : (
                    <img
                      src={customIdle.url}
                      alt="Custom 2D Idle"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        characterState === "idle" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                      }`}
                      style={{
                        maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                        WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      }}
                    />
                  )
                ) : (
                  <video
                    ref={idleVideoRef}
                    src="/assets/idle.mp4"
                    loop
                    muted
                    playsInline
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      characterState === "idle" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                    }`}
                    style={{
                      maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                    }}
                    onError={() => handleVideoError("idle")}
                  />
                )}

                {/* THINKING MODEL / VIDEO / IMAGE */}
                {customThinking ? (
                  customThinking.type.startsWith("video/") ? (
                    <video
                      ref={thinkingVideoRef}
                      src={customThinking.url}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        characterState === "thinking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                      }`}
                      style={{
                        maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                        WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      }}
                    />
                  ) : (
                    <img
                      src={customThinking.url}
                      alt="Custom 2D Thinking"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        characterState === "thinking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                      }`}
                      style={{
                        maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                        WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      }}
                    />
                  )
                ) : (
                  <video
                    ref={thinkingVideoRef}
                    src="/assets/thinking.mp4"
                    loop
                    muted
                    playsInline
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      characterState === "thinking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                    }`}
                    style={{
                      maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                    }}
                    onError={() => handleVideoError("thinking")}
                  />
                )}

                {/* TALKING MODEL / VIDEO / IMAGE */}
                {customTalking ? (
                  customTalking.type.startsWith("video/") ? (
                    <video
                      ref={talkingVideoRef}
                      src={customTalking.url}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        characterState === "talking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                      }`}
                      style={{
                        maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                        WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      }}
                    />
                  ) : (
                    <img
                      src={customTalking.url}
                      alt="Custom 2D Talking"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        characterState === "talking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                      }`}
                      style={{
                        maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                        WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      }}
                    />
                  )
                ) : (
                  <video
                    ref={talkingVideoRef}
                    src="/assets/talking.mp4"
                    loop
                    muted
                    playsInline
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      characterState === "talking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
                    }`}
                    style={{
                      maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                      WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                    }}
                    onError={() => handleVideoError("talking")}
                  />
                )}

                {/* Faint cybernetic visual edge grid guard */}
                <div className="absolute inset-0 border border-white/5 pointer-events-none bg-radial-gradient from-transparent to-black/35" />

                {/* Gear Button for Custom 2D Avatar Configuration (Z-index 60) */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSettings2D(!showSettings2D); }}
                  className="absolute top-4 right-4 z-[60] flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-cyan-405 hover:border-cyan-500/30 active:scale-95 transition-all cursor-pointer shadow-md"
                  title="Configure 2D Avatar Core"
                >
                  <Settings size={14} className={showSettings2D ? "rotate-90 text-cyan-400" : "transition-transform duration-300"} />
                </button>

                {/* Video Placeholder/Fallback Tutorial Overlay if asset files are absent */}
                {hasError && !dismissError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05060f]/95 backdrop-blur-md rounded-2xl p-6 text-center z-50 pointer-events-auto border border-white/5 shadow-2xl animate-fade-in">
                    <Sparkles className="text-cyan-400 mb-2 animate-bounce" size={24} />
                    <h3 className="text-xs font-bold tracking-widest font-mono text-white select-none">HOLOGRAPHIC CORE ACTIVE</h3>
                    <p className="text-[11px] text-slate-300 mt-2 max-w-sm leading-relaxed font-sans">
                      Moyna has successfully initialized with her high-fidelity, interactive, audio-reactive <b>Procedural Hologram core</b>!
                    </p>
                    
                    <div className="mt-4 flex gap-2 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => setDismissError(true)}
                        className="px-4 py-2 rounded-full text-[10px] font-semibold bg-gradient-to-r from-pink-500/80 to-violet-600/80 hover:from-pink-500 hover:to-violet-600 border border-white/10 text-white transition-all transform hover:scale-[1.03] active:scale-[0.98] pointer-events-auto shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] cursor-pointer animate-float"
                      >
                        Awaken Moyna
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("tutorial-details");
                          if (el) el.classList.toggle("hidden");
                        }}
                        className="px-4 py-2 rounded-full text-[10px] font-semibold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all pointer-events-auto cursor-pointer"
                      >
                        Instructions
                      </button>
                    </div>

                    <div id="tutorial-details" className="hidden mt-3 space-y-1 text-left font-mono text-[9px] text-cyan-200 bg-white/5 px-3 py-2 rounded-lg border border-white/5 w-full max-w-xs animate-fade-in">
                      <div className="text-slate-400 font-sans mb-0.5 font-bold">Required assets:</div>
                      <div>• idle.mp4 (State: Idle)</div>
                      <div>• thinking.mp4 (State: Thinking)</div>
                      <div>• talking.mp4 (State: Talking)</div>
                    </div>
                  </div>
                )}

                {/* Floating pill indicator telling you and allowing reset */}
                {hasError && dismissError && (
                  <div className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-pink-500/20 text-[9px] text-pink-300 hover:border-pink-500/50 pointer-events-auto transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    <span>Procedural Core</span>
                    <button 
                      onClick={() => setDismissError(false)} 
                      className="ml-1 hover:text-white underline cursor-pointer"
                    >
                      Setup Video
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Myraa3DModel
                session={session}
                themeColor={themeColor}
                characterState={characterState}
              />
            )}

            {/* Custom 2D Avatar configuration overlay */}
            <AnimatePresence>
              {showSettings2D && viewMode === "video" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 overflow-y-auto pointer-events-auto"
                >
                  <div className="w-full max-w-sm bg-[#090b16] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative">
                    <button
                      type="button"
                      onClick={() => setShowSettings2D(false)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>

                    <h3 className="text-xs font-bold tracking-widest font-mono text-cyan-400 mb-1 flex items-center gap-1.5 uppercase">
                      <Settings size={12} className="animate-spin" style={{ animationDuration: '4s' }} /> Custom 2D Avatar Core
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans mb-4 leading-relaxed">
                      Upload your custom images (PNG, JPG, WEBP), animated GIFs, or MP4 videos as your 2D virtual character states.
                    </p>

                    <div className="space-y-3.5">
                      {/* State 1: Idle */}
                      <div className="border border-white/5 bg-white/[0.02] p-2.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-mono font-bold tracking-wider text-white uppercase block mb-0.5">Idle Avatar</span>
                          <span className="text-[8px] font-mono text-slate-500 block truncate">
                            {customIdle ? customIdle.name : "Default /assets/idle.mp4"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {customIdle && (
                            <button
                              type="button"
                              onClick={() => handleClearAsset("idle")}
                              className="p-1 px-1.5 rounded-md text-[9px] text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Reset state to default"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                          <label className="p-1 px-2.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-[9px] font-mono text-cyan-300 transition-all cursor-pointer flex items-center gap-1">
                            <Upload size={10} className={uploadProgressState === "idle" ? "animate-spin" : ""} />
                            {uploadProgressState === "idle" ? "Saving..." : customIdle ? "Change" : "Upload"}
                            <input
                              type="file"
                              accept="video/mp4,image/*,.gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadAsset("idle", file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* State 2: Thinking */}
                      <div className="border border-white/5 bg-white/[0.02] p-2.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-mono font-bold tracking-wider text-white uppercase block mb-0.5">Thinking Avatar</span>
                          <span className="text-[8px] font-mono text-slate-500 block truncate">
                            {customThinking ? customThinking.name : "Default /assets/thinking.mp4"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {customThinking && (
                            <button
                              type="button"
                              onClick={() => handleClearAsset("thinking")}
                              className="p-1 px-1.5 rounded-md text-[9px] text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Reset state to default"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                          <label className="p-1 px-2.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-[9px] font-mono text-cyan-300 transition-all cursor-pointer flex items-center gap-1">
                            <Upload size={10} className={uploadProgressState === "thinking" ? "animate-spin" : ""} />
                            {uploadProgressState === "thinking" ? "Saving..." : customThinking ? "Change" : "Upload"}
                            <input
                              type="file"
                              accept="video/mp4,image/*,.gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadAsset("thinking", file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* State 3: Talking */}
                      <div className="border border-white/5 bg-white/[0.02] p-2.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-mono font-bold tracking-wider text-white uppercase block mb-0.5">Talking Avatar</span>
                          <span className="text-[8px] font-mono text-slate-500 block truncate">
                            {customTalking ? customTalking.name : "Default /assets/talking.mp4"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {customTalking && (
                            <button
                              type="button"
                              onClick={() => handleClearAsset("talking")}
                              className="p-1 px-1.5 rounded-md text-[9px] text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Reset state to default"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                          <label className="p-1 px-2.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-[9px] font-mono text-cyan-300 transition-all cursor-pointer flex items-center gap-1">
                            <Upload size={10} className={uploadProgressState === "talking" ? "animate-spin" : ""} />
                            {uploadProgressState === "talking" ? "Saving..." : customTalking ? "Change" : "Upload"}
                            <input
                              type="file"
                              accept="video/mp4,image/*,.gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadAsset("talking", file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowSettings2D(false)}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-mono text-[9px] font-bold uppercase transition-all shadow-md cursor-pointer"
                      >
                        Assimilation Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* 3. Foreground Hover-Responsive Canvas for glowing particles (Holographic Overlay Z-index 20) */}
      <canvas
        id="moyna-hologram-living-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
    </div>
  );
};
