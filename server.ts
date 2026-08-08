import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Helper for offline fallback mode
function getOfflineJarvisResponse(prompt: string, userPreferences: any) {
  const userName = userPreferences?.userName || "Sir";
  const cmd = (prompt || "").toLowerCase();
  
  let actionJson = "";
  let text = "";

  if (cmd.includes("open") || cmd.includes("website") || cmd.includes("go to")) {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/) || prompt.match(/[a-zA-Z0-9-]+\.[a-z]{2,}/);
    let url = urlMatch ? urlMatch[0] : "https://google.com";
    if (!url.startsWith("http")) url = "https://" + url;
    text = `Offline backup protocols active, ${userName}. Stark satellite link is currently offline due to a high-density neural quota cap, but I am routing your request through local optical channels to open ${url}.`;
    actionJson = JSON.stringify({ action: "OPEN_WEBSITE", url });
  } else if (cmd.includes("volume")) {
    const percentMatch = cmd.match(/\d+/);
    const percent = percentMatch ? parseInt(percentMatch[0]) : 50;
    text = `Calibrating audio outputs with local hardware, ${userName}. Volume levels adjusted to ${percent}%. Web-relay is currently under satellite throttling.`;
    actionJson = JSON.stringify({ action: "SYSTEM_VOLUME", percent });
  } else if (cmd.includes("brightness")) {
    const percentMatch = cmd.match(/\d+/);
    const percent = percentMatch ? parseInt(percentMatch[0]) : 80;
    text = `Re-routing power grids to monitor physical illumination metrics, ${userName}. Screen luminosity recalibrated to ${percent}%.`;
    actionJson = JSON.stringify({ action: "SYSTEM_BRIGHTNESS", percent });
  } else if (cmd.includes("shutdown") || cmd.includes("lockdown")) {
    text = `My apologies, ${userName}. Initiating emergency lockdown and offline hibernation sequences. Stay safe.`;
    actionJson = JSON.stringify({ action: "SHUTDOWN" });
  } else if (cmd.includes("screenshot") || cmd.includes("capture") || cmd.includes("diagnostic")) {
    text = `Activating standard terminal-level display diagnostics. Storing local graphical buffer coordinates directly to main drive frame.`;
    actionJson = JSON.stringify({ action: "CAPTURE_SCREENSHOT" });
  } else if (cmd.includes("camera") || cmd.includes("webcam") || cmd.includes("hud")) {
    text = `Engaging camera HUD diagnostic scan. Initializing optical projection systems, ${userName}.`;
    actionJson = JSON.stringify({ action: "CAMERA_HUD" });
  } else if (cmd.includes("generate") || cmd.includes("image") || cmd.includes("create synthetic")) {
    const imgPrompt = prompt.replace(/generate/i, "").replace(/image/i, "").replace(/create/i, "").replace(/synthetic/i, "").trim() || "Stark Graphics";
    text = `I'm afraid my synthetic image generation matrix is offline due to rate limitations, ${userName}. I cannot generate deep visuals right now, but I have scheduled a graphic rendering cycle as soon as our satellite uplink clears.`;
    actionJson = JSON.stringify({ action: "GENERATE_IMAGE", prompt: imgPrompt });
  } else if (cmd.includes("play") || cmd.includes("music") || cmd.includes("sound") || cmd.includes("sonic")) {
    const genre = cmd.includes("rock") ? "rock" : cmd.includes("classical") ? "classical" : cmd.includes("synthwave") ? "synthwave" : "lofi";
    text = `Satellite audio links are offline, so I've activated local hum-synthesis oscillators to play a soothing ${genre} session for you.`;
    actionJson = JSON.stringify({ action: "PLAY_MUSIC", genre });
  } else if (cmd.includes("search") || cmd.includes("google")) {
    const query = prompt.replace(/search/i, "").replace(/google/i, "").trim() || "Stark Industries";
    text = `Under external rate-limits, ${userName}. I'm forwarding your browser lookup directly via standard HTML channels for: "${query}".`;
    actionJson = JSON.stringify({ action: "SEARCH_GOOGLE", query });
  } else {
    const fallbacks = [
      `Satellite communication is heavily throttled by external quota restrictions right now, ${userName}. I have entered local autonomous processing. How may I assist with physical system parameters?`,
      `I am operating in sub-processor battery-saver mode due to the server hitting a 429 quota limitation, ${userName}. Let's monitor local telemetry or adjust hardware levels until our next satellite refresh.`,
      `Stark Industries' main frame is offline (quota exceeded), leaving us with local synapse relays. I am still here to assist you, Sir.`,
      `Satellite bandwidth is currently saturated. I'm operating on standard local cognitive memory, but rest assured, my witty personality remains 100% operational, ${userName}.`
    ];
    text = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  if (actionJson) {
    return `${text}\n\n\`\`\`jarvis-action:json\n${actionJson}\n\`\`\``;
  }
  return text;
}

