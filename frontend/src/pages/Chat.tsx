import { useState, useEffect, useRef, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { MessageBubble } from '../components/chat/MessageBubble'
import { chatApi } from '../services/chatApi'
import type { Message } from '../types/chat'
import {
  Send, Bot, Trash2, Download,
  ChevronDown, Zap, AlertCircle
} from 'lucide-react'

const SYSTEM_PROMPTS = [
  { label: "Assistant", value: "You are a helpful AI assistant." },
  { label: "Coder",     value: "You are an expert programmer. Provide clean, well-commented code." },
  { label: "Analyst",   value: "You are a data analyst. Provide clear, structured analysis." },
  { label: "Writer",    value: "You are a professional writer. Write clearly and engagingly." },
]

export const Chat = () => {
  const [models, setModels]               = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState("")
  const [loading, setLoading]             = useState(false)
  const [systemPrompt, setSystemPrompt]   = useState(SYSTEM_PROMPTS[0].value)
  const [ollamaOnline, setOllamaOnline]   = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    const load = async () => {
      const result = await chatApi.getModels()
      setModels(result.models)
      setOllamaOnline(result.ollama_running)
      if (result.models.length > 0 && !selectedModel) {
        setSelectedModel(result.models[0])
      }
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || !selectedModel || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      model: selectedModel
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput("")
    setLoading(true)

    const history = messages
      .filter(m => m.role !== "system")
      .slice(-10)
      .map(m => (m.role === "user" ? "User: " : "Assistant: ") + m.content)
      .join("\n")

    const prompt = (history ? history + "\n" : "") +
      "User: " + userMsg.content + "\nAssistant:"

    const startTime = Date.now()

    try {
      await chatApi.sendMessage(
        selectedModel,
        prompt,
        systemPrompt,
        (chunk) => {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content + chunk }
              : m
          ))
        }
      )

      const duration = Date.now() - startTime
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, duration_ms: duration }
          : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: "❌ Error connecting to model." }
          : m
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const exportChat = () => {
    const text = messages
      .map(m => "[" + m.role.toUpperCase() + "] " + m.content)
      .join("\n\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "llmstore-chat-" + Date.now() + ".txt"
    a.click()
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <TopBar title="Chat" subtitle="Test your deployed AI models" />

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-72 border-r border-gray-800 bg-gray-900 flex flex-col p-4 gap-4">

          <div className={
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium " +
            (ollamaOnline
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400")
          }>
            <span className={
              "w-2 h-2 rounded-full " +
              (ollamaOnline ? "bg-green-400 animate-pulse" : "bg-red-400")
            } />
            {ollamaOnline ? "Ollama Online ✅" : "Ollama Offline ❌"}
          </div>

          <div>
            <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">
              Model
            </label>
            {models.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-purple-500"
                >
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} />
                No models running. Deploy one first!
              </div>
            )}
          </div>

          <div>
            <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">
              System Prompt
            </label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {SYSTEM_PROMPTS.map(p => (
                <button key={p.label}
                  onClick={() => setSystemPrompt(p.value)}
                  className={
                    "px-2 py-1.5 rounded-lg text-xs font-medium transition-all " +
                    (systemPrompt === p.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700")
                  }>
                  {p.label}
                </button>
              ))}
            </div>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-xs resize-none focus:outline-none focus:border-purple-500"
            />
          </div>

          {messages.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Session Stats
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Messages</span>
                <span className="text-white font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Model</span>
                <span className="text-purple-400 font-medium truncate ml-2">
                  {selectedModel}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-auto">
            <button onClick={() => setMessages([])}
              disabled={messages.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-medium py-2 rounded-lg transition-all disabled:opacity-50">
              <Trash2 size={13} /> Clear
            </button>
            <button onClick={exportChat}
              disabled={messages.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-medium py-2 rounded-lg transition-all disabled:opacity-50">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Bot size={32} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Chat with {selectedModel || "your AI model"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-lg">
                  {[
                    "Explain machine learning in simple terms",
                    "Write a Python hello world program",
                    "What are the benefits of on-premise AI?",
                    "Summarize the key features of LLMStore"
                  ].map(prompt => (
                    <button key={prompt}
                      onClick={() => setInput(prompt)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-700 transition-all">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-800 p-4">
            <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-purple-500 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !ollamaOnline
                    ? "Deploy a model first..."
                    : "Message " + selectedModel + "... (Enter to send)"
                }
                disabled={!ollamaOnline || loading}
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50"
              />
              <button onClick={sendMessage}
                disabled={!input.trim() || !selectedModel || loading}
                className={
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 " +
                  (input.trim() && selectedModel && !loading
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed")
                }>
                {loading
                  ? <Zap size={16} className="animate-pulse" />
                  : <Send size={16} />
                }
              </button>
            </div>
            <p className="text-gray-700 text-xs text-center mt-2">
              Running on your private server • No data leaves your network
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
