import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { getEntries, searchEntries, updateEntry } from '@db/queries';
import { useTheme } from '@hooks/useTheme';
import { ButtonIcon } from '@components/ButtonIcon';
import { EntryCard } from '@components/EntryCard';
import { Toast } from '@components/Toast';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import Gradient from '@components/Gradient';

type ViewMode = 'list' | 'grid' | 'card';

export default function TimelineScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [showToast, setShowToast] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueryRef = useRef<string>(''); // Store current query to avoid closure issues
  const hasInitialLoadRef = useRef(false); // Track if we've done the initial load
  const { colors } = useTheme();

  const loadEntries = useCallback(async (query?: string) => {
    try {
      // Only show search loading if we have a query and it's 2+ characters
      if (query && query.trim().length >= 2) {
        setSearchLoading(true);
        setIsSearching(true);
        const data = await searchEntries(query.trim());
        setEntries(data);
      } else {
        // Only set loading if we haven't done the initial load yet
        if (!hasInitialLoadRef.current) {
          setLoading(true);
          hasInitialLoadRef.current = true;
        }
        setIsSearching(false);
        const data = await getEntries();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      // Silently fail for loading - user can retry by pulling to refresh or navigating away and back
      // We don't want to show an alert on every screen focus if there's a transient issue
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []); // No dependencies - stable function

  // Update refs whenever state changes
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Debounced search handler
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If search is cleared, load all entries immediately
    if (searchQuery.trim() === '') {
      setIsSearching(false);
      loadEntries('');
      return;
    }

    // Only search if query is 2+ characters
    if (searchQuery.trim().length < 2) {
      setIsSearching(false);
      return;
    }

    // Set new timer for search
    debounceTimerRef.current = setTimeout(() => {
      loadEntries(searchQuery);
    }, 300); // 300ms debounce

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, loadEntries]);

  // Reload entries whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Delay to ensure component is mounted before updating state
      const timer = setTimeout(() => {
        // Reload current view (maintains search if active)
        // Use refs to avoid dependencies that cause re-renders and loops
        const currentQuery = searchQueryRef.current.trim().length >= 2 ? searchQueryRef.current : undefined;
        loadEntries(currentQuery);
      }, 0);
      
      return () => {
        clearTimeout(timer);
      };
    }, [loadEntries]) // Only depend on loadEntries to prevent re-renders and loops
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

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
      
      // If this entry is playing, pause it
      if (isCurrentlyPlaying && sounds[entry.id]) {
        await sounds[entry.id].pauseAsync();
        setPlayingEntryId(null);
        return;
      }

      // Stop any currently playing entry
      if (playingEntryId && sounds[playingEntryId]) {
        await sounds[playingEntryId].pauseAsync();
        await sounds[playingEntryId].setPositionAsync(0);
      }

      // If sound exists for this entry, play it
      if (sounds[entry.id]) {
        await sounds[entry.id].playAsync();
        setPlayingEntryId(entry.id);
        sounds[entry.id].setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingEntryId(null);
          }
        });
      } else {
        // Create new sound
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

  // Cleanup sounds on unmount
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
        <View className="border-2 border-border-default dark:border-border-default-dark bg-surface-trans dark:bg-surface-trans-dark rounded-2xl p-4">
          <View className="flex-col gap-4 self-stretch">
            {/* Image at top */}
            {item.photo_local_uri && (
              <View className="w-[88px] h-[88px] rounded-[9.51px] overflow-hidden">
                <Image
                  source={{ uri: item.photo_local_uri }}
                  className="w-full h-full"
                  style={{ resizeMode: 'cover' }}
                />
              </View>
            )}

            {/* Prompt and Transcript */}
            <View className="flex-col gap-0.5 self-stretch">
              <Text className="text-base font-sans-semibold text-text-brand dark:text-text-brand-dark"
              numberOfLines={1}
              ellipsizeMode="tail">
                {item.prompt || 'Untitled Moment'}
              </Text>
              {item.transcript && (
                <Text 
                  className="text-xl font-serif-medium text-text-primary dark:text-text-secondary-dark"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.transcript}
                </Text>
              )}
            </View>

            {/* Bottom Row: Date/Duration and Play Button */}
            <View className="flex-row justify-between items-center self-stretch">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-sans-semibold text-text-muted dark:text-text-muted-dark">
                  {formattedDate}
                </Text>
                <View className="w-1 h-1 rounded-full bg-text-muted dark:bg-text-muted-dark" />
                {durationText && (
                  <Text className="text-sm font-sans-semibold text-text-muted dark:text-text-muted-dark">
                    {durationText}
                  </Text>
                )}
              </View>
              <ButtonIcon
                onPress={(e) => {
                  e?.stopPropagation();
                  playEntry(item);
                }}
                icon={isPlaying ? "ic-pause" : "ic-play-slim"}
                size="small"
                variant="primary"
              />
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

  const handleBookmark = async (entry: Entry) => {
    try {
      const updated = await updateEntry(entry.id, {
        favourite: !entry.favourite,
      });
      if (updated) {
        // Update the entry in the entries array
        setEntries(prev => prev.map(e => e.id === entry.id ? updated : e));
        // Only show toast when saving (not when unsaving)
        if (!entry.favourite) {
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error saving to favourites:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const renderCardView = () => (
    <FlatList
      data={entries}
      renderItem={({ item }) => (
        <EntryCard
          entry={item}
          onPress={() => handleEntryPress(item.id)}
          onBookmark={() => handleBookmark(item)}
          listMode={true}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
    />
  );

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
        
        {/* Search Input */}
        <View className="flex-row items-center bg-surface-trans dark:bg-surface-trans-dark rounded-full border border-border-subtle dark:border-border-subtle-dark px-3 py-3 mb-4">
          <Text className="text-text-muted dark:text-text-muted-dark mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search prompts and transcripts..."
            placeholderTextColor={colors.textMuted}
            className="flex-1 font-sans-medium text-text-primary dark:text-text-primary-dark text-base"
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchLoading ? (
            <ActivityIndicator size="small" color={colors.accent} className="ml-2" />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={handleClearSearch} className="ml-2">
              <Text className="text-text-muted dark:text-text-muted-dark text-lg">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* View Mode Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleViewModeChange('grid')}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'grid'
                  ? 'border-2 border-border-default dark:border-border-default bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface-trans dark:bg-surface-trans-dark border border-border-subtle dark:border-border-default-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'grid' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>⊞</Text>
                <Text className={`${
                  viewMode === 'grid' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-sans-medium`}>Grid</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewModeChange('list')}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'list'
                  ? 'border-2 border-border-default dark:border-border-default bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface-trans dark:bg-surface-trans-dark border border-border-subtle dark:border-border-default-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'list' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>☰</Text>
                <Text className={`${
                  viewMode === 'list' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-sans-medium`}>List</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewModeChange('card')}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'card'
                  ? 'border-2 border-border-default dark:border-border-default bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface-trans dark:bg-surface-trans-dark border border-border-subtle dark:border-border-default-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'card' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>▦</Text>
                <Text className={`${
                  viewMode === 'card' ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-sans-medium`}>Card</Text>
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
            {isSearching && searchQuery.trim().length > 0
              ? `No results for "${searchQuery}"`
              : "No moments yet.\nStart recording to create your first moment!"}
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

      <Toast
        visible={showToast}
        message="Moment saved!"
        duration={2000}
        onHide={() => setShowToast(false)}
      />
    </Gradient>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  searchInput: {
    padding: 0, // Remove default padding
  },
});


