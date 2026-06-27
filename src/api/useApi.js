// src/api/useApi.js
// Generic hook that wraps any API call with loading + error state.
//
// Usage:
//   const { data, loading, error, execute } = useApi(studentAPI.getAll);
//   useEffect(() => { execute(); }, []);

import { useState, useCallback } from "react";

export function useApi(apiFn) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || "Something went wrong");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, execute };
}