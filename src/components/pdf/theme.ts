import { StyleSheet } from '@react-pdf/renderer'

export const COLORS = {
  border: '#c9cdd2',
  link: '#1b5fa8',
  muted: '#5b6169',
  /** The shape outline and the arrows. The screen draws an unfilled box with a dark border. */
  outline: '#000000',
  panel: '#eef1f4',
  text: '#1b1f24',
} as const

/**
 * The shapes keep the screen's minimum proportions.
 *
 * Every shape wrapper under `src/components/graph/wrappers/` is `min-w-52 min-h-32`, which is
 * 208px by 128px.
 */
export const SHAPE_ASPECT = 208 / 128

/** One point of stroke on every arrow and every shape outline. */
export const PDF_STROKE_WIDTH = 1

/** The arrow head, smaller than the screen's 12. `buildArrow` shortens the line to match. */
export const PDF_HEAD_SIZE = 6

/** A4 portrait, in points. react-pdf measures in points, and one point is 1/72 inch. */
const A4_WIDTH = 595.28

/** The graph column of a flow page. `diagram/flow-layout.ts` draws into exactly this width. */
export const FLOW_GRAPH_COLUMN = 200

/** The gap between the graph column and the text beside it. */
const FLOW_TEXT_GUTTER = 16

/**
 * Four sizes carry the whole document, and weight and case make the rest of the difference.
 *
 * A size for every rank produces a page with no clear order. See the decision
 * `pdf-typography-follows-one-scale`.
 */
export const FONT = { body: 9, label: 7, micro: 6, section: 11, title: 14 } as const

/** The vertical unit. Every margin and every padding is a multiple of it. */
export const SPACE = 4

/** The QR code's edge length in the footer. */
export const FOOTER_QR_SIZE = 42

/** The footer rule, the three meta lines, the QR code and the clearance above it all. */
export const FOOTER_HEIGHT = FOOTER_QR_SIZE + 22

/**
 * Helvetica is built in and covers Latin-1, so German, French and Italian text needs no font
 * registration.
 */
export const PAGE_MARGIN = 32

/** What the two page margins leave for the content of a portrait page. */
export const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2

/** The long edge of A4, which is the width of the landscape page the process landscape uses. */
const A4_HEIGHT = 841.89

/** What the two page margins leave for the content of a landscape page. */
export const LANDSCAPE_CONTENT_WIDTH = A4_HEIGHT - PAGE_MARGIN * 2

/** The arrow between the three panels of an activity block. */
export const PANEL_ARROW_WIDTH = 22

/** Three equal panels and two arrows fill the content width of a portrait page. */
const PANEL_WIDTH = Math.floor((CONTENT_WIDTH - PANEL_ARROW_WIDTH * 2) / 3)

/** Two equal columns, with a gutter between them. */
const HALF_COLUMN = Math.floor((CONTENT_WIDTH - SPACE * 4) / 2)

/** Three equal columns of a list page. The gutter lives inside each cell. */
const THIRD_COLUMN = Math.floor(CONTENT_WIDTH / 3)

/** A field label. Case and tracking separate it from the body, so it needs no size of its own. */
const LABEL = {
  color: COLORS.muted,
  fontFamily: 'Helvetica-Bold',
  fontSize: FONT.label,
  letterSpacing: 0.7,
  marginBottom: SPACE,
  textTransform: 'uppercase',
} as const

