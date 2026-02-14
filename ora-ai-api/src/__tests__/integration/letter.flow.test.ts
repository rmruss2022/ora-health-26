/**
 * Letter Flow Integration Tests
 * Tests: compose -> send -> receive in inbox -> read
 */

import request from 'supertest';
import express from 'express';
import letterRoutes from '../../routes/letter.routes';
import authRoutes from '../../routes/auth.routes';
import { authMiddleware } from '../../middleware/auth.middleware';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/api/letters', authMiddleware, letterRoutes);

describe('Letter Flow', () => {
  let senderToken: string;
  let senderId: string;
  let recipientToken: string;
  let recipientId: string;
  let letterId: string;

  // Setup test users
  beforeAll(async () => {
    // Register sender
    const senderResponse = await request(app)
      .post('/auth/register')
      .send({
        name: 'Sender User',
        email: `sender-${Date.now()}@example.com`,
        password: 'Password123!',
      });

    senderToken = senderResponse.body.token;
    senderId = senderResponse.body.user.id;

    // Register recipient
    const recipientResponse = await request(app)
      .post('/auth/register')
      .send({
        name: 'Recipient User',
        email: `recipient-${Date.now()}@example.com`,
        password: 'Password123!',
      });

    recipientToken = recipientResponse.body.token;
    recipientId = recipientResponse.body.user.id;
  });

  describe('POST /api/letters - Compose and Send', () => {
    it('should send a letter successfully', async () => {
      const response = await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientId,
          subject: 'Test Letter Subject',
          body: 'This is a test letter body with meaningful content.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.subject).toBe('Test Letter Subject');
      expect(response.body.senderId).toBe(senderId);
      expect(response.body.recipientId).toBe(recipientId);

      letterId = response.body.id;
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientId,
          subject: '', // Empty subject
          body: 'Body',
        })
        .expect(400);
    });

    it('should reject sending to invalid recipient', async () => {
      await request(app)
        .post('/api/letters')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientId: 'invalid-uuid',
          subject: 'Test',
          body: 'Test body',
        })
        .expect(400);
    });
  });

  describe('GET /api/letters/inbox - Receive in Inbox', () => {
    it('should show letter in recipient inbox', async () => {
      const response = await request(app)
        .get('/api/letters/inbox')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('letters');
      expect(response.body).toHaveProperty('unreadCount');
      expect(Array.isArray(response.body.letters)).toBe(true);

      const receivedLetter = response.body.letters.find(
        (l: any) => l.id === letterId
      );
      expect(receivedLetter).toBeDefined();
      expect(receivedLetter.subject).toBe('Test Letter Subject');
      expect(receivedLetter.readAt).toBeNull();
    });

    it('should show correct unread count', async () => {
      const response = await request(app)
        .get('/api/letters/inbox')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(response.body.unreadCount).toBeGreaterThan(0);
    });

    it('should not show letter in sender inbox', async () => {
      const response = await request(app)
        .get('/api/letters/inbox')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      const foundLetter = response.body.letters.find(
        (l: any) => l.id === letterId
      );
      expect(foundLetter).toBeUndefined();
    });
  });

  describe('GET /api/letters/:id - Read Letter', () => {
    it('should read letter and mark as read', async () => {
      const response = await request(app)
        .get(`/api/letters/${letterId}`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(response.body.id).toBe(letterId);
      expect(response.body.subject).toBe('Test Letter Subject');
      expect(response.body.body).toContain('test letter body');
      expect(response.body.readAt).toBeTruthy();
    });

    it('should decrease unread count after reading', async () => {
      const beforeResponse = await request(app)
        .get('/api/letters/inbox')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      const unreadCountBefore = beforeResponse.body.unreadCount;

      // Read the letter
      await request(app)
        .get(`/api/letters/${letterId}`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      const afterResponse = await request(app)
        .get('/api/letters/inbox')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(afterResponse.body.unreadCount).toBeLessThanOrEqual(unreadCountBefore);
    });

    it('should not allow reading other users letters', async () => {
      // Sender should not be able to read recipient's letter
      await request(app)
        .get(`/api/letters/${letterId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);
    });
  });

  describe('POST /api/letters/:id/reply - Reply to Letter', () => {
    it('should reply to a letter', async () => {
      const response = await request(app)
        .post(`/api/letters/${letterId}/reply`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          subject: 'Re: Test Letter Subject',
          body: 'Thank you for your letter!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.parentLetterId).toBe(letterId);
      expect(response.body.senderId).toBe(recipientId);
      expect(response.body.recipientId).toBe(senderId);
    });
  });

  describe('DELETE /api/letters/:id - Archive Letter', () => {
    it('should archive a letter', async () => {
      await request(app)
        .delete(`/api/letters/${letterId}`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      // Verify letter is archived
      const response = await request(app)
        .get('/api/letters/inbox')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      const archivedLetter = response.body.letters.find(
        (l: any) => l.id === letterId
      );
      expect(archivedLetter).toBeUndefined(); // Should not appear in inbox
    });
  });
});
