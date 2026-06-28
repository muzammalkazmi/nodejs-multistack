export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  abstract create(data: CreateDTO): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(skip?: number, take?: number): Promise<T[]>;
  abstract update(id: string, data: UpdateDTO): Promise<T>;
  abstract delete(id: string): Promise<T>;
}
