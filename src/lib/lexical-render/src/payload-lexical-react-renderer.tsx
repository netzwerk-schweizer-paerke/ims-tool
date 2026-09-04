import Link from 'next/link'
import React, { CSSProperties } from 'react'

import { RichTextLink } from '@/lib/lexical-render/src/rich-text-link'
import { Document, DocumentsPublic, TaskFlow, TaskList } from '@/payload-types'

export type AbstractElementNode<Type extends string> = AbstractNode<Type> & {
  direction: 'ltr' | 'rtl' | null
  indent: number
}

export type AbstractNode<Type extends string> = {
  format?: '' | 'center' | 'justify' | 'right' | 'start' | number
  type: Type
  version: number
}

export type AbstractTextNode<Type extends string> = AbstractNode<Type> & {
  detail: number // what is this
  format: '' | number
  mode: 'normal' // what is this
  style: string
  text: string
}

export type AutoLinkNode = AbstractElementNode<'autolink'> & {
  children: TextNode[]
  fields: {
    linkType: 'custom'
    newTab?: boolean
    url: string
  }
}

export type BlockNode<BlockData extends Record<string, unknown>, BlockType extends string> = AbstractElementNode<'block'> & {
  fields: BlockData & {
    blockName: string
    blockType: BlockType
    id: string
  }
}

export type ElementRenderers = {
  autolink: (
    props: Omit<AutoLinkNode, 'children'> & { children: React.ReactNode },
  ) => React.ReactNode
  heading: (props: Omit<HeadingNode, 'children'> & { children: React.ReactNode }) => React.ReactNode
  linebreak: () => React.ReactNode
  link: (props: Omit<LinkNode, 'children'> & { children: React.ReactNode }) => React.ReactNode
  list: (props: Omit<ListNode, 'children'> & { children: React.ReactNode }) => React.ReactNode
  listItem: (
    props: Omit<ListItemNode, 'children'> & { children: React.ReactNode },
  ) => React.ReactNode
  paragraph: (
    props: Omit<ParagraphNode, 'children'> & { children: React.ReactNode },
  ) => React.ReactNode
  quote: (props: Omit<QuoteNode, 'children'> & { children: React.ReactNode }) => React.ReactNode
  tab: () => React.ReactNode
  upload: (props: UploadNode) => React.ReactNode
}

export type HeadingNode = AbstractElementNode<'heading'> & {
  children: TextNode[]
  tag: string
}

export type Linebreak = AbstractNode<'linebreak'>
export type LinkNode = AbstractElementNode<'link'> & {
  children: TextNode[]
  fields:
    | {
        doc: {
          relationTo: string
          value: unknown
        }
        linkType: 'internal'
        newTab: boolean
        url: string
      }
    | {
        linkType: 'custom'
        newTab: boolean
        url: string
      }
}
export type ListItemNode = AbstractElementNode<'listitem'> & {
  children: (ListNode | TextNode)[]
  value: number
}

export type ListNode = AbstractElementNode<'list'> & {
  children: ListItemNode[]
  listType: 'bullet' | 'check' | 'number'
  start: number
  tag: string
}

export type Mark = {
  bold?: boolean
  code?: boolean
  highlight?: boolean
  italic?: boolean
  strikethrough?: boolean
  subscript?: boolean
  superscript?: boolean
  text: string
  underline?: boolean
}

export type Node =
  | AutoLinkNode
  | HeadingNode
  | Linebreak
  | LinkNode
  | ListItemNode
  | ListNode
  | ParagraphNode
  | QuoteNode
  | Tab
  | TextNode
  | UnknownBlockNode
  | UploadNode

export type ParagraphNode = AbstractElementNode<'paragraph'> & {
  children: (AutoLinkNode | Linebreak | LinkNode | Tab | TextNode)[]
}

export type PayloadLexicalReactRendererContent = {
  root: Root
}

export type PayloadLexicalReactRendererProps<
  Blocks extends { [key: string]: Record<string, unknown> },
