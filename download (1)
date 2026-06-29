import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  FileText, 
  Check, 
  Loader2, 
  LogOut, 
  ExternalLink, 
  Lock, 
  RefreshCw, 
  FileSpreadsheet, 
  FolderOpen, 
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  CloudUpload,
  Minimize2,
  Maximize2,
  GripHorizontal,
  HelpCircle,
  Settings
} from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { Memory } from "../lib/memoryTypes";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

interface DriveExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onConnect: (token: string) => void;
  onDisconnect: () => void;
  onAddThoughtLog: (type: string, message: string) => void;
  memories: Memory[];
  thoughtLogs: Array<{ id: string; time: string; type: string; message: string }>;
}

export const DriveExplorer: React.FC<DriveExplorerProps> = ({
  isOpen,
  onClose,
  accessToken,
  onConnect,
  onDisconnect,
  onAddThoughtLog,
  memories,
  thoughtLogs
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showHelpPrompt, setShowHelpPrompt] = useState<boolean>(true);

  // Auto-backup configuration states
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem("moyna_drive_auto_sync") !== "false"; 
  });
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return localStorage.getItem("moyna_drive_last_sync_time");
  });

  // Minimize state
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Automatically fetch listed files on mount/search query change if connected
  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles();
    }
  }, [accessToken, searchQuery]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Add secure scopes for file read/write and metadata tracking
      googleProvider.addScope("https://www.googleapis.com/auth/drive.file");
      googleProvider.addScope("https://www.googleapis.com/auth/drive.readonly");
      googleProvider.addScope("https://www.googleapis.com/auth/drive.metadata.readonly");

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        onConnect(credential.accessToken);
        onAddThoughtLog("SYSTEM", "Initialized secure isolated personal Google Drive folder workspace.");
        setShowHelpPrompt(false);
      } else {
        throw new Error("Unable to extract Google Drive credentials.");
      }
    } catch (err: any) {
      console.error("Drive connection failed:", err);
      setError(err?.message || "Failed to authorize Google Drive.");
      onAddThoughtLog("ERROR", "Google Drive authentication aborted or failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchDriveFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const q = searchQuery 
        ? `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`
        : "trashed = false";
      
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&q=${encodeURIComponent(q)}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Google Drive requests were rejected. Your session may have expired.");
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error("Failed to query files:", err);
      setError(err.message || "Could not retrieve Drive files.");
    } finally {
      setLoading(false);
    }
  };

  const syncDataToDrive = async (isManual = false) => {
    if (!accessToken) return;
    setSyncStatus("syncing");
    try {
      // PART 1: Sync System memories (Moyna_System_Memories.json)
      let memoriesFileId = "";
      const searchMemoriesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name = 'Moyna_System_Memories.json' and trashed = false")}&fields=files(id)`;
      const searchRes = await fetch(searchMemoriesUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          memoriesFileId = searchData.files[0].id;
        }
      }

      if (!memoriesFileId) {
        const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "Moyna_System_Memories.json",
            mimeType: "application/json"
          })
        });
        if (!createRes.ok) throw new Error("Could not initialize memories file container.");
        const createData = await createRes.json();
        memoriesFileId = createData.id;
      }

      const uploadMemoriesRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${memoriesFileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(memories, null, 2)
      });
      if (!uploadMemoriesRes.ok) throw new Error("Failed to write Memories data payload.");

      // PART 2: Sync Logs/Conversations (Moyna_Companion_Logs.txt)
      let logsFileId = "";
      const searchLogsUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name = 'Moyna_Companion_Logs.txt' and trashed = false")}&fields=files(id)`;
      const searchLogsRes = await fetch(searchLogsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (searchLogsRes.ok) {
        const searchLogsData = await searchLogsRes.json();
        if (searchLogsData.files && searchLogsData.files.length > 0) {
          logsFileId = searchLogsData.files[0].id;
        }
      }

      if (!logsFileId) {
        const createLogsRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "Moyna_Companion_Logs.txt",
            mimeType: "text/plain"
          })
        });
        if (!createLogsRes.ok) throw new Error("Could not initialize talks log container.");
        const createLogsData = await createLogsRes.json();
        logsFileId = createLogsData.id;
      }

      const logsPlain = thoughtLogs
        .slice()
        .reverse()
        .map(tl => `[${tl.time}] [${tl.type}] ${tl.message}`)
        .join("\n");

      const uploadLogsRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${logsFileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        },
        body: logsPlain
      });
      if (!uploadLogsRes.ok) throw new Error("Failed to write Talking History payload.");

      const now = new Date().toLocaleTimeString();
      setLastSyncedTime(now);
      localStorage.setItem("moyna_drive_last_sync_time", now);
      setSyncStatus("success");
      
      if (isManual) {
        onAddThoughtLog("SYSTEM", "Auto-saved talking logs & system memories into secure file: Moyna_System_Memories.json");
      }
      fetchDriveFiles();
    } catch (err: any) {
      console.error("Backup Sync Error:", err);
      setSyncStatus("error");
      setError(err?.message || "Synchronized backup routine failed.");
    }
  };

  useEffect(() => {
    if (accessToken && autoSync) {
      const timer = setTimeout(() => {
        syncDataToDrive(false);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [memories, thoughtLogs.length, accessToken, autoSync]);

  const toggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem("moyna_drive_auto_sync", checked ? "true" : "false");
    if (checked) {
      onAddThoughtLog("SYSTEM", "Auto-Sync to Google Drive activated.");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <FolderOpen className="text-amber-400" size={13} />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) {
      return <FileSpreadsheet className="text-emerald-400" size={13} />;
    }
    return <FileText className="text-cyan-400" size={13} />;
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return "";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? "auto" : "auto",
        width: isMinimized ? "280px" : "410px"
      }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className="fixed bottom-24 right-5 z-[160] pointer-events-auto bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col gap-3 font-mono text-left text-white select-none transition-all duration-300 ease-out"
    >
      {/* OS Style Draggable Window Controls Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-grab active:cursor-grabbing">
        {/* Decorative dots simulating window controllers */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Red: Close */}
          <button 
            type="button" 
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 border border-rose-600/50 flex items-center justify-center text-[7px] text-rose-950 font-bold transition group duration-200"
            title="Close Explorer"
          >
            <span className="opacity-0 group-hover:opacity-100">×</span>
          </button>
          
          {/* Yellow: Minimize toggler */}
          <button 
            type="button" 
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 border border-amber-600/50 flex items-center justify-center text-[7px] text-amber-950 font-bold transition group duration-200"
            title={isMinimized ? "Expand" : "Collapse"}
          >
            <span className="opacity-0 group-hover:opacity-100 flex items-center justify-center">-</span>
          </button>

          {/* Green: Drag Grip */}
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/30 flex items-center justify-center" title="Draggable Window">
            <GripHorizontal size={7} className="text-emerald-950 opacity-40 animate-pulse" />
          </div>

          <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase ml-1.5 flex items-center gap-1">
            {isMinimized ? "Moyna Drive HUD" : "Moyna Sync Core"}
            <Sparkles size={8} className="text-cyan-300 animate-pulse shrink-0" />
          </span>
        </div>

        {/* Small toggler actions */}
        {!isMinimized && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHelpPrompt(!showHelpPrompt)}
              className={`p-1 rounded transition duration-150 cursor-pointer ${showHelpPrompt ? "text-cyan-300 bg-cyan-950/40" : "text-slate-500 hover:text-slate-300"}`}
              title="Authentication Help & Bypassing warning screen"
            >
              <HelpCircle size={11} />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded text-slate-500 hover:text-white transition"
              title="Minimize HUD"
            >
              <Minimize2 size={11} />
            </button>
          </div>
        )}

        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded text-cyan-400 hover:bg-white/5 transition flex items-center"
            title="Restore Windows View"
          >
            <Maximize2 size={11} />
          </button>
        )}
      </div>

      {/* MINIMIZED STATE CONTENT */}
      {isMinimized ? (
        <div className="flex flex-col gap-2 pt-1 font-mono">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-slate-400">Connection:</span>
            {accessToken ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                CONNECTED
              </span>
            ) : (
              <span className="text-rose-400 font-bold">LOCKED</span>
            )}
          </div>
          
          {accessToken && (
            <div className="flex items-center justify-between text-[8px] bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-1.5">
              <span className="text-cyan-200 select-none">AUTO-SYNC ENGINE</span>
              <span className="text-emerald-400 font-bold text-[7px] uppercase">
                {syncStatus === "syncing" ? "SAVINGPAYLOAD..." : "STABILIZED"}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="w-full text-center py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[8px] font-bold uppercase rounded hover:bg-cyan-500/20 transition cursor-pointer"
          >
            Open Dashboard View
          </button>
        </div>
      ) : (
        /* STANDARD FULL VIEW DISPLAY */
        <div className="flex flex-col gap-3 flex-1">
          
          {/* Detailed user education box: Bypassing Unverified App Warning Screen */}
          <AnimatePresence>
            {showHelpPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3 text-[9px] text-cyan-200 leading-normal relative overflow-hidden"
              >
                <button 
                  onClick={() => setShowHelpPrompt(false)}
                  className="absolute right-2 top-2 text-cyan-500 hover:text-cyan-300 cursor-pointer"
                  title="Close instructions"
                >
                  <X size={10} />
                </button>
                <div className="flex items-start gap-2 pr-4 select-text">
                  <HelpCircle size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-cyan-300">Google Warning আসলে যা করবেন:</p>
                    <p>
                      আমাদের এই প্রজেক্টটি এখনও ভেরিফিকেশন ড্রাফট পর্যায়ে রয়েছে। ড্রাইভ কানেক্ট করার সময় <span className="text-amber-400 font-bold">&quot;Google hasn&apos;t verified this app&quot;</span> স্ক্রিনটি আসলে:
                    </p>
                    <ol className="list-decimal pl-4.5 space-y-1 mt-1 text-slate-300">
                      <li>পপ-আপ উইন্ডোর বাম পাশে থাকা <span className="text-cyan-400 font-bold underline cursor-pointer">Advanced</span> লেখাতে ক্লিক করুন।</li>
                      <li>এরপর নিচে চলে আসা <span className="text-rose-400 font-bold">&quot;Go to atozonlineshop8@gmail.com (unsafe)&quot;</span> লিংকে ক্লিক করে এক্সেস দিতে এগিয়ে যান।</li>
                    </ol>
                    <p className="text-slate-400 text-[8px] mt-1.5 italic">
                      এটি সম্পূর্ণ সুরক্ষিত এবং আপনার ডেটা কেবল আপনার নিজস্ব ড্রাইভে সেভ হবে।
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Checker */}
          {!accessToken ? (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Lock size={22} className="text-cyan-400" />
              </div>
              <div className="pointer-events-none">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Connect Google Drive Workspace</h4>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal max-w-[310px]">
                  আপনার কথা বলার ইতিহাস (Talking History) এবং সিস্টেমে রেকর্ড হওয়া মেমোরি ডাটা সরাসরি আপনার নিজের পার্সোনাল ড্রাইভ-এ ফাইল আকারে সেভ করে রাখুন।
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleConnect}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest py-2.5 px-5 rounded-xl border border-cyan-400/30 shadow-[0_4px_12px_rgba(6,182,212,0.15)] cursor-pointer transition-all duration-150 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-white" />
                      <span>AUTHORIZING IN PROGRESS...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload size={12} />
                      <span>CONNECT SECURELY WITH GOOGLE</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setShowHelpPrompt(!showHelpPrompt)}
                  className="text-[8px] text-cyan-400 hover:underline flex items-center justify-center gap-1"
                >
                  Need help bypassing verification screens? Click here
                </button>
              </div>
              
              {error && (
                <p className="text-[8px] text-rose-400 bg-rose-500/10 py-1.5 px-3 rounded-lg border border-rose-500/20 flex items-center gap-1.5 leading-snug select-text">
                  <AlertCircle size={10} className="shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              
              {/* Connected Active Status Bar */}
              <div className="flex items-center justify-between text-[8px] bg-cyan-950/20 border border-cyan-500/15 rounded-xl p-2.5 font-bold tracking-wider text-cyan-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>DRIVE CONNECTED (SECURE CLOUD ENGINE ACTIVE)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onDisconnect();
                    onAddThoughtLog("SYSTEM", "Cleared secure client Google Drive access token.");
                  }}
                  className="text-slate-400 hover:text-rose-400 transition cursor-pointer flex items-center gap-1.5"
                  title="Disconnect Drive"
                >
                  <LogOut size={10} />
                  <span>DISCONNECT</span>
                </button>
              </div>

              {/* Integrated Cloud Backup Panel */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 select-text">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Database size={12} className="text-cyan-400 shrink-0 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-wider text-slate-300">CLOUDSAVE SYNC STATUS</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => toggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-cyan-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-950/50 peer-checked:border peer-checked:border-cyan-500/20" />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-1 text-[8px] text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">MONITORING</span>
                    <span className="font-bold flex items-center gap-1 mt-0.5 select-none">
                      {syncStatus === "syncing" && (
                        <span className="text-cyan-400 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" /> WRITING Payload...
                        </span>
                      )}
                      {syncStatus === "success" && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check size={10} /> FILES UPDATED & SECURE
                        </span>
                      )}
                      {syncStatus === "error" && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertCircle size={10} /> TRANSACTION BLOCKED
                        </span>
                      )}
                      {syncStatus === "idle" && (
                        <span className="text-slate-400">SYNC IDLE (STABLE)</span>
                      )}
                    </span>
                  </div>

                  {lastSyncedTime && (
                    <div className="text-right flex flex-col">
                      <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">LAST TRANSACTION</span>
                      <span className="font-mono text-[8px] text-slate-300 mt-0.5">{lastSyncedTime}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={syncStatus === "syncing"}
                    onClick={() => syncDataToDrive(true)}
                    className="flex items-center gap-1 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-[8px] px-2.5 py-1 rounded-lg font-bold uppercase transition"
                  >
                    <CloudUpload size={10} />
                    <span>SAVE PAYLOAD</span>
                  </button>
                </div>
              </div>

              {/* Input details header and filter */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={12} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 focus:border-cyan-500/30 rounded-xl py-2 pl-8 pr-3 text-[10px] font-mono text-white placeholder-slate-500 focus:outline-none transition-colors"
                  placeholder="Filter or Search files inside Drive..."
                />
                {loading && (
                  <RefreshCw size={11} className="absolute right-3 top-2.5 animate-spin text-cyan-400" />
                )}
              </div>

              {/* Sandbox Google Files Workspace Browser */}
              <div className="flex-1 max-h-[150px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 select-text">
                {files.length > 0 ? (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-slate-900/30 hover:bg-slate-900/70 border border-white/10 rounded-xl p-2 group transition duration-150"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-200 truncate font-mono select-all" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[8px] text-slate-500 mt-0.5 select-none font-mono">
                            <span>{formatSize(file.size) || "Backup Item"}</span>
                            <span>•</span>
                            <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ""}</span>
                          </div>
                        </div>
                      </div>

                      {/* File item view actions */}
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition duration-150 pl-2">
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="Open file path directly on separate tab"
                        >
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center select-none">
                    <FileText size={16} className="text-slate-700 mb-1" />
                    <p className="text-[9px] uppercase tracking-wider font-bold">No Files Discovered</p>
                    <p className="text-[8px] text-slate-600 mt-0.5 leading-normal">
                      {searchQuery ? "No matches in your Google Drive." : "Files created will appear here instantly."}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-[8px] text-rose-400 bg-rose-500/10 py-1.5 px-3 rounded-lg border border-rose-500/20 flex items-center gap-1.5 leading-snug select-text">
                  <AlertCircle size={10} className="shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
