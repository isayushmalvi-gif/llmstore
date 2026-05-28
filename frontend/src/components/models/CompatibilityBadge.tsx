import type { Compatibility } from '../../types/models'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface Props {
  compatibility: Compatibility
  showIssues?: boolean
}

export const CompatibilityBadge = ({ compatibility, showIssues }: Props) => {
  const config = {
    COMPATIBLE: {
      icon: <CheckCircle size={14} />,
      text: "Compatible",
      className: "bg-green-500/20 text-green-400 border border-green-500/30"
    },
    POSSIBLE: {
      icon: <AlertTriangle size={14} />,
      text: "Possible",
      className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
    },
    INCOMPATIBLE: {
      icon: <XCircle size={14} />,
      text: "Incompatible",
      className: "bg-red-500/20 text-red-400 border border-red-500/30"
    }
  }[compatibility.status]

  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
      {showIssues && compatibility.issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {compatibility.issues.map((issue, i) => (
            <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
              <span className="text-yellow-500">⚠</span> {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
