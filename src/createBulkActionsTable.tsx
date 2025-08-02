import {
  AddIcon,
  CheckmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  SyncIcon,
} from '@sanity/icons';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Label,
  Select,
  Text,
  ThemeProvider,
  ToastProvider,
  Tooltip,
} from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import classNames from 'classnames';
import { get, throttle } from 'lodash';
import pluralize, { singular } from 'pluralize';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Preview } from 'sanity';
import { ListItem, usePaneRouter } from 'sanity/structure';

import BulkActionsMenu from './BulkActionsMenu';
import ColumnSelector from './ColumnSelector';
import SearchField from './SearchField';
import {
  Options,
  defaultDatetimeFields,
  orderColumnDefault,
  rowsPerPage,
} from './constants';
import {
  BulkActionsTableProvider,
  useBulkActionsTableContext,
} from './context';
import createEmitter from './createEmitter';
import {
  SelectableField,
  getSelectableFields,
} from './helpers/getSelectableFields';
import {
  CheckboxCellTd,
  CheckboxCellTh,
  CheckboxFacade,
  ColumnSelectBodyCell,
  ColumnSelectHeadCell,
  Container,
  HiddenCheckbox,
  LoadingOverlay,
  LoadingSpinner,
  StatusBadge,
  Table,
  TableWrapper,
} from './styles';
import Cell from './table/Cell';
import { TableHeadCell } from './table/TableHeadCell';
import {
  CellPrimitive,
  RowPrimitive,
  TableHeadPrimitive,
} from './table/primitives';
import { CreateBulkActionsTableConfig } from './types';

function parentHasClass(el: HTMLElement | null, className: string): boolean {
  if (!el) return false;
  if (el.classList.contains(className)) return true;
  return parentHasClass(el.parentElement, className);
}

interface BulkActionsTableProps {
  options: Options;
}

const nonSchemaFields = defaultDatetimeFields.map(
  ({ key, title, sortable }) => ({
    fieldPath: key,
    title,
    field: { type: { name: key } },
    level: 0,
    sortable,
  }),
);

const ActionRow = () => {
  const { navigateIntent } = usePaneRouter();
  const {
    options: { type, client },
    selectedIds,
    setSelectedIds,
    paginatedClient,
    schemaType,
    isSelectState,
    setIsSelectState,
  } = useBulkActionsTableContext();

  return (
    <Card padding={2}>
      {isSelectState ? (
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            {selectedIds.size === 0
              ? 'Select items'
              : `${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'} selected`}
          </Text>
          <Flex gap={2} align="center">
            {selectedIds.size > 0 && (
              <BulkActionsMenu
                onDelete={() => {
                  setSelectedIds(new Set());
                  paginatedClient.setPage(0);
                  paginatedClient.refresh();
                }}
              />
            )}
            <Tooltip
              content={
                <Box padding={1}>
                  <Text size={0}>Cancel bulk selection</Text>
                </Box>
              }
              delay={{ open: 400 }}
              padding={1}
              placement="bottom"
              portal
            >
              <Button
                fontSize={1}
                padding={2}
                text="Cancel"
                mode="default"
                onClick={() => {
                  setIsSelectState(false);
                  setSelectedIds(new Set());
                }}
              />
            </Tooltip>
          </Flex>
        </Flex>
      ) : (
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            {paginatedClient.total} Items
          </Text>
          <Flex gap={2} align="center">
            <SearchField />
            <Tooltip
              content={
                <Box padding={1}>
                  <Text size={0}>Bulk select</Text>
                </Box>
              }
              delay={{ open: 400 }}
              padding={1}
              placement="bottom"
              portal
            >
              <Button
                space={2}
                fontSize={1}
                padding={2}
                text="Select"
                mode="default"
                icon={CheckmarkIcon}
                onClick={() => setIsSelectState(true)}
              />
            </Tooltip>
            <Button
              space={2}
              fontSize={1}
              padding={2}
              text="Create"
              tone="primary"
              icon={AddIcon}
              onClick={() => navigateIntent('create', { type })}
            />
          </Flex>
        </Flex>
      )}
    </Card>
  );
};

