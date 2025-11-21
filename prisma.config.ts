import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});