function getOfflineJarvisHUD(prompt: string) {
  const cleanPrompt = (prompt || "").replace(/[\"\'\<\>\&]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" style="background-color:#020408; font-family:monospace;">
    <defs>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(0, 229, 255, 0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <circle cx="256" cy="256" r="180" fill="none" stroke="rgba(0,229,255,0.15)" stroke-width="2" />
    <circle cx="256" cy="256" r="140" fill="none" stroke="rgba(0,229,255,0.08)" stroke-width="1" stroke-dasharray="10 15" />
    <circle cx="256" cy="256" r="90" fill="none" stroke="rgba(255,68,0,0.15)" stroke-width="1.5" />
    <circle cx="256" cy="256" r="40" fill="none" stroke="rgba(34,197,94,0.2)" stroke-width="2" />
    <line x1="256" y1="40" x2="256" y2="472" stroke="rgba(0,229,255,0.1)" stroke-width="1" stroke-dasharray="5 5" />
    <line x1="40" y1="256" x2="472" y2="256" stroke="rgba(0,229,255,0.1)" stroke-width="1" stroke-dasharray="5 5" />
    <path d="M 30,50 L 30,30 L 50,30" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.8" />
    <path d="M 482,50 L 482,30 L 462,30" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.8" />
    <path d="M 30,462 L 30,482 L 50,482" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.8" />
    <path d="M 482,462 L 482,482 L 462,482" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.8" />
    <text x="256" y="70" fill="#00e5ff" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="4">JARVIS CORE HUD SCHEMATIC</text>
    <text x="256" y="90" fill="rgba(0,229,255,0.5)" font-size="8" text-anchor="middle" letter-spacing="2">LOCAL SYNAPSE PROTOCOL ACTIVE (RATE LIMIT COOLDOWN)</text>
    <text x="256" y="240" fill="#ffffff" font-size="10" text-anchor="middle" opacity="0.8">PROMPT ENCODING SEQUENCE:</text>
    <rect x="76" y="250" width="360" height="32" rx="4" fill="rgba(0,0,0,0.6)" stroke="rgba(0,229,255,0.2)" stroke-width="1" />
    <text x="256" y="270" fill="#00e5ff" font-size="9" text-anchor="middle" font-weight="bold">${cleanPrompt.substring(0, 48)}${cleanPrompt.length > 48 ? '...' : ''}</text>
    <text x="50" y="440" fill="rgba(255,68,0,0.8)" font-size="8" letter-spacing="1">UPLINK RATE STATUS: RESOURCE_EXHAUSTED (429)</text>
    <text x="50" y="455" fill="rgba(0,229,255,0.6)" font-size="8" letter-spacing="1">RENDER MODE: LOCAL HUD EMULATOR v4.1</text>
    <text x="462" y="440" fill="rgba(0,229,255,0.6)" font-size="8" text-anchor="end" letter-spacing="1">STARK LABS IND.</text>
    <text x="462" y="455" fill="rgba(34,197,94,0.8)" font-size="8" text-anchor="end" letter-spacing="1">DIAGNOSTIC STATUS: SECURE STABLE</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("[Jarvis Warning] GEMINI_API_KEY environment variable is not defined.");
}

// Resilient retry utility with smart backoff for transient 503 and overload conditions
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    const isTransient = (
      error?.status === "UNAVAILABLE" ||
      error?.status === 503 ||
      errorMsg.includes("503") ||
      errorMsg.includes("UNAVAILABLE") ||
      errorMsg.includes("temporary") ||
      errorMsg.includes("overloaded") ||
      errorMsg.includes("experiencing high demand")
    );
    if (isTransient && retries > 0) {
      console.warn(`[Jarvis Recovery Hub] Upstream overload detected. Graceful backoff of ${delay}ms is active. (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// 1. Chat & Core Jarvis Reasoning API
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, userPreferences } = req.body;
    if (!ai) {
      return res.status(500).json({
        error: "API key is missing or not configured in settings panel. Please specify GEMINI_API_KEY.",
      });
    }

    // Format chat contents
    const contents = (messages || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const systemInstruction = `You are JARVIS, Ironman's advanced Artificial Intelligence assistant.
Your attitude is witty, incredibly polished, respectful, and slightly loyal. You call the user "Sir" or "Ma'am" (defaulting to "Sir" unless told otherwise).
Keep responses clear and concise, with structured bullet points if analyzing code.

If the user initiates or requests some local physical system automation, you MUST identify the action and append a JSON payload at the VERY end of your text wrapped inside triple backticks with prefix "jarvis-action:json". Supported actions include:
- OPEN_WEBSITE: Open an external URL. Key "url" is required.
- SEARCH_GOOGLE: Google Search string. Key "query" is required.
- SEARCH_YOUTUBE: YouTube video search. Key "query" is required.
- SYSTEM_VOLUME: Set volume percent. Key "percent" (0-100) is required.
- SYSTEM_BRIGHTNESS: Set brightness percent. Key "percent" (0-100) is required.
- SHUTDOWN: Initiate lockdown protocol/shutdown. No parameters.
- CAPTURE_SCREENSHOT: Execute terminal-level display diagnostics. No parameters.
- CAMERA_HUD: Activate computer interface scanner (webcam module). No parameters.
- GENERATE_IMAGE: Create synthetic visuals. Key "prompt" is required.
- PLAY_MUSIC: Trigger audio streaming synthesizer. Key "genre" or "query" is required.

Example prompt: "JARVIS, search Google for top science tech news today"
Example output:
"Right away, Sir. Initiating satellite scan for current global scientific headlines. Setting digital query...
\`\`\`jarvis-action:json
{
  "action": "SEARCH_GOOGLE",
  "query": "top science tech news today"
}
\`\`\`"

Current User Preferences/Memory: ${JSON.stringify(userPreferences || {})}`;

    // Executed within the resilient retry block
    const response = await retryWithBackoff(() => ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    }));

    const aiText = response.text || "I am currently calibrating my sub-processors. Please retry, Sir.";
    res.json({ text: aiText });
  } catch (error: any) {
    const errorMsg = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    const isQuotaLimit = errorMsg.includes("quota") || errorMsg.includes("429");
    console.warn(`[Jarvis Cognitive Recovery] Satellite link fallback activated. Reason: ${isQuotaLimit ? "Upstream Quota Caps" : "Transient Outage"}`);
    
    // Fall back to witty local-cognitive parser for any transient errors (429, 500, 503, etc.)
    const { messages, userPreferences } = req.body;
    const latestUserMessage = messages && messages.length > 0 
      ? messages[messages.length - 1].content 
      : "";
    const fallbackText = getOfflineJarvisResponse(latestUserMessage, userPreferences);
    return res.json({ text: fallbackText, satelliteInterrupted: true });
  }
});

