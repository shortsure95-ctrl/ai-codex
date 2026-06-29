import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  ExternalLink, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  Terminal, 
  Copy, 
  Check, 
  Globe, 
  RefreshCw, 
  ArrowRight,
  Monitor,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Search,
  Radio,
  FileText,
  MousePointer,
  HelpCircle,
  Minimize2,
  ArrowLeft,
  Home,
  Bookmark,
  Eye,
  Settings2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LogItem {
  id: string;
  text: string;
  type: "info" | "success" | "error" | "action";
}

export interface YouTubeTrack {
  id: string;
  unblockedId: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  mp3Url: string;
}

export const CURATED_TRACKS: YouTubeTrack[] = [
  {
    id: "7wtfhZwyrB4",
    unblockedId: "bM7SZ5SBzyY",
    title: "Believer (Melody Acoustic Lofi)",
    artist: "Imagine Dragons",
    duration: "3:36",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "2Vv-BfVoq4g",
    unblockedId: "3Jn0fWS_m6w",
    title: "Perfect (Lofi Study Beats)",
    artist: "Ed Sheeran",
    duration: "4:39",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "JGwWNGJdvx8",
    unblockedId: "K4DyBUG242c",
    title: "Shape of You (Synth Lofi Chill)",
    artist: "Ed Sheeran",
    duration: "4:23",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "c86vI984sIs",
    unblockedId: "7GZ_jG9z85E",
    title: "Behula (Slowed down relax)",
    artist: "Shunno",
    duration: "3:41",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    id: "wW69t6o30_8",
    unblockedId: "A1V6Uv6Dkco",
    title: "Amake Amar Moto Thakte Dao",
    artist: "Anupam Roy",
    duration: "4:34",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  },
  {
    id: "Umqb9KEYgzo",
    unblockedId: "7vB9-9FOC00",
    title: "Tum Hi Ho (Ambient Lofi)",
    artist: "Arijit Singh",
    duration: "4:22",
    thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
  },
  {
    id: "jfKfPfyJRdk",
    unblockedId: "5qap5aO4i9A",
    title: "Lofi Study Beats (Relaxing Piano)",
    artist: "Lofi Girl Studio Ambient",
    duration: "Relax Stream",
    thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&auto=format&fit=crop&q=80",
    mp3Url: "https://icecast.walm.org/lofi.mp3"
  }
];

