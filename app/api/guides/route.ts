import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { databaseGuideStore } from "@/lib/database-guide-store"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-jwt-secret-key")

async function verifyAuth() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return false
    }

    await jwtVerify(token, JWT_SECRET)
    return true
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAuth()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all guides from database for the dashboard
    const guides = await databaseGuideStore.getAllGuides()
    return NextResponse.json({ guides })
  } catch (error) {
    console.error("Error fetching guides:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAuth()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guideData = await request.json()

    // Create guide in database with proper UUID
    const guide = await databaseGuideStore.createGuide({
      title: guideData.title,
      description: guideData.description,
      type: guideData.type,
      tags: guideData.tags || [],
      userId: "00000000-0000-0000-0000-000000000000", // Placeholder - using provided user ID
    })

    if (!guide) {
      return NextResponse.json({ error: "Failed to create guide" }, { status: 500 })
    }

    return NextResponse.json({ guide })
  } catch (error) {
    console.error("Error creating guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
