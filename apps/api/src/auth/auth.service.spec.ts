import { ConflictException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogService } from '../audit-log/audit-log.service.js';
import { UserRole } from '../generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { RateLimiterService } from './rate-limiter.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaMock: any;
  let auditLogMock: any;
  let passwordService: PasswordService;
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        updateMany: vi.fn(),
      },
      tenant: {
        findUnique: vi.fn(),
      },
    };

    auditLogMock = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    passwordService = new PasswordService();
    rateLimiter = new RateLimiterService();

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      passwordService,
      rateLimiter,
      auditLogMock as unknown as AuditLogService,
    );
  });

  describe('register', () => {
    it('creates new user as TENANT_USER and creates a session', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const fakeUser = {
        id: 'u1',
        email: 'user@opentax.it',
        name: 'User',
        role: UserRole.TENANT_USER,
        memberships: [],
      };
      prismaMock.user.create.mockResolvedValue(fakeUser);

      const fakeSession = {
        id: 's1',
        tokenHash: 'somehash',
        userId: 'u1',
        activeTenantId: null,
        expiresAt: new Date(Date.now() + 100000),
      };
      prismaMock.session.create.mockResolvedValue(fakeSession);

      const res = await authService.register({
        email: 'User@OpenTax.it',
        password: 'password123',
        name: 'User',
      });

      expect(res.user.email).toBe('user@opentax.it');
      expect(res.user.role).toBe(UserRole.TENANT_USER);
      expect(res.token).toHaveLength(64);
      expect(auditLogMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_REGISTER', userId: 'u1' }),
      );
    });

    it('rejects duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          email: 'user@opentax.it',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on concurrent registration with same email (P2002)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        authService.register({
          email: 'dup@opentax.it',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('logs in with correct password and returns session', async () => {
      const password = 'mypassword123';
      const passwordHash = await passwordService.hash(password);

      const user = {
        id: 'u1',
        email: 'user@test.it',
        passwordHash,
        role: UserRole.TENANT_USER,
        tenantId: 't1',
        memberships: [
          {
            id: 'm1',
            tenantId: 't1',
            role: UserRole.TENANT_USER,
            tenant: { id: 't1', name: 'Tenant 1' },
          },
        ],
      };
      prismaMock.user.findUnique.mockResolvedValue(user);

      const fakeSession = {
        id: 's1',
        tokenHash: 'hash',
        userId: 'u1',
        activeTenantId: 't1',
        expiresAt: new Date(Date.now() + 100000),
      };
      prismaMock.session.create.mockResolvedValue(fakeSession);

      const res = await authService.login({
        email: 'user@test.it',
        password,
      });

      expect(res.user.id).toBe('u1');
      expect(res.user.activeTenantId).toBe('t1');
      expect(res.token).toHaveLength(64);
      expect(auditLogMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGIN_SUCCESS', userId: 'u1' }),
      );
    });

    it('rejects invalid password and logs failure', async () => {
      const passwordHash = await passwordService.hash('correct_password');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.it',
        passwordHash,
      });

      await expect(
        authService.login({
          email: 'user@test.it',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditLogMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGIN_FAILED' }),
      );
    });

    it('enforces rate limiting on repeated failures', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Attempt 5 failures
      for (let i = 0; i < 5; i++) {
        await expect(
          authService.login({
            email: 'brute@test.it',
            password: 'bad',
          }, '127.0.0.1'),
        ).rejects.toThrow(UnauthorizedException);
      }

      // 6th attempt must be rate limited with 429
      await expect(
        authService.login({
          email: 'brute@test.it',
          password: 'bad',
        }, '127.0.0.1'),
      ).rejects.toThrow(HttpException);
    });

    it('isolates rate limiting by client IP so one client cannot lock out another', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const attackerIp = '198.51.100.5';
      const legitimateIp = '203.0.113.10';

      // Attacker attempts 5 failed logins from attackerIp
      for (let i = 0; i < 5; i++) {
        await expect(
          authService.login(
            { email: 'victim@test.it', password: 'bad' },
            attackerIp,
          ),
        ).rejects.toThrow(UnauthorizedException);
      }

      // Attacker is now rate limited (429)
      await expect(
        authService.login(
          { email: 'victim@test.it', password: 'bad' },
          attackerIp,
        ),
      ).rejects.toThrow(HttpException);

      // Legitimate user from a different IP is NOT blocked
      const user = {
        id: 'u1',
        email: 'victim@test.it',
        passwordHash: await passwordService.hash('correct_password'),
        role: UserRole.TENANT_USER,
        memberships: [],
      };
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.session.create.mockResolvedValue({
        id: 's2',
        userId: 'u1',
        activeTenantId: null,
        expiresAt: new Date(),
      });

      const res = await authService.login(
        { email: 'victim@test.it', password: 'correct_password' },
        legitimateIp,
      );
      expect(res.user.email).toBe('victim@test.it');
    });
  });

  describe('selectTenant', () => {
    it('switches active tenant if user is a member', async () => {
      const user = {
        id: 'u1',
        email: 'user@test.it',
        role: UserRole.TENANT_USER,
        memberships: [
          {
            id: 'm1',
            tenantId: 't1',
            role: UserRole.TENANT_USER,
            tenant: { id: 't1', name: 'Tenant 1' },
          },
          {
            id: 'm2',
            tenantId: 't2',
            role: UserRole.TENANT_USER,
            tenant: { id: 't2', name: 'Tenant 2' },
          },
        ],
      };
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.tenant.findUnique.mockResolvedValue({ id: 't2', name: 'Tenant 2' });
      prismaMock.session.updateMany.mockResolvedValue({ count: 1 });

      const res = await authService.selectTenant('u1', 'validtoken', 't2');
      expect(res.activeTenantId).toBe('t2');
      expect(auditLogMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_SELECT_TENANT', tenantId: 't2' }),
      );
    });

    it('rejects switching to a tenant the user is not a member of', async () => {
      const user = {
        id: 'u1',
        email: 'user@test.it',
        role: UserRole.TENANT_USER,
        memberships: [
          {
            id: 'm1',
            tenantId: 't1',
            role: UserRole.TENANT_USER,
            tenant: { id: 't1', name: 'Tenant 1' },
          },
        ],
      };
      prismaMock.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.selectTenant('u1', 'validtoken', 'unauthorized_tenant'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateSession', () => {
    it('returns null if session is expired', async () => {
      prismaMock.session.findUnique.mockResolvedValue({
        id: 's1',
        tokenHash: 'h',
        expiresAt: new Date(Date.now() - 1000), // in the past
      });

      const res = await authService.validateSession('token');
      expect(res).toBeNull();
    });

    it('returns user and session if session is active and user is a member of the active tenant', async () => {
      const now = new Date();
      const fakeSession = {
        id: 's1',
        userId: 'u1',
        activeTenantId: 't1',
        expiresAt: new Date(now.getTime() + 100000),
        user: {
          id: 'u1',
          email: 'user@test.it',
          role: UserRole.TENANT_USER,
          memberships: [
            {
              id: 'm1',
              tenantId: 't1',
              role: UserRole.TENANT_USER,
              tenant: { id: 't1', name: 'T1' },
            },
          ],
        },
      };
      prismaMock.session.findUnique.mockResolvedValue(fakeSession);

      const res = await authService.validateSession('token');
      expect(res).not.toBeNull();
      expect(res?.user.id).toBe('u1');
      expect(res?.session.activeTenantId).toBe('t1');
    });

    it('resets activeTenantId to null if user is not a member of the active tenant', async () => {
      const now = new Date();
      const fakeSession = {
        id: 's1',
        userId: 'u1',
        activeTenantId: 'unauthorized_tenant',
        expiresAt: new Date(now.getTime() + 100000),
        user: {
          id: 'u1',
          email: 'user@test.it',
          role: UserRole.TENANT_USER,
          memberships: [
            {
              id: 'm1',
              tenantId: 'other_tenant',
              role: UserRole.TENANT_USER,
              tenant: { id: 'other_tenant', name: 'Other' },
            },
          ],
        },
      };
      prismaMock.session.findUnique.mockResolvedValue(fakeSession);

      const res = await authService.validateSession('token');
      expect(res).not.toBeNull();
      expect(res?.user.id).toBe('u1');
      expect(res?.session.activeTenantId).toBeNull();
    });
  });
});
