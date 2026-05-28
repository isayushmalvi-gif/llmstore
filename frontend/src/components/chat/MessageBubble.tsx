import type { Message } from '../../types/chat'
import { User, Bot, Clock, Hash } from 'lucide-react'

interface Props {
  message: Message
}

export const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-gray-600 bg-gray-800/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={"flex gap-3 " + (isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 " +
        (isUser ? "bg-purple-600" : "bg-gray-700")
      }>
        {isUser
          ? <User size={16} className="text-white" />
          : <Bot size={16} className="text-gray-300" />
        }
      </div>

      {/* Bubble */}
      <div className={"max-w-[75%] " + (isUser ? "items-end" : "items-start") + " flex flex-col gap-1"}>
        <div className={
          "px-4 py-3 rounded-2xl text-sm leading-relaxed " +
          (isUser
            ? "bg-purple-600 text-white rounded-tr-sm"
            : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700")
        }>
          {message.content || (
            <span className="flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className={"flex items-center gap-3 text-xs text-gray-600 " + (isUser ? "flex-row-reverse" : "")}>
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.duration_ms && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {(message.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
          {message.tokens && (
            <span className="flex items-center gap-1">
              <Hash size={10} /> {message.tokens} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
