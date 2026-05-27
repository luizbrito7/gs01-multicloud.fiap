import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export type CloudName = 'aws' | 'azure' | 'unknown' | string

export type Subject = {
  id: string
  name: string
  completed: boolean
  created_at: string
}

type ApiResponse<T> = {
  data: T
  cloud: CloudName
}

type DeleteResponse = {
  cloud: CloudName
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloud, setCloud] = useState<CloudName>('unknown')

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<ApiResponse<Subject[]>>('/api/subjects')
      setSubjects(response.data.data)
      setCloud(response.data.cloud)
    } catch {
      setError('Nao foi possivel carregar as materias.')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSubject = useCallback(async (name: string) => {
    const response = await api.post<ApiResponse<Subject>>('/api/subjects', { name })
    setSubjects((current) => [...current, response.data.data])
    setCloud(response.data.cloud)
  }, [])

  const toggleSubject = useCallback(async (id: string) => {
    const response = await api.patch<ApiResponse<Subject>>(`/api/subjects/${id}`)
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? response.data.data : subject,
      ),
    )
    setCloud(response.data.cloud)
  }, [])

  const deleteSubject = useCallback(async (id: string) => {
    const response = await api.delete<DeleteResponse>(`/api/subjects/${id}`)
    setSubjects((current) => current.filter((subject) => subject.id !== id))
    setCloud(response.data.cloud)
  }, [])

  useEffect(() => {
    void fetchSubjects()
  }, [fetchSubjects])

  return {
    subjects,
    loading,
    error,
    cloud,
    fetchSubjects,
    createSubject,
    toggleSubject,
    deleteSubject,
  }
}
