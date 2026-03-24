import React, { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, MicOff, Loader2, Languages } from "lucide-react";
import { useChat } from "@livekit/components-react";

export default function TranscriptionAssistant() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [language, setLanguage] = useState("English");
  const { send } = useChat();
  
  const languages = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Portuguese"
  ];

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);

  const stopTranscription = () => {
    setIsTranscribing(false);
    setIsConnecting(false);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
  };

  const startTranscription = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Connect to Gemini Live API
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, // Enable transcription of user input
          systemInstruction: `You are a highly accurate real-time transcription engine. 
          The current language being spoken is ${language}. 
          Your ONLY task is to provide verbatim transcriptions of the audio input in ${language}. 
          Do not summarize, do not translate, and do not respond verbally. 
          Focus on capturing every word accurately, including technical terms and proper nouns.`,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live connection opened");
            setIsConnecting(false);
            setIsTranscribing(true);
          },
          onmessage: (message) => {
            // The input transcription comes in a specific field
            if (message.serverContent?.inputTranscription?.text) {
              const transcript = message.serverContent.inputTranscription.text;
              if (transcript.trim()) {
                send(`[${language} Transcript]: ${transcript}`);
              }
            }
          },
          onerror: (error) => {
            console.error("Gemini Live Error:", error);
            stopTranscription();
          },
          onclose: () => {
            console.log("Gemini Live connection closed");
            stopTranscription();
          }
        }
      });

      sessionRef.current = session;

      // Setup Audio Capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to Base64
        const base64Data = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer))
        );

        session.sendRealtimeInput({
          audio: {
            data: base64Data,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (error) {
      console.error("Failed to start transcription:", error);
      stopTranscription();
    }
  };

  useEffect(() => {
    return () => stopTranscription();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isTranscribing || isConnecting}
          className="appearance-none bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-bold py-2 pl-8 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 cursor-pointer transition-all hover:bg-zinc-900"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
      </div>

      <button
        onClick={isTranscribing ? stopTranscription : startTranscription}
        disabled={isConnecting}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
          isTranscribing 
            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" 
            : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
        } disabled:opacity-50`}
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isTranscribing ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        {isConnecting ? "Connecting..." : isTranscribing ? "Stop Transcription" : "Start Transcription"}
      </button>
      
      {isTranscribing && (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Live Transcribing</span>
        </div>
      )}
    </div>
  );
}
