import { Text, View } from '@react-pdf/renderer'
import React from 'react'

import { ActivityDiagram } from '@/components/pdf/diagram/activity-diagram'
import {
  blocksPerSlice,
  blockWidthOf,
  DEFAULT_LAYOUT,
  gridRowsPerSlice,
  layoutActivityGrid,
  layoutActivityRow,
  sliceGrid,
  sliceRow,
} from '@/components/pdf/diagram/block-layout'
import { localeLabel, PdfCatalogue } from '@/components/pdf/lib/pdf-labels'
import { NoBreak } from '@/components/pdf/pages/page-frame'
import { LANDSCAPE_CONTENT_WIDTH, SPACE, styles } from '@/components/pdf/theme'
import { I18nCollection } from '@/lib/i18n-collection'
import { Activity } from '@/payload-types'
import { LoadedLandscape } from '@/payload/utilities/share/load-landscape'

/** The horizontal space between two activity columns. */
const COLUMN_GAP = 16

/**
 * What one group's blocks may occupy on a landscape A4 page.
 *
 * The page leaves 467pt. The group title, the column titles and the bottom margin take the rest.
 */
const LANDSCAPE_COLUMN_SPACE = 400

type GroupProps = {
  activities: Activity[]
  /**
   * How the band arranges one activity's blocks.
   *
   * `column` stacks them and draws the flow arrows, as the strategy and standard bands do. `grid`
   * wraps them across the page and draws none, as `activity-support.tsx` does.
   */
  layout?: 'column' | 'grid'
  title: string
}

const ActivityGroup = ({ activities, layout = 'column', title }: GroupProps) => {
  if (activities.length === 0) {
    return null
  }

  const options = DEFAULT_LAYOUT
  const isGrid = layout === 'grid'

  // Each activity of a wrapped band takes an equal share of the page width, as the screen's
  // `flex-row` of `ActivitySupport` does.
  const share =
    (LANDSCAPE_CONTENT_WIDTH - (activities.length - 1) * COLUMN_GAP) / activities.length

  const columns = isGrid
    ? activities.map((activity, index) =>
        layoutActivityGrid(
          activity,
          { x: index * (share + COLUMN_GAP), y: 0 },
          share,
          COLUMN_GAP,
          options,
        ),
      )
    : layoutActivityRow(activities, { x: 0, y: 0 }, COLUMN_GAP, options)

  const width = isGrid
    ? LANDSCAPE_CONTENT_WIDTH
    : activities.length * blockWidthOf(options) + (activities.length - 1) * COLUMN_GAP

  const slices = isGrid
    ? sliceGrid(columns, gridRowsPerSlice(LANDSCAPE_COLUMN_SPACE, options), options)
    : sliceRow(columns, blocksPerSlice(LANDSCAPE_COLUMN_SPACE, options), options)

  return (
    <>
      {slices.map((slice, sliceIndex) => (
        <NoBreak key={sliceIndex}>
          <View style={{ marginBottom: SPACE * 3 }}>
            {/* Only the first slice carries the titles. The rest continues the same row. */}
            {sliceIndex === 0 && (
              <>
                <Text style={styles.subheading}>{title}</Text>
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  {slice.map((column, index) => (
                    <View
                      key={index}
                      style={{
                        marginRight: index === slice.length - 1 ? 0 : COLUMN_GAP,
                        width: column.width,
                      }}>
                      <Text style={styles.columnTitle}>{column.title}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <ActivityDiagram
              activities={activities}
              columns={slice}
              height={Math.max(...slice.map((column) => column.height), options.blockHeight) + 8}
              showArrows={!isGrid}
              width={width}
            />
          </View>
        </NoBreak>
      ))}
    </>
  )
}

/** The three rows of the process landscape, each drawn with its blocks and arrows. */
export const LandscapeBody = ({
  catalogue,
  landscape,
  locale,
}: {
  catalogue: PdfCatalogue
  landscape: LoadedLandscape
  locale: string
}) => {
  const isEmpty =
    landscape.standardActivities.length === 0 &&
    landscape.strategicActivities.length === 0 &&
    landscape.supportActivities.length === 0

  if (isEmpty) {
    return <Text style={styles.meta}>{catalogue.activityLandscape.noContent}</Text>
  }

  return (
    <View>
      <ActivityGroup
        activities={landscape.strategicActivities}
        title={localeLabel(I18nCollection.fieldLabel.strategyActivities, locale)}
      />
      <ActivityGroup
        activities={landscape.standardActivities}
        title={localeLabel(I18nCollection.fieldLabel.standard, locale)}
      />
      <ActivityGroup
        activities={landscape.supportActivities}
        layout={'grid'}
        title={localeLabel(I18nCollection.fieldLabel.supportActivities, locale)}
      />
    </View>
  )
}
