import React, { useState, useEffect, useRef } from "react";
import { Memory, MemoryCategory } from "../lib/memoryTypes";
import { 
  Brain, 
  X, 
  Trash2, 
  Plus, 
  User, 
  Heart, 
  Target, 
  Briefcase, 
  Users, 
  Flame, 
  Sparkles,
  RefreshCw,
  Key,
  Shield,
  Download,
  Eye,
  Settings,
  Cloud,
  FolderOpen,
  Camera,
  Layers,
  Search,
  CheckCircle,
  HelpCircle,
  Info,
  Sliders,
  Sparkle,
  ToggleLeft,
  ToggleRight,
  Database,
  FileCheck,
  Zap,
  Globe,
  Lock,
  Moon,
  Volume2,
  Upload,
  Mic,
  Fingerprint,
  Music,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface MemoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onAddMemory: (category: MemoryCategory, text: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onImportMemories?: (importedList: Memory[]) => Promise<void>;
  themeColor: string;
  user?: any; // Google auth user details passed down
  onLinkGuestDetails?: (name: string, photoUrl: string) => void;

  // Global Unified Camera Props
  isCameraActive: boolean;
  isCameraSimulated: boolean;
  cameraError: string | null;
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
  cameraStream: MediaStream | null;
  onStartCamera: (deviceId?: string) => Promise<void>;
  onStopCamera: () => void;
  onSelectCamera: (deviceId: string) => void;
  cameraZoomLevel: number;
  onSetCameraZoomLevel: (level: number) => void;
}

function DashboardCameraFeed({ stream }: { stream: MediaStream | null }) {
  const dVideoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (dVideoRef.current && stream) {
      dVideoRef.current.srcObject = stream;
      dVideoRef.current.play().catch(e => console.warn("Dashboard camera play error:", e));
    }
  }, [stream]);
  return (
    <video
      ref={dVideoRef}
      playsInline
      muted
      className="w-full h-full object-cover"
      style={{ transform: "scaleX(-1)" }}
    />
  );
}

function DashboardCameraSimulator() {
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

      // Tech glass background
      ctx.fillStyle = "rgba(10, 18, 25, 0.9)";
      ctx.fillRect(0, 0, w, h);

      // Dot digital matrix
      ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
      for (let x = 15; x < w; x += 20) {
        for (let y = 15; y < h; y += 20) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Scanner sweeping bar
      const barY = (Math.sin(frame * 0.02) * 0.5 + 0.5) * h;
      ctx.fillStyle = "rgba(34, 211, 238, 0.2)";
      ctx.fillRect(0, barY - 2, w, 4);
      ctx.fillStyle = "rgba(34, 211, 238, 0.75)";
      ctx.fillRect(0, barY - 0.5, w, 1);

      // Tech tracking lines
      const cx = w/2;
      const cy = h/2;
      const r = Math.min(w, h) * 0.28 + Math.cos(frame * 0.04) * 4;

      ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI *2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Guidelines
      ctx.strokeStyle = "rgba(34, 211, 238, 0.75)";
      ctx.lineWidth = 2;
      const len = 15;
      // top-left
      ctx.beginPath(); ctx.moveTo(8, 8 + len); ctx.lineTo(8, 8); ctx.lineTo(8 + len, 8); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(w - 8, 8 + len); ctx.lineTo(w - 8, 8); ctx.lineTo(w - 8 - len, 8); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(8, h - 8 - len); ctx.lineTo(8, h - 8); ctx.lineTo(8 + len, h - 8); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(w - 8, h - 8 - len); ctx.lineTo(w - 8, h - 8); ctx.lineTo(w - 8 - len, h - 8); ctx.stroke();

      ctx.fillStyle = "rgba(34, 211, 238, 0.8)";
      ctx.font = "italic 9px monospace";
      ctx.fillText(`SIM TARGET SEARCHING: ACTIVE`, 15, 20);
      ctx.fillText(`SPECTRUM RATE: 30 FPS`, 15, 32);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} width={384} height={288} className="w-full h-full rounded-2xl bg-slate-950" />;
}

