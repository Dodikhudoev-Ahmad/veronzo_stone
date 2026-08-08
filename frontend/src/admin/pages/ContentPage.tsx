import { useState } from 'react';
import toast from 'react-hot-toast';
import { SectionHeading } from '../components/SectionHeading';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { RowActionsMenu } from '../components/ui/RowActionsMenu';
import { ContactInfoFormDialog } from '../features/contactInfo/ContactInfoFormDialog';
import { SocialLinkFormDialog } from '../features/socialLinks/SocialLinkFormDialog';
import { SiteContentFormDialog } from '../features/siteContent/SiteContentFormDialog';
import { HeroStatFormDialog } from '../features/heroStats/HeroStatFormDialog';
import { TranslationEditorModal } from '../features/translations/TranslationEditorModal';
import { TRANSLATION_FIELD_CONFIGS } from '../features/translations/translationFieldConfig';
import type { ContactInfoFormValues } from '../features/contactInfo/contactInfoSchema';
import type { SocialLinkFormValues } from '../features/socialLinks/socialLinkSchema';
import type { SiteContentFormValues } from '../features/siteContent/siteContentSchema';
import type { HeroStatFormValues } from '../features/heroStats/heroStatSchema';
import {
  useContactInfoList,
  useCreateContactInfo,
  useUpdateContactInfo,
  useDeleteContactInfo,
} from '../hooks/useContactInfo';
import { useSocialLinks, useCreateSocialLink, useUpdateSocialLink, useDeleteSocialLink } from '../hooks/useSocialLinks';
import {
  useSiteContentList,
  useCreateSiteContent,
  useUpdateSiteContent,
  useDeleteSiteContent,
} from '../hooks/useSiteContent';
import { useHeroStats, useCreateHeroStat, useUpdateHeroStat, useDeleteHeroStat } from '../hooks/useHeroStats';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../lib/apiError';
import type {
  ContactInfoRequest,
  ContactInfoResponse,
  SocialLinkRequest,
  SocialLinkResponse,
  SiteContentRequest,
  SiteContentResponse,
  HeroStatRequest,
  HeroStatResponse,
} from '../api/types';

// All contact/social rows are managed by hand through this page — realistically
// a handful of rows each (phone, showroom, email, 3-4 social platforms), so
// unlike Categories/Products/Gallery this list skips search/sort/pagination UI
// and just fetches everything in one page.
const LIST_ALL_PARAMS = { pageSize: 100 };

type ContactDialogState = { mode: 'create' } | { mode: 'edit'; item: ContactInfoResponse } | null;

function toContactInfoRequest(values: ContactInfoFormValues): ContactInfoRequest {
  return { label: values.label.trim(), value: values.value.trim(), sortOrder: values.sortOrder };
}

