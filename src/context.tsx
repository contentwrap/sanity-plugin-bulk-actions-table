import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ObjectField, SchemaType } from 'sanity';

import { Options, orderColumnDefault, rowsPerPage } from './constants';
import { ColumnOrder, useStickyStateOrder } from './hooks/useStickyStateOrder';
import { useStickyStateSet } from './hooks/useStickyStateSet';
import usePaginatedClient, { PaginatedClient } from './usePaginatedClient';
import { sanitizeGroqInput } from './utils/sanitization';

const BulkActionsTableContext = createContext({
  options: {} as Options,
  schemaType: {} as SchemaType,
  searchValue: '',
  setSearchValue: (searchValue: string) => {},
  pageSize: rowsPerPage[0],
  setPageSize: (num: number) => {},
  selectedColumns: new Set<string>(),
  setSelectedColumns: (set: Set<string>) => {},
  orderColumn: orderColumnDefault as ColumnOrder,
  setOrderColumn: (obj: ColumnOrder) => {},
  selectedIds: new Set<string>(),
  setSelectedIds: (() => {}) as Dispatch<SetStateAction<Set<string>>>,
  isSelectState: false,
  setIsSelectState: (bool: boolean) => {},
  paginatedClient: {} as PaginatedClient,
});

export const useBulkActionsTableContext = () =>
  useContext(BulkActionsTableContext);

export const BulkActionsTableProvider = ({
  options,
  children,
}: {
  options: Options;
  children: ReactNode;
}) => {
  const { type, schema, client } = options;
  const schemaType = useMemo(
    () => schema.get(type) as SchemaType,
    [type, schema],
  );

  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(rowsPerPage[0]);
  const [selectedColumns, setSelectedColumns] = useStickyStateSet(
    new Set<string>(),
    `bulk-actions-table-${type}-selected-columns`,
  );
  const [orderColumn, setOrderColumn] = useStickyStateOrder(
    orderColumnDefault,
    `bulk-actions-table-${type}-order-column`,
  );
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [isSelectState, setIsSelectState] = useState<boolean>(false);

  const searchableFields = useMemo(
    () =>
      ('fields' in schemaType ? schemaType.fields : []).reduce(
        (agg, field: ObjectField) => {
          const name = field.name as string;

          // Validate field name for security
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
            return agg; // Skip invalid field names
          }

          if (field?.type?.jsonType === 'string') {
            agg.push((query: string) => {
              const sanitizedQuery = sanitizeGroqInput(query);
              return sanitizedQuery
                ? `${name} match "${sanitizedQuery}*"`
                : 'true';
            });
          }
          if (field?.type?.name === 'slug') {
            agg.push((query: string) => {
              const sanitizedQuery = sanitizeGroqInput(query);
              return sanitizedQuery
                ? `${name}.current match "${sanitizedQuery}*"`
                : 'true';
            });
          }
          if (field?.type?.name === 'number') {
            agg.push((query: string) => {
              const sanitizedQuery = sanitizeGroqInput(query);
              return sanitizedQuery
                ? `string(${name}) match "${sanitizedQuery}*"`
                : 'true';
            });
          }
          return agg;
        },
        [] as ((q: string) => string)[],
      ),
    [schemaType],
  );

  const paginatedClient = usePaginatedClient({
    type,
    pageSize,
    selectedColumns,
    searchableFields,
    orderColumn,
    client,
  });

  const contextValue = {
    options,
    schemaType,
    searchValue,
    setSearchValue,
    pageSize,
    setPageSize,
    selectedColumns,
    setSelectedColumns,
    orderColumn,
    setOrderColumn,
    selectedIds,
    setSelectedIds,
    isSelectState,
    setIsSelectState,
    paginatedClient,
  };

  return (
    <BulkActionsTableContext.Provider value={contextValue}>
      {children}
    </BulkActionsTableContext.Provider>
  );
};
