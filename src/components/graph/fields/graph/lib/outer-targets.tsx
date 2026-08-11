import { memo } from 'react'

export enum OuterTargetsEnum {
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER_LEFT = 'center-left',
  CENTER_RIGHT = 'center-right',
  TOP_CENTER = 'top-center',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
}

/*
 *
 * TOP_LEFT      TOP_CENTER      TOP_RIGHT
 *    +--------------+--------------+
 *    |                              |
 *    |                              |
 *    |                              |
 * CENTER_LEFT                  CENTER_RIGHT
 *    |                              |
 *    |                              |
 *    |                              |
 *    +--------------+--------------+
 * BOTTOM_LEFT   BOTTOM_CENTER   BOTTOM_RIGHT
 */

type Props = {
  id: string
}

// Define the component
const OuterTargetsComponent: React.FC<Props> = ({ id }) => {
  const debug = process.env.NODE_ENV === 'development'
  const debugClass = debug ? 'bg-red-400' : ''
  const style = { height: '2px', width: '2px' }

  return (
    <>
      <div
        className={`absolute right-0 top-0 -translate-y-1 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.TOP_RIGHT}`}
        style={style}
      />
      <div
        className={`absolute right-0 top-1/2 -translate-y-1/2 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.CENTER_RIGHT}`}
        style={style}
      />
      <div
        className={`absolute bottom-0 right-0 translate-y-1 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.BOTTOM_RIGHT}`}
        style={style}
      />
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.BOTTOM_CENTER}`}
        style={style}
      />
      <div
        className={`absolute bottom-0 left-0 translate-y-1 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.BOTTOM_LEFT}`}
        style={style}
      />
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.CENTER_LEFT}`}
        style={style}
      />
      <div
        className={`absolute left-0 top-0 -translate-y-1 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.TOP_LEFT}`}
        style={style}
      />
      <div
        className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 ${debugClass}`}
        id={`${id}-${OuterTargetsEnum.TOP_CENTER}`}
        style={style}
      />
    </>
  )
}

// Export the memoized component
export const OuterTargets = memo(OuterTargetsComponent)
