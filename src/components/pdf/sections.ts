import { Activity, TaskFlow, TaskList } from '@/payload-types'
import { ActivityBlock } from '@/payload/utilities/share/load-activity-block'
import { LoadedLandscape } from '@/payload/utilities/share/load-landscape'

export type PdfDocumentData = {
  /** The content locale, which the PDF language metadata carries. */
  locale: string
  organisationName: string
  /** The build time as an ISO string, for the PDF creation date. */
  producedAt: string
  /** The same moment, formatted for the footer. */
  producedAtLabel: string
  sections: PdfSection[]
  /** The document title, which the PDF metadata carries. */
  title: string
}

/**
 * One page of the document. The builder resolves these from the same loaders the screen uses,
 * so the PDF and the screen always read the same records.
 *
 * The landscape carries its own title and timestamp, because it spans many records rather than one.
 */
export type PdfSection =
  | { activity: Activity; activityBlock: ActivityBlock | undefined; kind: 'activityBlock' }
  | { flow: TaskFlow; kind: 'flow' }
  | { kind: 'landscape'; landscape: LoadedLandscape; title: string; updatedAt: null | string }
  | { kind: 'list'; list: TaskList }
