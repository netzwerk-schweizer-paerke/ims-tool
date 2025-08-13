export const traverseRichText = ({
  onText,
  root,
  siblingData,
}: {
  onText: (siblingData: Record<string, unknown>) => void
  root: Record<string, unknown>
  siblingData?: Record<string, unknown>
}) => {
  siblingData = siblingData ?? root

  // Handle text nodes - but only if they're actual text nodes
  // Check the type to ensure we're dealing with a text node
  if (siblingData.type === 'text' && siblingData.text && typeof siblingData.text === 'string') {
    onText(siblingData)
  }

  // For link nodes, we need to be careful
  // Links have type='link' and contain children with the display text
  // We should NOT translate the URL or document reference fields
  if (siblingData.type === 'link') {
    // Preserve all link properties (url, doc, fields, etc.)
    // Only traverse children for text translation
    if (Array.isArray(siblingData.children)) {
      for (const child of siblingData.children) {
        traverseRichText({
          onText,
          root,
          siblingData: child,
        })
      }
    }
    // Important: Don't process any other properties of the link
    return
  }

  // For other node types, traverse children normally
  if (Array.isArray(siblingData?.children)) {
    for (const child of siblingData.children) {
      traverseRichText({
        onText,
        root,
        siblingData: child,
      })
    }
  }
}
