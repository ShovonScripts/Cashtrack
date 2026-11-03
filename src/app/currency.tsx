import { Card } from '@/components/card';
import { CurrencyTool } from '@/components/floating-tools/tools/CurrencyTool';
import { Screen } from '@/components/ui';

export default function CurrencyScreen() {
  return (
    <Screen topInset={false}>
      <Card>
        <CurrencyTool />
      </Card>
    </Screen>
  );
}
