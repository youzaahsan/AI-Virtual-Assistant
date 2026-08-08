import { PythonClassFile } from "./types";

export const pythonFiles: PythonClassFile[] = [
  {
    name: "main.py",
    path: "main.py",
    description: "Core Jarvis bootstrapper & speech pipeline initialization loop.",
    code: `# -*- coding: utf-8 -*-
"""
Stark Systems JARVIS - Production Bootstrapper
(C) 2026 Stark Enterprises Inc.
"""
import sys
import os
import time
from assistant.core import JarvisCore
from database.sqlite_db import DatabaseManager
from ui.dashboard import render_ui

def boot_diagnostics():
    print("[SYSTEM] Initiating core self-diagnostics...")
    time.sleep(0.5)
    print("[SYSTEM] Testing biometrics connection... PASSED")
    time.sleep(0.3)
    print("[SYSTEM] Synaptic mapping databases loaded... PASSED")
    time.sleep(0.4)
    print("[SYSTEM] Audio transceiver online... READY")

if __name__ == "__main__":
    boot_diagnostics()
    
    # Initialize Persistent Core Memory
    db = DatabaseManager()
    db.setup()
    
    # Initialize Core Assistant Modules
    jarvis = JarvisCore(db)
    
    # Launch Futuristic graphical user interface
    render_ui(jarvis)
`
  },
  {
    name: "core.py",
    path: "assistant/core.py",
    description: "Speech Recognition, Text-To-Speech integration, and AI models client.",
    code: `import os
import speech_recognition as sr
import pyttsx3
import urllib.request
import json

class JarvisCore:
    def __init__(self, db_manager):
        self.db = db_manager
        self.recognizer = sr.Recognizer()
        
        # Audio Synthesizer init
        self.engine = pyttsx3.init()
        self.setup_voice()
        self.wake_word = "jarvis"

    def setup_voice(self):
        voices = self.engine.getProperty('voices')
        # Seek a futuristic male sounding voice
        for voice in voices:
            if "male" in voice.name.lower() or "zira" not in voice.name.lower():
                self.engine.setProperty('voice', voice.id)
                break
        self.engine.setProperty('rate', 175) # Speaking speed
        self.engine.setProperty('volume', 1.0)

    def speak(self, text):
        print(f"JARVIS: {text}")
        self.engine.say(text)
        self.engine.runAndWait()

    def listen_and_convert(self):
        with sr.Microphone() as source:
            print("[LISTENING] Awaiting spectral input...")
            self.recognizer.adjust_for_ambient_noise(source, duration=0.8)
            audio = self.recognizer.listen(source)
            
        try:
            print("[PROCESSING] Synthesizing sound wave...")
            query = self.recognizer.recognize_google(audio)
            print(f"[USER]: {query}")
            return query.lower()
        except sr.UnknownValueError:
            return ""
        except sr.RequestError:
            print("[ERROR] Spectral server link is severed.")
            return ""

    def process_ai_logic(self, query):
        # Fallback simulated response or actual network integration (e.g. Gemini / OpenAI API)
        # Check custom commands in database first
        custom_action = self.db.find_custom_command(query)
        if custom_action:
            return custom_action

        # Default smart replies
        if "weather" in query:
            return {"text": "Atmospheric conditions around Stark Tower CA are optimal at 72°F.", "action": "SHOW_WEATHER"}
        elif "time" in query:
            return {"text": "Sir, current Stark atomic clock reports exactly 15:42 PST.", "action": "SHOW_TIME"}
        elif "open google" in query:
            return {"text": "Instantiating Chrome overlay for Google search.", "action": "OPEN_URL", "payload": "https://google.com"}
        elif "shut down" in query:
            return {"text": "Initiating terminal environmental shutdown protocols. Clean up is advised.", "action": "SYSTEM_SHUTDOWN"}
        else:
            return {"text": f"Analyzing query: '{query}'. Processing via neural cloud sub-processors.", "action": "GENERAL_TALK"}
`
  },
  {
    name: "system.py",
    path: "automation/system.py",
    description: "Launches browsers, screen capture, volume adjust, and automation executors.",
    code: `import os
import webbrowser
import pyautogui
import platform

class AutomationManager:
    @staticmethod
    def open_webpage(url):
        print(f"[SYSTEM] Routing URL frame to: {url}")
        webbrowser.open(url)

    @staticmethod
    def search_google(query):
        url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
        webbrowser.open(url)

    @staticmethod
    def take_screenshot(filename="diagnostics_capture.png"):
        screenshot = pyautogui.screenshot()
        screenshot.save(filename)
        print(f"[SYSTEM] Hologram interface screenshot saved to {filename}")

    @staticmethod
    def adjust_volume(percent):
        print(f"[SYSTEM] Adjusting sonic decibels to {percent}%")
        current_os = platform.system()
        if current_os == "Windows":
            # Command line sound triggers
            pass
        elif current_os == "Darwin" : # MacOS
            os.system(f"osascript -e 'set volume output volume {percent}'")
        else: # Linux
            os.system(f"amixer sset 'Master' {percent}%")
`
  },
  {
    name: "sqlite_db.py",
    path: "database/sqlite_db.py",
    description: "Database configurations, remembering preferences, and voice commands.",
    code: `import sqlite3

class DatabaseManager:
    def __init__(self, db_path="database/jarvis_memory.db"):
        self.db_path = db_path

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def setup(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # User security + preference table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        
        # Custom vocal commands table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS commands (
                phrase TEXT PRIMARY KEY,
                action_type TEXT,
                payload TEXT
            )
        """)
        
        # Insert default preferences if empty
        cursor.execute("INSERT OR IGNORE INTO config VALUES ('user_name', 'Tony Stark')")
        cursor.execute("INSERT OR IGNORE INTO config VALUES ('theme', 'cyan_glow')")
        
        conn.commit()
        conn.close()

    def find_custom_command(self, phrase):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT action_type, payload FROM commands WHERE phrase = ?", (phrase.strip().lower(),))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {"text": f"Executing customized command: {phrase}", "action": row[0], "payload": row[1]}
        return None
`
  },
  {
    name: "dashboard.py",
    path: "ui/dashboard.py",
    description: "Sleek PyQt5/CustomTkinter futuristic glassmorphism GUI simulation.",
    code: `import sys
import tkinter as tk
from tkinter import ttk

def render_ui(core_assistant):
    root = tk.Tk()
    root.title("J.A.R.V.I.S. Neural Hub")
    root.geometry("800x600")
    root.configure(bg="#030712") # Obsidian slate dark theme
    
    # Custom neon glowing frame
    title_label = tk.Label(
        root, 
        text="J.A.R.V.I.S. COGNITIVE HUD", 
        font=("Helvetica", 18, "bold"),
        fg="#06b6d4", # Cyan neon glow
        bg="#030712"
    )
    title_label.pack(pady=20)

    reactor_canvas = tk.Canvas(root, width=200, height=200, bg="#030712", highlightthickness=0)
    reactor_canvas.pack(pady=10)
    
    # Render sleek technical arc circles
    reactor_canvas.create_oval(20, 20, 180, 180, outline="#0891b2", width=3)
    reactor_canvas.create_oval(40, 40, 160, 160, outline="#22d3ee", width=1, dash=(4, 4))
    reactor_canvas.create_oval(70, 70, 130, 130, outline="#06b6d4", width=5)

    feedback_label = tk.Label(
        root, 
        text="AWAITING SONIC COMMANDEER...",
        font=("Courier", 11),
        fg="#94a3b8",
        bg="#030712"
    )
    feedback_label.pack(pady=20)

    def trigger_voice():
        feedback_label.config(text="LISTENING FOR WAKE SYNAPSE...")
        root.update()
        query = core_assistant.listen_and_convert()
        if query:
            feedback_label.config(text=f"DECRYPTING: {query}")
            root.update()
            res = core_assistant.process_ai_logic(query)
            core_assistant.speak(res["text"])
            feedback_label.config(text=f"JARVIS: {res['text']}")
        else:
            feedback_label.config(text="SYNAPSE TIMEOUT - SIR")

    btn = tk.Button(
        root, 
        text="TRIGGER SPEECH SENSOR", 
        command=trigger_voice,
        bg="#0891b2", 
        fg="white", 
        font=("Helvetica", 10, "bold"),
        activebackground="#06b6d4"
    )
    btn.pack(pady=10)

    root.mainloop()
`
  }
];
