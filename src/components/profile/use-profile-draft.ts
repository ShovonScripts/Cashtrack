import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform } from 'react-native';

import { usePreferences } from '@/context/expense-context';
import type { GenderOption, UserProfile } from '@/types/preferences';
import { notify } from '@/utils/confirm';
import { imageFileExtension } from '@/utils/image-file';
import { deleteLocalFile } from '@/utils/local-file';

export type PhotoKind = 'cover' | 'avatar';

/** Copies a picked photo into the app's own folder so it survives the picker cache being cleared. */
async function persistPickedImage(uri: string, prefix: string, mimeType?: string | null, fileName?: string | null): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const extension = imageFileExtension(uri, mimeType, fileName);
  const target = new File(Paths.document, `${prefix}-${Date.now()}.${extension}`);
  try {
    await new File(uri).copy(target);
    if (!target.exists) throw new Error('The copied image file is missing.');
    return target.uri;
  } catch (error) {
    await deleteLocalFile(target.uri);
    throw error;
  }
}

/** Deletes a photo the person picked but did not save (never the saved one). */
function dropDraftPhoto(draft: string | undefined, saved: string | undefined) {
  if (draft && draft !== saved) void deleteLocalFile(draft);
}

/**
 * The editable copy of the profile. Changes stay here until `save`; `discard`
 * (or leaving the page) puts everything back and removes photos that were
 * picked but never saved, so they do not pile up on the phone.
 */
export function useProfileDraft() {
  const { profile, updateProfile } = usePreferences();

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || '');
  const [ageText, setAgeText] = useState(profile.age !== null ? String(profile.age) : '');
  const [gender, setGender] = useState<GenderOption>(profile.gender);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | undefined>(profile.coverPhotoUri);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>(profile.profilePhotoUri);
  const [saving, setSaving] = useState(false);

  const parsedAge = ageText.trim() === '' ? null : Number(ageText);
  const ageError =
    parsedAge === null || (Number.isInteger(parsedAge) && parsedAge >= 1 && parsedAge <= 120)
      ? undefined
      : 'Enter an age from 1 to 120, or leave it blank.';

  // Compared with what is saved, so typing a change and undoing it is not "unsaved".
  const isDirty =
    name.trim() !== profile.name ||
    bio.trim() !== (profile.bio || '') ||
    parsedAge !== profile.age ||
    gender !== profile.gender ||
    coverPhotoUri !== profile.coverPhotoUri ||
    profilePhotoUri !== profile.profilePhotoUri;

  const completion =
    [Boolean(name.trim()), Boolean(profilePhotoUri), Boolean(coverPhotoUri), Boolean(bio.trim()), parsedAge !== null, Boolean(gender)].filter(
      Boolean,
    ).length / 6;

  const pickPhoto = async (kind: PhotoKind) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        notify('Photos not allowed', `Allow photo access for CashTrack in Settings to choose a ${kind === 'cover' ? 'banner' : 'profile photo'}.`);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: kind === 'cover' ? [16, 9] : [1, 1],
        quality: 0.85,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset?.uri) return;
      const next = await persistPickedImage(asset.uri, kind, asset.mimeType, asset.fileName);
      if (kind === 'cover') {
        dropDraftPhoto(coverPhotoUri, profile.coverPhotoUri);
        setCoverPhotoUri(next);
      } else {
        dropDraftPhoto(profilePhotoUri, profile.profilePhotoUri);
        setProfilePhotoUri(next);
      }
    } catch {
      notify('Photo not saved', 'Could not use that photo. Please try another one.');
    }
  };

  const removeProfilePhoto = () => {
    dropDraftPhoto(profilePhotoUri, profile.profilePhotoUri);
    setProfilePhotoUri(undefined);
  };

  const chooseCover = (uri: string) => {
    dropDraftPhoto(coverPhotoUri, profile.coverPhotoUri);
    setCoverPhotoUri(uri);
  };

  /** Returns true when saved. */
  const save = async (): Promise<boolean> => {
    if (ageError || saving) return false;
    setSaving(true);
    const previousCover = profile.coverPhotoUri;
    const previousAvatar = profile.profilePhotoUri;
    const next: UserProfile = {
      name: name.trim().slice(0, 50),
      bio: bio.trim().slice(0, 150),
      age: parsedAge,
      gender,
      coverPhotoUri,
      profilePhotoUri,
    };
    try {
      const saved = await updateProfile(next);
      if (!saved) {
        notify('Not saved', 'Your profile changes could not be saved. Please try again.');
        return false;
      }
      // The old photos are no longer used by anything.
      if (previousCover !== next.coverPhotoUri) await deleteLocalFile(previousCover);
      if (previousAvatar !== next.profilePhotoUri) await deleteLocalFile(previousAvatar);
      setName(next.name);
      setBio(next.bio ?? '');
      return true;
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    dropDraftPhoto(coverPhotoUri, profile.coverPhotoUri);
    dropDraftPhoto(profilePhotoUri, profile.profilePhotoUri);
    setName(profile.name);
    setBio(profile.bio || '');
    setAgeText(profile.age !== null ? String(profile.age) : '');
    setGender(profile.gender);
    setCoverPhotoUri(profile.coverPhotoUri);
    setProfilePhotoUri(profile.profilePhotoUri);
  };

  /** After "Erase all data": the saved profile is empty and its photos are gone. */
  const clearAfterReset = () => {
    dropDraftPhoto(coverPhotoUri, profile.coverPhotoUri);
    dropDraftPhoto(profilePhotoUri, profile.profilePhotoUri);
    setName('');
    setBio('');
    setAgeText('');
    setGender('');
    setCoverPhotoUri(undefined);
    setProfilePhotoUri(undefined);
  };

  return {
    name,
    setName: (value: string) => setName(value.slice(0, 50)),
    bio,
    setBio: (value: string) => setBio(value.slice(0, 150)),
    ageText,
    setAgeText: (value: string) => setAgeText(value.replace(/[^0-9]/g, '').slice(0, 3)),
    ageError,
    gender,
    setGender,
    coverPhotoUri,
    profilePhotoUri,
    pickPhoto,
    removeProfilePhoto,
    chooseCover,
    completion,
    isDirty,
    saving,
    save,
    discard,
    clearAfterReset,
  };
}

export type ProfileDraft = ReturnType<typeof useProfileDraft>;
