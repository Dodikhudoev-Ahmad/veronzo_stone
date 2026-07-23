import { SectionHeading } from '../components/SectionHeading';
import { PlaceholderPanel } from '../components/PlaceholderPanel';

export default function DashboardPage() {
  return (
    <div>
      <SectionHeading title="Дашборд" description="Обзор сайта и последних заявок." />
      <PlaceholderPanel />
    </div>
  );
}
