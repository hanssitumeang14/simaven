import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateProject } from '@/hooks/useProjects'
import { BANK_GROUP } from '@/types/vendor'
import { PROJECT_TYPE } from '@/types/project'
import { VENDOR_CATEGORY } from '@/types/vendor'

const projectSchema = z.object({
  name: z.string().min(5, 'Nama pengadaan minimal 5 karakter'),
  type: z.enum(PROJECT_TYPE, { message: 'Pilih jenis pengadaan' }),
  budget: z
    .string()
    .min(1, 'Pagu wajib diisi')
    .refine((v) => Number(v) > 0, 'Pagu harus lebih dari 0'),
  hps: z
    .string()
    .min(1, 'HPS wajib diisi')
    .refine((v) => Number(v) > 0, 'HPS harus lebih dari 0'),
  bank: z.enum(BANK_GROUP).optional(),
  vendor_category: z.enum(VENDOR_CATEGORY, { message: 'Pilih kategori vendor yang dibutuhkan' }),
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectFormDialog({ open, onOpenChange }: ProjectFormDialogProps) {
  const createProject = useCreateProject()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) })

  const onSubmit = handleSubmit(async (values) => {
    await createProject.mutateAsync({
      name: values.name,
      type: values.type,
      budget: values.budget,
      hps: values.hps,
      bank: values.bank,
      vendor_category: values.vendor_category,
    })
    reset()
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buka Tender Baru</DialogTitle>
          <DialogDescription>
            Kode pengadaan dibuat otomatis oleh sistem (VMS + bulan/tahun + urutan).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Pengadaan</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jenis Pengadaan</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v as ProjectFormValues['type'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Kategori Vendor Dibutuhkan</Label>
              <Select
                value={watch('vendor_category')}
                onValueChange={(v) => setValue('vendor_category', v as ProjectFormValues['vendor_category'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORY.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendor_category && (
                <p className="text-xs text-destructive">{errors.vendor_category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Pagu Anggaran</Label>
              <CurrencyInput value={watch('budget') ?? ''} onChange={(v) => setValue('budget', v)} />
              {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>HPS</Label>
              <CurrencyInput value={watch('hps') ?? ''} onChange={(v) => setValue('hps', v)} />
              {errors.hps && <p className="text-xs text-destructive">{errors.hps.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bank (opsional)</Label>
            <Select value={watch('bank')} onValueChange={(v) => setValue('bank', v as ProjectFormValues['bank'])}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bank" />
              </SelectTrigger>
              <SelectContent>
                {BANK_GROUP.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || createProject.isPending}>
            {createProject.isPending ? 'Menyimpan…' : 'Buka Tender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
