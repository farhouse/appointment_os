import sanitizeHtml from 'sanitize-html'

export function sanitizeLandingHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'div', 'section', 'article', 'header', 'footer', 'main', 'nav',
      'h1', 'h2', 'h3', 'h4', 'p', 'span', 'strong', 'em', 'small',
      'ul', 'ol', 'li', 'blockquote', 'br', 'hr',
      'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
      '*': ['class', 'id', 'title', 'aria-label'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https']
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: attribs.target === '_blank'
          ? { ...attribs, rel: 'noopener noreferrer' }
          : attribs
      })
    }
  })
}
