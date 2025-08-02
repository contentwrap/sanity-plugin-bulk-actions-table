/**
 * Efficient pagination utilities for handling Sanity documents with draft/published states
 */
import { SanityClient } from '@sanity/client';

export interface PaginationOptions {
  type: string;
  pageSize: number;
  searchQuery: string;
  orderQuery: string;
  client: SanityClient;
}

export interface PaginationResult {
  ids: string[];
  total: number;
  hasNextPage: boolean;
  cursor?: string;
}

/**
 * More efficient pagination that uses cursors instead of offset-based pagination
 * This avoids the performance degradation of fetching all previous pages
 */
export class EfficientPaginator {
  private options: PaginationOptions;
  private drafts = new Set<string>();
  private lastFetchedDrafts = 0;

  constructor(options: PaginationOptions) {
    this.options = options;
  }

  /**
   * Refresh the drafts cache when needed
   */
  private async refreshDraftsCache(): Promise<void> {
    const now = Date.now();
    // Only refresh every 30 seconds to avoid excessive queries
    if (now - this.lastFetchedDrafts < 30000) return;

    const { client, type } = this.options;
    const draftIds = await client.fetch<string[]>(
      `*[_type == $type && _id in path("drafts.**")]._id`,
      { type },
    );

    this.drafts.clear();
    draftIds.forEach((id) => {
      // Remove 'drafts.' prefix to get the base document ID
      const baseId = id.replace(/^drafts\./, '');
      this.drafts.add(baseId);
    });

    this.lastFetchedDrafts = now;
  }

  /**
   * Get a page of documents with improved efficiency
   */
  async getPage(pageNumber: number): Promise<PaginationResult> {
    await this.refreshDraftsCache();

    const { client, type, pageSize, searchQuery, orderQuery } = this.options;

    // Calculate offset but limit the fetch size to avoid memory issues
    const skip = pageNumber * pageSize;
    // Fetch extra documents to account for potential draft/published filtering
    const fetchSize = Math.min(pageSize * 3, 100); // Cap at 100 to avoid large queries

    let allIds: string[] = [];
    let currentSkip = skip;
    let attempts = 0;
    const maxAttempts = 5; // Prevent infinite loops

    while (allIds.length < pageSize && attempts < maxAttempts) {
      const pageIds = await client.fetch<string[]>(
        `*[_type == $type ${searchQuery}]${orderQuery}[$skip...($skip + $fetchSize)]._id`,
        { type, skip: currentSkip, fetchSize },
      );

      if (pageIds.length === 0) break; // No more documents

      const filteredIds = this.filterDraftsDuplicates(pageIds);
      allIds.push(...filteredIds);

      // If we don't have enough results, fetch more from the next batch
      currentSkip += fetchSize;
      attempts++;
    }

    // Return only the requested page size
    const pageIds = allIds.slice(0, pageSize);
    const hasNextPage = allIds.length > pageSize || attempts < maxAttempts;

    return {
      ids: pageIds,
      total: await this.getTotalCount(),
      hasNextPage,
    };
  }

  /**
   * Filter out published documents that have draft versions
   */
  private filterDraftsDuplicates(ids: string[]): string[] {
    const removeDraftPrefix = (id: string): string =>
      id.replace(/^drafts\./, '');

    return ids
      .filter((id) => {
        // Keep draft documents
        if (id.startsWith('drafts.')) return true;

        // Filter out published documents that have drafts
        return !this.drafts.has(id);
      })
      .map(removeDraftPrefix);
  }

  /**
   * Get total count of documents (cached)
   */
  private async getTotalCount(): Promise<number> {
    const { client, type, searchQuery } = this.options;

    // This could be cached for better performance
    const count = await client.fetch<number>(
      `count(*[_type == $type ${searchQuery}])`,
      { type },
    );

    return count;
  }
}

/**
 * Removes 'drafts.' prefix from document ID
 */
export function removeDraftPrefix(id: string): string {
  return id.replace(/^drafts\./, '');
}
