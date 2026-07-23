import { SectionHeading } from '../components/SectionHeading';
import { PlaceholderPanel } from '../components/PlaceholderPanel';

export default function SettingsPage() {
  return (
    <div>
      <SectionHeading title="Настройки" description="Общие настройки административной панели." />
      <PlaceholderPanel />
    </div>
  );
}
