import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProjectData } from '@/types/electron'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  project?: ProjectData
  onSubmit: (data: Partial<ProjectData>) => void
}

export function ProjectDialog({ open, onOpenChange, mode, project, onSubmit }: ProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [okfFolderPath, setOkfFolderPath] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && project) {
        setName(project.name || '')
        setDescription(project.description || '')
        setLocalPath(project.localPath || '')
        setOkfFolderPath(project.okfFolderPath || '')
        setIcon(project.icon || '')
        setColor(project.color || '')
      } else {
        setName('')
        setDescription('')
        setLocalPath('')
        setOkfFolderPath('')
        setIcon('')
        setColor('')
      }
    }
  }, [open, mode, project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      description,
      localPath,
      okfFolderPath,
      icon,
      color,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Project' : 'Edit Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="localPath">Local Path</Label>
            <Input id="localPath" value={localPath} onChange={(e) => setLocalPath(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="okfFolderPath">OKF Folder Path</Label>
            <Input id="okfFolderPath" value={okfFolderPath} onChange={(e) => setOkfFolderPath(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📁" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#2563eb" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'create' ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
