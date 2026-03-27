import { createContext, useContext, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API = import.meta.env.VITE_API;

const ApiContext = createContext();

export function ApiProvider({ children }) {
  const { token } = useAuth();
  const [tags, setTags] = useState({});

  const request = async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...options.headers,
      },
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const result = isJson ? await response.json() : undefined;

    if (!response.ok) {
      throw Error(result?.message);
    }

    return result;
  };

  const provideTag = (tag, queryFn) => {
    setTags((prev) => ({ ...prev, [tag]: queryFn }));
  };

  const invalidateTags = (tagsToInvalidate) => {
    tagsToInvalidate.forEach((tag) => {
      if (tags[tag]) tags[tag]();
    });
  };

  const useQuery = (path) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const query = async () => {
      try {
        const result = await request(path);
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      provideTag(path, query);
      query();
    }, []);

    return { data, loading, error };
  };

  const useMutation = (path, method, tagsToInvalidate = []) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (body) => {
      setLoading(true);
      setError(null);
      try {
        await request(path, {
          method,
          body: JSON.stringify(body),
        });
        invalidateTags(tagsToInvalidate);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    return { mutate, loading, error };
  };

  const value = { request, provideTag, invalidateTags, useQuery, useMutation };
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) throw Error("useApi must be used within ApiProvider");
  return context;
}