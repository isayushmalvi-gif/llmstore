export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  model?: string
  duration_ms?: number
  tokens?: number
}

export interface ChatSession {
  id: string
  model: string
  messages: Message[]
  created_at: string
}
