import { Page, Text, View } from '@react-pdf/renderer'
import React, { ReactNode } from 'react'

import { QrCode } from '@/components/pdf/qr-code'
import { FOOTER_QR_SIZE, styles } from '@/components/pdf/theme'

export type PageMeta = {
  /** The label set, resolved for the document locale. */
  labels: { onlineVersion: string; printed: string; updated: string }
  organisationName: string
  /** The build time of the document, already formatted. */
  producedAt: string
  /** The live page this section mirrors. The QR code carries it. */
  qrUrl: null | string
  /** The last change of the record this page shows, already formatted. */
  updatedAt: null | string
}

type Props = {
  children: ReactNode
  meta: PageMeta
  /** The landscape needs the wide side. A detail page reads better upright. */
  orientation?: 'landscape' | 'portrait'
  subtitle?: null | string
  title: string
}

/**
 * Keeps its children on one page.
 *
 * react-pdf breaks a page inside a `View` by default, which cuts a diagram in half. Every SVG and
 * every block that must stay whole goes inside this wrapper.
 */
export const NoBreak = ({ children }: { children: ReactNode }) => (
  <View wrap={false}>{children}</View>
)

/** The shared chrome of every page. The footer carries the meta and the page number. */
export const PageFrame = ({ children, meta, orientation = 'portrait', subtitle, title }: Props) => (
  <Page orientation={orientation} size={'A4'} style={styles.page} wrap>
    <NoBreak>
      <Text style={styles.heading}>{title}</Text>
      {subtitle && <Text style={styles.meta}>{subtitle}</Text>}
    </NoBreak>
    {children}
    <View fixed style={styles.pageFooter}>
      <View style={styles.pageFooterRule} />
      <View style={styles.pageFooterRow}>
        <View>
          <Text style={styles.pageFooterMeta}>{meta.organisationName}</Text>
          {meta.updatedAt && (
            <Text style={styles.pageFooterMeta}>
              {meta.labels.updated}: {meta.updatedAt}
            </Text>
          )}
          <Text style={styles.pageFooterMeta}>
            {meta.labels.printed}: {meta.producedAt}
          </Text>
        </View>
        {meta.qrUrl && (
          <View style={styles.pageFooterQr}>
            <Text style={styles.pageFooterQrLabel}>{meta.labels.onlineVersion}</Text>
            <QrCode size={FOOTER_QR_SIZE} value={meta.qrUrl} />
          </View>
        )}
      </View>
    </View>
    {/* Its own fixed element on the Page, because `render` does not evaluate when nested. */}
    <Text
      fixed
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      style={styles.pageNumber}
    />
  </Page>
)
