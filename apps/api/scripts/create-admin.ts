/**
 * CLI command to create a PLATFORM_ADMIN user or promote an existing user.
 *
 * Usage:
 *   node scripts/create-admin.ts <email> [password] [name]
 *   pnpm admin:create <email> [password] [name]
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { UserRole } from '../src/generated/prisma/enums.js';
import { PasswordService } from '../src/auth/password.service.js';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: [resolve(here, '../.env'), resolve(here, '../../../.env')], quiet: true });

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const password = args[1]?.trim();
  const name = args[2]?.trim();

  if (!email || !email.includes('@')) {
    console.error('Uso: node scripts/create-admin.ts <email> [password] [nome]');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const passwordService = new PasswordService();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const data: { role: UserRole; passwordHash?: string; name?: string } = {
        role: UserRole.PLATFORM_ADMIN,
      };
      if (password) {
        data.passwordHash = await passwordService.hash(password);
      }
      if (name) {
        data.name = name;
      }
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data,
      });
      console.log(`Utente ${updated.email} (${updated.id}) promosso a PLATFORM_ADMIN con successo.`);
    } else {
      if (!password || password.length < 8) {
        console.error('Per creare un nuovo utente amministratore è richiesta una password di almeno 8 caratteri.');
        process.exit(1);
      }

      const passwordHash = await passwordService.hash(password);
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name ?? null,
          role: UserRole.PLATFORM_ADMIN,
        },
      });
      console.log(`Nuovo amministratore ${created.email} (${created.id}) creato con successo.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Errore durante la creazione dell\'amministratore:', err);
  process.exit(1);
});
