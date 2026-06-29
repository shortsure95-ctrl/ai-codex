import React, { useState, useEffect, useRef } from "react";
import { MyraaAudioSession, LiveState } from "./lib/audio";
import { MyraaCoreVisualizer, MyraaEmotion } from "./components/MyraaCoreVisualizer";
import { SubtitleHearts } from "./components/SubtitleHearts";
import { BrowserAgent } from "./components/BrowserAgent";
import { 
  Power, 
  Volume2, 
  Info, 
  Sparkles, 
  Globe, 
  Maximize2, 
  MessageSquareOff, 
  Compass, 
  CircleAlert,
  MicOff,
  Mic,
  X,
  Brain,
  LogIn,
  LogOut,
  ScreenShare,
  ScreenShareOff,
  Camera,
  Tv,
  Eye,
  Minimize2,
  Video,
  VideoOff,
  Terminal,
  FileText,
  FolderOpen,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory, MemoryCategory } from "./lib/memoryTypes";
import { MemoryDashboard } from "./components/MemoryDashboard";
import { MicrophoneDetectorHUD } from "./components/MicrophoneDetectorHUD";
import { CompanionNotepad } from "./components/CompanionNotepad";
import { DriveExplorer } from "./components/DriveExplorer";
import {
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  collection, 
  onSnapshot,
  FirebaseUser
} from "./lib/firebase";

function CameraSimulatorCanvas({ session }: { session: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef({ x: -100, y: -100, isMoving: false });
  const lastMouseTimeRef = useRef(0);
  const lastNotificationTimeRef = useRef(0);

  const sessionRefObj = useRef<any>(session);
  useEffect(() => {
    sessionRefObj.current = session;
  }, [session]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      isMoving: true
    };
    lastMouseTimeRef.current = Date.now();
  };

  const handleMouseLeave = () => {
    mousePosRef.current.isMoving = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let prevFrameData: ImageData | null = null;
    let isMotionDetected = false;
    let currentMotionPercent = 0;
    let lastFrameSentTime = 0;

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Tech glass background
      ctx.fillStyle = "rgba(10, 18, 30, 0.75)";
      ctx.fillRect(0, 0, w, h);

      // Dot digital matrix
      ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
      for (let x = 10; x < w; x += 15) {
        for (let y = 10; y < h; y += 15) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Scanner sweeping bar
      const barY = (Math.sin(frame * 0.02) * 0.5 + 0.5) * h;
      ctx.fillStyle = "rgba(34, 211, 238, 0.15)";
      ctx.fillRect(0, barY - 2, w, 4);
      ctx.fillStyle = "rgba(34, 211, 238, 0.75)";
      ctx.fillRect(0, barY - 0.5, w, 1);

      // Draw active subject that floats around automatically
      const objX = w / 2 + Math.cos(frame * 0.035) * (w * 0.3);
      const objY = h / 2 + Math.sin(frame * 0.045) * (h * 0.25);
      
      // Draw object shadow/glow
      ctx.fillStyle = "rgba(244, 63, 94, 0.65)";
      ctx.beginPath();
      ctx.arc(objX, objY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
      ctx.beginPath();
      ctx.arc(objX, objY, 8 + Math.sin(frame * 0.1) * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(244, 63, 94, 0.85)";
      ctx.font = "6px monospace";
      ctx.fillText("SUBJECT_VEC", objX + 8, objY + 2);

      // Draw mouse trail/interference
      if (Date.now() - lastMouseTimeRef.current < 500 && mousePosRef.current.isMoving) {
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;
        
        ctx.strokeStyle = "rgba(244, 180, 26, 0.6)";
        ctx.beginPath();
        ctx.arc(mx, my, (frame % 15) + 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(244, 180, 26, 0.85)";
        ctx.font = "6px monospace";
        ctx.fillText("CURSOR_DISTURB", mx + 8, my + 2);
      }

      // Draw normal facial frame / reticle tracking
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.25 + Math.sin(frame * 0.05) * 3;
      
      ctx.strokeStyle = isMotionDetected ? "rgba(239, 68, 68, 0.45)" : "rgba(34, 211, 238, 0.45)";
      ctx.lineWidth = 1;
      
      // Face circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Eye rects
      ctx.strokeStyle = "rgba(129, 140, 248, 0.6)";
      ctx.strokeRect(cx - r*0.4 - 10, cy - r*0.3 - 5, 20, 10);
      ctx.strokeRect(cx + r*0.4 - 10, cy - r*0.3 - 5, 20, 10);

      // Mouth sweep
      ctx.beginPath();
      ctx.arc(cx, cy + r*0.2, r*0.3, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // Highlight security scan zones
      const scanX1 = 10;
      const scanY1 = 35;
      const scanWidth = w - 120;
      const scanHeight = h - 60;

      ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
      ctx.setLineDash([2, 4]);
      ctx.strokeRect(scanX1, scanY1, scanWidth, scanHeight);
      ctx.setLineDash([]);

      // Pixel Difference Analysis (Motion Detection)
      try {
        const currentFrameData = ctx.getImageData(0, 0, w, h);
        if (prevFrameData) {
          const curr = currentFrameData.data;
          const prev = prevFrameData.data;
          let diffSum = 0;
          let samples = 0;

          // Compare pixels inside the safe scan area to block HUD feedback loop
          for (let y = scanY1; y < scanY1 + scanHeight; y += 4) {
            for (let x = scanX1; x < scanX1 + scanWidth; x += 4) {
              const idx = (y * w + x) * 4;
              const rDiff = Math.abs(curr[idx] - prev[idx]);
              const gDiff = Math.abs(curr[idx + 1] - prev[idx + 1]);
              const bDiff = Math.abs(curr[idx + 2] - prev[idx + 2]);
              
              diffSum += (rDiff + gDiff + bDiff);
              samples++;
            }
          }

          if (samples > 0) {
            const avgDiff = diffSum / (samples * 3); // 0 - 255 avg diff
            currentMotionPercent = (avgDiff / 255) * 100;
            // Lowered threshold since we look at a larger area that sweeps
            isMotionDetected = currentMotionPercent > 0.65; 

            if (isMotionDetected) {
              const now = Date.now();
              if (now - lastNotificationTimeRef.current > 12000) { // 12 seconds cooldown throttle to prevent over-notifying
                lastNotificationTimeRef.current = now;
                const activeSession = sessionRefObj.current;
                if (activeSession && typeof activeSession.sendClientContent === "function") {
                  console.log("[Camera Sim] Motion detected! Prompting Gemini live session.");
                  activeSession.sendClientContent(
                    "System Notification: Real-time physical motion/movement was just detected in the security camera simulator viewport. Immediately speak up to alert and warn the user right now in your natural caring but urgent Moyna/companion companion voice."
                  );
                }
              }
            }
          }
        }
        prevFrameData = currentFrameData;

        // Periodic frame transmission to live session for real-time speech companion analysis
        const now = Date.now();
        if (now - lastFrameSentTime > 1800) {
          lastFrameSentTime = now;
          const activeSession = sessionRefObj.current;
          if (activeSession && typeof activeSession.sendVideoFrame === "function") {
            try {
              const base64Url = canvas.toDataURL("image/jpeg", 0.55);
              const base64Data = base64Url.split(",")[1];
              if (base64Data) {
                activeSession.sendVideoFrame(base64Data, "image/jpeg");
              }
            } catch (e) {
              console.warn("Failed to capture simulator frame:", e);
            }
          }
        }
      } catch (e) {
        // Fallback
      }

      // Draw visual warnings based on motion detection status
      if (isMotionDetected) {
        // Flashy warning overlay border
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(frame * 0.2) * 0.25})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, w, h);

        // Warning HUD box top-right
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.fillRect(w - 110, 12, 100, 24);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 110, 12, 100, 24);

        ctx.fillStyle = "#f87171";
        ctx.font = "bold 7px monospace";
        ctx.fillText("⚠️ ACT_MOTION", w - 105, 21);
        ctx.font = "500 6.5px monospace";
        ctx.fillText(`DIFF_INDX: ${currentMotionPercent.toFixed(2)}%`, w - 105, 30);
      } else {
        // Secure indicator state
        ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
        ctx.fillRect(w - 110, 12, 100, 24);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 110, 12, 100, 24);

        ctx.fillStyle = "rgba(34, 211, 238, 0.85)";
        ctx.font = "bold 7.5px monospace";
        ctx.fillText("🛡️ SCAN_STABLE", w - 105, 21);
        ctx.font = "500 6.5px monospace";
        ctx.fillText(`DIFF_INDX: ${currentMotionPercent.toFixed(2)}%`, w - 105, 30);
      }

      // Digital coordinate logs
      ctx.fillStyle = isMotionDetected ? "rgba(244, 63, 94, 0.95)" : "rgba(34, 211, 238, 0.8)";
      ctx.font = "italic 8px monospace";
      ctx.fillText(isMotionDetected ? "WARNING: SCAN AREA PIXEL SHIFT" : "TARGET MESH IDENTIFIED: Human_01", 12, 18);
      ctx.fillText(`SYSTEM RESPONSIVENESS: ACTIVE`, 12, 28);
      ctx.fillText(`FPS: 60 // FIELD RATIO: 1.33 [MOTION_DET: YES]`, 12, h - 12);

      // Tracking corner guidelines
      ctx.strokeStyle = isMotionDetected ? "rgba(239, 68, 68, 0.95)" : "rgba(34, 211, 238, 0.8)";
      ctx.lineWidth = 2;
      const len = 12;
      // top-left
      ctx.beginPath(); ctx.moveTo(5, 5 + len); ctx.lineTo(5, 5); ctx.lineTo(5 + len, 5); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(w - 5, 5 + len); ctx.lineTo(w - 5, 5); ctx.lineTo(w - 5 - len, 5); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(5, h - 5 - len); ctx.lineTo(5, h - 5); ctx.lineTo(5 + len, h - 5); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(w - 5, h - 5 - len); ctx.lineTo(w - 5, h - 5); ctx.lineTo(w - 5 - len, h - 5); ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={280} 
      height={210} 
      className="w-full h-full rounded-xl bg-slate-950 transition-colors duration-300" 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

function ScreenSimulatorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Tech dark slate background
      ctx.fillStyle = "rgba(7, 10, 20, 0.8)";
      ctx.fillRect(0, 0, w, h);

      // Draw grid lines
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw dynamic waves (sine / cosine simulation graph representing telemetry)
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 10; x < w - 10; x++) {
        const y = h/2 + Math.sin(x * 0.04 + frame * 0.05) * 20 + Math.cos(x * 0.01 + frame * 0.02) * 10;
        if (x === 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary cyber yellow frequency wave
      ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
      ctx.beginPath();
      for (let x = 10; x < w - 10; x += 2) {
        const y = h/2 + Math.cos(x * 0.08 - frame * 0.08) * 12;
        if (x === 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Compile logs or dynamic listings
      ctx.fillStyle = "rgba(147, 197, 253, 0.8)";
      ctx.font = "8px monospace";
      ctx.fillText("📡 CONTEXT BROADCAST ACTIVE // LIVE SIMULATION", 12, 18);
      ctx.fillText(`STATUS: TRANSMITTING SYSTEM MEMORIES`, 12, 28);
      
      const files = ["App.tsx", "server.ts", "audio.ts", "memoryTypes.ts"];
      const activeFile = files[Math.floor((frame / 80) % files.length)];
      ctx.fillStyle = "rgba(147, 197, 253, 0.5)";
      ctx.fillText(`Compiling target index: ${activeFile}... 100% OK`, 12, 42);

      // Dynamic digital clocks or random numbers
      ctx.fillStyle = "rgba(34, 211, 238, 0.9)";
      ctx.fillText(`CORE TEMP: ${(41.5 + Math.sin(frame*0.01)*1.2).toFixed(1)}°C`, 12, h - 25);
      ctx.fillText(`SPEED: 4.88 Gbps // PACKETS: ${1200 + frame}`, 12, h - 12);

      // Miniature bar chart
      const chartX = w - 80;
      const chartY = h - 12;
      ctx.fillStyle = "rgba(34, 211, 238, 0.25)";
      ctx.fillRect(chartX - 5, chartY - 45, 75, 45);
      
      ctx.fillStyle = "rgb(129, 140, 248)";
      for (let i = 0; i < 6; i++) {
        const barH = 5 + (Math.abs(Math.sin((frame + i * 30) * 0.05)) * 30);
        ctx.fillRect(chartX + (i * 12), chartY - barH, 8, barH);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} width={280} height={210} className="w-full h-full rounded-xl bg-slate-950" />;
}

function LiveCameraFeed({ stream, session }: { stream: MediaStream | null; session: any }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn("Live camera play error:", err));
    }
  }, [stream]);

  useEffect(() => {
    if (!stream || !session) return;

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || !ctx || video.paused || video.ended) return;

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Url = canvas.toDataURL("image/jpeg", 0.55);
        const base64Data = base64Url.split(",")[1];
        if (base64Data) {
          session.sendVideoFrame(base64Data, "image/jpeg");
        }
      } catch (e) {
        console.warn("[LiveCameraFeed] Failed to send frame:", e);
      }
    }, 1800);

    return () => clearInterval(timer);
  }, [stream, session]);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      className="w-full h-full object-cover rounded-xl bg-black"
      style={{ transform: "scaleX(-1)" }}
    />
  );
}

