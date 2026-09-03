'use client';

import { useState } from 'react';

const MockData = [
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

export default function Home() {
  const [draft, setDraft] = useState('');
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');
  const [results, setResults] = useState(MockData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const filterMockData = (searchTerm) => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return new Promise((resolve, reject) => {
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

  async function search(query) {
    setIsLoading(true);
    setError(null);
    setLastSubmittedQuery(query);

    try {
      const res = await filterMockData(query);
      setResults(res);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(draft);
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </form>

      <div>
        {isLoading ? (
          <p aria-live="polite">Loading...</p>
        ) : error ? (
          <div>
            <p role="alert">Error occurred: {error}</p>
            <button onClick={() => search(lastSubmittedQuery)}>Retry</button>
          </div>
        ) : results.length ? (
          <ul>
            {results.map((item) => (
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
                setResults(MockData);
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
