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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthenticated = await verifyAuth()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guide = await databaseGuideStore.getGuide(params.id)

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 })
    }

    return NextResponse.json({ guide })
  } catch (error) {
    console.error("Error fetching guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthenticated = await verifyAuth()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guideData = await request.json()

    // First get the existing guide to ensure it exists
    const existingGuide = await databaseGuideStore.getGuide(params.id)
    if (!existingGuide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 })
    }

    // Update the guide with new data
    const updatedGuide = {
      ...existingGuide,
      ...guideData,
      id: params.id, // Ensure ID doesn't change
    }

    const success = await databaseGuideStore.saveGuide(updatedGuide)

    if (!success) {
      return NextResponse.json({ error: "Failed to update guide" }, { status: 500 })
    }

    return NextResponse.json({ guide: updatedGuide })
  } catch (error) {
    console.error("Error updating guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthenticated = await verifyAuth()

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await databaseGuideStore.deleteGuide(params.id)

    if (!success) {
      return NextResponse.json({ error: "Guide not found or failed to delete" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
