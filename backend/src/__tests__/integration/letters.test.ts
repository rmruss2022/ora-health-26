import request from 'supertest';
import { app } from '../../index';
import { pool } from '../../db';

describe('Letters Flow Integration Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let letterId: string;
  let threadId: string;

  beforeAll(async () => {
    // Create two test users
    const user1 = await request(app)
      .post('/auth/register')
      .send({
        name: 'Letter User 1',
        email: `letteruser1${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

    const user2 = await request(app)
      .post('/auth/register')
      .send({
        name: 'Letter User 2',
        email: `letteruser2${Date.now()}@example.com`,
        password: 'TestPass123!',
      });

    user1Token = user1.body.accessToken;
    user2Token = user2.body.accessToken;
    user1Id = user1.body.user.id;
    user2Id = user2.body.user.id;
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM letters WHERE sender_id IN ($1, $2)', [user1Id, user2Id]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1Id, user2Id]);
    await pool.end();
  });

  describe('POST /letters - Send Letter', () => {
    it('should send a letter to another user', async () => {
      const response = await request(app)
        .post('/letters')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipient_id: user2Id,
          subject: 'Test Letter Subject',
          body: 'This is a test letter body with some meaningful content.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('letter');
      expect(response.body.letter).toHaveProperty('id');
      expect(response.body.letter.subject).toBe('Test Letter Subject');
      expect(response.body.letter.sender_id).toBe(user1Id);
      expect(response.body.letter.recipient_id).toBe(user2Id);

      letterId = response.body.letter.id;
      threadId = response.body.letter.thread_id;
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/letters')
        .send({
          recipient_id: user2Id,
          subject: 'Unauthorized Letter',
          body: 'This should fail.',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/letters')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipient_id: user2Id,
          // Missing subject and body
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject letter to non-existent user', async () => {
      const response = await request(app)
        .post('/letters')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipient_id: '00000000-0000-0000-0000-000000000000',
          subject: 'Invalid Recipient',
          body: 'This should fail.',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /letters/inbox - Get Inbox', () => {
    it('should retrieve inbox with unread letter', async () => {
      const response = await request(app)
        .get('/letters/inbox')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('letters');
      expect(response.body).toHaveProperty('unread_count');
      expect(response.body.letters).toBeInstanceOf(Array);
      expect(response.body.letters.length).toBeGreaterThan(0);
      expect(response.body.unread_count).toBeGreaterThan(0);

      const receivedLetter = response.body.letters.find((l: any) => l.id === letterId);
      expect(receivedLetter).toBeDefined();
      expect(receivedLetter.is_read).toBe(false);
    });

    it('should paginate inbox results', async () => {
      const response = await request(app)
        .get('/letters/inbox?page=1&limit=5')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.letters.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/letters/inbox')
        .expect(401);
    });
  });

  describe('GET /letters/:id - Get Single Letter', () => {
    it('should retrieve letter by ID', async () => {
      const response = await request(app)
        .get(`/letters/${letterId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('letter');
      expect(response.body.letter.id).toBe(letterId);
      expect(response.body.letter.subject).toBe('Test Letter Subject');
      expect(response.body.letter.sender).toHaveProperty('name');
    });

    it('should reject access to letter not addressed to user', async () => {
      // User 1 trying to read a letter they sent (should still work for sent items)
      // But a third party should not be able to access
      const user3 = await request(app)
        .post('/auth/register')
        .send({
          name: 'Unauthorized User',
          email: `unauthorized${Date.now()}@example.com`,
          password: 'TestPass123!',
        });

      await request(app)
        .get(`/letters/${letterId}`)
        .set('Authorization', `Bearer ${user3.body.accessToken}`)
        .expect(403);

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [user3.body.user.id]);
    });
  });

  describe('PATCH /letters/:id/read - Mark as Read', () => {
    it('should mark letter as read', async () => {
      const response = await request(app)
        .patch(`/letters/${letterId}/read`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('letter');
      expect(response.body.letter.read_at).not.toBeNull();

      // Verify inbox unread count decreased
      const inbox = await request(app)
        .get('/letters/inbox')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(inbox.body.unread_count).toBe(0);
    });
  });

  describe('POST /letters/:id/reply - Reply to Letter', () => {
    it('should reply to letter in thread', async () => {
      const response = await request(app)
        .post(`/letters/${letterId}/reply`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          body: 'This is a reply to your letter. Thank you for writing!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('letter');
      expect(response.body.letter.replied_to_id).toBe(letterId);
      expect(response.body.letter.thread_id).toBe(threadId);
      expect(response.body.letter.sender_id).toBe(user2Id);
      expect(response.body.letter.recipient_id).toBe(user1Id);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/letters/${letterId}/reply`)
        .send({ body: 'Unauthorized reply' })
        .expect(401);
    });
  });

  describe('GET /letters/thread/:threadId - Get Thread', () => {
    it('should retrieve full conversation thread', async () => {
      const response = await request(app)
        .get(`/letters/thread/${threadId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('letters');
      expect(response.body.letters).toBeInstanceOf(Array);
      expect(response.body.letters.length).toBeGreaterThanOrEqual(2); // Original + reply

      // Verify chronological order
      const letters = response.body.letters;
      for (let i = 1; i < letters.length; i++) {
        const prev = new Date(letters[i - 1].sent_at);
        const curr = new Date(letters[i].sent_at);
        expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
      }
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/letters/thread/${threadId}`)
        .expect(401);
    });
  });

  describe('DELETE /letters/:id - Delete Letter', () => {
    it('should soft delete letter', async () => {
      const response = await request(app)
        .delete(`/letters/${letterId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Letter should not appear in inbox anymore
      const inbox = await request(app)
        .get('/letters/inbox')
        .set('Authorization', `Bearer ${user2Token}`);

      const deletedLetter = inbox.body.letters.find((l: any) => l.id === letterId);
      expect(deletedLetter).toBeUndefined();
    });
  });
});
