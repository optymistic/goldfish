"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, Palette } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Simple markdown parser for WYSIWYG display
const parseMarkdown = (markdown: string): string => {
  let html = markdown

  // Handle escape characters first (before other parsing)
  const escapeMap: { [key: string]: string } = {}
  let escapeIndex = 0

  // Replace escaped characters with temporary placeholders
  html = html.replace(/\\(.)/g, (match, char) => {
    const placeholder = `__ESCAPE_${escapeIndex}__`
    escapeMap[placeholder] = char
    escapeIndex++
    return placeholder
  })

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>")
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>")
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>")

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>")

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
  html = html.replace(/_(.*?)_/g, "<em>$1</em>")

  // Code inline
  html = html.replace(
    /`(.*?)`/g,
    '<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>',
  )

  // Code blocks
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; white-space: pre-wrap;"><code>$1</code></pre>',
  )

  // Links
  html = html.replace(
    /\[([^\]]+)\]$$([^)]+)$$/g,
    '<a href="$2" style="color: #3b82f6; text-decoration: underline;">$1</a>',
  )

  // Blockquotes
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote style="border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 8px 0; color: #64748b; font-style: italic;">$1</blockquote>',
  )

  // Unordered lists - handle multiple items properly
  const listItems = html.match(/^[*-] (.*)$/gm)
  if (listItems) {
    const listContent = listItems.map((item) => item.replace(/^[*-] (.*)$/, "<li>$1</li>")).join("")
    html = html.replace(/^[*-] .*$/gm, "")
    html = html + `<ul style="margin: 8px 0; padding-left: 20px;">${listContent}</ul>`
  }

  // Ordered lists - handle multiple items properly
  const orderedItems = html.match(/^\d+\. (.*)$/gm)
  if (orderedItems) {
    const orderedContent = orderedItems.map((item) => item.replace(/^\d+\. (.*)$/, "<li>$1</li>")).join("")
    html = html.replace(/^\d+\. .*$/gm, "")
    html = html + `<ol style="margin: 8px 0; padding-left: 20px;">${orderedContent}</ol>`
  }

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  // Clean up multiple br tags
  html = html.replace(/(<br>\s*){3,}/g, "<br><br>")

  // Restore escaped characters
  Object.keys(escapeMap).forEach((placeholder) => {
    html = html.replace(new RegExp(placeholder, "g"), escapeMap[placeholder])
  })

  return html
}

// Convert HTML to Markdown
const htmlToMarkdown = (html: string): string => {
  let markdown = html

  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, "# $1\n")
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1\n")
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1\n")

  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, "**$1**")
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/g, "**$1**")
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/g, "*$1*")
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/g, "*$1*")

  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/g, "\n```\n$1\n```\n")

  // Convert inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/g, "`$1`")

  // Convert links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")

  // Convert unordered lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/g, (match, content) => {
    const items = content.split(/<li[^>]*>/).filter(Boolean)
    return items.map((item: string) => item.replace(/<li[^>]*>(.*?)<\/li>/, "* $1")).join("\n") + "\n"
  })

  // Convert ordered lists
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/g, (match, content) => {
    const items = content.split(/<li[^>]*>/).filter(Boolean)
    return items.map((item: string, index: number) => item.replace(/<li[^>]*>(.*?)<\/li>/, `${index + 1}. $1`)).join("\n") + "\n"
  })

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/g, "$1\n\n")

  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n\s*\n/g, "\n\n")
  markdown = markdown.trim()

  return markdown
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [highlightColor, setHighlightColor] = useState("#ffff00")
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleVisualInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      // Clear placeholder styling when user starts typing
      if (content && content !== '<br>' && content.trim() !== '') {
        editorRef.current.classList.remove('empty')
      } else {
        editorRef.current.classList.add('empty')
      }
      onChange(content)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (editorRef.current) {
      // Only remove empty class if there's actual content
      const content = editorRef.current.innerHTML
      if (content && content !== '<br>' && content.trim() !== '') {
        editorRef.current.classList.remove('empty')
      }
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      if (!content || content === '<br>' || content.trim() === '') {
        editorRef.current.classList.add('empty')
      }
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleVisualInput()
  }

  const handleHighlight = () => {
    execCommand("hiliteColor", highlightColor)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground">Rich Text Editor</div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("bold")}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("italic")}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("underline")}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <label className="text-sm font-medium">Highlight Color</label>
                <Input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="h-8"
                />
                <Button onClick={handleHighlight} size="sm" className="w-full">
                  Apply Highlight
                </Button>
                <Button
                  onClick={() => execCommand("hiliteColor", "transparent")}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Remove Highlight
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleVisualInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="rich-text-editor min-h-[100px] p-3 focus:outline-none"
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <div className="p-2 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <strong>Tip:</strong> You can use markdown syntax like **bold**, *italic*, `code`, # headings, * lists, and
          &gt; quotes
        </div>
      </div>
    </div>
  )
}
