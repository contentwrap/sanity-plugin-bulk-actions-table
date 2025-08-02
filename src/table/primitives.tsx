import { Card, CardProps } from '@sanity/ui';
import { PropsWithChildren, forwardRef } from 'react';
import styled, { css } from 'styled-components';

// Table
const TableWrapper = forwardRef<HTMLDivElement, CardProps>(
  (props = {}, ref) => <Card as="table" ref={ref} {...props} />,
);

const StyledTable = styled(TableWrapper)(
  () => css`
    display: table;
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    &:not([hidden]) {
      display: table;
      border-collapse: collapse;
    }
  `,
);

type TableProps = PropsWithChildren<CardProps>;

export const TablePrimitive = forwardRef<HTMLDivElement, TableProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    return (
      <StyledTable ref={ref} {...rest}>
        {children}
      </StyledTable>
    );
  },
);

// Row
const RowWrapper = (props: CardProps = {}) => {
  return <Card as="tr" {...props} />;
};

const StyledRow = styled(RowWrapper)(
  () => css`
    display: table-row;

    &:not([hidden]) {
      display: table-row;
    }
  `,
);

type TableRowProps = PropsWithChildren<
  CardProps & {
    onClick?: (e: React.MouseEvent) => void;
    selected?: boolean;
  }
>;

export function RowPrimitive(props: TableRowProps) {
  const { children, ...rest } = props;

  return <StyledRow {...rest}>{children}</StyledRow>;
}

// Cell
const CellWrapper = ({ as, ...props }: { as?: string } & CardProps) => {
  return <Card as={as || 'td'} {...props} />;
};

const StyledCell = styled(CellWrapper)(
  () => css`
    display: table-cell;

    &:not([hidden]) {
      display: table-cell;
    }
  `,
);

type TableCellProps = PropsWithChildren<
  CardProps & {
    colSpan?: number;
    rowSpan?: number;
    className?: string;
    style?: React.CSSProperties;
  }
>;

export function CellPrimitive(props: TableCellProps) {
  const { children, ...rest } = props;

  return <StyledCell {...rest}>{children}</StyledCell>;
}

const TableHeadWrapper = (props: CardProps = {}) => {
  return <Card as="thead" {...props} />;
};

const StyledTableHead = styled(TableHeadWrapper)(
  () => css`
    display: table-header-group;

    &:not([hidden]) {
      display: table-header-group;
    }
  `,
);

type TableHeaderProps = PropsWithChildren<CardProps>;

export function TableHeadPrimitive(props: TableHeaderProps) {
  const { children, ...rest } = props;

  return <StyledTableHead {...rest}>{children}</StyledTableHead>;
}
