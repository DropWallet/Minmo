import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { getFavouriteEntries, updateEntry } from '@db/queries';
import { ViewModeButtons } from '@components/ViewModeButtons';
import { ListEntryCard } from '@components/ListEntryCard';
import { TimelineEntryCard } from '@components/TimelineEntryCard';
import Gradient from '@components/Gradient';

type ViewMode = 'list' | 'card';

export default function SavedScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const hasInitialLoadRef = useRef(false);

  const loadEntries = useCallback(async () => {
    try {
      if (!hasInitialLoadRef.current) {
        setLoading(true);
        hasInitialLoadRef.current = true;
      }
      const data = await getFavouriteEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleEntryPress = (entryId: string) => {
    // @ts-expect-error - navigation type doesn't include nested stack screens
    navigation.navigate('EntryImageDetail', { entryId });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const playEntry = async (entry: Entry) => {
    try {
      if (!entry.audio_local_uri) return;

      const isCurrentlyPlaying = playingEntryId === entry.id;
      
      if (isCurrentlyPlaying && sounds[entry.id]) {
        await sounds[entry.id].pauseAsync();
        setPlayingEntryId(null);
        return;
      }

      if (playingEntryId && sounds[playingEntryId]) {
        await sounds[playingEntryId].pauseAsync();
        await sounds[playingEntryId].setPositionAsync(0);
      }

      if (sounds[entry.id]) {
        await sounds[entry.id].playAsync();
        setPlayingEntryId(entry.id);
        sounds[entry.id].setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingEntryId(null);
          }
        });
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: entry.audio_local_uri },
          { shouldPlay: true }
        );
        setSounds(prev => ({ ...prev, [entry.id]: sound }));
        setPlayingEntryId(entry.id);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingEntryId(null);
          }
        });
      }
    } catch (error) {
      console.error('Error playing entry:', error);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(sounds).forEach(sound => {
        sound.unloadAsync().catch(() => {});
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBookmark = async (entry: Entry) => {
    try {
      const updated = await updateEntry(entry.id, {
        favourite: !entry.favourite,
      });
      if (updated) {
        // Remove from list immediately if unbookmarked
        if (!updated.favourite) {
          setEntries(prev => prev.filter(e => e.id !== entry.id));
        } else {
          // Update the entry in the list if bookmarked
          setEntries(prev => prev.map(e => e.id === entry.id ? updated : e));
        }
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const renderListEntry = ({ item }: { item: Entry }) => {
    const isPlaying = playingEntryId === item.id;
    return (
      <ListEntryCard
        entry={item}
        onPress={() => handleEntryPress(item.id)}
        onPlay={() => playEntry(item)}
        isPlaying={isPlaying}
        onBookmark={() => handleBookmark(item)}
      />
    );
  };

  const renderCardEntry = ({ item }: { item: Entry }) => {
    return (
      <TimelineEntryCard
        entry={item}
        onPress={() => handleEntryPress(item.id)}
        onBookmark={() => handleBookmark(item)}
      />
    );
  };

  if (loading && entries.length === 0) {
    return (
      <Gradient className="flex-1 items-center justify-center">
        <Text className="text-text-secondary dark:text-text-secondary-dark">Loading...</Text>
      </Gradient>
    );
  }

  return (
    <Gradient className="flex-1 pt-16">
      <View className="px-4 py-1">
        <Text className="font-serif-semibold text-4xl text-text-primary dark:text-text-primary-dark mb-4">
          Saved
        </Text>

        <ViewModeButtons viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </View>
      
      {loading && entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-text-secondary dark:text-text-secondary-dark">Loading...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-text-muted dark:text-text-muted-dark text-center">
            No saved moments yet.
          </Text>
        </View>
      ) : (
        <>
          {viewMode === 'list' && (
            <FlatList
              data={entries}
              renderItem={renderListEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
            />
          )}
          {viewMode === 'card' && (
            <FlatList
              data={entries}
              renderItem={renderCardEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
            />
          )}
        </>
      )}
    </Gradient>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
});

