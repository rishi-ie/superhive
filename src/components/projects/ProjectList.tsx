import { useEffect, useState } from 'react'
import { Plus, Pencil, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProjectData } from '@/types/electron'

interface ProjectListProps {
  onSelect: (project: ProjectData) => void
  onEdit: (project: ProjectData) => void
  selectedId?: string
}

export function ProjectList({ onSelect, onEdit, selectedId }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await window.electronAPI.project.list()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <FolderOpen className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No projects yet</p>
        <Button size="sm" onClick={() => onSelect({} as ProjectData)}>
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onSelect(project)}
          className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
            selectedId === project.id ? 'bg-accent' : ''
          }`}
        >
          <span className="text-base">{project.icon || '📁'}</span>
          <span className="flex-1 truncate">{project.name}</span>
          <Button
            size="sm"
            variant="ghost"
            className="size-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(project)
            }}
          >
            <Pencil className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