function ContactInfoSection() {
  const [dialogState, setDialogState] = useState<ContactDialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactInfoResponse | null>(null);
  const [translationsTarget, setTranslationsTarget] = useState<ContactInfoResponse | null>(null);

  const { data, isLoading, isError, refetch } = useContactInfoList(LIST_ALL_PARAMS);
  const createMutation = useCreateContactInfo();
  const updateMutation = useUpdateContactInfo();
  const deleteMutation = useDeleteContactInfo();

  function handleSubmit(values: ContactInfoFormValues) {
    const payload = toContactInfoRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('Контакт обновлён');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить контакт')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Контакт добавлен');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить контакт')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Контакт удалён');
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить контакт'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<ContactInfoResponse>[] = [
    { key: 'label', label: 'Подпись', render: (c) => c.label },
    { key: 'value', label: 'Значение', render: (c) => c.value },
    { key: 'sortOrder', label: 'Порядок', render: (c) => c.sortOrder },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end">
          <RowActionsMenu
            ariaLabel={`Действия: «${c.label}»`}
            actions={[
              { label: 'Переводы', onClick: () => setTranslationsTarget(c) },
              { label: 'Изменить', onClick: () => setDialogState({ mode: 'edit', item: c }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteTarget(c) },
            ]}
          />
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section>
      <SectionHeading
        title="Контакты"
        description="Телефон, email, адрес — отображаются в разделе «Контакты» и футере сайта."
        action={
          <button
            type="button"
            onClick={() => setDialogState({ mode: 'create' })}
            className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            + Добавить
          </button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Контактов пока нет" description="Добавьте телефон, email или адрес." />
      ) : (
        <DataTable columns={columns} rows={data.items} getRowId={(c) => c.id} />
      )}

      <ContactInfoFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить контакт"
        message={deleteTarget ? `Удалить «${deleteTarget.label}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <TranslationEditorModal
        open={translationsTarget !== null}
        onClose={() => setTranslationsTarget(null)}
        entity="contact-info"
        id={translationsTarget?.id ?? null}
        entityTitle={translationsTarget ? `«${translationsTarget.label}»` : ''}
        fields={TRANSLATION_FIELD_CONFIGS['contact-info']}
      />
    </section>
  );
}

type SocialDialogState = { mode: 'create' } | { mode: 'edit'; item: SocialLinkResponse } | null;

function toSocialLinkRequest(values: SocialLinkFormValues): SocialLinkRequest {
  return { platform: values.platform.trim(), url: values.url.trim(), isVisible: values.isVisible };
}

function SocialLinksSection() {
  const [dialogState, setDialogState] = useState<SocialDialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialLinkResponse | null>(null);

  const { data, isLoading, isError, refetch } = useSocialLinks(LIST_ALL_PARAMS);
  const createMutation = useCreateSocialLink();
  const updateMutation = useUpdateSocialLink();
  const deleteMutation = useDeleteSocialLink();

  function handleSubmit(values: SocialLinkFormValues) {
    const payload = toSocialLinkRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('Соцсеть обновлена');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить соцсеть')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Соцсеть добавлена');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить соцсеть')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Соцсеть удалена');
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить соцсеть'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<SocialLinkResponse>[] = [
    { key: 'platform', label: 'Платформа', render: (s) => s.platform },
    { key: 'url', label: 'Ссылка', render: (s) => s.url },
    {
      key: 'isVisible',
      label: 'Статус',
      render: (s) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.isVisible ? 'text-accent' : 'text-muted'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.isVisible ? 'bg-accent' : 'bg-muted'}`} />
          {s.isVisible ? 'Видимая' : 'Скрыта'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end">
          <RowActionsMenu
            ariaLabel={`Действия: «${s.platform}»`}
            actions={[
              { label: 'Изменить', onClick: () => setDialogState({ mode: 'edit', item: s }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteTarget(s) },
            ]}
          />
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="mt-10">
      <SectionHeading
        title="Соцсети"
        description="WhatsApp, Telegram, Instagram — иконки-ссылки в разделе «Контакты» на сайте."
        action={
          <button
            type="button"
            onClick={() => setDialogState({ mode: 'create' })}
            className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            + Добавить
          </button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Соцсетей пока нет" description="Добавьте WhatsApp, Telegram или Instagram." />
      ) : (
        <DataTable columns={columns} rows={data.items} getRowId={(s) => s.id} />
      )}

      <SocialLinkFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить соцсеть"
        message={deleteTarget ? `Удалить «${deleteTarget.platform}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

const SITE_CONTENT_PAGE_SIZE = 20;

type SiteContentDialogState = { mode: 'create' } | { mode: 'edit'; item: SiteContentResponse } | null;

function toSiteContentRequest(values: SiteContentFormValues): SiteContentRequest {
  return { key: values.key.trim(), value: values.value.trim() };
}

function SiteContentSection() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [dialogState, setDialogState] = useState<SiteContentDialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteContentResponse | null>(null);
  const [translationsTarget, setTranslationsTarget] = useState<SiteContentResponse | null>(null);

  // A new search invalidates the current page position. Reset during render
  // (React's documented "adjusting state when a dependency changes" pattern),
  // matching Categories/Products/Portfolio/Gallery, rather than in an effect.
  const [appliedSearch, setAppliedSearch] = useState(debouncedSearch);
  if (appliedSearch !== debouncedSearch) {
    setAppliedSearch(debouncedSearch);
    setPage(1);
  }

  const { data, isLoading, isError, refetch } = useSiteContentList({
    page,
    pageSize: SITE_CONTENT_PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const createMutation = useCreateSiteContent();
  const updateMutation = useUpdateSiteContent();
  const deleteMutation = useDeleteSiteContent();

  function handleSubmit(values: SiteContentFormValues) {
    const payload = toSiteContentRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('Текст обновлён');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить текст')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Текст добавлен');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить текст')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const wasLastItemOnPage = data?.items.length === 1 && page > 1;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Текст удалён');
        setDeleteTarget(null);
        if (wasLastItemOnPage) {
          setPage((p) => Math.max(1, p - 1));
        }
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить текст'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<SiteContentResponse>[] = [
    { key: 'key', label: 'Ключ', render: (c) => c.key },
    { key: 'value', label: 'Значение', render: (c) => <span className="line-clamp-2 max-w-md">{c.value}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end">
          <RowActionsMenu
            ariaLabel={`Действия: «${c.key}»`}
            actions={[
              { label: 'Переводы', onClick: () => setTranslationsTarget(c) },
              { label: 'Изменить', onClick: () => setDialogState({ mode: 'edit', item: c }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteTarget(c) },
            ]}
          />
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFiltered = debouncedSearch !== '';

  return (
    <section className="mt-10">
      <SectionHeading
        title="Тексты секций"
        description="Строки контента, отображаемые в hero, «О компании», «Контактах» и футере сайта."
        action={
          <button
            type="button"
            onClick={() => setDialogState({ mode: 'create' })}
            className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            + Добавить
          </button>
        }
      />

      <div className="mb-4">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Поиск по ключу или тексту" />
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'Ничего не найдено' : 'Текстов пока нет'}
          description={isFiltered ? 'Попробуйте изменить условия поиска.' : 'Добавьте первую запись контента.'}
        />
      ) : (
        <>
          <DataTable columns={columns} rows={data.items} getRowId={(c) => c.id} />
          <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPageChange={setPage} />
        </>
      )}

      <SiteContentFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить текст"
        message={deleteTarget ? `Удалить «${deleteTarget.key}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <TranslationEditorModal
        open={translationsTarget !== null}
        onClose={() => setTranslationsTarget(null)}
        entity="site-content"
        id={translationsTarget?.id ?? null}
        entityTitle={translationsTarget ? `«${translationsTarget.key}»` : ''}
        fields={TRANSLATION_FIELD_CONFIGS['site-content']}
      />
    </section>
  );
}

