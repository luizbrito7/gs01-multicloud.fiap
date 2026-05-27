import { useCallback, useEffect, useState } from 'react'
import { AddSubjectForm } from './components/AddSubjectForm'
import { CloudBadge } from './components/CloudBadge'
import { SubjectTable } from './components/SubjectTable'
import { useSubjects } from './hooks/useSubjects'

type Toast = {
  id: number
  message: string
}

export default function App() {
  const {
    subjects,
    loading,
    error,
    cloud,
    createSubject,
    toggleSubject,
    deleteSubject,
  } = useSubjects()
  const [toast, setToast] = useState<Toast | null>(null)

  const notify = useCallback((message: string) => {
    setToast({ id: Date.now(), message })
  }, [])

  async function handleCreateSubject(name: string) {
    await createSubject(name)
    notify('Materia criada.')
  }

  async function handleDeleteSubject(id: string) {
    await deleteSubject(id)
    notify('Materia excluida.')
  }

  useEffect(() => {
    if (!toast) {
      return
    }
    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-zinc-500">GS01 Multicloud</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950 sm:text-3xl">
              Global Solutions · FIAP
            </h1>
          </div>
          <CloudBadge cloud={cloud} />
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Materias</h2>
              <p className="text-sm text-zinc-600">
                Lista compartilhada entre AWS EKS, Azure AKS e CockroachDB.
              </p>
            </div>
            <AddSubjectForm createSubject={handleCreateSubject} />
          </div>

          <SubjectTable
            subjects={subjects}
            loading={loading}
            error={error}
            toggleSubject={toggleSubject}
            deleteSubject={handleDeleteSubject}
          />
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 max-w-[calc(100vw-2rem)] rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-950 shadow-lg">
          {toast.message}
        </div>
      )}
    </main>
  )
}
