import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError } from '../utils/errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { CacheService } from '../cache/cache.service';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(email: string, pass: string): Promise<{ user: any, accessToken: string, refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const refreshToken = uuidv4();
    
    // Store refreshToken in Redis with 7 days expiry
    await CacheService.set(`refreshToken:${user.id}:${refreshToken}`, true, 7 * 24 * 60 * 60);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await CacheService.delete(`refreshToken:${userId}:${refreshToken}`);
  }

  async refreshTokens(userId: string, oldRefreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    const key = `refreshToken:${userId}:${oldRefreshToken}`;
    const isValid = await CacheService.get(key);
    
    if (!isValid) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Delete old refresh token
    await CacheService.delete(key);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
    const newRefreshToken = uuidv4();

    await CacheService.set(`refreshToken:${user.id}:${newRefreshToken}`, true, 7 * 24 * 60 * 60);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
