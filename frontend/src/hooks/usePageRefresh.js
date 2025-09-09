import { useEffect, useState } from 'react';

/**
 * Custom hook to handle page refresh functionality
 * Automatically refetches data when the page is refreshed or component mounts
 */
export const usePageRefresh = (fetchFunction, dependencies = []) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (fetchFunction) {
      fetchFunction();
    }
  }, [refreshKey, ...dependencies]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Mark that we're refreshing
      sessionStorage.setItem('pageRefreshed', 'true');
    };

    const handleLoad = () => {
      const wasRefreshed = sessionStorage.getItem('pageRefreshed');
      if (wasRefreshed) {
        sessionStorage.removeItem('pageRefreshed');
        refresh();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return { refresh, isRefreshing };
};

/**
 * Hook for handling data fetching with refresh capability
 */
export const useDataFetch = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const { refresh, isRefreshing } = usePageRefresh(fetchData, dependencies);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading: loading || isRefreshing,
    error,
    refresh: fetchData,
    isRefreshing
  };
};

export default usePageRefresh;
