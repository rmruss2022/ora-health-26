/**
 * Forum Search Component
 * Search and sort forum posts
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

export type SortOption = 'recent' | 'most_responses' | 'most_supported';

interface ForumSearchProps {
  onSearch: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  currentSort: SortOption;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'most_responses', label: 'Most Responses' },
  { value: 'most_supported', label: 'Most Supported' },
];

export const ForumSearch: React.FC<ForumSearchProps> = ({
  onSearch,
  onSortChange,
  currentSort,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // Debounce search
    setTimeout(() => {
      onSearch(text);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleSortSelect = (sort: SortOption) => {
    onSortChange(sort);
    setShowSortModal(false);
  };

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === currentSort)?.label || 'Sort';

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, authors, categories..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Button */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortModal(true)}
      >
        <Ionicons name="funnel-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.sortButtonText}>{currentSortLabel}</Text>
      </TouchableOpacity>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  currentSort === option.value && styles.sortOptionActive,
                ]}
                onPress={() => handleSortSelect(option.value)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    currentSort === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {currentSort === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily.heading,
    color: theme.colors.text,
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  sortOptionText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
  },
  sortOptionTextActive: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
