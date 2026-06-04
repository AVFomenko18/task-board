import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM_MEMBERS } from '../lib/constants'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysToComplete(task) {
  if (!task.completed_at || !task.created_at) return null
  const ms = new Date(task.completed_at) - new Date(task.created_at)
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function pluralDays(n) {
  if (n === 1) return 'день'
  if (n >= 2 && n <= 4) return 'дня'
  return 'дней'
}

export default function Stats() {
  const [doneTasks, setDoneTasks] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [expanded, setExpanded] = useState({})
  const [filter, setFilter] = useState(null)
  const [loading, setLoading] = useState(true)

  async function handleDelete(taskId) {
    await supabase.from('tasks').delete().eq('id', taskId)
    setDoneTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  useEffect(() => {
    async function fetchDone() {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'done')
        .order('completed_at', { ascending: false })

      const { data: subs } = await supabase
        .from('subtasks')
        .select('*')

      setDoneTasks(tasks || [])
      setSubtasks(subs || [])
      setLoading(false)
    }
    fetchDone()
  }, [])

  const avgDays = (() => {
    const times = doneTasks.map(daysToComplete).filter(Boolean)
    if (!times.length) return null
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  })()

  const byAssignee = doneTasks.reduce((acc, t) => {
    acc[t.assignee] = (acc[t.assignee] || 0) + 1
    return acc
  }, {})

  function getSubtasks(taskId) {
    return subtasks.filter((s) => s.task_id === taskId)
  }

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredTasks = filter ? doneTasks.filter((t) => t.assignee === filter) : doneTasks

  if (loading) return <div className="text-center text-slate-500 py-20">Загрузка...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Статистика и бэклог</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === null ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Все
          </button>
          {TEAM_MEMBERS.map((name) => (
            <button
              key={name}
              onClick={() => setFilter(filter === name ? null : name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === name ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <div className="text-4xl font-bold text-green-600">{filteredTasks.length}</div>
          <div className="text-sm text-slate-500 mt-1">Выполнено задач</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <div className="text-4xl font-bold text-blue-600">
            {(() => {
              const times = filteredTasks.map(daysToComplete).filter(Boolean)
              return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : '—'
            })()}
          </div>
          <div className="text-sm text-slate-500 mt-1">Среднее время (дни)</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <div className="text-4xl font-bold text-violet-600">{Object.keys(byAssignee).length}</div>
          <div className="text-sm text-slate-500 mt-1">Участников</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">По ответственным</h2>
          <div className="space-y-3">
            {TEAM_MEMBERS.map((name) => {
              const count = byAssignee[name] || 0
              const max = Math.max(...TEAM_MEMBERS.map(m => byAssignee[m] || 0), 1)
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-28 truncate font-medium">{name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Выполненные задачи</h2>

        {filteredTasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Нет выполненных задач</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const days = daysToComplete(task)
              const subs = getSubtasks(task.id)
              const isOpen = expanded[task.id]
              return (
                <div key={task.id} className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {task.assignee} · завершено {formatDate(task.completed_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {days && (
                        <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                          {days} {pluralDays(days)}
                        </span>
                      )}
                      {subs.length > 0 && (
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          {isOpen ? '▲' : '▼'} {subs.filter(s => s.is_done).length}/{subs.length}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        title="Удалить"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {isOpen && subs.length > 0 && (
                    <div className="mt-2 ml-2 space-y-1.5">
                      {subs.map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${s.is_done ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                            {s.is_done && (
                              <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs ${s.is_done ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                            {s.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
