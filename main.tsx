/**
 * Audio handling utility for Myraa Live API Voice stream.
 * Handles:
 * - 16kHz layout sampling for microphone stream.
 * - Raw Little Endian Int16 PCM translation.
 * - 24kHz layout output sampling for model voice playback.
 * - Gapless double-buffer queue scheduler.
 * - Interrupt signal immediate stop.
 * - Input & Output AnalyserNodes for real-time waveform visuals.
 */

export type LiveState = "disconnected" | "connecting" | "listening" | "speaking";

// Resampling Helper: Downsamples or upsamples a Float32Array to target sample rate
function resampleFloat32Array(input: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return input;
  }
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const nextOffset = i * ratio;
    const index = Math.floor(nextOffset);
    const weight = nextOffset - index;
    if (index + 1 < input.length) {
      result[i] = input[index] * (1 - weight) + input[index + 1] * weight;
    } else {
      result[i] = input[index];
    }
  }
  return result;
}

// PCM Conversion Helper: converts Float32Array [-1.0, 1.0] to signed Int16 Raw PCM Little Endian
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

// Float conversion helper: converts signed Int16 array buffer to Float32Array [-1.0, 1.0]
function pcm16ToFloats(uint8Array: Uint8Array): Float32Array {
  const int16 = new Int16Array(
    uint8Array.buffer,
    uint8Array.byteOffset,
    uint8Array.byteLength / 2
  );
  const floats = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    floats[i] = int16[i] / 32768.0;
  }
  return floats;
}