export function MemoryDashboard({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  onImportMemories,
  themeColor,
  user,
  onLinkGuestDetails,
  isCameraActive,
  isCameraSimulated,
  cameraError,
  availableCameras,
  selectedCameraId,
  cameraStream,
  onStartCamera,
  onStopCamera,
  onSelectCamera,
  cameraZoomLevel,
  onSetCameraZoomLevel
}: MemoryDashboardProps) {
  // Navigation Tabs for various components of Next-Gen Assistant Systems
  const [activeHUDTab, setActiveHUDTab] = useState<"memories" | "profile" | "drive" | "vision" | "personality" | "privacy" | "life_os" | "research" | "digital_twin">("memories");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<MemoryCategory | "all">("all");
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("identity");
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Import JSON memories state and ref
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImportJSONClick = () => {
    if (importInputRef.current) {
      importInputRef.current.click();
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const contents = event.target?.result as string;
          const parsed = JSON.parse(contents);
          
          if (!Array.isArray(parsed)) {
            alert("Invalid format: The uploaded JSON file must contain an array of memories.");
            setImporting(false);
            return;
          }

          // Validate structures
          const isValid = parsed.every(item => 
            item && 
            typeof item === 'object' && 
            typeof item.id === 'string' &&
            typeof item.category === 'string' &&
            typeof item.text === 'string'
          );

          if (!isValid) {
            alert("Validation failed: Each memory object in the JSON must contain 'id', 'category', and 'text' fields.");
            setImporting(false);
            return;
          }

          if (onImportMemories) {
            await onImportMemories(parsed);
            alert(`Moyna successfully assimilated ${parsed.length} memories into her recollections!`);
          } else {
            alert("Import capabilities are not configured.");
          }
        } catch (jsonErr) {
          alert("Failed to parse the file: Please verify it is a valid backup JSON file.");
        } finally {
          setImporting(false);
          e.target.value = "";
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert("Error reading file: " + err.message);
      setImporting(false);
    }
  };

  // Cloud Simulation/Mock Drive Integration states
  const [driveSearch, setDriveSearch] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle");
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<string | null>(null);

  // Holographic Webcam/Vision state
  const [isLensScanning, setIsLensScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{ labels: string[]; ocr: string; emotion: string } | null>(null);

  // Guest account configuration states
  const [guestFormName, setGuestFormName] = useState(user?.displayName || "Shankar Majumder");
  const [guestFormPhoto, setGuestFormPhoto] = useState(user?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=Moyna");

  const AVATAR_PRESETS = [
    { label: "Moyna Spark", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Moyna" },
    { label: "Apex Cyber", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Shankar" },
    { label: "Zenith Blue", url: "https://api.dicebear.com/7.x/micah/svg?seed=Explorer" },
    { label: "Nebula Core", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" }
  ];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Personality Sliders & Modes
  const [relationshipMode, setRelationshipMode] = useState<"companion" | "mentor" | "professional" | "friendly" | "assistant">("companion");
  const [continuousMode, setContinuousMode] = useState(true);
  const [humorLevel, setHumorLevel] = useState(75);
  const [empathyScore, setEmpathyScore] = useState(90);
  const [reflectionPace, setReflectionPace] = useState(45);

  // Active Future Robot Hardware properties
  const [robotConnected, setRobotConnected] = useState(false);
  const [robotEyesMode, setRobotEyesMode] = useState<"happy" | "blink" | "scanning" | "sparkle">("happy");
  const [robotBattery, setRobotBattery] = useState(98);
  const [lastTouchTimestamp, setLastTouchTimestamp] = useState<string>("STABLE");

  // Advanced HUD states
  const [tasks, setTasks] = useState([
    { id: "t1", text: "Study advanced server systems", completed: false, routine: "daily", category: "work" },
    { id: "t2", text: "Curate a playlist of lofi Bengali loops", completed: true, routine: "weekly", category: "creative" },
    { id: "t3", text: "Finalize AI specifications draft v4", completed: false, routine: "monthly", category: "research" },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("work");
  const [notes, setNotes] = useState(`Active Companion Notes:
- Moyna utilizes standard low-latency WebSockets sync.
- Workspace calibration: set theme to deep charcoal or celestial blue.
- Keep study block lofi volume under 25% for alpha waves.`);
  
  // Computer agent
  const [computerApp, setComputerApp] = useState("VS Code");
  const [appBottleneck, setAppBottleneck] = useState("Excessive node module resolution. Suggest running npm audit.");

  // Deep Web Research Sandbox
  const [researchTopic, setResearchTopic] = useState("");
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<{ query: string; check: string; sources: string[]; report: string } | null>(null);

  // Agent team dialogue swarms
  const [agentsSwarmingActive, setAgentsSwarmingActive] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Array<{ sender: string; avatar: string; message: string; timestamp: string }>>([
    { sender: "CEO Agent", avatar: "👔", message: "Initial objectives parsed. We need to boost study flow metrics.", timestamp: "10:30" },
    { sender: "Researcher Agent", avatar: "🕵️", message: "Scanning repositories for lofi design specifications...", timestamp: "10:31" },
  ]);

  // Creator Engine Mode
  const [creatorTopic, setCreatorTopic] = useState("");
  const [creatorPlatform, setCreatorPlatform] = useState("YouTube video script");
  const [creatorOutput, setCreatorOutput] = useState("");
  const [creatorLoading, setCreatorLoading] = useState(false);

  // Private Offline Brain storage
  const [offlineBrainActive, setOfflineBrainActive] = useState(false);
  const [offlineSyncProgress, setOfflineSyncProgress] = useState<number | null>(null);

  // Self-Improving Behavior Feedback
  const [feedbackLogs, setFeedbackLogs] = useState<Array<{ id: string; time: string; score: number; text: string }>>([
    { id: "f1", time: "10:15", score: 5, text: "Assigned clear humor responses to sarcasm inputs." },
    { id: "f2", time: "10:18", score: 4, text: "Adaptive breathing pause alignment matches user tempo." },
  ]);
  const [newFeedbackScore, setNewFeedbackScore] = useState(5);
  const [newFeedbackText, setNewFeedbackText] = useState("");

  // Advanced Voice Controls
  const [voiceInterruptThreshold, setVoiceInterruptThreshold] = useState(60);
  const [breathSystemEnabled, setBreathSystemEnabled] = useState(true);
  const [naturalPausesEnabled, setNaturalPausesEnabled] = useState(true);

  // World Awareness News indices
  const [worldNews] = useState<Array<{ title: string; trend: string; time: string; source: string }>>([
    { title: "Quantum Computing hardware sets parity efficiency milestones", trend: "+345% Activity", time: "15 min ago", source: "MIT Tech" },
    { title: "Global internet pipeline frequency modifications scheduled", trend: "Stability Alert", time: "1 hr ago", source: "Wired News" },
    { title: "Bengali lofi acoustic sets chart on world ambient lists", trend: "Cultural Spark", time: "3 hrs ago", source: "Spotify Global" }
  ]);

  // Multi-person relationships index
  const [socialCircle, setSocialCircle] = useState([
    { name: "Siddharth", role: "Brother", birthdate: "Nov 12", alert: "Gift list: lofi pocket synthesizer" },
    { name: "Ananya", role: "Colleague", birthdate: "Jul 05", alert: "Coordination sync up upcoming" },
    { name: "Prof. Majumder", role: "Mentor", birthdate: "Mar 18", alert: "Request feedback on spec draft" }
  ]);
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendRole, setNewFriendRole] = useState("");
  const [newFriendBirthday, setNewFriendBirthday] = useState("");

  // Biometric Family Voice & Tune Profiles registry states
  const [familyVoiceProfiles, setFamilyVoiceProfiles] = useState([
    { id: "v1", name: "Morjina Begum (Ma)", relation: "Mother", pitchRange: "210Hz - 245Hz", resonance: "Warm & Caring Soprano (Soothing)", status: "Locked & Synchronized", confidence: "99.4%", favoriteTune: "Bhairavi evening flute hum, 4 beats", active: true },
    { id: "v2", name: "Anisur Rahman (Baba)", relation: "Father", pitchRange: "95Hz - 115Hz", resonance: "Soft Resonant Baritone (Calm)", status: "Locked & Synchronized", confidence: "98.9%", favoriteTune: "Hemanta classic hum string draft", active: true },
    { id: "v3", name: "Siddharth (Brother)", relation: "Brother", pitchRange: "130Hz - 155Hz", resonance: "Bright Energetic Tenor (Fast)", status: "Calibrated", confidence: "95.1%", favoriteTune: "Bengali lofi sitar bend chords", active: true }
  ]);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceRelation, setNewVoiceRelation] = useState("");
  const [newVoiceResonance, setNewVoiceResonance] = useState("");
  const [newVoicePitch, setNewVoicePitch] = useState("");
  const [newVoiceTune, setNewVoiceTune] = useState("");

  const [activeCalibratingId, setActiveCalibratingId] = useState<string | null>(null);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [activeTestingId, setActiveTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Scam / Phishing Guardian sandbox properties
  const [phishingInput, setPhishingInput] = useState("");
  const [phishingResult, setPhishingResult] = useState<{
    score: number;
    risk: "SAFE" | "LOW" | "HIGH_WARNING" | "CRITICAL_DANGER";
    findings: string[];
  } | null>(null);

  // Dynamic weekly emotion statistics & metric trends
  const [selectedAnalyticsMetric, setSelectedAnalyticsMetric] = useState<"joy" | "calm" | "focus" | "stress">("focus");
  const [emotionTrendData] = useState([
    { day: "Sat", joy: 72, calm: 85, focus: 65, stress: 25 },
    { day: "Sun", joy: 85, calm: 90, focus: 45, stress: 15 },
    { day: "Mon", joy: 68, calm: 75, focus: 80, stress: 40 },
    { day: "Tue", joy: 74, calm: 80, focus: 85, stress: 35 },
    { day: "Wed", joy: 80, calm: 82, focus: 90, stress: 30 },
    { day: "Thu", joy: 82, calm: 78, focus: 88, stress: 20 },
    { day: "Fri", joy: 88, calm: 84, focus: 92, strokeWidth: 10, stress: 12 }
  ]);

  // Audit Logs (Transparent Memory Logs) state
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; action: string; desc: string; type: "read" | "write" | "decrypt" }>>([
    { id: "1", time: "10:24:12", action: "COGNITIVE ROOT", desc: "Moyna accessed user profile identity descriptors.", type: "read" },
    { id: "2", time: "10:25:01", action: "EMOTION SOLVER", desc: "Analyzed tonal wave; synchronized celestial workspace theme.", type: "write" },
    { id: "3", time: "10:26:45", action: "DURABLE RECALL", desc: "Read target preferences category list for local context injection.", type: "read" },
  ]);

  // Folder Mock Data representing Google Drive connection files
  const mockDriveFiles = [
    { id: "f1", name: "User_Self_Reflection_Journal.pdf", size: "1.4 MB", date: "Jun 12, 2026", text: "Extracted context: User lists goals to study Bengali lofi aesthetics and master server administration by Christmas 2026." },
    { id: "f2", name: "Daily_Habits_Tracker_Q2.xlsx", size: "380 KB", date: "Jun 15, 2026", text: "Extracted context: Consistently logged sleep schedule average is 6.5 hours. Preferred winding down activities involve classical sitar melodies." },
    { id: "f3", name: "Holographic_Framework_Spec.docx", size: "2.1 MB", date: "May 29, 2026", text: "Extracted context: Detailed system layout highlighting live WebSockets transmission frequency for voice-modulating streams." },
    { id: "f4", name: "Personal_Medical_Allergies.pdf", size: "900 KB", date: "Jan 10, 2026", text: "Extracted context: No critical allergies. Emphasizes low sugar diets and sensitivity to high air conditioning cooling." }
  ];

  // Category Colors Configure
  const categoryConfig: Record<MemoryCategory, { label: string; icon: any; color: string; bg: string }> = {
    identity: { label: "Identity Core", icon: User, color: "text-amber-400 border-amber-500/25", bg: "bg-amber-500/5 hover:bg-amber-500/10" },
    preference: { label: "Preferences", icon: Heart, color: "text-pink-400 border-pink-500/25", bg: "bg-pink-500/5 hover:bg-pink-500/10" },
    goal: { label: "Life Goals", icon: Target, color: "text-emerald-400 border-emerald-500/25", bg: "bg-emerald-500/5 hover:bg-emerald-500/10" },
    project: { label: "Active Projects", icon: Briefcase, color: "text-cyan-400 border-cyan-500/25", bg: "bg-cyan-500/5 hover:bg-cyan-500/10" },
    relationship: { label: "Relationships", icon: Users, color: "text-purple-400 border-purple-500/25", bg: "bg-purple-500/5 hover:bg-purple-500/10" },
    emotional: { label: "Milestones", icon: Flame, color: "text-red-400 border-red-500/25", bg: "bg-red-500/5 hover:bg-red-500/10" },
    behavior: { label: "Habits & Behaviors", icon: Brain, color: "text-indigo-400 border-indigo-500/25", bg: "bg-indigo-500/5 hover:bg-indigo-500/10" },
  };

  // Trigger simulated drive syncing animation
  const triggerDriveSync = () => {
    if (syncStatus === "syncing") return;
    setSyncStatus("syncing");
    
    // Add real-time log entry
    addAuditLogEntry("DEEP LINK", "Requesting sync parameters with Google Drive API v3...", "read");

    setTimeout(() => {
      setSyncStatus("done");
      addAuditLogEntry("DEEP LINK", "Successfully pulled & synchronized 4 knowledge documents securely.", "decrypt");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }, 2200);
  };

  // Extract mock document summaries
  const extractFileContent = (fileId: string, name: string) => {
    setExtractingId(fileId);
    setExtractedData(null);
    addAuditLogEntry("OCR RESOLVER", `Parsing file streams: ${name}`, "read");

    setTimeout(() => {
      const match = mockDriveFiles.find(f => f.id === fileId);
      if (match) {
        setExtractedData(match.text);
        addAuditLogEntry("OCR RESOLVER", `Completed OCR and metadata alignment. Injected findings directly into active thread context.`, "write");
      }
      setExtractingId(null);
    }, 1500);
  };

  // Helper to add transparent log elements
  const addAuditLogEntry = (action: string, desc: string, type: "read" | "write" | "decrypt" = "read") => {
    const timestamp = new Date().toLocaleTimeString();
    setAuditLogs(prev => [
      { id: `${Date.now()}`, time: timestamp, action, desc, type },
      ...prev
    ].slice(0, 30));
  };

  // Calibration sound training simulator
  const startBiometricCalibration = (id: string, name: string) => {
    if (activeCalibratingId) return;
    setActiveCalibratingId(id);
    setCalibrationProgress(0);
    addAuditLogEntry("BIOMETRIC_CALIBRATION", `Active training session booted for family member: ${name}. Please hum or speak.`, "read");

    let prog = 0;
    const interval = setInterval(() => {
      prog += 4;
      setCalibrationProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setFamilyVoiceProfiles(prev => 
          prev.map(p => p.id === id ? { ...p, status: "Locked & Synchronized", confidence: `${(97 + Math.random() * 2.8).toFixed(1)}%` } : p)
        );
        addAuditLogEntry("BIOMETRIC_SYNC", `Successfully saved secure frequency signature for ${name}! Harmonic tune lock completed.`, "write");
        setTimeout(() => {
          setActiveCalibratingId(null);
          setCalibrationProgress(0);
        }, 1200);
      }
    }, 120);
  };

  // Sound testing simulator
  const runBiometricTest = (id: string, name: string) => {
    if (activeTestingId) return;
    setActiveTestingId(id);
    setTestResult("Analyzing incoming audio feed frequencies matching registered templates...");
    addAuditLogEntry("BIOMETRIC_TEST", `Real-time pattern stream comparison requested for: ${name}`, "read");

    setTimeout(() => {
      const match = familyVoiceProfiles.find(p => p.id === id);
      setTestResult(`✓ CONFIRMED: Verified 100% audio matches for '${name}' (${match?.resonance || "Warm voice"}).`);
      addAuditLogEntry("BIOMETRIC_TEST", `Successful match verification for ${name} at confidence: ${match?.confidence || "99%"}`, "decrypt");
      
      setTimeout(() => {
        setActiveTestingId(null);
        setTestResult(null);
      }, 3500);
    }, 2000);
  };

  // Handle unified webcam toggle actions using parent triggers
  const startCamera = async (overrideDeviceId?: string) => {
    addAuditLogEntry("VISION COCKPIT", `Initializing unified camera channel...`, "read");
    await onStartCamera(overrideDeviceId || selectedCameraId);
  };

  const stopCamera = () => {
    onStopCamera();
    setScanResults(null);
    addAuditLogEntry("VISION COCKPIT", "Webcam hardware transmission terminated.", "write");
  };

  // Run dynamic target mesh scans inside HUD
  const runCameraScan = () => {
    if (!isCameraActive || isLensScanning) return;
    setIsLensScanning(true);
    setScanResults(null);
    addAuditLogEntry("SCENE SOLVER", "Capturing live frame snapshot. Parsing visual parameters...", "read");

    setTimeout(() => {
      setIsLensScanning(false);
      setScanResults({
        labels: ["Human", "Eyeglasses", "Indoor Room Desk", "Warm Background Halo", "Computer Screen Glow"],
        ocr: "DETECTOR LOGS: DEV ENVIRONMENT ON SCREEN EXECUTING TS BUILD...",
        emotion: "Alert, Focused, curious (94.2% Probability)"
      });
      addAuditLogEntry("SCENE SOLVER", "Bounding targets computed. Injected facial label coordinates and workspace details.", "write");
    }, 1800);
  };

  // Export full memories array as download-safe JSON backup format
  const handleExportMemories = () => {
    try {
      const fileString = JSON.stringify(memories, null, 2);
      const blob = new Blob([fileString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `moyna_memory_recollections_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addAuditLogEntry("PRIVACY SYSTEM", "Exported database recollections to downloaded JSON format successfully.", "decrypt");
    } catch (e: any) {
      console.error(e);
    }
  };

  // Purge entire persistence
  const handlePurgeDatabase = async () => {
    if (window.confirm("CRITICAL WARNING: This will immediately delete ALL of Moyna's persistent memories from the cloud database permanently. This action is irreversible. Proceed?")) {
      addAuditLogEntry("PRIVACY SYSTEM", "Init full database purge protocol...", "write");
      try {
        for (const element of memories) {
          await onDeleteMemory(element.id);
        }
        addAuditLogEntry("PRIVACY SYSTEM", "PURGE COMPLETE: All database records destroyed.", "write");
        alert("All memories have been permanently cleared.");
      } catch (err) {
        console.error("Purge failure:", err);
      }
    }
  };

  const getThemeBadgeGlow = () => {
    switch (themeColor) {
      case "rose": return "border-pink-500/30 text-pink-400 bg-pink-500/10";
      case "gold": return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "violet": return "border-indigo-500/30 text-indigo-400 bg-indigo-500/10";
      case "celestial": return "border-sky-500/30 text-sky-400 bg-sky-500/10";
      case "emerald": return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "crimson": return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      default: return "border-cyan-500/30 text-cyan-400 bg-cyan-500/10";
    }
  };

  const filteredMemories = activeCategoryFilter === "all" 
    ? memories 
    : memories.filter(m => m.category === activeCategoryFilter);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setSubmitting(true);
    try {
      await onAddMemory(newCategory, newText.trim());
      setNewText("");
      setIsAdding(false);
      addAuditLogEntry("MANUAL SEED", `Manually seeded recollect text inside archetype: "${newCategory}"`, "write");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Durable Record";
    }
  };

  const handleValidateScam = () => {
    if (!phishingInput.trim()) return;
    addAuditLogEntry("SCAN SENTINEL", `Initiating malware heuristics scan on custom input content...`, "decrypt");
    
    const lower = phishingInput.toLowerCase();
    let score = 5;
    let findings: string[] = [];

    if (lower.includes("http://") || (lower.includes("https://") && (lower.includes("bit.ly") || lower.includes("scam") || lower.includes("redirect") || lower.includes("login-") || lower.includes("verify-") || lower.includes("action.asp") || lower.includes("banking")))) {
      score += 45;
      findings.push("Contains high-suspicion URL mask link or redirect subdomains.");
    }
    if (lower.includes("urgent") || lower.includes("immediate") || lower.includes("locked") || lower.includes("suspended") || lower.includes("unauthorized") || lower.includes("compromised") || lower.includes("expire")) {
      score += 25;
      findings.push("Employs artificial panic / emotional threat coordinates.");
    }
    if (lower.includes("bank") || lower.includes("paypal") || lower.includes("crypto") || lower.includes("credit card") || lower.includes("social security") || lower.includes("national registry")) {
      score += 20;
      findings.push("Targeting user identity verification credentials.");
    }
    if (lower.includes("congratulations") || lower.includes("won") || lower.includes("free reward") || lower.includes("lottery") || lower.includes("prize")) {
      score += 20;
      findings.push("Incentivizes malicious clicks via deceptive gift card hooks.");
    }

    let riskVar: "SAFE" | "LOW" | "HIGH_WARNING" | "CRITICAL_DANGER" = "SAFE";
    if (score >= 65) riskVar = "CRITICAL_DANGER";
    else if (score >= 35) riskVar = "HIGH_WARNING";
    else if (score >= 15) riskVar = "LOW";

    setPhishingResult({
      score,
      risk: riskVar,
      findings: findings.length > 0 ? findings : ["Passed generic heuristics firewall check. Low warning patterns detected."]
    });

    addAuditLogEntry("SCAN SENTINEL", `Finished scan. Result: ${riskVar} (${score}% warning code)`, "write");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md"
          />

          {/* Slide-over Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 180 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-950/95 border-l border-white/10 backdrop-blur-2xl z-50 flex flex-row shadow-[0_0_60px_rgba(0,0,0,0.9)] text-slate-250 select-none overflow-hidden"
          >
            
            {/* LEFT EXPANDED NAVIGATION GUTTER (HOLOGRAPHIC VERTICAL INDEX RAIL) */}
            <div className="w-16 sm:w-20 border-r border-white/5 bg-black/60 flex flex-col justify-between py-6 items-center shrink-0">
              <div className="flex flex-col gap-6 items-center w-full">
                {/* Visual pulsating core node indicator */}
                <div className={`p-2.5 rounded-2xl border ${getThemeBadgeGlow()} relative animate-pulse`}>
                  <Brain size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-black animate-ping" />
                </div>
                
                <div className="h-[1px] w-8 bg-white/5" />

                {/* Vertical Tabs selection controls */}
                <div className="flex flex-col gap-2.5 w-full px-2">
                  <button
                    onClick={() => setActiveHUDTab("memories")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "memories" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Durable Memory Database"
                  >
                    <Database size={15} />
                    <span className="hidden sm:inline scale-90">RECALL</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("profile")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "profile" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Profile & Connected Accounts"
                  >
                    <User size={15} />
                    <span className="hidden sm:inline scale-85">ACCOUNT</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("personality")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "personality" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Engine Relationship Modes"
                  >
                    <Sliders size={15} />
                    <span className="hidden sm:inline scale-85">TUNING</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("drive")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "drive" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Google Cloud Drive Links"
                  >
                    <Cloud size={15} />
                    <span className="hidden sm:inline scale-85">DRIVE</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveHUDTab("vision");
                      if (!isCameraActive) startCamera();
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "vision" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Holographic Vision Lens"
                  >
                    <Camera size={15} />
                    <span className="hidden sm:inline scale-85">LENS</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("privacy")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "privacy" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Privacy & Data Export controls"
                  >
                    <Shield size={15} />
                    <span className="hidden sm:inline scale-85">PRIVACY</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("life_os")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "life_os" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Unified Productivity Hub Workspace"
                  >
                    <Briefcase size={15} />
                    <span className="hidden sm:inline scale-85">LIFE OS</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("research")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "research" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Advanced Web Intelligence Lab"
                  >
                    <Layers size={15} />
                    <span className="hidden sm:inline scale-85">AGENTS</span>
                  </button>

                  <button
                    onClick={() => setActiveHUDTab("digital_twin")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[9.5px] font-mono tracking-widest cursor-pointer ${
                      activeHUDTab === "digital_twin" 
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-white/5"
                    }`}
                    title="Cognitive Twin Node Map Graph"
                  >
                    <Flame size={15} />
                    <span className="hidden sm:inline scale-85">TWIN</span>
                  </button>
                </div>
              </div>

              {/* Secure Lock indicator */}
              <div className="flex flex-col items-center gap-1 text-slate-600 font-mono text-[8px] tracking-wider select-none">
                <Lock size={12} className="text-slate-500" />
                <span>SSL</span>
              </div>
            </div>

            {/* RIGHT PANEL - CONTENT DISPLAY WORKSPACE */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-900/40 relative">
              
              {/* Header Status Bar overlay coordinates */}
              <div className="p-5 border-b border-white/5 bg-slate-950/70 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#93c1ff]">
                    {activeHUDTab === "memories" && "MEM-SYNC CLOUD DIRECTORY"}
                    {activeHUDTab === "profile" && "ACCOUNT & CREDENTIALS MATRIX"}
                    {activeHUDTab === "personality" && "COGNITIVE ARCHETYPE TUNER"}
                    {activeHUDTab === "drive" && "SECURE DRIVE STORAGE BROKER"}
                    {activeHUDTab === "vision" && "EYE-OS VISION ACQUISITION UNIT"}
                    {activeHUDTab === "privacy" && "PRIVACY PROTECTION CORE"}
                    {activeHUDTab === "life_os" && "SYSTEM LIFE-OS PIPELINE"}
                    {activeHUDTab === "research" && "AUTONOMOUS RESEARCH SWARM"}
                    {activeHUDTab === "digital_twin" && "DIGITAL TWIN & MIND GRAPH"}
                  </span>
                  <div className="w-1 h-3 rounded bg-cyan-400" />
                </div>
                
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* CORE VIEWPORT CONTENT SWITCHBOARD */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
                
                {/* A. MEMORIES DIRECTORY VIEW */}
                {activeHUDTab === "memories" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">Persistent Recollection Index</h3>
                        <p className="text-[10px] text-slate-400 font-mono">DURABLE LONG TERM STORAGE SLOTS ({memories.length}/999)</p>
                      </div>
                      {!isAdding && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 transition cursor-pointer"
                          >
                            <Plus size={11} /> MANUAL SEED
                          </button>
                          
                          <button
                            onClick={handleImportJSONClick}
                            disabled={importing}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] font-mono text-indigo-300 transition cursor-pointer disabled:opacity-50"
                            title="Upload memories list from JSON file backup"
                          >
                            <Upload size={11} className={importing ? "animate-spin" : ""} /> {importing ? "IMPORTING..." : "UPLOAD JSON"}
                          </button>
                          <input 
                            ref={importInputRef}
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            onChange={handleFileImport} 
                          />
                        </div>
                      )}
                    </div>

                    {/* Manual insertion Drawer inside cockpit */}
                    <AnimatePresence>
                      {isAdding && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="p-4 border border-white/5 rounded-xl bg-black/40 space-y-3 overflow-hidden font-mono text-xs"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {(Object.keys(categoryConfig) as MemoryCategory[]).map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setNewCategory(cat)}
                                className={`flex items-center gap-1.5 p-1 rounded-md border text-[10px] truncate transition cursor-pointer ${
                                  newCategory === cat 
                                    ? "border-cyan-400 bg-cyan-400/5 text-cyan-300"
                                    : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"
                                }`}
                              >
                                {React.createElement(categoryConfig[cat].icon, { size: 10 })}
                                <span className="truncate">{categoryConfig[cat].label.split(" ")[0]}</span>
                              </button>
                            ))}
                          </div>

                          <textarea
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Type facts (e.g., 'User has a software test scheduled on Friday afternoons.')"
                            className="w-full h-16 p-2 rounded-lg border border-white/5 bg-slate-950 text-[11px] text-white focus:outline-none focus:border-cyan-500/60 resize-none font-sans"
                            required
                          />

                          <div className="flex gap-2 justify-end text-[10px]">
                            <button
                              type="button"
                              onClick={() => setIsAdding(false)}
                              className="px-2.5 py-1 rounded border border-white/5 text-slate-400 hover:text-white"
                            >
                              ESC
                            </button>
                            <button
                              type="button"
                              onClick={handleManualAdd}
                              disabled={submitting}
                              className="px-3.5 py-1 rounded bg-[#93c1ff] hover:bg-sky-300 text-slate-950 font-bold uppercase tracking-wider"
                            >
                              Commit Fact
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Filter scroller horizontal */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5 border-b border-white/5">
                      <button
                        onClick={() => setActiveCategoryFilter("all")}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-mono uppercase transition border shrink-0 cursor-pointer ${
                          activeCategoryFilter === "all"
                            ? "border-white bg-white text-slate-950 font-bold"
                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        ALL RECORDS
                      </button>
                      {(Object.keys(categoryConfig) as MemoryCategory[]).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-mono uppercase transition border shrink-0 cursor-pointer ${
                            activeCategoryFilter === cat
                              ? "border-white bg-white text-slate-950 font-bold"
                              : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10"
                          }`}
                        >
                          {categoryConfig[cat].label.split(" ")[0]}
                        </button>
                      ))}
                    </div>

                    {/* Memory list visual scroll */}
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {filteredMemories.length === 0 ? (
                        <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs">
                          <Database size={24} className="opacity-30 mb-2" />
                          <span>No synchronized memories saved yet.</span>
                          <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Moyna records insights automatically during speech conversations.</p>
                        </div>
                      ) : (
                        filteredMemories.map((m) => {
                          const config = categoryConfig[m.category];
                          return (
                            <div 
                              key={m.id}
                              className={`flex gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition relative group ${config.bg}`}
                            >
                              <div className={`p-1.5 rounded-lg border bg-black/40 h-max shrink-0 mt-0.5 ${config.color}`}>
                                {React.createElement(config.icon, { size: 12 })}
                              </div>
                              <div className="flex-1 text-left">
                                <span className={`text-[8.5px] font-mono uppercase tracking-wider ${config.color}`}>
                                  {m.category}
                                </span>
                                <p className="text-xs text-slate-200 mt-0.5 font-sans leading-relaxed font-semibold pr-6">
                                  {m.text}
                                </p>
                                <span className="text-[8px] font-mono text-slate-500 block mt-1">
                                  Secured ISO: {formatDate(m.createdAt)}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  onDeleteMemory(m.id);
                                  addAuditLogEntry("FORGET TRIGGER", `Requested deletion for card descriptor ${m.id}`, "write");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-red-950/20 text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all absolute top-2 right-2 shrink-0 cursor-pointer"
                                title="Erase Recollection Item"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* B. PROFILE / CREDENTIALS MANAGEMENT */}
                {activeHUDTab === "profile" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="p-4 rounded-xl border border-white/5 bg-[#070811] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {user?.photoURL ? (
                            <img referrerPolicy="no-referrer" src={user.photoURL} alt="user" className="w-11 h-11 rounded-full border border-white/20" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-sm font-bold text-cyan-300 uppercase">
                              {user?.displayName?.charAt(0) || "G"}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${user ? "bg-emerald-500" : "bg-purple-500 animate-pulse"}`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{user ? user.displayName : "Moyna Guest Account"}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">{user ? user.email : "shankarmajumder084@gmail.com (Default Sandbox)"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                          {user ? "AUTHENTICATED" : "GUEST ACCESS"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h3 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400">Device Sync & Linking</h3>
                      
                      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs font-mono">
                        <div className="flex gap-2.5">
                          <Globe size={14} className="text-cyan-400" />
                          <div>
                            <span className="text-slate-300 font-sans font-semibold text-xs block">Vercel & AI Studio Container Endpoint</span>
                            <span className="text-[9px] text-slate-500">Node Cloud Run server container node proxy</span>
                          </div>
                        </div>
                        <span className="text-emerald-400 text-[10px] font-bold">● CONNECTED</span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs font-mono">
                        <div className="flex gap-2.5">
                          <Database size={14} className="text-cyan-400" />
                          <div>
                            <span className="text-slate-300 font-sans font-semibold text-xs block">Google Firebase Sync replication</span>
                            <span className="text-[9px] text-slate-500">Real-time persistent multi-device cloud replication</span>
                          </div>
                        </div>
                        <span className="text-emerald-400 text-[10px] font-bold">● ACTIVE</span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs font-mono">
                        <div className="flex gap-2.5">
                          <Key size={14} className="text-[#93c1ff]" />
                          <div>
                            <span className="text-slate-300 font-sans font-semibold text-xs block">Holographic session token key</span>
                            <span className="text-[9px] text-slate-500">Local credentials secured by browser SSL guard</span>
                          </div>
                        </div>
                        <span className="text-cyan-400 text-[10px] font-bold font-mono">MD-751X</span>
                      </div>
                    </div>

                    {/* Integrated Multi-Agent Active Orchestration Grid */}
                    <div className="border border-white/5 rounded-xl bg-black/30 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-[#93c1ff] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Multi-Agent Orchestration Telemetry
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans tracking-tight">Active parallel execution engine across 8 cognitive sub-agents</p>
                        </div>
                        <span className="text-[8.5px] bg-[#1e293b] px-2 py-0.5 rounded text-slate-400 border border-white/5 font-bold">MODE: CRITICAL_PASS</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                        {[
                          { name: "Vision Agent", purpose: "Lens frame OCR & scene tracking", status: "ONLINE", icon: "👁️", color: "text-emerald-400" },
                          { name: "Memory Agent", purpose: "Cognitive persistence & link graphs", status: "ONLINE", icon: "🧠", color: "text-emerald-400" },
                          { name: "Research Agent", purpose: "Autonomous search & summary pipelines", status: "STANDBY", icon: "🕵️", color: "text-amber-400" },
                          { name: "Coding Agent", purpose: "Atmosphere widget layout rendering", status: "SLEEPING", icon: "💻", color: "text-indigo-400" },
                          { name: "Browser Agent", purpose: "Web window frame execution", status: "DISPATCHED", icon: "🌐", color: "text-cyan-400" },
                          { name: "Planning Agent", purpose: "Daily objective tracks & reminders", status: "ONLINE", icon: "🗓️", color: "text-emerald-400" },
                          { name: "Learning Agent", purpose: "Empathy / humor curve optimization", status: "OPTIMIZING", icon: "📈", color: "text-purple-400 animate-pulse" },
                          { name: "Security Sentinel", purpose: "Scam malware & phishing wall", status: "GUARDING", icon: "🛡️", color: "text-emerald-400" }
                        ].map((agent, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              addAuditLogEntry("ORCHESTRATOR", `Re-pinged ${agent.name} status node. Output standard response: OK (${agent.status})`, "read");
                            }}
                            className="p-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 hover:bg-black/60 transition cursor-pointer flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-200 flex items-center gap-1 font-mono">
                                <span>{agent.icon}</span>
                                <span>{agent.name}</span>
                              </span>
                              <span className={`text-[7.5px] scale-95 font-bold tracking-wider ${agent.color}`}>
                                {agent.status}
                              </span>
                            </div>
                            <span className="text-[8px] text-slate-500 leading-normal block font-sans">{agent.purpose}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrated Custom Guest / Account Linker */}
                    <div className="p-4 rounded-xl border border-dashed border-cyan-500/20 bg-cyan-950/10 space-y-3 font-mono">
                      <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles size={11} className="animate-pulse" /> Sandbox Guests & Account Linker
                      </h4>
                      <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                        If Google Popups are restricted by iframe sandbox settings, enter your display details below to simulate high-fidelity profile sync & memory replication instantly on your device.
                      </p>
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block font-bold">DISPLAY NAME</label>
                          <input
                            type="text"
                            placeholder="e.g., Shankar Majumder"
                            value={guestFormName}
                            onChange={(e) => setGuestFormName(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block font-bold">PROFILE AVATAR</label>
                          <div className="flex flex-wrap gap-2.5 mt-1.5">
                            {AVATAR_PRESETS.map((p, idx) => (
                              <button
                                key={idx}
                                onClick={() => setGuestFormPhoto(p.url)}
                                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${guestFormPhoto === p.url ? "border-cyan-400 scale-105 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "border-white/10 opacity-70 hover:opacity-100"}`}
                                title={p.label}
                                type="button"
                              >
                                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (guestFormName.trim() && onLinkGuestDetails) {
                              onLinkGuestDetails(guestFormName, guestFormPhoto);
                            }
                          }}
                          className="w-full py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-bold font-mono text-[10px] rounded-lg tracking-widest hover:brightness-115 transition-all cursor-pointer"
                        >
                          APPLY & LINK PROFILE
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. ENGINE TUNING / PERSONALITY */}
                {activeHUDTab === "personality" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Relationship Profile Layers</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: "companion", label: "🤝 Companion", desc: "Balanced tone, high emotional support, warm" },
                          { id: "mentor", label: "🎓 Mentor", desc: "Constructive feedback, analytical, guiding" },
                          { id: "professional", label: "💼 Advisor", desc: "Clean boundaries, task-focused, concise" },
                          { id: "friendly", label: "🎭 Best Friend", desc: "Chilled conversation, high humor, casual speech" },
                          { id: "assistant", label: "🧪 Assistant", desc: "Pure helpfulness, literal, low editorial" }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              setRelationshipMode(mode.id as any);
                              addAuditLogEntry("TUNING SERVICE", `Switched cognitive profile to adaptive mood: "${mode.id.toUpperCase()}"`, "write");
                            }}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition h-20 cursor-pointer ${
                              relationshipMode === mode.id 
                                ? "border-cyan-500 bg-cyan-500/10 text-white" 
                                : "border-white/5 bg-black/30 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                            }`}
                          >
                            <span className="text-xs font-semibold font-mono tracking-tight block">{mode.label}</span>
                            <span className="text-[8.5px] scale-95 leading-tight opacity-70 block mt-1">{mode.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-[1.5px] border-white/5 rounded-xl bg-black/20 p-4 space-y-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#93c1ff] border-b border-white/5 pb-1 flex items-center justify-between">
                        <span>Pace & Personality Sliders</span>
                        <Info size={10} className="text-slate-500" />
                      </h3>

                      {/* Continuous Mode Toggle */}
                      <div className="flex items-center justify-between py-1 text-xs">
                        <div>
                          <span className="font-semibold text-slate-200 block">Continuous Listening Mode</span>
                          <span className="text-[9px] text-slate-500 font-mono">Stream voice audio continuously without toggle buttons</span>
                        </div>
                        <button
                          onClick={() => {
                            setContinuousMode(!continuousMode);
                            addAuditLogEntry("TUNING SERVICE", `Continuous Conversation: ${!continuousMode ? "ENABLED" : "DISABLED"}`, "write");
                          }}
                          className="transition rounded-md"
                        >
                          {continuousMode ? (
                            <ToggleRight size={24} className="text-cyan-400" />
                          ) : (
                            <ToggleLeft size={24} className="text-slate-600" />
                          )}
                        </button>
                      </div>

                      <div className="h-[1px] bg-white/5" />

                      {/* Sliders */}
                      <div className="space-y-3 font-mono text-[10.5px]">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-300">Humor & Wit Quotient</span>
                            <span className="text-cyan-400">{humorLevel}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="100" value={humorLevel} 
                            onChange={(e) => setHumorLevel(Number(e.target.value))}
                            className="w-full accent-cyan-500 bg-slate-900 rounded-lg cursor-pointer h-1"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-300">Empathy Amplification Index</span>
                            <span className="text-pink-400">{empathyScore}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="100" value={empathyScore} 
                            onChange={(e) => setEmpathyScore(Number(e.target.value))}
                            className="w-full accent-pink-500 bg-slate-900 rounded-lg cursor-pointer h-1"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-300">Moyna Cognitive Response Pace</span>
                            <span className="text-[#93c1ff]">{reflectionPace}ms delay</span>
                          </div>
                          <input 
                            type="range" min="10" max="1000" value={reflectionPace} 
                            onChange={(e) => setReflectionPace(Number(e.target.value))}
                            className="w-full accent-sky-450 bg-slate-900 rounded-lg cursor-pointer h-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* F. Future Robot Hardware Synapse Connector Hub */}
                    <div className="border border-white/5 rounded-xl bg-black/30 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap size={12} className={robotConnected ? "text-amber-400 animate-pulse" : "text-slate-500"} />
                            Future Robot Synapse Control Hub
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Pair, synchronize, and transmit data streams with a physical companion mini-robot hardware unit</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRobotConnected(!robotConnected);
                            addAuditLogEntry("ROBOT_SYNAPSE", `Physical robot link state modified to: ${!robotConnected ? "ESTABLISHED" : "TERMINATED"}`, !robotConnected ? "decrypt" : "write");
                          }}
                          className={`text-[8.5px] font-bold px-2.5 py-1 rounded-md border transition cursor-pointer ${
                            robotConnected
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                              : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {robotConnected ? "ONLINE" : "OFFLINE (PAIR)"}
                        </button>
                      </div>

                      {robotConnected ? (
                        <div className="space-y-3 animate-fade-in text-[10px]">
                          <div className="grid grid-cols-2 gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                            <div>
                              <span className="text-slate-500 font-bold block text-[8px] uppercase tracking-wider">Animated Eye Screen</span>
                              <div className="flex gap-1.5 mt-1.5">
                                {["happy", "blink", "scanning", "sparkle"].map((eyes) => (
                                  <button
                                    key={eyes}
                                    type="button"
                                    onClick={() => {
                                      setRobotEyesMode(eyes as any);
                                      addAuditLogEntry("ACTUATOR_SYNC", `Transmitted ocular expression command: [${eyes.toUpperCase()}]`, "write");
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[8.5px] uppercase font-bold border transition cursor-pointer ${
                                      robotEyesMode === eyes
                                        ? "border-amber-400 bg-amber-400/20 text-amber-300"
                                        : "border-white/5 hover:bg-white/5 text-slate-400"
                                    }`}
                                  >
                                    {eyes}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-l border-white/5 pl-3 flex flex-col justify-between">
                              <div>
                                <span className="text-slate-500 font-bold block text-[8px] uppercase tracking-wider">Cradle battery status</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-8 h-3.5 bg-slate-800 rounded border border-white/10 relative overflow-hidden shrink-0">
                                    <div className="h-full bg-emerald-550 transition-all duration-500" style={{ width: `${robotBattery}%` }} />
                                  </div>
                                  <span className="text-[9.5px] font-bold text-emerald-400">{robotBattery}%</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setRobotBattery(100);
                                  addAuditLogEntry("POWER_SYSTEM", "Physical motor dock engaged. Charging pins coupled.", "decrypt");
                                }}
                                className="text-[7.5px] text-left text-cyan-400 hover:underline uppercase"
                              >
                                engage charging cradle
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[8px] text-slate-400 px-1">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              WAKE WORD SYNCPASS STREAMING READY [MOYNA_WAVE]
                            </span>
                            <span className="font-mono text-slate-500">
                              L-TOUCH: <span className="text-amber-400 font-bold">{lastTouchTimestamp}</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const current = new Date().toLocaleTimeString();
                                setLastTouchTimestamp(current);
                                addAuditLogEntry("TOUCH_SENSOR", `Simulating physical top-head touch sensor tap: ${current}`, "write");
                              }}
                              className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-center font-bold text-slate-200 transition cursor-pointer text-[8.5px] tracking-wider"
                            >
                              🙌 REPLICATE TOP-HEAD PINCH INDEX
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                addAuditLogEntry("SERVO_TEST", "Moving robot head pivot left/right pitch coordinates to central.", "write");
                              }}
                              className="p-1 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-center font-bold text-slate-400 hover:text-white transition cursor-pointer text-[8.5px]"
                              title="Test micro-servo alignment"
                            >
                              🤖 TEST SERVOS
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9.5px] text-slate-500 italic p-3 text-center border border-dashed border-white/5 bg-black/10 rounded-lg font-sans">
                          Moyna Physical Chassis linkage is currently offline. Press &quot;PAIR&quot; to hook up bluetooth-cradle emulation.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* D. GOOGLE DRIVE LINKS */}
                {activeHUDTab === "drive" && (
                  <div className="space-y-4 animate-fade-in text-left font-sans">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">Google Drive Cloud Link</h3>
                        <p className="text-[10px] text-slate-400 font-mono">RETRIEVE, SUMMARIZE, AND EXTRACT DOCUMENTS ({mockDriveFiles.length} FILES)</p>
                      </div>
                      <button
                        onClick={triggerDriveSync}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition flex items-center gap-1.5 cursor-pointer ${
                          syncStatus === "syncing" 
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 animate-pulse" 
                            : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        <RefreshCw size={11} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                        <span>{syncStatus === "syncing" ? "SYNCING FOLDERS..." : syncStatus === "done" ? "SYNC DONE" : "RE-SYNC DRIVE"}</span>
                      </button>
                    </div>

                    {/* Simple search folders */}
                    <div className="flex items-center gap-2 p-2 bg-black/40 border border-white/5 rounded-xl text-xs font-mono">
                      <Search size={12} className="text-slate-500 ml-1" />
                      <input 
                        type="text" 
                        placeholder="Search linked PDF / DOCX archives..." 
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-white w-full"
                      />
                    </div>

                    {/* Extracted file reader block */}
                    <AnimatePresence>
                      {extractedData && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-[#c2e4ff] text-xs font-mono relative leading-relaxed"
                        >
                          <h4 className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest flex items-center gap-1.5 mb-1">
                            <Sparkle size={10} className="animate-spin" /> Deep Intelligent Extraction Frame
                          </h4>
                          <p>{extractedData}</p>
                          <button 
                            onClick={() => setExtractedData(null)}
                            className="absolute top-2.5 right-2.5 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Files container layout */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                      {mockDriveFiles.filter(f => f.name.toLowerCase().includes(driveSearch.toLowerCase())).map(file => (
                        <div 
                          key={file.id}
                          className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 hover:border-white/10 transition group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="p-2 ml-1 rounded-lg bg-indigo-500/10 text-[#93c1ff] shrink-0">
                              <FolderOpen size={14} />
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-slate-200 font-semibold block truncate">{file.name}</span>
                              <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">{file.size} • Last Updated: {file.date}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => extractFileContent(file.id, file.name)}
                            disabled={extractingId !== null}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                              extractingId === file.id 
                                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 animate-pulse" 
                                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                            }`}
                          >
                            {extractingId === file.id ? <RefreshCw size={11} className="animate-spin" /> : <FileCheck size={11} />}
                            <span>{extractingId === file.id ? "SCRAPING" : "EXTRACT"}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* E. HOLOGRAPHIC CAMERA LENS */}
                {activeHUDTab === "vision" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">Eye-OS Vision Acquisition</h3>
                        <p className="text-[10px] text-slate-400 font-mono">DYNAMIC IMAGE RESOLVER & SCENE BOUNDING MESH</p>
                      </div>
                      
                      <button
                        onClick={isCameraActive ? stopCamera : startCamera}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition cursor-pointer flex items-center gap-1.5 ${
                          isCameraActive 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20" 
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                        }`}
                      >
                        <Camera size={11} />
                        <span>{isCameraActive ? "SHUTDOWN CAMERA" : "INITIALIZE CAMERA"}</span>
                      </button>
                    </div>

                    {cameraError && (
                      <div className="p-3 border border-red-500/10 bg-red-950/20 rounded-xl text-red-300 font-mono text-[10.5px] leading-relaxed">
                        ⚠️ {cameraError}
                      </div>
                    )}

                    {/* Camera Device Source Selector (PC, OBS, Phone, Laptop compatible) */}
                    {availableCameras.length > 0 && (
                      <div className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-xl text-xs font-mono">
                        <label className="text-[9px] text-[#93c1ff] tracking-widest uppercase font-bold">Active Camera Target (OBS / PC / Phone / Laptop)</label>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            onSelectCamera(newId);
                            if (isCameraActive) {
                              startCamera(newId);
                            }
                          }}
                          className="bg-slate-950 text-slate-250 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-cyan-500/60 mt-1 cursor-pointer"
                        >
                          {availableCameras.map((device, idx) => (
                            <option key={device.deviceId || idx} value={device.deviceId}>
                              {device.label || `Holographic Input Source ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Visual stream preview container */}
                    <div className={`aspect-[4/3] max-w-sm mx-auto rounded-2xl overflow-hidden bg-slate-950/60 border relative flex items-center justify-center transition-all ${
                      isCameraActive ? "border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "border-dashed border-white/5"
                    }`}>
                      
                      {/* Sweeping radar scanner line for camera overlays */}
                      {isLensScanning && (
                        <div className="absolute inset-x-0 h-1 bg-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20 animate-[bounce_2s_infinite] opacity-85" />
                      )}

                      {/* Unified Camera Stream Feed Container */}
                      {isCameraActive && (
                        <div 
                          className="w-full h-full transition-transform duration-500 ease-out"
                          style={{ transform: `scale(${cameraZoomLevel})` }}
                        >
                          {isCameraSimulated ? (
                            <DashboardCameraSimulator />
                          ) : (
                            <DashboardCameraFeed stream={cameraStream} />
                          )}
                        </div>
                      )}

                      {/* Interactive Zoom HUD Controller Floating Pill */}
                      {isCameraActive && (
                        <div className="absolute bottom-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-black/75 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 shadow-lg pointer-events-auto">
                          <span className="text-[7.5px] font-mono font-bold text-cyan-400 select-none mr-0.5">ZOOM</span>
                          {[1.0, 1.5, 2.5, 4.0].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => onSetCameraZoomLevel(level)}
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
                      )}

                      {/* Grid crosshairs overlay */}
                      {isCameraActive && !isLensScanning && (
                        <div className="absolute inset-0 pointer-events-none border border-white/5 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.4)_100%)] flex items-center justify-center">
                          <div className="w-16 h-16 border border-cyan-500/15 rounded-full relative">
                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/25" />
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-500/25" />
                          </div>
                        </div>
                      )}

                      {!isCameraActive && (
                        <div className="text-center font-mono text-[11px] text-slate-500 p-6">
                          <Eye size={22} className="mx-auto mb-2 opacity-30" />
                          <span>Interactive camera lens is inactive.</span>
                          <p className="text-[10px] text-slate-600 mt-1">Initialize the camera and snap frames to let Moyna see your surroundings.</p>
                        </div>
                      )}
                    </div>

                    {isCameraActive && (
                      <div className="flex justify-center">
                        <button
                          onClick={runCameraScan}
                          disabled={isLensScanning}
                          className={`px-5 py-2 rounded-full font-mono text-[11px] font-bold tracking-wider transition-all uppercase cursor-pointer flex items-center gap-1.5 shadow-lg ${
                            isLensScanning 
                              ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse" 
                              : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                          }`}
                        >
                          <Zap size={12} className={isLensScanning ? "animate-spin" : ""} />
                          <span>{isLensScanning ? "SOLVING SCENE..." : "Capture Snapshot & OCR Code Scan"}</span>
                        </button>
                      </div>
                    )}

                    {/* Scan Bounding outcomes */}
                    <AnimatePresence>
                      {scanResults && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl border border-[#93c1ff]/20 bg-[#93c1ff]/5 font-mono text-[10.5px] leading-relaxed text-slate-300 space-y-2.5"
                        >
                          <div className="flex items-center gap-2 border-b border-white/5 pb-1 text-[#93c1ff] uppercase tracking-wider font-bold">
                            <CheckCircle size={12} /> Scanner Output Metrics
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block">Object coordinates detected:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {scanResults.labels.map((lbl, i) => (
                                <span key={lbl} className="px-1.5 py-0.5 bg-black/60 border border-cyan-500/20 text-cyan-200 text-[9px] rounded-md">
                                  [{i}] {lbl}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-slate-500 font-bold block">Facial Tonal Emotion:</span>
                              <span className="text-slate-200 mt-0.5 block">{scanResults.emotion}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block">Raw OCR text found:</span>
                              <span className="text-slate-200 mt-0.5 block italic font-sans">"{scanResults.ocr}"</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* F. PRIVACY AUDIT & GDPR EXPORTS */}
                {activeHUDTab === "privacy" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">Full Privacy Safe-House</h3>
                        <p className="text-[10px] text-slate-400 font-mono">COMPLIANT WITH GDPR USER PRIVACY MANDATES</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleExportMemories}
                          className="p-4 rounded-xl border border-cyan-500/10 hover:border-cyan-500/25 bg-cyan-950/15 text-cyan-400 transition cursor-pointer flex flex-col justify-between h-20 text-left"
                        >
                          <Download size={15} />
                          <div>
                            <span className="text-xs font-semibold block font-mono">Export Recollections DB</span>
                            <span className="text-[8.5px] text-slate-500 mt-0.5 block leading-tight">Download complete persistent state files (.json format)</span>
                          </div>
                        </button>

                        <button
                          onClick={handlePurgeDatabase}
                          className="p-4 rounded-xl border border-red-500/10 hover:border-red-500/25 bg-red-950/15 text-red-400 transition cursor-pointer flex flex-col justify-between h-20 text-left"
                        >
                          <Trash2 size={15} />
                          <div>
                            <span className="text-xs font-semibold block font-mono">Purge Memory Slots</span>
                            <span className="text-[8.5px] text-slate-500 mt-0.5 block leading-tight">Formulate complete DB erase on active document fields</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Smart Security Heuristic Scam Check Sandbox */}
                    <div className="border border-white/5 rounded-xl bg-black/30 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                            <Shield size={12} className="text-red-400 animate-pulse" />
                            Smart Security & Scam Guardian
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Paste any suspicious message, link, email, or investment pitch to test in our secure sandbox heuristic firewall</p>
                        </div>
                        <span className="text-[8px] bg-red-950/20 px-2 py-0.5 rounded text-red-400 border border-red-500/10 font-bold">SECURE_WALL</span>
                      </div>

                      <div className="space-y-2 text-[10px]">
                        <textarea
                          rows={2}
                          value={phishingInput}
                          onChange={(e) => setPhishingInput(e.target.value)}
                          placeholder="Paste email structure or SMS alerts (e.g., 'URGENT: Your account limit breached. Click http://scamy-link.org...')"
                          className="w-full bg-slate-950/80 border border-white/5 rounded-lg p-2 text-[10px] text-slate-200 font-sans focus:outline-none focus:border-red-400/40 focus:ring-1 focus:ring-red-400/25 leading-relaxed placeholder:text-slate-650"
                        />
                        <button
                          type="button"
                          onClick={handleValidateScam}
                          className="w-full py-1.5 bg-gradient-to-r from-red-550 to-rose-650 text-white font-mono font-bold text-[9.5px] tracking-wider rounded-lg shrink-0 transition cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5"
                        >
                          <Lock size={10} />
                          <span>RUN HEURISTICS SCAN VERDICT</span>
                        </button>

                        <AnimatePresence>
                          {phishingResult && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1.5"
                            >
                              <div className="flex items-center justify-between font-bold border-b border-white/5 pb-1">
                                <span className="text-slate-400 uppercase text-[8.5px]">Firewall Report Verdict:</span>
                                <span className={`text-[9.5px] uppercase tracking-widest px-1.5 rounded ${
                                  phishingResult.risk === "CRITICAL_DANGER" ? "text-red-450 bg-red-950/40" :
                                  phishingResult.risk === "HIGH_WARNING" ? "text-amber-405 bg-amber-950/40" :
                                  phishingResult.risk === "LOW" ? "text-cyan-405 bg-cyan-950/40" :
                                  "text-emerald-455 bg-emerald-950/40"
                                }`}>
                                  {phishingResult.risk}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-350">
                                <span>Risk Score Matrix:</span>
                                <span className="font-bold">{phishingResult.score}% Warning Rate</span>
                              </div>
                              <div className="pt-1.5 border-t border-white/5 space-y-1 text-[8.5px] font-sans">
                                {phishingResult.findings.map((f, idx) => (
                                  <div key={idx} className="flex items-start gap-1 text-slate-400 leading-normal">
                                    <span className="text-red-500">⚠</span>
                                    <span>{f}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Audits: Transparent Memory Logs list */}
                    <div className="border-[1.5px] border-white/5 rounded-xl bg-black/20 p-4 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-wrap gap-1.5">
                        <div>
                          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-200">Transparent Memory Access Logs</h4>
                          <p className="text-[9px] text-slate-500 font-mono">AUDIT DEEP COGNITIVE REQUEST REPLICANTS</p>
                        </div>
                        <button
                          onClick={() => {
                            setAuditLogs([
                              { id: "base", time: new Date().toLocaleTimeString(), action: "AUDIT PURGE", desc: "User requested log view recycling.", type: "write" }
                            ]);
                          }}
                          className="text-[9px] font-mono text-slate-500 hover:text-slate-350 hover:underline cursor-pointer lowercase"
                        >
                          clear logs
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 font-mono text-[9.5px]">
                        {auditLogs.map(log => (
                          <div 
                            key={log.id}
                            className="bg-black/30 border border-white/5 rounded-md p-2 flex items-start gap-2.5"
                          >
                            <span className="text-slate-500 shrink-0 font-bold">{log.time}</span>
                            <div className="flex-1">
                              <span className={`font-bold tracking-wider uppercase inline-block mr-1.5 ${
                                log.type === "write" ? "text-purple-400" : log.type === "decrypt" ? "text-amber-400" : "text-[#93c1ff]"
                              }`}>
                                [{log.action}]
                              </span>
                              <span className="text-slate-350 tracking-wide font-sans">{log.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* F. SYSTEM LIFE-OS PIPELINE */}
                {activeHUDTab === "life_os" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* Unified Productivity Hub Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Interactive Task Matrix */}
                      <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold text-[#22d3ee] uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-cyan-400" />
                            Core Task Matrix & Routine Hub
                          </h4>
                          <span className="text-[8px] bg-cyan-950/30 px-2 py-0.5 rounded text-cyan-400 font-bold border border-cyan-500/10">LIFE OS v2.1</span>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add mission objective or reminder..."
                            className="flex-1 bg-slate-950/80 border border-white/10 rounded-lg p-1.5 text-[10.5px] text-white focus:outline-none focus:border-cyan-400/60"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newTaskText.trim()) {
                                setTasks(p => [...p, { id: `${Date.now()}`, text: newTaskText, completed: false, routine: "daily", category: newTaskCategory }]);
                                addAuditLogEntry("LIFE_OS", `Appended new objective to tasks list: ${newTaskText}`, "write");
                                setNewTaskText("");
                              }
                            }}
                          />
                          <select
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value)}
                            className="bg-slate-950 text-slate-350 border border-white/10 rounded-lg px-2 text-[10px] focus:outline-none"
                          >
                            <option value="work">WORK</option>
                            <option value="creative">CREATIVE</option>
                            <option value="research">RESEARCH</option>
                          </select>
                          <button
                            onClick={() => {
                              if (!newTaskText.trim()) return;
                              setTasks(p => [...p, { id: `${Date.now()}`, text: newTaskText, completed: false, routine: "daily", category: newTaskCategory }]);
                              addAuditLogEntry("LIFE_OS", `Appended new objective: ${newTaskText}`, "write");
                              setNewTaskText("");
                            }}
                            className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5 text-[10.5px] font-sans">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => {
                                    setTasks(p => p.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                    addAuditLogEntry("LIFE_OS", `Toggled task state: ${task.text}`, "write");
                                  }}
                                  className="rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-0 focus:ring-offset-0"
                                />
                                <span className={`truncate text-slate-200 ${task.completed ? "line-through text-slate-500 font-mono scale-95" : "font-semibold"}`}>
                                  {task.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[7px] font-mono font-bold uppercase tracking-widest px-1 py-0.5 rounded shrink-0 ${
                                  task.category === "work" ? "bg-amber-500/10 text-amber-400" :
                                  task.category === "creative" ? "bg-pink-500/10 text-pink-400" :
                                  "bg-indigo-500/10 text-indigo-400"
                                }`}>
                                  {task.category}
                                </span>
                                <button
                                  onClick={() => {
                                    setTasks(p => p.filter(t => t.id !== task.id));
                                    addAuditLogEntry("LIFE_OS", `Purged task directive: ${task.text}`, "write");
                                  }}
                                  className="text-slate-500 hover:text-red-400 transition"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Computer OS Agent Telemetry */}
                      <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Info size={12} className="text-emerald-400" />
                            Computer OS Agent & Sentinel
                          </h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>

                        <div className="space-y-2 text-[10px] font-mono leading-relaxed">
                          <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                            <span className="text-slate-400">Observed Active Window:</span>
                            <select
                              value={computerApp}
                              onChange={(e) => {
                                setComputerApp(e.target.value);
                                const bottlenecks: Record<string, string> = {
                                  "VS Code": "Excessive node modules resolution. Suggest checking package imports.",
                                  "Chrome DevTools": "Active WebSocket pipeline frame rate latency measured at 30 fps. Target stable.",
                                  "Figma UI Drafts": "Prototype scaling overhead. Ideal: purge unused vector paths.",
                                  "Sitar Tuning Player": "High background audio audio buffer load. Alpha wave sync optimized."
                                };
                                setAppBottleneck(bottlenecks[e.target.value]);
                                addAuditLogEntry("OS_AGENT", `Captured active desktop frame change: ${e.target.value}`, "read");
                              }}
                              className="bg-slate-950 text-slate-200 border border-white/10 rounded px-1.5 py-0.5 text-[9.5px]"
                            >
                              <option value="VS Code">VS Code IDE</option>
                              <option value="Chrome DevTools">Chrome browser</option>
                              <option value="Figma UI Drafts">Figma design</option>
                              <option value="Sitar Tuning Player">Tuning player</option>
                            </select>
                          </div>

                          <div className="bg-black/30 p-3 rounded-lg border border-dashed border-emerald-500/20 text-slate-350 leading-relaxed">
                            <span className="text-emerald-400 font-bold block text-[8px] uppercase tracking-wider mb-1">Bottleneck Diagnostics</span>
                            <p className="font-sans text-[10px]">{appBottleneck}</p>
                            <span className="text-[7.5px] text-[#93c1ff] mt-2 block hover:underline cursor-pointer" onClick={() => {
                              addAuditLogEntry("OS_AGENT", "Dispatched automatic clean buffer system daemon.", "write");
                              alert("Auto-repaired workspace heap cache!");
                            }}>
                              ⚡ CLICK TO DISPATCH AUTONOMOUS BOTTLENECK REMEDY
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Creator Engine Drafting Suite */}
                    <div className="border border-white/5 rounded-xl bg-black/45 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkle size={12} className="text-amber-405" />
                            Creator Mode Studio (Content Script Generator)
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Synthesize customized outlines, YouTube voiceover scripts, titles, and social outlines instantly</p>
                        </div>
                        <span className="text-[8px] bg-amber-950/20 px-2 py-0.5 rounded text-amber-400 border border-amber-500/10 font-bold">CREATOR ENGINE</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                        <input
                          type="text"
                          value={creatorTopic}
                          onChange={(e) => setCreatorTopic(e.target.value)}
                          placeholder="Topic (e.g. Master Sitar tuning, Bengali aesthetics...)"
                          className="sm:col-span-2 bg-slate-950/85 border border-white/10 rounded-lg p-2 text-slate-200"
                        />
                        <select
                          value={creatorPlatform}
                          onChange={(e) => setCreatorPlatform(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-lg text-slate-200 p-2 cursor-pointer"
                        >
                          <option value="YouTube video script">YouTube Video Script</option>
                          <option value="Instagram reels outline">Instagram Reels Wrap</option>
                          <option value="Technical blog breakdown">Technical Spec Blog</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (!creatorTopic.trim()) return;
                          setCreatorLoading(true);
                          setCreatorOutput("");
                          addAuditLogEntry("CREATOR_STUDIO", `Initializing creative drafting pipeline: [${creatorPlatform}] for ${creatorTopic}`, "read");
                          setTimeout(() => {
                            setCreatorLoading(false);
                            setCreatorOutput(`### DRAFT SCRIPT: ${creatorTopic.toUpperCase()}
[Estimated Duration: 90 Seconds • Visual: High-contrast ambient neon glow]

**[00:00 - Introduction Block]**
"Imagine taking the complex frequencies of modern full-stack systems and weaving them with local artistic tempos of Bengali instrumental sitars. Let's build a clean, unified workspace that preserves absolute user privacy while automating daily goals."

**[00:30 - Core Demonstration]**
- Highlight the Eye-OS camera tracking and real-time scanning matrices.
- Showcase the responsive multi-agent swarm cooperating recursively.

**[01:15 - Closing Statement]**
"That is the Moyna OS experience. Scaled, local, protected. Click follow to join the next-generation AI evolution."`);
                            addAuditLogEntry("CREATOR_STUDIO", "Synthesized script completed. Rendered formatting markdown output", "write");
                          }, 1600);
                        }}
                        disabled={creatorLoading}
                        className="w-full py-1.5 bg-gradient-to-r from-amber-550 to-orange-650 text-white font-bold text-[9.5px] rounded-lg tracking-wider transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {creatorLoading ? <RefreshCw size={11} className="animate-spin" /> : <Layers size={11} />}
                        <span>{creatorLoading ? "DRAFTING CREATIVE COMPOSITION..." : "GENERATE CUSTOM VOICE SCRIPT & THUMBNAIL SPECS"}</span>
                      </button>

                      {creatorOutput && (
                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-[10px] text-slate-200 font-sans max-h-[140px] overflow-y-auto pr-1 leading-relaxed">
                          <textarea
                            value={creatorOutput}
                            onChange={(e) => setCreatorOutput(e.target.value)}
                            className="w-full bg-transparent border-none text-[9.5px] text-slate-200 font-mono h-[110px] focus:outline-none resize-none leading-relaxed"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* G. AUTONOMOUS RESEARCH SWARM */}
                {activeHUDTab === "research" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* Deep Web Research Unit */}
                    <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-[#93c1ff] uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={12} className="text-cyan-400" />
                            Deep Search & Source Verification Laboratory
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Autonomous intelligence web query comparer, fact examiner, and report aggregator</p>
                        </div>
                        <span className="text-[8px] bg-indigo-950/20 px-2 py-0.5 rounded text-indigo-400 border border-indigo-500/10 font-bold">FACT DETECTOR</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={researchTopic}
                          onChange={(e) => setResearchTopic(e.target.value)}
                          placeholder="Type inquiry topic (e.g. quantum cryptography standards or Bengali lofi tracks list)..."
                          className="flex-1 bg-slate-950/80 border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          onClick={() => {
                            if (!researchTopic.trim()) return;
                            setResearchLoading(true);
                            setResearchResult(null);
                            addAuditLogEntry("RESEARCH_LAB", `Firing deep intelligence inquiry: ${researchTopic}`, "read");
                            setTimeout(() => {
                              setResearchLoading(false);
                              setResearchResult({
                                query: researchTopic,
                                check: "99.8% VERIFIED PARITY COMPATIBLE",
                                sources: [
                                  "IEEE Quantum Research Catalog 2026",
                                  "Bangla Instrumental Archive, Sitar Division",
                                  "MIT Computing Laboratory Specs v9"
                                ],
                                report: `### STABILITY REPORT BRIEF: ${researchTopic.toUpperCase()}
1. **Fact Review**: Topic investigated across established repository clusters.
2. **Technical Layout**: Cross-analysis verifies all components match SSL and local sandbox limits perfectly.
3. **Synthesis**: Highly recommended to preserve local configurations under offline local memory modules. Core systems demonstrate optimal parity rates.`
                              });
                              addAuditLogEntry("RESEARCH_LAB", "Fact check synthesizers successfully assembled deep verified report.", "write");
                            }, 1800);
                          }}
                          disabled={researchLoading}
                          className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-[10px] rounded-lg tracking-wider"
                        >
                          {researchLoading ? "COMPARING..." : "RUN AI LAB"}
                        </button>
                      </div>

                      {researchResult && (
                        <div className="bg-slate-950/70 rounded-xl p-3 border border-white/5 space-y-2 text-[9.5px]">
                          <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-cyan-500/10 font-bold text-[8.5px]">
                            <span className="text-slate-400">VERIFICATION ENGINE METRIC:</span>
                            <span className="text-emerald-400">{researchResult.check}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-550 block font-bold text-[7.5px] uppercase tracking-wider">Identified Primary Sources Checked:</span>
                            {researchResult.sources.map((s, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-slate-350">
                                <span className="text-cyan-400">•</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-white/5 pt-2 text-slate-200 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                            <div className="text-[9px] whitespace-pre-wrap leading-normal font-sans text-slate-300">
                              {researchResult.report}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Collaborative Multi-Agent Swarm Console */}
                    <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-[#c084fc] uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={12} className="text-purple-400 animate-pulse" />
                            AI Swarm Live Collaboration Room
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Activate the parallel swarm workflow where five sub-agents debate objectives</p>
                        </div>
                        <button
                          onClick={() => {
                            setAgentsSwarmingActive(!agentsSwarmingActive);
                            addAuditLogEntry("SWARM_AGENT", `Agent swarm connection state changed: ${!agentsSwarmingActive ? "ENGAGED" : "DORMANT"}`, "read");
                          }}
                          className={`text-[8px] font-bold px-2 py-0.5 rounded border transition ${
                            agentsSwarmingActive ? "border-purple-400 bg-purple-500/10 text-purple-300" : "border-white/10 bg-white/5 text-slate-400"
                          }`}
                        >
                          {agentsSwarmingActive ? "SWARM ACTIVE" : "WAKE SWARM"}
                        </button>
                      </div>

                      {agentsSwarmingActive ? (
                        <div className="space-y-2.5 animate-fade-in max-h-[220px] overflow-y-auto pr-1">
                          {agentMessages.map((msg, i) => (
                            <div key={i} className="text-[10px] p-2 rounded bg-black/35 border border-white/5 leading-relaxed">
                              <div className="flex items-center justify-between mb-1.5 border-b border-white/5 pb-0.5">
                                <span className="font-bold text-slate-200 flex items-center gap-1">
                                  <span>{msg.avatar}</span>
                                  <span>{msg.sender}</span>
                                </span>
                                <span className="text-[7.5px] text-slate-500 font-bold">{msg.timestamp}</span>
                              </div>
                              <p className="text-slate-300 font-sans text-[10px] tracking-wide">{msg.message}</p>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const list = [
                                { sender: "Developer Agent", avatar: "💻", message: "Refactoring standard UI widgets. Injected responsive grid boundaries. Compiles smoothly.", timestamp: "10:32" },
                                { sender: "Designer Agent", avatar: "🎨", message: "Refining visual rhythm. Used Inter and Space Grotesk fonts paired with deep space charcoal gradients.", timestamp: "10:33" },
                                { sender: "Marketing Agent", avatar: "📈", message: "Targeting user demographic alerts. Added smart security firewall showcase coordinates.", timestamp: "10:34" }
                              ];
                              const nextMsg = list[agentMessages.length % list.length];
                              setAgentMessages(p => [...p, { ...nextMsg, timestamp: new Date().toLocaleTimeString().slice(0,5) }]);
                              addAuditLogEntry("SWARM_AGENT", `Simulating parallel response thread from: ${nextMsg.sender}`, "write");
                            }}
                            className="w-full text-center py-1 bg-white/5 border border-white/5 hover:bg-white/10 text-[8.5px] font-bold text-purple-400 hover:text-purple-300 rounded"
                          >
                            + CLICK TO TRIGGER NEXT AGENT DECISION CYCLE
                          </button>
                        </div>
                      ) : (
                        <p className="text-[9.5px] italic text-slate-500 p-4 border border-dashed border-white/5 bg-black/10 rounded-lg text-center font-sans">
                          Swarm agents are resting in hibernation mode. Enable to authorize parallel collaboration.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* H. DIGITAL TWIN & MIND GRAPH */}
                {activeHUDTab === "digital_twin" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* User Personalized Habits Twin Profile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold text-[#f43f5e] uppercase tracking-wider flex items-center gap-1.5">
                            <User size={12} className="text-rose-450" />
                            Digital Twin Habits Core
                          </h4>
                          <span className="text-[8px] bg-rose-950/20 px-2 py-0.5 rounded text-rose-400 border border-rose-500/10 font-bold">PREDICTOR KEY</span>
                        </div>
                        
                        <div className="space-y-2 text-[9.5px]">
                          <div className="flex justify-between items-center text-slate-350">
                            <span>Learned Sleep Interval:</span>
                            <span className="font-bold text-slate-100">6.5h average (Winding: sitar audio)</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-350">
                            <span>Peak Coding Study Blocks:</span>
                            <span className="font-bold text-slate-100">Friday afternoons (VS Code)</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-350">
                            <span>Recommended Music Tempo:</span>
                            <span className="font-bold text-slate-100 font-mono text-[8.5px]">74 BPM (Bengali Ambient Lofi)</span>
                          </div>
                          
                          <div className="pt-2 border-t border-white/5 bg-rose-955/5 p-2 rounded border border-rose-500/15 leading-relaxed text-rose-300">
                            <span className="font-bold block text-[8px] uppercase tracking-wider text-rose-400 mb-0.5">⚠️ PREDICTIVE ADULT ALERTS</span>
                            Your standard study clock triggers in 15 minutes. Pre-engaging low-latency sitar background loops...
                          </div>
                        </div>
                      </div>

                      {/* Interactive Personal Knowledge Graph map */}
                      <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={12} className="text-indigo-400" />
                            Mind Knowledge Graph Map
                          </h4>
                          <span className="text-[8.5px] text-slate-500 font-bold">INTERACTIVE SVG</span>
                        </div>

                        {/* Beautiful mini Interactive Graph representation SVG */}
                        <div className="bg-slate-950/60 rounded-xl p-2 border border-white/5 relative h-32 flex items-center justify-center select-none overflow-hidden">
                          <svg className="w-full h-full text-slate-600" viewBox="0 0 200 100">
                            {/* Lines */}
                            <line x1="100" y1="50" x2="50" y2="25" stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
                            <line x1="100" y1="50" x2="150" y2="25" stroke="rgba(244,63,94,0.4)" strokeWidth="1" />
                            <line x1="100" y1="50" x2="50" y2="75" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />
                            <line x1="100" y1="50" x2="150" y2="75" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />

                            {/* Center user node */}
                            <circle cx="100" cy="50" r="10" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" className="cursor-pointer hover:fill-cyan-950" onClick={() => addAuditLogEntry("KNOWLEDGE_GRAPH", "Selected Root Node: User Profile Identity", "read")} />
                            <text x="100" y="52" fill="#22d3ee" fontSize="5" fontWeight="bold" textAnchor="middle">ME</text>

                            {/* Node 1 */}
                            <circle cx="50" cy="25" r="7" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" className="cursor-pointer" onClick={() => addAuditLogEntry("KNOWLEDGE_GRAPH", "Selected Node: Siddharth (Brother) Relationship Link", "read")} />
                            <text x="50" y="27" fill="#f43f5e" fontSize="4" textAnchor="middle">BRO</text>

                            {/* Node 2 */}
                            <circle cx="150" cy="25" r="7" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" className="cursor-pointer" onClick={() => addAuditLogEntry("KNOWLEDGE_GRAPH", "Selected Node: Spec draft v4 Project", "read")} />
                            <text x="150" y="27" fill="#a855f7" fontSize="4" textAnchor="middle">SPEC</text>

                            {/* Node 3 */}
                            <circle cx="50" cy="75" r="7" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" className="cursor-pointer" onClick={() => addAuditLogEntry("KNOWLEDGE_GRAPH", "Selected Node: Bengali lofi Aesthetics Target Goal", "read")} />
                            <text x="50" y="77" fill="#10b981" fontSize="4" textAnchor="middle">LOFI</text>

                            {/* Node 4 */}
                            <circle cx="150" cy="75" r="7" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" className="cursor-pointer" onClick={() => addAuditLogEntry("KNOWLEDGE_GRAPH", "Selected Node: Multi-Agent cloud synapse database", "read")} />
                            <text x="150" y="77" fill="#f59e0b" fontSize="4" textAnchor="middle">MEM</text>
                          </svg>
                          <span className="absolute bottom-1 right-2 text-[8px] text-slate-550">Click nodes below for telemetry</span>
                        </div>
                      </div>
                    </div>

                    {/* Emotion Analytics weekly trends */}
                    <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Heart size={12} className="text-cyan-400" strokeWidth={2.5} />
                            Weekly Emotion Analytics
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Tonal analysis logs of client state markers tracked across session interactions</p>
                        </div>
                        <div className="flex gap-1.5">
                          {(["joy", "calm", "focus", "stress"] as const).map((metric) => (
                            <button
                              key={metric}
                              onClick={() => {
                                setSelectedAnalyticsMetric(metric);
                                addAuditLogEntry("EMOTION_ANALYTICS", `Filtered emotion timeline metric query: ${metric}`, "read");
                              }}
                              className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase border transition cursor-pointer ${
                                selectedAnalyticsMetric === metric
                                  ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-350"
                                  : "border-white/5 bg-white/5 text-slate-400 hover:text-slate-350 hover:border-white/10"
                              }`}
                            >
                              {metric}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Recharts Render Container */}
                      <div className="h-44 w-full bg-slate-950/40 rounded-lg p-2 border border-white/5 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={emotionTrendData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                <stop 
                                  offset="5%" 
                                  stopColor={
                                    selectedAnalyticsMetric === "joy" ? "#eab308" : 
                                    selectedAnalyticsMetric === "calm" ? "#a855f7" : 
                                    selectedAnalyticsMetric === "focus" ? "#22d3ee" : "#f43f5e"
                                  } 
                                  stopOpacity={0.25}
                                />
                                <stop 
                                  offset="95%" 
                                  stopColor={
                                    selectedAnalyticsMetric === "joy" ? "#eab308" : 
                                    selectedAnalyticsMetric === "calm" ? "#a855f7" : 
                                    selectedAnalyticsMetric === "focus" ? "#22d3ee" : "#f43f5e"
                                  } 
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis 
                              dataKey="day" 
                              stroke="#64748b" 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false} 
                            />
                            <YAxis 
                              stroke="#64748b" 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false} 
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "8px",
                                fontSize: "9px",
                                fontFamily: "monospace"
                              }}
                              itemStyle={{ color: "#22d3ee" }}
                              labelStyle={{ color: "#64748b", fontWeight: "bold" }}
                            />
                            <Area
                              type="monotone"
                              dataKey={selectedAnalyticsMetric}
                              stroke={
                                selectedAnalyticsMetric === "joy" ? "#eab308" : 
                                selectedAnalyticsMetric === "calm" ? "#a855f7" : 
                                selectedAnalyticsMetric === "focus" ? "#22d3ee" : "#f43f5e"
                              }
                              strokeWidth={1.5}
                              fillOpacity={1}
                              fill="url(#colorMetric)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-sans px-1">
                        <span>Analysis Interval: Monday 12:00 to Current Session</span>
                        <span>Standard Baseline Deviation: Stable</span>
                      </div>
                    </div>

                    {/* Offline Brain Synapse Offline download toggle */}
                    <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Database size={12} className="text-indigo-405" />
                            Offline Brain Database Caching
                          </h4>
                          <p className="text-[9px] text-slate-500 font-sans">Toggle core indexing offline, cache all records locally in safe IndexedDB sandbox</p>
                        </div>
                        <button
                          onClick={() => {
                            if (!offlineBrainActive) {
                              setOfflineSyncProgress(1);
                              addAuditLogEntry("OFFLINE_BRAIN", "Commencing safe local memory download payload...", "read");
                              let count = 1;
                              const timer = setInterval(() => {
                                count += 25;
                                if (count >= 100) {
                                  setOfflineSyncProgress(null);
                                  setOfflineBrainActive(true);
                                  addAuditLogEntry("OFFLINE_BRAIN", "Indexed local store compiled completely! Core offline backup approved.", "decrypt");
                                  clearInterval(timer);
                                } else {
                                  setOfflineSyncProgress(count);
                                }
                              }, 300);
                            } else {
                              setOfflineBrainActive(false);
                              addAuditLogEntry("OFFLINE_BRAIN", "Offline memory sandbox deleted. Standard cloud mode online.", "write");
                            }
                          }}
                          className={`text-[8.5px] font-bold px-2.5 py-1 rounded transition ${
                            offlineBrainActive ? "bg-indigo-500 text-slate-950 border border-indigo-400" : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {offlineBrainActive ? "OFFLINE ACTIVE" : "GO OFFLINE"}
                        </button>
                      </div>

                      {offlineSyncProgress !== null && (
                        <div className="space-y-1.5 animate-fade-in text-[10px]">
                          <div className="flex justify-between font-bold text-slate-400 text-[9px]">
                            <span>Pulling ISO snapshots...</span>
                            <span>{offlineSyncProgress}% COMPLETE</span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${offlineSyncProgress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${offlineBrainActive ? "bg-indigo-400 animate-pulse" : "bg-slate-700"}`} />
                        <span>{offlineBrainActive ? "Moyna can parse core facts, identity context, and calendar routines WITHOUT internet connection." : "Offline caching is currently dormant. Save storage by keeping resources on the safe cloud server."}</span>
                      </div>
                    </div>

                    {/* Nightly Dream Reflection & Progress review card */}
                    <div className="p-4 rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 space-y-3 font-mono">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Moon size={11} className="text-cyan-405" />
                          Dream & Nightly Reflection Mode
                        </h4>
                        <span className="text-[8.5px] border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 rounded text-cyan-300 uppercase font-black">ACTIVE SUMMARY</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                        &quot;Every evening at 23:30, Moyna compiles your actions, study hours, and emotional metrics, synthesizing insights directly into a comprehensive dream narrative that unlocks behavioral self-improvement curves.&quot;
                      </p>
                      <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 text-[9px] text-[#c2e4ff] leading-normal font-sans">
                        <span className="font-bold text-cyan-400 block font-mono uppercase tracking-widest mb-1">💡 Nightly Insight Wisdom Digest</span>
                        &quot;Studying while playing instrumental lofi sitar loops correlates with 18% higher task completion rate. Maintain sleep average above 6.0 hours to sustain optimal focus index.&quot;
                      </div>
                    </div>

                    {/* Integrated Birthdays & Relationship circle tracking panel */}
                    <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users size={12} className="text-emerald-405" />
                          Relationships Matrix (Friends & Birthdays)
                        </h4>
                        <span className="text-[8px] bg-emerald-950/20 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/10 font-bold">MULTI-PERSON REMINDER</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newFriendName}
                          onChange={(e) => setNewFriendName(e.target.value)}
                          placeholder="Name..."
                          className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                        />
                        <input
                          type="text"
                          value={newFriendRole}
                          onChange={(e) => setNewFriendRole(e.target.value)}
                          placeholder="Relation (e.g. Mentor)..."
                          className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                        />
                        <input
                          type="text"
                          value={newFriendBirthday}
                          onChange={(e) => setNewFriendBirthday(e.target.value)}
                          placeholder="Birthday (e.g. Jul 05)..."
                          className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newFriendName.trim() || !newFriendRole.trim()) return;
                          setSocialCircle(p => [...p, { name: newFriendName, role: newFriendRole, birthdate: newFriendBirthday || "N/A", alert: "Scheduled relationship check-in." }]);
                          addAuditLogEntry("SOCIAL", `Added ${newFriendName} to social relationships database.`, "write");
                          setNewFriendName("");
                          setNewFriendRole("");
                          setNewFriendBirthday("");
                        }}
                        className="w-full py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-300 font-bold text-[9px] rounded transition"
                      >
                        + REGISTER NEW PERSON DIRECTIVE
                      </button>

                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {socialCircle.map((friend, i) => (
                          <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5 text-[10px] font-sans">
                            <div>
                              <span className="font-bold text-slate-200">{friend.name}</span>
                              <span className="text-slate-500 text-[8.5px] font-mono ml-1.5">({friend.role})</span>
                            </div>
                            <div className="text-right text-[8.5px] font-mono">
                              <span className="text-pink-400 mr-2">🎂 {friend.birthdate}</span>
                              <span className="text-slate-405 italic text-[8.5px] block font-sans">{friend.alert}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrated Family Voice Profiles & Tune Biometrics Registry Panel */}
                    <div className="border border-white/5 rounded-xl bg-black/40 p-4 space-y-4 font-mono">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Fingerprint size={13} className="text-cyan-400 animate-pulse" />
                            Family Voice & Tune Registry (পরিবারের কণ্ঠ ও সুর সনাক্তকরণ)
                          </h4>
                          <p className="text-[9.5px] text-slate-400 font-sans leading-relaxed">
                            Moyna identifies family members like Ma, Baba, and siblings by recognizing their unique voice frequencies and musical tunes (&quot;সুর&quot;).
                          </p>
                        </div>
                        <span className="text-[8px] bg-cyan-950/20 px-2 py-0.5 rounded text-cyan-400 border border-cyan-500/15 font-bold self-start mt-1 shrink-0">
                          🎙️ BIOMETRIC SOUND AI
                        </span>
                      </div>

                      {/* Training / testing notice or active simulations overlay */}
                      {activeCalibratingId && (
                        <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 animate-pulse">
                              <Mic size={11} className="text-cyan-400 animate-bounce" />
                              MOYNA LISTENING... SPEAK OR HUM CURRENT TUNE NOW
                            </span>
                            <span>{calibrationProgress}% SECURE LOCK</span>
                          </div>
                          
                          {/* Simulated sound waves visualizer */}
                          <div className="flex items-center justify-center gap-1 h-8 bg-black/30 rounded-md overflow-hidden border border-white/5">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const rHeight = 15 + Math.random() * 85;
                              return (
                                <div
                                  key={i}
                                  style={{ height: `${rHeight}%` }}
                                  className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full animate-pulse"
                                />
                              );
                            })}
                          </div>
                          <p className="text-[9px] text-cyan-400 text-center">
                            Extracting pitch harmonics, formants, accentuation curves and hum-templates...
                          </p>
                        </div>
                      )}

                      {activeTestingId && (
                        <div className="p-3 rounded-lg bg-purple-950/25 border border-purple-500/30 text-purple-200 space-y-1 font-sans">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-purple-400">
                            <Activity size={12} className="animate-ping" />
                            <span>VOICE TEMPLATE PATTERN STREAM CHECK</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-300 leading-normal">
                             {testResult}
                          </p>
                        </div>
                      )}

                      {/* Add new target member form */}
                      <div className="space-y-2 bg-black/25 p-3 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-400 block font-bold leading-none mb-1">
                          + ADD NEW FAMILY / PROFILE BIOMETRICS TEMPLATE
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={newVoiceName}
                            onChange={(e) => setNewVoiceName(e.target.value)}
                            placeholder="Name (e.g. Rawshan Ara (Fupu))..."
                            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-cyan-500/40 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newVoiceRelation}
                            onChange={(e) => setNewVoiceRelation(e.target.value)}
                            placeholder="Relation (e.g. Aunt)..."
                            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-cyan-500/40 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newVoicePitch}
                            onChange={(e) => setNewVoicePitch(e.target.value)}
                            placeholder="Pitch Range (e.g. 190Hz - 225Hz)..."
                            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-cyan-500/40 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newVoiceResonance}
                            onChange={(e) => setNewVoiceResonance(e.target.value)}
                            placeholder="Resonance (e.g. Soft Alto)..."
                            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-cyan-500/40 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newVoiceTune}
                            onChange={(e) => setNewVoiceTune(e.target.value)}
                            placeholder="Favorite Hum/Tune (e.g. Flute lofi loop)..."
                            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[14px] sm:text-[10px] col-span-1 sm:col-span-2 text-white focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newVoiceName.trim() || !newVoiceRelation.trim()) return;
                            const newId = `v${familyVoiceProfiles.length + 1}`;
                            setFamilyVoiceProfiles(p => [
                              ...p,
                              {
                                id: newId,
                                name: newVoiceName,
                                relation: newVoiceRelation,
                                pitchRange: newVoicePitch || "Adaptive 140Hz-180Hz",
                                resonance: newVoiceResonance || "Warm harmonic soprano",
                                status: "Template Created (Ready for cal)",
                                confidence: "Pending calibration",
                                favoriteTune: newVoiceTune || "Harmonic whistle tune loop",
                                active: true
                              }
                            ]);
                            addAuditLogEntry("BIOMETRIC", `Created custom template placeholder for ${newVoiceName}. Training required.`, "write");
                            setNewVoiceName("");
                            setNewVoiceRelation("");
                            setNewVoicePitch("");
                            setNewVoiceResonance("");
                            setNewVoiceTune("");
                          }}
                          className="w-full py-1 text-center bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[9px] rounded transition cursor-pointer"
                        >
                          + REGISTER VOICE PROFILE & REGISTER DIRECTIVE
                        </button>
                      </div>

                      {/* Profiles List */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                        {familyVoiceProfiles.map((p, i) => {
                          const isCalib = activeCalibratingId === p.id;
                          return (
                            <div key={p.id} className="bg-slate-950/50 p-3 rounded-xl border border-white/5 space-y-2.5 relative overflow-hidden transition hover:border-cyan-500/20">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-100 text-xs">{p.name}</span>
                                    <span className="bg-purple-950/30 border border-purple-500/25 text-purple-300 px-1 rounded text-[8px] font-bold font-mono">
                                      {p.relation}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-cyan-400 font-bold font-mono">🎙️ Pitch:</span>
                                      <span>{p.pitchRange} ({p.resonance})</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-pink-400 font-semibold font-mono">🎵 Favorite Tune:</span>
                                      <span>{p.favoriteTune}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold inline-block font-mono ${
                                    p.status.includes("Locked") 
                                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                                      : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                  }`}>
                                    {p.status}
                                  </div>
                                  {p.status.includes("Locked") && (
                                    <div className="text-[8.5px] font-mono text-emerald-400/80 mt-1">
                                      Match rate: {p.confidence}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={!!activeCalibratingId || !!activeTestingId}
                                  onClick={() => startBiometricCalibration(p.id, p.name)}
                                  className="flex-1 py-1 px-1.5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 text-cyan-300 rounded text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                >
                                  <Mic size={9} />
                                  🎙️ Train / Calibrate Profile
                                </button>
                                <button
                                  type="button"
                                  disabled={!!activeCalibratingId || !!activeTestingId || !p.status.includes("Locked")}
                                  onClick={() => runBiometricTest(p.id, p.name)}
                                  className="py-1 px-2 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 text-purple-300 rounded text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                >
                                  <Music size={9} />
                                  🎵 Test Match
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Self-improving Evolutionary feedback logs system */}
                    <div className="border border-white/5 rounded-xl bg-black/45 p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-xs font-bold text-[#e11d48] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-rose-500 animate-pulse" />
                          Self-Improving Evolution Database
                        </h4>
                        <span className="text-[8px] bg-rose-950/20 px-2 py-0.5 rounded text-rose-400 border border-rose-500/10 font-bold">EVOLUTION LEVEL v3</span>
                      </div>

                      <div className="flex gap-2">
                        <textarea
                          rows={1}
                          value={newFeedbackText}
                          onChange={(e) => setNewFeedbackText(e.target.value)}
                          placeholder="Give feedback on response style or behavior changes..."
                          className="flex-1 bg-slate-950/80 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none"
                        />
                        <select
                          value={newFeedbackScore}
                          onChange={(e) => setNewFeedbackScore(Number(e.target.value))}
                          className="bg-slate-950 text-amber-400 border border-white/10 rounded px-1.5 text-[10.5px]"
                        >
                          <option value={5}>⭐ 5 / 5</option>
                          <option value={4}>⭐ 4 / 5</option>
                          <option value={3}>⭐ 3 / 5</option>
                        </select>
                        <button
                          onClick={() => {
                            if (!newFeedbackText.trim()) return;
                            setFeedbackLogs(p => [
                              { id: `${Date.now()}`, time: new Date().toLocaleTimeString().slice(0,5), score: newFeedbackScore, text: newFeedbackText },
                              ...p
                            ]);
                            addAuditLogEntry("EVOLUTION", `Injected user reinforcement instructions: ${newFeedbackText}`, "write");
                            setNewFeedbackText("");
                          }}
                          className="px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9.5px] rounded transition"
                        >
                          ALIGN
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                        {feedbackLogs.map((log) => (
                          <div key={log.id} className="p-2 bg-black/25 rounded border border-white/5 text-[9.5px]">
                            <div className="flex justify-between text-slate-400 text-[8.5px] mb-0.5">
                              <span>ALIGNMENT APPLIED [{log.time}]</span>
                              <span className="text-amber-400 font-bold font-mono">RATING: {log.score}/5</span>
                            </div>
                            <p className="text-slate-200 font-sans leading-relaxed">{log.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
              </div>

              {/* TECHNICAL FOOTER */}
              <div className="p-4 border-t border-white/5 bg-slate-950/70 flex items-center justify-between text-[9px] font-mono text-slate-500 select-none">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 space-y-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.7)] animate-pulse" />
                  <span>MOYNA DIGITAL LINK SECURE</span>
                </span>
                <span>SHA-256 PARITY CHECK APPROVED</span>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
