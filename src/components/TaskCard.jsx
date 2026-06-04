function formatDeadline(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const hours = d.getHours()
  const mins = d.getMinutes()
  const hasTime = hours !== 0 || mins !== 0
  if (!hasTime) return date
  return `${date}, ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function deadlineColors(dateStr) {
  if (!dateStr) return null
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600' }
  if (diff < 1)  return { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600' }
  if (diff <= 3) return { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' }
  return           { dot: 'bg-green-500',   badge: 'bg-green-100 text-green-700' }
}

export default function TaskCard({ task, subtasks, onClick, onToggleSubtask }) {
  const done = subtasks.filter((s) => s.is_done).length
  const total = subtasks.length
  const dlColors = deadlineColors(task.deadline)

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 hover:shadow-md hover:border-blue-200 transition-all">
      <div className="cursor-pointer" onClick={onClick}>
        <h3 className="font-semibold text-slate-800 text-sm leading-snug">{task.title}</h3>
        {task.description && (
          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
        )}
        {task.deadline && dlColors && (
          <span className={`inline-flex items-center gap-1.5 mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${dlColors.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dlColors.dot}`} />
            Дедлайн: {formatDeadline(task.deadline)}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-start gap-2.5 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onToggleSubtask(subtask) }}
            >
              <div className={`mt-0.5 w-[16px] h-[16px] rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                subtask.is_done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-400'
              }`}>
                {subtask.is_done && (
                  <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs ${subtask.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {subtask.title}
                </span>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {(Array.isArray(subtask.assignee) ? subtask.assignee : subtask.assignee ? [subtask.assignee] : []).map((a) => (
                    <span key={a} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{a}</span>
                  ))}
                  {subtask.deadline && (() => {
                    const c = deadlineColors(subtask.deadline)
                    return c ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${subtask.is_done ? 'bg-slate-100 text-slate-400' : c.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${subtask.is_done ? 'bg-slate-300' : c.dot}`} />
                        {formatDeadline(subtask.deadline)}
                      </span>
                    ) : null
                  })()}
                </div>
              </div>
            </div>
          ))}
          <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{done}/{total} выполнено</p>
        </div>
      )}
    </div>
  )
}
