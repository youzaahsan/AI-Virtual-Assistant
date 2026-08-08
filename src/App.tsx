import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, Shield, Mic, MicOff, Send, Volume2, Radio, RefreshCw, 
  Terminal as TermIcon, Eye, Play, Power, Layers, Copy, Check, Download, 
  Camera, Sun, Info, Settings, Database, Cloud, ListRestart, Lock, Unlock, 
  User, Sparkles, LogOut, Code, Globe, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { pythonFiles } from "./pythonFiles";
import { 
  Message, SystemStats, WeatherStats, CustomCommand, UserPreferences 
} from "./types";

// Setup speech recognition
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function App() {
  // Navigation & System Phase States
  const [systemState, setSystemState] = useState<"splash" | "auth" | "dashboard">("splash");
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [authPasscode, setAuthPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"hud" | "replicator" | "stats" | "settings">("hud");

  // User Preferences & Settings Store
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const defaultPrefs: UserPreferences = {
      userName: "Tony Stark",
      passcode: "3000",
      voiceAuthEnabled: false,
      themeColor: "cyan",
      reactorSpeed: "rapid",
      soundEffects: true,
      voiceVolume: 0.9,
      customCommands: [
        { phrase: "engage thrusters", actionType: "PLAY_MUSIC", payload: "ACDC Shoot to Thrill" },
        { phrase: "locate pepper", actionType: "OPEN_WEBSITE", payload: "https://google.com" }
      ],
      voiceMode: "premium",
      vocalVoice: "Fenrir",
      vocalGender: "male",
      vocalAccent: "british"
    };
    const saved = localStorage.getItem("jarvis_preferences");
    if (saved) {
      try {
        return { ...defaultPrefs, ...JSON.parse(saved) };
      } catch (err) {
        // ignore
      }
    }
    return defaultPrefs;
  });

  // Dynamic design system helper matching the Sophisticated Dark spec
  const getThemeClass = (type: "glass" | "text" | "border" | "ring" | "color" | "glow" | "reactor") => {
    const theme = preferences.themeColor;
    if (theme === "red") {
      switch (type) {
        case "glass": return "glass-red shadow-[0_0_15px_rgba(239,68,68,0.02)]";
        case "text": return "text-[#ef4444] neon-text-red";
        case "border": return "neon-border-red";
        case "ring": return "arc-ring-red";
        case "color": return "#ef4444";
        case "glow": return "rgba(239, 68, 68, 0.2)";
        case "reactor": return "text-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500/40 bg-red-950/20";
      }
    } else if (theme === "orange") {
      switch (type) {
        case "glass": return "glass-orange shadow-[0_0_15px_rgba(249,115,22,0.02)]";
        case "text": return "text-[#f97316] neon-text-orange";
        case "border": return "neon-border-orange";
        case "ring": return "arc-ring-orange";
        case "color": return "#f97316";
        case "glow": return "rgba(249, 115, 22, 0.2)";
        case "reactor": return "text-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.4)] border-orange-500/40 bg-orange-950/20";
      }
    }
    // Default is cyan / #00e5ff
    switch (type) {
      case "glass": return "glass shadow-[0_0_20px_rgba(0,229,255,0.03)]";
      case "text": return "text-[#00e5ff] neon-text-cyan";
      case "border": return "neon-border-cyan";
      case "ring": return "arc-ring-cyan";
      case "color": return "#00e5ff";
      case "glow": return "rgba(0, 229, 255, 0.2)";
      case "reactor": return "text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.35)] border-neon-cyan bg-[#020408]";
    }
  };


  // Conversation & AI States
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("jarvis_chat_history");
    return saved ? JSON.parse(saved) : [
      {
        id: "init",
        role: "assistant",
        content: "Core processors loaded, Sir. Diagnostics are fully operational. Access granted to planetary telemetry systems.",
        timestamp: new Date().toLocaleTimeString()
      }
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [satelliteStatus, setSatelliteStatus] = useState<"SECURE" | "LIMITED" | "LOCAL">("SECURE");
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);

  // Advanced Web Voice State (Continuous Recognition)
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceVolumeMultiplier, setVoiceVolumeMultiplier] = useState(50);
  const recognitionRef = useRef<any>(null);

  // Biometric Camera Module
  const [cameraAccess, setCameraAccess] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Automation / System Telemetry
  const [telemetry, setTelemetry] = useState<SystemStats>({
    cpu: 24,
    ram: 45,
    coreTemp: 64,
    internetSpeed: "984 Mbps",
    activeProcesses: ["MARK_85_REACTION_BUS", "PLANETARY_RADAR_GRID", "SPEECH_RECOGNITION_DAEMON", "GEMINI_COGNITIVE_SOCKET"],
    uptime: "4h 12m 3s"
  });
  const [weather, setWeather] = useState<WeatherStats>({
    location: "Stark Tower, Malibu, CA",
    temperature: "72°F / 22°C",
    condition: "Full Solar Resonance",
    humidity: "38%",
    wind: "14 mph WNW",
    pressure: "1015 hPa"
  });
  const [countdownMsg, setCountdownMsg] = useState<string | null>(null);
  const [countdownVal, setCountdownVal] = useState(0);

  // Python Exporter HUD States
  const [selectedPyFile, setSelectedPyFile] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Audio synthesize references
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  const [customCommandPhrase, setCustomCommandPhrase] = useState("");
  const [customCommandType, setCustomCommandType] = useState("OPEN_WEBSITE");
  const [customCommandPayload, setCustomCommandPayload] = useState("");

  // Refs for auto scrolling chat
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Waveform canvas helper
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Initial Synchronizer and Setup ---
  useEffect(() => {
    // Check Speech Recognition capability
    if (SpeechRecognitionAPI) {
      setVoiceSupported(true);
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => setIsListening(true);
      rec.onerror = (e: any) => {
        console.error("[Speech error]", e);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      rec.onresult = (e: any) => {
        let interimText = "";
        let finalOutput = "";

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalOutput += e.results[i][0].transcript;
          } else {
            interimText += e.results[i][0].transcript;
          }
        }

        if (interimText) {
          setVoiceInterim(interimText);
        }

        if (finalOutput) {
          setVoiceInterim("");
          handleVocalInput(finalOutput);
        }
      };

      recognitionRef.current = rec;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    // Load initial weather & news from server
    fetch("/api/weather-news")
      .then(res => res.json())
      .then(data => {
        if (data.weather) setWeather(data.weather);
      })
      .catch(err => console.error("Could not fetch server diagnostics", err));
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem("jarvis_preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem("jarvis_chat_history", JSON.stringify(messages));
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Telemetry fluctuation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => {
        const factor = preferences.reactorSpeed === "rapid" ? 1.5 : 0.8;
        const targetCpu = Math.min(99, Math.max(12, Math.round(prev.cpu + (Math.random() - 0.5) * 8 * factor)));
        const targetRam = Math.min(95, Math.max(30, Math.round(prev.ram + (Math.random() - 0.5) * 3)));
        const targetTemp = Math.min(105, Math.max(45, Math.round(prev.coreTemp + (Math.random() - 0.5) * 4 * factor)));
        
        // Dynamic time
        const date = new Date();
        const hrs = String(date.getHours()).padStart(2, "0");
        const mins = String(date.getMinutes()).padStart(2, "0");
        const secs = String(date.getSeconds()).padStart(2, "0");

        return {
          ...prev,
          cpu: targetCpu,
          ram: targetRam,
          coreTemp: targetTemp,
          uptime: `Diag Cycle Active [${hrs}:${mins}:${coordsOffsetSecs()}]`
        };
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [preferences.reactorSpeed]);

  const coordsOffsetSecs = () => {
    const d = new Date();
    return String(d.getSeconds()).padStart(2, "0");
  };

  // Splash Screen Core Diagnostic Routine
  useEffect(() => {
    if (systemState !== "splash") return;

    const initialSteps = [
      "Securing satellite mainframe handshake... STABLE",
      "Mapping local neural synaptic vectors (Gemini-3.5 Core)... MAPPED",
      "Calibrating audio sensors & continuous vocal decibel receptors... BALANCED",
      "Analyzing biometric authorization keys... READY",
      "JARVIS Neural Terminal initialization sequence complete. Sir."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < initialSteps.length) {
        setBootLogs(prev => [...prev, `[INIT] ${initialSteps[currentStep]}`]);
        setBootProgress(prev => Math.min(100, prev + 20));
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setSystemState("auth");
        }, 800);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [systemState]);

  // Biometric Face Capture Overlay Renderer
  useEffect(() => {
    if (systemState !== "dashboard" || !cameraAccess || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (video.paused || video.ended) return;

      // Match sizes
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw beautiful green neon face scanning visual HUD
      const t = Date.now() / 1000;
      const themeColor = getThemeClass("color");
      
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;

      // Central target scanning box
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const edge = Math.min(canvas.width, canvas.height) * 0.45;
      const x1 = cx - edge / 2;
      const y1 = cy - edge / 2;

      // Rotating cyber scanning grid lines
      ctx.strokeRect(x1, y1, edge, edge);
      
      // Corners Indicators
      const len = 25;
      ctx.beginPath();
      // TL
      ctx.moveTo(x1 - 5, y1 + len); ctx.lineTo(x1 - 5, y1 - 5); ctx.lineTo(x1 + len, y1 - 5);
      // TR
      ctx.moveTo(x1 + edge + 5 - len, y1 - 5); ctx.lineTo(x1 + edge + 5, y1 - 5); ctx.lineTo(x1 + edge + 5, y1 + len);
      // BL
      ctx.moveTo(x1 - 5, y1 + edge + 5 - len); ctx.lineTo(x1 - 5, y1 + edge + 5); ctx.lineTo(x1 + len, y1 + edge + 5);
      // BR
      ctx.moveTo(x1 + edge + 5 - len, y1 + edge + 5); ctx.lineTo(x1 + edge + 5, y1 + edge + 5); ctx.lineTo(x1 + edge + 5, y1 + edge + 5 - len);
      ctx.stroke();

      // Horizontal scanner sweeping line
      const sweepY = y1 + (Math.sin(t * 2) * 0.5 + 0.5) * edge;
      ctx.beginPath();
      ctx.moveTo(x1, sweepY);
      ctx.lineTo(x1 + edge, sweepY);
      ctx.strokeStyle = `${themeColor}cc`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = themeColor;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dynamic biometric simulated target outline trackers
      ctx.beginPath();
      ctx.arc(cx + Math.cos(t) * 40, cy + Math.sin(t * 1.5) * 30, 45, 0, 2 * Math.PI);
      ctx.strokeStyle = `${themeColor}99`;
      ctx.stroke();

      // Data telemetry text blocks onto the camera stream
      ctx.fillStyle = themeColor;
      ctx.font = "bold 11px monospace";
      ctx.fillText(`TARGET: ${preferences.userName.toUpperCase()}`, x1 + 10, y1 + 25);
      ctx.fillText(`BIOMETRIC ALIGNMENT: 98.7%`, x1 + 10, y1 + 40);
      ctx.fillText(`SCAN MATRIX: ACT_MD_829`, x1 + 10, y1 + 55);

      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(5, 5, 160, 45);
      ctx.fillStyle = themeColor;
      ctx.fillText(`HUD FREQ: ${(60 + Math.sin(t) * 1.2).toFixed(1)}HZ`, 10, 20);
      ctx.fillText("SAT PROTOCOL: CONNECTED", 10, 35);

      animId = requestAnimationFrame(render);
    };

    video.onloadedmetadata = () => {
      animId = requestAnimationFrame(render);
    };

    if (video.readyState >= 2) {
      animId = requestAnimationFrame(render);
    }

    return () => cancelAnimationFrame(animId);
  }, [systemState, cameraAccess, preferences.themeColor]);

  // Speaking sound wave animation
  useEffect(() => {
    if (systemState !== "dashboard" || !waveCanvasRef.current) return;
    const canvas = waveCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const themeColor = getThemeClass("color");
      
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      offset += 0.08;

      // Generate animated waves
      for (let x = 0; x < canvas.width; x++) {
        const amplitude = isAiLoading ? 25 : isListening ? 15 : 4;
        const frequency = 0.035;
        const speed = offset;
        const y = centerY + Math.sin(x * frequency + speed) * amplitude * Math.cos(x * 0.005);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Secondary decorative harmonic wave
      ctx.strokeStyle = `${themeColor}44`;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const amplitude = isAiLoading ? 12 : isListening ? 8 : 2;
        const frequency = 0.05;
        const speed = -offset * 1.5;
        const y = centerY + Math.sin(x * frequency + speed) * amplitude * Math.cos(x * 0.008);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      animId = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(animId);
  }, [systemState, isAiLoading, isListening, preferences.themeColor]);

  // Voice Speech Synthesizer with Premium and Local Backup Engines
  const speakLocalVoice = (cleanedText: string) => {
    if (!synthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.volume = preferences.voiceVolume;
    
    const accent = preferences.vocalAccent || "british";
    const gender = preferences.vocalGender || "male";

    // Speed and pitch matching based on premium specs
    if (gender === "male") {
      utterance.pitch = 0.90; // Deepened pitch to mimic JARVIS's natural rich tones
      utterance.rate = 0.96;
    } else {
      utterance.pitch = 1.05; // Elegant pitch for Friday
      utterance.rate = 1.01;
    }

    // Find custom matching local voice
    const voices = synthRef.current.getVoices();
    let selectVoice: SpeechSynthesisVoice | undefined;

    if (accent === "hindi") {
      selectVoice = voices.find(v => 
        (v.lang.toLowerCase().replace("_", "-").startsWith("hi-in") || v.lang.toLowerCase().startsWith("hi")) &&
        (gender === "male" 
          ? (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("hemant") || v.name.toLowerCase().includes("madhur"))
          : (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("kalpana") || v.name.toLowerCase().includes("heera"))
        )
      ) || voices.find(v => v.lang.toLowerCase().startsWith("hi"))
        || voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith("en-in") && v.name.toLowerCase().includes("ravi"))
        || voices.find(v => v.name.toLowerCase().includes("india") || v.lang.toLowerCase().replace("_", "-").startsWith("en-in"));
    } else if (accent === "indian_english") {
      selectVoice = voices.find(v => 
        (v.lang.toLowerCase().replace("_", "-").startsWith("en-in") || v.lang.toLowerCase().replace("_", "-").startsWith("hi-in")) &&
        (gender === "male"
          ? (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("ravi"))
          : (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("neerja") || v.name.toLowerCase().includes("priya"))
        )
      ) || voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith("en-in"))
        || voices.find(v => v.name.toLowerCase().includes("india"));
    }

    // Standard accents
    if (!selectVoice) {
      if (accent === "british") {
        selectVoice = voices.find(v => 
          v.lang.toLowerCase().replace("_", "-").startsWith("en-gb") && 
          (gender === "male" 
            ? (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("daniel") || v.name.toLowerCase().includes("george"))
            : (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("hazel") || v.name.toLowerCase().includes("susan") || v.name.toLowerCase().includes("serena"))
          )
        ) || voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith("en-gb"));
      } else { // american
        selectVoice = voices.find(v => 
          v.lang.toLowerCase().replace("_", "-").startsWith("en-us") && 
          (gender === "male" 
            ? (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("guy") || v.name.toLowerCase().includes("natural"))
            : (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("jessica"))
          )
        ) || voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith("en-us"));
      }
    }

    // Universal fallback
    if (!selectVoice) {
      selectVoice = voices.find(v => 
        gender === "male" ? v.name.toLowerCase().includes("male") : v.name.toLowerCase().includes("female")
      ) || voices[0];
    }

    if (selectVoice) {
      utterance.voice = selectVoice;
    }

    synthRef.current.speak(utterance);
  };

  const speakVoice = async (text: string) => {
    // 1. Cancel ongoing client-side web voice occurrences
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    // 2. Shut down any ongoing premium sound files
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current.currentTime = 0;
    }

    // Filter out potential code action JSON bodies
    const cleanedText = text.replace(/```jarvis-action:json[\s\S]*?```/g, "").trim();
    if (!cleanedText) return;

    if (preferences.voiceMode === "premium") {
      try {
        const response = await fetch("/api/gemini/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: cleanedText, 
            voice: preferences.vocalVoice,
            gender: preferences.vocalGender,
            accent: preferences.vocalAccent
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.satelliteInterrupted) {
            setSatelliteStatus("LIMITED");
          }
          if (data.audio) {
            const audioUrl = `data:audio/mp3;base64,${data.audio}`;
            const audio = new Audio(audioUrl);
            audio.volume = preferences.voiceVolume;
            audioPlaybackRef.current = audio;
            audio.play().catch(err => {
              console.warn("Premium playback block, using high-quality local cache: ", err);
              speakLocalVoice(cleanedText);
            });
            return;
          }
        } else {
          setSatelliteStatus("LIMITED");
        }
      } catch (err) {
        console.warn("Premium satellite speech link is currently congested, falling back to local vocal module:", err);
        setSatelliteStatus("LIMITED");
      }
    }

    // Default Fallback
    speakLocalVoice(cleanedText);
  };

  // --- Voice Trigger Command Parser ---
  const handleVocalInput = (speech: string) => {
    // Check if system matches "Jarvis" or custom commands
    let cleanSpeech = speech.toLowerCase().trim();
    setChatInput(speech);
    
    // Auto execute if matching custom voice phrases
    const matchedCustom = preferences.customCommands.find(
      cmd => cleanSpeech.includes(cmd.phrase.toLowerCase())
    );

    if (matchedCustom) {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          role: "user",
          content: speech,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      executeSystemAction({
        action: matchedCustom.actionType as any,
        url: matchedCustom.payload,
        query: matchedCustom.payload,
        prompt: matchedCustom.payload
      }, `Executing designated customized bio-command: "${matchedCustom.phrase}".`);
      return;
    }

    // Default chat sender trigger
    submitChatMessage(speech);
  };

  // Chat/Input processing logic  
  const submitChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const chatHistoryAndInput = [...messages, userMsg];
      
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistoryAndInput,
          userPreferences: {
            userName: preferences.userName,
            themeColor: preferences.themeColor,
            reactorSpeed: preferences.reactorSpeed
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Neural path severed.");

      if (data.satelliteInterrupted) {
        setSatelliteStatus("LIMITED");
      } else {
        setSatelliteStatus("SECURE");
      }

      let aiText = data.text;
      let action: any = null;

      // Extract JSON action blocks wrapped in markdown code blocks
      const jsonRegex = /```jarvis-action:json\s*([\s\S]*?)\s*```/;
      const match = aiText.match(jsonRegex);
      if (match) {
        try {
          action = JSON.parse(match[1]);
        } catch (err) {
          console.error("Action parse bottleneck", err);
        }
      }

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: aiText,
        timestamp: new Date().toLocaleTimeString(),
        action: action || undefined
      };

      setMessages(prev => [...prev, aiMsg]);
      speakVoice(aiText);

      if (action) {
        executeSystemAction(action, "Processing structural system automation request.");
      }

    } catch (err: any) {
      console.error(err);
      setSatelliteStatus("LOCAL");
      const errorMsg: Message = {
        id: String(Date.now() + 2),
        role: "assistant",
        content: `Bottleneck warning: ${err.message || "Synthesizer lost satellite grid coordinate."}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
      speakVoice("Warning, Sir. A neural routing bottleneck has occurred.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Direct action executor inside browser
  const executeSystemAction = async (action: any, description: string) => {
    const notifyAssistant = (text: string) => {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() * 1.5),
          role: "assistant",
          content: text,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      speakVoice(text);
    };

    switch (action.action) {
      case "OPEN_WEBSITE":
        if (action.url) {
          notifyAssistant(`Yes, Sir. Navigating structural framework layout for ${action.url}.`);
          setTimeout(() => {
            window.open(action.url, "_blank", "referrer");
          }, 1200);
        }
        break;

      case "SEARCH_GOOGLE":
        if (action.query) {
          notifyAssistant(`Conducting wide-spectrum Google search coordinates for: "${action.query}".`);
          setTimeout(() => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(action.query)}`, "_blank", "referrer");
          }, 1200);
        }
        break;

      case "SEARCH_YOUTUBE":
        if (action.query) {
          notifyAssistant(`Calibrating sonic frequencies on YouTube for: "${action.query}".`);
          setTimeout(() => {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(action.query)}`, "_blank", "referrer");
          }, 1200);
        }
        break;

      case "SYSTEM_VOLUME":
        if (action.percent !== undefined) {
          setVoiceVolumeMultiplier(action.percent);
          notifyAssistant(`Calibrating decibel transceiver grid limit back to ${action.percent} percent, Sir.`);
        }
        break;

      case "SYSTEM_BRIGHTNESS":
        if (action.percent !== undefined) {
          notifyAssistant(`Brightness adjust simulated. Overriding display lux panels to ${action.percent} percent.`);
        }
        break;

      case "CAPTURE_SCREENSHOT":
        notifyAssistant("Acquiring structural HUD raster output matrices...");
        // Simulate a countdown flash
        setCountdownMsg("MATRIX RASTERIZATION ACTIVE");
        setCountdownVal(3);
        const cycle = setInterval(() => {
          setCountdownVal(prev => {
            if (prev <= 1) {
              clearInterval(cycle);
              setCountdownMsg(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        break;

      case "CAMERA_HUD":
        notifyAssistant("Initiating camera biometrics stream framework. Aligning visual arrays.");
        handleCameraInit();
        break;

      case "SHUTDOWN":
        notifyAssistant("Initiating master quarantine lockdown protocol immediately. Clear structural modules.");
        setCountdownMsg("LOCKDOWN / SHUTDOWN OVERRIDES LIVE");
        setCountdownVal(10);
        const lockTimer = setInterval(() => {
          setCountdownVal(prev => {
            if (prev <= 1) {
              clearInterval(lockTimer);
              setCountdownMsg(null);
              // reboot applet state
              setSystemState("splash");
              setBootProgress(0);
              setBootLogs([]);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        break;

      case "GENERATE_IMAGE":
        if (action.prompt) {
          notifyAssistant(`Synthesizing synthetic image matrix mapping prompt coordinates: "${action.prompt}".`);
          setIsAiLoading(true);
          try {
            const apiRes = await fetch("/api/gemini/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: action.prompt })
            });
            const imgData = await apiRes.json();
            if (imgData.imageUrl) {
              setGeneratedImg(imgData.imageUrl);
              setMessages(prev => [
                ...prev,
                {
                  id: String(Date.now() + 1.2),
                  role: "assistant",
                  content: "Synthetic image render cycle completed successfully, Sir. Displaying raster on HUD grid.",
                  timestamp: new Date().toLocaleTimeString()
                }
              ]);
            } else {
              throw new Error(imgData.error);
            }
          } catch (err: any) {
            notifyAssistant("Image render failed due to synaptic thermal overload, Sir.");
          } finally {
            setIsAiLoading(false);
          }
        }
        break;

      case "PLAY_MUSIC":
        notifyAssistant(`Synthesizing sound frequencies for: "${action.genre || "AC/DC"}".`);
        setTimeout(() => {
          window.open(`https://music.youtube.com/search?q=${encodeURIComponent(action.genre || "AC/DC")}`, "_blank", "referrer");
        }, 1200);
        break;

      default:
        console.warn("Unrouted JARVIS action command", action);
        break;
    }
  };

  // Camera stream initializer
  const handleCameraInit = async () => {
    try {
      if (cameraStream) {
        // Stop current
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
        setCameraAccess(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAccess(true);
    } catch (err) {
      console.error("Camera access blocked", err);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: "Biometric sensor error: Camera authorization is unavailable within this iframe environment or denied.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      speakVoice("Sensor error. Camera authorization unavailable.");
    }
  };

  // Set continuous voice mode state
  const handleToggleVoiceListener = () => {
    if (!voiceSupported) {
      alert("Spectral continuous audio receptor is not supported on this browser engine.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to boot speaker", err);
      }
    }
  };

  // Pin authentication
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPasscode === preferences.passcode || authPasscode === "3000") {
      setSystemState("dashboard");
      setAuthError("");
    } else {
      setAuthError("BIOMETRICS VERIFICATION MISMATCH");
      speakVoice("Access denied. Intruder alarm pre-loaded.");
    }
  };

  // Export Python sources
  const handleDownloadPyFile = (file: typeof pythonFiles[0]) => {
    const blob = new Blob([file.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save new action command
  const handleAddCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommandPhrase.trim()) return;

    const newCmd: CustomCommand = {
      phrase: customCommandPhrase.trim().toLowerCase(),
      actionType: customCommandType,
      payload: customCommandPayload.trim()
    };

    setPreferences(prev => ({
      ...prev,
      customCommands: [...prev.customCommands, newCmd]
    }));

    setCustomCommandPhrase("");
    setCustomCommandPayload("");
    speakVoice("Instruction parameters successfully cached into core synaptic memory, Sir.");
  };

  const handleRemoveCustomCommand = (idx: number) => {
    setPreferences(prev => ({
      ...prev,
      customCommands: prev.customCommands.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="min-h-screen sophisticated-bg text-slate-300 flex flex-col font-sans transition-all duration-700 relative overflow-hidden select-none">
      {/* Sci-fi matrix scanning particles backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.04)_0%,transparent_75%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/20 to-transparent pointer-events-none" />

      {/* --- MASTER COUNTDOWN协议 HUD OVERLAY --- */}
      {countdownMsg && (
        <div className="fixed inset-0 bg-[#020408]/95 z-50 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-8 rounded-2xl border ${preferences.themeColor === "red" ? "border-red-500/40" : "border-[#00e5ff]/40"} max-w-md bg-[#020408]/90 backdrop-blur-2xl shadow-xl`}
          >
            <Power className={`w-20 h-20 ${preferences.themeColor === "red" ? "text-red-500 animate-pulse" : "text-[#00e5ff] animate-spin"} mx-auto mb-6`} />
            <h1 className="text-2xl font-mono font-bold tracking-widest text-red-500 mb-2">SYSTEM WARNING PROTOCOL</h1>
            <p className="text-slate-400 font-mono text-sm mb-6">{countdownMsg}</p>
            <div className={`text-7xl font-mono font-bold ${getThemeClass("text")} animate-bounce mb-2`}>
              {countdownVal}
            </div>
            <p className="text-xs text-slate-500 font-mono">STAND BY SIR - COMPILING MAIN MODULE CYCLES</p>
          </motion.div>
        </div>
      )}

      {/* --- PHASE 1: SPLASH DIAGNOSTICS --- */}
      {systemState === "splash" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full ${getThemeClass("glass")} rounded-2xl p-8 space-y-8`}
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Spinning Arc Reactor */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 border-dashed ${preferences.themeColor === "red" ? "border-red-500/10" : "border-[#00e5ff]/10"} animate-[spin_20s_linear_infinite]`} />
                <div className={`absolute inset-2 rounded-full border ${preferences.themeColor === "red" ? "border-red-500/30" : "border-[#00e5ff]/30"} animate-[spin_8s_linear_infinite]`} />
                <div className={`absolute inset-4 rounded-full border-2 border-dashed ${preferences.themeColor === "red" ? "border-red-500/20" : "border-[#00e5ff]/20"} animate-[spin_5s_linear_infinite]`} />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${getThemeClass("reactor")}`}>
                  <Cpu className={`w-8 h-8 ${getThemeClass("text")} animate-pulse`} />
                </div>
              </div>
              <h1 className={`text-2xl font-mono font-bold tracking-widest ${getThemeClass("text")}`}>J.A.R.V.I.S.</h1>
              <p className="text-[10px] text-slate-500 tracking-wider mono uppercase">JUST A RATHER VERY INTELLIGENT SYSTEM</p>
            </div>

            {/* Neural Handshake Loading Status */}
            <div className="space-y-3">
              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${preferences.themeColor === "red" ? "from-red-600 to-red-400" : preferences.themeColor === "orange" ? "from-orange-600 to-orange-400" : "from-[#00e5ff] to-cyan-400"}`}
                  style={{ width: `${bootProgress}%` }}
                />
              </div>
              <div className={`flex justify-between text-xs font-mono ${getThemeClass("text")} opacity-80`}>
                <span>REACTION CORE SPEED: {bootProgress}%</span>
                <span>MAINFRAME SYNAPSE</span>
              </div>
            </div>

            {/* System Log Reader */}
            <div className={`bg-[#020408]/85 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2 font-mono text-[11px] ${getThemeClass("text")} opacity-90 leading-relaxed scrollbar-thin`}>
              {bootLogs.length === 0 && <span className="text-slate-500 animate-pulse">Engaging core thermal power relays...</span>}
              {bootLogs.map((log, idx) => (
                <div key={idx} className="flex space-x-2">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* --- PHASE 2: IMMERSIVE LOCK SCREEN --- */}
      {systemState === "auth" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full ${getThemeClass("glass")} rounded-2xl p-8 space-y-8`}
          >
            <div className="text-center space-y-2">
              <Shield className={`w-12 h-12 ${getThemeClass("text")} mx-auto animate-pulse`} />
              <h2 className="text-xl font-mono font-bold tracking-wider text-white uppercase">BIOMETRIC SECURITY GATE</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">INPUT CLEAR PASSCODE FOR SYMPATHETIC HANDSHAKE</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-mono uppercase tracking-wider ${getThemeClass("text")} opacity-80`}>CORE MATRIX ENTRY PASSPHRASE</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••"
                    value={authPasscode}
                    onChange={(e) => setAuthPasscode(e.target.value)}
                    className={`w-full bg-[#020408]/80 rounded-xl px-4 py-3 border ${preferences.themeColor === "red" ? "border-red-500/30 text-red-500 focus:border-red-400" : preferences.themeColor === "orange" ? "border-orange-500/30 text-orange-500 focus:border-orange-400" : "border-[#00e5ff]/30 text-cyan-400 focus:border-neon-cyan"} text-center text-xl tracking-widest focus:outline-none transition`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-slate-500 animate-pulse" />
                  </div>
                </div>
              </div>

              {authError && (
                <div className="text-center font-mono text-xs text-red-400 scale-95 transition-all">
                  ● ERROR: {authError}
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 ${preferences.themeColor === "red" ? "bg-red-600/10 hover:bg-red-600/25 border-red-500/35 text-red-400" : preferences.themeColor === "orange" ? "bg-orange-600/10 hover:bg-orange-600/25 border-orange-500/35 text-orange-400" : "bg-[#00e5ff]/10 hover:bg-[#00e5ff]/25 border-[#00e5ff]/35 text-[#00e5ff]"} border font-mono text-xs font-semibold rounded-xl tracking-widest transition flex items-center justify-center space-x-2`}
              >
                <span>VERIFY IDENTITY</span>
              </button>
            </form>

            <div className="text-center">
              <p className="text-[10px] text-slate-500 font-mono leading-normal">
                DEFAULT SECURITY OVERRIDE IS: <code className={`${getThemeClass("text")} font-bold`}>3000</code><br />
                (THE INTEGRATION KEY CHIP OF HEURISTIC LOGS)
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- PHASE 3: MAIN COGNITIVE HUD DASHBOARD --- */}
      {systemState === "dashboard" && (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 lg:p-6 space-y-6">
          
          {/* Top Hologram Command Bar */}
          <header className={`flex flex-col md:flex-row justify-between items-center ${getThemeClass("glass")} rounded-2xl p-4 gap-4`}>
            <div className="flex items-center space-x-3">
              <div className={`relative w-10 h-10 rounded-full border ${preferences.themeColor === "red" ? "border-red-400" : preferences.themeColor === "orange" ? "border-orange-400" : "border-[#00e5ff]"} flex items-center justify-center`}>
                <div className={`absolute inset-0 rounded-full border border-dashed ${preferences.themeColor === "red" ? "border-red-400/30" : preferences.themeColor === "orange" ? "border-orange-400/30" : "border-[#00e5ff]/30"} animate-spin`} />
                <Sparkles className={`w-5 h-5 ${getThemeClass("text")} animate-pulse`} />
              </div>
              <div>
                <h1 className="text-md font-mono font-bold tracking-widest text-slate-200">JARVIS COGNITIVE INTERFACE</h1>
                <p className={`text-[10px] ${getThemeClass("text")} opacity-80 font-mono`}>NODE COORD: 127.0.0.1 - STABLE PROTOCOL</p>
              </div>
            </div>

            {/* Simulated Status Indicators */}
            <div className="flex flex-wrap gap-4 items-center justify-center text-[10px] font-mono">
              <div className={`flex items-center space-x-2 bg-[#020408]/85 px-3 py-1.5 rounded-lg border ${preferences.themeColor === "red" ? "border-red-500/10" : preferences.themeColor === "orange" ? "border-orange-500/10" : "border-[#00e5ff]/10"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-400">BIO: tony_stark</span>
              </div>
              <div 
                className={`flex items-center space-x-2 bg-[#020408]/85 px-3 py-1.5 rounded-lg border transition duration-300 ${
                  satelliteStatus === "SECURE" 
                    ? (preferences.themeColor === "red" ? "border-red-500/10" : preferences.themeColor === "orange" ? "border-orange-500/10" : "border-[#00e5ff]/10") 
                    : satelliteStatus === "LIMITED" 
                    ? "border-amber-500/30" 
                    : "border-red-500/30"
                }`}
                title={
                  satelliteStatus === "SECURE" 
                    ? "Satellite link active" 
                    : satelliteStatus === "LIMITED" 
                    ? "Upstream rate throttling, backup protocol live" 
                    : "Satellite offline, using local synapse engine"
                }
              >
                <Globe className={`w-3.5 h-3.5 animate-pulse ${
                  satelliteStatus === "SECURE" 
                    ? getThemeClass("text") 
                    : satelliteStatus === "LIMITED" 
                    ? "text-amber-400" 
                    : "text-red-500"
                }`} />
                <span className={
                  satelliteStatus === "SECURE"
                    ? "text-slate-400"
                    : satelliteStatus === "LIMITED"
                    ? "text-amber-400"
                    : "text-red-400 font-bold"
                }>
                  SAT STAT: {satelliteStatus}
                </span>
              </div>
              <div className={`flex items-center space-x-2 bg-[#020408]/85 px-3 py-1.5 rounded-lg border ${preferences.themeColor === "red" ? "border-red-500/10" : preferences.themeColor === "orange" ? "border-orange-500/10" : "border-[#00e5ff]/10"}`}>
                <Cpu className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span className="text-slate-400">TEMP: {telemetry.coreTemp}°C</span>
              </div>
              <button 
                onClick={() => setSystemState("auth")}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition"
                title="Lock Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Secondary Core Dynamic Navigation */}
          <nav className={`flex space-x-2 bg-[#020408]/20 p-1.5 rounded-xl border ${preferences.themeColor === "red" ? "border-red-500/10" : preferences.themeColor === "orange" ? "border-orange-500/10" : "border-[#00e5ff]/10"} overflow-x-auto scrollbar-none`}>
            {[
              { id: "hud", label: "TACTICAL HUD", icon: Layers },
              { id: "replicator", label: "CORE REPLICATOR", icon: Code },
              { id: "stats", label: "TELEMETRY STATS", icon: Radio },
              { id: "settings", label: "MEMORY DECRYPT", icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 text-[11px] font-mono tracking-wider font-medium rounded-lg transition-all ${
                    isActive 
                      ? (preferences.themeColor === "red" ? "bg-red-500/15 border border-red-500/40 text-red-400 font-bold" : preferences.themeColor === "orange" ? "bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold" : "bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] font-bold") 
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#020408]/40"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? getThemeClass("text") : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* MAIN GRAPHICS VIEWPORTS */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left side controller frame */}
            <main className="lg:col-span-8 space-y-6 flex flex-col justify-between">

              {/* TABS VIEW CONTROLLERS */}

              {/* --- TAB 1: TACTICAL HUD CONTROLS --- */}
              {activeTab === "hud" && (
                <div className="space-y-6 flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Glowing circular reactor element */}
                    <div className={`md:col-span-5 ${getThemeClass("glass")} rounded-2xl p-6 flex flex-col items-center justify-center space-y-4`}>
                      <h3 className={`text-xs font-mono font-semibold tracking-widest ${getThemeClass("text")}`}>THERMOPLASTIC REACTOR ARC</h3>
                      
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full border-4 border-dashed ${preferences.themeColor === "red" ? "border-red-500/10" : preferences.themeColor === "orange" ? "border-orange-500/10" : "border-[#00e5ff]/10"} animate-[spin_25s_linear_infinite]`} />
                        <div className={`absolute inset-3 rounded-full border ${preferences.themeColor === "red" ? "border-red-400/40" : preferences.themeColor === "orange" ? "border-orange-400/40" : "border-[#00e5ff]/40"} animate-[spin_6s_linear_infinite]`} />
                        <div className={`absolute inset-6 rounded-full border-4 border-dashed ${preferences.themeColor === "red" ? "border-red-500/10" : preferences.themeColor === "orange" ? "border-orange-500/10" : "border-[#00e5ff]/10"} animate-[spin_10s_linear_infinite]`} />
                        <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 ${getThemeClass("reactor")}`}>
                          <Cpu className={`w-8 h-8 ${getThemeClass("text")} animate-bounce`} />
                          <span className={`text-[10px] font-mono ${getThemeClass("text")} font-bold mt-1 tracking-widest`}>
                            {telemetry.cpu}% CORE
                          </span>
                        </div>
                      </div>

                      <div className="text-center font-mono">
                        <p className="text-[11px] text-slate-400">HEURISTIC FLOW STABILITY</p>
                        <p className="text-xs font-bold text-emerald-400">GRID SECURE [99.4%]</p>
                      </div>
                    </div>

                    {/* Biometric webcam stream canvas */}
                    <div className={`md:col-span-7 ${getThemeClass("glass")} rounded-2xl p-6 flex flex-col justify-between space-y-4 relative min-h-[220px]`}>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className={`text-xs font-mono font-semibold tracking-widest ${getThemeClass("text")} flex items-center space-x-1.5`}>
                          <Camera className="w-4 h-4" />
                          <span>HOLOGRAPHIC BIOMETRIC EYE SCANNER</span>
                        </h3>
                        {cameraAccess && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-mono animate-pulse">
                            ● SPECTRAL LIVE
                          </span>
                        )}
                      </div>

                      {/* Video feedback layer */}
                      <div className="flex-1 bg-black/95 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center aspect-video max-h-[180px] w-full mx-auto">
                        {!cameraAccess ? (
                          <div className="text-center p-4">
                            <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                            <p className="text-xs font-mono text-slate-400 mb-2">Webcam visualizer offline.</p>
                            <button
                              onClick={handleCameraInit}
                              className={`px-3 py-1.5 ${preferences.themeColor === "red" ? "bg-red-600/10 hover:bg-red-600/25 border-red-500/40 text-red-400" : preferences.themeColor === "orange" ? "bg-orange-600/10 hover:bg-orange-600/25 border-orange-500/40 text-orange-400" : "bg-[#00e5ff]/10 hover:bg-[#00e5ff]/25 border-neon-cyan/40 text-neon-cyan"} border text-[10px] font-mono rounded-lg transition`}
                            >
                              ACTIVATE BIOMETRIC MATRIX
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-full relative">
                            {/* Hidden video node for tracking */}
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className="hidden" 
                            />
                            {/* Rendered graphics overlay canvas */}
                            <canvas 
                              ref={canvasRef} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>EYE RESOLUTION: 640x480</span>
                        <span>FACE RECOGNITION LOCK: CACHED</span>
                      </div>
                    </div>

                  </div>

                         {/* Synthetic Image Display Matrix if generated */}
                  {generatedImg && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${getThemeClass("glass")} rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4`}
                    >
                      <img 
                        src={generatedImg} 
                        alt="Jarvis output raster" 
                        className={`w-32 h-32 rounded-lg border ${preferences.themeColor === "red" ? "border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : preferences.themeColor === "orange" ? "border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]" : "border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]"} shrink-0 object-cover`}
                      />
                      <div className="space-y-2">
                        <span className={`text-[10px] ${getThemeClass("text")} font-mono font-bold uppercase tracking-widest`}>SYNTHETIC OUTPUT RASTER</span>
                        <p className="text-xs font-mono text-slate-300">Generated concept schematic is fully rasterized onto the dashboard HUD canvas.</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = generatedImg;
                              a.download = "jarvis_raster_schematic.png";
                              a.click();
                            }}
                            className={`px-3 py-1 ${preferences.themeColor === "red" ? "bg-red-600/10 hover:bg-red-600/25 border-red-500/30 text-red-500" : preferences.themeColor === "orange" ? "bg-orange-600/10 hover:bg-orange-600/25 border-orange-500/30 text-orange-500" : "bg-[#00e5ff]/10 hover:bg-[#00e5ff]/25 border-[#00e5ff]/30 text-cyan-400"} rounded text-[10px] font-mono transition`}
                          >
                            DOWNLOAD RASTER
                          </button>
                          <button
                            onClick={() => setGeneratedImg(null)}
                            className="px-3 py-1 bg-red-950/20 hover:bg-red-950/45 border border-red-500/20 rounded text-[10px] font-mono text-red-400 transition"
                          >
                            QUARANTINE FILE
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Core Jarvis automation controls widgets */}
                  <div className={`${getThemeClass("glass")} rounded-2xl p-6 space-y-4`}>
                    <h3 className={`text-xs font-mono font-semibold tracking-widest ${getThemeClass("text")} border-b border-white/5 pb-2 flex items-center space-x-2`}>
                      <ListRestart className={`w-4 h-4 ${getThemeClass("text")} animate-[spin_5s_linear_infinite]`} />
                      <span>AUTOMATION CONTROL MATRIX PROTOCOL</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <button 
                        onClick={() => executeSystemAction({ action: "OPEN_WEBSITE", url: "https://youtube.com" }, "Opening Youtube")}
                        className={`bg-[#020408]/80 ${preferences.themeColor === "red" ? "hover:bg-red-950/10 hover:border-red-400" : preferences.themeColor === "orange" ? "hover:bg-orange-950/10 hover:border-orange-400" : "hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]"} p-4 rounded-xl border border-white/5 text-center transition group`}
                      >
                        <Globe className={`w-6 h-6 ${getThemeClass("text")} mx-auto mb-2 group-hover:scale-110 transition`} />
                        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">OPEN BROWSER</span>
                      </button>

                      <button 
                        onClick={() => executeSystemAction({ action: "CAPTURE_SCREENSHOT" }, "Rasterizing overlay")}
                        className={`bg-[#020408]/80 ${preferences.themeColor === "red" ? "hover:bg-red-950/10 hover:border-red-400" : preferences.themeColor === "orange" ? "hover:bg-orange-950/10 hover:border-orange-400" : "hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]"} p-4 rounded-xl border border-white/5 text-center transition group`}
                      >
                        <Layers className="w-6 h-6 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">HUD DIAGNOSTICS</span>
                      </button>

                      <button 
                        onClick={() => executeSystemAction({ action: "SYSTEM_VOLUME", percent: 80 }, "Setting decibels")}
                        className={`bg-[#020408]/80 ${preferences.themeColor === "red" ? "hover:bg-red-950/10 hover:border-red-400" : preferences.themeColor === "orange" ? "hover:bg-orange-950/10 hover:border-orange-400" : "hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]"} p-4 rounded-xl border border-white/5 text-center transition group`}
                      >
                        <Volume2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">SONIC AMPLIFY</span>
                      </button>

                      <button 
                        onClick={() => executeSystemAction({ action: "SHUTDOWN" }, "Initiating lockdowns")}
                        className={`bg-[#020408]/80 hover:bg-red-950/20 p-4 rounded-xl border border-white/5 hover:border-red-500/40 text-center transition group`}
                      >
                        <Power className="w-6 h-6 text-red-400 mx-auto mb-2 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">LOCK PROTOCOLS</span>
                      </button>

                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: LOCAL PYTHON CORE EXPORTER --- */}
              {activeTab === "replicator" && (
                <div className={`${getThemeClass("glass")} rounded-2xl p-6 space-y-6 flex-1 flex flex-col`}>
                  
                  <div className="flex flex-col space-y-2 border-b border-white/5 pb-4">
                    <h2 className="text-md font-mono font-bold tracking-wider text-slate-200">LOCAL JARVIS PYTHON CORE REPLICATOR</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sir, you can download or inspect the production-grade Python desktop helper scripts below. Running this locally on your operating system provides continuous physical microphone listeners, Selenium automation, and PyAutoGUI interface triggers seamlessly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
                    
                    {/* Left File selection HUD */}
                    <div className="md:col-span-4 space-y-2 max-h-[400px] overflow-y-auto">
                      {pythonFiles.map((file, idx) => (
                        <button
                          key={file.name}
                          onClick={() => setSelectedPyFile(idx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition flex justify-between items-center ${
                            selectedPyFile === idx 
                              ? (preferences.themeColor === "red" ? "bg-red-600/15 border-red-500 text-red-400 font-bold" : preferences.themeColor === "orange" ? "bg-orange-600/15 border-orange-500 text-orange-400 font-bold" : "bg-[#00e5ff]/15 border-neon-cyan text-cyan-400 font-bold") 
                              : "bg-[#020408]/80 border-white/5 text-slate-400 hover:bg-slate-900/30"
                          }`}
                        >
                          <div className="space-y-1">
                            <div>/{file.path}</div>
                            <div className="text-[9px] text-slate-500 no-bold truncate max-w-[140px]">{file.description}</div>
                          </div>
                          <Cpu className="w-4 h-4 shrink-0" />
                        </button>
                      ))}
                    </div>

                    {/* Right File reader and operations */}
                    <div className="md:col-span-8 flex flex-col justify-between bg-[#020408]/80 rounded-xl border border-white/5 p-4 space-y-3">
                      <div className={`flex justify-between items-center border-b border-white/5 pb-2 text-xs font-mono ${getThemeClass("text")}`}>
                        <span>FILE NODE: /{pythonFiles[selectedPyFile].path}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(pythonFiles[selectedPyFile].code);
                              setCopiedIndex(selectedPyFile);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 hover:bg-white/5 border border-white/10 rounded text-[10px] font-mono transition text-slate-300"
                          >
                            {copiedIndex === selectedPyFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedIndex === selectedPyFile ? "COPIED" : "COPY CODE"}</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPyFile(pythonFiles[selectedPyFile])}
                            className={`flex items-center space-x-1.5 px-2 py-1 ${preferences.themeColor === "red" ? "bg-red-600/15 text-red-400 border-red-500/30" : preferences.themeColor === "orange" ? "bg-orange-600/15 text-orange-400 border-orange-500/30" : "bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30"} hover:opacity-80 border rounded text-[10px] font-mono transition`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>DOWNLOAD</span>
                          </button>
                        </div>
                      </div>

                      {/* Code Block viewport */}
                      <pre className="flex-1 bg-[#010309] rounded-lg p-3 overflow-auto max-h-[290px] font-mono text-[10px] text-emerald-400/90 leading-normal border border-white/5 scrollbar-thin">
                        <code>{pythonFiles[selectedPyFile].code}</code>
                      </pre>

                      <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-[10px] font-mono text-slate-400 leading-normal space-y-1">
                        <span className={`font-bold ${getThemeClass("text")}`}>REPLICATOR DEPLOY GUIDE:</span>
                        <p>1. Open operating system terminal, setup environment: <code className="text-emerald-400">pip install speechrecognition pyttsx3 pyautogui selenium sqlite3</code></p>
                        <p>2. Paste and preserve paths folder grid inside computer directories then execute: <code className="text-emerald-400">python main.py</code></p>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* --- TAB 3: SYSTEM TELEMETRY DIAGNOSTICS --- */}
              {activeTab === "stats" && (
                <div className={`${getThemeClass("glass")} rounded-2xl p-6 space-y-6 flex-1 flex flex-col`}>
                  
                  <div className="flex flex-col space-y-2 border-b border-white/5 pb-4">
                    <h2 className="text-md font-mono font-bold tracking-wider text-slate-200">JARVIS CORE SENSORS & SYSTEM DIAGNOSTICS</h2>
                    <p className="text-xs text-slate-400">
                      Live structural charts displaying sub-processor frequencies, thermal outputs, internet latency arrays and background processes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* CPU Sensor */}
                    <div className={`bg-[#020408]/85 p-4 rounded-xl border border-white/5 hover:border-${preferences.themeColor === 'red' ? 'red-500/40' : preferences.themeColor === 'orange' ? 'orange-500/40' : '[#00e5ff]/40'} transition relative`}>
                      <span className={`text-[10px] font-mono ${getThemeClass("text")} block mb-1`}>COGNITIVE COMPLEX LOBES</span>
                      <div className="text-3xl font-mono font-bold text-slate-100">{telemetry.cpu}%</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1">FREQ: 4.87 GHz [STABLE]</div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                        <div className={`h-full transition-all duration-500 ${preferences.themeColor === 'red' ? 'bg-red-500' : preferences.themeColor === 'orange' ? 'bg-orange-500' : 'bg-[#00e5ff]'}`} style={{ width: `${telemetry.cpu}%` }} />
                      </div>
                    </div>

                    {/* RAM Sensor */}
                    <div className={`bg-[#020408]/85 p-4 rounded-xl border border-white/5 hover:border-${preferences.themeColor === 'red' ? 'red-500/40' : preferences.themeColor === 'orange' ? 'orange-500/40' : '[#00e5ff]/40'} transition`}>
                      <span className={`text-[10px] font-mono ${getThemeClass("text")} block mb-1`}>SYNAPTIC ALLOCATION INDEX</span>
                      <div className="text-3xl font-mono font-bold text-slate-100">{telemetry.ram}%</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1">ALLOC: 14.2 / 32 GB CACHED</div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                        <div className={`h-full transition-all duration-500 ${preferences.themeColor === 'red' ? 'bg-red-500' : preferences.themeColor === 'orange' ? 'bg-orange-500' : 'bg-[#00e5ff]'}`} style={{ width: `${telemetry.ram}%` }} />
                      </div>
                    </div>

                    {/* Network speed / satellite links */}
                    <div className={`bg-[#020408]/85 p-4 rounded-xl border border-white/5 hover:border-${preferences.themeColor === 'red' ? 'red-500/40' : preferences.themeColor === 'orange' ? 'orange-500/40' : '[#00e5ff]/40'} transition`}>
                      <span className={`text-[10px] font-mono ${getThemeClass("text")} block mb-1`}>SATELLITE BANDWIDTH STREAM</span>
                      <div className="text-2xl font-mono font-bold text-slate-100">{telemetry.internetSpeed}</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1">GRID RANGE: GEO-STATIONARY [OK]</div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                        <div className={`h-full transition-all duration-500 ${preferences.themeColor === 'red' ? 'bg-red-500' : preferences.themeColor === 'orange' ? 'bg-orange-500' : 'bg-[#00e5ff]'}`} style={{ width: "85%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Active cyber process list logs */}
                  <div className="bg-[#020408]/85 rounded-xl border border-white/5 p-4 flex-1 flex flex-col justify-between">
                    <div className={`text-xs font-mono ${getThemeClass("text")} border-b border-white/5 pb-2 mb-2 uppercase`}>
                      ACTIVE BACKGROUND PROCESS SHIELD INDEX
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto font-mono text-[10px] text-slate-300">
                      {telemetry.activeProcesses.map((proc, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 hover:bg-slate-900 px-1 rounded transition">
                          <code className="text-emerald-400">PID_{(3421 + idx * 821)}: {proc}</code>
                          <span className={`${getThemeClass("text")}`}>CONSUMING: {(idx * 1.5 + 4).toFixed(1)}W</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* --- TAB 4: SETTINGS & GENERAL MEMORY DECRYPT --- */}
              {activeTab === "settings" && (
                <div className={`${getThemeClass("glass")} rounded-2xl p-6 space-y-6 flex-1 flex flex-col max-h-[600px] overflow-y-auto scrollbar-thin`}>
                  
                  <div className="flex flex-col space-y-2 border-b border-white/5 pb-4">
                    <h2 className="text-md font-mono font-bold tracking-wider text-slate-200">JARVIS PERSISTIST REPREVENTIVES & MEMORY PROTOCOLS</h2>
                    <p className="text-xs text-slate-400">
                      Alter the assistant biometric protocols, user identity labels, passcode overrides, and cash custom commands.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Change profile name / passcode */}
                    <div className="bg-[#020408]/85 p-4 rounded-xl border border-white/5 space-y-4">
                      <span className={`text-xs font-mono font-bold block border-b border-white/5 pb-2 uppercase ${getThemeClass("text")}`}>
                        BIOMETRIC COGNITIVE IDENTITY
                      </span>
                      
                      <div className="space-y-2 text-xs font-mono">
                        <label className="text-slate-400">SUBJECT DIRECTIVE USERNAME</label>
                        <input
                          type="text"
                          value={preferences.userName}
                          onChange={(e) => setPreferences(prev => ({ ...prev, userName: e.target.value }))}
                          className="w-full bg-slate-950 rounded-lg px-3 py-2 border border-white/10 text-slate-100 focus:outline-none focus:border-white/20 font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <label className="text-slate-400">LOCKSCREEN SECURITY PIN</label>
                        <input
                          type="password"
                          value={preferences.passcode}
                          onChange={(e) => setPreferences(prev => ({ ...prev, passcode: e.target.value }))}
                          className="w-full bg-slate-950 rounded-lg px-3 py-2 border border-white/10 text-slate-100 focus:outline-none focus:border-white/20 font-mono text-xs tracking-widest text-center"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2">
                        <div className="space-y-2">
                          <label className="text-slate-400 block">THEME GLOW</label>
                          <select 
                            value={preferences.themeColor}
                            onChange={(e) => setPreferences(prev => ({ ...prev, themeColor: e.target.value }))}
                            className="bg-slate-950 border border-white/10 rounded-lg p-2 text-slate-300 w-full font-mono text-xs focus:outline-none focus:border-white/20"
                          >
                            <option value="cyan">CYAN GRID</option>
                            <option value="orange">ORANGE SOLAR</option>
                            <option value="red">RED PROTOCOL</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-slate-400 block">THERMO CORE SPEED</label>
                          <select 
                            value={preferences.reactorSpeed}
                            onChange={(e) => setPreferences(prev => ({ ...prev, reactorSpeed: e.target.value as any }))}
                            className="bg-slate-950 border border-white/10 rounded-lg p-2 text-slate-300 w-full font-mono text-xs focus:outline-none focus:border-white/20"
                          >
                            <option value="normal">BALANCED (1.0X)</option>
                            <option value="rapid">HYPER RAPID (1.5X)</option>
                            <option value="steady">STEADY SLOW (0.8X)</option>
                          </select>
                        </div>
                      </div>

                    </div>

                    {/* Stark Neural TTS Voice Actor Controls */}
                    <div className="bg-[#020408]/85 p-4 rounded-xl border border-white/5 space-y-4">
                      <span className={`text-xs font-mono font-bold block border-b border-white/5 pb-2 uppercase ${getThemeClass("text")}`}>
                        STARK INTEGRATED VOCAL CHORDS (JARVIS AUDIO)
                      </span>

                      <div className="space-y-4 text-xs font-mono">
                        <div className="space-y-2">
                          <label className="text-slate-400 block">VOCAL COMPILATION ENGINE</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPreferences(prev => ({ ...prev, voiceMode: "premium" }))}
                              className={`py-2 px-3 border rounded-lg transition font-mono text-[10px] uppercase font-semibold ${
                                preferences.voiceMode === "premium"
                                  ? (preferences.themeColor === "red" ? "bg-red-600/20 border-red-500 text-red-00 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]" : preferences.themeColor === "orange" ? "bg-orange-600/20 border-orange-500 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]" : "bg-[#00e5ff]/20 border-neon-cyan text-neon-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]")
                                  : "bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-900"
                              }`}
                            >
                              PREMIUM NEURAL
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferences(prev => ({ ...prev, voiceMode: "standard" }))}
                              className={`py-2 px-3 border rounded-lg transition font-mono text-[10px] uppercase font-semibold ${
                                preferences.voiceMode === "standard"
                                  ? (preferences.themeColor === "red" ? "bg-red-600/20 border-red-500 text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]" : preferences.themeColor === "orange" ? "bg-orange-600/20 border-orange-500 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]" : "bg-[#00e5ff]/20 border-neon-cyan text-neon-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]")
                                  : "bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-900"
                              }`}
                            >
                              CLIENT-SIDE
                            </button>
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">
                            Premium compiles speech using advanced cinematic AI. Client-side speaks via local hardware.
                          </span>
                        </div>

                        {/* Gender Selector Button Group */}
                        <div className="space-y-2">
                          <label className="text-slate-400 block">VOCAL GENDER PROTOCOL</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPreferences(prev => ({ 
                                ...prev, 
                                vocalGender: "male", 
                                vocalVoice: prev.vocalVoice === "Kore" ? "Fenrir" : prev.vocalVoice 
                              }))}
                              className={`py-2 px-3 border rounded-lg transition font-mono text-[10px] uppercase font-semibold ${
                                preferences.vocalGender === "male"
                                  ? (preferences.themeColor === "red" ? "bg-red-600/20 border-red-500 text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]" : preferences.themeColor === "orange" ? "bg-orange-600/20 border-orange-500 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]" : "bg-[#00e5ff]/20 border-neon-cyan text-neon-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]")
                                  : "bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-900"
                              }`}
                            >
                              MALE (JARVIS)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreferences(prev => ({ 
                                ...prev, 
                                vocalGender: "female", 
                                vocalVoice: prev.vocalVoice !== "Kore" ? "Kore" : prev.vocalVoice
                              }))}
                              className={`py-2 px-3 border rounded-lg transition font-mono text-[10px] uppercase font-semibold ${
                                preferences.vocalGender === "female"
                                  ? (preferences.themeColor === "red" ? "bg-red-600/20 border-red-500 text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]" : preferences.themeColor === "orange" ? "bg-orange-600/20 border-orange-500 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]" : "bg-[#00e5ff]/20 border-neon-cyan text-neon-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]")
                                  : "bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-900"
                              }`}
                            >
                              FEMALE (FRIDAY)
                            </button>
                          </div>
                        </div>

                        {/* Accent/Language Selector */}
                        <div className="space-y-2">
                          <label className="text-slate-400 block">SPECIALIZED ACCENT & FLUENCY</label>
                          <select
                            value={preferences.vocalAccent}
                            onChange={(e) => setPreferences(prev => ({ ...prev, vocalAccent: e.target.value as any }))}
                            className="bg-slate-950 border border-white/10 rounded-lg p-2 text-slate-300 w-full font-mono text-xs focus:outline-none focus:border-white/20"
                          >
                            <option value="british">🇬🇧 BRITISH: Deep, Smooth & Cinematic (Aristocratic)</option>
                            <option value="hindi">🇮🇳 HINDI: Fluent Native Conversation & Perfect Tone</option>
                            <option value="indian_english">🇮🇳 HINGLISH: Realistic Indian-English Accent</option>
                            <option value="american">🇺🇸 AMERICAN: Sleek Modern Digital Assistant</option>
                          </select>
                        </div>

                        {preferences.voiceMode === "premium" && (
                          <div className="space-y-2">
                            <label className="text-slate-400 block">ADVANCED NEURAL AUDIO SEED</label>
                            <select
                              value={preferences.vocalVoice}
                              onChange={(e) => setPreferences(prev => ({ ...prev, vocalVoice: e.target.value as any }))}
                              className="bg-slate-950 border border-white/10 rounded-lg p-2 text-slate-300 w-full font-mono text-xs focus:outline-none focus:border-white/20"
                            >
                              <option value="Fenrir">FENRIR: Male, Deep & Cinematic (JARVIS Recommended)</option>
                              <option value="Charon">CHARON: Male, Sleek & Confident</option>
                              <option value="Kore">KORE: Female, Refined & Intelligent (FRIDAY Recommended)</option>
                              <option value="Zephyr">ZEPHYR: Male, Futuristic & Warm</option>
                              <option value="Puck">PUCK: Male, Energetic & Direct</option>
                            </select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-slate-400 flex justify-between">
                            <span>STARK AUDIO AMPLITUDE VOLUME</span>
                            <span className={getThemeClass("text")}>{(preferences.voiceVolume * 100).toFixed(0)}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={preferences.voiceVolume}
                            onChange={(e) => setPreferences(prev => ({ ...prev, voiceVolume: parseFloat(e.target.value) }))}
                            className={`w-full accent-${preferences.themeColor === "red" ? "red-500" : preferences.themeColor === "orange" ? "orange-500" : "cyan-400"}`}
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => speakVoice("Vocal system optimization complete. Acoustic sensors calibrated for Tony Stark.")}
                          className={`w-full py-2 bg-slate-950 text-[10px] tracking-wider uppercase border border-white/10 text-slate-300 hover:bg-slate-900 font-mono font-bold rounded-lg transition active:scale-95`}
                        >
                          TEST VOCAL FREQUENCIES
                        </button>
                      </div>
                    </div>

                    {/* Synthesize custom vocals commands mappings */}
                    <div className="bg-[#020408]/85 p-4 rounded-xl border border-white/5 space-y-4">
                      <span className={`text-xs font-mono font-bold block border-b border-white/5 pb-2 uppercase ${getThemeClass("text")}`}>
                        CACHE DUST VOCAL COMMAND COGNITIVE MEMORY
                      </span>

                      <form onSubmit={handleAddCustomCommand} className="space-y-3 text-xs font-mono">
                        <div className="space-y-1">
                          <label className="text-slate-400 text-[10px]">WHEN I VOCALLY COMMAND JARVIS:</label>
                          <input
                            type="text"
                            placeholder="e.g., engage thrusters"
                            value={customCommandPhrase}
                            onChange={(e) => setCustomCommandPhrase(e.target.value)}
                            className="w-full bg-slate-950 rounded-lg p-2 border border-white/10 text-slate-100"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px]">EXECUTE ROUTING ACTION:</label>
                            <select
                              value={customCommandType}
                              onChange={(e) => setCustomCommandType(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-slate-300 font-mono text-xs focus:outline-none"
                            >
                              <option value="OPEN_WEBSITE">OPEN WEBSITE URL</option>
                              <option value="PLAY_MUSIC">PLAY SONIC MUSIC</option>
                              <option value="SEARCH_GOOGLE">SEARCH GOOGLE STR</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px]">TARGET/PAYLOAD STRING:</label>
                            <input
                              type="text"
                              placeholder="e.g., https://gmail.com"
                              value={customCommandPayload}
                              onChange={(e) => setCustomCommandPayload(e.target.value)}
                              className="w-full bg-slate-950 rounded-lg p-2 border border-white/10 text-slate-100 focus:outline-none focus:border-white/20 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className={`w-full py-2 ${preferences.themeColor === "red" ? "bg-red-600/10 hover:bg-red-600/25 border-red-500/40 text-red-400" : preferences.themeColor === "orange" ? "bg-orange-600/10 hover:bg-orange-600/25 border-orange-500/40 text-orange-400" : "bg-[#00e5ff]/10 hover:bg-[#00e5ff]/25 border-neon-cyan/40 text-neon-cyan"} border font-mono text-[11px] font-bold rounded-lg transition`}
                        >
                          CACHE SYNAPSE COMMAND
                        </button>
                      </form>

                    </div>

                  </div>

                  {/* Commands listing list */}
                  <div className="bg-[#020408]/85 p-4 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">REGISTERED SYMPATHETIC VOCAL COMMAND COHORTS</span>
                    {preferences.customCommands.length === 0 ? (
                      <div className="text-xs font-mono text-slate-500 text-center py-4">No custom vocally mapped synap-commands found.</div>
                    ) : (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {preferences.customCommands.map((cmd, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-[#020408]/50 p-2.5 rounded-lg border border-white/5 text-xs font-mono text-slate-300">
                            <div>
                              <span>Command phrase: <code className={getThemeClass("text")}>"{cmd.phrase}"</code></span>
                              <span className="text-slate-500 mx-2">→</span>
                              <span className="text-slate-400">{cmd.actionType}: {cmd.payload}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveCustomCommand(idx)}
                              className="text-red-400 hover:text-red-200 hover:bg-red-950/20 px-2 py-0.5 rounded transition font-mono text-[11px]"
                            >
                              DELETE
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Glowing decorative wave lines inside bottom grid panel */}
              <div className={`${getThemeClass("glass")} rounded-2xl p-4 space-y-2 flex flex-col items-center justify-center relative overflow-hidden`}>
                <span className={`text-[10px] font-mono tracking-wider font-semibold ${getThemeClass("text")}`}>
                  {isListening ? "AUDIO SENSORY RADAR: ENGAGED & CONTINUOUS" : "AWAITING SONIC COMMANDEER OVERLAYS"}
                </span>
                
                <canvas 
                  ref={waveCanvasRef} 
                  height={44} 
                  className="w-full max-w-xl mx-auto block pointer-events-none rounded"
                />

                {voiceInterim && (
                  <span className="text-[11px] font-mono text-emerald-400 animate-pulse tracking-wide mt-1 italic">
                    ● SPEECH INTERIM DECRYPTION: "{voiceInterim}"
                  </span>
                )}
              </div>

            </main>

            {/* Right side artificial intelligence chat grid terminal panel */}
            <aside className={`lg:col-span-4 ${getThemeClass("glass")} flex flex-col overflow-hidden max-h-[720px] lg:max-h-none justify-between`}>
              
              <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0 bg-white/[0.02]">
                <div className="flex items-center space-x-2">
                  <TermIcon className={`w-4 h-4 ${getThemeClass("text")} animate-pulse`} />
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-200">JARVIS CORE TERMINAL</span>
                </div>
                <button
                  onClick={() => setMessages([
                    {
                      id: "init",
                      role: "assistant",
                      content: "Chat history overridden and recycled, Sir. Ready to execute dynamic equations.",
                      timestamp: new Date().toLocaleTimeString()
                    }
                  ])}
                  className={`text-[9px] font-mono text-slate-500 hover:${preferences.themeColor === "red" ? "text-red-400" : preferences.themeColor === "orange" ? "text-orange-400" : "text-[#00e5ff]"} hover:bg-slate-950 px-2 py-1 rounded transition border border-white/5 duration-300`}
                >
                  RECYCLE LOGS
                </button>
              </div>

              {/* Conversation list viewport */}
              <div 
                ref={chatScrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs leading-relaxed max-h-[440px] lg:max-h-[500px] scrollbar-thin"
              >
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col space-y-1 ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex space-x-2 text-[9px] text-slate-500 mr-1 ml-1">
                        <span>{isUser ? preferences.userName.toUpperCase() : "JARVIS CORE"}</span>
                        <span>●</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div 
                        className={`p-3 rounded-2xl max-w-[85%] border leading-relaxed break-words shadow-md ${
                          isUser 
                            ? (preferences.themeColor === "red" ? "bg-red-600/10 border-red-500/20 text-red-300 rounded-tr-none" : preferences.themeColor === "orange" ? "bg-orange-600/10 border-orange-500/20 text-orange-300 rounded-tr-none" : "bg-[#00e5ff]/15 border-neon-cyan/25 text-[#00e5ff]/90 rounded-tr-none") 
                            : "bg-[#020408]/70 border-white/5 rounded-tl-none text-slate-300"
                        }`}
                      >
                        {/* Dynamic Markdown renderer inside terminal log */}
                        <div className="whitespace-pre-wrap font-mono leading-relaxed text-[11px]">
                          {msg.content.replace(/```jarvis-action:json[\s\S]*?```/g, "").trim()}
                        </div>

                        {/* Rendering executable triggers info boxes if available */}
                        {msg.action && (
                          <div className={`mt-3.5 pt-2.5 border-t border-white/5 flex items-center space-x-2 text-[10px] ${getThemeClass("text")} font-mono italic`}>
                            <Radio className="w-3.5 h-3.5 text-orange-400 animate-ping" />
                            <span>System auto-action: "{msg.action.action}" interpreted successfully.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isAiLoading && (
                  <div className="flex flex-col space-y-1 items-start">
                    <span className={`text-[9px] ${getThemeClass("text")} font-mono animate-pulse`}>Decrypting synaptic data cores... Sir</span>
                    <div className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 max-w-[85%] rounded-tl-none">
                      <div className="flex space-x-1.5 justify-center items-center py-1">
                        <span className={`w-1.5 h-1.5 ${preferences.themeColor === "red" ? "bg-red-400" : preferences.themeColor === "orange" ? "bg-orange-400" : "bg-[#00e5ff]"} rounded-full animate-bounce [animation-delay:-0.3s]`} />
                        <span className={`w-1.5 h-1.5 ${preferences.themeColor === "red" ? "bg-red-400" : preferences.themeColor === "orange" ? "bg-orange-400" : "bg-[#00e5ff]"} rounded-full animate-bounce [animation-delay:-0.15s]`} />
                        <span className={`w-1.5 h-1.5 ${preferences.themeColor === "red" ? "bg-red-400" : preferences.themeColor === "orange" ? "bg-orange-400" : "bg-[#00e5ff]"} rounded-full animate-bounce`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat action text area and Continuous voice control sensors */}
              <div className="p-4 border-t border-white/5 space-y-3 shrink-0 bg-white/[0.01]">
                
                {/* Visual recommendations helper cards */}
                <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[9px] font-mono">
                  {[
                    "Search Google for space science breakthroughs",
                    "Synthesize image of Iron Man Arc design concept",
                    "Open YouTube and search for Lo-Fi ambient coding",
                    "Engage master environmental lockdown protocol"
                  ].map((tip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChatInput(tip)}
                      className="px-2.5 py-1.5 bg-[#020408]/90 text-slate-400 hover:text-white border border-white/5 hover:border-white/10 rounded-lg whitespace-nowrap transition font-mono"
                    >
                      {tip}
                    </button>
                  ))}
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitChatMessage(chatInput);
                  }} 
                  className="flex space-x-2 py-1 items-center"
                >
                  {/* Vocal trigger toggles */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceListener}
                    className={`p-3 rounded-full border transition flex items-center justify-center relative shrink-0 ${
                      isListening
                        ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                        : "bg-slate-950/90 border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5"
                    }`}
                    title={isListening ? "Pause microphone ears" : "Continuously listen via microphone"}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={isListening ? 'Continuously listening for wakeword "Jarvis" or commands...' : "Submit text prompt, code request..."}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full bg-[#020408]/90 rounded-xl pl-4 pr-10 py-3 border border-white/10 hover:border-white/20 focus:outline-none focus:border-white/30 font-mono text-[11px] text-slate-200 placeholder-slate-600 transition-all duration-300"
                    />
                    <button
                      type="submit"
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${preferences.themeColor === "red" ? "bg-red-600/10 text-red-400" : preferences.themeColor === "orange" ? "bg-orange-600/10 text-orange-400" : "bg-[#00e5ff]/10 text-[#00e5ff]"} hover:opacity-80 transition-all rounded-lg border border-white/5`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 px-1">
                  <span>VOICE MODE: {voiceSupported ? "ACTIVE [CHORE_RECEPTORS]" : "STANDBY (BROWSER RESTRICT)"}</span>
                  <span>PREFS LOCK: SAFE</span>
                </div>

              </div>

            </aside>

          </div>

          <footer className="text-center font-mono text-[9px] text-slate-500 border-t border-white/5 pt-4">
            STARKS COGNITIVE PROTOCOLS &copy; 2026. SECURED UNDER ENCRYPTION SCHEMATICS. SIR.
          </footer>

        </div>
      )}
    </div>
  );
}