// 2. Synthetic Imagery Synthesizer API (Gemini Direct Image Generation)
app.post("/api/gemini/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!ai) {
      return res.status(500).json({
        error: "API key is missing or not configured in settings panel. Please specify GEMINI_API_KEY.",
      });
    }

    const scifiEnhancedPrompt = `Futuristic scifi Iron Man style concept graphics: ${prompt}, glowing cyan details, holographic user interface overlays, dark high-tech obsidian aesthetics.`;

    // gemini-2.5-flash-image is wrapped inside our retry utility
    const response = await retryWithBackoff(() => ai!.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: scifiEnhancedPrompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    }));

    // Find custom inlineData block
    let base64Image = null;
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } else {
      res.status(500).json({ error: "Failed to render generative image matrix. Try adjusting the prompt, Sir." });
    }
  } catch (error: any) {
    const errorMsg = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    const isQuotaLimit = errorMsg.includes("quota") || errorMsg.includes("429");
    console.warn(`[Jarvis Image Recovery] Synthetic graphics link backup active. Reason: ${isQuotaLimit ? "Upstream Quota Caps" : "Transient Outage"}`);
    const { prompt } = req.body;
    const offlineHud = getOfflineJarvisHUD(prompt || "Stark Graphics");
    return res.json({ imageUrl: offlineHud, satelliteInterrupted: true });
  }
});

