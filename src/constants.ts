import { SanityClient } from '@sanity/client';
import { Schema } from 'sanity';

import { Emitter } from './createEmitter';

export const rowsPerPage = [50, 100];
export const orderColumnDefault = { key: '', direction: 'asc', type: null };

export interface Options {
  type: string;
  title?: string;
  schema: Schema;
  client: SanityClient;
  refresh: Emitter;
}

export const defaultDatetimesObj = {
  _updatedAt: {
    key: '_updatedAt',
    title: 'Updated',
    sortable: true,
  },
  _createdAt: {
    key: '_createdAt',
    title: 'Created',
    sortable: true,
  },
  _lastPublishedAt: {
    key: '_lastPublishedAt',
    title: 'Last published',
    sortable: false,
  },
};

export const defaultDatetimeFields = Object.values(defaultDatetimesObj);
