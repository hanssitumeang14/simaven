import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { ApiRequestError } from '@/lib/api-client'
import { BANK_GROUP, VENDOR_CATEGORY } from '@/types/vendor'

const vendorRegisterSchema = z.object({
  npwp: z.string().min(15, 'NPWP tidak valid'),
  company_name: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
  company_type: z.string().min(1, 'Jenis perusahaan wajib diisi'),
  director_name: z.string().min(3, 'Nama direktur minimal 3 karakter'),
  category: z.enum(VENDOR_CATEGORY, { message: 'Pilih kategori vendor' }),
  city: z.string().min(1, 'Kota wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(8, 'Nomor telepon tidak valid'),
  bank: z.enum(BANK_GROUP, { message: 'Pilih bank rekanan' }),
  bank_name: z.string().min(1, 'Nama bank wajib diisi'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

type VendorRegisterValues = z.infer<typeof vendorRegisterSchema>

export function RegisterVendorPage() {
  const { registerVendor } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VendorRegisterValues>({ resolver: zodResolver(vendorRegisterSchema) })

  async function onSubmit(values: VendorRegisterValues) {
    setFormError(null)
    const { password, ...vendor } = values
    try {
      await registerVendor({ vendor, password })
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : 'Terjadi kesalahan tak terduga',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Daftar sebagai Vendor</CardTitle>
          <CardDescription>
            Isi data perusahaan Anda untuk mendaftar sebagai rekanan RSJPD Harapan Kita. Setelah
            mendaftar, status perusahaan Anda &ldquo;Menunggu&rdquo; sampai diverifikasi RS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="npwp">NPWP</Label>
                <Input id="npwp" placeholder="00.000.000.0-000.000" {...register('npwp')} />
                {errors.npwp && <p className="text-sm text-destructive">{errors.npwp.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_type">Jenis Perusahaan</Label>
                <Input id="company_type" placeholder="PT / CV / dst" {...register('company_type')} />
                {errors.company_type && (
                  <p className="text-sm text-destructive">{errors.company_type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Nama Perusahaan</Label>
              <Input id="company_name" {...register('company_name')} />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="director_name">Nama Direktur</Label>
              <Input id="director_name" {...register('director_name')} />
              {errors.director_name && (
                <p className="text-sm text-destructive">{errors.director_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori Vendor</Label>
              <Select
                value={watch('category')}
                onValueChange={(v) => setValue('category', v as VendorRegisterValues['category'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori vendor" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORY.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input id="city" {...register('city')} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" {...register('address')} />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank Rekanan</Label>
                <Select value={watch('bank')} onValueChange={(v) => setValue('bank', v as VendorRegisterValues['bank'])}>
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
                {errors.bank && <p className="text-sm text-destructive">{errors.bank.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Nama Bank</Label>
                <Input id="bank_name" placeholder="BANK MANDIRI" {...register('bank_name')} />
                {errors.bank_name && (
                  <p className="text-sm text-destructive">{errors.bank_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (dipakai untuk login)</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Daftar sebagai Vendor'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun? <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">Masuk</Link>
            {' · '}
            Staf RSJPD Harapan Kita?{' '}
            <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Daftar di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
