// by Raunak
// Chhota sa data-fetch hook: loading / error / reload sab ek jagah
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      setData(await fnRef.current())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])
  return { data, setData, loading, error, reload: run }
}
