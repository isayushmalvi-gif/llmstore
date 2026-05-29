import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface ChatResponse {
  model: string
  response: string
  done: boolean
  total_duration?: number
  eval_count?: number
}

export const chatApi = {
  sendMessage: async (
    model: string,
    prompt: string,
    system: string,
    onChunk?: (text: string) => void
  ): Promise<ChatResponse> => {

    if (onChunk) {
      const response = await fetch(API_BASE + "/api/v1/chat/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          system,
          stream: true
        })
      })

      let fullResponse = ""
      let finalData: ChatResponse = { model, response: "", done: false }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter(Boolean)
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              if (data.response) {
                fullResponse += data.response
                onChunk(data.response)
              }
              if (data.done) {
                finalData = { ...data, response: fullResponse }
              }
            } catch {}
          }
        }
      }
      return finalData

    } else {
      const response = await axios.post(
        API_BASE + "/api/v1/chat/generate",
        { model, prompt, system, stream: false }
      )
      return response.data
    }
  },

  getModels: async (): Promise<{
    models: string[]
    ollama_running: boolean
  }> => {
    try {
      const response = await axios.get(API_BASE + "/api/v1/chat/models")
      return response.data
    } catch {
      return { models: [], ollama_running: false }
    }
  }
}
