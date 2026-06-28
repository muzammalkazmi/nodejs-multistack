import { UserRepository } from '../repositories/user.repository';
import { CacheService } from '../cache/cache.service';
import { NotFoundError, ConflictError } from '../utils/errors';
import { User, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepository: UserRepository;
  private readonly CACHE_PREFIX = 'cache:/api/v1/users';

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(data: Prisma.UserCreateInput): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Invalidate users list cache
    await CacheService.deleteByPattern(`${this.CACHE_PREFIX}*`);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers(skip?: number, take?: number): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll(skip, take);
    return users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await this.userRepository.update(id, data);
    
    // Invalidate cache
    await CacheService.deleteByPattern(`${this.CACHE_PREFIX}*`);
    await CacheService.delete(`${this.CACHE_PREFIX}/${id}`);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.delete(id);
    
    // Invalidate cache
    await CacheService.deleteByPattern(`${this.CACHE_PREFIX}*`);
    await CacheService.delete(`${this.CACHE_PREFIX}/${id}`);
  }
}
