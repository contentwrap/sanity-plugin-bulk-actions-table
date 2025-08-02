import { CheckmarkIcon, ControlsIcon } from '@sanity/icons';
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Text,
} from '@sanity/ui';
import { useMemo } from 'react';
import { SchemaType } from 'sanity';
import styled from 'styled-components';

import { defaultDatetimeFields } from '../constants';
import {
  SelectableField,
  getSelectableFields,
} from '../helpers/getSelectableFields';

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
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

const Label = styled.label`
  padding-right: 0.5rem;
  position: relative;
  display: block;
  height: 100%;
`;

const ColumnMenu = styled(Menu)`
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 300px;
`;

const ColumnMenuItem = styled(MenuItem)`
  height: 1.38rem;

  > span[data-ui='Box'] {
    height: 100%;
    width: 100%;
  }
`;

const ColumnMenuFlex = styled(Flex)`
  height: 100%;
  max-width: 100%;
`;

const ColumnBox = styled(Box)`
  width: 16px;
  height: 100%;
`;

const MenuItemText = styled(Text).attrs(() => ({
  textOverflow: 'ellipsis',
}))`
  font-size: 0.77rem;
  user-select: none;
  cursor: pointer;
  max-width: calc(100% - 20px);

  span {
    user-select: none;
  }
`;

interface Props {
  schemaType: SchemaType;
  onToggleColumnSelect: (key: string) => void;
  selectedColumns: Set<string>;
}

function ColumnSelector({
  schemaType,
  selectedColumns,
  onToggleColumnSelect,
}: Props) {
  const selectableFields = useMemo(
    () =>
      getSelectableFields(
        'fields' in schemaType ? (schemaType.fields as any[]) : [],
      ),
    [schemaType],
  );

  return (
    <MenuButton
      id="select-columns"
      popover={{ portal: true, placement: 'left' }}
      button={
        <Button
          icon={ControlsIcon}
          title="Select Columns"
          mode="bleed"
          padding={2}
        />
      }
      menu={
        <ColumnMenu>
          <ColumnMenuItem padding={0} disabled={true}>
            <ColumnMenuFlex align="center" gap={1}>
              <CheckmarkIcon />
              <MenuItemText>Document</MenuItemText>
            </ColumnMenuFlex>
          </ColumnMenuItem>
          <ColumnMenuItem padding={0} disabled={true}>
            <ColumnMenuFlex align="center" gap={1}>
              <CheckmarkIcon />
              <MenuItemText>Status</MenuItemText>
            </ColumnMenuFlex>
          </ColumnMenuItem>
          <MenuDivider />
          {defaultDatetimeFields.map(({ key, title }) => {
            const isSelected = selectedColumns.has(key);
            return (
              <ColumnMenuItem key={key} padding={0}>
                <Label htmlFor={key}>
                  <ColumnMenuFlex align="center" gap={1}>
                    {isSelected ? <CheckmarkIcon /> : <ColumnBox />}
                    <MenuItemText>{title}</MenuItemText>
                  </ColumnMenuFlex>
                  <HiddenCheckbox
                    id={key}
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleColumnSelect(key);
                    }}
                  />
                </Label>
              </ColumnMenuItem>
            );
          })}
          <MenuDivider />
          {selectableFields.map(
            ({ fieldPath, title, level }: SelectableField, key: number) => {
              const hasChildren =
                key + 1 < selectableFields.length &&
                selectableFields[key + 1].level > level;
              const isSelected = selectedColumns.has(fieldPath);
              return (
                <ColumnMenuItem
                  key={fieldPath}
                  padding={0}
                  pressed={hasChildren}
                  // disabled={hasChildren}
                  style={{ paddingLeft: level * 10 }}
                >
                  <Label htmlFor={fieldPath}>
                    <ColumnMenuFlex align="center" gap={1}>
                      {isSelected ? <CheckmarkIcon /> : <ColumnBox />}
                      <MenuItemText>{title}</MenuItemText>
                    </ColumnMenuFlex>
                    <HiddenCheckbox
                      id={fieldPath}
                      disabled={hasChildren}
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleColumnSelect(fieldPath);
                      }}
                    />
                  </Label>
                </ColumnMenuItem>
              );
            },
          )}
        </ColumnMenu>
      }
    />
  );
}

export default ColumnSelector;
