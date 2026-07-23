import { SectionHeading } from '../components/SectionHeading';
import { PlaceholderPanel } from '../components/PlaceholderPanel';

export default function ContentPage() {
  return (
    <div>
      <SectionHeading title="Контент" description="Тексты секций, статистика hero, соцсети и контактные данные." />
      <PlaceholderPanel />
    </div>
  );
}