type HeroStatDialogState = { mode: 'create' } | { mode: 'edit'; item: HeroStatResponse } | null;

function toHeroStatRequest(values: HeroStatFormValues): HeroStatRequest {
  return {
    label: values.label.trim(),
    value: values.value,
    suffix: values.suffix.trim() || null,
    sortOrder: values.sortOrder,
    isVisible: values.isVisible,
  };
}

function HeroStatsSection() {
  const [dialogState, setDialogState] = useState<HeroStatDialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroStatResponse | null>(null);
  const [translationsTarget, setTranslationsTarget] = useState<HeroStatResponse | null>(null);

  const { data, isLoading, isError, refetch } = useHeroStats(LIST_ALL_PARAMS);
  const createMutation = useCreateHeroStat();
  const updateMutation = useUpdateHeroStat();
  const deleteMutation = useDeleteHeroStat();

  function handleSubmit(values: HeroStatFormValues) {
    const payload = toHeroStatRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('Показатель обновлён');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить показатель')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Показатель добавлен');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить показатель')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Показатель удалён');
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить показатель'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<HeroStatResponse>[] = [
    { key: 'label', label: 'Подпись', render: (h) => h.label },
    { key: 'value', label: 'Значение', render: (h) => `${h.value}${h.suffix ?? ''}` },
    { key: 'sortOrder', label: 'Порядок', render: (h) => h.sortOrder },
    {
      key: 'isVisible',
      label: 'Статус',
      render: (h) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${h.isVisible ? 'text-accent' : 'text-muted'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${h.isVisible ? 'bg-accent' : 'bg-muted'}`} />
          {h.isVisible ? 'Видимый' : 'Скрыто'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (h) => (
        <div className="flex justify-end">
          <RowActionsMenu
            ariaLabel={`Действия: «${h.label}»`}
            actions={[
              { label: 'Переводы', onClick: () => setTranslationsTarget(h) },
              { label: 'Изменить', onClick: () => setDialogState({ mode: 'edit', item: h }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteTarget(h) },
            ]}
          />
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="mt-10">
      <SectionHeading
        title="Статистика hero"
        description="Числовые показатели («18 лет на рынке», «340+ объектов сдано») в hero-секции сайта."
        action={
          <button
            type="button"
            onClick={() => setDialogState({ mode: 'create' })}
            className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            + Добавить
          </button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Показателей пока нет" description="Добавьте первый показатель hero-секции." />
      ) : (
        <DataTable columns={columns} rows={data.items} getRowId={(h) => h.id} />
      )}

      <HeroStatFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить показатель"
        message={deleteTarget ? `Удалить «${deleteTarget.label}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <TranslationEditorModal
        open={translationsTarget !== null}
        onClose={() => setTranslationsTarget(null)}
        entity="hero-stats"
        id={translationsTarget?.id ?? null}
        entityTitle={translationsTarget ? `«${translationsTarget.label}»` : ''}
        fields={TRANSLATION_FIELD_CONFIGS['hero-stats']}
      />
    </section>
  );
}

export default function ContentPage() {
  return (
    <div>
      <SectionHeading title="Контент" description="Тексты секций, статистика hero, соцсети и контактные данные." />
      <ContactInfoSection />
      <SocialLinksSection />
      <HeroStatsSection />
      <SiteContentSection />
    </div>
  );
}
