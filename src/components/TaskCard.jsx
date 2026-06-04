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

export default function TaskCard({ task, subtasks, onClick, onToggleSubtask }) {
  const done = subtasks.filter((s) => s.is_done).length
  const total = subtasks.length
  const isOverdue = task.deadline && new Date(task.deadline) < new Date()

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 hover:shadow-md hover:border-blue-200 transition-all">
      <div className="cursor-pointer" onClick={onClick}>
        <h3 className="font-semibold text-slate-800 text-sm leading-snug">{task.title}</h3>
        {task.description && (
          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
        )}
        {task.deadline && (
          <span
            className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
              isOverdue ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isOverdue ? '⚠ ' : ''}Дедлайн: {formatDeadline(task.deadline)}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onToggleSubtask(subtask) }}
            >
              <div
                className={`w-[16px] h-[16px] rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  subtask.is_done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 hover:border-blue-400'
                }`}
              >
                {subtask.is_done && (
                  <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-xs ${subtask.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {subtask.title}
              </span>
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
