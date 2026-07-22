import * as React from 'react'

import { Input } from '@/components/ui/input'

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  /** Angka mentah tanpa pemisah ribuan, mis. "1000000". */
  value: string
  onChange: (value: string) => void
}

/** Input uang dengan pemisah ribuan otomatis (mis. 1.000.000.000) selagi mengetik. */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const display = value ? Number(value).toLocaleString('id-ID') : ''

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '')
          onChange(digits)
        }}
        {...props}
      />
    )
  },
)
CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
