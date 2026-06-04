import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TaskModal({ task, subtasks, onClose, onToggleSubtask, onComplete, onDelete, onRefresh }) {
  const [newSubtask, setNewSubtask] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)

  const done = subtasks.filter((s) => s.is_done).length
  const total = subtasks.length

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date()

  async function handleAddSubtask(e) {
    e.preventDefault()
    if (!newSubtask.trim()) return
    setAddingSubtask(true)
    await supabase.from('subtasks').insert({ task_id: task.id, title: newSubtask.trim() })
    setNewSubtask('')
    setAddingSubtask(false)
    onRefresh()
  }

  async function handleDeleteSubtask(subtaskId) {
    await supabase.from('subtasks').delete().eq('id', subtaskId)
    onRefresh()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold text-slate-800 text-xl leading-tight">{task.title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              👤 {task.assignee}
            </span>
            <span
              className={`text-sm px-2.5 py-1 rounded-full font-medium ${
                isOverdue ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-700'
              }`}
            >
              📅 {formatDate(task.deadline)}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Описание</h3>
              <p className="text-slate-700 text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Подзадачи {total > 0 ? `(${done}/${total})` : ''}
              </h3>
            </div>

            {subtasks.length === 0 && (
              <p className="text-slate-400 text-sm">Нет подзадач</p>
            )}

            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-3 group">
                  <button
                    onClick={() => onToggleSubtask(subtask)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      subtask.is_done
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {subtask.is_done && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${subtask.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2 mt-3">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Добавить подзадачу..."
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={addingSubtask || !newSubtask.trim()}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                +
              </button>
            </form>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-between">
          <button
            onClick={() => onDelete(task)}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Удалить задачу
          </button>
          <button
            onClick={() => onComplete(task)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Отметить выполненной
          </button>
        </div>
      </div>
    </div>
  )
}
