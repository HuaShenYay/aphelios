// Format date to relative time
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) return '刚刚'
    return `${diffHours} 小时前`
  } else if (diffDays === 1) return '昨天'
  else if (diffDays < 7) return `${diffDays} 天前`
  else if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function countTextUnits(content: string): number {
  let count = 0
  let inAsciiWord = false
  for (const ch of content) {
    const code = ch.charCodeAt(0)
    const isCjk = (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      (code >= 0xac00 && code <= 0xd7af)
    )
    if (isCjk) {
      count += 1
      inAsciiWord = false
      continue
    }
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      if (!inAsciiWord) {
        count += 1
        inAsciiWord = true
      }
      continue
    }
    inAsciiWord = false
  }
  return count
}

// Book cover images placeholder - more premium and literary
const bookCovers = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop', // Minimal book
  'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&h=800&fit=crop', // Typing/Writing
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=800&fit=crop', // Old library
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=800&fit=crop', // Mountains/Inspiration
  'https://images.unsplash.com/photo-1457369804590-52c616b28c7d?w=600&h=800&fit=crop', // Paper/Pen
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=800&fit=crop', // Open book
  'https://images.unsplash.com/photo-1491843331657-204040a3ab98?w=600&h=800&fit=crop', // Workspace
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=800&fit=crop', // Focus/Reading
]

export function getBookCover(index: number) {
  return bookCovers[index % bookCovers.length]
}
