import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM_MEMBERS } from '../lib/constants'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import NewTaskModal from '../components/NewTaskModal'
import BroadcastTaskModal from '../components/BroadcastTaskModal'

export default function Board() {
  const [tasks, setTasks] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [newTaskFor, setNewTaskFor] = useState(null)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    const [{ data: tasksData }, { data: subtasksData }] = await Promise.all([
      supabase.from('tasks').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('subtasks').select('*').order('created_at', { ascending: true }),
    ])
    setTasks(tasksData || [])
    setSubtasks(subtasksData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()

    const tasksSub = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(tasksSub)
  }, [])

  function getSubtasks(taskId) {
    return subtasks.filter((s) => s.task_id === taskId)
  }

  function handleToggleSubtask(subtask) {
    setSubtasks((prev) =>
      prev.map((s) => s.id === subtask.id ? { ...s, is_done: !s.is_done } : s)
    )
    supabase
      .from('subtasks')
      .update({ is_done: !subtask.is_done })
      .eq('id', subtask.id)
      .then()
  }

  async function handleCompleteTask(task) {
    await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', task.id)
    setSelectedTask(null)
  }

  async function handleDeleteTask(task) {
    await supabase.from('tasks').delete().eq('id', task.id)
    setSelectedTask(null)
  }

  if (loading) {
    return <div className="text-center text-slate-500 py-20">Загрузка...</div>
  }

  return (
    <>
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${TEAM_MEMBERS.length}, 1fr)` }}>
        {TEAM_MEMBERS.map((member, idx) => {
          const memberTasks = tasks.filter((t) => t.assignee === member)
          const colors = [
            { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
            { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
            { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
            { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
            { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
          ]
          const c = colors[idx % colors.length]
          return (
            <div key={member} className={`min-w-0 rounded-2xl border ${c.border} ${c.bg} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-base">{member}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                    {memberTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {member === 'Вагиз' && (
                    <button
                      onClick={() => setShowBroadcast(true)}
                      className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2 py-1 rounded-md font-medium transition-colors"
                      title="Создать задачу на всех РГ"
                    >
                      на всех
                    </button>
                  )}
                  <button
                    onClick={() => setNewTaskFor(member)}
                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 w-7 h-7 rounded-md flex items-center justify-center text-lg transition-colors"
                    title="Новая задача"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {memberTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subtasks={getSubtasks(task.id)}
                    onClick={() => setSelectedTask(task)}
                    onToggleSubtask={handleToggleSubtask}
                  />
                ))}
                {memberTasks.length === 0 && (
                  <div
                    onClick={() => setNewTaskFor(member)}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm cursor-pointer hover:border-blue-300 hover:text-blue-400 transition-colors"
                  >
                    + Добавить задачу
                  </div>
                )}
              </div>
            </div>
          )
        })}
    </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          subtasks={getSubtasks(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
          onToggleSubtask={handleToggleSubtask}
          onComplete={handleCompleteTask}
          onDelete={handleDeleteTask}
          onRefresh={fetchAll}
        />
      )}

      {newTaskFor && (
        <NewTaskModal
          defaultAssignee={newTaskFor}
          onClose={() => setNewTaskFor(null)}
          onCreated={() => { setNewTaskFor(null); fetchAll() }}
        />
      )}

      {showBroadcast && (
        <BroadcastTaskModal
          onClose={() => setShowBroadcast(false)}
          onCreated={() => { setShowBroadcast(false); fetchAll() }}
        />
      )}
    </>
  )
}
