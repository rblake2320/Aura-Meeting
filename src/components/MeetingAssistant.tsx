import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Loader2, MessageSquare, ClipboardList, Zap, CheckSquare, ListTodo, Edit2, Trash2, Check, X, RefreshCw, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ActionItem {
  task: string;
  assignee: string;
  dueDate: string;
  id: string;
  status: "pending" | "completed";
}

interface MeetingAssistantProps {
  chatMessages: string[];
}

export default function MeetingAssistant({ chatMessages }: MeetingAssistantProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastProcessedCount, setLastProcessedCount] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<ActionItem | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateInsights = async (isAuto = false) => {
    if (chatMessages.length === 0) return;
    if (isAuto && chatMessages.length === lastProcessedCount) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Analyze the following meeting conversation (which includes chat and transcriptions) and provide:
      1. A concise summary of the discussion.
      2. A list of specific action items, including the task, the person assigned (if mentioned), and any deadlines (if mentioned).

      Conversation:
      ${chatMessages.join("\n")}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert meeting assistant. Distill conversations into clear summaries and structured action items. Be precise and professional. If you find action items, ensure they have a clear task, assignee (default to 'Unassigned'), and due date (default to 'TBD').",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "A concise summary of the meeting conversation.",
              },
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task: { type: Type.STRING, description: "The specific task or action to be taken." },
                    assignee: { type: Type.STRING, description: "The person or team assigned to the task. Use 'Unassigned' if not specified." },
                    dueDate: { type: Type.STRING, description: "The deadline or timeframe for the task. Use 'TBD' if not specified." },
                  },
                  required: ["task", "assignee", "dueDate"],
                },
              },
            },
            required: ["summary", "actionItems"],
          },
        },
      });

      const data = JSON.parse(response.text || "{}");
      setSummary(data.summary || "No summary generated.");
      
      // Merge new action items with existing ones, avoiding duplicates based on task description
      const newItems: ActionItem[] = (data.actionItems || []).map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending"
      }));

      setActionItems(prev => {
        const existingTasks = new Set(prev.map(item => item.task.toLowerCase()));
        const uniqueNewItems = newItems.filter(item => !existingTasks.has(item.task.toLowerCase()));
        return [...prev, ...uniqueNewItems];
      });

      setLastProcessedCount(chatMessages.length);
    } catch (error) {
      console.error("AI Error:", error);
      if (!isAuto) {
        setSummary("Failed to generate insights. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync effect
  useEffect(() => {
    if (autoSync && chatMessages.length > lastProcessedCount + 5) {
      // Trigger auto-sync if 5+ new messages arrived
      const timer = setTimeout(() => {
        generateInsights(true);
      }, 5000); // 5s debounce
      return () => clearTimeout(timer);
    }
  }, [chatMessages, autoSync, lastProcessedCount]);

  const deleteActionItem = (id: string) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
    if (editedItem?.id === id) {
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  const toggleStatus = (id: string) => {
    setActionItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: item.status === "completed" ? "pending" : "completed" } : item
    ));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditedItem({ ...actionItems[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editedItem) {
      setActionItems(prev => {
        const next = [...prev];
        next[editingIndex] = editedItem;
        return next;
      });
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedItem(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider">Aura Intelligence</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAutoSync(!autoSync)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all",
                autoSync ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              )}
            >
              <RefreshCw className={cn("w-2.5 h-2.5", autoSync && "animate-spin-slow")} />
              {autoSync ? "Auto-Sync On" : "Auto-Sync Off"}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 font-medium">Real-time meeting insights & summaries</p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <AnimatePresence mode="wait">
          {loading && !summary ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-4 py-12"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-zinc-200">Analyzing Conversation</p>
                <p className="text-[11px] text-zinc-500">Gemini is distilling your meeting notes...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Summary Section */}
              {summary && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <ClipboardList className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Meeting Summary</span>
                    </div>
                    {loading && (
                      <div className="flex items-center gap-1.5 text-[9px] text-blue-400 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        Updating...
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl shadow-inner relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-strong:text-blue-400 prose-ul:list-disc prose-li:text-zinc-300">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  </div>
                </section>
              )}

              {/* Action Items Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ListTodo className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Action Items</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-0.5 rounded-md">
                    {actionItems.length} Total
                  </span>
                </div>

                <div className="space-y-3">
                  {actionItems.length > 0 ? (
                    actionItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "p-4 bg-zinc-900/60 border border-zinc-800/50 rounded-xl flex flex-col gap-3 group transition-all relative",
                          item.status === "completed" ? "opacity-50 grayscale" : "hover:border-amber-500/30"
                        )}
                      >
                        {editingIndex === idx ? (
                          <div className="space-y-3 w-full">
                            <input
                              type="text"
                              value={editedItem?.task || ""}
                              onChange={(e) => setEditedItem(prev => prev ? { ...prev, task: e.target.value } : null)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                              placeholder="Task description"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editedItem?.assignee || ""}
                                onChange={(e) => setEditedItem(prev => prev ? { ...prev, assignee: e.target.value } : null)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                placeholder="Assignee"
                              />
                              <input
                                type="text"
                                value={editedItem?.dueDate || ""}
                                onChange={(e) => setEditedItem(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                placeholder="Due Date"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={saveEdit}
                                className="p-1.5 hover:bg-amber-500/20 rounded-lg text-amber-500 transition-colors"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => toggleStatus(item.id)}
                                className="mt-0.5 shrink-0"
                              >
                                {item.status === "completed" ? (
                                  <CheckSquare className="w-4 h-4 text-green-500" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-zinc-700 rounded group-hover:border-amber-500/50 transition-colors" />
                                )}
                              </button>
                              <div className="space-y-2 flex-1">
                                <p className={cn(
                                  "text-sm font-medium leading-tight transition-all",
                                  item.status === "completed" ? "text-zinc-500 line-through" : "text-zinc-200"
                                )}>
                                  {item.task}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                    <MessageSquare className="w-2.5 h-2.5 opacity-50" />
                                    {item.assignee}
                                  </span>
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                    <Clock className="w-2.5 h-2.5 opacity-50" />
                                    {item.dueDate}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditing(idx)}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteActionItem(item.id)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center">
                      <p className="text-xs text-zinc-600 font-medium italic">No clear action items identified.</p>
                    </div>
                  )}
                </div>
              </section>

              <div className="flex items-center gap-2 p-3 bg-zinc-900/20 border border-zinc-800/30 rounded-xl">
                <Zap className="w-3 h-3 text-amber-400" />
                <p className="text-[10px] text-zinc-500 italic">
                  Insights generated based on {chatMessages.length} conversation points.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Action */}
      <div className="p-5 border-t border-zinc-800/50 bg-zinc-900/30">
        <button
          onClick={() => generateInsights()}
          disabled={loading || chatMessages.length === 0}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Processing..." : "Sync AI Insights"}
        </button>
      </div>
    </div>
  );
}
