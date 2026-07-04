import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AgentData } from '@/types/electron'

interface AgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  agent?: AgentData
  onSubmit: (data: Partial<AgentData>) => void
}

export function AgentDialog({ open, onOpenChange, mode, agent, onSubmit }: AgentDialogProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [avatar, setAvatar] = useState('')
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && agent) {
        setName(agent.name || '')
        setRole(agent.role || '')
        setDescription(agent.description || '')
        setLocalPath(agent.localPath || '')
        setAvatar(agent.avatar || '')
        setStatus(agent.status || 'idle')
      } else {
        setName('')
        setRole('')
        setDescription('')
        setLocalPath('')
        setAvatar('')
        setStatus('idle')
      }
    }
  }, [open, mode, agent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, role, description, localPath, avatar, status })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Agent' : 'Edit Agent'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Code Agent" />
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
            <Label htmlFor="avatar">Avatar</Label>
            <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="🤖" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="idle" />
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
