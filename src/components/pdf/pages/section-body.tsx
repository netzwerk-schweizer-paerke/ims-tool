import { Text, View } from '@react-pdf/renderer'
import React, { ReactNode } from 'react'

import { FlowBlockDiagram } from '@/components/pdf/diagram/flow-diagram'
import { PanelArrow } from '@/components/pdf/diagram/panel-arrow'
import { LexicalPdf } from '@/components/pdf/lexical-pdf'
import { PdfCatalogue } from '@/components/pdf/lib/pdf-labels'
import { NoBreak } from '@/components/pdf/pages/page-frame'
import { PdfSection } from '@/components/pdf/sections'
import { styles } from '@/components/pdf/theme'
import { SerializedLexicalContent } from '@/lib/lexical-render/src/payload-lexical-react-renderer'

type Rich = null | SerializedLexicalContent | undefined

/** A labelled rich text section. It renders nothing when the field is empty. */
const Field = ({ content, label }: { content: Rich; label: string }) =>
  content ? (
    <View>
      <Text style={styles.subheading}>{label}</Text>
      <LexicalPdf content={content} />
    </View>
  ) : null

const FlowBody = ({
  catalogue,
  section,
}: {
  catalogue: PdfCatalogue
  section: Extract<PdfSection, { kind: 'flow' }>
}) => {
  const blocks = section.flow.blocks ?? []

  return (
    <View>
      <LexicalPdf content={section.flow.description} />
      {/*
        The row itself wraps. A row taller than the page cannot break under `wrap={false}`, and
        react-pdf then clips the content instead of moving it. Only the graph stays whole.
      */}
      <View style={styles.flowTable}>
        {blocks.map((block, index) => (
          <View key={index} style={styles.flowRow}>
            {/* `wrap` sits on the cell itself. A wrapper View around it stops the row stretching
                the cell, and the connector then never reaches the row bottom. */}
            <View style={styles.flowGraphCell} wrap={false}>
              <FlowBlockDiagram block={block} />
            </View>
            <View style={styles.flowTextCell}>
              <Field
                content={block.keypoints?.keypoints}
                label={catalogue.flowBlock.table.keypoints}
              />
              <Field content={block.tools?.tools} label={catalogue.flowBlock.table.tools} />
              <Field
                content={block.responsibility?.responsibility}
                label={catalogue.flowBlock.table.responsibility}
              />
            </View>
          </View>
        ))}
      </View>
      {blocks.length === 0 && <Text style={styles.meta}>{catalogue.common.noContentDefined}</Text>}
    </View>
  )
}

/** The three columns of a list page, exactly as `views/list/list-content.tsx` orders them. */
const ListBody = ({
  catalogue,
  section,
}: {
  catalogue: PdfCatalogue
  section: Extract<PdfSection, { kind: 'list' }>
}) => {
  const items = section.list.items ?? []
  const headers = [
    catalogue.listBlock.table.keypoints,
    catalogue.listBlock.table.tools,
    catalogue.listBlock.table.responsibility,
  ]

  return (
    <View>
      <LexicalPdf content={section.list.description} />
      <View style={styles.flowTable}>
        <View style={styles.listTableRow}>
          {headers.map((header) => (
            <View key={header} style={styles.listCell}>
              <Text style={styles.panelLabel}>{header}</Text>
            </View>
          ))}
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.listTableRow}>
            <View style={styles.listCell}>
              <LexicalPdf content={item.topic} />
            </View>
            <View style={styles.listCell}>
              <LexicalPdf content={item.tools} />
            </View>
            <View style={styles.listCell}>
              <LexicalPdf content={item.responsibility} />
            </View>
          </View>
        ))}
      </View>
      {items.length === 0 && <Text style={styles.meta}>{catalogue.common.noContentDefined}</Text>}
    </View>
  )
}

/** One panel of the activity block row. It falls back to the empty label, never to nothing. */
const Panel = ({
  children,
  empty,
  label,
}: {
  children: ReactNode
  empty: string
  label: string
}) => (
  <View style={styles.activityPanel}>
    <Text style={styles.panelLabel}>{label}</Text>
    {children ?? <Text style={styles.meta}>{empty}</Text>}
  </View>
)

/**
 * The activity block page: the input, the tasks and the output in one row, then the two infos.
 *
 * `views/activity/view/activity-block-content.tsx` is the reference. It draws the same three
 * panels with an arrow between them, and it puts the norms beside the support below.
 */
const ActivityBlockBody = ({
  catalogue,
  section,
}: {
  catalogue: PdfCatalogue
  section: Extract<PdfSection, { kind: 'activityBlock' }>
}) => {
  const block = section.activityBlock

  if (!block) {
    return <Text style={styles.meta}>{catalogue.common.noContentDefined}</Text>
  }

  const tasks = block.relations?.tasks ?? []
  const empty = catalogue.common.noContentDefined

  return (
    <View>
      <NoBreak>
        <View style={styles.activityPanelRow}>
          <Panel empty={empty} label={catalogue.activityBlock.input.title}>
            {block.io?.input ? <LexicalPdf content={block.io.input} /> : null}
          </Panel>
          <PanelArrow />
          <Panel empty={empty} label={catalogue.activityBlock.tasks.title}>
            {tasks.length > 0
              ? tasks.map((task, index) => (
                  <Text key={index} style={styles.paragraph}>
                    {typeof task.value === 'object' && task.value ? task.value.name : ''}
                  </Text>
                ))
              : null}
          </Panel>
          <PanelArrow />
          <Panel empty={empty} label={catalogue.activityBlock.output.title}>
            {block.io?.output ? <LexicalPdf content={block.io.output} /> : null}
          </Panel>
        </View>
      </NoBreak>
      <View style={styles.halfColumnRow}>
        <View style={styles.halfColumn}>
          <Text style={styles.panelLabel}>{catalogue.activityBlock.infos.norms}</Text>
          {block.infos?.norms ? (
            <LexicalPdf content={block.infos.norms} />
          ) : (
            <Text style={styles.meta}>{empty}</Text>
          )}
        </View>
        <View style={styles.halfColumn}>
          <Text style={styles.panelLabel}>{catalogue.activityBlock.infos.support}</Text>
          {block.infos?.support ? (
            <LexicalPdf content={block.infos.support} />
          ) : (
            <Text style={styles.meta}>{empty}</Text>
          )}
        </View>
      </View>
    </View>
  )
}

/** Picks the body renderer for one section. */
export const SectionBody = ({
  catalogue,
  section,
}: {
  catalogue: PdfCatalogue
  section: PdfSection
}) => {
  switch (section.kind) {
    case 'activityBlock': {
      return <ActivityBlockBody catalogue={catalogue} section={section} />
    }
    case 'flow': {
      return <FlowBody catalogue={catalogue} section={section} />
    }
    case 'landscape': {
      return null
    }
    case 'list': {
      return <ListBody catalogue={catalogue} section={section} />
    }
  }
}
