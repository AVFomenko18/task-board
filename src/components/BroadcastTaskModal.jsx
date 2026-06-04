import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM_MEMBERS } from '../lib/constants'

const TARGETS = TEAM_MEMBERS.filter((m) => m !== 'Вагиз')

function buildDeadline(date, hour, min) {
  if (!date) return null
  return new Date(`${date}T${hour}:${min}:00`).toISOString()
}

const emptySubtask = () => ({ title: '' })

export default function BroadcastTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadlineDate: '',
    deadlineHour: '09',
    deadlineMin: '00',
  })
  const [subtasks, setSubtasks] = useState([emptySubtask()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function setSubtaskTitle(idx, value) {
    setSubtasks((arr) => arr.map((s, i) => i === idx ? { title: value } : s))
  }

  function addSubtaskRow() {
    setSubtasks((arr) => [...arr, emptySubtask()])
  }

  function removeSubtaskRow(idx) {
    setSubtasks((arr) => arr.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Введите название задачи'); return }
    setSaving(true)
    setError(null)

    const deadline = buildDeadline(form.deadlineDate, form.deadlineHour, form.deadlineMin)
    const validSubtasks = subtasks.filter((s) => s.title.trim())

    for (const member of TARGETS) {
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          assignee: member,
          deadline,
        })
        .select()
        .single()

      if (taskErr) { setError(taskErr.message); setSaving(false); return }

      if (validSubtasks.length > 0) {
        await supabase.from('subtasks').insert(
          validSubtasks.map((s) => ({ task_id: task.id, title: s.title.trim() }))
        )
      }
    }

    onCreated()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800 text-xl">Задача на всех</h2>
              <p className="text-xs text-slate-400 mt-1">
                Создастся отдельно для: {TARGETS.join(', ')}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl shrink-0">✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Название *</label>
            <input
              type="text" value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Что нужно сделать?"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Подробнее о задаче..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Дедлайн</label>
            <input
              type="date" value={form.deadlineDate}
              onChange={(e) => setField('deadlineDate', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
            <div className="flex gap-1.5 items-center mt-1.5">
              <input
                type="number" min="0" max="23" step="1"
                value={form.deadlineHour}
                onChange={(e) => setField('deadlineHour', String(Math.min(23, Math.max(0, Number(e.target.value)))).padStart(2, '0'))}
                disabled={!form.deadlineDate}
                placeholder="ЧЧ"
                className="w-14 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center disabled:opacity-40"
              />
              <span className="text-slate-400 font-bold">:</span>
              <input
                type="number" min="0" max="59" step="10"
                value={form.deadlineMin}
                onChange={(e) => setField('deadlineMin', String(Math.min(59, Math.max(0, Number(e.target.value)))).padStart(2, '0'))}
                disabled={!form.deadlineDate}
                placeholder="ММ"
                className="w-14 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Подзадачи</label>
            <div className="space-y-2">
              {subtasks.map((s, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text" value={s.title}
                    onChange={(e) => setSubtaskTitle(idx, e.target.value)}
                    placeholder={`Подзадача ${idx + 1}`}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                  />
                  {subtasks.length > 1 && (
                    <button type="button" onClick={() => removeSubtaskRow(idx)} className="text-slate-300 hover:text-red-400 px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSubtaskRow} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                + Добавить подзадачу
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700">
              Будет создано <strong>{TARGETS.length} задачи</strong> — по одной для каждого руководителя группы.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Создаю...' : `Создать для ${TARGETS.length} РГ`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
