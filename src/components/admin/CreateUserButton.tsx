'use client'

import { useState } from 'react'
import CreateUserModal from './CreateUserModal'

export default function CreateUserButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn-primary text-sm" onClick={() => setOpen(true)}>
        + Create User
      </button>
      {open && <CreateUserModal onClose={() => setOpen(false)} />}
    </>
  )
}
