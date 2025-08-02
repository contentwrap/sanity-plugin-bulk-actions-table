import { Text } from '@sanity/ui';
import { Preview, SchemaType } from 'sanity';
import styled from 'styled-components';

import { CellPrimitive } from './primitives';

const TableDiv = styled(Text)`
  font-size: ${(props) => (props.muted ? '0.7rem' : '0.75rem')};
`;

const TableCellContentImage = styled.div`
  width: 2.0625rem;
  height: 2.0625rem;
  min-width: 2.0625rem;
  font-size: 0.75rem;

  > div > div {
    padding: 0;
  }
`;

function formatDatetime(
  value: string,
  { includeTime }: { includeTime: boolean },
): string {
  const locale = navigator.language || 'en-US'; // Get the user's locale
  const timeOptions = includeTime
    ? {
        hour: 'numeric' as const,
        minute: 'numeric' as const,
        hour12: true,
      }
    : {};
  return new Date(value).toLocaleString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...timeOptions,
  });
}

interface Props {
  field: any;
  fieldPath: string;
  value: any;
}

function Cell({ field, fieldPath, value }: Props) {
  switch (field.type.name) {
    case 'date':
    case 'datetime':
    case '_createdAt':
    case '_lastPublishedAt':
    case '_updatedAt': {
      const includeTime = field.type.name !== 'date';
      const defaultMessage =
        field.type.name === '_lastPublishedAt' ? 'Not published' : '-';
      return (
        <CellPrimitive as="td" key={fieldPath}>
          <TableDiv textOverflow="ellipsis" muted={!value}>
            {value ? formatDatetime(value, { includeTime }) : defaultMessage}
          </TableDiv>
        </CellPrimitive>
      );
    }
    case 'slug': {
      return (
        <CellPrimitive as="td" key={fieldPath}>
          <TableDiv textOverflow="ellipsis">{value?.current || '-'}</TableDiv>
        </CellPrimitive>
      );
    }
    case 'text':
    case 'url':
    case 'string':
    case 'number': {
      return (
        <CellPrimitive as="td" key={fieldPath}>
          <TableDiv textOverflow="ellipsis">{value || '-'}</TableDiv>
        </CellPrimitive>
      );
    }
    case 'boolean': {
      let renderedValue = '-';
      if (value === true) renderedValue = 'Yes';
      if (value === false) renderedValue = 'No';
      return (
        <CellPrimitive as="td" key={fieldPath}>
          <TableDiv textOverflow="ellipsis">{renderedValue}</TableDiv>
        </CellPrimitive>
      );
    }
    case 'array': {
      return (
        <CellPrimitive as="td" key={fieldPath}>
          <TableDiv textOverflow="ellipsis">
            {value?.length || 0} item{value?.length === 1 ? '' : 's'}
          </TableDiv>
        </CellPrimitive>
      );
    }
    case 'image': {
      return (
        <CellPrimitive as="td" key={fieldPath}>
          {value ? (
            <TableCellContentImage>
              <Preview
                layout="media"
                value={value}
                mediaDimensions={{
                  fit: 'fill',
                  aspect: 1,
                }}
                schemaType={field.type as SchemaType}
              />
            </TableCellContentImage>
          ) : (
            <TableDiv textOverflow="ellipsis">-</TableDiv>
          )}
        </CellPrimitive>
      );
    }
    default: {
      return (
        <CellPrimitive as="td" key={fieldPath}>
          <TableDiv textOverflow="ellipsis">
            {value ? (
              <Preview
                value={value}
                layout="default"
                schemaType={field.type as SchemaType}
              />
            ) : (
              '-'
            )}
          </TableDiv>
        </CellPrimitive>
      );
    }
  }
}

export default Cell;