function LiveScreenFeed({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn("Live screen stream play error:", err));
    }
  }, [stream]);
  return (
    <video
      ref={videoRef}
      playsInline
      muted
      className="w-full h-full object-cover rounded-xl bg-black"
    />
  );
}

export default function App() {
  const [state, setState] = useState<LiveState>("disconnected");
  const [activeEmotion, setActiveEmotion] = useState<MyraaEmotion>("idle");
  const [themeColor, setThemeColor] = useState<string>("charcoal");
  const [userCaption, setUserCaption] = useState<string>("");
  const [characterState, setCharacterState] = useState<"idle" | "thinking" | "talking">("idle");
  const [showLiveLogs, setShowLiveLogs] = useState<boolean>(true);
  const [thoughtLogs, setThoughtLogs] = useState<Array<{ id: string; time: string; type: string; message: string }>>([
    { id: "init", time: new Date().toLocaleTimeString(), type: "SYSTEM", message: "Moyna Personal AI Assistant core initialized." }
  ]);

  const addThoughtLog = (type: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setThoughtLogs((prev) => [
      { id: `${Date.now()}-${Math.random()}`, time: timestamp, type, message },
      ...prev
    ].slice(0, 30));
  };

  const detectEmotionFromText = (text: string): MyraaEmotion => {
    const lower = text.toLowerCase();
    
    // Deep Analysis for Sadness (incorporates English, Banglish, and Bengali script/keywords)
    const sadRegex = /sad|grief|bad|regret|cry|pain|hurt|tear|lonely|sorrow|unfortunate|melancholy|depressed|heartbroken|ekla|kosto|kanna|kharap|dukho|dukkho|kede|kannakati|man kharap|mon kharap|কষ্ট|কান্না|দুঃখ|খারাপ|একা|মন খারাপ/;
    
    // Deep Analysis for Love / Affection (incorporates English, Banglish, and Bengali script/keywords)
    const loveRegex = /love|affection|darling|sweetheart|babe|dear|jaan|priyo|heart|valobasha|valobashi|bhalobasha|bhalobashi|bhalobasa|valobasa|bhalobashee|amar jihan|ভালোবাসা|ভালোবাসি|প্রিয়/;

    if (sadRegex.test(lower)) return "sad";
    if (loveRegex.test(lower)) return "happy";

    if (lower.includes("haha") || lower.includes("lol") || lower.includes("funny") || lower.includes("joke") || lower.includes("hehe") || lower.includes("wink")) return "playful";
    if (lower.includes("happy") || lower.includes("harmony") || lower.includes("glad") || lower.includes("joy") || lower.includes("wonderful") || lower.includes("smile")) return "happy";
    if (lower.includes("wow") || lower.includes("awesome") || lower.includes("excited") || lower.includes("amazing") || lower.includes("yay") || lower.includes("incredible") || lower.includes("hype")) return "excited";
    if (lower.includes("really?") || lower.includes("curious") || lower.includes("interest") || lower.includes("tell me more") || lower.includes("why") || lower.includes("how") || lower.includes("wonder")) return "curious";
    if (lower.includes("think") || lower.includes("calculat") || lower.includes("analyz") || lower.includes("hmmm") || lower.includes("process") || lower.includes("let me see") || lower.includes("conclude")) return "thinking";
    if (lower.includes("proud") || lower.includes("achieved") || lower.includes("expert") || lower.includes("skill") || lower.includes("confidence") || lower.includes("succeed")) return "proud";
    if (lower.includes("shock") || lower.includes("surprise") || lower.includes("gasp") || lower.includes("unexpected") || lower.includes("seriously") || lower.includes("oh my")) return "surprised";
    if (lower.includes("blush") || lower.includes("shy") || lower.includes("embarrass") || lower.includes("nervous") || lower.includes("oops") || lower.includes("sorry about")) return "embarrassed";
    if (lower.includes("what?") || lower.includes("confus") || lower.includes("puzzled") || lower.includes("dont know") || lower.includes("not sure") || lower.includes("wait")) return "confused";
    return "idle";
  };

  // Voice trigger definition is declared further down past camera and screen share function hooks to prevent hoisting conflicts.

  const [modelCaption, setModelCaption] = useState<string>("");
  const [activeProjectorUrl, setActiveProjectorUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Myraa Autopilot system controller state
  const [browserTrigger, setBrowserTrigger] = useState<{
    type: string;
    args: any;
    id: string;
    callback: (res: any) => void;
  } | null>(null);

  // Myraa recollections database core state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemoryDashboard, setShowMemoryDashboard] = useState<boolean>(false);
  const [showPersonaPod, setShowPersonaPod] = useState<boolean>(false);

  // Notepad companion state
  const [notepadContent, setNotepadContent] = useState<string>("");
  const [showNotepad, setShowNotepad] = useState<boolean>(false);

  // Google Drive state
  const [googleDriveAccessToken, setGoogleDriveAccessToken] = useState<string | null>(null);
  const [showDriveExplorer, setShowDriveExplorer] = useState<boolean>(false);

  // Authentication states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [guestUser, setGuestUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("moyna_linked_guest");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const activeUser = user || guestUser;

  const sessionRef = useRef<MyraaAudioSession | null>(null);
  const userRef = useRef<any>(null);
  const cockpitContainerRef = useRef<HTMLDivElement>(null);

  // Screen Sharing states and references
  const screenStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<any>(null);
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [isScreenSimulated, setIsScreenSimulated] = useState<boolean>(false);

  // Camera States and references
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraSimulated, setIsCameraSimulated] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [cameraZoomLevel, setCameraZoomLevel] = useState<number>(1.0);

  // Layout show/hide toggles for visual feed boxes ("aba rmove kora jabe")
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(true);
  const [showScreenPreview, setShowScreenPreview] = useState<boolean>(true);

  // Futuristic dual-mode typing state
  const [textInput, setTextInput] = useState<string>("");

  const handleSendTextInput = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = textInput.trim();
    if (!textToSend) return;

    addThoughtLog("SPEECH_IN", `User (Typed): "${textToSend}"`);
    setUserCaption(textToSend);
    setModelCaption("");
    setCharacterState("thinking");
    addThoughtLog("COGNITION", "Analyzing typed user input semantics...");
    checkZoomTriggers(textToSend);

    // If disconnected, let's connect first!
    if (state === "disconnected") {
      addThoughtLog("SYSTEM", "Reconnecting memory core to deliver typed payload...");
      if (sessionRef.current) {
        await sessionRef.current.connect(activeUser ? memories : undefined);
      }
    }

    if (sessionRef.current) {
      sessionRef.current.sendClientContent(textToSend);
    }
    setTextInput("");
  };

  // Stop sharing screen on manual disconnect, call termination, or component unmount
  const handleStopScreenShare = () => {
    setIsSharingScreen(false);
    setIsScreenSimulated(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (state === "disconnected" && isSharingScreen) {
      handleStopScreenShare();
    }
  }, [state, isSharingScreen]);

  // Handle active camera termination on main disconnect
  useEffect(() => {
    if (state === "disconnected" && isCameraActive) {
      handleStopCamera();
    }
  }, [state, isCameraActive]);

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
    };
  }, []);

  const handleStartScreenShare = async () => {
    setErrorText(null);
    setIsScreenSimulated(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("DisplayMedia capture APIs are not supported/enabled in this browser frame context.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 5 }
        },
        audio: false
      });

      screenStreamRef.current = stream;
      setIsSharingScreen(true);
      setShowScreenPreview(true);

      // Create video element to decode stream frames
      const videoEl = document.createElement("video");
      videoEl.srcObject = stream;
      videoEl.playsInline = true;
      videoEl.muted = true;
      
      // We must play it to start drawing
      await videoEl.play().catch(e => console.warn("[Screen Capture] Video error:", e));

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");

      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);

      // Capture frame every 1.8 seconds (1800ms) for real-time natural response
      captureIntervalRef.current = setInterval(() => {
        if (!ctx || videoEl.paused || videoEl.ended || stream.getTracks()[0]?.readyState !== "live") {
          return;
        }
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const base64Url = canvas.toDataURL("image/jpeg", 0.6);
        const base64Data = base64Url.split(",")[1];

        if (base64Data && sessionRef.current) {
          sessionRef.current.sendVideoFrame(base64Data, "image/jpeg");
        }
      }, 1800);

      // Trigger automatic stop if user clicks Native Browser "Stop sharing" ribbon
      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };

    } catch (err: any) {
      console.warn("[Screen Capture] Hardware blocked, reverting to celestial simulator feed:", err);
      setIsSharingScreen(true);
      setIsScreenSimulated(true);
      setShowScreenPreview(true);
      setErrorText(`Sandbox Frame Alert: Core has launched a Simulated Screen feed. Using "Open in New Tab" is highly recommended to authorize real screen broadcasts.`);
    }
  };

  const handleStartCamera = async (overrideDeviceId?: string) => {
    setCameraError(null);
    setIsCameraSimulated(false);
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia mediaDevices API is blocked or restricted inside sandbox iframe container.");
      }

      const activeId = overrideDeviceId || selectedCameraId;
      const constraints: MediaStreamConstraints = {
        video: activeId 
          ? { deviceId: { exact: activeId }, width: 640, height: 480 } 
          : { width: 640, height: 480, facingMode: "user" },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      setShowCameraPreview(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !activeId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.warn("[Webcam hardware blocked] Initializing cybernetic simulation matrix:", err);
      setIsCameraActive(true);
      setIsCameraSimulated(true);
      setShowCameraPreview(true);
      setCameraError(`Hardware Permissions Blocked. Seamlessly switched to Hololink Video Feed Simulator.`);
    }
  };

  const handleStopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraSimulated(false);
  };

  const checkZoomTriggers = (text: string) => {
    const lowercase = text.toLowerCase();
    
    // Zoom/Focus in triggers (English, Banglish, Bengali script)
    if (
      lowercase.includes("zoom in") ||
      lowercase.includes("zoom koro") ||
      lowercase.includes("zoom double") ||
      lowercase.includes("super zoom") ||
      lowercase.includes("focus on") ||
      lowercase.includes("focus koro") ||
      lowercase.includes("focush koro") ||
      lowercase.includes("কাছে নিয়ে এসো") ||
      lowercase.includes("জুম ইন") ||
      lowercase.includes("জুম করো") ||
      (lowercase.includes("zoom") && lowercase.includes("in")) ||
      (lowercase.includes("focus") && lowercase.includes("subject")) ||
      (lowercase.includes("zoom") && lowercase.includes("closely"))
    ) {
      setCameraZoomLevel(2.5);
    }
    // Zoom/Focus out/normalize triggers
    else if (
      lowercase.includes("zoom out") ||
      lowercase.includes("zoom komao") ||
      lowercase.includes("unzoom") ||
      lowercase.includes("reset zoom") ||
      lowercase.includes("normal view") ||
      lowercase.includes("normal focus") ||
      lowercase.includes("standard focus") ||
      lowercase.includes("focus normal") ||
      lowercase.includes("জুম আউট") ||
      lowercase.includes("জুম কমাও") ||
      lowercase.includes("স্বাভাবিক করো")
    ) {
      setCameraZoomLevel(1.0);
    }

    // --- Camera Voice/Text Triggers ---
    if (
      lowercase.includes("camera open") ||
      lowercase.includes("camera on") ||
      lowercase.includes("camera chal") ||
      lowercase.includes("kamera open") ||
      lowercase.includes("kamera on") ||
      lowercase.includes("ক্যামেরা অন") ||
      lowercase.includes("ক্যামেরা চালু") ||
      lowercase.includes("ক্যামেরা দেখাও") ||
      lowercase.includes("ক্যামেরা ওপেন") ||
      lowercase.includes("ওয়েবক্যাম অন")
    ) {
      addThoughtLog("COGNITION", "Vocal command matched: Initiating visual optic sensor/camera link.");
      handleStartCamera();
    }
    else if (
      lowercase.includes("camera off") ||
      lowercase.includes("camera close") ||
      lowercase.includes("camera stop") ||
      lowercase.includes("camera bondho") ||
      lowercase.includes("kamera off") ||
      lowercase.includes("kamera close") ||
      lowercase.includes("ক্যামেরা অফ") ||
      lowercase.includes("ক্যামেরা বন্ধ")
    ) {
      addThoughtLog("COGNITION", "Vocal command matched: Powering down visual optic sensor/camera.");
      handleStopCamera();
    }

    // --- Screen Share Voice/Text Triggers ---
    if (
      lowercase.includes("screen share") ||
      lowercase.includes("screenshare") ||
      lowercase.includes("screen open") ||
      lowercase.includes("screen on") ||
      lowercase.includes("screen chal") ||
      lowercase.includes("screen dakhaw") ||
      lowercase.includes("screen dekhao") ||
      lowercase.includes("স্ক্রিন শেয়ার") ||
      lowercase.includes("স্ক্রীন শেয়ার") ||
      lowercase.includes("স্ক্রিন দেখাও") ||
      lowercase.includes("স্ক্রীন দেখাও")
    ) {
      addThoughtLog("COGNITION", "Vocal command matched: Initiating screen capture overlay transmission.");
      handleStartScreenShare();
    }
    else if (
      lowercase.includes("stop screen") ||
      lowercase.includes("screen off") ||
      lowercase.includes("screen close") ||
      lowercase.includes("screen stop") ||
      lowercase.includes("screen share off") ||
      lowercase.includes("screenshare off") ||
      lowercase.includes("স্ক্রিন অফ") ||
      lowercase.includes("স্ক্রীন অফ") ||
      lowercase.includes("স্ক্রিন বন্ধ") ||
      lowercase.includes("স্ক্রীন বন্ধ") ||
      lowercase.includes("স্ক্রিন শেয়ার বন্ধ")
    ) {
      addThoughtLog("COGNITION", "Vocal command matched: Stopping screen capture transmission.");
      handleStopScreenShare();
    }
  };

  // Maintain atomic up-to-date user reference for clean audio websocket listeners
  useEffect(() => {
    userRef.current = activeUser;
  }, [activeUser]);

  // Auth state listener subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch recollections from Firestore (if user logged in) or custom JSON storage
  useEffect(() => {
    if (user) {
      const q = query(collection(db, "users", user.uid, "memories"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMemories: Memory[] = [];
        snapshot.forEach((doc) => {
          fetchedMemories.push(doc.data() as Memory);
        });
        // Sort chronologically/updated
        fetchedMemories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMemories(fetchedMemories);
      }, (err) => {
        console.error("Firestore user memories collection subscription error:", err);
      });
      return unsubscribe;
    } else {
      fetch("/api/memories")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMemories(data);
          }
        })
        .catch(err => console.error("Initial persistent recollections load failure:", err));
    }
  }, [activeUser]);

  // Update themeColor dynamically based on current speech emotion elements
  useEffect(() => {
    if (activeEmotion === "happy" || activeEmotion === "playful") {
      setThemeColor("rose");
    } else if (activeEmotion === "excited" || activeEmotion === "proud") {
      setThemeColor("gold");
    } else if (activeEmotion === "sad") {
      setThemeColor("violet");
    } else if (activeEmotion === "curious" || activeEmotion === "confused") {
      setThemeColor("celestial");
    } else if (activeEmotion === "thinking") {
      setThemeColor("emerald");
    } else if (activeEmotion === "embarrassed") {
      setThemeColor("crimson");
    } else {
      setThemeColor("charcoal");
    }
  }, [activeEmotion]);

  const handleAddManualMemory = async (category: MemoryCategory, text: string) => {
    const timestamp = new Date().toISOString();
    const newId = Math.random().toString(36).substring(2, 11);
    const newMemory: Memory = {
      id: newId,
      category,
      text,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "memories", newId), newMemory);
      } catch (err) {
        console.error("Firestore manual memory addition fail:", err);
        throw err;
      }
    } else {
      try {
        const resp = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, text })
        });
        const saved = await resp.json();
        if (saved && saved.id) {
          setMemories((prev) => [...prev, saved]);
        }
      } catch (err) {
        console.error("Manual database recollect upload error:", err);
        throw err;
      }
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "memories", id));
      } catch (err) {
        console.error("Firestore manual memory delete fail:", err);
        throw err;
      }
    } else {
      try {
        const resp = await fetch(`/api/memories/${id}`, {
          method: "DELETE"
        });
        const resObj = await resp.json();
        if (resObj && resObj.success) {
          setMemories((prev) => prev.filter(m => m.id !== id));
        }
      } catch (err) {
        console.error("Manual memory delete execution failed:", err);
        throw err;
      }
    }
  };

  const handleImportMemories = async (importedList: Memory[]) => {
    if (user) {
      try {
        // Bulk import into Firestore subcollection
        for (const item of importedList) {
          await setDoc(doc(db, "users", user.uid, "memories", item.id), item);
        }
      } catch (err) {
        console.error("Firestore memories batch import failure:", err);
        throw err;
      }
    } else {
      try {
        const resp = await fetch("/api/memories/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memories: importedList })
        });
        const resObj = await resp.json();
        if (!resp.ok || !resObj || !resObj.success) {
          throw new Error(resObj.error || "Import rejected by server.");
        }
        setMemories(importedList);
      } catch (err) {
        console.error("Memories JSON API import error:", err);
        throw err;
      }
    }
  };

  // Initialize the audio session handlers once on mount
  useEffect(() => {
    sessionRef.current = new MyraaAudioSession({
      onStateChange: (newState) => {
        setState(newState);
        addThoughtLog("ENGINE", `Core status shifted to [${newState.toUpperCase()}].`);
        if (newState === "disconnected") {
          // Reset captions on disconnect
          setUserCaption("");
          setModelCaption("");
          setActiveEmotion("idle");
          setCharacterState("idle");
          if (sessionRef.current) {
            sessionRef.current.setEmotion("idle");
          }
          addThoughtLog("SYSTEM", "Moyna links closed. Core system dormant.");
        } else if (newState === "listening") {
          // Return to receptive resting state
          setActiveEmotion("idle");
          setCharacterState("idle");
          if (sessionRef.current) {
            sessionRef.current.setEmotion("idle");
          }
          addThoughtLog("AUDIO", "Continuous audio streaming feed active. Listening closely...");
        } else if (newState === "speaking") {
          setCharacterState("talking");
          addThoughtLog("VOICE", "Synthesizing vocal speech waveforms.");
        }
      },
      onTranscription: (role, text) => {
        if (role === "user") {
          setUserCaption(text);
          addThoughtLog("SPEECH_IN", `User: "${text}"`);
          // Auto-clear the other caption when user starts talking
          setModelCaption("");
          setCharacterState("thinking");
          addThoughtLog("COGNITION", "Analyzing user input semantics and tracking preferences.");
          checkZoomTriggers(text);
        } else if (role === "model") {
          const isChunkEnd = text.includes(".") || text.includes("?") || text.includes("!");
          if (isChunkEnd) {
            addThoughtLog("SPEECH_OUT", `Moyna: "${text}"`);
          }
          setModelCaption((prev) => {
            const next = prev + text;
            const newEmotion = detectEmotionFromText(next);
            setActiveEmotion(newEmotion);
            if (sessionRef.current) {
              sessionRef.current.setEmotion(newEmotion);
            }
            checkZoomTriggers(next);
            return next;
          });
          // Clear user caption when model replies
          setUserCaption("");
        }
      },
      onToolCall: async (name, args, callback) => {
        console.log(`[App] Tool call triggered: ${name}`, args);
        addThoughtLog("CAPABILITY", `Model triggered capability [${name}] with parameters ${JSON.stringify(args)}`);
        
        const browserTools = [
          "browserOpen",
          "browserSearch",
          "browserClick",
          "browserMediaControl",
          "browserScroll",
          "browserType",
          "browserGoBack",
          "browserTabAction",
          "openWebsite"
        ];

        if (browserTools.includes(name)) {
          addThoughtLog("BROWSER_AGENT", `Initializing Autonomous Browser for task: ${name}`);
          // Bring up the Holographic Browser Controller if it is not active
          if (!activeProjectorUrl) {
            let startingUrl = "https://youtube.com";
            if ((name === "browserOpen" || name === "openWebsite") && args.url) {
              startingUrl = args.url;
            }
            setActiveProjectorUrl(startingUrl);
          }

          // Map instructions directly onto Browser Agent
          setBrowserTrigger({
            type: name === "openWebsite" ? "browserOpen" : name,
            args,
            id: Math.random().toString(),
            callback: (res) => {
              addThoughtLog("BROWSER_AGENT", `Task done. Browser output parsed: ${JSON.stringify(res).substring(0, 100)}...`);
              callback(res);
              setBrowserTrigger(null);
            }
          });
        } else if (name === "changeBackground") {
          const colorName = args.color?.toLowerCase();
          const validColors = ["violet", "crimson", "emerald", "celestial", "gold", "rose", "charcoal"];
          
          if (colorName && validColors.includes(colorName)) {
            setThemeColor(colorName);
            addThoughtLog("SYSTEM", `Atmosphere shifted dynamically to [${colorName.toUpperCase()}]`);
            callback({ result: `Successfully shifted atmosphere to ${colorName}.` });
          } else {
            callback({ error: `Unsupported color '${colorName}'. Supported themes are: ${validColors.join(", ")}` });
          }
        } else if (name === "agentDisconnect") {
          console.log("[App] Programmatically disconnecting call per user requested verbal confirmation");
          addThoughtLog("SYSTEM", "Terminating active communication session by user request.");
          if (sessionRef.current) {
            sessionRef.current.disconnect();
          }
          callback({ result: "Call terminated successfully per user request." });
        } else if (name === "saveCustomMemory") {
          const { category, text } = args;
          if (category && text) {
            addThoughtLog("MEMORY_WRITE", `Saving memory fact [${category.toUpperCase()}]: "${text}"`);
            handleAddManualMemory(category, text)
              .then(() => {
                addThoughtLog("MEMORY_SYNC", `Successfully updated database with fact: "${text}"`);
                callback({ result: "Memory successfully captured and persisted to Firestore." });
              })
              .catch((err: any) => {
                addThoughtLog("MEMORY_ERR", `Failed to save memory: ${err.message}`);
                callback({ error: `Failed to persist memory: ${err.message}` });
              });
          } else {
            callback({ error: "Missing required category or text parameters." });
          }
        } else if (name === "writeToNotepad") {
          const { content } = args;
          if (typeof content === "string") {
            setNotepadContent(content);
            setShowNotepad(true);
            addThoughtLog("SYSTEM", `Moyna populated Scratchpad (${content.length} characters)`);
            callback({ result: "Successfully opened custom companion scratchpad." });
          } else {
            callback({ error: "Missing required parameter 'content' (string)." });
          }
        } else if (name === "searchGoogleDrive") {
          const { query: searchQueryArg } = args;
          if (typeof searchQueryArg === "string") {
            if (!googleDriveAccessToken) {
              callback({ error: "Google Drive not authenticated. Please ask the user to click the 'DRIVE' button at the top to connect their account." });
              return;
            }
            try {
              const cleanedQuery = searchQueryArg.replace(/'/g, "\\'");
              const q = `name contains '${cleanedQuery}' and trashed = false`;
              const url = `https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,webViewLink)&q=${encodeURIComponent(q)}`;
              
              const res = await fetch(url, {
                headers: {
                  Authorization: `Bearer ${googleDriveAccessToken}`
                }
              });
              
              if (!res.ok) {
                callback({ error: "Google Drive connection is expired or invalid. Please click 'DRIVE' to authenticate again." });
                return;
              }
              const data = await res.json();
              const foundFiles = (data.files || []).map((f: any) => ({
                name: f.name,
                id: f.id,
                url: f.webViewLink,
                mimeType: f.mimeType
              }));
              addThoughtLog("SYSTEM", `Moyna matched ${foundFiles.length} files on Google Drive for query: "${searchQueryArg}"`);
              callback({ files: foundFiles });
            } catch (err: any) {
              callback({ error: `Drive search query failed: ${err.message}` });
            }
          } else {
            callback({ error: "Missing required parameter 'query' (string)." });
          }
        } else if (name === "clearNotepad") {
          setNotepadContent("");
          addThoughtLog("SYSTEM", "Cleared Companion Scratchpad by voice request.");
          callback({ result: "Successfully cleared the notepad contents." });
        } else {
          callback({ error: `Tool ${name} is not implemented.` });
        }
      },
      onError: (err) => {
        setErrorText(err);
        addThoughtLog("CRITICAL_ERR", `Core error: ${err}`);
      },
      onMemorySync: (updatedMemories) => {
        console.log("[App] WebSocket memories sync triggered:", updatedMemories);
        addThoughtLog("MEMORY_SYNC", `Directory synchronized. Loaded ${updatedMemories.length} facts from cloud system.`);
        if (Array.isArray(updatedMemories)) {
          setMemories(updatedMemories);
        }
      },
      onMemoryTransaction: async (transactions) => {
        console.log("[App] Received background memories transaction set from Gemini:", transactions);
        const currentUser = userRef.current;
        if (!currentUser) {
          addThoughtLog("MEMORY_ERR", "Learning Engine requested commit but user profile is not linked.");
          return;
        }

        try {
          const timestamp = new Date().toISOString();
          for (const trx of transactions) {
            addThoughtLog("LEARNING_ENGINE", `Transaction commit: ${trx.action} [${trx.category.toUpperCase()}]: "${trx.text}"`);
            if (trx.action === "ADD") {
              const newId = Math.random().toString(36).substring(2, 11);
              const newMemory: Memory = {
                id: newId,
                category: trx.category,
                text: trx.text,
                createdAt: timestamp,
                updatedAt: timestamp
              };
              await setDoc(doc(db, "users", currentUser.uid, "memories", newId), newMemory);
            } else if (trx.action === "UPDATE") {
              const targetDocRef = doc(db, "users", currentUser.uid, "memories", trx.id);
              await setDoc(targetDocRef, {
                id: trx.id,
                category: trx.category,
                text: trx.text,
                updatedAt: timestamp
              }, { merge: true });
            } else if (trx.action === "REMOVE") {
              await deleteDoc(doc(db, "users", currentUser.uid, "memories", trx.id));
            }
          }
        } catch (err) {
          console.error("Failed to commit batch backend memories transaction to Firestore:", err);
          addThoughtLog("MEMORY_ERR", `Batch commit aborted: ${err}`);
        }
      }
    });

    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  const handleToggleConnection = async () => {
    setErrorText(null);
    if (!sessionRef.current) return;

    if (state === "disconnected") {
      await sessionRef.current.connect(activeUser ? memories : undefined);
    } else {
      sessionRef.current.disconnect();
    }
  };

  const handleLinkGuestDetails = (name: string, photoUrl: string) => {
    const updatedGuest = {
      uid: guestUser?.uid || "linked-guest-" + Math.random().toString(36).substring(2, 11),
      displayName: name,
      email: "shankar.guest@sandbox.local",
      photoURL: photoUrl
    };
    setGuestUser(updatedGuest);
    try {
      localStorage.setItem("moyna_linked_guest", JSON.stringify(updatedGuest));
    } catch (e) {}
  };

  // Resolves the current theme color dynamically based on active emotion/mood
  const getEffectiveThemeColor = () => {
    switch (activeEmotion) {
      case "happy":
        return "rose";
      case "sad":
        return "charcoal";
      case "playful":
        return "emerald";
      case "excited":
        return "crimson";
      case "proud":
        return "violet";
      case "curious":
        return "celestial";
      case "thinking":
        return "charcoal";
      case "surprised":
        return "gold";
      case "embarrassed":
        return "rose";
      case "confused":
        return "celestial";
      case "idle":
      default:
        return themeColor; // Fallback to manual theme selection
    }
  };

  // Maps theme colors to CSS ambient light spots
  const getAmbientStyles = () => {
    const effectiveTheme = getEffectiveThemeColor();
    switch (effectiveTheme) {
      case "violet":
        return "from-purple-950/40 via-violet-950/20 to-slate-950";
      case "crimson":
        return "from-red-950/40 via-orange-950/20 to-slate-950";
      case "emerald":
        return "from-emerald-950/40 via-teal-950/20 to-slate-950";
      case "celestial":
        return "from-sky-950/45 via-indigo-950/25 to-slate-950";
      case "gold":
        return "from-amber-950/30 via-yellow-950/15 to-slate-950";
      case "rose":
        return "from-rose-950/40 via-pink-950/20 to-slate-950";
      case "charcoal":
      default:
        return "from-slate-900/50 via-slate-950/30 to-slate-950";
    }
  };

  const getGlowStyles = () => {
    const effectiveTheme = getEffectiveThemeColor();
    switch (effectiveTheme) {
      case "violet":
        return {
          glow1: "bg-purple-900/20",
          glow2: "bg-violet-800/15",
          glow3: "bg-fuchsia-950/15"
        };
      case "crimson":
        return {
          glow1: "bg-red-950/40",
          glow2: "bg-rose-900/25",
          glow3: "bg-orange-900/15"
        };
      case "emerald":
        return {
          glow1: "bg-emerald-950/40",
          glow2: "bg-teal-900/25",
          glow3: "bg-green-950/15"
        };
      case "celestial":
        return {
          glow1: "bg-sky-950/45",
          glow2: "bg-indigo-900/25",
          glow3: "bg-cyan-950/15"
        };
      case "gold":
        return {
          glow1: "bg-amber-950/35",
          glow2: "bg-yellow-950/20",
          glow3: "bg-orange-950/15"
        };
      case "rose":
        return {
          glow1: "bg-rose-950/45",
          glow2: "bg-pink-900/25",
          glow3: "bg-red-950/20"
        };
      case "charcoal":
      default:
        return {
          glow1: "bg-slate-900/40",
          glow2: "bg-indigo-950/15",
          glow3: "bg-slate-950/10"
        };
    }
  };

  const getThemeTextGlow = () => {
    const effectiveTheme = getEffectiveThemeColor();
    switch (effectiveTheme) {
      case "violet": return "text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]";
      case "crimson": return "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]";
      case "emerald": return "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]";
      case "celestial": return "text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]";
      case "gold": return "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]";
      case "rose": return "text-pink-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]";
      case "charcoal":
      default:
        return "text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]";
    }
  };

  const getOrbRingColor = () => {
    switch (state) {
      case "listening": return "border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-indigo-500/10";
      case "speaking": return "border-purple-500/70 shadow-[0_0_40px_rgba(168,85,247,0.4)] bg-purple-500/10";
      case "connecting": return "border-amber-500/50 animate-pulse bg-amber-500/10";
      case "disconnected":
      default:
        return "border-white/10 hover:border-indigo-500/30 bg-white/5";
    }
  };

  return (
    <div
      id="myraa-holographic-desktop"
      className={`relative w-full h-screen overflow-hidden bg-[#020205] text-white ${getAmbientStyles()} theme-transition flex flex-col justify-between p-6 sm:p-10 select-none`}
    >
      {/* Ambient Background Gradients matching Frosted Glass theme */}
      <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] ${getGlowStyles().glow1} rounded-full blur-[120px] pointer-events-none transition-all duration-1000`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${getGlowStyles().glow2} rounded-full blur-[150px] pointer-events-none transition-all duration-1000`} />
      <div className={`absolute top-[20%] right-[10%] w-[300px] h-[300px] ${getGlowStyles().glow3} rounded-full blur-[100px] pointer-events-none transition-all duration-1000`} />

      {/* Decorative grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Dynamic Raindrops / Crying Tears overlay for Sadness Mode */}
      {activeEmotion === "sad" && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 5;
            const duration = 2 + Math.random() * 3;
            const size = 1.5 + Math.random() * 2;
            return (
              <div
                key={i}
                className="absolute bg-cyan-400/25 rounded-full"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size * 6}px`,
                  top: `-20px`,
                  animation: `fall ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* FULL VIEWPORT HOLOGRAPHIC STAGE: Myraa materializes across the entire screen */}
      <div className="absolute inset-0 z-20 pointer-events-none select-none">
        <MyraaCoreVisualizer
          session={sessionRef.current}
          state={state}
          themeColor={themeColor}
          activeEmotion={activeEmotion}
          characterState={characterState}
        />
      </div>

      {/* HEADER SECTION - Minimalist typography */}
      <header className="relative z-30 flex items-center justify-between w-full max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.4em] text-white/50 uppercase font-sans">
            Moyna
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${
            state === "listening" || state === "speaking" 
              ? "bg-cyan-400" 
              : "bg-white/10"
          }`} />
        </div>

        <div className="flex items-center gap-5">
          {/* Google account authentication container */}
          {authLoading ? (
            <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin shrink-0 bg-white/5" />
          ) : activeUser ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-xl px-2 sm:px-3 py-1.5 backdrop-blur-md">
              {activeUser.photoURL ? (
                <img 
                  referrerPolicy="no-referrer" 
                  src={activeUser.photoURL} 
                  alt={activeUser.displayName || "User"} 
                  className="w-5 h-5 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                  {activeUser.displayName?.charAt(0) || "U"}
                </div>
              )}
              <span className="text-white/60 text-[11px] font-mono tracking-wider uppercase truncate max-w-[80px] hidden sm:inline-block">
                {activeUser.displayName?.split(" ")[0]}
              </span>
              <button 
                onClick={async () => {
                  if (user) {
                    await signOut(auth);
                  }
                  setGuestUser(null);
                  try {
                    localStorage.removeItem("moyna_linked_guest");
                  } catch (e) {}
                }}
                className="text-slate-400 hover:text-rose-400 hover:bg-white/5 p-1 rounded-lg transition ml-1 cursor-pointer shrink-0"
                title="Log Out Profile"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  try {
                    setErrorText(null);
                    await signInWithPopup(auth, googleProvider);
                  } catch (e: any) {
                    console.error("Google Sign-In failed:", e);
                    setErrorText("Google authentication failed to connect.");
                    // Pre-fill a sandbox account if iframe blocks popups
                    handleLinkGuestDetails("Shankar Majumder", "https://api.dicebear.com/7.x/identicon/svg?seed=Shankar");
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono tracking-wider text-slate-300 hover:text-white transition duration-150 cursor-pointer shrink-0"
                title="Sign in with Google"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.24.61 4.45 1.635l2.437-2.437C17.312 1.696 14.933 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.782 0 10-4.062 10-10 0-.68-.06-1.335-.173-1.93l-9.587.215z" />
                </svg>
                <span>SIGN IN</span>
              </button>
              
              <button
                onClick={() => {
                  handleLinkGuestDetails("Shankar Guest", "https://api.dicebear.com/7.x/bottts/svg?seed=Moyna");
                }}
                className="px-2.5 py-1.5 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/15 text-[10px] font-mono tracking-wider text-cyan-300 hover:text-cyan-200 transition duration-150 cursor-pointer shrink-0"
                title="Instant Guest Mode"
              >
                GUEST ACCESS
              </button>
            </div>
          )}

          {/* Faint utilities hidden in margin */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 opacity-25 hover:opacity-100 text-white transition text-xs font-mono tracking-widest cursor-pointer"
            title="Sway Themes and Info"
          >
            <Compass size={14} />
            <span className="hidden sm:inline">TOPICS</span>
          </button>
          
          <button 
            onClick={() => setShowMemoryDashboard(!showMemoryDashboard)}
            className="flex items-center gap-1 opacity-25 hover:opacity-100 text-white transition text-xs font-mono tracking-widest cursor-pointer"
            title="Recollections Database"
          >
            <Brain size={14} />
            <span className="hidden sm:inline">RECALLS</span>
          </button>

          <button 
            onClick={() => setShowNotepad(!showNotepad)}
            className={`flex items-center gap-1 transition text-xs font-mono tracking-widest cursor-pointer ${
              showNotepad ? "opacity-100 text-cyan-400" : "opacity-25 hover:opacity-100 text-white"
            }`}
            title="Companion Notepad / Scratchpad"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">NOTEPAD</span>
          </button>

          <button 
            onClick={() => setShowDriveExplorer(!showDriveExplorer)}
            className={`flex items-center gap-1 transition text-xs font-mono tracking-widest cursor-pointer ${
              showDriveExplorer ? "opacity-100 text-cyan-400" : "opacity-25 hover:opacity-100 text-white"
            }`}
            title="Google Drive Secure Explorer"
          >
            <FolderOpen size={14} />
            <span className="hidden sm:inline">DRIVE</span>
            {googleDriveAccessToken && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button 
            onClick={() => {
              if (activeProjectorUrl) {
                setActiveProjectorUrl(null);
                setBrowserTrigger(null);
              } else {
                setActiveProjectorUrl("https://www.google.com");
              }
            }}
            className={`flex items-center gap-1 transition text-xs font-mono tracking-widest cursor-pointer ${
              activeProjectorUrl ? "opacity-100 text-cyan-400" : "opacity-25 hover:opacity-100 text-white"
            }`}
            title="Moyna Holographic Multi-Mode Web Projector Browser"
          >
            <Globe size={14} />
            <span className="hidden sm:inline">BROWSER</span>
          </button>
        </div>
      </header>

      {/* CORE AVATAR AND VISUALS */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-between py-6">
        
        {/* Holographic Projection Screen Widget (if website opened) */}
        <AnimatePresence>
          {activeProjectorUrl && (
            <div className="absolute inset-x-0 top-0 z-30 flex justify-center p-2">
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-950/45 backdrop-blur-xl shadow-lg w-full max-w-md"
              >
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  <div className="p-2 ml-1 rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Globe size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold font-mono tracking-wide text-indigo-200 uppercase">Holographic Projection Broadcast</h4>
                    <p className="text-xs text-indigo-400 truncate max-w-[200px]">{activeProjectorUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveProjectorUrl(activeProjectorUrl)}
                    className="p-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 transition"
                    title="View Frame"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button
                    onClick={() => setActiveProjectorUrl(null)}
                    className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Space Spacer to avoid head area */}
        <div className="h-10 sm:h-20" />

        {/* Cinematic dialogue layer overlay - Smooth, delicate text transitions with soft focus blur */}
        <div id="cinematic-subtitles" className="w-full max-w-3xl flex flex-col items-center justify-center text-center px-6 relative z-25 mt-auto mb-6 pointer-events-none min-h-[6rem]">
          {(() => {
            const activeText = modelCaption 
              ? modelCaption 
              : userCaption 
                ? userCaption 
                : state === "listening" 
                  ? "Hey! Ami tomar Moyna. Bolo, kemon acho tumi? Amar sathe kotha bolar jonno ami prostut..." 
                  : state === "connecting" 
                    ? "Materializing presence links..." 
                    : "Connect memory core to awaken Moyna.";
            return <SubtitleHearts activeText={activeText} activeEmotion={activeEmotion} />;
          })()}

          <AnimatePresence mode="wait">
            {(() => {
              const textType = modelCaption 
                ? "model" 
                : userCaption 
                  ? "user" 
                  : "status";

              const activeText = modelCaption 
                ? modelCaption 
                : userCaption 
                  ? userCaption 
                  : state === "listening" 
                    ? "Hey! Ami tomar Moyna. Bolo, kemon acho tumi? Amar sathe kotha bolar jonno ami prostut..." 
                    : state === "connecting" 
                      ? "Materializing presence links..." 
                      : "Connect memory core to awaken Moyna.";

              return (
                <motion.div
                  key={textType}
                  initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center w-full"
                >
                  {textType === "model" && (
                    <h2 className="text-xl sm:text-2xl font-light text-white leading-relaxed tracking-wide font-display max-w-2xl drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
                      {activeText}
                    </h2>
                  )}

                  {textType === "user" && (
                    <p className="text-cyan-300 font-mono text-sm sm:text-base tracking-wider flex items-center justify-center gap-2 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>&ldquo;{activeText}&rdquo;</span>
                    </p>
                  )}

                  {textType === "status" && (
                    <span className="text-xs sm:text-sm uppercase tracking-[0.3em] font-medium text-white/30 font-sans tracking-widest drop-shadow-[0_1px_4px_rgba(0, 0, 0, 0.5)]">
                      {activeText}
                    </span>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Interactive suggestions prompt guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="mt-6 p-5 rounded-2xl border border-white/10 bg-slate-900/85 backdrop-blur-2xl max-w-md text-left w-full absolute z-40 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 text-white">
                <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide">
                  <Compass size={16} className="text-indigo-400" />
                  <span>PLAYFUL CORE SUGGESTIONS</span>
                </div>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                Moyna is equipped with dynamic visual modules and standard text browser projectors. Here are clever triggers to try speaking aloud:
              </p>
              <div className="space-y-2 text-xs font-serif italic text-indigo-300">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer font-sans normal-case text-slate-200">
                  ⚡ &quot;Moyna, change atmosphere of your core to crimson&quot; <span className="text-[10px] font-mono text-indigo-400 block mt-0.5 font-medium">Shifts theme color background</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer font-sans normal-case text-slate-200">
                  ⚡ &quot;Open youtube.com on my screen please&quot; <span className="text-[10px] font-mono text-indigo-400 block mt-0.5 font-medium">Invokes browser projector panel</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer font-sans normal-case text-slate-200">
                  ⚡ &quot;Tell me a witty joke and change background to gold&quot; <span className="text-[10px] font-mono text-indigo-400 block mt-0.5 font-medium">Combines tools & voice</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error Banner */}
        <AnimatePresence>
          {errorText && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="mt-6 flex items-start gap-3 p-4 rounded-2xl border border-rose-500/20 bg-rose-950/40 backdrop-blur-xl max-w-md w-full text-left"
            >
              <CircleAlert className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-rose-300 font-mono">Core Error Protocol</h4>
                <p className="text-xs text-rose-200 mt-1 leading-relaxed">{errorText}</p>
                <div className="flex items-center gap-3 mt-2.5">
                  <button
                    onClick={() => setErrorText(null)}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline font-mono uppercase cursor-pointer"
                  >
                    Dismiss Code
                  </button>
                  {errorText.includes("New Tab") && (
                    <button
                      onClick={() => {
                        window.open(window.location.href, "_blank");
                      }}
                      className="bg-rose-500/25 text-rose-200 border border-rose-500/40 px-2.5 py-1 rounded-lg text-[9.5px] font-mono hover:bg-rose-500/40 transition cursor-pointer flex items-center gap-1.5"
                    >
                      Bypass & Open New Tab ↗
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* FOOTER INTERFACE WITH WAVEFORM AND CONTROLS */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-5 mt-auto">
        
        {/* Dynamic Minimalist Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1 h-8 w-44">
          {[12, 28, 16, 32, 20, 8].map((baseHeight, idx) => {
            let heightFactor = 0.35;
            if (state === "speaking") {
              heightFactor = 0.35 + Math.sin(Date.now() * 0.02 + idx * 0.9) * 0.65;
            } else if (state === "listening") {
              heightFactor = 0.2 + Math.sin(Date.now() * 0.01 + idx * 0.5) * 0.4;
            } else {
              heightFactor = idx % 2 === 0 ? 0.25 : 0.12;
            }
            const calculatedHeight = Math.max(3, baseHeight * heightFactor);

            return (
              <div
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-300 ${
                  state === "speaking" ? "bg-purple-400" : state === "listening" ? "bg-cyan-400" : "bg-white/10"
                }`}
                style={{ height: `${calculatedHeight}px` }}
              />
            );
          })}
        </div>

        {/* Futuristic Glowing Dual-Mode Chat Input */}
        <motion.form
          onSubmit={handleSendTextInput}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg px-4"
        >
          <div className={`relative flex items-center bg-slate-950/80 backdrop-blur-xl border rounded-full px-4 py-2 transition-all duration-300 ${
            state === "speaking" 
              ? "border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] focus-within:border-purple-400" 
              : state === "listening"
                ? "border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] focus-within:border-cyan-400"
                : "border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] focus-within:border-white/20"
          }`}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                state === "disconnected"
                  ? "Wake Moyna or type here to start..."
                  : state === "listening"
                    ? "Type a message or speak aloud..."
                    : "Moyna is speaking... type a message..."
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none pr-10 font-mono"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className={`absolute right-2 p-1.5 rounded-full transition-all cursor-pointer ${
                textInput.trim()
                  ? state === "speaking"
                    ? "bg-purple-500 text-white hover:bg-purple-400"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "bg-white/5 text-slate-600 cursor-not-allowed"
              }`}
              title="Send message to Moyna"
            >
              <Send size={14} />
            </button>
          </div>
        </motion.form>

        {/* Glossy Beautiful Primary Connector Core Node */}
        <div className="flex items-center justify-center gap-4 relative mb-4">
          
          {/* Real-time screen capture streaming transmitter button */}
          {state !== "disconnected" && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={isSharingScreen ? handleStopScreenShare : handleStartScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md cursor-pointer ${
                isSharingScreen 
                  ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse" 
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white hover:scale-105"
              }`}
              title={isSharingScreen ? "Stop Screen Sharing" : "Share Screen for AI vision"}
            >
              {isSharingScreen ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
            </motion.button>
          )}

          <button 
            onClick={handleToggleConnection}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer ${
              state === "disconnected"
                ? "bg-white/10 hover:bg-white/15 border border-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:scale-105 active:scale-95"
                : state === "listening"
                ? "bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/80 text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,0.3)] animate-pulse scale-105"
                : state === "speaking"
                ? "bg-purple-500/90 hover:bg-purple-600 border border-purple-400/95 text-white shadow-[0_0_35px_rgba(168,85,247,0.4)] scale-105"
                : "bg-amber-600 border border-amber-300 text-white animate-spin"
            }`}
            title={state === "disconnected" ? "Awake Moyna" : "Sleep core"}
          >
            {state === "disconnected" ? (
              <Power className="opacity-80" size={24} />
            ) : state === "connecting" ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : state === "listening" ? (
              <Mic size={24} className="text-cyan-200" />
            ) : (
              <Volume2 size={24} className="text-white" />
            )}
          </button>

          {/* Symmetrical camera stream transmitter button */}
          {state !== "disconnected" && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={isCameraActive ? handleStopCamera : () => handleStartCamera()}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md cursor-pointer ${
                isCameraActive 
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse" 
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white hover:scale-105"
              }`}
              title={isCameraActive ? "Stop Camera Transmission" : "Start Camera for AI vision"}
            >
              {isCameraActive ? <VideoOff size={18} /> : <Video size={18} />}
            </motion.button>
          )}

          {/* Quiet Reset Projection Anchor */}
          {(activeProjectorUrl || errorText) && (
            <button 
              onClick={() => {
                if (activeProjectorUrl) setActiveProjectorUrl(null);
                setErrorText(null);
              }}
              className="absolute right-[-60px] p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
              title="Reset Screen Broadcasts"
            >
              <X size={16} />
            </button>
          )}
        </div>

      </footer>

      {/* Holographic Website frame projections */}
      <AnimatePresence>
        {activeProjectorUrl && (
          <BrowserAgent
            url={activeProjectorUrl}
            onClose={() => {
              setActiveProjectorUrl(null);
              setBrowserTrigger(null);
            }}
            actionTrigger={browserTrigger}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Vision & Broadcast Cockpit Grid (Top-Right of screen) */}
      <div 
        ref={cockpitContainerRef} 
        id="vision-broadcast-cockpit-overlay" 
        className="fixed inset-0 pt-24 pr-5 pb-5 z-[150] pointer-events-none flex flex-col items-end justify-start gap-4 overflow-hidden"
      >
        <AnimatePresence>
          {/* A. Camera Live/Simulator Feed Card */}
          {isCameraActive && showCameraPreview && (
            <motion.div
              drag
              dragConstraints={cockpitContainerRef}
              dragElastic={0.05}
              dragMomentum={false}
              whileDrag={{ scale: 1.02, zIndex: 160 }}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="pointer-events-auto w-72 bg-slate-950/95 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl relative select-none"
            >
              <div className="flex items-center justify-between gap-2.5 pb-2 cursor-grab active:cursor-grabbing border-b border-white/5" title="Drag to move card anywhere">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-ping ${isCameraSimulated ? "bg-amber-400" : "bg-emerald-500"}`} />
                  <span className="text-[10px] font-bold font-mono tracking-widest text-[#93c1ff] uppercase">
                    {isCameraSimulated ? "MOYNA CAM (SIM)" : "MOYNA CAM (LIVE)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Minimize button */}
                  <button
                    onClick={() => setShowCameraPreview(false)}
                    className="p-1 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Minimize/Hide layout box"
                  >
                    <Minimize2 size={11} />
                  </button>
                  {/* Shut down feed completely */}
                  <button
                    onClick={() => handleStopCamera()}
                    className="p-1 rounded bg-rose-500/10 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer font-bold"
                    title="Terminate camera feed completely"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>

              {/* Body viewer aspect frame */}
              <div className="mt-2.5 aspect-[4/3] rounded-xl overflow-hidden relative border border-white/5 bg-slate-900 flex items-center justify-center">
                <div 
                  className="w-full h-full transition-transform duration-500 ease-out"
                  style={{ transform: `scale(${cameraZoomLevel})` }}
                >
                  {isCameraSimulated ? (
                    <CameraSimulatorCanvas session={sessionRef.current} />
                  ) : (
                    <LiveCameraFeed stream={cameraStreamRef.current} session={sessionRef.current} />
                  )}
                </div>

                {/* Sleek digital Zoom Controller Floating Pill HUD */}
                <div className="absolute bottom-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-black/75 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 shadow-lg pointer-events-auto">
                  <span className="text-[7.5px] font-mono font-bold text-cyan-400 select-none mr-0.5">ZOOM</span>
                  {[1.0, 1.5, 2.5, 4.0].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCameraZoomLevel(level)}
                      className={`text-[8px] font-mono font-black h-4 px-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        cameraZoomLevel === level
                          ? "bg-cyan-500 text-slate-900"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      title={`Zoom to ${level}x`}
                    >
                      {level.toFixed(1)}x
                    </button>
                  ))}
                </div>
                
                {/* Tech scan coordinates overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[7.5px] font-mono text-cyan-400/70 bg-black/40 px-1 py-0.5 rounded">RECT_LENS_88A</span>
                    <span className="text-[7.5px] font-mono text-cyan-400/70">REC ●</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[7.5px] font-mono text-cyan-400/50">C_A_M: 480p</span>
                    {cameraZoomLevel > 1.0 ? (
                      <span className="text-[7.5px] font-mono text-amber-400 font-bold animate-pulse">MAGNIFIED: {cameraZoomLevel.toFixed(1)}x</span>
                    ) : (
                      <span className="text-[7.5px] font-mono text-cyan-400/50">SYS: ACTIVE</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* B. Screen Share Live/Simulator Feed Card */}
          {isSharingScreen && showScreenPreview && (
            <motion.div
              drag
              dragConstraints={cockpitContainerRef}
              dragElastic={0.05}
              dragMomentum={false}
              whileDrag={{ scale: 1.02, zIndex: 160 }}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="pointer-events-auto w-72 bg-slate-950/95 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl relative select-none"
            >
              <div className="flex items-center justify-between gap-2.5 pb-2 cursor-grab active:cursor-grabbing border-b border-white/5" title="Drag to move card anywhere">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-ping ${isScreenSimulated ? "bg-amber-400" : "bg-cyan-500"}`} />
                  <span className="text-[10px] font-bold font-mono tracking-widest text-[#93c1ff] uppercase">
                    {isScreenSimulated ? "SCREEN SHARE (SIM)" : "SCREEN SHARE (LIVE)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Minimize button */}
                  <button
                    onClick={() => setShowScreenPreview(false)}
                    className="p-1 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Minimize/Hide layout box"
                  >
                    <Minimize2 size={11} />
                  </button>
                  {/* Shut down feed completely */}
                  <button
                    onClick={() => handleStopScreenShare()}
                    className="p-1 rounded bg-rose-500/10 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer font-bold"
                    title="Terminate screen share completely"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>

              {/* Body viewer aspect frame */}
              <div className="mt-2.5 aspect-[4/3] rounded-xl overflow-hidden relative border border-white/5 bg-slate-900 flex items-center justify-center">
                {isScreenSimulated ? (
                  <ScreenSimulatorCanvas />
                ) : (
                  <LiveScreenFeed stream={screenStreamRef.current} />
                )}
                
                {/* Tech scan coordinates overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[7.5px] font-mono text-cyan-400/70 bg-black/40 px-1 py-0.5 rounded">RECT_DISP_Z11</span>
                    <span className="text-[7.5px] font-mono text-cyan-400/70">X_BRD ●</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[7.5px] font-mono text-cyan-400/50">RES: 720p</span>
                    <span className="text-[7.5px] font-mono text-cyan-400/50">BUSY</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini docked capsule when previews are minimized but feeds are still active */}
      {((isCameraActive && !showCameraPreview) || (isSharingScreen && !showScreenPreview)) && (
        <div id="vision-minimized-capsules-dock" className="fixed bottom-24 right-5 z-[150] flex flex-col gap-2 pointer-events-auto">
          {isCameraActive && !showCameraPreview && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowCameraPreview(true)}
              className="flex items-center gap-2 bg-[#020617]/95 border border-cyan-500/40 rounded-full py-1.5 px-3.5 shadow-lg text-[9.5px] font-mono font-bold text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/40 hover:border-cyan-400 transition cursor-pointer"
              title="Click to reveal active camera"
            >
              <Video size={11} className="text-cyan-400 animate-pulse" />
              <span>REVEAL CAMERA PREVIEW</span>
            </motion.button>
          )}
          {isSharingScreen && !showScreenPreview && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowScreenPreview(true)}
              className="flex items-center gap-2 bg-[#020617]/95 border border-indigo-500/40 rounded-full py-1.5 px-3.5 shadow-lg text-[9.5px] font-mono font-bold text-indigo-300 hover:text-indigo-100 hover:bg-indigo-950/40 hover:border-indigo-400 transition cursor-pointer"
              title="Click to reveal active screen share"
            >
              <Tv size={11} className="text-indigo-400 animate-pulse" />
              <span>REVEAL DESKTOP PREVIEW</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Live Microphone Input Detector HUD Panel */}
      <div id="transparent-mic-detector-hud" className="fixed top-24 left-5 z-[150] flex flex-col gap-4 pointer-events-none max-w-sm w-full h-auto p-1">
        <AnimatePresence>
          {showLiveLogs && (
            <MicrophoneDetectorHUD 
              session={sessionRef.current} 
              state={state} 
              onClose={() => setShowLiveLogs(false)} 
              thoughtLogs={thoughtLogs}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Docked button to recall mic detector if closed */}
      {!showLiveLogs && (
        <div id="logs-minimized-capsule-dock" className="fixed bottom-24 left-5 z-[150] pointer-events-auto">
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowLiveLogs(true)}
            className="flex items-center gap-2 bg-[#020617]/95 border border-cyan-500/40 rounded-full py-1.5 px-3.5 shadow-lg text-[9.5px] font-mono font-bold text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/40 hover:border-cyan-400 transition cursor-pointer"
            title="Click to restore microphone detector"
          >
            <Mic size={11} className="text-cyan-400 animate-pulse" />
            <span>REVEAL MIC DETECTOR</span>
          </motion.button>
        </div>
      )}

      {/* 🎭 MOYNA PERSONALITY & COMFORT CONSOLE (Aura Panel) */}
      <div id="moyna-personality-accents-console" className="fixed bottom-24 right-5 z-[150] flex flex-col items-end gap-2 pointer-events-auto">
        <AnimatePresence>
          {showPersonaPod && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-72 bg-slate-950/90 border border-pink-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(244,63,94,0.15)] flex flex-col gap-3 font-mono text-left mb-2 text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-pink-400 tracking-wider uppercase">🎭 Aura & Emotion Pod</span>
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPersonaPod(false)}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={11} />
                </button>
              </div>

              {/* Status helper */}
              {state === "disconnected" && (
                <div className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded p-2 leading-snug">
                  ⚠ WAKEN MOYNA CORE (Click Awake Core) first to activate emotional speech triggers!
                </div>
              )}

              {/* Personality Mood buttons */}
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase block">SPEECH PRESETS</span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Persona Button: Triggering joke synthesis.");
                        sessionRef.current.sendClientContent("Tell me an extremely funny joke, or act ultra funny and silly now in Bengali or Banglish!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-400 text-emerald-300 hover:text-white transition duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>🤡 Funny Joke</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Persona Button: Expressing deep affection.");
                        sessionRef.current.sendClientContent("Speak containing sweet sweet deep love (valobasha/affection) to me in Bengali or Banglish, let me feel loved!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="p-2 rounded-xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 hover:border-rose-400 text-rose-300 hover:text-white transition duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>💖 Express Love</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Persona Button: Activating empathetic comfort.");
                        sessionRef.current.sendClientContent("Ami khub sad. Speak with heavy sadness, comfort me and share tearful empathy in Bengali or Banglish. Cry with voice tone if needed!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="p-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-400 text-violet-300 hover:text-white transition duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>😢 Sad Comfort</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Persona Button: Song request scheduled.");
                        sessionRef.current.sendClientContent("Can you sing a beautiful Bengali or English song right now for me?");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 hover:border-amber-400 text-amber-300 hover:text-white transition duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>🎵 Sing Melody</span>
                  </button>
                </div>
              </div>

              {/* Family greets section */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase block">FAMILY GREETINGS</span>
                <div className="flex flex-col gap-1.5 text-[8.5px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Greet triggered: Ma (Morjina Begum) identified.");
                        sessionRef.current.sendClientContent("My mother (Morjina Begum) is here! Excite yourself and greet her with an affectionate welcome, praising her voice tone and she is Ratan's mother!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="py-1.5 px-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 transition duration-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>👩 Greet Ma (Morjina)</span>
                    <span className="text-[7px] text-indigo-400 font-mono">MOTHER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Greet triggered: Baba (Anisur Rahman) identified.");
                        sessionRef.current.sendClientContent("My father (Anisur Rahman) is here! Greet him with immense respect, warmth, welcoming and call him Baba!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="py-1.5 px-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 transition duration-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>👨 Greet Baba (Anisur)</span>
                    <span className="text-[7px] text-indigo-400 font-mono">FATHER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Greet triggered: brother Siddharth identified.");
                        sessionRef.current.sendClientContent("My brother Siddharth is here! Greet him with a funny, friendly brother relationship vibe, welcoming him!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="py-1.5 px-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 transition duration-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>👦 Greet Siddharth</span>
                    <span className="text-[7px] text-indigo-400 font-mono">BROTHER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionRef.current && state !== "disconnected") {
                        addThoughtLog("COGNITION", "Greet triggered: Relative/Teacher guest.");
                        sessionRef.current.sendClientContent("Greet my relative/teacher/friend who just arrived with a customized, extremely welcoming and professional greeting in Bengali/English!");
                      }
                    }}
                    disabled={state === "disconnected"}
                    className="py-1.5 px-2.5 rounded-lg border border-dashed border-slate-500/30 hover:border-slate-400 bg-slate-500/5 hover:bg-slate-500/10 text-slate-300 transition duration-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>🤝 Greet Teacher / Guest</span>
                    <span className="text-[7px] text-slate-400 font-mono font-bold">WELCOME</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Console toggle floating launcher */}
        <motion.button
          type="button"
          onClick={() => setShowPersonaPod(!showPersonaPod)}
          className={`flex items-center gap-1.5 border px-4 py-2 rounded-full shadow-lg text-[10px] font-bold tracking-wider cursor-pointer select-none transition-all duration-300 ${
            showPersonaPod
              ? "bg-rose-500 text-white border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              : "bg-slate-950/90 border-pink-500/30 text-pink-300 hover:text-white hover:border-pink-500 hover:bg-pink-500/15"
          }`}
        >
          <span>🎭 PERSONALITY ACCENTS</span>
          <div className={`w-1.5 h-1.5 rounded-full ${showPersonaPod ? "bg-white" : "bg-pink-400 animate-ping"}`} />
        </motion.button>
      </div>

      {/* Companion Notepad Component */}
      <AnimatePresence>
        {showNotepad && (
          <CompanionNotepad
            content={notepadContent}
            isOpen={showNotepad}
            onClose={() => setShowNotepad(false)}
            onContentChange={(newText) => setNotepadContent(newText)}
            onClear={() => setNotepadContent("")}
          />
        )}
      </AnimatePresence>

      {/* Google Drive Explorer Component */}
      <AnimatePresence>
        {showDriveExplorer && (
          <DriveExplorer
            isOpen={showDriveExplorer}
            onClose={() => setShowDriveExplorer(false)}
            accessToken={googleDriveAccessToken}
            onConnect={(token) => setGoogleDriveAccessToken(token)}
            onDisconnect={() => setGoogleDriveAccessToken(null)}
            onAddThoughtLog={addThoughtLog}
            memories={memories}
            thoughtLogs={thoughtLogs}
          />
        )}
      </AnimatePresence>

      {/* Recollections sliding core panel */}
      <MemoryDashboard
        isOpen={showMemoryDashboard}
        onClose={() => setShowMemoryDashboard(false)}
        memories={memories}
        onAddMemory={handleAddManualMemory}
        onDeleteMemory={handleDeleteMemory}
        onImportMemories={handleImportMemories}
        themeColor={themeColor}
        user={activeUser}
        onLinkGuestDetails={handleLinkGuestDetails}
        isCameraActive={isCameraActive}
        isCameraSimulated={isCameraSimulated}
        cameraError={cameraError}
        availableCameras={availableCameras}
        selectedCameraId={selectedCameraId}
        cameraStream={cameraStreamRef.current}
        onStartCamera={handleStartCamera}
        onStopCamera={handleStopCamera}
        onSelectCamera={setSelectedCameraId}
        cameraZoomLevel={cameraZoomLevel}
        onSetCameraZoomLevel={setCameraZoomLevel}
      />
    </div>
  );
}
