/**
 * The share of a source entity's files that reached the clone, from 0 to 100.
 *
 * A file is counted as cloned or as missing, never as both, so `totalCloned` already excludes
 * every failure. An entity with no files is complete, because there is nothing to lose.
 */
export const calculatePercentComplete = (totalSource: number, totalCloned: number): number => {
  if (totalSource <= 0) {
    return 100
  }

  const ratio = Math.round((totalCloned / totalSource) * 100)

  // A counter that runs ahead of its source would otherwise report above 100.
  return Math.max(0, Math.min(100, ratio))
}