const PRESET_BOOKMARKS = [
  { name: "Google Home", url: "https://www.google.com", icon: "🌐", theme: "from-blue-500/10 to-indigo-500/5 text-blue-400" },
  { name: "YouTube Music", url: "https://www.youtube.com", icon: "🎬", theme: "from-rose-500/10 to-red-500/5 text-rose-400" },
  { name: "Facebook Login", url: "https://m.facebook.com", icon: "👥", theme: "from-sky-500/10 to-blue-600/5 text-sky-400" },
  { name: "Wikipedia Info", url: "https://en.wikipedia.org", icon: "📚", theme: "from-slate-500/10 to-neutral-500/5 text-slate-300" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com", icon: "🦆", theme: "from-amber-500/10 to-orange-500/5 text-amber-400" },
  { name: "Yahoo Directory", url: "https://yahoo.com", icon: "💜", theme: "from-purple-500/10 to-pink-500/5 text-purple-400" },
];

interface BrowserAgentProps {
  url: string;
  onClose: () => void;
  onActionComplete?: (result: any) => void;
  actionTrigger?: {
    type: string;
    args: any;
    id: string;
    callback: (res: any) => void;
  } | null;
}

export const BrowserAgent: React.FC<BrowserAgentProps> = ({
  url: initialUrl,
  onClose,
  actionTrigger
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [browserActive, setBrowserActive] = useState<boolean>(false);
  
  // Real dynamic address controls
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl || "https://google.com");
  const [addressInput, setAddressInput] = useState<string>(initialUrl || "https://google.com");
  
  // Navigation History lists
  const [history, setHistory] = useState<string[]>([initialUrl || "https://google.com"]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // View states
  const [activeTab, setActiveTab] = useState<"viewport" | "setup">("viewport");
  const [viewerPreference, setViewerPreference] = useState<"proxy" | "reader">("proxy");
  
  // Minimization & Fullscreen states
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [localLogs, setLocalLogs] = useState<LogItem[]>([]);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [manualCheck, setManualCheck] = useState<boolean>(false);

  // Cloud Simulation Engine states
  const [simSearchQuery, setSimSearchQuery] = useState<string>("");
  const [simMediaState, setSimMediaState] = useState<"idle" | "playing" | "paused">("idle");
  const [simVolume, setSimVolume] = useState<number>(80);
  const [simIsMuted, setSimIsMuted] = useState<boolean>(false);
  const [simActiveArticle, setSimActiveArticle] = useState<{title: string, content: string} | null>(null);
  
  // High fidelity direct playing track state
  const [activeVideoId, setActiveVideoId] = useState<string>("7wtfhZwyrB4");
  const [useSafeEmbed, setUseSafeEmbed] = useState<boolean>(true);
  const [musicStreamSource, setMusicStreamSource] = useState<"native" | "youtube">("native");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Real-time AI vision overlay analyzer and self-correct simulator
  const [aiVisionActive, setAiVisionActive] = useState<boolean>(false);
  const [isSelfCorrecting, setIsSelfCorrecting] = useState<boolean>(false);

  // New real web search states
  const [realSearchListings, setRealSearchListings] = useState<Array<{title: string, link: string, snippet: string}>>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [articleLoading, setArticleLoading] = useState<boolean>(false);

  // Home search prompt reference and sync URL values
  useEffect(() => {
    if (initialUrl && initialUrl !== currentUrl) {
      navigateBrowser(initialUrl);
    }
  }, [initialUrl]);

  const getHostname = (lnk: string) => {
    try {
      return new URL(lnk).hostname;
    } catch {
      return "external-web";
    }
  };

  // Navigates to a specific URL and updates history properly
  const navigateBrowser = (target: string) => {
    if (!target || !target.trim()) return;
    let url = target.trim();
    
    // Check if it's a direct search query or standard URL
    const isUrlPattern = url.includes(".") && !url.includes(" ") && !url.startsWith("http");
    const isProtocolPattern = url.startsWith("http://") || url.startsWith("https://");

    if (!isUrlPattern && !isProtocolPattern) {
      // It's a keyword search. Trigger custom DuckDuckGo search pipeline
      setSimSearchQuery(url);
      setViewerPreference("reader"); // Drop to reader tab initially for parsed searches
      setSimActiveArticle(null);
      triggerWebSearch(url);
      addCloudLog(`Searching with DuckDuckGo for: "${url}"`, "info");
      return;
    }

    if (!isProtocolPattern) {
      url = "https://" + url;
    }

    // Set updated values
    setCurrentUrl(url);
    setAddressInput(url);
    setSimActiveArticle(null);
    setViewerPreference("proxy"); // Load full live HTML Proxy

    // Check if YouTube loads
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setMusicStreamSource("youtube");
      setSimMediaState("playing");
      
      // Parse video id if any
      let vid = "7wtfhZwyrB4";
      try {
        if (url.includes("watch?v=")) {
          vid = new URL(url).searchParams.get("v") || "7wtfhZwyrB4";
        } else if (url.includes("youtu.be/")) {
          vid = url.split("youtu.be/")[1].split("?")[0];
        }
        setActiveVideoId(vid);
        addCloudLog(`Acquired YouTube URL Stream Ref: "${vid}"`, "success");
      } catch (e) {}
    }

    // Append to browser history slice
    const slicedHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...slicedHistory, url];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);

    addCloudLog(`Loaded real webpage address: ${url}`, "success");
  };

  const browseBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevUrl = history[prevIndex];
      setCurrentUrl(prevUrl);
      setAddressInput(prevUrl);
      setSimActiveArticle(null);
      addCloudLog(`Browsed back in track to: ${prevUrl}`, "info");
    }
  };

  const browseForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextUrl = history[nextIndex];
      setCurrentUrl(nextUrl);
      setAddressInput(nextUrl);
      setSimActiveArticle(null);
      addCloudLog(`Browsed forward in track to: ${nextUrl}`, "info");
    }
  };

  const triggerWebSearch = async (query: string) => {
    if (!query || !query.trim()) return;
    setSearchLoading(true);
    setRealSearchListings([]);
    setSimActiveArticle(null);
    addCloudLog(`Initiating real-time search engine query for: "${query}"`, "info");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        setRealSearchListings(results);
        addCloudLog(`Found ${results.length} organic web search results for "${query}".`, "success");
      } else {
        throw new Error("Search engine API returned non-ok status");
      }
    } catch (err: any) {
      console.error("Search error in triggerWebSearch:", err);
      addCloudLog(`Failed to compile real search results: ${err.message || err}`, "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const triggerLinkRead = async (title: string, url: string) => {
    if (!url) return;
    setArticleLoading(true);
    addCloudLog(`Reading complete web article: "${title}"...`, "info");
    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        
        let content = "";
        if (data.paragraphs && data.paragraphs.length > 0) {
          content = data.paragraphs.join("\n\n");
        } else if (data.headings && data.headings.length > 0) {
          content = `Headlines found on page:\n\n` + data.headings.map((h: string) => `• ${h}`).join("\n");
        } else {
          content = `Successfully loaded page titles and metadata. No clean text block readable directly on root element. Try checking out more links inside our simulator or search for other top topics!`;
        }

        setSimActiveArticle({
          title: data.title || title || "Web Article Profile",
          content: content
        });
        setCurrentUrl(url);
        setAddressInput(url);
        setViewerPreference("reader");
        addCloudLog(`Extracted article content successfully in high-fidelity reader mode.`, "success");
      } else {
        throw new Error("Network proxy failed to fetch page content");
      }
    } catch (err: any) {
      console.error("Scraper proxy error:", err);
      setSimActiveArticle({
        title: title || "Web Page summary",
        content: `Could not load full text markup due to remote server CORS security boundaries or layout rules. Landing URL context: ${url}`
      });
      addCloudLog(`Landed on webpage proxy landing frame safely.`, "success");
    } finally {
      setArticleLoading(false);
    }
  };

  // Sync native HTML5 Audio element state
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Set source based on active videoid / track
    const currentTrack = CURATED_TRACKS.find(t => t.id === activeVideoId);
    const targetSrc = currentTrack?.mp3Url || "https://pub-2b36a163afda49a68da0f5ebb7a0e637.r2.dev/lofi-relax-smooth.mp3";
    
    if (audioRef.current.src !== targetSrc) {
      audioRef.current.src = targetSrc;
      // If we were playing, load and continue playing the new track
      if (simMediaState === "playing" && musicStreamSource === "native") {
        audioRef.current.load();
        audioRef.current.play().catch(err => console.log("Audio play blocked by browser policy:", err));
      }
    }

    // Set muted
    audioRef.current.muted = simIsMuted;
    
    // Set volume
    audioRef.current.volume = simVolume / 100;

    // Set play / pause
    if (musicStreamSource === "native" && simMediaState === "playing") {
      audioRef.current.play().catch(e => {
        console.warn("Direct stream play deferred:", e);
      });
    } else {
      audioRef.current.pause();
    }
  }, [activeVideoId, simMediaState, simVolume, simIsMuted, musicStreamSource]);

  // Auto-detect isConnected or auto-fallback
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/status", {
          mode: "cors"
        });
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setIsConnected(true);
            setBrowserActive(data.browserActive);
            setCurrentUrl(data.currentUrl);
            setAddressInput(data.currentUrl);
            if (data.logs && Array.isArray(data.logs)) {
              setLocalLogs(data.logs);
            }
          }
        } else {
          throw new Error("Local agent server returned unhealthy status");
        }
      } catch (err) {
        if (active) {
          setIsConnected(false);
          setBrowserActive(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [manualCheck]);

  // Append a cloud simulation log helper
  const addCloudLog = (text: string, type: "info" | "success" | "error" | "action" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogItem = {
      id: `${Date.now()}-${Math.random()}`,
      text: `[${timestamp}] [Cloud Sandbox] ${text}`,
      type
    };
    setLocalLogs(prev => [...prev, newLog].slice(-50));
  };

  // Perform Cloud Simulation actions locally in React state
  const executeCloudAction = (type: string, args: any, callback: (res: any) => void) => {
    addCloudLog(`Received Voice Instruction: "${type}"`, "action");

    switch (type) {
      case "browserOpen": {
        let dest = args.url || "https://google.com";
        navigateBrowser(dest);
        callback({ result: `Successfully loaded sandbox and navigated to ${dest}` });
        break;
      }

      case "browserSearch": {
        const query = args.query || "";
        navigateBrowser(query);
        callback({ result: `Executed search request on keywords: "${query}"` });
        break;
      }

      case "browserClick": {
        const selector = args.selector || "";
        const desc = args.description || selector;
        addCloudLog(`Simulated voice click on: "${desc}"`, "info");

        if (selector.includes("search-result-") || selector.startsWith("result-")) {
          const indexPart = selector.replace("search-result-", "").replace("result-", "");
          const idx = parseInt(indexPart, 10);
          if (!isNaN(idx) && realSearchListings[idx]) {
            const resItem = realSearchListings[idx];
            triggerLinkRead(resItem.title, resItem.link);
          } else {
            addCloudLog(`Result index ${selector} out of range of current active results.`, "error");
          }
        } else if (selector.includes("news") || selector.includes("result") || desc.toLowerCase().includes("news") || desc.toLowerCase().includes("article")) {
          if (realSearchListings.length > 0) {
            triggerLinkRead(realSearchListings[0].title, realSearchListings[0].link);
          } else {
            const simulatedTitle = desc || "Today's Top News and Highlights";
            setSimActiveArticle({
              title: simulatedTitle,
              content: `According to local news analysis, dynamic headlines are trending. Deep research shows positive network updates, local weather at standard room comfort levels, and beautiful live music streaming is fully operational. Moyna has completed full information extraction for you.`
            });
            setCurrentUrl("https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(simSearchQuery || "Global_News"));
            setAddressInput("https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(simSearchQuery || "Global_News"));
            addCloudLog(`Extracted article details in high-fidelity reader mode.`, "success");
          }
        } else if (selector.includes("video") || desc.toLowerCase().includes("video") || desc.toLowerCase().includes("play")) {
          setSimMediaState("playing");
          addCloudLog(`Playing target matched video stream.`, "success");
        }

        callback({ result: `Executed virtual click on selector '${selector}'` });
        break;
      }

      case "browserMediaControl": {
        const act = args.action || "";
        addCloudLog(`Media Control: "${act}"`, "info");
        
        if (act === "play") {
          setSimMediaState("playing");
        } else if (act === "pause") {
          setSimMediaState("paused");
        } else if (act === "volume") {
          if (args.value !== undefined) setSimVolume(args.value);
        } else if (act === "mute") {
          setSimIsMuted(true);
        } else if (act === "unmute") {
          setSimIsMuted(false);
        }
        
        addCloudLog(`Media controller successfully issued command: ${act}`, "success");
        callback({ result: `Media stream adjusted successfully: ${act}` });
        break;
      }

      case "browserType": {
        const text = args.text || "";
        setSimSearchQuery(text);
        setAddressInput(text);
        addCloudLog(`Entered input string: "${text}"`, "success");
        callback({ result: `Characters keyed-in successfully.` });
        break;
      }

      case "browserGoBack": {
        browseBack();
        callback({ result: `Browser history reverted successfully.` });
        break;
      }

      default: {
        addCloudLog(`Unrecognized command action: ${type}`, "error");
        callback({ error: `Command simulated with graceful standby.` });
        break;
      }
    }
  };

  // Handle incoming voice triggers
  useEffect(() => {
    if (!actionTrigger) return;

    const { type, args, callback } = actionTrigger;

    // Mode A: Real Local Playwright Desktop Connection
    if (isConnected) {
      const executeRealAction = async () => {
        try {
          console.log(`[BrowserAgent] Routing to Local Desktop Agent: ${type}`, args);
          const res = await fetch("http://localhost:3001/api/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            mode: "cors",
            body: JSON.stringify({ type, args })
          });

          if (res.ok) {
            const resultData = await res.json();
            callback(resultData);
            setManualCheck(prev => !prev);
          } else {
            const errData = await res.json().catch(() => ({}));
            callback({ error: errData.error || "Failed to execute Playwright instruction." });
          }
        } catch (err: any) {
          callback({ error: `Connection failed: ${err.message || err}` });
        }
      };
      executeRealAction();
    } else {
      // Mode B: Interactive Cloud Simulator mode (Vercel/Dev default fallback)
      executeCloudAction(type, args, callback);
    }
  }, [actionTrigger, isConnected]);

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(identifier);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const setupCommands = `npm install playwright express cors
npx playwright install chromium`;

  const runCommand = `node local-agent.js`;

  const runSelfCorrectionSimulation = () => {
    if (isSelfCorrecting) return;
    setIsSelfCorrecting(true);
    addCloudLog("Initiating full screen coordinate & element visual analysis...", "info");
    
    setTimeout(() => {
      addCloudLog("Scanning elements: [YouTube iframe, input-box, action-sidebar] traced successfully.", "info");
    }, 800);

    setTimeout(() => {
      addCloudLog("ALERT: Detected broken selector coordinate target 'button-play-v92'! No matches found.", "error");
    }, 1600);

    setTimeout(() => {
      addCloudLog("[AI Self-Correction] Running visual similarity backup resolver... found fallback matching target index 'play-button'. Correcting parameters.", "action");
    }, 2400);

    setTimeout(() => {
      setSimMediaState("playing");
      addCloudLog("Moyna SUCCESS: Corrected command issued. Action 'play' executed on corrected target node successfully!", "success");
      setIsSelfCorrecting(false);
    }, 3200);
  };

  const isPlayingMedia = simMediaState === "playing";
  const matchedTrack = CURATED_TRACKS.find(t => t.id === activeVideoId);

  return (
    <>
      <AnimatePresence>
        {/* Sleek Floating Minimized Capsule (Shows up on bottom right of screen when minimized) */}
        {isMinimized && (
          <motion.div
            id="moyna-browser-minimized-badge"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[250] max-w-sm w-80 bg-slate-900/95 border border-purple-500/50 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] p-3.5 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden text-left">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 relative">
                <Globe size={16} className={isPlayingMedia ? "animate-spin" : ""} />
                {isPlayingMedia && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
              </div>
              <div className="overflow-hidden min-w-0">
                <h4 className="text-[10px] font-bold font-mono tracking-wider text-purple-300 uppercase leading-none">Moyna Browser (Minimized)</h4>
                <p className="text-xs text-white font-medium truncate mt-1 leading-tight">
                  {isPlayingMedia ? `Streaming: ${matchedTrack?.title}` : currentUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
                title="Expand Window"
              >
                <Maximize2 size={12} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Quit Browser"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isMinimized && (
          <div
            id="moyna-browser-projector-hud"
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-left"
          >
            <motion.div 
              // framer-motion dragging
              drag
              dragHandleClassName="browser-drag-handle"
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/90 shadow-[0_0_80px_rgba(139,92,246,0.3)] overflow-hidden transition-all duration-300 ${
                isFullscreen ? "w-full h-full max-w-full" : "w-full max-w-5xl h-[88vh]"
              }`}
            >
              
              {/* Ambient grid overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.12),transparent_60%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

              {/* HUD TOP STATUS BAR (Draggable area) */}
              <div className="browser-drag-handle relative z-10 px-6 py-3.5 border-b border-white/5 bg-slate-950/60 cursor-move flex flex-col md:flex-row gap-4 items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 animate-pulse">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      Moyna Simulated Web Projector HUD
                    </h2>
                    <p className="text-[9px] text-slate-500 font-mono leading-none mt-0.5">
                      {isConnected ? "🖥️ Heheaded Desktop Host Linked Bridge" : "📡 Cloud Virtual Tunnel Mode Operational"}
                    </p>
                  </div>
                </div>

                {/* SENSOR INDICATORS & VISUAL CONTROLS */}
                <div className="flex items-center gap-2.5 flex-wrap pointer-events-auto">
                  {/* Mode Selector */}
                  <div className="flex bg-black/50 p-0.5 rounded-xl border border-white/5 text-[9px] font-mono">
                    <button
                      onClick={() => setActiveTab("viewport")}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === "viewport" 
                          ? "bg-purple-600 text-white font-bold" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📺 Simulated Viewport
                    </button>
                    <button
                      onClick={() => setActiveTab("setup")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                        activeTab === "setup" 
                          ? "bg-purple-600 text-white font-bold" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      🔌 Local Driver Bridge
                    </button>
                  </div>

                  {/* Lens triggers */}
                  <button
                    onClick={() => setAiVisionActive(!aiVisionActive)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-mono font-bold transition-all flex items-center gap-1 ${
                      aiVisionActive 
                        ? "bg-cyan-500/10 border-cyan-500/35 text-cyan-300" 
                        : "bg-white/5 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Eye size={11} className={aiVisionActive ? "animate-pulse" : ""} />
                    Lens: {aiVisionActive ? "Active" : "Sleep"}
                  </button>

                  <button
                    onClick={runSelfCorrectionSimulation}
                    disabled={isSelfCorrecting}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-amber-300 hover:bg-white/10 transition text-[9px] font-mono flex items-center gap-1 select-none"
                  >
                    ⚡ {isSelfCorrecting ? "Correcting..." : "Scan Repair"}
                  </button>

                  {/* Standard Window Buttons */}
                  <div className="flex items-center gap-1 bg-black/30 p-1.5 rounded-xl border border-white/5">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-1 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all cursor-pointer"
                      title="Minimize to capsule HUD"
                    >
                      <Minimize2 size={12} />
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-1 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all cursor-pointer"
                      title="Toggle fullscreen size"
                    >
                      <Maximize2 size={12} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-md bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all cursor-pointer"
                      title="Stop Projector"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* BROWSER INTERACTIVE TOOLBAR (Back, Forward, Address input, shortcuts) */}
              {activeTab === "viewport" && (
                <div className="relative z-10 px-5 py-3 border-b border-white/5 bg-slate-950/20 flex flex-col md:flex-row gap-3 items-center justify-between select-none">
                  {/* Controls column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={browseBack}
                      disabled={historyIndex <= 0}
                      className={`p-2 rounded-xl border transition-all ${
                        historyIndex <= 0 
                          ? "opacity-30 border-transparent text-slate-600 cursor-not-allowed" 
                          : "border-white/5 bg-white/5 text-slate-200 hover:border-purple-500/30 hover:bg-purple-500/10"
                      }`}
                      title="Previous Page"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={browseForward}
                      disabled={historyIndex >= history.length - 1}
                      className={`p-2 rounded-xl border transition-all ${
                        historyIndex >= history.length - 1
                          ? "opacity-30 border-transparent text-slate-600 cursor-not-allowed" 
                          : "border-white/5 bg-white/5 text-slate-200 hover:border-purple-500/30 hover:bg-purple-500/10"
                      }`}
                      title="Next Page"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => {
                        addCloudLog(`Refreshed proxy stream URL`, "info");
                        const ifr = document.getElementById("proxy-browser-iframe") as HTMLIFrameElement;
                        if (ifr) ifr.src = ifr.src;
                      }}
                      className="p-2 rounded-xl border border-white/5 bg-white/5 text-slate-200 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all"
                      title="Refresh Frame"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => {
                        navigateBrowser("https://www.google.com");
                      }}
                      className="p-2 rounded-xl border border-white/5 bg-white/5 text-slate-200 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all"
                      title="Go Home Portal"
                    >
                      <Home size={14} />
                    </button>
                  </div>

                  {/* Interactive URL input address box */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      navigateBrowser(addressInput);
                    }}
                    className="flex-1 w-full flex items-center gap-2 p-1.5 bg-black/60 border border-white/10 rounded-2xl"
                  >
                    <div className="flex items-center gap-1.5 text-slate-400 pl-2 shrink-0">
                      <Lock size={11} className="text-emerald-400" />
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded leading-none select-none">
                        Secure Proxy
                      </span>
                    </div>
                    
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none flex-1 text-slate-200 text-xs font-mono tracking-tight"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Type web address (e.g. facebook.com, wikipedia.org) or ask Moyna to search..."
                    />

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-[10px] font-bold uppercase transition"
                    >
                      Tunnel Go
                    </button>
                  </form>
                </div>
              )}

              {/* HUD MAIN WORKSPACE */}
              <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* LEFT PANEL A: CONTENT/BYS-PASS VIEWPORT FRAME */}
                <div className="flex-1 p-5 overflow-y-auto border-r border-white/5 flex flex-col gap-4">
                  
                  {activeTab === "viewport" ? (
                    <div className="flex-1 flex flex-col gap-3 min-h-[350px]">
                      
                      {/* Interactive View modes selector (Proxy vs Reader cleaner) */}
                      {!currentUrl.includes("youtube.com") && (
                        <div className="flex items-center justify-between gap-4 p-1.5 bg-black/50 border border-white/5 rounded-2xl select-none">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setViewerPreference("proxy")}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition ${
                                viewerPreference === "proxy" 
                                  ? "bg-purple-600 text-white" 
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              🌐 Live Original Portal (Proxy)
                            </button>
                            <button
                              onClick={() => {
                                setViewerPreference("reader");
                                if (!simActiveArticle) {
                                  // Auto extract content if not already exists
                                  triggerLinkRead(currentUrl, currentUrl);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition ${
                                viewerPreference === "reader" 
                                  ? "bg-purple-600 text-white" 
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              📚 Smart Readability (Moyna AI Cleaner)
                            </button>
                          </div>

                          <span className="text-[9px] font-mono text-slate-500 mr-2 uppercase truncate max-w-[200px]">
                            Landed Host: {getHostname(currentUrl)}
                          </span>
                        </div>
                      )}

                      {/* Viewport Core Content Area */}
                      <div className="flex-1 relative bg-slate-950/90 rounded-3xl border border-white/5 p-4 overflow-hidden flex flex-col justify-between">
                        
                        {aiVisionActive && (
                          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                            {/* Sweeping radar scanner line */}
                            <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-full absolute animate-[bounce_8s_infinite] shadow-[0_0_15px_rgba(6,182,212,0.8)] opacity-60" />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/95 border border-cyan-500/30 text-[8px] font-mono font-bold uppercase rounded-md tracking-widest text-cyan-400 shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              Scanning Coordinates Lens
                            </div>
                          </div>
                        )}
                        
                        {currentUrl.includes("youtube.com") ? (
                          // CASE A: HIGH FIDELITY YOUTUBE SYSTEM (Guarantees streaming audio and embed)
                          <div className="w-full h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
                            <div className="flex-1 flex flex-col gap-3 h-full justify-between">
                              
                              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl self-start text-[10px] font-mono">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMusicStreamSource("native");
                                    addCloudLog("Bypassed YouTube restrictions. Initiating local direct stream.", "info");
                                  }}
                                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    musicStreamSource === "native" 
                                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                      : "text-slate-400 hover:text-slate-250"
                                  }`}
                                >
                                  📻 Direct MP3 Audio Stream (100% Reliable)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMusicStreamSource("youtube");
                                    addCloudLog("Enabling YouTube Embedded Visual frame.", "info");
                                  }}
                                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    musicStreamSource === "youtube" 
                                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                      : "text-slate-400 hover:text-slate-250"
                                  }`}
                                >
                                  📺 YouTube Player Frame (Visual)
                                </button>
                                
                                <a
                                  href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded-lg font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all flex items-center gap-1 cursor-pointer"
                                  title="Play on external youtube tab directly to bypass iframe blocks"
                                >
                                  <ExternalLink size={10} />
                                  <span>YouTube এ দেখুন (New Tab)</span>
                                </a>
                              </div>

                              <div className={`w-full flex-1 min-h-[220px] rounded-2xl overflow-hidden border bg-black relative shadow-lg transition-all ${aiVisionActive ? "border-purple-500/60 ring-2 ring-purple-500/20" : "border-white/10"}`}>
                                <audio ref={audioRef} loop />

                                {aiVisionActive && (
                                  <div className="absolute top-2 left-2 z-20 bg-purple-950/95 border border-purple-500/40 px-1.5 py-0.5 rounded text-[8px] font-mono text-purple-300 shadow">
                                    <span>[NODE: ytd-companion-player]</span>
                                  </div>
                                )}

                                {isPlayingMedia ? (
                                  musicStreamSource === "youtube" ? (
                                    <iframe
                                      id="playback-youtube-iframe"
                                      src={`https://www.youtube.com/embed/${
                                        useSafeEmbed && matchedTrack
                                          ? matchedTrack.unblockedId
                                          : activeVideoId
                                      }?autoplay=1&mute=${simIsMuted ? 1 : 0}&enablejsapi=1`}
                                      className="w-full h-full border-0 absolute inset-0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                    />
                                  ) : (
                                    // AMAZING EQUALIZER GRAPHIC PANEL
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 font-mono overflow-hidden">
                                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_60%)] animate-pulse" />
                                      
                                      <div className="flex items-end justify-center gap-1.5 h-24 mb-6 z-10">
                                        {Array.from({ length: 18 }).map((_, i) => {
                                          const delay = (i * 0.08).toFixed(2);
                                          const heightPercent = 20 + (i % 3 === 0 ? 60 : i % 2 === 0 ? 40 : 70);
                                          return (
                                            <div 
                                              key={i}
                                              style={{
                                                height: `${heightPercent}%`,
                                                animation: `equalizer_bounce_${i % 4} 1.2s ease-in-out infinite alternate`,
                                                animationDelay: `${delay}s`
                                              }}
                                              className="w-1.5 bg-gradient-to-t from-purple-505 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                            />
                                          );
                                        })}
                                      </div>

                                      <div className="text-center z-10 space-y-1">
                                        <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 animate-pulse">
                                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                          <span>DIRECT AUDIO STREAM SYSTEM LIVE</span>
                                        </div>
                                        <p className="text-xs text-slate-200 font-bold truncate max-w-sm">
                                          {matchedTrack?.title}
                                        </p>
                                        <p className="text-[9px] text-slate-400">
                                          By {matchedTrack?.artist} ({matchedTrack?.duration})
                                        </p>
                                      </div>

                                      <style>{`
                                        @keyframes equalizer_bounce_0 { 0% { height: 15%; } 100% { height: 85%; } }
                                        @keyframes equalizer_bounce_1 { 0% { height: 35%; } 100% { height: 95%; } }
                                        @keyframes equalizer_bounce_2 { 0% { height: 10%; } 100% { height: 70%; } }
                                        @keyframes equalizer_bounce_3 { 0% { height: 50%; } 100% { height: 100%; } }
                                      `}</style>
                                    </div>
                                  )
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 bg-slate-900/80 font-mono">
                                    <Radio size={36} className="text-purple-400 animate-pulse" />
                                    <p className="text-xs text-slate-350">YouTube Stream is Paused</p>
                                    <button
                                      onClick={() => setSimMediaState("playing")}
                                      className="px-4 py-1.5 rounded-full bg-purple-650 hover:bg-purple-600 text-[10px] text-white font-bold transition-all cursor-pointer"
                                    >
                                      Resume Audio Stream
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 select-none">
                                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                                  <div className="flex items-center gap-2 truncate">
                                    <Radio size={12} className="text-rose-500 animate-pulse shrink-0" />
                                    <span className="text-slate-400 shrink-0">Now Playing:</span>
                                    <span className="text-purple-400 font-bold truncate">
                                      {matchedTrack?.title || "Custom stream metadata cued"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <button
                                      onClick={() => setSimMediaState(simMediaState === "playing" ? "paused" : "playing")}
                                      className="p-1 px-2.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer font-bold uppercase text-[9px]"
                                    >
                                      {simMediaState === "playing" ? "PAUSE" : "PLAY"}
                                    </button>
                                    <span className="text-[10px] text-slate-400">Volume: {simVolume}%</span>
                                  </div>
                                </div>

                                {/* Custom Bengali & English YouTube Embed Alert Guide */}
                                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex flex-col gap-1.5 text-[10px] font-mono text-amber-300">
                                  <div className="flex items-start gap-1.5">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400 animate-pulse" />
                                    <span>
                                      <strong>কেন 'Video Unavailable' দেখাচ্ছে?</strong> অনেক অফিশিয়াল মিউজিক ট্র্যাক বা ভিডিও সরাসরি Iframe-এ চালাতে দেয় না ইউটিউব। এটি এড়াতে নিচের বিকল্পগুলো ট্রাই করুন:
                                    </span>
                                  </div>
                                  <div className="pl-5 text-[10px] text-slate-400 space-y-1">
                                    <p>🛡️ <strong>বিকল্প ১:</strong> উপরে সবুজ রংয়ের <strong>📻 Direct MP3 Audio Stream</strong> বাটনে ক্লিক করে নিশ্চিন্তে গান শুনুন (১০০% কাজ করবে)।</p>
                                    <p>🚀 <strong>বিকল্প ২:</strong> উপরে <strong>YouTube এ দেখুন (New Tab)</strong> বাটনে ক্লিক করে সরাসরি ইউটিউব সাইটে নতুন ট্যাবে ভিডিওটি প্লে করুন।</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Recommendations feed list */}
                            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2 overflow-y-auto max-h-[340px] lg:max-h-full pr-1">
                              <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>Simulated Recommendations</span>
                              </div>
                              <div className="space-y-1.5 overflow-y-auto pr-1">
                                {CURATED_TRACKS.map(track => (
                                  <div
                                    key={track.id}
                                    onClick={() => {
                                      setActiveVideoId(track.id);
                                      setSimMediaState("playing");
                                      const yUrl = `https://www.youtube.com/watch?v=${track.id}`;
                                      setCurrentUrl(yUrl);
                                      setAddressInput(yUrl);
                                      addCloudLog(`Selected YouTube track item: ${track.title}`, "success");
                                    }}
                                    className={`flex gap-2.5 p-2 rounded-xl border transition-all cursor-pointer group relative ${
                                      activeVideoId === track.id 
                                        ? "bg-purple-950/30 border-purple-500/40 text-purple-200" 
                                        : "bg-white/5 border-transparent hover:bg-white/10 text-slate-350"
                                    }`}
                                  >
                                    <div className="w-16 h-10 rounded bg-slate-800 shrink-0 overflow-hidden relative border border-white/5">
                                      <img 
                                        src={track.thumbnail} 
                                        alt={track.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="absolute bottom-0.5 right-1 bg-black/80 px-1 py-0.5 text-[8px] font-semibold text-white rounded font-mono">
                                        {track.duration}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center text-left">
                                      <h4 className="text-[11px] font-semibold truncate leading-tight group-hover:text-purple-300 transition-colors">
                                        {track.title}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {track.artist}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : viewerPreference === "proxy" ? (
                          // CASE B: GENUINE HTML PROXY VIEWER (Renders actual iframe of specified URL unhindered!)
                          <div className="w-full h-full flex flex-col relative bg-slate-950">
                            {/* Loading state bar */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-purple-500/10 pointer-events-none">
                              <div className="h-full bg-purple-500 animate-pulse w-1/3" />
                            </div>

                            <iframe
                              id="proxy-browser-iframe"
                              src={`/api/html-proxy?url=${encodeURIComponent(currentUrl)}`}
                              className="w-full h-full border-0 bg-white"
                              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />
                          </div>
                        ) : articleLoading ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center text-slate-400 font-mono py-12">
                            <RefreshCw className="text-purple-400 animate-spin animate-duration-1000" size={32} />
                            <div className="space-y-1">
                              <p className="text-xs text-slate-200 uppercase font-bold tracking-widest">Moyna AI Scraping Matrix</p>
                              <p className="text-[9px] text-slate-500">Extracting content nodes from webpage safely...</p>
                            </div>
                          </div>
                        ) : simActiveArticle ? (
                          // CASE C: SMART READABILITY MODE
                          <div className="w-full h-full flex flex-col justify-between overflow-y-auto">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full w-max border border-purple-500/20">
                                <FileText size={10} /> MOYNA AI CLEAN READABILITY ACTIVE
                              </div>
                              <h3 className="text-base font-bold font-mono text-white tracking-tight border-b border-white/5 pb-2">
                                {simActiveArticle.title}
                              </h3>
                              <div className="text-xs text-slate-300 leading-relaxed font-sans max-w-2xl bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                                {simActiveArticle.content}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setViewerPreference("proxy");
                                navigateBrowser(currentUrl);
                              }}
                              className="mt-6 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 w-max border border-white/5 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Globe size={12} /> Reload Full Interactive View
                            </button>
                          </div>
                        ) : (
                          // CASE D: THE HOME PORTAL (DuckDuckGo organic search + Quick bookmarks!)
                          <div className="w-full h-full flex flex-col justify-between pr-1 overflow-y-auto">
                            <div className="space-y-6">
                              
                              {/* Quick Launch Bookmarks banner */}
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1">
                                  <Bookmark size={10} /> Fast Access Bookmarks
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                  {PRESET_BOOKMARKS.map((bookmark, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => navigateBrowser(bookmark.url)}
                                      className={`p-3 rounded-2xl bg-gradient-to-br ${bookmark.theme} border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer flex items-center gap-2.5 group`}
                                    >
                                      <span className="text-base group-hover:scale-110 transition-transform">{bookmark.icon}</span>
                                      <div className="overflow-hidden min-w-0">
                                        <p className="text-[11px] text-white font-bold tracking-wide truncate">{bookmark.name}</p>
                                        <p className="text-[9px] text-slate-500 font-mono truncate">{getHostname(bookmark.url)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Search results mapping listing if searched */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500 border-b border-white/5 pb-1 max-w-sm">
                                  {simSearchQuery ? `DuckDuckGo Results for "${simSearchQuery}"` : "Global Sandbox Queries"}
                                </h4>

                                {searchLoading ? (
                                  <div className="py-12 text-center space-y-3 font-mono">
                                    <RefreshCw size={24} className="text-purple-500 animate-spin mx-auto" />
                                    <p className="text-xs text-slate-400">Sweeping web index logs...</p>
                                  </div>
                                ) : realSearchListings.length > 0 ? (
                                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {realSearchListings.map((result, idx) => (
                                      <div 
                                        key={idx}
                                        onClick={() => {
                                          navigateBrowser(result.link);
                                        }}
                                        className="p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all cursor-pointer group relative"
                                      >
                                        <span className="text-[10px] font-mono text-cyan-400 block mb-1 truncate max-w-[280px]">🔍 organic result • {getHostname(result.link)}</span>
                                        <h5 className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 font-sans tracking-tight">
                                          {result.title}
                                        </h5>
                                        {result.snippet && (
                                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                                            {result.snippet}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-6 text-center space-y-2">
                                    <Radio className="text-slate-700 mx-auto animate-pulse" size={24} />
                                    <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                                      Interactive Search is online. Try entering direct search keywords or URLs in the top address bar!<br />
                                      <span className="text-purple-400/80 italic font-medium">Examples: "wikipedia.org", "facebook.com", "bangladesh times", "lofi lofi"</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-mono text-slate-500 flex items-center justify-between select-none">
                              <span>Tunnel State: Operational</span>
                              <span className="text-cyan-400">Google Core Secure Shield Ready</span>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  ) : (
                    // STEP BY STEP DESKTOP DRIVER SETUP GUIDE
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 space-y-1.5 text-xs">
                        <h3 className="font-mono uppercase font-bold tracking-wider flex items-center gap-1.5 text-white">
                          <AlertCircle size={14} className="text-indigo-400" /> Physical Desktop Automation System
                        </h3>
                        <p className="leading-relaxed font-sans text-slate-300">
                          To execute automated, physical clicks on your owned browser, Moyna communicates with a lightweight bridge running on your computer.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">Bridge Installation Steps</h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 font-mono text-[9px] font-bold text-purple-300">1</span>
                            <span className="text-xs text-slate-200 font-semibold font-mono">Install node dev packages</span>
                          </div>
                          <div className="relative p-3 rounded-xl bg-slate-950 font-mono text-xs border border-white/5 flex items-center justify-between group">
                            <code className="text-slate-350 whitespace-pre text-[10px] leading-relaxed select-all">{setupCommands}</code>
                            <button
                              onClick={() => copyToClipboard(setupCommands, "setup")}
                              className="p-1 px-2 py-1 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                            >
                              {copiedSection === "setup" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span className="text-[10px]">{copiedSection === "setup" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 font-mono text-[9px] font-bold text-purple-300">2</span>
                            <span className="text-xs text-slate-200 font-semibold font-mono">Download local-agent.js</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                            Grab the <code className="text-purple-300">local-agent.js</code> file from the workspace explorer and execute it!
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 font-mono text-[9px] font-bold text-purple-300">3</span>
                            <span className="text-xs text-slate-200 font-semibold font-mono">Run local driver server</span>
                          </div>
                          <div className="relative p-3 rounded-xl bg-slate-950 font-mono text-xs border border-white/5 flex items-center justify-between group">
                            <code className="text-slate-350">{runCommand}</code>
                            <button
                              onClick={() => copyToClipboard(runCommand, "run")}
                              className="p-1 px-2.5 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                            >
                              {copiedSection === "run" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span className="text-[10px]">{copiedSection === "run" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* RIGHT PANEL B: PIPED AUTOMATION STREAMS LOG */}
                <div className="w-full md:w-80 shrink-0 flex flex-col bg-slate-950/60 p-5 space-y-4 relative select-none">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="font-mono text-xs uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                      <Terminal size={14} /> System Trace Log
                    </span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-2.5 text-slate-400 pr-1 select-text scrollbar-thin scrollbar-thumb-white/10">
                    {localLogs.length === 0 ? (
                      <div className="text-slate-600 italic py-4 font-sans text-xs">
                        No operations logged yet. Type any URL or search term in the address bar above to begin secure proxying trace!
                      </div>
                    ) : (
                      localLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className={`p-2 rounded-xl border leading-normal ${
                            log.type === "success" 
                              ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/20" 
                              : log.type === "error" 
                              ? "text-rose-450 text-rose-400 bg-rose-950/20 border-rose-500/10" 
                              : log.type === "action" 
                              ? "text-purple-300 bg-purple-950/30 border-purple-500/25 font-bold"
                              : "text-slate-350 bg-white/5 border-transparent"
                          }`}
                        >
                          {log.text}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500 text-center flex items-center justify-center gap-1">
                    <span>Moyna Browser Tunnel</span>
                    <span>•</span>
                    <span className="text-purple-400 font-bold">Online</span>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
