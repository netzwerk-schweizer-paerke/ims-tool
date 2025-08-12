import React from 'react'
import { Translate } from '@/lib/translate'

export const CloneInfoPanel: React.FC = () => {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        <Translate k={'cloneActivity:info:title'} />
      </h3>

      <div className="space-y-3">
        <div>
          <h4 className="mb-1 font-semibold">
            🌐 <Translate k={'cloneActivity:info:language:title'} />
          </h4>
          <p>
            <Translate k={'cloneActivity:info:language:description'} />
          </p>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">
            📄 <Translate k={'cloneActivity:info:files:title'} />
          </h4>
          <p>
            <Translate k={'cloneActivity:info:files:description'} />
          </p>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">
            ⚠️ <Translate k={'cloneActivity:info:missingFiles:title'} />
          </h4>
          <p>
            <Translate k={'cloneActivity:info:missingFiles:description'} />
          </p>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">
            📋 <Translate k={'cloneActivity:info:tasks:title'} />
          </h4>
          <p>
            <Translate k={'cloneActivity:info:tasks:description'} />
          </p>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">
            🔗 <Translate k={'cloneActivity:info:sharedResources:title'} />
          </h4>
          <p>
            <Translate k={'cloneActivity:info:sharedResources:description'} />
          </p>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">
            ✅ <Translate k={'cloneActivity:info:safety:title'} />
          </h4>
          <p>
            <Translate k={'cloneActivity:info:safety:description'} />
          </p>
        </div>
      </div>
    </div>
  )
}
