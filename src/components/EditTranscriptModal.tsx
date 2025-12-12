import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ButtonSecondary } from '@components/ButtonSecondary';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonIcon } from '@components/ButtonIcon';
import { useTheme } from '@hooks/useTheme';

interface EditTranscriptModalProps {
  visible: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export function EditTranscriptModal({
  visible,
  initialText,
  onClose,
  onSave,
}: EditTranscriptModalProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) {
      setText(initialText);
    }
  }, [visible, initialText]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

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
          className="bg-surface-strong dark:bg-surface-strong-dark rounded-xl px-6 pb-6 pt-5 w-11/12 max-w-sm"
          style={{ backgroundColor: colors.surfaceStrong }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-sans-semibold text-xl text-text-primary dark:text-text-primary-dark">
              Edit Transcription
            </Text>
            <ButtonIcon
              onPress={onClose}
              icon="ic-close-light.svg"
              size="medium"
              variant="secondary"
            />
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Enter transcription..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            className="bg-surface-trans dark:bg-surface-trans-dark rounded-lg p-4 text-text-primary dark:text-text-primary-dark font-serif-medium text-base mb-4"
            style={{
              backgroundColor: colors.surfaceTrans,
              color: colors.textPrimary,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
            autoFocus
          />

          <View className="flex-row gap-3">
            <ButtonSecondary
              onPress={onClose}
              title="Cancel"
              size="medium"
              className="flex-1"
            />
            <ButtonPrimary
              onPress={handleSave}
              title="Save"
              size="medium"
              className="flex-1"
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
