type Props = {
  id: string
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

export enum OuterTargetsEnum {
  TOP_RIGHT = 'top-right',
  CENTER_RIGHT = 'center-right',
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_LEFT = 'bottom-left',
  CENTER_LEFT = 'center-left',
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
}

export const OuterTargets: React.FC<Props> = ({ id }) => {
  const debug = false
  const debugClass = debug ? 'bg-red-400' : ''
  const style = { width: '2px', height: '2px' }

  return (
    <>
      <div
        id={`${id}-${OuterTargetsEnum.TOP_RIGHT}`}
        className={`absolute right-0 top-0 -translate-y-1 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.CENTER_RIGHT}`}
        className={`absolute right-0 top-1/2 -translate-y-1/2 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.BOTTOM_RIGHT}`}
        className={`absolute bottom-0 right-0 translate-y-1 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.BOTTOM_CENTER}`}
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.BOTTOM_LEFT}`}
        className={`absolute bottom-0 left-0 translate-y-1 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.CENTER_LEFT}`}
        className={`absolute left-0 top-1/2 -translate-y-1/2 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.TOP_LEFT}`}
        className={`absolute left-0 top-0 -translate-y-1 ${debugClass}`}
        style={style}
      />
      <div
        id={`${id}-${OuterTargetsEnum.TOP_CENTER}`}
        className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 ${debugClass}`}
        style={style}
      />
    </>
  )
}
