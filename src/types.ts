export interface JarvisAction {
  action: "OPEN_WEBSITE" | "SEARCH_GOOGLE" | "SEARCH_YOUTUBE" | "SYSTEM_VOLUME" | "SYSTEM_BRIGHTNESS" | "SHUTDOWN" | "CAPTURE_SCREENSHOT" | "CAMERA_HUD" | "GENERATE_IMAGE" | "PLAY_MUSIC";
  url?: string;
  query?: string;
  percent?: number;
  genre?: string;
  prompt?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  action?: JarvisAction;
}

export interface SystemStats {
  cpu: number;
  ram: number;
  coreTemp: number;
  internetSpeed: string;
  activeProcesses: string[];
  uptime: string;
}

export interface WeatherStats {
  location: string;
  temperature: string;
  condition: string;
  humidity: string;
  wind: string;
  pressure: string;
}

export interface PythonClassFile {
  name: string;
  path: string;
  code: string;
  description: string;
}

export interface CustomCommand {
  phrase: string;
  actionType: string;
  payload: string;
}

export interface UserPreferences {
  userName: string;
  passcode: string;
  voiceAuthEnabled: boolean;
  themeColor: string;
  reactorSpeed: "normal" | "rapid" | "steady";
  soundEffects: boolean;
  voiceVolume: number;
  customCommands: CustomCommand[];
  voiceMode: "premium" | "standard";
  vocalVoice: "Fenrir" | "Charon" | "Kore" | "Zephyr" | "Puck";
  vocalGender: "male" | "female";
  vocalAccent: "british" | "hindi" | "indian_english" | "american";
}
