import { ComponentType } from 'react';
import { ConfigContext } from 'sanity';
import { StructureBuilder } from 'sanity/structure';

export interface CreateBulkActionsTableConfig {
  type: string;
  title?: string;
  icon?: ComponentType | null;
  context: ConfigContext;
  S: StructureBuilder;
}
