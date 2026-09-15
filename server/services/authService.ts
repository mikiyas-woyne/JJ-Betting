import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, Wallet } from '../../src/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'jj-betting-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface UserWithHash extends User {
  passwordHash: string;
}

class AuthService {
  private users: Map<string, UserWithHash> = new Map();
  private wallets: Map<string, Wallet> = new Map();

  constructor() {
    this.seedInitialUsers();
  }

  private seedInitialUsers() {
    // Synchronously hash default passwords for seed accounts
    const salt = bcrypt.genSaltSync(10);
    
    // Seed Customer Account
    const customerId = 'usr_licensed_01';
    const customerUser: UserWithHash = {
      id: customerId,
      email: 'mikiyaswoyne@gmail.com',
      displayName: 'Mikiyas W.',
      role: 'customer',
      kycStatus: 'tier1_verified',
      dailyDepositLimit: 50000,
      singleBetLimit: 10000,
      selfExclusionUntil: null,
      createdAt: new Date('2025-01-10').toISOString(),
      passwordHash: bcrypt.hashSync('password123', salt)
    };
    this.users.set(customerId, customerUser);
    this.wallets.set(customerId, {
      userId: customerId,
      currency: 'ETB',
      availableBalance: 2450.00,
      lockedBalance: 0,
      totalDeposited: 5000.00,
      totalWithdrawn: 1500.00,
      updatedAt: new Date().toISOString()
    });

    // Seed Admin Account
    const adminId = 'usr_admin_01';
    const adminUser: UserWithHash = {
      id: adminId,
      email: 'admin@jjbetting.com',
      displayName: 'System Admin',
      role: 'admin',
      kycStatus: 'fully_verified',
      dailyDepositLimit: 1000000,
      singleBetLimit: 500000,
      selfExclusionUntil: null,
      createdAt: new Date('2025-01-01').toISOString(),
      passwordHash: bcrypt.hashSync('admin123', salt)
    };
    this.users.set(adminId, adminUser);
    this.wallets.set(adminId, {
      userId: adminId,
      currency: 'ETB',
      availableBalance: 100000.00,
      lockedBalance: 0,
      totalDeposited: 100000.00,
      totalWithdrawn: 0,
      updatedAt: new Date().toISOString()
    });
  }

