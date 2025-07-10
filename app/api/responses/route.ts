import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received body:", JSON.stringify(body, null, 2));
    const responses = Array.isArray(body.responses) ? body.responses : [body];
    if (!responses.length) {
      return NextResponse.json({ error: "No responses provided" }, { status: 400 })
    }
    const results = [];
    for (const resp of responses) {
      const {
        guide_id,
        slide_id,
        block_id,
        user_identifier,
        question,
        answer,
        file_url,
        file_name,
        file_size
      } = resp;

      // Validate required fields
      if (!guide_id || !slide_id || !block_id || !user_identifier || !question) {
        results.push({ error: "Missing required fields", block_id });
        continue;
      }

      // Check if response already exists for this user and block
      const { data: existingResponse } = await supabase
        .from('user_responses')
        .select('id')
        .eq('block_id', block_id)
        .eq('user_identifier', user_identifier)
        .single()

      let result

      if (existingResponse) {
        // Update existing response
        const { data, error } = await supabase
          .from('user_responses')
          .update({
            answer,
            file_url,
            file_name,
            file_size,
          })
          .eq('id', existingResponse.id)
          .select()
          .single()

        if (error) {
          console.error("Response update error:", error)
          results.push({ error: "Failed to update response", block_id })
          continue;
        }
        result = data
      } else {
        // Create new response
        const { data, error } = await supabase
          .from('user_responses')
          .insert({
            guide_id,
            slide_id,
            block_id,
            user_identifier,
            question,
            answer,
            file_url,
            file_name,
            file_size
          })
          .select()
          .single()

        if (error) {
          console.error("Response save error:", error)
          results.push({ error: "Failed to save response", block_id })
          continue;
        }
        result = data
      }
      results.push({ response: result, block_id });
    }
    // If any errors, return 400
    const hasError = results.some(r => r.error);
    if (hasError) {
      return NextResponse.json({ error: "Some responses failed", results }, { status: 400 })
    }
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Response error:", error)
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guide_id = searchParams.get('guide_id')
    const user_identifier = searchParams.get('user_identifier')
    const block_id = searchParams.get('block_id')

    let query = supabase.from('user_responses').select('*')
    
    if (guide_id) {
      query = query.eq('guide_id', guide_id)
    }
    
    if (user_identifier) {
      query = query.eq('user_identifier', user_identifier)
    }

    if (block_id) {
      query = query.eq('block_id', block_id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error("Response fetch error:", error)
      return NextResponse.json({ 
        error: "Failed to fetch responses" 
      }, { status: 500 })
    }

    return NextResponse.json({ responses: data })

  } catch (error) {
    console.error("Response fetch error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 