> = {
  blockRenderers?: {
    [BlockName in Extract<keyof Blocks, string>]?: (
      props: BlockNode<Blocks[BlockName], BlockName>,
    ) => React.ReactNode
  }
  content: null | SerializedLexicalContent | undefined
  elementRenderers?: ElementRenderers
  renderMark?: RenderMark
}

export type QuoteNode = AbstractElementNode<'quote'> & {
  children: TextNode[]
}

export type RenderMark = (mark: Mark) => React.ReactNode

export type Root = AbstractElementNode<'root'> & {
  children: Node[]
}

/**
 * What a Payload rich text field carries at runtime. `payload-types.ts` types every child
 * with an index signature, never with the `Node` union, so the renderer narrows each child
 * itself before it renders one.
 */
export type SerializedLexicalContent = {
  root: {
    children: unknown[]
  }
}

export type Tab = AbstractTextNode<'tab'>

export type TextNode = AbstractTextNode<'text'>

export type UploadNode<
  MediaType = {
    alt: string
    createdAt: string
    filename?: string
    filesize?: number
    height?: number
    id: string
    mimeType?: string
    updatedAt: string
    url?: string
    width?: number
  },
> = AbstractElementNode<'upload'> & {
  fields: null
  relationTo: 'media'
  value: MediaType
}

type UnknownBlockNode = AbstractNode<'block'> & {
  fields: {
    [key: string]: unknown
    blockName: string
    blockType: string
    id: string
  }
}

// A serialized child carries no node type in `payload-types.ts`. This narrows it to the
// union the renderers accept, and it drops a child that carries no string `type`.
const isRenderableNode = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'

// Returns the `children` prop of a React element, and undefined for anything else.
const childrenOf = (node: React.ReactNode): React.ReactNode =>
  React.isValidElement<{ children?: React.ReactNode }>(node) ? node.props.children : undefined

// Every link that leaves this system gets the external icon. The label decides nothing: the
// same document appears on one page with a file-name label and with a readable label.
// The renderer hands each node its children already rendered, so `children` is a ReactNode
// here rather than the `TextNode[]` that `LinkNode` declares.
const renderExternalLink = (element: Omit<LinkNode, 'children'> & { children: React.ReactNode }) => (
  <RichTextLink
    href={element.fields.url}
    newTab={element.fields.newTab}
    style={getElementStyle<'link'>(element)}
    variant={'external'}>
    {linkTextReplacer(element.children)}
  </RichTextLink>
)

const linkTextReplacer = (text: React.ReactNode): React.ReactNode => {
  // Every step is optional: a link node with no children (or whose child is not the
  // doubly-wrapped element this expects) leaves an intermediate undefined. The fallback
  // then returns the original text.
  const first = Array.isArray(text) ? text[0] : text
  const linktext = childrenOf(childrenOf(first)) ?? text
  if (typeof linktext === 'string') {
    return linktext.replaceAll('_', '_\u{AD}')
  }
  return text
}

// This copy-and-pasted from somewhere in lexical here: https://github.com/facebook/lexical/blob/c2ceee223f46543d12c574e62155e619f9a18a5d/packages/lexical/src/LexicalConstants.ts
const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4
const IS_SUBSCRIPT = 1 << 5
const IS_SUPERSCRIPT = 1 << 6
const IS_HIGHLIGHT = 1 << 7

function getElementStyle<Type extends string>({
  format,
  indent,
}: AbstractElementNode<Type>): CSSProperties {
  const style: CSSProperties = {}

  if (indent > 0) {
    style.marginLeft = `${indent * 20}px`
  }

  // The `===` chain narrows `format` (also `number | "" | undefined`) down to the three
  // alignment literals `style.textAlign` accepts. `.includes()` does not narrow.
  // eslint-disable-next-line unicorn/prefer-includes-over-repeated-comparisons
  if (format === 'right' || format === 'center' || format === 'justify') {
    style.textAlign = format
  }

  return style
}

