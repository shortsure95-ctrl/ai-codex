import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Trash2, X, FileText, Minimize2, Sparkles, AlertCircle } from "lucide-react";

interface CompanionNotepadProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onContentChange: (newContent: string) => void;
  onClear: () => void;
}

export const CompanionNotepad: React.FC<CompanionNotepadProps> = ({
  content,
  isOpen,
  onClose,
  onContentChange,
  onClear
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 left-5 z-[160] pointer-events-auto"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-slate-950/90 border border-cyan-500/30 text-cyan-300 hover:text-white px-4 py-2 rounded-full shadow-lg text-[10px] font-mono font-bold tracking-wider cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/10 transition-all duration-300"
        >
          <FileText size={12} className="animate-pulse" />
          <span>VIEW MOYNA'S NOTES</span>
          {content.trim() && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      className="fixed bottom-24 left-5 z-[160] pointer-events-auto w-80 bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-3 font-mono text-left text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 select-none">
        <div className="flex items-center gap-1.5">
          <FileText size={13} className="text-cyan-400 shrink-0" />
          <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1">
            Moyna's Scratchpad
            <Sparkles size={10} className="text-cyan-300 animate-pulse" />
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize Notepad"
            className="p-1 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Minimize2 size={11} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Notepad"
            className="p-1 rounded bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Editor/Notebook Body */}
      <div className="relative flex-1 min-h-[160px] max-h-[300px] flex flex-col">
        {content ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full flex-1 min-h-[150px] max-h-[280px] bg-slate-900/40 focus:bg-slate-900/60 border border-white/5 focus:border-cyan-500/30 rounded-xl p-3 text-[11px] text-slate-100 placeholder-slate-500 font-mono focus:outline-none resize-none leading-relaxed transition-colors custom-scrollbar"
            placeholder="Type notes or ask Moyna to write something..."
          />
        ) : (
          <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center text-center bg-slate-900/20 border border-dashed border-white/5 rounded-xl p-4 select-none">
            <FileText size={20} className="text-slate-600 mb-1.5" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Empty Scratchpad</p>
            <p className="text-[9px] text-slate-500 mt-1 px-4 leading-normal">
              Ask Moyna to write down anything, and it will materialize here!
            </p>
          </div>
        )}
      </div>

      {/* Interactive Bottom Control Toolbar */}
      <div className="flex justify-between items-center bg-slate-900/30 border border-white/5 rounded-xl p-1.5 select-none text-[9px] font-bold">
        {/* Memory facts size or lines count */}
        <span className="text-slate-500 px-1 font-mono text-[8px]">
          {content ? `${content.split(/\r\n|\r|\n/).length} LINES / ${content.length} CHARS` : "READY"}
        </span>

        <div className="flex items-center gap-1.5">
          {content && (
            <>
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className={`py-1 px-2.5 rounded-lg border flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                  copied
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:border-cyan-400 hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={10} />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    <span>COPY</span>
                  </>
                )}
              </button>

              {/* Delete/Clear button */}
              <button
                type="button"
                onClick={onClear}
                className="py-1 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-400 text-rose-300 hover:text-white flex items-center gap-1 transition duration-150 cursor-pointer"
                title="Clear Notes"
              >
                <Trash2 size={10} />
                <span>DELETE</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
