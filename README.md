<div align="center">
  <h1>Sanity Bulk Actions Table Plugin</h1>
  <h3>A powerful table view with bulk actions for managing Sanity documents</h3>
  <p><em>Developed and maintained by <a href="https://contentwrap.io" target="_blank">ContentWrap</a></em></p>
  <p><em>Forked from <a href="https://github.com/ricokahler/sanity-super-pane" target="_blank">Sanity Super Pane</a></em></p>

  <img src="https://img.shields.io/npm/v/sanity-plugin-bulk-actions-table" alt="Sanity Bulk Actions Table" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Sanity-F03E2F?logo=sanity&logoColor=white" alt="Sanity" />
  <img src="https://img.shields.io/npm/l/sanity-plugin-bulk-actions-table?style&color=5D6D7E" alt="GitHub license" />

  <br>
  <br>

</div>

---

## Features

- **Table View**: Display your documents in a sortable, searchable table format
- **Bulk Actions**: Select multiple documents and perform actions like publish, unpublish, duplicate, or delete
- **Custom Columns**: Choose which fields to display as columns in your table view
- **Search & Filter**: Real-time search across your document fields
- **Pagination**: Efficient loading of large document sets
- **Draft Handling**: Seamlessly work with both published and draft documents

---

## Installation

```sh
npm install sanity-plugin-bulk-actions-table
# or
yarn add sanity-plugin-bulk-actions-table
# or
pnpm add sanity-plugin-bulk-actions-table
```

---

## Usage

### Basic Setup

Add the plugin to your `sanity.config.ts` file:

```typescript
import { defineConfig } from 'sanity'
import { createBulkActionsTable } from 'sanity-plugin-bulk-actions-table'

export default defineConfig({
  // ... your other configuration
  structure: (S, context) => {
    return S.list()
      .title('Content')
      .items([
        // Add a bulk actions table for your document type
        createBulkActionsTable({
          type: 'post', // Your document type
          S,
          context,
          title: 'Posts Table', // Optional: custom title
          icon: YourIcon, // Optional: custom icon
        }),
        // ... your other structure items
      ])
  }
})
```

### Configuration Options

The `createBulkActionsTable` function accepts the following options:

```typescript
interface CreateBulkActionsTableConfig {
  type: string           // Required: The document type to display
  S: StructureBuilder    // Required: Sanity structure builder
  context: StructureResolverContext // Required: Sanity context
  title?: string         // Optional: Custom title for the table view
  icon?: React.ComponentType // Optional: Custom icon component
}
```

### Example with Multiple Document Types

```typescript
export default defineConfig({
  structure: (S, context) => {
    return S.list()
      .title('Content Management')
      .items([
        createBulkActionsTable({
          type: 'post',
          S,
          context,
          title: 'Blog Posts',
        }),
        createBulkActionsTable({
          type: 'page',
          S,
          context,
          title: 'Pages',
        }),
        createBulkActionsTable({
          type: 'product',
          S,
          context,
          title: 'Products',
        }),
        S.divider(),
        // ... other structure items
      ])
  }
})
```

---

## Available Bulk Actions

- **Publish**: Publish selected draft documents
- **Unpublish**: Unpublish selected published documents
- **Duplicate**: Create copies of selected documents
- **Delete**: Delete selected documents (with confirmation)
- **Discard Changes**: Discard draft changes and revert to published version

---

## Features in Detail

### Column Selection
Click the column selector button to choose which fields from your document schema should be displayed as columns in the table.

### Search
Use the search field to filter documents by their content. The search works across all text fields in your documents.

### Sorting
Click on column headers to sort by that field. Supports both ascending and descending order.

### Bulk Selection
- Click the "Select" button to enter bulk selection mode
- Use checkboxes to select individual documents or select all
- Perform actions on selected documents using the bulk actions menu

---

## Requirements

- Sanity Studio v3
- React 18+
- TypeScript (recommended)

---

## License

MIT © [ContentWrap](https://contentwrap.io)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you encounter any issues, please report them on [GitHub Issues](https://github.com/contentwrap/sanity-plugin-bulk-actions-table/issues).
