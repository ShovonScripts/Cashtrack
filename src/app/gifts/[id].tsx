import { router, useLocalSearchParams } from 'expo-router';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { GiftForm } from '@/components/gifts/gift-form';
import { Screen, SkeletonList } from '@/components/ui';
import { useToast } from '@/context/toast-context';
import { useReceivedGifts } from '@/hooks/use-received-gifts';
import { confirmDelete, notify } from '@/utils/confirm';

export default function EditGiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, gifts, update, remove, restore } = useReceivedGifts();
  const toast = useToast();
  const gift = gifts.find((item) => item.id === id);

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen topInset={false}>
        <SkeletonList rows={2} label="Loading the gift" />
      </Screen>
    );
  }

  if (!gift) {
    return (
      <Screen topInset={false}>
        <Card>
          <EmptyState
            icon="gift-outline"
            title="This gift is gone"
            message="It may have been deleted. Your other gifts are safe."
            actionLabel="Back to gifts"
            onAction={() => router.back()}
          />
        </Card>
      </Screen>
    );
  }

  const deleteGift = () =>
    confirmDelete('Delete this gift?', 'You can undo this straight after.', async () => {
      try {
        const removed = await remove(gift.id);
        router.back();
        if (removed) {
          toast.show({
            message: 'Gift deleted',
            actionLabel: 'Undo',
            onAction: () => {
              restore(removed).catch(() => notify('Could not undo', 'The gift could not be put back.'));
            },
          });
        }
      } catch {
        notify('Could not delete', 'The gift could not be deleted. Please try again.');
      }
    });

  return (
    <GiftForm
      // Remount when switching gifts so the fields start from the right one.
      key={gift.id}
      initial={gift}
      submitLabel="Save changes"
      onSubmit={async (draft) => {
        await update(gift.id, draft);
        router.back();
      }}
      onDelete={deleteGift}
    />
  );
}
