// app/page.tsx
import { Suspense } from 'react';
import  SearchParamsWrapper  from './search-params-wrapper';

export default function Page() {
  return (
    <Suspense fallback={<div className="h-10 animate-pulse bg-neutral-800" />}>
      <SearchParamsWrapper />
    </Suspense>
  );
}
