import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Il file .env vive nella root del monorepo; in fallback quello locale.
config({ path: ['.env', '../../.env'] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
