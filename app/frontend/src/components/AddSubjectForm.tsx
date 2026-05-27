import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { FormEvent, useState } from 'react'

type AddSubjectFormProps = {
  createSubject: (name: string) => Promise<void>
}

export function AddSubjectForm({ createSubject }: AddSubjectFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Informe o nome da materia.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createSubject(trimmed)
      setName('')
      setOpen(false)
    } catch {
      setError('Nao foi possivel adicionar a materia.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar materia
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-zinc-200 bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-zinc-950">
                Nova materia
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-zinc-600">
                Adicione uma disciplina para acompanhar no CockroachDB.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Fechar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="subject-name">
                Nome
              </label>
              <input
                autoFocus
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                id="subject-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  className="inline-flex h-10 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
                  type="button"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