const TheTable = () => {
  const { navigateIntent, groupIndex, routerPanesState } = usePaneRouter();
  const openedDocumentId = routerPanesState[groupIndex + 1]?.[0]?.id || null;

  const {
    selectedColumns,
    setSelectedColumns,
    setOrderColumn,
    selectedIds,
    setSelectedIds,
    schemaType,
    isSelectState,
    paginatedClient,
  } = useBulkActionsTableContext();

  // const tableId = "bulk-actions-table-table";
  const documentsListRef = useRef<HTMLDivElement | null>(null);
  const documentsList = documentsListRef.current;

  const throttledColumn = useCallback(
    // @ts-ignore
    throttle((entries) => {
      if (!documentsList) {
        return;
      }
      for (let entry of entries) {
        const width = entry.contentRect.width;
        documentsList.classList.remove(
          'hide-columns-4',
          'hide-columns-5',
          'hide-columns-6',
          'hide-columns-7',
        );

        if (width < 400) {
          documentsList.classList.add('hide-columns-4');
        } else if (width < 500) {
          documentsList.classList.add('hide-columns-5');
        } else if (width < 600) {
          documentsList.classList.add('hide-columns-6');
        } else if (width < 700) {
          documentsList.classList.add('hide-columns-7');
        }
      }
    }, 300),
    [documentsList],
  );

  useEffect(() => {
    const observer = new ResizeObserver(throttledColumn);
    if (documentsList) {
      observer.observe(documentsList);
    }
    return () => {
      if (documentsList) {
        observer.unobserve(documentsList);
      }
    };
  }, [documentsList]);

  const visibleNonSchemaFields = useMemo(
    () =>
      nonSchemaFields.filter((field) => selectedColumns.has(field.fieldPath)),
    [nonSchemaFields, selectedColumns],
  );

  const selectableFields = useMemo(
    () =>
      getSelectableFields(
        'fields' in schemaType ? schemaType.fields : [],
      ).filter((field: SelectableField) =>
        selectedColumns.has(field.fieldPath),
      ),
    [schemaType, selectedColumns],
  );

  const fields = [...visibleNonSchemaFields, ...selectableFields];

  const atLeastOneSelected = paginatedClient.results.some((i) =>
    selectedIds.has(i._normalizedId),
  );
  const allSelected = paginatedClient.results.every((i) =>
    selectedIds.has(i._normalizedId),
  );

  return (
    <TableWrapper>
      <Table ref={documentsListRef}>
        <TableHeadPrimitive tone="default">
          <RowPrimitive>
            {isSelectState && (
              <CheckboxCellTh className="prevent-nav">
                <HiddenCheckbox
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    // @ts-ignore
                    setSelectedIds((set) => {
                      const nextSet = new Set(set);
                      if (allSelected) {
                        for (const result of paginatedClient.results || []) {
                          nextSet.delete(result._normalizedId);
                        }
                      } else {
                        for (const result of paginatedClient.results || []) {
                          nextSet.add(result._normalizedId);
                        }
                      }

                      return nextSet;
                    });
                  }}
                />
                <CheckboxFacade aria-hidden="true">
                  <Checkbox
                    tabIndex={-1}
                    checked={atLeastOneSelected}
                    indeterminate={atLeastOneSelected && !allSelected}
                    readOnly={true}
                  />
                </CheckboxFacade>
              </CheckboxCellTh>
            )}
            <TableHeadCell
              field={{
                title: 'Document',
                fieldPath: '_document',
                type: 'string',
                sortable: false,
              }}
            />
            <TableHeadCell
              field={{
                title: 'Status',
                fieldPath: '_status',
                type: 'string',
                sortable: false,
              }}
            />
            {/* @ts-ignore */}
            {fields.map((field: SelectableField) => (
              <TableHeadCell key={field.fieldPath} field={field} />
            ))}
            <ColumnSelectHeadCell>
              <ColumnSelector
                schemaType={schemaType}
                selectedColumns={selectedColumns}
                onToggleColumnSelect={(key) => {
                  const nextSet = new Set(selectedColumns);
                  if (nextSet.has(key)) {
                    setOrderColumn(orderColumnDefault);
                  }
                  if (nextSet.has(key)) {
                    nextSet.delete(key);
                  } else {
                    nextSet.add(key);
                  }
                  setSelectedColumns(nextSet);
                }}
              />
            </ColumnSelectHeadCell>
          </RowPrimitive>
        </TableHeadPrimitive>
        <tbody>
          {paginatedClient.results.map((item) => {
            const toggleSelect = () => {
              // @ts-ignore
              setSelectedIds((set) => {
                const nextSet = new Set(set);
                if (selectedIds.has(item._normalizedId)) {
                  nextSet.delete(item._normalizedId);
                } else {
                  nextSet.add(item._normalizedId);
                }
                return nextSet;
              });
            };
            return (
              <RowPrimitive
                data-as="a"
                key={item._normalizedId}
                selected={item._id === openedDocumentId}
                tone={
                  selectedIds.has(item._normalizedId) ? 'primary' : 'default'
                }
                onClick={(e) => {
                  // prevent the menu button from causing a navigation
                  if (parentHasClass(e.target as HTMLElement, 'prevent-nav')) {
                    return;
                  }
                  if (isSelectState) {
                    toggleSelect();
                    return;
                  }
                  navigateIntent('edit', {
                    id: item._id,
                    type: item._type,
                    selectedRev: item._rev,
                  });
                }}
              >
                {isSelectState && (
                  <CheckboxCellTd className="prevent-nav">
                    <HiddenCheckbox
                      type="checkbox"
                      checked={selectedIds.has(item._normalizedId)}
                      onChange={(e) => {
                        e.preventDefault();
                        toggleSelect();
                        e.stopPropagation();
                      }}
                    />
                    <CheckboxFacade aria-hidden="true">
                      <Checkbox
                        tabIndex={-1}
                        checked={selectedIds.has(item._normalizedId)}
                        readOnly={true}
                      />
                    </CheckboxFacade>
                  </CheckboxCellTd>
                )}
                <CellPrimitive as="td" className="title-cell">
                  <Preview
                    schemaType={schemaType}
                    layout="default"
                    value={item}
                    // @ts-ignore
                    styles={{
                      title: 'preview-title',
                      subtitle: 'preview-subtitle',
                      root: 'preview-root',
                      status: 'preview-status',
                    }}
                  />
                </CellPrimitive>
                <CellPrimitive as="td">
                  <StatusBadge
                    tone={
                      item._status === 'published'
                        ? 'positive'
                        : item._status === 'draft'
                          ? 'caution'
                          : 'primary'
                    }
                  >
                    {item._status === 'published_with_pending_changes'
                      ? 'Staged changes'
                      : item._status}
                  </StatusBadge>
                </CellPrimitive>
                {/* @ts-ignore */}
                {fields.map((field: SelectableField) => (
                  <Cell
                    key={field.fieldPath}
                    field={field.field}
                    fieldPath={field.fieldPath}
                    value={get(item, field.fieldPath)}
                  />
                ))}
                <ColumnSelectBodyCell />
              </RowPrimitive>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
};

const LoadingState = () => {
  const { paginatedClient } = useBulkActionsTableContext();
  return (
    <LoadingOverlay className={classNames({ active: paginatedClient.loading })}>
      <LoadingSpinner />
    </LoadingOverlay>
  );
};

const NoResultsState = () => {
  const { navigateIntent } = usePaneRouter();
  const {
    options: { type, title },
    searchValue,
    paginatedClient,
  } = useBulkActionsTableContext();

  if (paginatedClient.loading || paginatedClient.results.length) {
    return null;
  }

  const pluralItemName = pluralize(title || 'item', 0).toLowerCase();
  const singularItemName = singular(title || 'item').toLowerCase();

  return (
    <Flex direction="column" align="center">
      <Card padding={4} radius={2} shadow={1}>
        <Flex direction="column" align="center" justify="center" gap={4}>
          <Text size={2} align="center">
            {searchValue.length
              ? `No results for "${searchValue}".`
              : `No ${pluralItemName} in your collection.`}
          </Text>
          {!searchValue.length && (
            <Button
              padding={2}
              fontSize={1}
              tone="default"
              icon={AddIcon}
              text={`Create ${singularItemName}`}
              onClick={() => navigateIntent('create', { type })}
            />
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

const Footer = () => {
  const { pageSize, setPageSize, paginatedClient } =
    useBulkActionsTableContext();
  return (
    <Card
      borderTop
      padding={[3, 3, 2]}
      style={{ position: 'absolute', bottom: 0, width: '100%' }}
    >
      <Flex align="center" gap={2}>
        <Flex align="center" gap={2}>
          <Label style={{ whiteSpace: 'nowrap' }}>Rows Per Page</Label>
          <Select
            fontSize={1}
            padding={2}
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.currentTarget.value, 10))}
          >
            {rowsPerPage.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </Select>
        </Flex>

        <Box flex={1}>
          <Flex align="center" justify="flex-end" gap={2}>
            <Button
              fontSize={1}
              padding={2}
              disabled={paginatedClient.page === 0}
              onClick={() => paginatedClient.setPage(paginatedClient.page - 1)}
              icon={ChevronLeftIcon}
              title="Previous page"
              mode="bleed"
            />
            <Label>
              {paginatedClient.totalPages === 0 ? 0 : paginatedClient.page + 1}
              &nbsp;/&nbsp;
              {paginatedClient.totalPages}
            </Label>
            <Button
              fontSize={1}
              padding={2}
              disabled={paginatedClient.page === paginatedClient.totalPages - 1}
              onClick={() => paginatedClient.setPage(paginatedClient.page + 1)}
              icon={ChevronRightIcon}
              title="Next page"
              mode="bleed"
            />
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};

const BulkActionsTableParent = (props: BulkActionsTableProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  return (
    <ThemeProvider theme={buildTheme()}>
      <ToastProvider>
        <BulkActionsTableProvider options={props.options}>
          <Container ref={containerRef}>
            <ActionRow />
            <LoadingState />
            <TheTable />
            <NoResultsState />
            <Footer />
          </Container>
        </BulkActionsTableProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

/**
 * Creates a bulk actions table for managing documents in Sanity Studio
 * @public
 */
function createBulkActionsTable(
  config: CreateBulkActionsTableConfig,
): ListItem {
  if (!config.type || !config.context || !config.S) {
    throw new Error(`
      type, context and S (StructureBuilder) must be provided.
      context and S are available when configuring structure.
      Example: createBulkActionsTable({type: 'category', S, context})
    `);
  }

  const { type, context, S, title, icon } = config;
  const { schema, getClient } = context;
  const client = getClient({ apiVersion: '2024-03-12' });

  const refresh = createEmitter();

  return S.listItem()
    .id(type)
    .title(title || type)
    .icon(icon || FolderIcon)
    .child(
      Object.assign(S.documentTypeList(type).serialize(), {
        // Prevents the component from re-rendering when switching documents
        __preserveInstance: true,
        // Prevents the component from NOT re-rendering when switching listItems
        key: type,
        type: 'component',
        options: { type, client, schema, refresh, title },
        component: BulkActionsTableParent,
        menuItems: [
          S.menuItem()
            .title('Refresh')
            .icon(SyncIcon)
            .action(refresh.notify)
            .serialize(),
        ],
      }),
    )
    .serialize();
}

export default createBulkActionsTable;
