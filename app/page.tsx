'use client';

import { useState } from 'react';

type SearchItem = {
  id: number;
  searchTerm: string;
};

type SearchState = { status: 'idle'; data: SearchItem[] } | { status: 'loading' } | { status: 'empty' } | { status: 'success'; data: SearchItem[] } | { status: 'error'; message: string };

const MockData: SearchItem[] = [
  {
    id: 1,
    searchTerm: 'apple',
  },
  {
    id: 2,
    searchTerm: 'banana',
  },
  {
    id: 3,
    searchTerm: 'cherry',
  },
  {
    id: 4,
    searchTerm: 'date',
  },
  {
    id: 5,
    searchTerm: 'elderberry',
  },
  {
    id: 6,
    searchTerm: 'fig',
  },
  {
    id: 7,
    searchTerm: 'grape',
  },
  {
    id: 8,
    searchTerm: 'honeydew',
  },
  {
    id: 9,
    searchTerm: 'kiwi',
  },
  {
    id: 10,
    searchTerm: 'lemon',
  },
  {
    id: 11,
    searchTerm: 'mango',
  },
  {
    id: 12,
    searchTerm: 'nectarine',
  },
  {
    id: 13,
    searchTerm: 'orange',
  },
  {
    id: 14,
    searchTerm: 'pear',
  },
];

const filterMockData = (searchTerm: string): Promise<SearchItem[]> => {
  const normalizedQuery = searchTerm.trim().toLowerCase();

  return new Promise<SearchItem[]>((resolve, reject) => {
    setTimeout(() => {
      if (normalizedQuery === 'error') {
        reject(new Error('Mock request failed'));
        return;
      }

      const filteredData = MockData.filter((item) => item.searchTerm.toLowerCase().includes(normalizedQuery));

      resolve(filteredData);
    }, 1000);
  });
};

export default function Home() {
  const [draft, setDraft] = useState<string>('');
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string>('');
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle', data: MockData });

  async function search(query: string): Promise<void> {
    setSearchState({ status: 'loading' });
    setLastSubmittedQuery(query);

    try {
      const res = await filterMockData(query);

      if (res.length === 0) {
        setSearchState({ status: 'empty' });
      } else {
        setSearchState({
          status: 'success',
          data: res,
        });
      }
    } catch (err) {
      console.error(err);
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
        <button type="submit" disabled={searchState.status === 'loading'}>
          {searchState.status === 'loading' ? 'Searching…' : 'Search'}
        </button>
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
              <li key={item.id}>{item.searchTerm}</li>
            ))}
          </ul>
        ) : (
          <div>
            <p>No results found!</p>
            <button
              onClick={() => {
                setLastSubmittedQuery('');
                setDraft('');
                setSearchState({ status: 'idle', data: MockData });
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
