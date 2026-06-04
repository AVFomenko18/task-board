import { TEAM_MEMBERS } from '../lib/constants'

export default function AssigneePicker({ selected = [], onChange }) {
  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name))
    } else {
      onChange([...selected, name])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {TEAM_MEMBERS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => toggle(name)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            selected.includes(name)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
