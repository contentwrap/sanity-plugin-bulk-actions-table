import { SearchIcon } from '@sanity/icons';
import { Box, TextInput } from '@sanity/ui';
import { debounce } from 'lodash';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import { useBulkActionsTableContext } from '../context';

const SearchForm = styled.form`
  /* margin: 0.5rem; */
  display: flex;
  gap: 0.5rem;
`;

function SearchField() {
  const { paginatedClient, searchValue, setSearchValue } =
    useBulkActionsTableContext();

  const debouncedOnSearch = useCallback(
    // @ts-ignore
    debounce(paginatedClient.setUserQuery, 200),
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