  public sanitizeUser(user: UserWithHash): User {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  public generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  public verifyToken(token: string): { id: string; email: string; role: UserRole } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
      return decoded;
    } catch {
      try {
        const decodedFb: any = jwt.decode(token);
        if (decodedFb && (decodedFb.aud === 'jj-book-store' || decodedFb.aud === 'hale-bucksaw-498sv' || (decodedFb.iss && decodedFb.iss.includes('securetoken.google.com')))) {
          const email = (decodedFb.email || '').toLowerCase();
          const uid = decodedFb.sub || decodedFb.user_id;
          if (email) {
            let u = this.getUserByEmail(email);
            if (!u) {
              const role: UserRole = (email === 'admin@jjbetting.com' || email.includes('admin')) ? 'admin' : 'customer';
              const created = this.getUserById(uid);
              if (created) return { id: created.id, email: created.email, role: created.role };
              return { id: uid, email, role };
            }
            return { id: u.id, email: u.email, role: u.role };
          }
        }
      } catch {
        // invalid token
      }
      return null;
    }
  }

  public async signup(params: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string; wallet: Wallet }> {
    const emailNorm = params.email.trim().toLowerCase();
    
    // Check if email already exists
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailNorm) {
        throw new Error('An account with this email address already exists.');
      }
    }

    if (params.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);

    const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    // Security: Only strictly designated admin email can be admin; client role selection is rejected
    const isDesignatedAdmin = emailNorm === 'admin@jjbetting.com';
    const role: UserRole = isDesignatedAdmin ? 'admin' : 'customer';

    const newUser: UserWithHash = {
      id: userId,
      email: emailNorm,
      displayName: params.displayName.trim() || emailNorm.split('@')[0],
      role,
      kycStatus: role === 'admin' ? 'fully_verified' : 'tier1_verified',
      dailyDepositLimit: 50000,
      singleBetLimit: 10000,
      selfExclusionUntil: null,
      createdAt: new Date().toISOString(),
      passwordHash
    };

    const newWallet: Wallet = {
      userId,
      currency: 'ETB',
      availableBalance: role === 'admin' ? 50000.00 : 1000.00, // Welcome signup bonus for testing
      lockedBalance: 0,
      totalDeposited: role === 'admin' ? 50000.00 : 1000.00,
      totalWithdrawn: 0,
      updatedAt: new Date().toISOString()
    };

    this.users.set(userId, newUser);
    this.wallets.set(userId, newWallet);

    const user = this.sanitizeUser(newUser);
    const token = this.generateToken(user);

    return { user, token, wallet: newWallet };
  }

  public syncFirebaseUser(params: {
    uid: string;
    email: string;
    displayName?: string;
  }): { user: User; token: string; wallet: Wallet } {
    const emailNorm = params.email.trim().toLowerCase();
    const isDesignatedAdmin = emailNorm === 'admin@jjbetting.com';
    const defaultRole: UserRole = isDesignatedAdmin ? 'admin' : 'customer';

    let existing = this.getUserById(params.uid);
    if (!existing) {
      existing = this.getUserByEmail(emailNorm);
    }

    if (existing) {
      const preservedRole: UserRole = isDesignatedAdmin ? 'admin' : existing.role;
      const updatedUser: UserWithHash = {
        ...existing,
        id: params.uid,
        displayName: params.displayName?.trim() || existing.displayName,
        role: preservedRole,
        passwordHash: (existing as any).passwordHash || ''
      };
      this.users.set(params.uid, updatedUser);

      // Ensure wallet exists for this UID
      const existingWallet = this.getWallet(existing.id);
      const wallet: Wallet = {
        ...existingWallet,
        userId: params.uid,
        updatedAt: new Date().toISOString()
      };
      this.wallets.set(params.uid, wallet);

      const user = this.sanitizeUser(updatedUser);
      const token = this.generateToken(user);
      return { user, token, wallet };
    }

    // Provision new user from Firebase Auth
    const newUser: UserWithHash = {
      id: params.uid,
      email: emailNorm,
      displayName: params.displayName?.trim() || emailNorm.split('@')[0],
      role: defaultRole,
      kycStatus: defaultRole === 'admin' ? 'fully_verified' : 'tier1_verified',
      dailyDepositLimit: 50000,
      singleBetLimit: 10000,
      selfExclusionUntil: null,
      createdAt: new Date().toISOString(),
      passwordHash: ''
    };

    const newWallet: Wallet = {
      userId: params.uid,
      currency: 'ETB',
      availableBalance: defaultRole === 'admin' ? 50000.00 : 1000.00,
      lockedBalance: 0,
      totalDeposited: defaultRole === 'admin' ? 50000.00 : 1000.00,
      totalWithdrawn: 0,
      updatedAt: new Date().toISOString()
    };

    this.users.set(params.uid, newUser);
    this.wallets.set(params.uid, newWallet);

    const user = this.sanitizeUser(newUser);
    const token = this.generateToken(user);

    return { user, token, wallet: newWallet };
  }

  public async login(params: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string; wallet: Wallet }> {
    const emailNorm = params.email.trim().toLowerCase();

    let foundUser: UserWithHash | undefined;
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailNorm) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      throw new Error('Invalid email address or password.');
    }

    const isMatch = await bcrypt.compare(params.password, foundUser.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email address or password.');
    }

    const user = this.sanitizeUser(foundUser);
    const token = this.generateToken(user);
    const wallet = this.getWallet(user.id);

    return { user, token, wallet };
  }

  public async googleAuth(params: {
    email: string;
    displayName?: string;
    googleId?: string;
  }): Promise<{ user: User; token: string; wallet: Wallet }> {
    const emailNorm = params.email.trim().toLowerCase();
    const uid = params.googleId || `goog_${Date.now()}`;
    return this.syncFirebaseUser({
      uid,
      email: emailNorm,
      displayName: params.displayName
    });
  }

  public getUserById(id: string): User | null {
    const u = this.users.get(id);
    return u ? this.sanitizeUser(u) : null;
  }

  public getUserByEmail(email: string): User | null {
    const emailNorm = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailNorm) {
        return this.sanitizeUser(u);
      }
    }
    return null;
  }

  public getWallet(userId: string): Wallet {
    let w = this.wallets.get(userId);
    if (!w) {
      w = {
        userId,
        currency: 'ETB',
        availableBalance: 1000.00,
        lockedBalance: 0,
        totalDeposited: 1000.00,
        totalWithdrawn: 0,
        updatedAt: new Date().toISOString()
      };
      this.wallets.set(userId, w);
    }
    return w;
  }

  public updateWallet(userId: string, updated: Wallet): void {
    this.wallets.set(userId, updated);
  }

  public updateUser(userId: string, updatedUser: User): void {
    const existing = this.users.get(userId);
    if (existing) {
      this.users.set(userId, {
        ...existing,
        ...updatedUser
      });
    }
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values()).map(u => this.sanitizeUser(u));
  }
}

export const authService = new AuthService();
