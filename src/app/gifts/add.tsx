import { useLocalSearchParams } from 'expo-router';

import { GiftForm } from '@/components/gifts/gift-form';
import { useToast } from '@/context/toast-context';
import { useReceivedGifts } from '@/hooks/use-received-gifts';

export default function AddGiftScreen() {
  // `category` comes from the starter buttons on the empty Gifts page.
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { add } = useReceivedGifts();
  const toast = useToast();

  return (
    <GiftForm
      startCategoryId={typeof category === 'string' ? category : undefined}
      submitLabel="Save gift"
      onSubmit={async (draft) => {
        await add(draft);
        toast.show({ message: 'Gift saved. Something to be thankful for.', duration: 3000 });
      }}
    />
  );
}
