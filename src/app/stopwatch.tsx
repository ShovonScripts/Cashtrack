import { Card } from '@/components/card';
import { StopwatchTool } from '@/components/floating-tools/tools/StopwatchTool';
import { Screen } from '@/components/ui';

export default function StopwatchScreen() {
  return (
    <Screen topInset={false}>
      <Card>
        <StopwatchTool />
      </Card>
    </Screen>
  );
}
