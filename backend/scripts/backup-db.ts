#!/usr/bin/env npx ts-node
/**
 * Database backup script
 * Uses pg_dump to create a timestamped SQL dump.
 *
 * Run: npm run backup:db
 * Or:  npx ts-node scripts/backup-db.ts
 *
 * Backups go to DB_BACKUP_DIR (default: ./db-backups)
 * Retention: keeps last N backups (default: 7)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'shadowai';
const DB_USER = process.env.DB_USER || 'shadowai';
const DB_PASSWORD = process.env.DB_PASSWORD || 'shadowai_dev_password';
const DB_BACKUP_DIR = process.env.DB_BACKUP_DIR || path.join(__dirname, '..', 'db-backups');
const DB_BACKUP_RETENTION = parseInt(process.env.DB_BACKUP_RETENTION || '7', 10);
const DB_BACKUP_USE_DOCKER = process.env.DB_BACKUP_USE_DOCKER === 'true';
const DB_DOCKER_CONTAINER = process.env.DB_DOCKER_CONTAINER || 'shadow-ai-postgres';

function ensureBackupDir(): string {
  if (!fs.existsSync(DB_BACKUP_DIR)) {
    fs.mkdirSync(DB_BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${DB_BACKUP_DIR}`);
  }
  return DB_BACKUP_DIR;
}

function runBackupLocal(filepath: string): void {
  const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
  execSync(
    `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl -f "${filepath}"`,
    { env, stdio: ['inherit', 'inherit', 'pipe'] } // suppress stderr so fallback output isn't confusing
  );
}

function runBackupDocker(filepath: string): void {
  const absPath = path.resolve(filepath);
  const containerPath = `/tmp/backup-${path.basename(filepath)}`;
  execSync(
    `docker exec ${DB_DOCKER_CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl -f "${containerPath}"`,
    { stdio: 'inherit' }
  );
  execSync(`docker cp ${DB_DOCKER_CONTAINER}:${containerPath} "${absPath}"`, { stdio: 'inherit' });
  execSync(`docker exec ${DB_DOCKER_CONTAINER} rm -f "${containerPath}"`, { stdio: 'pipe' });
}

function runBackup(): string {
  const dir = ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${DB_NAME}-${timestamp}.sql`;
  const filepath = path.join(dir, filename);

  console.log(`Backing up ${DB_NAME} to ${filename}...`);

  const useDocker = DB_BACKUP_USE_DOCKER;
  if (useDocker) {
    runBackupDocker(filepath);
  } else {
    try {
      runBackupLocal(filepath);
    } catch {
      console.log('Local pg_dump failed (e.g. version mismatch), trying Docker...');
      runBackupDocker(filepath);
    }
  }

  const stats = fs.statSync(filepath);
  console.log(`✅ Backup complete: ${filepath} (${(stats.size / 1024).toFixed(1)} KB)`);
  return filepath;
}

function pruneOldBackups(): void {
  const dir = DB_BACKUP_DIR;
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith('backup-') && f.endsWith('.sql'))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length <= DB_BACKUP_RETENTION) return;

  const toRemove = files.slice(DB_BACKUP_RETENTION);
  for (const f of toRemove) {
    fs.unlinkSync(f.path);
    console.log(`Pruned old backup: ${f.name}`);
  }
}

function main() {
  try {
    runBackup();
    pruneOldBackups();
    process.exit(0);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

main();
