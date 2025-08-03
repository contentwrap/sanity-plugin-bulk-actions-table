import { SpinnerIcon } from '@sanity/icons';
import { Badge, Text } from '@sanity/ui';
import styled, { css, keyframes } from 'styled-components';

import { CellPrimitive, TablePrimitive } from './table/primitives';

const COLUMN_SELECTOR_WIDTH = '41px';

export const Container = styled.div`
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const StatusBadge = styled(Badge)`
  text-transform: capitalize;
  padding: 0.35rem 0.5rem;
  border-radius: 0.6rem;
  max-width: 100%;
  vertical-align: middle !important;

  div[data-ui='Text'] {
    font-size: 0.7rem;

    span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      overflow: clip;
    }
  }
`;

export const TableWrapper = styled.div`
  overflow: auto;
  position: relative;
  padding-bottom: 41px;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
`;

export const LoadingOverlay = styled.div(({ theme }: { theme: any }) => {
  const { color } = theme.sanity;
  const background = color.muted.default.disabled.muted.bg;

  return css`
    position: absolute;
    top: 0;
    height: 100%;
    left: 0;
    right: 0;
    pointer-events: none;
    transition: opacity 250ms;
    background-color: ${background};
    z-index: 5;
    opacity: 0;
    display: flex;

    &.active {
      opacity: 0.5;
    }
  `;
});

export const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const LoadingSpinner = styled(SpinnerIcon)`
  margin: auto;
  width: 32px;
  height: 32px;
  animation: ${spin} 1500ms linear infinite;
`;

export const TableHeaderText = styled(Text).attrs(() => ({
  weight: 'semibold',
}))`
  font-size: 0.75rem;
`;

export const Table = styled(TablePrimitive)(({ theme }: { theme: any }) => {
  const { color } = theme.sanity;
  const borderColor = color.selectable.default.enabled.border;

  return css`
    &.hide-columns-4 th:nth-child(n + 4),
    &.hide-columns-4 td:nth-child(n + 4) {
      display: none;
    }

    &.hide-columns-5 th:nth-child(n + 5),
    &.hide-columns-5 td:nth-child(n + 5) {
      display: none;
    }

    &.hide-columns-6 th:nth-child(n + 6),
    &.hide-columns-6 td:nth-child(n + 6) {
      display: none;
    }

    &.hide-columns-7 th:nth-child(n + 7),
    &.hide-columns-7 td:nth-child(n + 7) {
      display: none;
    }

    .preview-root {
      padding: 0.25rem 0;
      margin-right: -0.75rem;
    }

    .preview-status {
      display: none;
    }

    .preview-title {
      font-size: 0.75rem;
    }

    .preview-subtitle {
      font-size: 0.6875rem;
    }

    thead {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    th {
      padding: 0.4rem 0.5rem;
    }

    th::after {
      position: absolute;
      content: ' ';
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      border-bottom: 1px solid ${borderColor};
      pointer-events: none;
    }

    td,
    th {
      text-align: left;
    }

    th.title-cell,
    td.title-cell {
      //padding-right: 0;
    }

    td {
      padding: 0 0.5rem;
      border-bottom: 1px solid ${borderColor};
    }
  `;
});

export const ColumnSelectHeadCell = styled(CellPrimitive).attrs(() => ({
  as: 'th',
}))`
  width: ${COLUMN_SELECTOR_WIDTH};
`;

export const ColumnSelectBodyCell = styled(CellPrimitive).attrs(() => ({
  as: 'td',
}))`
  width: ${COLUMN_SELECTOR_WIDTH};
`;

export const CheckboxCellTh = styled(CellPrimitive).attrs(() => ({
  as: 'th',
}))`
  width: 30px;
  overflow: hidden;
  position: relative;
  > * > * {
    margin: auto;
  }
`;

export const CheckboxCellTd = styled(CellPrimitive).attrs(() => ({
  as: 'td',
}))`
  width: 30px;
  overflow: hidden;
  position: relative;
  > * > * {
    margin: auto;
  }
`;

export const CheckboxFacade = styled.div`
  display: flex;
  pointer-events: none;
`;

export const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  height: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  cursor: pointer;
`;
