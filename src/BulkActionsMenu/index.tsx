import {
  ChevronDownIcon,
  PublishIcon,
  ResetIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons';
import {
  Button,
  Dialog,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  useToast,
} from '@sanity/ui';
import { nanoid } from 'nanoid';
import { useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Preview } from 'sanity';
import styled from 'styled-components';

import { useBulkActionsTableContext } from '../context';

const Content = styled.div`
  padding: 0 1rem;
  font-size: 0.85rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 0.75rem;
`;

interface Props {
  onDelete: () => void;
}

const ErroredDocuments = ({ e, schemaType }: { e: any; schemaType: any }) => {
  const idsWithErrors: string[] =
    'details' in e ? e.details.items.map((item: any) => item.error.id) : [];

  if (!idsWithErrors.length) {
    return null;
  }

  const plural = idsWithErrors.length !== 1;

  return (
    <ErrorBoundary fallback={null}>
      <p>
        Please unselect {plural ? 'these' : 'this'} document{plural ? 's' : ''}{' '}
        and try again:
      </p>
      <p>
        {idsWithErrors.map((id) => (
          <Preview
            key={id}
            schemaType={schemaType}
            layout="default"
            value={{ _id: id, _type: schemaType.type }}
          />
        ))}
      </p>
    </ErrorBoundary>
  );
};

const removeDraftPrefix = (s: string) =>
  s.startsWith('drafts.') ? s.substring('drafts.'.length) : s;

function BulkActionsMenu({ onDelete }: Props) {
  const {
    options: { client },
    selectedIds,
    setSelectedIds,
    schemaType,
  } = useBulkActionsTableContext();

  const buttonId = useMemo(nanoid, []);
  const toast = useToast();
  const dialogId = useMemo(nanoid, []);
  const [dialogMode, setDialogMode] = useState<
    'discard_changes' | 'unpublish' | 'publish' | 'delete' | null
  >(null);
  const [loading, setLoading] = useState(false);

  const handleDiscardChanges = async () => {
    setLoading(true);

    try {
      const ids = await client.fetch<string[]>('*[_id in $ids]._id', {
        ids: Array.from(selectedIds)
          .map((id) => [id, `drafts.${id}`])
          .flat(),
      });

      const idSet = ids.reduce((set, id) => {
        set.add(id);
        return set;
      }, new Set<string>());

      const draftIdsThatAlsoHavePublishedIds = ids.filter(
        (id) =>
          id.startsWith('drafts.') && idSet.has(id.substring('drafts.'.length)),
      );

      const t = client.transaction();

      for (const id of draftIdsThatAlsoHavePublishedIds) {
        t.delete(id);
      }

      await t.commit();

      toast.push({
        title: 'Changes Discarded',
        description: `${selectedIds.size} documents reverted`,
        status: 'success',
        closable: true,
        duration: 10 * 1000,
      });
      setSelectedIds(new Set());

      setDialogMode(null);
    } catch (e) {
      console.warn(e);

      toast.push({
        title: 'Error Bulk Discarding Changes',
        description: (
          <>
            <p>The bulk discard changes failed.</p>
            <ErroredDocuments e={e} schemaType={schemaType} />
          </>
        ),
        status: 'error',
        closable: true,
        duration: 30 * 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);

    try {
      const publishedDocuments = await client.fetch<any[]>('*[_id in $ids]', {
        ids: Array.from(selectedIds),
      });

      const t = client.transaction();

      for (const publishedDocument of publishedDocuments) {
        t.createIfNotExists({
          ...publishedDocument,
          _id: `drafts.${publishedDocument._id}`,
          _updatedAt: new Date().toISOString(),
        });
        t.delete(publishedDocument._id);
      }

      await t.commit();

      toast.push({
        title: 'Unpublish Successful',
        description: `${selectedIds.size} documents unpublished`,
        status: 'success',
        closable: true,
        duration: 10 * 1000,
      });
      setSelectedIds(new Set());
    } catch (e) {
      console.warn(e);

      toast.push({
        title: 'Error Bulk Unpublishing',
        description: (
          <>
            <p>
              The bulk unpublished failed. This usually occurs because there are
              other documents referencing the documents you’re trying to
              unpublish.
            </p>
            <ErroredDocuments e={e} schemaType={schemaType} />
          </>
        ),
        status: 'error',
        closable: true,
        duration: 30 * 1000,
      });
    } finally {
      setDialogMode(null);
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);

    try {
      const draftDocuments = await client.fetch<any[]>('*[_id in $ids]', {
        ids: Array.from(selectedIds).map((id) => `drafts.${id}`),
      });

      const t = client.transaction();

      for (const draftDocument of draftDocuments) {
        t.createOrReplace({
          ...draftDocument,
          _id: removeDraftPrefix(draftDocument._id),
          _updatedAt: new Date().toISOString(),
        });
        t.delete(draftDocument._id);
      }

      await t.commit();

      toast.push({
        title: 'Publish Successful',
        description: `${selectedIds.size} documents published`,
        status: 'success',
        closable: true,
        duration: 10 * 1000,
      });
      setSelectedIds(new Set());
    } catch (e) {
      console.warn(e);

      toast.push({
        title: 'Error Bulk Publishing',
        description: (
          <>
            <p>The bulk publish failed.</p>
            <ErroredDocuments e={e} schemaType={schemaType} />
          </>
        ),
        status: 'error',
        closable: true,
        duration: 30 * 1000,
      });
    } finally {
      setDialogMode(null);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const idsToDelete = await client.fetch<string[]>('*[_id in $ids]._id', {
        ids: Array.from(selectedIds)
          .map((id) => [id, `drafts.${id}`])
          .flat(),
      });

      const t = client.transaction();

      for (const id of idsToDelete) {
        t.delete(id);
      }

      await t.commit();

      toast.push({
        title: 'Delete Successful',
        description: `${selectedIds.size} documents deleted`,
        status: 'success',
        closable: true,
        duration: 10 * 1000,
      });

      onDelete();
    } catch (e) {
      console.warn(e);

      toast.push({
        title: 'Error Bulk Deleting',
        description: (
          <>
            <p>
              The bulk delete failed. This usually occurs because there are
              other documents referencing the documents you’re trying to delete.
            </p>

            <ErroredDocuments e={e} schemaType={schemaType} />
          </>
        ),
        status: 'error',
        closable: true,
        duration: 30 * 1000,
      });
    } finally {
      setDialogMode(null);
      setLoading(false);
    }
  };

  return (
    <>
      <MenuButton
        id={buttonId}
        button={
          <Button
            space={2}
            fontSize={1}
            padding={2}
            text="Update items"
            tone="primary"
            iconRight={ChevronDownIcon}
          />
        }
        popover={{ portal: true, placement: 'bottom' }}
        menu={
          <Menu style={{ textAlign: 'left' }}>
            <MenuItem
              className="prevent-nav"
              text="Publish"
              icon={PublishIcon}
              tone="positive"
              onClick={() => setDialogMode('publish')}
            />
            <MenuItem
              className="prevent-nav"
              text="Discard pending changes"
              icon={ResetIcon}
              onClick={() => setDialogMode('discard_changes')}
            />
            <MenuItem
              text="Unpublish"
              icon={UnpublishIcon}
              tone="caution"
              className="prevent-nav"
              onClick={() => setDialogMode('unpublish')}
            />
            <MenuDivider />
            <MenuItem
              tone="critical"
              icon={TrashIcon}
              text="Delete"
              className="prevent-nav"
              onClick={() => setDialogMode('delete')}
            />
          </Menu>
        }
      />

      {dialogMode === 'discard_changes' && (
        <Dialog
          id={dialogId}
          header="Discard Changes"
          zOffset={100000}
          footer={
            <Footer>
              <Button
                text="Cancel"
                mode="ghost"
                disabled={loading}
                onClick={() => setDialogMode(null)}
              />
              <Button
                text="Discard Changes"
                tone="critical"
                mode="ghost"
                disabled={loading}
                onClick={handleDiscardChanges}
              />
            </Footer>
          }
          onClose={() => setDialogMode(null)}
        >
          <Content>
            <p>
              Are you sure you want to discard changes to{' '}
              <strong>{selectedIds.size}</strong> document
              {selectedIds.size === 1 ? '' : 's'}?
            </p>
            <p>
              Discarding changes reverts changes made to any drafts of the
              selected documents and restores the currently published versions.
            </p>
            <p>
              You can use the{' '}
              <a
                href="https://www.sanity.io/docs/history-experience"
                target="_blank"
                rel="noreferrer noopener"
              >
                document history
              </a>{' '}
              of each individual document to track these changes.
            </p>
          </Content>
        </Dialog>
      )}

      {dialogMode === 'unpublish' && (
        <Dialog
          id={dialogId}
          header="Unpublish Documents"
          zOffset={100000}
          footer={
            <Footer>
              <Button
                text="Cancel"
                mode="ghost"
                disabled={loading}
                onClick={() => setDialogMode(null)}
              />
              <Button
                text="Unpublish Documents"
                tone="caution"
                disabled={loading}
                onClick={handleUnpublish}
              />
            </Footer>
          }
          onClose={() => setDialogMode(null)}
        >
          <Content>
            <p>
              Are you sure you want to unpublish{' '}
              <strong>{selectedIds.size}</strong> document
              {selectedIds.size === 1 ? '' : 's'}?
            </p>
            <p>
              If you unpublish a document, it will no longer be available to the
              public. Its contents will be moved into a draft if a draft does
              not already exist. From there you can continue to author the
              document and re-publish it later.
            </p>
            <p>
              You can use the{' '}
              <a
                href="https://www.sanity.io/docs/history-experience"
                target="_blank"
                rel="noreferrer noopener"
              >
                document history
              </a>{' '}
              of each individual document to track these changes.
            </p>
          </Content>
        </Dialog>
      )}

      {dialogMode === 'publish' && (
        <Dialog
          id={dialogId}
          header="Publish Documents"
          zOffset={100000}
          footer={
            <Footer>
              <Button
                text="Cancel"
                mode="ghost"
                disabled={loading}
                onClick={() => setDialogMode(null)}
              />
              <Button
                text="Publish Documents"
                tone="positive"
                disabled={loading}
                onClick={handlePublish}
              />
            </Footer>
          }
          onClose={() => setDialogMode(null)}
        >
          <Content>
            <p>
              Are you sure you want to publish{' '}
              <strong>{selectedIds.size}</strong> document
              {selectedIds.size === 1 ? '' : 's'}?
            </p>
            <p>
              Publishing a document makes the current contents of each document
              publicly available.
            </p>
            <p>
              You can use the{' '}
              <a
                href="https://www.sanity.io/docs/history-experience"
                target="_blank"
                rel="noreferrer noopener"
              >
                document history
              </a>{' '}
              of each individual document to track these changes.
            </p>
          </Content>
        </Dialog>
      )}

      {dialogMode === 'delete' && (
        <Dialog
          id={dialogId}
          header="Delete Documents"
          zOffset={100000}
          footer={
            <Footer>
              <Button
                text="Cancel"
                mode="ghost"
                disabled={loading}
                onClick={() => setDialogMode(null)}
              />
              <Button
                text="Delete Documents"
                tone="critical"
                disabled={loading}
                onClick={handleDelete}
              />
            </Footer>
          }
          onClose={() => setDialogMode(null)}
        >
          <Content>
            <p>
              Are you sure you want to delete{' '}
              <strong>{selectedIds.size}</strong> document
              {selectedIds.size === 1 ? '' : 's'}?
            </p>
            <p>
              Deleting a document makes it no longer available to the public as
              well as removing any draft versions of it.
            </p>
            <p>
              <strong>Note:</strong> in order to delete a document, it must not
              be referenced by any other document. You may have to remove those
              references first.
            </p>
          </Content>
        </Dialog>
      )}
    </>
  );
}

export default BulkActionsMenu;
