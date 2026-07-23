import { SectionHeading } from '../components/SectionHeading';
import { PlaceholderPanel } from '../components/PlaceholderPanel';

export default function ProductsPage() {
  return (
    <div>
      <SectionHeading title="Товары" description="Карточки товаров внутри каждой категории каталога." />
      <PlaceholderPanel />
    </div>
  );
}
