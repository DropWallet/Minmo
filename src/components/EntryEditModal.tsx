import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { ButtonSecondary } from '@components/ButtonSecondary';
import { ButtonDanger } from '@components/ButtonDanger';
import { ButtonIcon } from '@components/ButtonIcon';
import { useTheme } from '@hooks/useTheme';

interface EntryEditModalProps {
  visible: boolean;
  onClose: () => void;
  onRemoveReplaceImage: () => void;
  onEditTranscript: () => void;
  onDelete: () => void;
}

export function EntryEditModal({
  visible,
  onClose,
  onRemoveReplaceImage,
  onEditTranscript,
  onDelete,
}: EntryEditModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-surface dark:bg-surface-strong-dark rounded-xl px-7 pb-7 pt-5 w-11/12 max-w-sm"
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-sans-semibold text-xl text-text-primary dark:text-text-primary-dark">
              Edit Entry
            </Text>
            <ButtonIcon
              onPress={onClose}
              icon="ic-close-light.svg"
              size="medium"
              variant="secondary"
            />
          </View>

          <View className="gap-3">
            <ButtonSecondary
              onPress={onRemoveReplaceImage}
              title="Edit Image"
              size="medium"
            />
            <ButtonSecondary
              onPress={onEditTranscript}
              title="Edit Transcription"
              size="medium"
            />
            <ButtonDanger
              onPress={onDelete}
              title="Delete Entry"
              size="medium"
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

