export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function extractUrl(str: string | null | undefined): string {
  if (!str) return ''
  const match = str.match(/https?:\/\/[^\s，。）)]+/)
  return match ? match[0] : str
}

export function textToHtml(text: string | null | undefined): string {
  if (!text) return '<p style="color:#999;">暂无内容</p>'
  const lines = text.split('\n')
  let html = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    if (trimmed === '---' || trimmed === '———') {
      html += '<hr>'
    } else if (trimmed.startsWith('# ')) {
      html += '<h2>' + escapeHtml(trimmed.substring(2)) + '</h2>'
    } else if (trimmed.startsWith('> ')) {
      html += '<blockquote><p>' + formatInline(trimmed.substring(2)) + '</p></blockquote>'
    } else {
      html += '<p>' + formatInline(trimmed) + '</p>'
    }
  }
  return html
}

function formatInline(text: string): string {
  let escaped = escapeHtml(text)
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  return escaped
}
