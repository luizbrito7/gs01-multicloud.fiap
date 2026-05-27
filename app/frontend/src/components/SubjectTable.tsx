import { Trash2 } from 'lucide-react'
import type { Subject } from '../hooks/useSubjects'

type SubjectTableProps = {
  subjects: Subject[]
  loading: boolean
  error: string | null
  toggleSubject: (id: string) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function SubjectTable({
  subjects,
  loading,
  error,
  toggleSubject,
  deleteSubject,
}: SubjectTableProps) {
  if (loading) {
    return (
      <div className="rounded-md border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Carregando materias...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
            <tr>
              <th className="w-28 px-4 py-3">Concluido</th>
              <th className="min-w-64 px-4 py-3">Materia</th>
              <th className="min-w-40 px-4 py-3">Criado em</th>
              <th className="w-24 px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {subjects.map((subject) => (
              <tr key={subject.id} className="bg-white">
                <td className="px-4 py-3">
                  <input
                    aria-label={`Marcar ${subject.name}`}
                    checked={subject.completed}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-950"
                    type="checkbox"
                    onChange={() => void toggleSubject(subject.id)}
                  />
                </td>
                <td
                  className={`px-4 py-3 font-medium ${
                    subject.completed ? 'text-zinc-400 line-through' : 'text-zinc-950'
                  }`}
                >
                  {subject.name}
                </td>
                <td className="px-4 py-3 text-zinc-600">{formatDate(subject.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    aria-label={`Excluir ${subject.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                    type="button"
                    onClick={() => void deleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={4}>
                  Nenhuma materia cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
