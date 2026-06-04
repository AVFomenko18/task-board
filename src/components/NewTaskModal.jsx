import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM_MEMBERS } from '../lib/constants'

function buildDeadline(date, hour, min) {
  if (!date) return null
  return new Date(`${date}T${hour}:${min}:00`).toISOString()
}

function TimeInputs({ hour, min, onHour, onMin, disabled }) {
  return (
    <div className="flex gap-1.5 items-center mt-1.5">
      <input
        type="number" min="0" max="23" step="1"
        value={hour}
        onChange={(e) => onHour(String(Math.min(23, Math.max(0, Number(e.target.value)))).padStart(2, '0'))}
        disabled={disabled}
        placeholder="ЧЧ"
        className="w-14 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center disabled:opacity-40"
      />
      <span className="text-slate-400 font-bold">:</span>
      <input
        type="number" min="0" max="59" step="10"
        value={min}
        onChange={(e) => onMin(String(Math.min(59, Math.max(0, Number(e.target.value)))).padStart(2, '0'))}
        disabled={disabled}
        placeholder="ММ"
        className="w-14 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center disabled:opacity-40"
      />
    </div>
  )
}

const emptySubtask = () => ({ title: '', assignee: '', deadlineDate: '', deadlineHour: '09', deadlineMin: '00' })

export default function NewTaskModal({ defaultAssignee, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee: defaultAssignee || TEAM_MEMBERS[0],
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

  function setSubtaskField(idx, field, value) {
    setSubtasks((arr) => arr.map((s, i) => i === idx ? { ...s, [field]: value } : s))
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

    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        assignee: form.assignee,
        deadline: buildDeadline(form.deadlineDate, form.deadlineHour, form.deadlineMin),
      })
      .select()
      .single()

    if (taskErr) { setError(taskErr.message); setSaving(false); return }

    const validSubtasks = subtasks.filter((s) => s.title.trim())
    if (validSubtasks.length > 0) {
      await supabase.from('subtasks').insert(
        validSubtasks.map((s) => ({
          task_id: task.id,
          title: s.title.trim(),
          assignee: s.assignee || null,
          deadline: buildDeadline(s.deadlineDate, s.deadlineHour, s.deadlineMin),
        }))
      )
    }

    onCreated()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-xl">Новая задача</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Ответственный</label>
              <select
                value={form.assignee}
                onChange={(e) => setField('assignee', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 bg-white"
              >
                {TEAM_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Дедлайн</label>
              <input
                type="date" value={form.deadlineDate}
                onChange={(e) => setField('deadlineDate', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
              />
              <TimeInputs
                hour={form.deadlineHour} min={form.deadlineMin}
                onHour={(v) => setField('deadlineHour', v)}
                onMin={(v) => setField('deadlineMin', v)}
                disabled={!form.deadlineDate}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Подзадачи</label>
            <div className="space-y-3">
              {subtasks.map((s, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text" value={s.title}
                      onChange={(e) => setSubtaskField(idx, 'title', e.target.value)}
                      placeholder={`Подзадача ${idx + 1}`}
                      className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                    />
                    {subtasks.length > 1 && (
                      <button type="button" onClick={() => removeSubtaskRow(idx)} className="text-slate-300 hover:text-red-400 px-2">✕</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Ответственный</label>
                      <select
                        value={s.assignee}
                        onChange={(e) => setSubtaskField(idx, 'assignee', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
                      >
                        <option value="">— не выбран</option>
                        {TEAM_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Дедлайн</label>
                      <input
                        type="date" value={s.deadlineDate}
                        onChange={(e) => setSubtaskField(idx, 'deadlineDate', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                      />
                      <TimeInputs
                        hour={s.deadlineHour} min={s.deadlineMin}
                        onHour={(v) => setSubtaskField(idx, 'deadlineHour', v)}
                        onMin={(v) => setSubtaskField(idx, 'deadlineMin', v)}
                        disabled={!s.deadlineDate}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addSubtaskRow} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                + Добавить подзадачу
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
