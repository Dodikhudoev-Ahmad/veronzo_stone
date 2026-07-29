import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { ErrorState } from '../../components/ui/ErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCreateProductImage, useDeleteProductImage, useProductImages } from '../../hooks/useProductImages';
import { getApiErrorMessage } from '../../lib/apiError';
import type { ProductImageResponse, ProductResponse } from '../../api/types';

interface ProductGalleryModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductResponse | null;
}

// Manages the *additional* photos shown in the public gallery, on top of the
// product form's own single "cover" image (Product.ImageUrl) -- a separate
// resource (ProductImage), same reasoning as ProductAttributeValue: it can
// only be created once the product itself exists, and has its own admin CRUD.
export function ProductGalleryModal({ open, onClose, product }: ProductGalleryModalProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProductImageResponse | null>(null);

  const imagesQuery = useProductImages(
    product ? { productId: product.id, pageSize: 50, sort: 'sortOrder' } : {},
    { enabled: product !== null && open },
  );
  const createImage = useCreateProductImage();
  const deleteImage = useDeleteProductImage();

  const images = imagesQuery.data?.items ?? [];

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!product || !newImageUrl.trim()) {
      return;
    }
    const nextSortOrder = images.length > 0 ? Math.max(...images.map((i) => i.sortOrder)) + 1 : 0;
    createImage.mutate(
      { productId: product.id, imageUrl: newImageUrl.trim(), sortOrder: nextSortOrder },
      {
        onSuccess: () => {
          toast.success('Изображение добавлено');
          setNewImageUrl('');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить изображение')),
      },
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    deleteImage.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Изображение удалено');
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить изображение'));
        setDeleteTarget(null);
      },
    });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={product ? `Галерея: «${product.title}»` : 'Галерея'}>
        {imagesQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted">Загрузка…</p>
        ) : imagesQuery.isError ? (
          <ErrorState message="Не удалось загрузить изображения" onRetry={() => void imagesQuery.refetch()} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted">
              Дополнительные фото товара, показываются в галерее на публичной странице вместе с основным
              изображением из формы товара.
            </p>

            {images.length === 0 ? (
              <p className="text-sm text-muted">Дополнительных изображений пока нет.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {images.map((image) => (
                  <li key={image.id} className="flex items-center gap-3 rounded-md border border-cream-soft p-2">
                    <ImagePreview src={image.imageUrl} alt="" />
                    <span className="flex-1 truncate text-sm text-text" title={image.imageUrl}>
                      {image.imageUrl}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-error hover:underline"
                      onClick={() => setDeleteTarget(image)}
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAdd} className="flex items-end gap-3">
              <div className="flex-1">
                <FormField label="URL нового изображения" htmlFor="gallery-new-image">
                  <input
                    id="gallery-new-image"
                    value={newImageUrl}
                    onChange={(event) => setNewImageUrl(event.target.value)}
                    placeholder="assets/images/product-stone-2"
                    className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  />
                </FormField>
              </div>
              <button
                type="submit"
                disabled={createImage.isPending || !newImageUrl.trim()}
                className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110 disabled:opacity-60"
              >
                {createImage.isPending ? 'Добавление…' : 'Добавить'}
              </button>
            </form>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить изображение"
        message={deleteTarget ? `Удалить это изображение из галереи товара?` : ''}
        busy={deleteImage.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
