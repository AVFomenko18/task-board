import { useState } from 'react'
import { supabase } from '../lib/supabase'
import AssigneePicker from './AssigneePicker'
import { TEAM_MEMBERS } from '../lib/constants'

function formatDeadline(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const h = d.getHours(), m = d.getMinutes()
  return (h || m) ? `${date}, ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` : date
}

function deadlineColors(dateStr) {
  if (!dateStr) return null
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600' }
  if (diff < 1)  return { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600' }
  if (diff <= 3) return { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' }
  return           { dot: 'bg-green-500',   badge: 'bg-green-100 text-green-700' }
}

function TimeInputs({ hour, min, onHour, onMin, disabled }) {
  return (
    <div className="flex gap-1 items-center mt-1">
      <input type="number" min="0" max="23" step="1" value={hour}
        onChange={(e) => onHour(String(Math.min(23,Math.max(0,Number(e.target.value)))).padStart(2,'0'))}
        disabled={disabled}
        className="w-12 text-xs border border-slate-200 rounded px-1 py-1.5 text-center focus:outline-none focus:border-blue-400 disabled:opacity-40"
      />
      <span className="text-slate-400 text-xs">:</span>
      <input type="number" min="0" max="59" step="10" value={min}
        onChange={(e) => onMin(String(Math.min(59,Math.max(0,Number(e.target.value)))).padStart(2,'0'))}
        disabled={disabled}
        className="w-12 text-xs border border-slate-200 rounded px-1 py-1.5 text-center focus:outline-none focus:border-blue-400 disabled:opacity-40"
      />
    </div>
  )
}

function SubtaskEditForm({ subtask, onSave, onCancel }) {
  const [title, setTitle] = useState(subtask.title)
  const [assignees, setAssignees] = useState(
    Array.isArray(subtask.assignee) ? subtask.assignee : subtask.assignee ? [subtask.assignee] : []
  )
  const existing = subtask.deadline ? new Date(subtask.deadline) : null
  const [deadlineDate, setDeadlineDate] = useState(
    existing ? existing.toLocaleDateString('en-CA') : ''
  )
  const [deadlineHour, setDeadlineHour] = useState(
    existing ? String(existing.getHours()).padStart(2,'0') : '09'
  )
  const [deadlineMin, setDeadlineMin] = useState(
    existing ? String(Math.round(existing.getMinutes()/10)*10).padStart(2,'0') : '00'
  )

  async function handleSave() {
    if (!title.trim()) return
    const deadline = deadlineDate
      ? new Date(`${deadlineDate}T${deadlineHour}:${deadlineMin}:00`).toISOString()
      : null
    await supabase.from('subtasks').update({
      title: title.trim(),
      assignee: assignees.length > 0 ? assignees : null,
      deadline,
    }).eq('id', subtask.id)
    onSave()
  }

  return (
    <div className="border border-blue-200 rounded-xl p-3 space-y-2.5 bg-blue-50/30">
      <input
        type="text" value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
        autoFocus
      />
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Ответственные</label>
        <AssigneePicker selected={assignees} onChange={setAssignees} />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Дедлайн</label>
        <input type="date" value={deadlineDate}
          onChange={(e) => setDeadlineDate(e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
        />
        <TimeInputs
          hour={deadlineHour} min={deadlineMin}
          onHour={setDeadlineHour} onMin={setDeadlineMin}
          disabled={!deadlineDate}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-700">Отмена</button>
        <button type="button" onClick={handleSave} disabled={!title.trim()} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-40">
          Сохранить
        </button>
      </div>
    </div>
  )
}

const emptyNew = { title: '', assignees: [], deadlineDate: '', deadlineHour: '09', deadlineMin: '00' }

function initEditForm(task) {
  const d = task.deadline ? new Date(task.deadline) : null
  return {
    title: task.title,
    description: task.description || '',
    assignee: task.assignee,
    deadlineDate: d ? d.toLocaleDateString('en-CA') : '',
    deadlineHour: d ? String(d.getHours()).padStart(2, '0') : '09',
    deadlineMin: d ? String(Math.round(d.getMinutes() / 10) * 10).padStart(2, '0') : '00',
  }
}

export default function TaskModal({ task, subtasks, onClose, onToggleSubtask, onComplete, onDelete, onRefresh }) {
  const [newSub, setNewSub] = useState(emptyNew)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingTask, setEditingTask] = useState(false)
  const [editForm, setEditForm] = useState(() => initEditForm(task))
  const [savingTask, setSavingTask] = useState(false)

  const done = subtasks.filter((s) => s.is_done).length
  const total = subtasks.length
  const dlColors = deadlineColors(task.deadline)

  function formatTaskDate(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    const h = d.getHours(), m = d.getMinutes()
    return (h || m) ? `${date}, ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` : date
  }

  function setEditField(field, value) {
    setEditForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSaveTask() {
    if (!editForm.title.trim()) return
    setSavingTask(true)
    const deadline = editForm.deadlineDate
      ? new Date(`${editForm.deadlineDate}T${editForm.deadlineHour}:${editForm.deadlineMin}:00`).toISOString()
      : null
    await supabase.from('tasks').update({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      assignee: editForm.assignee,
      deadline,
    }).eq('id', task.id)
    setSavingTask(false)
    setEditingTask(false)
    onRefresh()
  }

  function setNewField(field, value) {
    setNewSub((s) => ({ ...s, [field]: value }))
  }

  async function handleAddSubtask(e) {
    e.preventDefault()
    if (!newSub.title.trim()) return
    setAdding(true)
    const deadline = newSub.deadlineDate
      ? new Date(`${newSub.deadlineDate}T${newSub.deadlineHour}:${newSub.deadlineMin}:00`).toISOString()
      : null
    await supabase.from('subtasks').insert({
      task_id: task.id,
      title: newSub.title.trim(),
      assignee: newSub.assignees.length > 0 ? newSub.assignees : null,
      deadline,
    })
    setNewSub(emptyNew)
    setAdding(false)
    setShowAddForm(false)
    onRefresh()
  }

  async function handleDeleteSubtask(subtaskId) {
    await supabase.from('subtasks').delete().eq('id', subtaskId)
    onRefresh()
  }

  const assigneeList = (subtask) => {
    if (!subtask.assignee) return []
    return Array.isArray(subtask.assignee) ? subtask.assignee : [subtask.assignee]
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100">
          {editingTask ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Редактирование</span>
                <button onClick={() => setEditingTask(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
              </div>
              <input
                type="text" value={editForm.title}
                onChange={(e) => setEditField('title', e.target.value)}
                className="w-full text-base font-bold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditField('description', e.target.value)}
                placeholder="Описание..."
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ответственный</label>
                  <select
                    value={editForm.assignee}
                    onChange={(e) => setEditField('assignee', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:border-blue-400"
                  >
                    {TEAM_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Дедлайн</label>
                  <input
                    type="date" value={editForm.deadlineDate}
                    onChange={(e) => setEditField('deadlineDate', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400"
                  />
                  <TimeInputs
                    hour={editForm.deadlineHour} min={editForm.deadlineMin}
                    onHour={(v) => setEditField('deadlineHour', v)}
                    onMin={(v) => setEditField('deadlineMin', v)}
                    disabled={!editForm.deadlineDate}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingTask(false)} className="text-sm text-slate-500 hover:text-slate-700">Отмена</button>
                <button
                  onClick={handleSaveTask}
                  disabled={savingTask || !editForm.title.trim()}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
                >
                  {savingTask ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-slate-800 text-xl leading-tight">{task.title}</h2>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setEditForm(initEditForm(task)); setEditingTask(true) }}
                    className="text-slate-400 hover:text-blue-500 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    title="Редактировать"
                  >
                    ✏️ Изменить
                  </button>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">✕</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">👤 {task.assignee}</span>
                {task.deadline && dlColors ? (
                  <span className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium ${dlColors.badge}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dlColors.dot}`} />
                    {formatTaskDate(task.deadline)}
                  </span>
                ) : (
                  <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Без дедлайна</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Описание</h3>
              <p className="text-slate-700 text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Подзадачи {total > 0 ? `(${done}/${total})` : ''}
            </h3>

            {subtasks.length === 0 && <p className="text-slate-400 text-sm">Нет подзадач</p>}

            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id}>
                  {editingId === subtask.id ? (
                    <SubtaskEditForm
                      subtask={subtask}
                      onSave={() => { setEditingId(null); onRefresh() }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-start gap-3 group">
                      <button
                        onClick={() => onToggleSubtask(subtask)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          subtask.is_done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        {subtask.is_done && (
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${subtask.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {subtask.title}
                        </span>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {assigneeList(subtask).map((a) => (
                            <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">👤 {a}</span>
                          ))}
                          {subtask.deadline && (() => {
                            const c = deadlineColors(subtask.deadline)
                            return c ? (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${subtask.is_done ? 'bg-slate-100 text-slate-400' : c.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${subtask.is_done ? 'bg-slate-300' : c.dot}`} />
                                {formatDeadline(subtask.deadline)}
                              </span>
                            ) : null
                          })()}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => setEditingId(subtask.id)}
                          className="text-slate-400 hover:text-blue-500 text-xs px-1.5 py-1 rounded hover:bg-blue-50"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="text-slate-300 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} className="mt-3 text-sm text-blue-500 hover:text-blue-700 font-medium">
                + Добавить подзадачу
              </button>
            ) : (
              <form onSubmit={handleAddSubtask} className="mt-3 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <input
                  type="text" value={newSub.title}
                  onChange={(e) => setNewField('title', e.target.value)}
                  placeholder="Название подзадачи..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                  autoFocus
                />
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Ответственные</label>
                  <AssigneePicker selected={newSub.assignees} onChange={(v) => setNewField('assignees', v)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Дедлайн</label>
                  <input type="date" value={newSub.deadlineDate}
                    onChange={(e) => setNewField('deadlineDate', e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                  />
                  <TimeInputs
                    hour={newSub.deadlineHour} min={newSub.deadlineMin}
                    onHour={(v) => setNewField('deadlineHour', v)}
                    onMin={(v) => setNewField('deadlineMin', v)}
                    disabled={!newSub.deadlineDate}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-slate-500 hover:text-slate-700">Отмена</button>
                  <button type="submit" disabled={adding || !newSub.title.trim()} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-40">
                    Добавить
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-between">
          <button onClick={() => onDelete(task)} className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors">
            Удалить задачу
          </button>
          <button onClick={() => onComplete(task)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Отметить выполненной
          </button>
        </div>
      </div>
    </div>
  )
}
