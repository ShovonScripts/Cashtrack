import { WorldClockTool } from '@/components/floating-tools/tools/WorldClockTool';
import { Screen } from '@/components/ui';

export default function WorldClockScreen() {
  return (
    <Screen topInset={false}>
      <WorldClockTool />
    </Screen>
  );
}
