import { Card } from '@/components/card';
import { CalculatorTool } from '@/components/floating-tools/tools/CalculatorTool';
import { Screen } from '@/components/ui';

export default function CalculatorScreen() {
  return (
    <Screen topInset={false}>
      <Card>
        <CalculatorTool />
      </Card>
    </Screen>
  );
}
