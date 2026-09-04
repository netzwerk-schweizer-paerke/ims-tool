import { Image, Link, Path, Svg, Text, View } from '@react-pdf/renderer'
import React from 'react'

import { COLORS, FONT, styles } from '@/components/pdf/theme'
import {
  AutoLinkNode,
  HeadingNode,
  LinkNode,
  ListItemNode,
  ListNode,
  Node,
  QuoteNode,
  SerializedLexicalContent,
  TextNode,
} from '@/lib/lexical-render/src/payload-lexical-react-renderer'
import { DocumentsPublic, Document as PayloadDocument } from '@/payload-types'

// Lexical packs the text formats into one bitfield. The constants come from Lexical itself.
const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4
const IS_SUBSCRIPT = 1 << 5
const IS_SUPERSCRIPT = 1 << 6
const IS_HIGHLIGHT = 1 << 7

/**
 * Two sizes carry six heading levels.
 *
 * A rich text field sits inside a labelled section, so a six-step ramp competes with the page's
 * own hierarchy. Bold at the body size is enough to mark a lower heading.
 */
const HEADING_SIZES: Record<string, number> = {
  h1: FONT.section,
  h2: FONT.section,
  h3: FONT.body,
  h4: FONT.body,
  h5: FONT.body,
  h6: FONT.body,
}

/** Helvetica ships four faces, so bold and italic combine into one family name. */
const fontFamily = (bold: boolean, italic: boolean): string => {
  if (bold && italic) return 'Helvetica-BoldOblique'
  if (bold) return 'Helvetica-Bold'
  if (italic) return 'Helvetica-Oblique'
  return 'Helvetica'
}

const isRenderableNode = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'

/** Indent comes from the node, and react-pdf takes it as a left margin like the screen does. */
const indentOf = (indent: number | undefined): { marginLeft?: number } =>
  indent && indent > 0 ? { marginLeft: indent * 12 } : {}

/** react-pdf takes one keyword, so the two decorations combine into a single literal. */
const textDecoration = (
  underline: boolean,
  strikethrough: boolean,
): 'line-through' | 'underline' | 'underline line-through' | undefined => {
  if (underline && strikethrough) return 'underline line-through'
  if (underline) return 'underline'
  if (strikethrough) return 'line-through'
  return undefined
}

const RichText = ({ node }: { node: TextNode }) => {
  const format = typeof node.format === 'number' ? node.format : 0
  const bold = (format & IS_BOLD) > 0
  const italic = (format & IS_ITALIC) > 0
  const code = (format & IS_CODE) > 0
  const decoration = textDecoration((format & IS_UNDERLINE) > 0, (format & IS_STRIKETHROUGH) > 0)

  // react-pdf has no vertical alignment, so a sub or a super script only shrinks.
  const smaller = (format & IS_SUBSCRIPT) > 0 || (format & IS_SUPERSCRIPT) > 0

  return (
    <Text
      style={{
        ...(code ? styles.code : { fontFamily: fontFamily(bold, italic) }),
        ...(decoration && { textDecoration: decoration }),
        ...(smaller && { fontSize: 7 }),
        ...((format & IS_HIGHLIGHT) > 0 && { backgroundColor: '#fdf3a7' }),
      }}>
      {node.text}
    </Text>
  )
}

/** The icon's edge length. It sits beside a 9pt line, so it reads at the cap height. */
const LINK_ICON_SIZE = 7

/**
 * The two lucide icons `lib/lexical-render/src/rich-text-link.tsx` draws, as straight segments.
 *
 * The originals are `external-link` and `file-text` in lucide-react 1.39.0. Their rounded corners
 * are 2 units of 24, which no viewer resolves at this size, so the arcs are dropped.
 */
const LINK_ICON_PATHS = {
  document: ['M14 2 L5 2 L5 22 L19 22 L19 7 Z', 'M14 2 L14 7 L19 7', 'M8 13 L16 13', 'M8 17 L16 17'],
  external: ['M15 3 L21 3 L21 9', 'M10 14 L21 3', 'M18 13 L18 21 L3 21 L3 6 L11 6'],
} as const

const LinkIcon = ({ variant }: { variant: keyof typeof LINK_ICON_PATHS }) => (
  <Svg
    height={LINK_ICON_SIZE}
    style={{ marginRight: 2 }}
    viewBox={'0 0 24 24'}
    width={LINK_ICON_SIZE}>
    {LINK_ICON_PATHS[variant].map((d) => (
      <Path d={d} fill={'none'} key={d} stroke={COLORS.link} strokeWidth={2.5} />
    ))}
  </Svg>
)

/** A document relation draws the file icon. Everything else leaves this system. */
const linkVariant = (node: AutoLinkNode | LinkNode): keyof typeof LINK_ICON_PATHS =>
  node.fields.linkType === 'custom' ? 'external' : 'document'

const linkHref = (node: AutoLinkNode | LinkNode): null | string => {
  if (node.fields.linkType === 'custom') {
    return node.fields.url || null
  }

  // A link to a flow or a list points at a page this document already carries, so it stays text.
  if (node.fields.doc.relationTo === 'documents' || node.fields.doc.relationTo === 'documents-public') {
    const doc = node.fields.doc.value as DocumentsPublic | PayloadDocument
    return doc?.url ?? null
  }

  return null
}

