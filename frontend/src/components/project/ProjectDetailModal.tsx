import { useState } from 'react'
import { AlertTriangle, Award, Building2, FileText, MessageCircle, Trash2, Users, X } from 'lucide-react'

import { ProjectTimeline } from '@/components/project/ProjectTimeline'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAddParticipant,
  useAwardVendor,
  useProjectNotifications,
  useProjectParticipants,
  useRemoveParticipant,
  useUpdateParticipant,
} from '@/hooks/useProjects'
import { useVendors } from '@/hooks/useVendors'
import { formatRupiah } from '@/lib/format'
import type { Project, ProjectParticipant } from '@/types/project'
import { average5C } from '@/types/vendor'

const LOW_5C_THRESHOLD = 60

interface ProjectDetailModalProps {
  project: Project
  onClose: () => void
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const { data: participants = [] } = useProjectParticipants(project.id)
  const { data: vendorPage } = useVendors({ page: 1, size: 100 })
  const { data: notifications = [] } = useProjectNotifications(project.id)
  const addParticipant = useAddParticipant(project.id)
  const awardVendor = useAwardVendor(project.id)
  const removeParticipant = useRemoveParticipant(project.id)

  const [newVendorId, setNewVendorId] = useState('')
  const [newBidPrice, setNewBidPrice] = useState('')

  const participatingIds = new Set(participants.map((p) => p.vendor_id))
  const availableVendors = (vendorPage?.items ?? []).filter((v) => !participatingIds.has(v.id))

  const winner = participants.find((p) => p.vendor_id === project.winning_vendor_id)

