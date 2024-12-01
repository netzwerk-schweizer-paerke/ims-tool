import { isEqual, isObject } from 'lodash-es'
import { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

type Props<T> = {
  initialState: T
  path: string
}

export const useGraphFieldState = <T,>({ initialState, path }: Props<T>) => {
  const { value, setValue } = useField<string>({ path })
  const [state, setState] = useState<T>(initialState)
  const [initialLoad, setInitialLoad] = useState<boolean>(true)

  const setText = (text: string) => {
    setState({ ...state, text })
  }

  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
    if (isObject(value)) {
      setState(value as unknown as T)
    }
    setInitialLoad(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isEqual(state, value) || initialLoad) return
    setValue(state)
    // @ts-ignore
  }, [setValue, state, state.text, state.connections, value, initialLoad])

  return { setText, state, setState }
}