// Convert ArrayBuffer to Base64 String
function base64ArrayBuffer(arrayBuffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export class MyraaAudioSession {
  private ws: WebSocket | null = null;
  
  // Audios contexts (separate to match exact required sample rates)
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  
  // Audio sources & processors
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micProcessorNode: ScriptProcessorNode | null = null;
  
  // Visualisers
  public inputAnalyser: AnalyserNode | null = null;
  public outputAnalyser: AnalyserNode | null = null;
  private outputGainNode: GainNode | null = null;
  
  // Buffering / Playback details
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  // State Callbacks
  private onStateChange: (state: LiveState) => void;
  private onTranscription: (role: "user" | "model", text: string) => void;
  private onToolCall: (name: string, args: any, callback: (result: any) => void) => void;
  private onError: (error: string) => void;
  private onMemorySync?: (memories: any[]) => void;
  private onMemoryTransaction?: (transactions: any[]) => void;
  
  private currentState: LiveState = "disconnected";
  private isActivated = false;
  private isManuallyDisconnected = true;

  constructor(handlers: {
    onStateChange: (state: LiveState) => void;
    onTranscription: (role: "user" | "model", text: string) => void;
    onToolCall: (name: string, args: any, callback: (result: any) => void) => void;
    onError: (error: string) => void;
    onMemorySync?: (memories: any[]) => void;
    onMemoryTransaction?: (transactions: any[]) => void;
  }) {
    this.onStateChange = handlers.onStateChange;
    this.onTranscription = handlers.onTranscription;
    this.onToolCall = handlers.onToolCall;
    this.onError = handlers.onError;
    this.onMemorySync = handlers.onMemorySync;
    this.onMemoryTransaction = handlers.onMemoryTransaction;
  }

  private setState(state: LiveState) {
    this.currentState = state;
    this.onStateChange(state);
  }

  public getState(): LiveState {
    return this.currentState;
  }

  private currentEmotion = "idle";

  public setEmotion(emotion: string) {
    this.currentEmotion = emotion;
  }

  // Requests microphone and creates connections
  public async connect(memories?: any[]) {
    if (this.isActivated) return;
    this.isActivated = true;
    this.isManuallyDisconnected = false;
    this.setState("connecting");

    try {
      // 1. Establish custom WebSocket server bridge
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let url = `${protocol}//${window.location.host}/live`;
      if (memories && memories.length > 0) {
        url += `?memories=${encodeURIComponent(JSON.stringify(memories))}`;
      }
      this.ws = new WebSocket(url);
      this.ws.binaryType = "blob";

      this.ws.onopen = async () => {
        console.log("[Myraa] Connected to server side WS bridge");
        try {
          // Guard against early user disconnect during connection setup
          if (!this.isActivated) return;

          // Safe, cross-browser AudioContext initialization
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) {
            throw new Error("Holographic audio link unsupported: Web Audio API missing in browser.");
          }

          this.inputAudioCtx = new AudioContextClass();
          this.outputAudioCtx = new AudioContextClass();

          // Ensure Audio Contexts are active and resumed to bypass browser security blocks
          if (this.inputAudioCtx.state === "suspended") {
            await this.inputAudioCtx.resume().catch(() => {});
          }
          if (this.outputAudioCtx.state === "suspended") {
            await this.outputAudioCtx.resume().catch(() => {});
          }
          
          // Setup custom output Analyser & Volume Gains
          this.outputGainNode = this.outputAudioCtx.createGain();
          this.outputAnalyser = this.outputAudioCtx.createAnalyser();
          this.outputAnalyser.fftSize = 256;
          this.outputAnalyser.smoothingTimeConstant = 0.8;
          
          this.outputGainNode.connect(this.outputAnalyser);
          this.outputAnalyser.connect(this.outputAudioCtx.destination);
          
          // Obtain User Microphone layout
          let stream: MediaStream | null = null;
          let usingSimulatedMic = false;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            });
          } catch (micError: any) {
            console.warn("[Myraa Audio] Optimal mic settings failed, trying standard audio constraints fallback:", micError);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (fallbackError: any) {
              console.warn("[Myraa Audio] Microphone access failed or denied. Initializing celestial simulator stream as fallback:", fallbackError);
              usingSimulatedMic = true;
              
              // Generate a synthetic, silent dummy MediaStream using Web Audio API oscillator
              try {
                const osc = this.inputAudioCtx.createOscillator();
                const dest = this.inputAudioCtx.createMediaStreamDestination();
                osc.connect(dest);
                osc.start();
                stream = dest.stream;
                
                // Inform the user elegantly that microphone permission is blocked, and we initialized a simulator stream.
                this.onError("Microphone hardware blocked: IFrame sandbox restricts mic access. Running in Celestial text-and-hearing mode. Open in a new tab to use your real mic!");
              } catch (synthErr) {
                console.error("Failed to generate synthetic fallback stream:", synthErr);
              }
            }
          }

          if (!stream) {
            throw new Error("Unable to initialize microphone hardware or celestial simulation context.");
          }

          // Safeguard: Check if we disconnected while waiting for user to grant mic permissions
          if (!this.isActivated || !this.inputAudioCtx || !this.outputAudioCtx) {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch (e) {}
            });
            return;
          }

          this.micStream = stream;

          // Setup custom input Analyser
          this.inputAnalyser = this.inputAudioCtx.createAnalyser();
          this.inputAnalyser.fftSize = 256;
          
          this.micSourceNode = this.inputAudioCtx.createMediaStreamSource(this.micStream);
          this.micSourceNode.connect(this.inputAnalyser);

          // Stream input PCM 16-bit to WS
          this.micProcessorNode = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);
          this.micSourceNode.connect(this.micProcessorNode);
          this.micProcessorNode.connect(this.inputAudioCtx.destination);

          // Pin reference to global window to bypass garbage collection in browsers during long silences
          (window as any).__myraaMicProcessor = this.micProcessorNode;

          this.micProcessorNode.onaudioprocess = (e) => {
            if (this.currentState === "disconnected" || this.currentState === "connecting") return;
            
            const channelData = e.inputBuffer.getChannelData(0);
            
            // Downsample dynamically from actual context sample rate to 16000
            const actualSampleRate = this.inputAudioCtx ? this.inputAudioCtx.sampleRate : 16000;
            const resampledData = resampleFloat32Array(channelData, actualSampleRate, 16000);
            
            // Convert to base64 Int16 Little Endian PCM
            const pcmBuffer = floatTo16BitPCM(resampledData);
            const base64 = base64ArrayBuffer(pcmBuffer);
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ audio: base64 }));
            }
          };

          // Start a heartbeat ping interval to prevent proxy inactivity timeouts (e.g., Cloud Run 60s idle disconnect)
          const pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: "ping" }));
            } else {
              clearInterval(pingInterval);
            }
          }, 10000); // 10 seconds ping heartbeat

          // Start AudioContext supervisor interval to automatically revive any browser-suspended contexts
          const supervisorInterval = setInterval(() => {
            if (!this.isActivated) {
              clearInterval(supervisorInterval);
              return;
            }
            if (this.inputAudioCtx && this.inputAudioCtx.state === "suspended") {
              console.warn("[Myraa Supervisor] Input AudioContext suspended. Automatically resurrecting...");
              this.inputAudioCtx.resume().catch(() => {});
            }
            if (this.outputAudioCtx && this.outputAudioCtx.state === "suspended") {
              console.warn("[Myraa Supervisor] Output AudioContext suspended. Automatically resurrecting...");
              this.outputAudioCtx.resume().catch(() => {});
            }
          }, 3000);

          // Sound setups are fully functional
          this.setState("listening");

        } catch (audioError: any) {
          console.error("Audio Context or Microphone Initialization Failed:", audioError);
          this.onError(`Permission error: ${audioError.message || "Microphone required for holographic Live link."}`);
          this.disconnect();
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Root Error Handler message
          if (data.type === "error") {
            this.onError(data.error);
            this.disconnect(false);
            return;
          }

          // Handle server-side states
          if (data.type === "status") {
            console.log("[Myraa WS Status]:", data.status);
            if (data.status === "connecting_gemini") {
              // Wait for Gemini Live connection
            } else if (data.status === "connected") {
              this.setState("listening");
            } else if (data.status === "session_closed") {
              const wasActive = this.isActivated;
              const wasManual = this.isManuallyDisconnected;
              this.disconnect(false);
              
              if (wasActive && !wasManual) {
                console.warn("[Myraa Sync] Session closed by server. Instantly reconnecting to resume companion...");
                this.setState("connecting");
                setTimeout(() => {
                  if (!this.isActivated && !wasManual) {
                    this.connect();
                  }
                }, 1000);
              }
            }
            return;
          }

          // Handle audio payload (24kHzPCM model response)
          if (data.type === "audio" && data.audio) {
            this.playAudioPCMChunk(data.audio);
          }

          // Handle interruption signal (e.g. user talked over Myraa)
          if (data.type === "interrupted") {
            this.handleInterruption();
          }

          // Turn complete
          if (data.type === "turnComplete") {
            // Once Myraa completes speaking, change visual state back to listening
            setTimeout(() => {
              if (this.activeSources.length === 0 && this.currentState === "speaking") {
                this.setState("listening");
              }
            }, 100);
          }

          // Handle live captions transcription
          if (data.type === "transcription") {
            this.onTranscription(data.role, data.text);
          }

          // Handle memory synchronization
          if (data.type === "memory_sync" && data.memories) {
            if (this.onMemorySync) {
              this.onMemorySync(data.memories);
            }
          }

          // Handle memory transactions synchronization
          if (data.type === "memory_transaction" && data.transactions) {
            if (this.onMemoryTransaction) {
              this.onMemoryTransaction(data.transactions);
            }
          }

          // Handle Tool Calling
          if (data.type === "toolCall") {
            const { callId, name, args } = data;
            this.onToolCall(name, args, (result) => {
              // Send back execution result to server bridge
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                  type: "toolResponse",
                  id: callId,
                  name: name,
                  output: result
                }));
              }
            });
          }

        } catch (parseError) {
          console.error("Error reading server packet:", parseError);
        }
      };

      this.ws.onerror = (wsError) => {
        console.error("WebSocket transport error:", wsError);
        this.onError("Holographic network link lost. Attempting connection recovery...");
        
        const wasActive = this.isActivated;
        const wasManual = this.isManuallyDisconnected;
        this.disconnect(false);
        
        if (wasActive && !wasManual) {
          console.warn("[Myraa Sync] WebSocket connection failed. Attempting connection recovery...");
          this.setState("connecting");
          setTimeout(() => {
            if (!this.isActivated && !wasManual) {
              this.connect();
            }
          }, 2000);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket connection closed");
        
        const wasActive = this.isActivated;
        const wasManual = this.isManuallyDisconnected;
        this.disconnect(false);
        
        if (wasActive && !wasManual) {
          console.warn("[Myraa Sync] Unexpected socket closure. Attempting automatic recovery...");
          this.setState("connecting");
          setTimeout(() => {
            if (!this.isActivated && !wasManual) {
              this.connect();
            }
          }, 2000);
        }
      };

    } catch (e: any) {
      console.error("Connection establish sequence failed:", e);
      this.onError(e.message || "Failed to initialize active channel.");
      this.disconnect();
    }
  }

  // Interruption triggers: stops all active audio players immediately
  private handleInterruption() {
    console.log("[Audio] Interruption signal received; flushing play logs.");
    
    // Stop all playing nodes
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (err) {
        // Already finished or stopped
      }
    });
    this.activeSources = [];
    this.nextStartTime = 0;
    
    // Set state back to user listening
    this.setState("listening");
  }

  // Direct raw PCM chunk scheduled playback at 24kHz
  private playAudioPCMChunk(base64Audio: string) {
    if (!this.outputAudioCtx || !this.outputGainNode) return;

    try {
      this.setState("speaking");
      const uint8Array = base64ToUint8Array(base64Audio);
      const floats = pcm16ToFloats(uint8Array);

      // Create AudioBuffer of 24000Hz (the exact playback sample rate of Gemini outputs)
      const buffer = this.outputAudioCtx.createBuffer(1, floats.length, 24000);
      buffer.getChannelData(0).set(floats);

      // Create Buffer source
      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = buffer;

      // Subtle dynamic shift of pitch & pacing based on emotion states
      let rate = 1.0;
      switch (this.currentEmotion) {
        case "happy":
        case "playful":
          rate = 1.08; // slightly higher pitch, faster pace
          break;
        case "excited":
        case "proud":
          rate = 1.14; // higher pitch, enthusiastic pace
          break;
        case "sad":
          rate = 0.86; // lowered pitch, slow melancholy pace
          break;
        case "thinking":
          rate = 0.93; // slightly deliberate/deeper, reflective pace
          break;
        case "surprised":
          rate = 1.07; // elevated pitch, energized pace
          break;
        case "embarrassed":
          rate = 0.94; // slightly slower
          break;
        case "confused":
          rate = 1.02; // slightly faster questioning lift
          break;
        case "curious":
          rate = 1.05; // slightly faster inquiring lift
          break;
        default:
          rate = 1.0;
          break;
      }
      source.playbackRate.value = rate;

      // Connect source to gain which is routed to analyser & speakers
      source.connect(this.outputGainNode);

      const currentTime = this.outputAudioCtx.currentTime;
      
      // Gapless scheduler sync
      if (this.nextStartTime < currentTime) {
        // Start fresh: 30ms ahead to bridge schedule timing
        this.nextStartTime = currentTime + 0.03;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += (buffer.duration / rate);

      // Keep reference to handle real-time interruptions
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        
        // If there are no more active play nodes, revert state back to listening
        if (this.activeSources.length === 0 && this.currentState === "speaking") {
          this.setState("listening");
        }
      };

      this.activeSources.push(source);

    } catch (playbackError) {
      console.error("PCM Chunk buffering/playback failed:", playbackError);
    }
  }

  // Sends base64 screen/display frames to server side Live API
  public sendVideoFrame(base64Data: string, mimeType: string = "image/jpeg") {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "videoFrame",
        video: base64Data,
        mimeType
      }));
    }
  }

  // Sends custom conversation text prompts directly to the server-side Live API context
  public sendClientContent(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "clientContent",
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [
                {
                  text: text
                }
              ]
            }
          ],
          turnComplete: true
        }
      }));
    }
  }

  // Fully cleanup and release microphones & connection sockets
  public disconnect(isManual = true) {
    this.isActivated = false;
    if (isManual) {
      this.isManuallyDisconnected = true;
    }
    this.setState("disconnected");

    // Close WS socket
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    // Stop and release user microphone streams
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.micStream = null;
    }

    // Disconnect routing nodes
    if (this.micProcessorNode) {
      try {
        this.micProcessorNode.disconnect();
      } catch (e) {}
      this.micProcessorNode = null;
    }

    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch (e) {}
      this.micSourceNode = null;
    }

    // Close Audio contexts
    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch (e) {}
      this.outputAudioCtx = null;
    }

    this.activeSources = [];
    this.nextStartTime = 0;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.outputGainNode = null;
  }
}