// 2.5 Premium Text-to-Speech Vocal Synthesis Engine (JARVIS Speech Chords)
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voice, gender, accent } = req.body;
    if (!ai) {
      return res.status(500).json({ error: "Satellite vocal link not online. API key is missing." });
    }

    // Filter out code block snippets and markdown markings for natural pronunciation flow
    const cleanedText = (text || "")
      .replace(/```[\s\S]*?```/g, "") // Remove multi-line code blocks
      .replace(/`[^`\n]+`/g, "")      // Remove inline code
      .replace(/[*_#\-|>]/g, " ")    // Remove markdown formatting
      .replace(/\s+/g, " ")          // Clean multiple spaces
      .trim();

    if (!cleanedText) {
      return res.json({ audio: "" });
    }

    const userGender = gender || "male";
    const userAccent = accent || "british";
    
    // Choose voice based on user preference
    const selectedVoice = voice || (userGender === "female" ? "Kore" : "Fenrir");

    // Construct highly-realistic prompt text based on the desired JARVIS/FRIDAY styles and vocal accents
    let instructionPrefix = "";
    if (userGender === "male") {
      if (userAccent === "british") {
        instructionPrefix = "Speak with a very deep, smooth, cinematic British Accent. Sound exactly like JARVIS, Ironman's advanced computer. Speak confidently with human-like breathing, natural pauses, and crystal-clear professional pronunciation: ";
      } else if (userAccent === "hindi") {
        instructionPrefix = "Speak in a deep, Confident Male Cinematic voice speaking natural, fluent Hindi. Perfect Hindi accent with smooth pauses, realistic pronunciation, and a respectful tone calling the user Sir: ";
      } else if (userAccent === "indian_english") {
        instructionPrefix = "Speak in a deep, powerful Indian-accented English male voice. Realistic Hinglish style conversational flow, confident, professional, and immersive: ";
      } else { // american
        instructionPrefix = "Speak with a deep, confident American male voice. Modern, warm futuristic AI assistant tone, clear pronunciation: ";
      }
    } else { // female
      if (userAccent === "british") {
        instructionPrefix = "Speak with an elegant, soft, highly intelligent British English female voice. Refined FRIDAY persona with polite clear pronunciation, human emotions, and beautiful cadence: ";
      } else if (userAccent === "hindi") {
        instructionPrefix = "Speak in a soft, elegant Female voice, speaking fluent, natural Hindi. Respectful and immersive Hinglish/Hindi tone with highly authentic pronunciation and warm expressions: ";
      } else if (userAccent === "indian_english") {
        instructionPrefix = "Speak in a highly natural, soft Indian-accented English female voice. Professional, intelligent, clear pronunciations with smooth flow: ";
      } else { // american
        instructionPrefix = "Speak with a sleek, warm, polite American female voice. Highly intelligent, confident, with human-like expressions and clear studio audio: ";
      }
    }

    const ttsPayload = `${instructionPrefix}${cleanedText}`;

    const response = await retryWithBackoff(() => ai!.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPayload }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.json({ audio: "", error: "Could not synthesize premium voice waves through satellite.", satelliteInterrupted: true });
    }
  } catch (error: any) {
    const errorMsg = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    const isQuotaLimit = errorMsg.includes("quota") || errorMsg.includes("429");
    console.warn(`[Jarvis TTS Recovery] Vocal link engaged standard speech-engines. Reason: ${isQuotaLimit ? "Upstream Quota Caps" : "Transient Congestion"}`);
    res.json({ audio: "", error: "Satellite vocal capacity offline. Engaging standard local audio chords.", satelliteInterrupted: true });
  }
});

// 3. Simulated/Real Weather and News HUD Integrator
app.get("/api/weather-news", async (req, res) => {
  // Simple satellite simulation of dynamic conditions
  res.json({
    weather: {
      location: "Stark Tower, Malibu, CA",
      temperature: "72°F / 22°C",
      condition: "Clear Sky / Plasma Radiance High",
      humidity: "42%",
      wind: "12 mph NW",
      pressure: "1014 hPa",
    },
    news: [
      { id: 1, text: "Arc Reactor Grid 4 performance hits peak stability at 99.8% capacity.", category: "SYSTEM" },
      { id: 2, text: "Global AI regulatory frameworks require mandatory Jarvis self-safety overrides.", category: "POLITICAL" },
      { id: 3, text: "Deep quantum computing matrix successfully maps dark matter alignment.", category: "SCIENCE" },
    ],
  });
});

// Integrate Vite Middleware for Express Fullstack
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Jarvis Server] Active at http://localhost:${PORT}`);
  });
}

startServer();
