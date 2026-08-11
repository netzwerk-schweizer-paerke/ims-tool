import type { ILogObj } from 'tslog'

import { Logger } from 'tslog'

const dev: ILogObj = { minLevel: 3, type: 'pretty' }
const prod: ILogObj = { hideLogPositionForProduction: true, minLevel: 3, type: 'pretty' }

const logger: Logger<ILogObj> = new Logger(dev)

export { logger }
