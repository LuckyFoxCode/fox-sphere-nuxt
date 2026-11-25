import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../../generated/prisma/client';

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error('DATABASE_URL не задан (см. .env.example)');

// Бот запускается из bot/, а в DATABASE_URL путь относительно корня репозитория
const root = resolve(fileURLToPath(import.meta.url), '../../..');
// Слэши прямые: так путь Windows (C:/Dev/...) читается libsql без экранирования
const url = raw.startsWith('file:')
  ? `file:${resolve(root, raw.slice(5)).replaceAll('\\', '/')}`
  : raw;

export const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });

// WAL: бот и Nuxt — два процесса на одном файле SQLite
await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL');