export const defaultElementRenderers: ElementRenderers = {
  autolink: (element) => (
    <a
      href={element.fields.url}
      style={getElementStyle<'autolink'>(element)}
      target={element.fields.newTab ? '_blank' : '_self'}>
      {linkTextReplacer(element.children)}
    </a>
  ),
  heading: (element) => {
    return React.createElement(
      element.tag,
      {
        style: getElementStyle<'heading'>(element),
      },
      element.children,
    )
  },
  linebreak: () => <br />,
  link: (element) => {
    if (element.fields.linkType === 'internal') {
      switch (element.fields.doc.relationTo) {
        case 'documents':
        case 'documents-public': {
          const doc = element.fields.doc.value as Document | DocumentsPublic
          const { filename, url } = doc
          if (!url) {
            return (
              <span style={{ color: 'red', fontWeight: 'bold' }}>
                {linkTextReplacer(element.children)} (linked document no longer available)
              </span>
            )
          }
          return (
            <RichTextLink
              href={url}
              newTab={element.fields.newTab}
              style={getElementStyle<'link'>(element)}
              title={filename || ''}
              variant={'document'}>
              {linkTextReplacer(element.children)}
            </RichTextLink>
          )
        }
        case 'task-flows': {
          const doc = element.fields.doc.value as TaskFlow
          return (
            <Link
              href={`/admin/flow/${doc.id}`}
              style={getElementStyle<'link'>(element)}
              target={element.fields.newTab ? '_blank' : '_self'}
              title={doc.name}>
              {linkTextReplacer(element.children)}
            </Link>
          )
        }
        case 'task-lists': {
          const doc = element.fields.doc.value as TaskList
          return (
            <Link
              href={`/admin/list/${doc.id}`}
              style={getElementStyle<'link'>(element)}
              target={element.fields.newTab ? '_blank' : '_self'}
              title={doc.name}>
              {linkTextReplacer(element.children)}
            </Link>
          )
        }
        default: {
          return renderExternalLink(element)
        }
      }
    }

    return renderExternalLink(element)
  },
  list: (element) => {
    return React.createElement(
      element.tag,
      {
        style: getElementStyle<'list'>(element),
      },
      element.children,
    )
  },
  listItem: (element) => {
    return <li style={getElementStyle<'listitem'>(element)}>{element.children}</li>
  },
  paragraph: (element) => {
    return <p style={getElementStyle<'paragraph'>(element)}>{element.children}</p>
  },
  quote: (element) => (
    <blockquote style={getElementStyle<'quote'>(element)}>{element.children}</blockquote>
  ),
  tab: () => <br />,
  upload: (element) => {
    if (element.value.mimeType?.includes('image')) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img alt={element.value.alt} src={element.value.url} />
    }

    // A non-image upload used to render nothing, so an attached PDF disappeared from the page.
    if (!element.value.url) {
      return null
    }

    return (
      <RichTextLink
        href={element.value.url}
        newTab={true}
        title={element.value.filename}
        variant={'document'}>
        {element.value.filename}
      </RichTextLink>
    )
  },
}

export const defaultRenderMark: RenderMark = (mark) => {
  const style: CSSProperties = {}

  if (mark.bold) {
    style.fontWeight = 'bold'
  }

  if (mark.italic) {
    style.fontStyle = 'italic'
  }

  if (mark.underline) {
    style.textDecoration = 'underline'
  }

  if (mark.strikethrough) {
    style.textDecoration = 'line-through'
  }

  if (mark.code) {
    return <code>{mark.text}</code>
  }

  if (mark.highlight) {
    return <mark style={style}>{mark.text}</mark>
  }

  if (mark.subscript) {
    return <sub style={style}>{mark.text}</sub>
  }

  if (mark.superscript) {
    return <sup style={style}>{mark.text}</sup>
  }

  if (Object.keys(style).length === 0) {
    return <>{mark.text}</>
  }

  return <span style={style}>{mark.text}</span>
}

