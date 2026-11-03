import { TodoTool } from '@/components/floating-tools/tools/TodoTool';
import { Screen } from '@/components/ui';

export default function TodoScreen() {
  return (
    <Screen topInset={false}>
      <TodoTool variant="full" />
    </Screen>
  );
}
