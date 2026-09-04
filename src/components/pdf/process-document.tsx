import { Document } from '@react-pdf/renderer'
import React from 'react'

import { PdfCatalogue } from '@/components/pdf/lib/pdf-labels'
import { LandscapeBody } from '@/components/pdf/pages/landscape-body'
import { PageFrame, PageMeta } from '@/components/pdf/pages/page-frame'
import { SectionBody } from '@/components/pdf/pages/section-body'
import { PdfDocumentData, PdfSection } from '@/components/pdf/sections'

type Props = {
  catalogue: PdfCatalogue
  data: PdfDocumentData
  /** Formats a stored timestamp for the footer. */
  formatDate: (value: null | string | undefined) => null | string
  /** Builds the live URL of one section. The QR code in the footer carries it. */
  hrefFor: (section: PdfSection) => null | string
}

export const sectionTitle = (section: PdfSection): string => {
  switch (section.kind) {
    case 'activityBlock': {
      return section.activityBlock?.graph?.task?.text || section.activity.name
    }
    case 'flow': {
      return section.flow.name
    }
    case 'landscape': {
      return section.title
    }
    case 'list': {
      return section.list.name
    }
  }
}

const sectionUpdatedAt = (section: PdfSection): null | string | undefined => {
  switch (section.kind) {
    case 'activityBlock': {
      return section.activity.updatedAt
    }
    case 'flow': {
      return section.flow.updatedAt
    }
    case 'landscape': {
      return section.updatedAt
    }
    case 'list': {
      return section.list.updatedAt
    }
  }
}

/** The whole document. One section becomes one page, which may wrap onto more. */
export const ProcessDocument = ({ catalogue, data, formatDate, hrefFor }: Props) => (
  <Document
    creationDate={new Date(data.producedAt)}
    language={data.locale}
    title={`${data.organisationName} — ${data.title}`}>
    {data.sections.map((section, index) => {
      const meta: PageMeta = {
        labels: catalogue.pdf,
        organisationName: data.organisationName,
        producedAt: data.producedAtLabel,
        qrUrl: hrefFor(section),
        updatedAt: formatDate(sectionUpdatedAt(section)),
      }

      return (
        <PageFrame
          key={index}
          meta={meta}
          orientation={section.kind === 'landscape' ? 'landscape' : 'portrait'}
          title={sectionTitle(section)}>
          {section.kind === 'landscape' ? (
            <LandscapeBody
              catalogue={catalogue}
              landscape={section.landscape}
              locale={data.locale}
            />
          ) : (
            <SectionBody catalogue={catalogue} section={section} />
          )}
        </PageFrame>
      )
    })}
  </Document>
)
