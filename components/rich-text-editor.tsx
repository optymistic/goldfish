"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, Palette, List, ListOrdered, Link, Heading1, Heading2, Heading3, CheckSquare, Code, Quote, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import MarkdownIt from 'markdown-it'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  blockType?: string // 'heading', 'paragraph', etc.
}

// Replace the custom parser with markdown-it
const mdParser = new MarkdownIt({
  html: false, // set to true if you want to allow HTML tags in markdown
  linkify: true,
  typographer: true,
})

const parseMarkdown = (markdown: string): string => {
  return mdParser.render(markdown)
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

export function RichTextEditor({ value, onChange, placeholder, blockType }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [highlightColor, setHighlightColor] = useState("#ffff00")
  const [isFocused, setIsFocused] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const savedSelection = useRef<Range | null>(null)
  const lastContent = { current: "" };

  console.log('[RichTextEditor] render: value prop', value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      console.log('[RichTextEditor] useEffect: updating innerHTML', { value, current: editorRef.current.innerHTML });
      editorRef.current.innerHTML = value;
    }
  }, [value])

  // Add highlight border radius and border style
  useEffect(() => {
    const styleId = 'rich-text-highlight-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .rich-text-editor span[style*="background-color"],
        .rich-text-editor mark {
          border-radius: 25px !important;
          padding: 0.03em 0.25em;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleVisualInput = () => {
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      // Post-process: replace <div><br></div> with <br>
      content = content.replace(/<div><br><\/div>/g, '<br>');
      // Remove empty <div></div>
      content = content.replace(/<div><\/div>/g, '');
      // Only log if content changes and in development
      if (process.env.NODE_ENV === "development" && content !== lastContent.current) {
        console.log('[RichTextEditor] handleVisualInput: content before onChange', content);
        lastContent.current = content;
      }
      onChange(content);
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

  const handleHeading = (level: number) => {
    execCommand("formatBlock", `h${level}`)
  }

  const handleLink = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setLinkText(selection.toString())
      setLinkUrl("")
      if (selection.rangeCount > 0) {
        savedSelection.current = selection.getRangeAt(0)
      }
    } else {
      setLinkText("")
      setLinkUrl("")
      savedSelection.current = null
    }
    setLinkDialogOpen(true)
  }

  const insertLink = () => {
    console.log('[RichTextEditor] insertLink called');
    if (linkUrl.trim()) {
      const text = linkText.trim() || linkUrl
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`
      if (savedSelection.current && editorRef.current) {
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(savedSelection.current)
      }
      document.execCommand("insertHTML", false, linkHtml)
      setLinkDialogOpen(false)
      setLinkUrl("")
      setLinkText("")
      editorRef.current?.focus()
      handleVisualInput()
    }
  }

  const insertCheckbox = () => {
    const checkboxHtml = '<input type="checkbox" style="margin-right: 8px;" />'
    document.execCommand("insertHTML", false, checkboxHtml)
    editorRef.current?.focus()
    handleVisualInput()
  }

  const insertCodeBlock = () => {
    const codeBlockHtml = '<pre style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 8px 0;"><code>Your code here</code></pre>'
    document.execCommand("insertHTML", false, codeBlockHtml)
    editorRef.current?.focus()
    handleVisualInput()
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar: Label and two rows, 4 columns each */}
      <div className="border-b bg-card rounded-t-lg">
        <div className="px-3 pt-2 pb-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">Rich Text Editor</div>
          {blockType === "heading" ? (
            <div className="grid grid-cols-4 gap-1 mb-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")} className="h-8 w-full p-0" title="Bold"><Bold className="h-4 w-4 mx-auto" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")} className="h-8 w-full p-0" title="Italic"><Italic className="h-4 w-4 mx-auto" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("underline")} className="h-8 w-full p-0" title="Underline"><Underline className="h-4 w-4 mx-auto" /></Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-full p-0 flex justify-center items-center" title="Highlight"><Palette className="h-4 w-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Highlight Color</label>
                    <Input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="h-8" />
                    <Button onClick={handleHighlight} size="sm" className="w-full">Apply Highlight</Button>
                    <Button onClick={() => execCommand("hiliteColor", "transparent")} size="sm" variant="outline" className="w-full">Remove Highlight</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1 mb-1">
                {/* Row 1 */}
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")} className="h-8 w-full p-0" title="Bold"><Bold className="h-4 w-4 mx-auto" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")} className="h-8 w-full p-0" title="Italic"><Italic className="h-4 w-4 mx-auto" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("underline")} className="h-8 w-full p-0" title="Underline"><Underline className="h-4 w-4 mx-auto" /></Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-full p-0 flex justify-center items-center" title="Headings"><Heading1 className="h-4 w-4" /><ChevronDown className="h-3 w-3 ml-1" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1">
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" onClick={() => handleHeading(1)} className="w-full justify-start gap-2"><Heading1 className="h-4 w-4" />Heading 1</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleHeading(2)} className="w-full justify-start gap-2"><Heading2 className="h-4 w-4" />Heading 2</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleHeading(3)} className="w-full justify-start gap-2"><Heading3 className="h-4 w-4" />Heading 3</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {/* Row 2 */}
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")} className="h-8 w-full p-0" title="Bullet List"><List className="h-4 w-4 mx-auto" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")} className="h-8 w-full p-0" title="Numbered List"><ListOrdered className="h-4 w-4 mx-auto" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleLink} className="h-8 w-full p-0" title="Insert Link"><Link className="h-4 w-4 mx-auto" /></Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-full p-0 flex justify-center items-center" title="Highlight"><Palette className="h-4 w-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Highlight Color</label>
                      <Input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="h-8" />
                      <Button onClick={handleHighlight} size="sm" className="w-full">Apply Highlight</Button>
                      <Button onClick={() => execCommand("hiliteColor", "transparent")} size="sm" variant="outline" className="w-full">Remove Highlight</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {/* Row 3: Special elements (optional, can be merged with above if fewer than 8 total) */}
                <Button type="button" variant="ghost" size="sm" onClick={insertCheckbox} className="h-8 w-full p-0" title="Insert Checkbox"><CheckSquare className="h-4 w-4 mx-auto" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={insertCodeBlock} className="h-8 w-full p-0" title="Insert Code Block"><Code className="h-4 w-4 mx-auto" /></Button>
                <div />
              </div>
            </>
          )}
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
          &gt; quotes, or use the toolbar buttons above
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={insertLink}>
                Insert Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
