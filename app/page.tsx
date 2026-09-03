'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Product = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
};

type SearchState = { status: 'idle'; data: Product[] } | { status: 'loading' } | { status: 'empty' } | { status: 'success'; data: Product[] } | { status: 'error'; message: string };

type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

const fetchProducts = async (query = '', signal?: AbortSignal): Promise<Product[]> => {
  const normalizedQuery = encodeURIComponent(query.trim());

  const response = await fetch(`https://dummyjson.com/products/search?q=${normalizedQuery}`, { signal });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = (await response.json()) as ProductsResponse;

  return result.products.map((item: Product) => ({ id: item.id, price: item.price, title: item.title, thumbnail: item.thumbnail }));
};

export default function Home() {
  const controllerRef = useRef<AbortController | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string>('');
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle', data: [] });

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    fetchProducts('', controller.signal)
      .then((products) => {
        if (products.length === 0) {
          setSearchState({ status: 'empty' });
        } else {
          setSearchState({ status: 'success', data: products });
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        setSearchState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      });
  }, []);

  async function search(query: string): Promise<void> {
    // Cancel the previous request
    controllerRef.current?.abort();

    // Create a controller for the new request
    const controller = new AbortController();
    controllerRef.current = controller;

    setSearchState({ status: 'loading' });
    setLastSubmittedQuery(query);

    try {
      const res = await fetchProducts(query, controllerRef.current.signal);
      console.log(res);

      if (res.length === 0) {
        setSearchState({ status: 'empty' });
        return;
      }

      setSearchState({
        status: 'success',
        data: res,
      });
    } catch (err) {
      // Cancellation is expected, not an application error
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      setSearchState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search(draft);
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit">{searchState.status === 'loading' ? 'Searching…' : 'Search'}</button>
      </form>

      <div>
        {searchState.status === 'loading' ? (
          <p aria-live="polite">Loading...</p>
        ) : searchState.status === 'error' ? (
          <div>
            <p role="alert">Error occurred: {searchState.message}</p>
            <button onClick={() => search(lastSubmittedQuery)}>Retry</button>
          </div>
        ) : searchState.status === 'success' || searchState.status === 'idle' ? (
          <ul>
            {searchState.data.map((item) => (
              <li key={item.id}>
                <div className="flex">
                  <Image src={item.thumbnail} width={100} height={100} alt={item.title} />
                  <div className="flex flex-col">
                    <p>{item.title}</p>
                    <p>{item.price}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <p>No results found!</p>
            <button
              onClick={() => {
                setLastSubmittedQuery('');
                setDraft('');
                search('');
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
