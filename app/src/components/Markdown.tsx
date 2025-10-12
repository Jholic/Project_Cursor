import React from 'react'

export function renderRich(text: string): React.ReactNode {
  // very small, safe-ish parser for simple formatting: **bold**, *italic*, `code`
  // also handle quoted blocks as bolded highlights: ""something"" => bold
  const tokens: React.ReactNode[] = []
  let remaining = text

  // replace double double-quotes with **content**
  remaining = remaining.replace(/""([\s\S]*?)""/g, '**$1**')

  // process line by line for paragraphs
  const lines = remaining.split(/\n+/)
  lines.forEach((line, li) => {
    const parts: React.ReactNode[] = []
    let i = 0
    while (i < line.length) {
      // bold
      const bold = line.slice(i).match(/^\*\*([^*]+)\*\*/)
      if (bold) {
        parts.push(<strong key={`b${li}-${i}`}>{bold[1]}</strong>)
        i += bold[0].length
        continue
      }
      // italic
      const italic = line.slice(i).match(/^\*([^*]+)\*/)
      if (italic) {
        parts.push(<em key={`i${li}-${i}`}>{italic[1]}</em>)
        i += italic[0].length
        continue
      }
      // code
      const code = line.slice(i).match(/^`([^`]+)`/)
      if (code) {
        parts.push(<code key={`c${li}-${i}`} className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5">{code[1]}</code>)
        i += code[0].length
        continue
      }
      // plain char
      parts.push(<span key={`t${li}-${i}`}>{line[i]}</span>)
      i += 1
    }
    tokens.push(<p key={`p${li}`} className="mb-2 leading-7 whitespace-pre-wrap">{parts}</p>)
  })
  return <div>{tokens}</div>
}
