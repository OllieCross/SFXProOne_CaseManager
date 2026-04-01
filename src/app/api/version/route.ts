import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const changelog = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8')
  // Match the first ## vX.Y.Z heading
  const match = changelog.match(/^## (v\d+\.\d+\.\d+)/m)
  const version = match ? match[1] : null
  return NextResponse.json({ version })
}
