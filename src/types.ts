import { ComponentType } from 'react';
import { ConfigContext } from 'sanity';
import { StructureBuilder } from 'sanity/structure';

/**
 * Configuration options for creating a bulk actions table in Sanity Studio
 * @public
 */
export interface CreateBulkActionsTableConfig {
  /**
   * The document schema type to display in the table
   * @example 'post', 'page', 'product'
   */
  type: string;
  
  /**
   * Custom title for the table view in Studio navigation
   * If not provided, will use the document type name
   * @example 'Blog Posts', 'Product Catalog'
   */
  title?: string;
  
  /**
   * Custom icon component for the navigation item
   * Can be null, undefined, or a React component
   * If not provided, will use the default table icon
   * @example DocumentIcon, FolderIcon
   */
  icon?: ComponentType | null | undefined;
  
  /**
   * Sanity configuration context containing client and schema
   * Automatically provided by the structure resolver
   */
  context: ConfigContext;
  
  /**
   * Sanity Structure Builder instance
   * Automatically provided by the structure resolver
   */
  S: StructureBuilder;
  
  /**
   * API version for GROQ queries
   * If not provided, will use the version from your Sanity client configuration
   * Defaults to using client's configured API version
   * @example '2024-03-12', '2023-05-03'
   */
  apiVersion?: string;
}
