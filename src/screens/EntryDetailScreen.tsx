import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Entry } from '@db/types';
import { getEntry, deleteEntry } from '@db/queries';
import { deleteFile } from '@utils/storage';
import { EntryCard } from '@components/EntryCard';
import { ReviewScreen } from './ReviewScreen';
import { DB_DELAYS } from '@utils/constants';

interface EntryDetailScreenProps {
  // Navigation params
  route?: {
    params?: {
      entryId: string;
    };
  };
  navigation?: any;
}

export default function EntryDetailScreen({ route: routeProp, navigation: navigationProp }: EntryDetailScreenProps = {}) {
  // Use hooks if available, otherwise use props
  const route = routeProp || useRoute();
  const navigation = navigationProp || useNavigation();
  
  const entryId = (route.params as any)?.entryId;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  useEffect(() => {
    if (entryId) {
      loadEntry();
    }
  }, [entryId]);

  const loadEntry = async (retryCount = 0) => {
    if (!entryId) return;
    setLoading(true);
    
    try {
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, DB_DELAYS.INIT));
      }
      
      const data = await getEntry(entryId);
      if (data) {
        setEntry(data);
      } else {
        Alert.alert('Error', 'Entry not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
      
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('NullPointerException') || 
           error.message.includes('prepareAsync'))) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return loadEntry(retryCount + 1);
      }
      
      Alert.alert(
        'Error', 
        'Failed to load entry. Please try again.',
        [
          { text: 'Close', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: () => loadEntry(0) },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (entry) {
      setEditingEntry(entry);
      setShowReview(true);
    }
  };

  const handleDelete = () => {
    if (!entry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (entry.audio_local_uri) {
                try {
                  await deleteFile(entry.audio_local_uri);
                } catch (error) {
                  console.error('Error deleting audio file:', error);
                }
              }
              if (entry.photo_local_uri) {
                try {
                  await deleteFile(entry.photo_local_uri);
                } catch (error) {
                  console.error('Error deleting photo file:', error);
                }
              }
              await deleteEntry(entry.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveComplete = async (updatedEntry: Entry) => {
    setShowReview(false);
    setEditingEntry(null);
    await loadEntry(); // Reload to show updated entry
  };

  if (showReview && editingEntry) {
    return (
      <ReviewScreen
        audioUri={undefined}
        duration={editingEntry.duration_seconds}
        prompt={editingEntry.prompt || ''}
        existingEntry={editingEntry}
        onCancel={() => {
          setShowReview(false);
          setEditingEntry(null);
        }}
        onComplete={handleSaveComplete}
      />
    );
  }

  if (loading || !entry) {
    return (
      <View className="flex-1 bg-surface-strong dark:bg-surface-strong-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <EntryCard
      entry={entry}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
