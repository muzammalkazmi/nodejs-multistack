import { PrismaClient, User, Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  private db: PrismaClient;

  constructor() {
    super();
    this.db = prisma;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findAll(skip: number = 0, take: number = 10): Promise<User[]> {
    return this.db.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.delete({
      where: { id },
    });
  }
}
