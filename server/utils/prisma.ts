import { resolve } from 'node:path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../../generated/prisma/client';

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error('DATABASE_URL не задан (см. .env.example)');

// Nuxt запускается из корня репозитория, путь в DATABASE_URL тоже от корня
const url = raw.startsWith('file:')
  ? `file:${resolve(process.cwd(), raw.slice(5)).replaceAll('\\', '/')}`
  : raw;

export const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