export function PayloadLexicalReactRenderer<
  Blocks extends { [key: string]: Record<string, unknown> },
>({
  blockRenderers = {},
  content,
  elementRenderers = defaultElementRenderers,
  renderMark = defaultRenderMark,
}: PayloadLexicalReactRendererProps<Blocks>) {
  const renderElement = React.useCallback(
    (node: Node, children?: React.ReactNode) => {
      if (!elementRenderers) {
        throw new Error("'elementRenderers' prop not provided.")
      }

      if (node.type === 'link' && node.fields) {
        return elementRenderers.link({
          ...node,
          children,
        })
      }

      if (node.type === 'autolink' && node.fields) {
        return elementRenderers.autolink({
          ...node,
          children,
        })
      }

      if (node.type === 'heading') {
        return elementRenderers.heading({
          ...node,
          children,
        })
      }

      if (node.type === 'paragraph') {
        return elementRenderers.paragraph({
          ...node,
          children,
        })
      }

      if (node.type === 'list') {
        return elementRenderers.list({
          ...node,
          children,
        })
      }

      if (node.type === 'listitem') {
        return elementRenderers.listItem({
          ...node,
          children,
        })
      }

      if (node.type === 'quote') {
        return elementRenderers.quote({
          ...node,
          children,
        })
      }

      if (node.type === 'linebreak') {
        return elementRenderers.linebreak()
      }

      if (node.type === 'tab') {
        return elementRenderers.tab()
      }

      if (node.type === 'upload') {
        return elementRenderers.upload(node)
      }

      throw new Error(`Missing element renderer for node type '${node.type}'`)
    },
    [elementRenderers],
  )

  const renderText = React.useCallback(
    (node: TextNode): null | React.ReactNode => {
      if (!renderMark) {
        throw new Error("'renderMark' prop not provided.")
      }

      if (!node.format) {
        return renderMark({
          text: node.text,
        })
      }

      return renderMark({
        bold: (node.format & IS_BOLD) > 0,
        code: (node.format & IS_CODE) > 0,
        highlight: (node.format & IS_HIGHLIGHT) > 0,
        italic: (node.format & IS_ITALIC) > 0,
        strikethrough: (node.format & IS_STRIKETHROUGH) > 0,
        subscript: (node.format & IS_SUBSCRIPT) > 0,
        superscript: (node.format & IS_SUPERSCRIPT) > 0,
        text: node.text,
        underline: (node.format & IS_UNDERLINE) > 0,
      })
    },
    [renderMark],
  )

  const serialize = React.useCallback(
    (children: Node[]): null | React.ReactNode[] =>
      children.map((node, index) => {
        if (node.type === 'text') {
          return <React.Fragment key={index}>{renderText(node)}</React.Fragment>
        }

        if (node.type === 'block') {
          const renderer = blockRenderers[node.fields.blockType] as (
            props: unknown,
          ) => React.ReactNode

          if (typeof renderer !== 'function') {
            throw new TypeError(`Missing block renderer for block type '${node.fields.blockType}'`)
          }

          return <React.Fragment key={index}>{renderer(node)}</React.Fragment>
        }

        // The `===` chain narrows the node union so the code below can access
        // `node.children`, which does not exist on Linebreak/Tab/Upload.
        // eslint-disable-next-line unicorn/prefer-includes-over-repeated-comparisons
        if (node.type === 'linebreak' || node.type === 'tab' || node.type === 'upload') {
          return <React.Fragment key={index}>{renderElement(node)}</React.Fragment>
        }

        return (
          <React.Fragment key={index}>
            {renderElement(node, serialize(node.children))}
          </React.Fragment>
        )
      }),
    [renderElement, renderText, blockRenderers],
  )

  if (!content || !content.root) {
    return null
  }

  return <>{serialize(content.root.children.filter(isRenderableNode))}</>
}
