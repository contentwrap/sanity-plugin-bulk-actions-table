import { useEffect, useState } from 'react';

export interface ColumnOrder {
  key: string;
  direction: string;
  type: string | null;
}

export function useStickyStateOrder(
  defaultValue: ColumnOrder,
  key: string,
): [ColumnOrder, (value: ColumnOrder) => void] {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    if (value) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}