  function handleAddParticipant() {
    if (!newVendorId || !newBidPrice) return
    addParticipant.mutate(
      { vendor_id: newVendorId, bid_price: newBidPrice },
      {
        onSuccess: () => {
          setNewVendorId('')
          setNewBidPrice('')
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{project.name}</h2>
              <p className="text-sm text-blue-100">Kode: {project.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Timeline — di atas supaya panel aksi (Terbitkan SPPB/Invoice/dll) langsung
              terlihat tanpa perlu scroll. */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Timeline Pengadaan</h3>
            <ProjectTimeline project={project} />
          </div>

          {/* Project Info */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Informasi Proyek</h3>
            <div className="grid grid-cols-2 gap-6 rounded-lg bg-gray-50 p-6">
              <InfoField label="Kode Paket" value={project.code} />
              <InfoField label="Nama Paket" value={project.name} />
              <InfoField label="Jenis Pengadaan" value={project.type} />
              <InfoField label="Pagu" value={formatRupiah(project.budget)} />
              <InfoField label="HPS" value={formatRupiah(project.hps)} />
              <InfoField label="Bank" value={project.bank ?? '-'} />
            </div>
          </div>

          {/* Winning Vendor */}
          {winner && (
            <div className="mb-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Award className="h-5 w-5 text-yellow-500" />
                Pemenang
              </h3>
              <div className="rounded-lg border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 p-6">
                <div className="grid grid-cols-3 gap-4">
                  <InfoField label="Nama Pemenang" value={winner.vendor.company_name} strong />
                  <InfoField label="Jenis Bank" value={winner.vendor.bank} />
                  <InfoField label="Alamat" value={winner.vendor.address} />
                  <InfoField label="NPWP" value={winner.vendor.npwp} />
                  <InfoField label="Harga Penawaran" value={formatRupiah(winner.bid_price)} />
                  <InfoField
                    label="Harga Terkoreksi"
                    value={winner.corrected_price ? formatRupiah(winner.corrected_price) : '-'}
                  />
                  <div className="col-span-3">
                    <InfoField
                      label="Hasil Negosiasi"
                      value={winner.negotiated_price ? formatRupiah(winner.negotiated_price) : '-'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp notifications */}
          {notifications.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                Notifikasi WhatsApp Vendor
              </h3>
              <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-2 text-xs text-gray-500">
                  Pesan pengumuman pemenang tender berikut disiapkan untuk dikirim ke setiap
                  vendor. Pengiriman otomatis via WhatsApp belum terhubung ke provider, jadi
                  status akan tetap "Menunggu" sampai integrasi tersedia.
                </p>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-4 rounded-md border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{n.recipient_phone}</p>
                      <p className="text-sm text-gray-600">{n.message}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-700'
                          : n.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {n.status === 'sent' ? 'Terkirim' : n.status === 'failed' ? 'Gagal' : 'Menunggu'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add participant */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Tambah Peserta Tender</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-600">Vendor</label>
                <Select value={newVendorId} onValueChange={setNewVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="mb-1 block text-xs text-gray-600">Harga Penawaran</label>
                <CurrencyInput value={newBidPrice} onChange={setNewBidPrice} placeholder="0" />
              </div>
              <Button
                onClick={handleAddParticipant}
                disabled={!newVendorId || !newBidPrice || addParticipant.isPending}
              >
                Tambah
              </Button>
            </div>
          </div>

          {/* Participating Vendors */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5 text-blue-500" />
              Daftar Peserta
            </h3>

            {participants.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                        Nama Vendor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                        Harga Penawaran
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                        Harga Terkoreksi
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                        Hasil Negosiasi
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participants.map((p) => (
                      <ParticipantRow
                        key={p.vendor_id}
                        participant={p}
                        isWinner={p.vendor_id === project.winning_vendor_id}
                        projectId={project.id}
                        onAward={() => awardVendor.mutate(p.vendor_id)}
                        onRemove={() => removeParticipant.mutate(p.vendor_id)}
                        awardPending={awardVendor.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <Building2 className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Belum ada peserta tender</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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

function InfoField({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-600">{label}</label>
      <div className={strong ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}>
        {value}
      </div>
    </div>
  )
}

function ParticipantRow({
  participant,
  isWinner,
  projectId,
  onAward,
  onRemove,
  awardPending,
}: {
  participant: ProjectParticipant
  isWinner: boolean
  projectId: string
  onAward: () => void
  onRemove: () => void
  awardPending: boolean
}) {
  const updateParticipant = useUpdateParticipant(projectId)
  const [corrected, setCorrected] = useState(participant.corrected_price ?? '')
  const [negotiated, setNegotiated] = useState(participant.negotiated_price ?? '')

  const dirty =
    corrected !== (participant.corrected_price ?? '') ||
    negotiated !== (participant.negotiated_price ?? '')

  const avgScore = average5C(participant.vendor.financial_score)
  const lowScore = avgScore !== null && avgScore < LOW_5C_THRESHOLD

  function handleSave() {
    updateParticipant.mutate({
      vendorId: participant.vendor_id,
      input: {
        ...(corrected ? { corrected_price: corrected } : {}),
        ...(negotiated ? { negotiated_price: negotiated } : {}),
      },
    })
  }

  function handleAward() {
    if (
      lowScore &&
      !confirm(
        `Skor 5C rata-rata vendor ini ${avgScore} (di bawah ${LOW_5C_THRESHOLD}). Tetap tetapkan sebagai pemenang?`,
      )
    ) {
      return
    }
    onAward()
  }

  return (
    <tr className={isWinner ? 'bg-yellow-50' : ''}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {participant.vendor.company_name}
        {isWinner && (
          <span className="ml-2 inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            <Award className="mr-1 h-3 w-3" />
            Pemenang
          </span>
        )}
        {lowScore && (
          <span
            className="ml-2 inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
            title="Skor 5C rata-rata rendah"
          >
            <AlertTriangle className="h-3 w-3" />
            5C: {avgScore}
          </span>
        )}
        <div className="text-xs font-normal text-gray-500">{participant.vendor.npwp}</div>
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
        {formatRupiah(participant.bid_price)}
      </td>
      <td className="px-4 py-3 text-right">
        <CurrencyInput value={corrected} onChange={setCorrected} className="ml-auto w-32 text-right" />
      </td>
      <td className="px-4 py-3 text-right">
        <CurrencyInput value={negotiated} onChange={setNegotiated} className="ml-auto w-32 text-right" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={updateParticipant.isPending}>
              Simpan
            </Button>
          )}
          {!isWinner && (
            <Button
              size="sm"
              onClick={handleAward}
              disabled={awardPending || participant.vendor.status !== 'verified'}
              title={
                participant.vendor.status !== 'verified'
                  ? 'Vendor belum terverifikasi'
                  : lowScore
                    ? `Skor 5C rata-rata rendah (${avgScore})`
                    : 'Tetapkan sebagai pemenang'
              }
            >
              Tetapkan Menang
            </Button>
          )}
          {!isWinner && (
            <button
              onClick={onRemove}
              className="rounded-md p-2 text-muted-foreground hover:bg-gray-100 hover:text-destructive"
              title="Hapus peserta"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
