import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Entry } from '@db/types';
import { getEntries, searchEntries, getFavouriteEntries } from '@db/queries';
import { useTheme } from '@hooks/useTheme';
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

  const renderEntry = ({ item }: { item: Entry }) => (
    <TouchableOpacity
      className="bg-surface-strong dark:bg-surface-strong-dark rounded-lg p-4 mb-3 border border-border-subtle dark:border-border-subtle-dark"
      onPress={() => handleEntryPress(item.id)}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-text-primary dark:text-text-primary-dark text-base font-medium">
            {item.prompt || 'Untitled Moment'}
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-sm">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.duration_seconds && (
            <Text className="text-text-muted dark:text-text-muted-dark text-xs">
              {Math.round(item.duration_seconds)}s
            </Text>
          )}
        </View>
        {item.photo_local_uri && (
          <Image
            source={{ uri: item.photo_local_uri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}
      </View>
    </TouchableOpacity>
  );

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
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <View className="px-4 py-6 border-b border-border-subtle dark:border-border-subtle-dark">
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-semibold mb-4">Timeline</Text>
        
        {/* Search Input */}
        <View className="flex-row items-center bg-surface-strong dark:bg-surface-strong-dark rounded-lg border border-border-subtle dark:border-border-subtle-dark px-3 py-2 mb-4">
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
              className={`px-4 py-2 rounded-lg border ${
                viewMode === 'grid'
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'grid' ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>⊞</Text>
                <Text className={`${
                  viewMode === 'grid' ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>Grid</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewModeChange('list')}
              className={`px-4 py-2 rounded-lg border ${
                viewMode === 'list'
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'list' ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>☰</Text>
                <Text className={`${
                  viewMode === 'list' ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>List</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewModeChange('card')}
              className={`px-4 py-2 rounded-lg border ${
                viewMode === 'card'
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${viewMode === 'card' ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>▦</Text>
                <Text className={`${
                  viewMode === 'card' ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'
                } text-sm font-medium`}>Card</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFavouritesToggle}
              className={`px-4 py-2 rounded-lg border ${
                showFavouritesOnly
                  ? 'bg-accent border-accent'
                  : 'bg-surface-strong dark:bg-surface-strong-dark border-border-subtle dark:border-border-subtle-dark'
              }`}
            >
              <View className="flex-row items-center">
                <Text className={`mr-2 ${showFavouritesOnly ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>
                  {showFavouritesOnly ? '❤️' : '🤍'}
                </Text>
                <Text className={`${
                  showFavouritesOnly ? 'text-text-inverse dark:text-text-inverse-dark' : 'text-text-muted dark:text-text-muted-dark'
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
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 12,
  },
});

