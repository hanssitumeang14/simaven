import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { SpkCreateInput } from '@/api/spk'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSpk } from '@/hooks/useSpk'
import { formatRupiah } from '@/lib/format'

/**
 * Skema ini mencerminkan validasi Pydantic di backend. Keduanya sengaja ditulis
 * terpisah: yang ini untuk umpan balik langsung ke pengguna, yang di backend
 * sebagai penentu akhir karena frontend selalu bisa dilewati.
 */
const itemSchema = z.object({
  description: z.string().min(1, 'Uraian pekerjaan wajib diisi'),
  unit: z.string().min(1, 'Satuan wajib diisi').max(30),
  quantity: z.coerce.number().positive('Volume harus lebih dari 0'),
  unit_price: z.coerce.number().nonnegative('Harga satuan tidak boleh negatif'),
})

const spkSchema = z
  .object({
    project_id: z.string().uuid('Pilih paket pengadaan'),
    vendor_id: z.string().uuid('Pilih vendor'),
    issued_date: z.string().min(1, 'Tanggal terbit wajib diisi'),
    start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
    end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
    work_description: z.string().min(10, 'Uraian minimal 10 karakter'),
    payment_terms: z.string().optional(),
    penalty_clause: z.string().optional(),
    signatory_name: z.string().min(1, 'Nama penanda tangan wajib diisi'),
    signatory_position: z.string().min(1, 'Jabatan wajib diisi'),
    items: z.array(itemSchema).min(1, 'Tambahkan minimal satu baris pekerjaan'),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path: ['end_date'],
  })

type SpkFormValues = z.infer<typeof spkSchema>

const EMPTY_ITEM = { description: '', unit: '', quantity: 1, unit_price: 0 }

interface SpkFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  vendorId: string
  projectName: string
  onCreated?: (spkId: string) => void
}

export function SpkFormDialog({
  open,
  onOpenChange,
  projectId,
  vendorId,
  projectName,
  onCreated,
}: SpkFormDialogProps) {
  const createSpk = useCreateSpk()

  const form = useForm<SpkFormValues>({
    resolver: zodResolver(spkSchema),
    defaultValues: {
      project_id: projectId,
      vendor_id: vendorId,
      issued_date: new Date().toISOString().slice(0, 10),
      start_date: '',
      end_date: '',
      work_description: '',
      payment_terms: '',
      penalty_clause: '',
      signatory_name: 'Dr. dr. Iwan Dakota, Sp.JP(K), MARS, FACC, FESC',
      signatory_position: 'Direktur Utama Rumah Sakit Jantung dan Pembuluh Darah Harapan Kita',
      items: [EMPTY_ITEM],
    },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const items = watch('items')
  const total = items.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0),
    0,
  )

  const onSubmit = handleSubmit(async (values) => {
    // Nilai uang dikirim sebagai string supaya presisi Decimal terjaga di backend.
    const payload: SpkCreateInput = {
      ...values,
      items: values.items.map((item) => ({
        description: item.description,
        unit: item.unit,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
      })),
    }
    const spk = await createSpk.mutateAsync(payload)
    reset()
    onOpenChange(false)
    onCreated?.(spk.id)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Surat Perintah Kerja</DialogTitle>
          <DialogDescription>
            Nomor SPK dibuat otomatis oleh sistem setelah data disimpan. {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="grid grid-cols-3 gap-4">
            <Field label="Tanggal terbit" error={errors.issued_date?.message}>
              <Input type="date" {...register('issued_date')} />
            </Field>
            <Field label="Mulai pekerjaan" error={errors.start_date?.message}>
              <Input type="date" {...register('start_date')} />
            </Field>
            <Field label="Selesai pekerjaan" error={errors.end_date?.message}>
              <Input type="date" {...register('end_date')} />
            </Field>
          </section>

          <Field label="Lingkup pekerjaan" error={errors.work_description?.message}>
            <Textarea rows={3} {...register('work_description')} />
          </Field>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rincian pekerjaan</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(EMPTY_ITEM)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Tambah baris
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Input
                      placeholder="Uraian pekerjaan"
                      {...register(`items.${index}.description`)}
                    />
                    <FieldError message={errors.items?.[index]?.description?.message} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Satuan" {...register(`items.${index}.unit`)} />
                    <FieldError message={errors.items?.[index]?.unit?.message} />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Volume"
                      {...register(`items.${index}.quantity`)}
                    />
                    <FieldError message={errors.items?.[index]?.quantity?.message} />
                  </div>
                  <div className="col-span-2">
                    <Controller
                      control={control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <CurrencyInput
                          placeholder="Harga satuan"
                          value={field.value ? String(field.value) : ''}
                          onChange={(v) => field.onChange(v ? Number(v) : 0)}
                        />
                      )}
                    />
                    <FieldError message={errors.items?.[index]?.unit_price?.message} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus baris ${index + 1}`}
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <FieldError message={errors.items?.root?.message ?? errors.items?.message} />

            <div className="flex justify-end border-t pt-3 text-sm">
              <span className="text-muted-foreground mr-3">Total</span>
              <span className="font-medium">{formatRupiah(total)}</span>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <Field label="Cara pembayaran">
              <Textarea rows={2} {...register('payment_terms')} />
            </Field>
            <Field label="Sanksi dan denda">
              <Textarea rows={2} {...register('penalty_clause')} />
            </Field>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <Field label="Nama penanda tangan" error={errors.signatory_name?.message}>
              <Input {...register('signatory_name')} />
            </Field>
            <Field label="Jabatan" error={errors.signatory_position?.message}>
              <Input {...register('signatory_position')} />
            </Field>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || createSpk.isPending}>
            {createSpk.isPending ? 'Menyimpan…' : 'Simpan SPK'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-destructive text-xs">{message}</p>
}
