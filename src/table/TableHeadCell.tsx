import { ChevronDownIcon, ChevronUpIcon } from '@sanity/icons';
import { Box, Button, Text, Tooltip } from '@sanity/ui';
import { useCallback } from 'react';
import styled, { css } from 'styled-components';

import { orderColumnDefault } from '../constants';
import { useBulkActionsTableContext } from '../context';
import { SelectableField } from '../helpers/getSelectableFields';
import { CellPrimitive } from './primitives';

interface ExtraProps {
  mode: 'default' | 'ghost' | 'bleed';
  tone?: 'default' | 'primary' | 'positive' | 'caution' | 'critical';
}

export const TableHeaderButton = styled(Button)(({ theme, disabled }) => {
  // @ts-expect-error something
  const { color } = theme.sanity;
  const buttonColor = color.button.bleed.default.enabled.fg;

  return css`
    div[data-ui='Text'] {
      font-size: 0.75rem;
      font-weight: 600;
      ${disabled ? `color: ${buttonColor};` : ''}
    }
  `;
});

type TableHeaderField = Pick<
  SelectableField,
  'fieldPath' | 'sortable' | 'type' | 'title'
>;

export function TableHeadCell({ field }: { field: TableHeaderField }) {
  const { orderColumn, setOrderColumn } = useBulkActionsTableContext();

  const handleOrder = useCallback(() => {
    const { fieldPath: key, type: fieldType, sortable } = field;
    if (!sortable) return;
    // Reset
    if (orderColumn.key === key && orderColumn.direction === 'desc') {
      setOrderColumn(orderColumnDefault);
      return;
    }
    // Set updated key and/or direction
    setOrderColumn({
      key,
      direction:
        orderColumn?.direction === 'asc' && orderColumn.key === key
          ? 'desc'
          : 'asc',
      type: fieldType,
    });
  }, [orderColumn, setOrderColumn]);

  const isSelected = orderColumn.key === field.fieldPath;
  const extraProps: ExtraProps = {
    mode: isSelected ? 'ghost' : 'bleed',
    // tone: isSelected ? 'default' : 'primary'
  };

  if (orderColumn.key === field.fieldPath) {
    // @ts-expect-error something
    extraProps.iconRight =
      orderColumn.direction === 'asc' ? ChevronUpIcon : ChevronDownIcon;
  }

  return (
    <CellPrimitive as="th" style={{ paddingLeft: 0 }}>
      <Tooltip
        content={
          <Box padding={0}>
            <Text size={0}>
              {field.sortable ? `Sort by ${field.title}` : `Not sortable`}
            </Text>
          </Box>
        }
        placement="bottom"
        portal
        delay={{ open: 400 }}
      >
        <Box display="inline-block">
          <TableHeaderButton
            space={2}
            disabled={!field.sortable}
            paddingX={2}
            paddingY={2}
            text={field.title || ''}
            onClick={handleOrder}
            {...extraProps}
          />
        </Box>
      </Tooltip>
    </CellPrimitive>
  );
}
