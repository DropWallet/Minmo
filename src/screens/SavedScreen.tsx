import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { getFavouriteEntries } from '@db/queries';
import { ShadowBox } from '@components/ShadowBox';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { formatDateWithOrdinal } from '@utils/dateFormat';

type ViewMode = 'list' | 'grid' | 'card';

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
    navigation.navigate('EntryDetail', { entryId });
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

  const renderEntry = ({ item }: { item: Entry }) => {
    const entryDate = new Date(item.created_at);
    const formattedDate = formatDateWithOrdinal(entryDate);
    const durationText = item.duration_seconds ? `${Math.round(item.duration_seconds)}s` : '';
    const isPlaying = playingEntryId === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => handleEntryPress(item.id)}
        activeOpacity={0.9}
        className="mb-4"
      >
        <View className="bg-surface dark:bg-surface-dark rounded-2xl p-1.5">
          <View className="flex-col gap-0.5">
            <View className="flex-row items-start self-stretch">
              {item.photo_local_uri ? (
                <ShadowBox shadowSize="cardSmall" className="w-[74px] h-[74px] rounded-lg overflow-hidden">
                  <Image
                    source={{ uri: item.photo_local_uri }}
                    className="w-full h-full"
                    style={{ resizeMode: 'cover' }}
                  />
                </ShadowBox>
              ) : null}
              <View className="flex-col items-start gap-0.5 flex-1 pt-3">
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark pl-2">
                  {formattedDate}
                </Text>
                <Text className="text-2xl font-serif-semibold tracking-tighter leading-tight text-text-primary dark:text-text-primary-dark self-stretch pl-2">
                  {item.prompt || 'Untitled Moment'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-start gap-2.5 px-2 py-2 self-stretch">
              <ButtonPrimary
                onPress={() => {
                  playEntry(item);
                }}
                title={isPlaying ? "Pause" : "Listen"}
                iconLeft={isPlaying ? "ic-pause.svg" : "ic-play.svg"}
                size="small"
              />
              {durationText && (
                <Text className="flex-1 text-sm font-semibold text-right text-text-muted dark:text-text-muted-dark">
                  {durationText}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridView = () => (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="text-text-muted dark:text-text-muted-dark text-center">
        Grid view coming soon
      </Text>
    </View>
  );

  const renderCardView = () => (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="text-text-muted dark:text-text-muted-dark text-center">
        Card view coming soon
      </Text>
    </View>
  );

  if (loading && entries.length === 0) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark items-center justify-center">
        <Text className="text-text-secondary dark:text-text-secondary-dark">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-strong dark:bg-surface-strong-dark pt-16">
      <View className="px-4 py-1">
        <Text className="font-serif-semibold text-4xl text-text-primary dark:text-text-primary-dark mb-4">
          Saved
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleViewModeChange('grid')}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'grid'
                  ? 'bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface dark:bg-surface-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'grid' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>⊞</Text>
                <Text className={`${
                  viewMode === 'grid' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>Grid</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewModeChange('list')}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'list'
                  ? 'bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface dark:bg-surface-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'list' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>☰</Text>
                <Text className={`${
                  viewMode === 'list' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>List</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewModeChange('card')}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'card'
                  ? 'bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface dark:bg-surface-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'card' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>▦</Text>
                <Text className={`${
                  viewMode === 'card' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>Card</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
              renderItem={renderEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
            />
          )}
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'card' && renderCardView()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
});

