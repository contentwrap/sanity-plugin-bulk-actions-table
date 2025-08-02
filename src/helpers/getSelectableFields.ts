import { ObjectField } from 'sanity';

export interface SelectableField {
  field: ObjectField;
  fieldPath: string;
  title: string | undefined;
  level: number;
  sortable: boolean;
  type: string;
}

const nonSortableTypes = ['image', 'file', 'reference'];

function getInnerFields(
  childFields: ObjectField[],
  parentPath: string,
  level: number,
): SelectableField[] {
  return childFields.reduce((acc: SelectableField[], field: ObjectField) => {
    if (field.type.name === 'array') {
      return acc;
    }

    const fieldPath = `${parentPath}.${field.name}`;
    const title = field.type.title;
    const child = {
      field,
      fieldPath,
      title,
      level,
      type: field.type.name,
      sortable: !nonSortableTypes.includes(field.type.name),
    };

    if (
      field.type.name === 'slug' ||
      field.type.name === 'reference' ||
      field.type.name === 'image'
    ) {
      return [...acc, child];
    }

    // @ts-ignore
    if (field.type?.fields?.length) {
      child.sortable = false;
      // @ts-ignore
      const children = field.type.fields;
      const innerFields = getInnerFields(children, fieldPath, level + 1);

      if (innerFields.length) {
        return [...acc, child, ...innerFields];
      }
    }

    return [...acc, child];
  }, []);
}

export function getSelectableFields(
  fields: Array<ObjectField> = [],
): SelectableField[] {
  if (!fields.length) return [];

  return fields.reduce((acc: SelectableField[], field: ObjectField) => {
    if (field.type.name === 'array') {
      return acc;
    }

    const fieldPath: string = field.name;
    const title = field.type.title;
    const parent = {
      field,
      fieldPath,
      title,
      level: 0,
      type: field.type.name,
      sortable: !nonSortableTypes.includes(field.type.name),
    };

    if (
      field.type.name === 'slug' ||
      field.type.name === 'reference' ||
      field.type.name === 'image'
    ) {
      return [...acc, parent];
    }

    // @ts-ignore
    if (field.type?.fields?.length) {
      parent.sortable = false;
      // @ts-ignore
      const children = field.type.fields;
      const innerFields = getInnerFields(children, fieldPath, 1);

      if (innerFields.length) {
        return [...acc, parent, ...innerFields];
      }
    }

    return [...acc, parent];
  }, []);
}
