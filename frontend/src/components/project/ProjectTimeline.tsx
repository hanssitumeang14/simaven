import { useState } from 'react'
import { Check, Clock, ExternalLink } from 'lucide-react'

import { projectApi } from '@/api/project'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useConfirmGoodsComplete,
  useFinishProject,
  useIssueSppb,
  usePurchaseBankGaransiKopra,
  useProjectTimeline,
  useRecordBankGaransi,
  useReportGoodsComplete,
  useReportWorkStarted,
  useUploadBankGaransi,
} from '@/hooks/useProjects'
import { useIssuedSpkForProject, useUploadSignedSpk } from '@/hooks/useSpk'
import { formatRupiah, formatTanggal } from '@/lib/format'
import { PROJECT_STAGE, type Project, type ProjectStage } from '@/types/project'

type ViewerRole = 'rs' | 'vendor' | 'bank_mandiri'

interface ProjectTimelineProps {
  project: Project
  viewerRole?: ViewerRole
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ProjectTimeline({ project, viewerRole = 'rs' }: ProjectTimelineProps) {
  const { data: events = [] } = useProjectTimeline(project.id)
  const currentIndex = PROJECT_STAGE.indexOf(project.stage)

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-start gap-1 overflow-x-auto pb-2">
        {PROJECT_STAGE.map((stage, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          return (
            <div key={stage} className="min-w-[110px] flex-1">
              <div
                className={`relative h-2 rounded-full ${
                  isComplete ? 'bg-emerald-500' : isCurrent ? 'bg-blue-400' : 'bg-gray-200'
                }`}
              >
                {isComplete && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <p
                className={`mt-2 text-center text-xs font-medium ${
                  isComplete ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {stage}
              </p>
            </div>
          )
        })}
      </div>

      {/* Action panel for current stage */}
      <StageActionPanel project={project} viewerRole={viewerRole} />

      {/* Event log */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Riwayat</h4>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada riwayat tercatat.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"
              >
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{event.stage}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                  {event.note && <p className="text-gray-600">{event.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StageActionPanel({
  project,
  viewerRole,
}: {
  project: Project
  viewerRole: ViewerRole
}) {
  const recordBg = useRecordBankGaransi(project.id)
  const issueSppb = useIssueSppb(project.id)
  const reportWorkStarted = useReportWorkStarted(project.id)
  const reportGoodsComplete = useReportGoodsComplete(project.id)
  const confirmGoods = useConfirmGoodsComplete(project.id)
  const finishProject = useFinishProject(project.id)

  const [bgAmount, setBgAmount] = useState('')
  const [bgValidUntil, setBgValidUntil] = useState('')
  const [sppbNumber, setSppbNumber] = useState('')
  const [sppbDate, setSppbDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')

  const stage: ProjectStage = project.stage
  const isRs = viewerRole === 'rs'
  const isVendor = viewerRole === 'vendor'

  if (stage === 'Bidding' || stage === 'Pengumuman Menang') {
    return (
      <Panel>
        {isRs
          ? 'Tetapkan vendor pemenang di bagian "Daftar Peserta" di atas untuk lanjut ke tahap SPK.'
          : 'Menunggu RS menetapkan pemenang tender.'}
      </Panel>
    )
  }

  if (stage === 'Surat Perintah Kerja (SPK)') {
    if (!project.bg_submitted_at) {
      if (isVendor) {
        return <VendorBankGaransiPanel project={project} />
      }
      if (!isRs) {
        return <Panel>SPK telah terbit. Menunggu Bank Garansi dilengkapi.</Panel>
      }
      return (
        <Panel title="Lengkapi Bank Garansi">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bg_amount">Nominal Jaminan</Label>
              <CurrencyInput id="bg_amount" value={bgAmount} onChange={setBgAmount} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bg_valid_until">Berlaku Sampai</Label>
              <Input
                id="bg_valid_until"
                type="date"
                value={bgValidUntil}
                onChange={(e) => setBgValidUntil(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-3"
            size="sm"
            disabled={!bgAmount || !bgValidUntil || recordBg.isPending}
            onClick={() => recordBg.mutate({ amount: bgAmount, valid_until: bgValidUntil })}
          >
            Catat Bank Garansi
          </Button>
        </Panel>
      )
    }

    if (!isRs) {
      return (
        <div className="space-y-3">
          <Panel>
            Bank Garansi senilai {formatRupiah(project.bg_amount)} tercatat. Menunggu RS
            menerbitkan SPPB.
          </Panel>
          <SpkSignedDocumentSection project={project} viewerRole={viewerRole} />
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <Panel title="Bank Garansi tercatat — terbitkan SPPB">
          <p className="mb-3 text-sm text-gray-600">
            Nominal {formatRupiah(project.bg_amount)}, berlaku sampai{' '}
            {formatTanggal(project.bg_valid_until)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="sppb_number">Nomor SPPB</Label>
              <Input
                id="sppb_number"
                value={sppbNumber}
                onChange={(e) => setSppbNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sppb_date">Tanggal SPPB</Label>
              <Input
                id="sppb_date"
                type="date"
                value={sppbDate}
                onChange={(e) => setSppbDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-3"
            size="sm"
            disabled={!sppbNumber || !sppbDate || issueSppb.isPending}
            onClick={() => issueSppb.mutate({ number: sppbNumber, date: sppbDate })}
          >
            Terbitkan SPPB
          </Button>
        </Panel>
        <SpkSignedDocumentSection project={project} viewerRole={viewerRole} />
      </div>
    )
  }

  if (stage === 'Surat Pesanan Pembelian Barang (SPPB)') {
    if (isVendor) {
      return (
        <Panel title="SPPB telah diterbitkan">
          <p className="mb-3 text-sm text-gray-600">
            SPPB {project.sppb_number} ({formatTanggal(project.sppb_date)}). Silakan mulai
            pengerjaan.
          </p>
          <Button
            size="sm"
            disabled={reportWorkStarted.isPending}
            onClick={() => reportWorkStarted.mutate()}
          >
            Mulai Pengerjaan
          </Button>
        </Panel>
      )
    }
    return (
      <Panel>
        SPPB {project.sppb_number} telah diterbitkan ({formatTanggal(project.sppb_date)}).
        Menunggu vendor memulai pengerjaan.
      </Panel>
    )
  }

  if (stage === 'Pengerjaan Vendor') {
    if (!project.goods_reported_at) {
      if (isVendor) {
        return (
          <Panel title="Sedang mengerjakan">
            <p className="mb-3 text-sm text-gray-600">
              Dimulai {formatDateTime(project.work_started_at)}. Laporkan kalau pekerjaan sudah
              selesai.
            </p>
            <Button
              size="sm"
              disabled={reportGoodsComplete.isPending}
              onClick={() => reportGoodsComplete.mutate()}
            >
              Lapor Selesai
            </Button>
          </Panel>
        )
      }
      return (
        <Panel>
          Vendor sedang mengerjakan (dimulai {formatDateTime(project.work_started_at)}). Menunggu
          laporan penyelesaian dari vendor.
        </Panel>
      )
    }
    if (!isRs) {
      return (
        <Panel>
          Anda melaporkan penyelesaian pada {formatDateTime(project.goods_reported_at)}. Menunggu
          konfirmasi RS.
        </Panel>
      )
    }
    return (
      <Panel title="Vendor melaporkan pekerjaan selesai">
        <p className="mb-3 text-sm text-gray-600">
          Dilaporkan pada {formatDateTime(project.goods_reported_at)}. Periksa barang/pekerjaan
          sebelum konfirmasi.
        </p>
        <Button size="sm" disabled={confirmGoods.isPending} onClick={() => confirmGoods.mutate()}>
          Konfirmasi Barang Lengkap
        </Button>
      </Panel>
    )
  }

  if (stage === 'Barang Lengkap') {
    if (!isRs) {
      return <Panel>Barang/pekerjaan sudah dikonfirmasi lengkap. Menunggu RS menerbitkan invoice.</Panel>
    }
    return (
      <Panel title="Terbitkan Invoice untuk menyelesaikan pengadaan">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="invoice_number">Nomor Invoice</Label>
            <Input
              id="invoice_number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invoice_date">Tanggal Invoice</Label>
            <Input
              id="invoice_date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!invoiceNumber || !invoiceDate || finishProject.isPending}
          onClick={() =>
            finishProject.mutate({ invoice_number: invoiceNumber, invoice_date: invoiceDate })
          }
        >
          Selesaikan Pengadaan
        </Button>
      </Panel>
    )
  }

  return (
    <Panel title="Pengadaan selesai">
      Invoice {project.invoice_number} ({formatTanggal(project.invoice_date)}). Selesai pada{' '}
      {formatDateTime(project.finished_at)}.
    </Panel>
  )
}

function VendorBankGaransiPanel({ project }: { project: Project }) {
  const [bgChoice, setBgChoice] = useState<'unset' | 'existing' | 'kopra'>('unset')
  const [file, setFile] = useState<File | null>(null)
  const [amount, setAmount] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [kopraAmount, setKopraAmount] = useState('')
  const [kopraValidUntil, setKopraValidUntil] = useState('')
  const uploadBg = useUploadBankGaransi(project.id)
  const purchaseKopra = usePurchaseBankGaransiKopra(project.id)

  if (bgChoice === 'unset') {
    return (
      <Panel title="Bank Garansi">
        <p className="mb-3">
          SPK telah terbit. Apakah perusahaan Anda sudah memiliki Bank Garansi dari bank lain?
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setBgChoice('existing')}>
            Ya, sudah punya
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBgChoice('kopra')}>
            Belum punya
          </Button>
        </div>
      </Panel>
    )
  }

  if (bgChoice === 'kopra') {
    return (
      <Panel title="Bank Garansi via Kopra">
        <p className="mb-3">
          Terbitkan Bank Garansi secara digital lewat Kopra by Mandiri, tanpa perlu datang ke
          cabang. Integrasi API Kopra belum tersambung — isian di bawah ini adalah simulasi hasil
          penerbitannya.
        </p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!kopraAmount || !kopraValidUntil) return
            purchaseKopra.mutate({ amount: kopraAmount, valid_until: kopraValidUntil })
          }}
        >
          <div>
            <Label htmlFor="kopra-amount">Nilai Bank Garansi (Rp)</Label>
            <CurrencyInput id="kopra-amount" value={kopraAmount} onChange={setKopraAmount} required />
          </div>
          <div>
            <Label htmlFor="kopra-valid-until">Berlaku Sampai</Label>
            <Input
              id="kopra-valid-until"
              type="date"
              value={kopraValidUntil}
              onChange={(event) => setKopraValidUntil(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={purchaseKopra.isPending || !kopraAmount || !kopraValidUntil}
            >
              {purchaseKopra.isPending ? 'Memproses...' : 'Terbitkan via Kopra (Simulasi)'}
            </Button>
            <a
              href="https://www.bankmandiri.co.id/kopra-trade"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
            >
              Pelajari Kopra Trade <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Button size="sm" variant="outline" onClick={() => setBgChoice('existing')}>
              Sudah punya Bank Garansi, unggah dokumen
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setBgChoice('unset')}>
              Kembali
            </Button>
          </div>
        </form>
      </Panel>
    )
  }

  return (
    <Panel title="Unggah Bank Garansi">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!file) return
          uploadBg.mutate({ file, amount, valid_until: validUntil })
        }}
      >
        <div>
          <Label htmlFor="bg-file">Dokumen Bank Garansi</Label>
          <Input
            id="bg-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div>
          <Label htmlFor="bg-amount">Nilai Bank Garansi (Rp)</Label>
          <CurrencyInput id="bg-amount" value={amount} onChange={setAmount} required />
        </div>
        <div>
          <Label htmlFor="bg-valid-until">Berlaku Sampai</Label>
          <Input
            id="bg-valid-until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={uploadBg.isPending || !file}>
            {uploadBg.isPending ? 'Mengunggah...' : 'Unggah Bank Garansi'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setBgChoice('unset')}>
            Batal
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function SpkSignedDocumentSection({
  project,
  viewerRole,
}: {
  project: Project
  viewerRole: ViewerRole
}) {
  const { data: spk } = useIssuedSpkForProject(project.id)
  const uploadSigned = useUploadSignedSpk(spk?.id ?? '')
  const [file, setFile] = useState<File | null>(null)

  if (!spk) return null

  return (
    <Panel title="SPK yang Sudah Ditandatangani">
      {spk.signed_document_path ? (
        <a
          href={projectApi.documentUrl(spk.signed_document_path)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
        >
          Lihat dokumen SPK bertanda tangan <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : viewerRole === 'vendor' ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!file) return
            uploadSigned.mutate(file)
          }}
        >
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="spk-signed-file">
              Unggah scan/foto SPK yang sudah ditandatangani &amp; distempel
            </Label>
            <Input
              id="spk-signed-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={!file || uploadSigned.isPending}>
            {uploadSigned.isPending ? 'Mengunggah...' : 'Unggah SPK'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-gray-600">
          Vendor belum mengunggah ulang SPK yang sudah ditandatangani.
        </p>
      )}
    </Panel>
  )
}

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      {title && <h4 className="mb-2 text-sm font-semibold text-gray-900">{title}</h4>}
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  )
}
