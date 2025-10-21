import { NextRequest, NextResponse } from 'next/server'
import type { AccessResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json()

    if (!accessCode) {
      return NextResponse.json<AccessResponse>({
        success: false,
        message: 'Access code is required'
      }, { status: 400 })
    }

    // Use ACCESS_CODE environment variable
    const expectedAccessCode = process.env.ACCESS_CODE

    if (!expectedAccessCode) {
      console.error('ACCESS_CODE environment variable is not set')
      return NextResponse.json<AccessResponse>({
        success: false,
        message: 'Server configuration error'
      }, { status: 500 })
    }

    if (accessCode === expectedAccessCode) {
      return NextResponse.json<AccessResponse>({
        success: true,
        message: 'Access granted'
      })
    } else {
      return NextResponse.json<AccessResponse>({
        success: false,
        message: 'Invalid access code'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Access verification error:', error)
    return NextResponse.json<AccessResponse>({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}