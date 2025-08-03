import { SearchIcon } from '@sanity/icons';
import { TextInput } from '@sanity/ui';
import debounce from 'lodash.debounce';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import { useBulkActionsTableContext } from '../context';
import { isValidSearchQuery, sanitizeGroqInput } from '../utils/sanitization';

const SearchForm = styled.form`
  display: flex;
  gap: 0.5rem;
`;

function SearchField() {
  const { paginatedClient, searchValue, setSearchValue } =
    useBulkActionsTableContext();

  const debouncedOnSearch = useCallback(
    debounce((query: string) => {
      // Validate and sanitize the search query before sending it
      if (isValidSearchQuery(query) || query.length === 0) {
        const sanitizedQuery = sanitizeGroqInput(query);
        paginatedClient.setUserQuery(sanitizedQuery);
      }
    }, 200),
    [paginatedClient.setUserQuery],
  );

  useEffect(() => {
    debouncedOnSearch(searchValue);
    return () => {
      debouncedOnSearch.cancel();
    };
  }, [searchValue, debouncedOnSearch]);

  return (
    <SearchForm onSubmit={(e) => e.preventDefault()}>
      <TextInput
        placeholder="Search"
        value={searchValue}
        fontSize={1}
        padding={2}
        icon={SearchIcon}
        onChange={(event) => setSearchValue(event.currentTarget.value)}
      />
    </SearchForm>
  );
}

export default SearchField;
