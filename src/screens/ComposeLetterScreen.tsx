import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

const MAX_BODY_LENGTH = 2000;

export const ComposeLetterScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [recipient, setRecipient] = useState<User | null>(null);
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/users/search?q=${query}`);
    // const data = await response.json();
    
    // Mock data
    const mockUsers: User[] = [
      { id: '1', name: 'Alex Chen' },
      { id: '2', name: 'Emma Davis' },
      { id: '3', name: 'Sarah Mitchell' },
    ].filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
    
    setSearchResults(mockUsers);
  };

  const handleSelectRecipient = (user: User) => {
    setRecipient(user);
    setShowRecipientSearch(false);
    setSearchQuery('');
  };

  const handleSend = async () => {
    // Validation
    if (!recipient) {
      Alert.alert('Missing recipient', 'Please select a recipient for your letter.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Missing subject', 'Please add a subject to your letter.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing content', 'Please write something in your letter.');
      return;
    }
    if (body.length < 10) {
      Alert.alert('Too short', 'Your letter should be at least 10 characters long.');
      return;
    }

    setIsSending(true);
    
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/letters', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ recipient_id: recipient.id, subject, body }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Letter sent!',
        `Your letter to ${recipient.name} has been delivered.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send letter. Please try again.');
      console.error('Error sending letter:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (subject.trim() || body.trim()) {
      Alert.alert(
        'Save draft?',
        'Do you want to save this letter as a draft?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
          { text: 'Save Draft', onPress: () => saveDraft() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const saveDraft = () => {
    // TODO: Save draft to AsyncStorage or API
    console.log('Saving draft...');
    navigation.goBack();
  };

  const remainingChars = MAX_BODY_LENGTH - body.length;
  const isValid = recipient && subject.trim() && body.trim() && body.length >= 10;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={28} color="#2C3E2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Letter</Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!isValid || isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#8B9D83" />
          ) : (
            <Ionicons
              name="send"
              size={24}
              color={isValid ? '#8B9D83' : '#ccc'}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Paper texture background */}
        <View style={styles.paper}>
          {/* Recipient selector */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>To:</Text>
            {recipient ? (
              <TouchableOpacity
                style={styles.recipientChip}
                onPress={() => setRecipient(null)}
              >
                <Text style={styles.recipientName}>{recipient.name}</Text>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.recipientPlaceholder}
                onPress={() => setShowRecipientSearch(true)}
              >
                <Text style={styles.placeholderText}>Select recipient</Text>
                <Ionicons name="person-add-outline" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Recipient search */}
          {showRecipientSearch && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for someone..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map(user => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.searchResult}
                      onPress={() => handleSelectRecipient(user)}
                    >
                      <View style={styles.searchAvatar}>
                        <Text style={styles.searchAvatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.searchResultName}>{user.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Subject */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Subject:</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder="What's this letter about?"
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
          <TextInput
            style={styles.bodyInput}
            placeholder="Dear friend,

Write your letter here. Take your time, there's no rush. Share what's on your mind, ask questions, offer support, or simply connect.

With warmth,"
            placeholderTextColor="#bbb"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={MAX_BODY_LENGTH}
            textAlignVertical="top"
          />

          {/* Character count */}
          <Text
            style={[
              styles.charCount,
              remainingChars < 100 && styles.charCountWarning,
            ]}
          >
            {remainingChars} characters remaining
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E2E',
  },
  content: {
    flex: 1,
  },
  paper: {
    margin: 20,
    padding: 24,
    backgroundColor: '#FFFEF9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  recipientName: {
    fontSize: 15,
    color: '#2C3E2E',
    fontWeight: '500',
  },
  recipientPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: '#999',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4C5B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultName: {
    fontSize: 15,
    color: '#333',
  },
  subjectInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0D8CC',
    marginVertical: 20,
  },
  bodyInput: {
    minHeight: 300,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    paddingVertical: 0,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 12,
  },
  charCountWarning: {
    color: '#D89E5F',
    fontWeight: '600',
  },
});
