import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guide_id = searchParams.get('guide_id')
    const action = searchParams.get('action')

    if (!guide_id) {
      return NextResponse.json({ error: "guide_id is required" }, { status: 400 })
    }

    switch (action) {
      case 'sessions':
        return await getSessions(guide_id)
      case 'responses':
        return await getResponses(guide_id)
      case 'stats':
        return await getStats(guide_id)
      case 'user_responses':
        const user_identifier = searchParams.get('user_identifier')
        if (!user_identifier) {
          return NextResponse.json({ error: "user_identifier is required for user_responses" }, { status: 400 })
        }
        return await getUserResponses(guide_id, user_identifier)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Admin API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getSessions(guide_id: string) {
  // Get all unique user sessions for a guide with their first and last activity
  const { data, error } = await supabase
    .from('user_responses')
    .select(`
      user_identifier,
      created_at,
      question,
      answer,
      file_url,
      file_name
    `)
    .eq('guide_id', guide_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }

  // Group by user_identifier and find first/last activity
  const sessions = data.reduce((acc: any, response) => {
    const { user_identifier, created_at, question, answer, file_url, file_name } = response
    
    if (!acc[user_identifier]) {
      acc[user_identifier] = {
        user_identifier,
        first_activity: created_at,
        last_activity: created_at,
        total_responses: 0,
        name: null,
        responses: []
      }
    }
    
    acc[user_identifier].total_responses++
    acc[user_identifier].responses.push({ question, answer, created_at, file_url, file_name })
    
    if (created_at < acc[user_identifier].first_activity) {
      acc[user_identifier].first_activity = created_at
    }
    if (created_at > acc[user_identifier].last_activity) {
      acc[user_identifier].last_activity = created_at
    }
    
    return acc
  }, {})

  // Convert to array and sort by last activity
  const sessionsArray = Object.values(sessions).sort((a: any, b: any) => 
    new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
  )

  return NextResponse.json({ sessions: sessionsArray })
}

async function getResponses(guide_id: string) {
  // Get all responses for a guide with block and slide info
  const { data, error } = await supabase
    .from('user_responses')
    .select(`
      *,
      content_blocks!inner(
        id,
        type,
        content,
        slide_id
      ),
      slides!inner(
        id,
        title
      )
    `)
    .eq('guide_id', guide_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 })
  }

  return NextResponse.json({ responses: data })
}

async function getStats(guide_id: string) {
  // Get response statistics for a guide
  const { data, error } = await supabase
    .rpc('get_guide_response_stats', { guide_uuid: guide_id })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }

  // Get additional stats
  const { data: responseData } = await supabase
    .from('user_responses')
    .select('created_at, file_url')
    .eq('guide_id', guide_id)

  const totalFiles = responseData?.filter(r => r.file_url).length || 0
  const today = new Date()
  const todayResponses = responseData?.filter(r => {
    const responseDate = new Date(r.created_at)
    return responseDate.toDateString() === today.toDateString()
  }).length || 0

  return NextResponse.json({ 
    stats: {
      ...data[0],
      total_files: totalFiles,
      today_responses: todayResponses
    }
  })
}

async function getUserResponses(guide_id: string, user_identifier: string) {
  // Get all responses for a specific user in a guide
  const { data, error } = await supabase
    .from('user_responses')
    .select(`
      *,
      content_blocks!inner(
        id,
        type,
        content,
        slide_id
      ),
      slides!inner(
        id,
        title
      )
    `)
    .eq('guide_id', guide_id)
    .eq('user_identifier', user_identifier)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch user responses" }, { status: 500 })
  }

  // Group responses by slide
  const groupedResponses = data.reduce((acc: any, response) => {
    const slideId = response.slide_id
    const slideTitle = response.slides?.title || 'Unknown Slide'
    
    if (!acc[slideId]) {
      acc[slideId] = {
        slide_id: slideId,
        slide_title: slideTitle,
        responses: []
      }
    }
    
    acc[slideId].responses.push({
      block_id: response.block_id,
      question: response.question,
      answer: response.answer,
      file_url: response.file_url,
      file_name: response.file_name,
      file_size: response.file_size,
      created_at: response.created_at,
      block_type: response.content_blocks?.type
    })
    
    return acc
  }, {})

  return NextResponse.json({ 
    user_responses: Object.values(groupedResponses),
    user_identifier,
    total_responses: data.length
  })
} 