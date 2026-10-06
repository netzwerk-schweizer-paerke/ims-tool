import { z } from 'zod'

/**
 * The request shape of a `TaskPosition` (PIMS-83): "Davor" or "Danach" a task of the same
 * Prozessgruppe. The clone and the attach endpoint both accept it.
 */
export const taskPositionSchema = z.object({
  anchorCollection: z.enum(['task-flows', 'task-lists']),
  anchorId: z.number().min(1),
  placement: z.enum(['after', 'before']),
})
