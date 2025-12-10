import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Entry } from '@db/types';
import { getEntries, searchEntries, getFavouriteEntries } from '@db/queries';
import { useTheme } from '@hooks/useTheme';
import { ShadowBox } from '@components/ShadowBox';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { formatDateWithOrdinal } from '@utils/dateFormat';
import EntryDetailScreen from './EntryDetailScreen';

type ViewMode = 'list' | 'grid' | 'card';

export default function TimelineScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showEntryDetail, setShowEntryDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueryRef = useRef<string>(''); // Store current query to avoid closure issues
  const showFavouritesOnlyRef = useRef(false); // Store current filter state to avoid closure issues
  const hasInitialLoadRef = useRef(false); // Track if we've done the initial load
  const { colors } = useTheme();

  const loadEntries = useCallback(async (query?: string, favouritesOnly = false) => {
    try {
      // Only show search loading if we have a query and it's 2+ characters
      if (query && query.trim().length >= 2) {
        setSearchLoading(true);
        setIsSearching(true);
        const data = await searchEntries(query.trim());
        // Filter by favourites if needed
        const filtered = favouritesOnly ? data.filter(e => e.favourite) : data;
        setEntries(filtered);
      } else {
        // Only set loading if we haven't done the initial load yet
        if (!hasInitialLoadRef.current) {
          setLoading(true);
          hasInitialLoadRef.current = true;
        }
        setIsSearching(false);
        const data = favouritesOnly 
          ? await getFavouriteEntries()
          : await getEntries();
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

  useEffect(() => {
    showFavouritesOnlyRef.current = showFavouritesOnly;
  }, [showFavouritesOnly]);

  // Reload entries when favourites filter changes
  useEffect(() => {
    const currentQuery = searchQueryRef.current.trim().length >= 2 ? searchQueryRef.current : undefined;
    loadEntries(currentQuery, showFavouritesOnly);
  }, [showFavouritesOnly, loadEntries]);

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
      // Reload current view (maintains search and filter if active)
      // Use refs to avoid dependencies that cause re-renders and loops
      const currentQuery = searchQueryRef.current.trim().length >= 2 ? searchQueryRef.current : undefined;
      loadEntries(currentQuery, showFavouritesOnlyRef.current);
    }, [loadEntries]) // Only depend on loadEntries to prevent re-renders and loops
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleEntryPress = (entryId: string) => {
    setSelectedEntryId(entryId);
    setShowEntryDetail(true);
  };

  const handleCloseEntryDetail = () => {
    setShowEntryDetail(false);
    setSelectedEntryId(null);
  };

  const handleEntryDeleted = () => {
    const currentQuery = searchQuery.trim().length >= 2 ? searchQuery : undefined;
    loadEntries(currentQuery, showFavouritesOnly); // Refresh the list after deletion (maintain search and filter if active)
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleFavouritesToggle = () => {
    setShowFavouritesOnly(!showFavouritesOnly);
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
            {/* Top: Image and Text Row */}
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

            {/* Bottom: Button and Duration Row */}
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
        
        {/* Search Input */}
        <View className="flex-row items-center bg-surface dark:bg-surface-dark rounded-full border border-border-subtle dark:border-border-subtle-dark px-3 py-3 mb-4">
          <Text className="text-text-muted dark:text-text-muted-dark mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search prompts and transcripts..."
            placeholderTextColor={colors.textMuted}
            className="flex-1 text-text-primary dark:text-text-primary-dark text-base"
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

            <TouchableOpacity
              onPress={handleFavouritesToggle}
              className={`px-4 py-2 rounded-full ${
                showFavouritesOnly
                  ? 'bg-button-primary dark:bg-button-primary-dark'
                  : 'bg-surface dark:bg-surface-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${showFavouritesOnly ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>
                  {showFavouritesOnly ? '❤️' : '🤍'}
                </Text>
                <Text className={`${
                  showFavouritesOnly ? 'text-text-button-primary dark:text-text-button-primary-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>Saved</Text>
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
              : showFavouritesOnly
              ? "No saved moments yet."
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
      <EntryDetailScreen
        visible={showEntryDetail}
        entryId={selectedEntryId}
        onClose={handleCloseEntryDetail}
        onDeleted={handleEntryDeleted}
      />
    </View>
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

