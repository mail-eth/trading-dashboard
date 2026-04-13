import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Read saved position
    let position = null
    try {
      const positionPath = join(process.cwd(), 'public', 'position.json')
      const positionData = readFileSync(positionPath, 'utf-8')
      position = JSON.parse(positionData)
    } catch (e) {
      console.log('No position file found')
    }
    
    // Return position data (price will be fetched client-side)
    return NextResponse.json({
      position,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      position: null,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  }
}