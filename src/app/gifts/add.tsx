import { router } from 'expo-router';

import { GiftForm } from '@/components/gifts/gift-form';
import { useToast } from '@/context/toast-context';
import { useReceivedGifts } from '@/hooks/use-received-gifts';

export default function AddGiftScreen() {
  const { add } = useReceivedGifts();
  const toast = useToast();

  return (
    <GiftForm
      submitLabel="Save gift"
      onSubmit={async (draft) => {
        await add(draft);
        toast.show({ message: 'Gift saved', duration: 2500 });
        router.back();
      }}
    />
  );
}
