import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { usePortfolioItems } from '../hooks/usePortfolioItems';
import { useHeroStats } from '../hooks/useHeroStats';
import { useSiteContentList } from '../hooks/useSiteContent';
import { useSocialLinks } from '../hooks/useSocialLinks';

// pageSize: 1 — the count cards only need `totalItems` from the existing
// paginated list endpoints, not the rows themselves. No new backend endpoint.
const COUNT_ONLY = { page: 1, pageSize: 1 };

export default function DashboardPage() {
  const categories = useCategories(COUNT_ONLY);
  const products = useProducts(COUNT_ONLY);
  const portfolio = usePortfolioItems(COUNT_ONLY);
  const heroStats = useHeroStats(COUNT_ONLY);
  const siteContent = useSiteContentList(COUNT_ONLY);
  const socialLinks = useSocialLinks(COUNT_ONLY);

  const cards = [
    { label: 'Категории', query: categories },
    { label: 'Товары', query: products },
    { label: 'Портфолио', query: portfolio },
    { label: 'Hero-статистика', query: heroStats },
    { label: 'Контент', query: siteContent },
    { label: 'Соцсети', query: socialLinks },
  ];

  return (
    <div>
      <SectionHeading title="Дашборд" description="Количество записей по разделам сайта." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.query.data?.totalItems}
            isLoading={card.query.isLoading}
            isError={card.query.isError}
            onRetry={() => void card.query.refetch()}
          />
        ))}
      </div>
    </div>
  );
}
