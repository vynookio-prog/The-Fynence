export async function cookies() {
  return {
    get: (name: string) => {
      if (typeof document === 'undefined') return undefined;
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return match ? { value: decodeURIComponent(match[1]) } : undefined;
    },
    set: (name: string, value: string, _options?: any) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
    },
    delete: (name: string) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    },
  };
}

export async function headers() {
  return new Headers();
}
