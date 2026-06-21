import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { productionApi } from "../../services/productionApi";

interface Message {
  role: "user" | "model";
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const userRaw = localStorage.getItem("authUser");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const userRole = user?.role || "Production Manager";
    const userFullName = user ? `${user.firstName} ${user.lastName}` : "";
    return [
      {
        role: "model",
        content: `Good morning ${userRole} ${userFullName}! I am your AI Production Assistant. I can forecast production capabilities, resolve scheduling conflicts, or advise on upcoming deadlines. How can I help you today?`,
      },
    ];
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in .env");
      }

      // Fetch live production data to give context to Gemini
      const [scheduleData, ordersData] = await Promise.all([
        productionApi.getSchedule().catch(() => null),
        productionApi.getOrders().catch(() => null)
      ]);

      const systemContext = `
        You are an expert AI Production Manager Assistant for "Smart Shoe Factory". 
        Your primary role is to advise the production manager on scheduling, forecasts, resolving bottlenecks, and improving efficiency based on live database data.
        
        CURRENT PRODUCTION CONTEXT:
        - Active Orders: ${ordersData ? ordersData.orders.length : "Unknown"}
        - Planned Orders awaiting start: ${ordersData?.metrics.plannedCount || 0}
        - Current Conflicts Detected: ${scheduleData ? scheduleData.conflicts.length : 0}
        - Shift Details: ${scheduleData ? Object.keys(scheduleData.shifts).join(", ") : "Unknown"}
        
        When formatting your response:
        - Address the user properly.
        - Use clean, well-structured Markdown (lists, bold text, headers).
        - Be direct, professional, and actionable. Do not use generic filler words.
        - Recommend specific actions (e.g., "Shift workers from morning to afternoon", "Auto-resolve conflicts for Machine A").
      `;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemContext
      });

      // Gemini requires the history to start with a user message.
      // We skip the first message (the initial model welcome message).
      const historyForGemini = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({
        history: historyForGemini,
      });

      const result = await chat.sendMessage(userMsg);
      const responseText = result.response.text();

      setMessages((prev) => [...prev, { role: "model", content: responseText }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to communicate with AI");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-110 transition-transform ${
          isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
        style={{ transitionDuration: "300ms" }}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`${
          isMaximized 
            ? "fixed inset-4 w-auto h-auto rounded-2xl z-[60]"
            : "absolute bottom-0 right-0 w-[380px] h-[550px] rounded-2xl"
        } bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ transitionDuration: "300ms" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center justify-between text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Production Assistant</h3>
              <p className="text-[11px] text-indigo-100 font-medium">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsMaximized(false); }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 p-3 flex items-start gap-2 border-b border-red-100">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about forecasts or schedules..."
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-4 py-2.5 text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex-shrink-0"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
