import type { ILogObj } from 'tslog'

import { Logger } from 'tslog'

import { isDevelopment } from '@/lib/environment'

const dev: ILogObj = { minLevel: 3, type: 'pretty' }
const prod: ILogObj = { hideLogPositionForProduction: true, minLevel: 3, type: 'pretty' }

const logger: Logger<ILogObj> = new Logger(isDevelopment ? dev : prod)

export { logger }
