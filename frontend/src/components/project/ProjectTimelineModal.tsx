import { FileText, X } from 'lucide-react'

import { ProjectTimeline } from '@/components/project/ProjectTimeline'
import { formatRupiah } from '@/lib/format'
import type { Project } from '@/types/project'

interface ProjectTimelineModalProps {
  project: Project
  onClose: () => void
}

export function ProjectTimelineModal({ project, onClose }: ProjectTimelineModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{project.name}</h2>
              <p className="text-sm text-blue-100">
                Kode: {project.code} · HPS {formatRupiah(project.hps)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <ProjectTimeline project={project} viewerRole="bank_mandiri" />
        </div>

        <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
