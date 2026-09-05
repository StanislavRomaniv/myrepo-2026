'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { ReactNode, SubmitEvent, useState } from 'react';

type Product = {
  id: number;
  title: string;
  price: number;
  thumbnail?: string;
};

type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

type CreateProductInput = Pick<Product, 'title' | 'price'>;

type CreatedProduct = CreateProductInput & {
  id: number;
};

const fetchProducts = async (query = '', signal?: AbortSignal): Promise<Product[]> => {
  console.log(query);
  const normalizedQuery = encodeURIComponent(query.trim());
  let url = 'https://dummyjson.com/products';

  if (normalizedQuery) {
    url += `/search?q=${normalizedQuery}`;
  }

  const response = await fetch(url, { signal });

  if (!response.ok) {
    const error: Error = new Error(`An error occurred while fetching the products`);
    throw error;
  }

  const result = (await response.json()) as ProductsResponse;

  return result.products.map((item: Product) => ({ id: item.id, price: item.price, title: item.title, thumbnail: item.thumbnail }));
};

const addProduct = async (product: CreateProductInput): Promise<CreatedProduct> => {
  const url = 'https://dummyjson.com/products/add';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const error: Error = new Error(`An error occurred while fetching the products`);
    throw error;
  }

  const result = (await response.json()) as CreatedProduct;

  return result;
};

export default function Home() {
  const [draft, setDraft] = useState<string>('');
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string>();
  const queryClient = useQueryClient();

  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { search: lastSubmittedQuery }],
    queryFn: ({ signal }) => fetchProducts(lastSubmittedQuery, signal),
    enabled: lastSubmittedQuery !== undefined,
    staleTime: 5000,
  });

  const {
    mutate,
    isPending: isPendingMutation,
    isError: isErrorMutation,
    error: errorMutation,
  } = useMutation({
    mutationFn: addProduct,
    onSuccess: (newProduct) => {
      queryClient.setQueryData(['products', { search: lastSubmittedQuery }], (currentProducts: Product[] = []) => [newProduct, ...currentProducts]);
    },
  });

  function handleSubmit(formData: CreateProductInput) {
    mutate(formData);
  }

  return (
    <div>
      <div className="flex gap-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLastSubmittedQuery(draft);
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="submit">{isLoading ? 'Searching…' : 'Search'}</button>
        </form>

        <ProductForm onSubmit={handleSubmit}>
          {isPendingMutation
            ? 'Submitting...'
            : !isPendingMutation && (
                <>
                  <button type="submit" className="button">
                    Create
                  </button>
                </>
              )}
        </ProductForm>
        {isErrorMutation && <p>Failed to create event: {errorMutation?.message}</p>}
      </div>

      <div>
        {isLoading ? (
          <p aria-live="polite">Loading...</p>
        ) : isError ? (
          <div>
            <p role="alert">Error occurred: {error.message}</p>
            <button onClick={() => refetch()}>Retry</button>
          </div>
        ) : data?.length ? (
          <ul>
            {data?.map((item) => (
              <li key={item.id}>
                <div className="flex">
                  {item?.thumbnail && <Image src={item?.thumbnail} width={100} height={100} alt={item.title} />}
                  <div className="flex flex-col">
                    <p>{item.title}</p>
                    <p>{item?.price}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : lastSubmittedQuery !== undefined ? (
          <>
            <div>
              <p>No results found!</p>
              <button
                onClick={() => {
                  setLastSubmittedQuery('');
                  setDraft('');
                }}
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          'Please enter your search term'
        )}
      </div>
    </div>
  );
}

function ProductForm({ inputData, onSubmit, children }: { inputData?: CreateProductInput; onSubmit: (data: CreateProductInput) => void; children: ReactNode }) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const title = formData.get('title');
    const price = formData.get('price');

    if (typeof title !== 'string' || typeof price !== 'string') {
      return;
    }

    const parsedPrice = Number(price);

    if (title.trim() === '' || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return;
    }

    onSubmit({
      title: title.trim(),
      price: parsedPrice,
    });
  }

  return (
    <form id="event-form" onSubmit={handleSubmit}>
      <p className="control">
        <label htmlFor="title">Title</label>
        <input type="text" id="title" name="title" defaultValue={inputData?.title ?? ''} />
      </p>

      <p className="control">
        <label htmlFor="description">Price</label>
        <input name="price" id="price" type="number" defaultValue={inputData?.price ?? ''} />
      </p>

      <p className="form-actions">{children}</p>
    </form>
  );
}