export const styles = StyleSheet.create({
  activityArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: PANEL_ARROW_WIDTH,
  },
  // The screen puts the input, the tasks and the output in one row of three panels.
  activityPanel: {
    borderColor: COLORS.border,
    borderWidth: 0.5,
    padding: SPACE * 2,
    width: PANEL_WIDTH,
  },
  activityPanelRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    marginTop: SPACE * 4,
  },
  // No `lineHeight`. An explicit one shifts the block off the centre of its shape, because
  // react-pdf keeps the font's own ascent inside a line box it then resizes.
  blockLabel: {
    fontSize: FONT.label,
    textAlign: 'center',
  },
  code: {
    fontFamily: 'Courier',
  },
  // The name of one activity column on the landscape page.
  columnTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: FONT.label,
    marginBottom: SPACE,
  },
  flowGraphCell: {
    flexShrink: 0,
    width: FLOW_GRAPH_COLUMN,
  },
  // The screen puts the graph in the first grid column and the text in the ones beside it. The
  // three text fields stack here, because 331pt does not carry three readable columns.
  // The row carries no vertical padding. The graph cell stretches to the content box only, so
  // padding here would break the connector at every row boundary.
  flowRow: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
  },
  // The table of blocks. Its top rule closes the grid, which the row rules open below it.
  flowTable: {
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
    marginTop: SPACE * 4,
  },
  // The width is stated, never grown. A nested row of rich text collapses a `flexGrow` cell to
  // the width of its own longest word.
  flowTextCell: {
    flexShrink: 0,
    paddingBottom: SPACE * 2,
    paddingLeft: FLOW_TEXT_GUTTER,
    paddingTop: SPACE * 2,
    width: CONTENT_WIDTH - FLOW_GRAPH_COLUMN,
  },
  halfColumn: {
    paddingRight: SPACE * 4,
    width: HALF_COLUMN,
  },
  halfColumnRow: {
    flexDirection: 'row',
    marginTop: SPACE * 6,
  },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: FONT.title,
    marginBottom: SPACE * 2,
  },
  link: {
    color: COLORS.link,
    textDecoration: 'underline',
  },
  listCell: {
    paddingRight: SPACE * 3,
    width: THIRD_COLUMN,
  },
  listMarker: {
    width: 12,
  },
  listRow: {
    flexDirection: 'row',
    marginBottom: SPACE / 2,
  },
  // One item of a list page. The screen draws the same three columns.
  listTableRow: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    paddingBottom: SPACE * 3,
    paddingTop: SPACE * 3,
  },
  meta: {
    color: COLORS.muted,
    fontSize: FONT.body,
  },
  page: {
    color: COLORS.text,
    fontFamily: 'Helvetica',
    fontSize: FONT.body,
    // The footer is absolute, so the page must reserve its height plus the clearance itself.
    paddingBottom: PAGE_MARGIN + FOOTER_HEIGHT,
    paddingHorizontal: PAGE_MARGIN,
    paddingTop: PAGE_MARGIN,
  },
  pageFooter: {
    bottom: PAGE_MARGIN / 2,
    left: PAGE_MARGIN,
    position: 'absolute',
    right: PAGE_MARGIN,
  },
  pageFooterMeta: {
    color: COLORS.muted,
    fontSize: FONT.label,
    lineHeight: 1.6,
  },
  pageFooterQr: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  // The label reads into the code, so it sits left of it and aligns to its own right edge.
  pageFooterQrLabel: {
    color: COLORS.muted,
    fontSize: FONT.micro,
    lineHeight: 1.6,
    marginRight: SPACE * 1.5,
    textAlign: 'right',
    width: 84,
  },
  pageFooterRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // A filled one-point View draws reliably. A border on an absolute View does not.
  pageFooterRule: {
    backgroundColor: COLORS.border,
    height: 0.5,
    // The rule needs air above it, or the footer reads as part of the content.
    marginBottom: SPACE * 2,
  },
  // The page number is its own fixed element on the Page. A `render` prop nested inside another
  // fixed View does not evaluate.
  //
  // It sits above the rule and flush with the right margin. A centred number would introduce a
  // second alignment axis, and the page then has no single edge to read against.
  pageNumber: {
    bottom: PAGE_MARGIN / 2 + FOOTER_QR_SIZE + SPACE * 3.5,
    color: COLORS.muted,
    fontSize: FONT.label,
    position: 'absolute',
    right: PAGE_MARGIN,
    textAlign: 'right',
  },
  panel: {
    backgroundColor: COLORS.panel,
    borderRadius: 2,
    padding: 8,
  },
  // A label that opens its own block, so it carries no top margin.
  panelLabel: {
    ...LABEL,
    marginTop: 0,
  },
  // No `lineHeight` here. react-pdf adds a wrapper's line height to the one its nested `Text`
  // children already have, which double-spaces every wrapped paragraph.
  paragraph: {
    marginBottom: SPACE * 1.5,
  },
  quote: {
    borderLeftColor: COLORS.border,
    borderLeftWidth: 1,
    color: COLORS.muted,
    marginBottom: SPACE * 2,
    paddingLeft: SPACE * 2,
  },
  richHeading: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: SPACE,
    marginTop: SPACE * 3,
  },
  subheading: {
    ...LABEL,
    marginTop: SPACE * 3,
  },
  tableCell: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  tableHeader: {
    borderBottomColor: COLORS.text,
    borderBottomWidth: 1,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
  },
})
