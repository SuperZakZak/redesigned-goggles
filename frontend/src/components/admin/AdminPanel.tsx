import { useState } from 'react'
import { CustomerList } from './CustomerList'
import { CustomerProfile } from './CustomerProfile'

interface Customer {
  _id: string
  customerId: string
  name: string
  phone?: string
  email?: string
  balance: number
  totalSpent: number
  isActive: boolean
  createdAt: string
  metadata?: {
    registrationSource?: string
    lastActivity?: string
  }
}

export function AdminPanel() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleBackToList = () => {
    setSelectedCustomer(null)
  }

  if (selectedCustomer) {
    return (
      <CustomerProfile
        customerId={selectedCustomer._id}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <CustomerList onSelectCustomer={handleSelectCustomer} />
  )
}
