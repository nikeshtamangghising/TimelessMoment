'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

interface SearchFormProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export default function SearchForm({ 
  onSearch, 
  placeholder = "Search products...", 
  initialValue = "" 
}: SearchFormProps) {
  const [query, setQuery] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <Button type="submit" className="flex items-center gap-2">
        <MagnifyingGlassIcon className="h-4 w-4" />
        Search
      </Button>
    </form>
  )
}