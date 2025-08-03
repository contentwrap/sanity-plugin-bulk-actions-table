import { SanityClient } from '@sanity/client';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useState } from 'react';
import { debounceTime, tap } from 'rxjs/operators';
import { SanityDocument } from 'sanity';

import { defaultDatetimesObj } from './constants';
import { ColumnOrder } from './hooks/useStickyStateOrder';
import { handleDataFetchError } from './utils/errorHandling';

const removeDraftPrefix = (s: string) =>
  s.startsWith('drafts.') ? s.substring('drafts.'.length) : s;

type ResultDocument = SanityDocument & {
  _normalizedId: string;
  _status: 'published' | 'published_with_pending_changes' | 'draft';
};

export interface PaginatedClient {
  results: ResultDocument[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  loading: boolean;
  pageIds: string[];
  total: number;
  refresh: () => void;
  setUserQuery: (query: string) => void;
}

interface Params {
  type: string;
  pageSize: number;
  selectedColumns: Set<string>;
  searchableFields: ((q: string) => string)[];
  orderColumn: ColumnOrder;
  client: SanityClient;
}

function usePaginatedClient({
  type,
  pageSize,
  selectedColumns,
  searchableFields,
  orderColumn,
  client,
}: Params) {
  // the loading statuses are a set of strings
  // when it's empty, nothing is loading
  const [loadingStatuses, setLoadingStatuses] = useState(new Set<string>());
  const loading = loadingStatuses.size > 0;

  // stores the state for the total amount of de-duped documents
  const [total, setTotal] = useState(0);

  // uses the pageSize to calculate the total pages
  const totalPages = Math.ceil(total / pageSize);

  // stores the current set of active IDs on the page.
  // these are fed into the `useEffect` that creates the `results` state
  const [pageIds, setPageIds] = useState<string[]>([]);

  // the current page. changing this will trigger a re-fetch of the `pageIds`
  const [page, setPage] = useState(0);

  // the current result set
  const [results, setResults] = useState<ResultDocument[]>([]);

  // Refresh mechanism: changing the refreshId triggers useEffect dependencies to re-run
  // This is a standard React pattern for manual refresh functionality
  const [refreshId, setRefreshId] = useState(nanoid());
  const refresh = useCallback(() => setRefreshId(nanoid()), []);

  const [userQuery, setUserQuery] = useState('');
  // Builds the string to use when a custom filter has been entered
  const searchQuery =
    userQuery.length && searchableFields.length
      ? ` && (${searchableFields.map((fn) => fn(userQuery)).join(' || ')})`
      : '';

  // Implements ordering from the <th> buttons
  const orderQuery = orderColumn
    ? `| order(${orderColumn.key}${orderColumn.type === 'slug' ? '.current' : ''} ${orderColumn.direction})`
    : ``;

  // get total count
  useEffect(() => {
    let canceled = false;

    async function getTotalCount() {
      // add the `total_count` to the loading statuses
      setLoadingStatuses((prev) => {
        const next = new Set(prev);
        next.add('total_count');
        return next;
      });

      // fetch all the draft IDs in this document type
      const draftIds = await client.fetch<string[]>(
        `*[_type == $type && _id in path("drafts.**") ${searchQuery}]._id`,
        { type },
      );

      const { draftsWithPublishedVersion, notDraftCount } = await client.fetch<{
        // find all the documents with a corresponding published version
        draftsWithPublishedVersion: string[];
        // and also grab a count of how many documents aren't drafts
        notDraftCount: number;
      }>(
        `{
          "draftsWithPublishedVersion": *[_type == $type && _id in $ids ${searchQuery}]._id,
          "notDraftCount": count(*[_type == $type && !(_id in path("drafts.**")) ${searchQuery}]),
        }`,
        { ids: draftIds.map(removeDraftPrefix), type },
      );

      // the calculation for the total is then:
      const newTotal =
        draftIds.length - draftsWithPublishedVersion.length + notDraftCount;

      // early return on canceled
      if (canceled) return;

      // remove `total_count` from the loading statuses
      setLoadingStatuses((prev) => {
        const next = new Set(prev);
        next.delete('total_count');
        return next;
      });

      setTotal(newTotal);
    }

    getTotalCount().catch((e) => {
      handleDataFetchError(e, 'getting total count');
    });

    return () => {
      canceled = true;
    };
  }, [type, refreshId, searchQuery]);

  // get page IDs
  useEffect(() => {
    const getPageIds = async (targetPage: number) => {
      // add the `page_ids` to the loading statuses
      setLoadingStatuses((prev) => {
        const next = new Set(prev);
        next.add('page_ids');
        return next;
      });

      // query for all the draft IDs
      const draftIds = await client.fetch<string[]>(
        `*[_type == $type && _id in path("drafts.**") ${searchQuery}]._id`,
        { type },
      );

      // create a set of drafts IDs.
      // these IDs are used to determine whether or a not a published version
      // should be ignored in order to favor the current draft version
      const drafts = draftIds.reduce((set, next) => {
        set.add(removeDraftPrefix(next));
        return set;
      }, new Set<string>());

      // this is a recursive function that will call itself until it reaches the
      // desired page.
      //
      // Improved pagination: fetch directly for the target page instead of recursively
      // fetching all previous pages. This maintains better performance for higher page numbers.
      const getPage = async (): Promise<string[]> => {
        // Calculate the starting position for the target page
        // We multiply by 2 to account for potential draft/published filtering
        const estimatedStart = targetPage * pageSize * 2;
        const batchSize = pageSize * 3; // Fetch larger batches to account for filtering

        let currentStart = estimatedStart;
        let collectedIds: string[] = [];
        let attempts = 0;
        const maxAttempts = 3; // Limit attempts to prevent infinite loops

        while (collectedIds.length < pageSize && attempts < maxAttempts) {
          const pageIds = await client.fetch<string[]>(
            `*[_type == $type ${searchQuery}]${orderQuery}[$start...$end]._id`,
            {
              type,
              start: currentStart,
              end: currentStart + batchSize,
            },
          );

          if (pageIds.length === 0) break; // No more documents

          const filteredIds = pageIds
            .filter((id) => {
              // if the id is a draft ID, we want to keep it
              if (id.startsWith('drafts.')) return true;

              // if the published _id exists in `drafts`, then there exists a draft
              // version of the current document and we should prefer that over the
              // published version
              if (drafts.has(id)) return false;

              return true;
            })
            .map(removeDraftPrefix);

          collectedIds.push(...filteredIds);
          currentStart += batchSize;
          attempts++;
        }

        // Return only the page size we need
        return collectedIds.slice(0, pageSize);
      };

      const ids = await getPage();

      // delete the `page_ids` from the loading statuses
      setLoadingStatuses((prev) => {
        const next = new Set(prev);
        next.delete('page_ids');
        return next;
      });

      return ids;
    };

    getPageIds(page)
      .then(setPageIds)
      .catch((e) => {
        handleDataFetchError(e, 'fetching page IDs');
      });
  }, [page, pageSize, type, refreshId, searchQuery, orderQuery]);

  // get results
  useEffect(() => {
    // take all the input IDs and duplicate them with the prefix `drafts.`
    const ids = pageIds.map((id) => [id, `drafts.${id}`]).flat();
    // Inner-object selected keys need to be shaped in the query
    const columnKeys = Array.from(selectedColumns).map((key: string) =>
      key.includes('.') ? `"${key}": ${key}` : key,
    );

    if (
      !columnKeys.includes(defaultDatetimesObj._updatedAt.key) &&
      columnKeys.includes(defaultDatetimesObj._lastPublishedAt.key)
    ) {
      columnKeys.push(defaultDatetimesObj._updatedAt.key);
    }

    const columnKeysString = columnKeys.join(', ');

    // these IDs will go into a specific query. if the draft or published
    // version happens to not exist, that's okay.
    const query = `*[_id in $ids ${searchQuery}]${orderQuery}{ _id, _type, ${columnKeysString} }`;

    async function getResults() {
      // add the `results` to the loading statuses
      setLoadingStatuses((prev) => {
        const next = new Set(prev);
        next.add('results');
        return next;
      });

      // create a dictionary of indexes where the keys are the IDs and the
      // values are the current index. this dictionary will be used to sort the
      // documents in their original order
      const indexes = pageIds.reduce<{ [id: string]: number }>(
        (acc, id, index) => {
          acc[id] = index;
          return acc;
        },
        {},
      );

      const newResults = await client.fetch<SanityDocument[]>(query, { ids });

      // reduce the results into an accumulator by their normalized ID.
      // if there is a draft version, prefer the draft over the published
      const reducedResults: ResultDocument[] = Object.values(
        newResults.reduce<{ [id: string]: any }>((acc, next) => {
          const id = removeDraftPrefix(next._id);
          const preceding = acc[id];

          const precedingIsDraft = preceding?._id.startsWith('drafts.');
          const nextIsDraft = next?._id.startsWith('drafts.');

          const status = preceding
            ? 'published_with_pending_changes'
            : nextIsDraft
              ? 'draft'
              : 'published';

          acc[id] = precedingIsDraft ? preceding : next;
          acc[id]._status = status;
          acc[id]._normalizedId = id;
          //
          if (
            orderColumn.key === '_updatedAt' &&
            orderColumn.direction === 'desc'
          ) {
            acc[id]._lastPublishedAt = nextIsDraft ? null : next._updatedAt;
          } else {
            acc[id]._lastPublishedAt = preceding
              ? preceding._updatedAt
              : nextIsDraft
                ? null
                : next._updatedAt;
          }

          return acc;
        }, {}),
      );

      // delete the `results` from the loading statuses
      setLoadingStatuses((prev) => {
        const next = new Set(prev);
        next.delete('results');
        return next;
      });

      setResults(
        reducedResults
          .slice()
          // sort the accumulated version by their original index
          .sort(
            (a: SanityDocument, b: SanityDocument) =>
              indexes[removeDraftPrefix(a._id)] -
              indexes[removeDraftPrefix(b._id)],
          ),
      );
    }

    getResults().catch((e) => {
      handleDataFetchError(e, 'fetching results');
    });
    // Listen to changes across the entire type
    const typeQuery = `*[_type == $type]`;
    const subscription = client
      .listen(typeQuery, { type })
      .pipe(
        tap((result) => {
          // Add a new id to the array if a new doc was created
          const docId = result.documentId.replace('drafts.', '');

          if (!pageIds.includes(docId)) {
            setPageIds([...pageIds, docId]);
          }

          // add the `results` to the loading statuses
          setLoadingStatuses((prev) => {
            const next = new Set(prev);
            next.add('results');
            return next;
          });
        }),
        debounceTime(1000),
      )
      .subscribe(getResults);

    return () => {
      subscription.unsubscribe();
    };
  }, [pageIds, selectedColumns, refreshId, searchQuery, orderQuery]);

  // reset page
  useEffect(() => {
    // if the page is greater than the total pages then reset the page.
    // this could occur if the page size changed
    if (page >= totalPages) {
      setPage(0);
    }
  }, [page, totalPages]);

  return {
    results,
    page,
    totalPages,
    setPage,
    loading,
    pageIds,
    total,
    refresh,
    setUserQuery,
  };
}

export default usePaginatedClient;
