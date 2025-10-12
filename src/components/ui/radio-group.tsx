'use client'

import { ReactNode } from 'react'

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
}

export function RadioGroup({ value, onValueChange, children }: RadioGroupProps) {
  return (
    <div className="space-y-3" onChange={(e) => {
      const target = e.target as HTMLInputElement
      if (target.type === 'radio') {
        onValueChange(target.value)
      }
    }}>
      {children}
    </div>
  )
}
