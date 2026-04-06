import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readFileSync } from 'fs'
import { join } from 'path'

let cachedVersion: string | null | undefined

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (cachedVersion === undefined) {
    const changelog = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8')
    const match = changelog.match(/^## (v\d+\.\d+\.\d+)/m)
    cachedVersion = match ? match[1] : null
  }

  return NextResponse.json({ version: cachedVersion })
}
