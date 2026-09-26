import React, { lazy, Suspense } from 'react';

export default function dynamic<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | any>,
  options?: { loading?: React.ComponentType<any>; ssr?: boolean }
) {
  const LazyComponent = lazy(async () => {
    const mod = await importFn();
    return mod.default ? mod : { default: mod };
  });

  return function DynamicComponent(props: any) {
    const Loading = options?.loading;
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