const InlineChildren = ({ nodes }: { nodes: unknown[] }) => (
  <>
    {nodes.filter(isRenderableNode).map((child, index) => {
      switch (child.type) {
        case 'autolink':
        case 'link': {
          const href = linkHref(child)
          const inner = <InlineChildren nodes={child.children} />
          return href ? (
            <Link key={index} src={href} style={styles.link}>
              {inner}
            </Link>
          ) : (
            <Text key={index} style={styles.link}>
              {inner}
            </Text>
          )
        }
        case 'linebreak':
        case 'tab': {
          return <Text key={index}>{'\n'}</Text>
        }
        case 'text': {
          return <RichText key={index} node={child} />
        }
        default: {
          return null
        }
      }
    })}
  </>
)

const isBlankText = (node: unknown): boolean =>
  isRenderableNode(node) && node.type === 'text' && !(node as TextNode).text?.trim()

/**
 * The single link a block holds, or null when it holds anything else.
 *
 * react-pdf draws no `Svg` inside a `Text`, so only a link that owns its whole block can carry the
 * icon. A link inside a sentence keeps the underline and the link colour alone.
 */
const soleLink = (nodes: unknown[]): AutoLinkNode | LinkNode | null => {
  const meaningful = nodes.filter((node) => !isBlankText(node)).filter(isRenderableNode)
  const [only] = meaningful

  return meaningful.length === 1 && (only.type === 'autolink' || only.type === 'link')
    ? only
    : null
}

const LinkRow = ({
  marginBottom,
  node,
}: {
  marginBottom: number
  node: AutoLinkNode | LinkNode
}) => {
  const href = linkHref(node)
  const label = <InlineChildren nodes={node.children} />
  const style = { ...styles.link, flexShrink: 1 }

  return (
    <View style={{ flexDirection: 'row', marginBottom }}>
      <LinkIcon variant={linkVariant(node)} />
      {href ? (
        <Link src={href} style={style}>
          {label}
        </Link>
      ) : (
        <Text style={style}>{label}</Text>
      )}
    </View>
  )
}

const ListBlock = ({ node }: { node: ListNode }) => (
  <View style={indentOf(node.indent)}>
    {node.children.filter(isRenderableNode).map((item, index) => {
      if (item.type !== 'listitem') return null
      const marker = node.listType === 'number' ? `${node.start + index}.` : '•'
      return <ListItem key={index} marker={marker} node={item} />
    })}
  </View>
)

const ListItem = ({ marker, node }: { marker: string; node: ListItemNode }) => {
  const nested = node.children.filter(isRenderableNode).filter((child) => child.type === 'list')
  const inline = node.children.filter(
    (child) => !(isRenderableNode(child) && child.type === 'list'),
  )

  return (
    <View>
      <View style={styles.listRow}>
        <Text style={styles.listMarker}>{marker}</Text>
        <Text style={{ flex: 1 }}>
          <InlineChildren nodes={inline} />
        </Text>
      </View>
      {nested.map((child, index) => (
        <View key={index} style={{ marginLeft: 16 }}>
          <ListBlock node={child as ListNode} />
        </View>
      ))}
    </View>
  )
}

const Quote = ({ node }: { node: QuoteNode }) => (
  <View style={{ ...styles.quote, ...indentOf(node.indent) }}>
    <Text>
      <InlineChildren nodes={node.children} />
    </Text>
  </View>
)

const Heading = ({ node }: { node: HeadingNode }) => (
  <Text
    style={{
      ...styles.richHeading,
      ...indentOf(node.indent),
      fontSize: HEADING_SIZES[node.tag] ?? FONT.body,
    }}>
    <InlineChildren nodes={node.children} />
  </Text>
)

/**
 * Renders a Payload rich text value with react-pdf primitives.
 *
 * The screen renderer emits DOM, which a PDF cannot use, so this is a second implementation of the
 * same node model. A node type with no case renders nothing rather than throwing, because stored
 * content must never blank a page. See the convention `admin-views-degrade-on-imperfect-content`.
 */
export const LexicalPdf = ({ content }: { content: null | SerializedLexicalContent | undefined }) => {
  if (!content?.root?.children) {
    return null
  }

  return (
    <>
      {content.root.children.filter(isRenderableNode).map((node, index) => {
        switch (node.type) {
          case 'heading': {
            return <Heading key={index} node={node} />
          }
          case 'list': {
            return <ListBlock key={index} node={node} />
          }
          case 'paragraph': {
            const link = soleLink(node.children)

            return link ? (
              <LinkRow key={index} marginBottom={6} node={link} />
            ) : (
              <Text key={index} style={{ ...styles.paragraph, ...indentOf(node.indent) }}>
                <InlineChildren nodes={node.children} />
              </Text>
            )
          }
          case 'quote': {
            return <Quote key={index} node={node} />
          }
          case 'upload': {
            const url = node.value?.url
            if (!url) return null
            return node.value.mimeType?.includes('image') ? (
              <Image key={index} src={url} style={{ marginBottom: 6, maxWidth: '100%' }} />
            ) : (
              <Link key={index} src={url} style={{ ...styles.link, ...styles.paragraph }}>
                {node.value.filename ?? url}
              </Link>
            )
          }
          default: {
            return null
          }
        }
      })}
    </>
  )
}
