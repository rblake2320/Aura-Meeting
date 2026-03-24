import React, { useState, useRef } from "react";
import { Circle, StopCircle, Download, Loader2 } from "lucide-react";

export default function MeetingRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setIsPreparing(true);
    setRecordedUrl(null);
    chunksRef.current = [];

    try {
      // Capture screen with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setIsRecording(false);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    } finally {
      setIsPreparing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (recordedUrl) {
      const a = document.createElement("a");
      a.href = recordedUrl;
      a.download = `meeting-recording-${new Date().toISOString()}.webm`;
      a.click();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isPreparing}
          className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-all flex items-center gap-2"
          title="Record Meeting"
        >
          {isPreparing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Circle className="w-5 h-5 text-red-500 fill-red-500" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
            {isPreparing ? "Preparing..." : "Record"}
          </span>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-3 rounded-xl bg-red-600 text-white transition-all flex items-center gap-2 animate-pulse"
          title="Stop Recording"
        >
          <StopCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Stop</span>
        </button>
      )}

      {recordedUrl && !isRecording && (
        <button
          onClick={downloadRecording}
          className="p-3 rounded-xl bg-green-600 text-white transition-all flex items-center gap-2"
          title="Download Recording"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Download</span>
        </button>
      )}
    </div>
  );
}
