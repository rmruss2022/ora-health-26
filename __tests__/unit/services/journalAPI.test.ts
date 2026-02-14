import { JournalAPI } from '../../../src/services/api/journalAPI';
import { apiClient } from '../../../src/services/api/apiClient';

jest.mock('../../../src/services/api/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('JournalAPI', () => {
  let journalAPI: JournalAPI;

  beforeEach(() => {
    journalAPI = new JournalAPI();
    jest.clearAllMocks();
  });

  describe('createEntry', () => {
    it('should create journal entry with all fields', async () => {
      const mockEntry = {
        id: 'entry-123',
        content: 'My journal entry',
        behaviorId: 'journal-prompt',
        mood: 'happy',
        tags: ['gratitude', 'reflection'],
        isShared: false,
        createdAt: new Date(),
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockEntry);

      const result = await journalAPI.createEntry({
        content: 'My journal entry',
        behaviorId: 'journal-prompt',
        mood: 'happy',
        tags: ['gratitude', 'reflection'],
        isShared: false,
      });

      expect(result).toEqual(mockEntry);
      expect(apiClient.post).toHaveBeenCalledWith('/journal/entries', {
        content: 'My journal entry',
        behaviorId: 'journal-prompt',
        mood: 'happy',
        tags: ['gratitude', 'reflection'],
        isShared: false,
      });
    });

    it('should create journal entry with minimal fields', async () => {
      const mockEntry = {
        id: 'entry-124',
        content: 'Simple entry',
        behaviorId: 'free-form',
        createdAt: new Date(),
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockEntry);

      const result = await journalAPI.createEntry({
        content: 'Simple entry',
        behaviorId: 'free-form',
      });

      expect(result).toEqual(mockEntry);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Validation error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        journalAPI.createEntry({
          content: '',
          behaviorId: 'journal-prompt',
        })
      ).rejects.toThrow('Validation error');
    });
  });

  describe('getEntries', () => {
    it('should get all entries without parameters', async () => {
      const mockEntries = [
        { id: '1', content: 'Entry 1', createdAt: new Date() },
        { id: '2', content: 'Entry 2', createdAt: new Date() },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockEntries);

      const result = await journalAPI.getEntries();

      expect(result).toEqual(mockEntries);
      expect(apiClient.get).toHaveBeenCalledWith('/journal/entries');
    });

    it('should get entries with limit', async () => {
      const mockEntries = [{ id: '1', content: 'Entry 1' }];
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockEntries);

      await journalAPI.getEntries({ limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/journal/entries?limit=10');
    });

    it('should get entries with date range', async () => {
      const mockEntries = [];
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockEntries);

      await journalAPI.getEntries({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/journal/entries?startDate=2024-01-01&endDate=2024-01-31'
      );
    });

    it('should get entries with all parameters', async () => {
      const mockEntries = [];
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockEntries);

      await journalAPI.getEntries({
        limit: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/journal/entries?limit=5&startDate=2024-01-01&endDate=2024-01-31'
      );
    });
  });

  describe('getEntry', () => {
    it('should get single entry by ID', async () => {
      const mockEntry = {
        id: 'entry-123',
        content: 'My entry',
        createdAt: new Date(),
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockEntry);

      const result = await journalAPI.getEntry('entry-123');

      expect(result).toEqual(mockEntry);
      expect(apiClient.get).toHaveBeenCalledWith('/journal/entries/entry-123');
    });

    it('should handle not found error', async () => {
      const error = new Error('Entry not found');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(journalAPI.getEntry('nonexistent')).rejects.toThrow('Entry not found');
    });
  });

  describe('updateEntry', () => {
    it('should update entry content', async () => {
      const mockUpdated = {
        id: 'entry-123',
        content: 'Updated content',
        updatedAt: new Date(),
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce(mockUpdated);

      const result = await journalAPI.updateEntry('entry-123', {
        content: 'Updated content',
      });

      expect(result).toEqual(mockUpdated);
      expect(apiClient.put).toHaveBeenCalledWith('/journal/entries/entry-123', {
        content: 'Updated content',
      });
    });

    it('should update entry mood and tags', async () => {
      const mockUpdated = {
        id: 'entry-123',
        mood: 'grateful',
        tags: ['mindfulness'],
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce(mockUpdated);

      await journalAPI.updateEntry('entry-123', {
        mood: 'grateful',
        tags: ['mindfulness'],
      });

      expect(apiClient.put).toHaveBeenCalledWith('/journal/entries/entry-123', {
        mood: 'grateful',
        tags: ['mindfulness'],
      });
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      (apiClient.put as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        journalAPI.updateEntry('entry-123', { content: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce(undefined);

      await journalAPI.deleteEntry('entry-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/journal/entries/entry-123');
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(error);

      await expect(journalAPI.deleteEntry('entry-123')).rejects.toThrow('Delete failed');
    });

    it('should handle not found on delete', async () => {
      const error = new Error('Entry not found');
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(error);

      await expect(journalAPI.deleteEntry('nonexistent')).rejects.toThrow('Entry not found');
    });
  });
});
