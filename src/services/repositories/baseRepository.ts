import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { logger } from '../../config/logger';

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      const saved = await document.save();
      
      logger.info(`${this.model.modelName} created`, { 
        id: saved._id,
        model: this.model.modelName 
      });
      
      return saved;
    } catch (error) {
      logger.error(`Failed to create ${this.model.modelName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data 
      });
      throw error;
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      logger.error(`Failed to find ${this.model.modelName} by ID`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
      throw error;
    }
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOne(filter).exec();
    } catch (error) {
      logger.error(`Failed to find ${this.model.modelName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filter 
      });
      throw error;
    }
  }

  async findMany(
    filter: FilterQuery<T> = {},
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    try {
      const { page, limit, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.model
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(filter)
      ]);

      const pages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error(`Failed to find ${this.model.modelName} with pagination`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
        options 
      });
      throw error;
    }
  }

  async updateById(
    id: string, 
    update: UpdateQuery<T>, 
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    try {
      const updated = await this.model.findByIdAndUpdate(id, update, options).exec();
      
      if (updated) {
        logger.info(`${this.model.modelName} updated`, { 
          id,
          model: this.model.modelName 
        });
      }
      
      return updated;
    } catch (error) {
      logger.error(`Failed to update ${this.model.modelName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        update 
      });
      throw error;
    }
  }

  async deleteById(id: string): Promise<T | null> {
    try {
      const deleted = await this.model.findByIdAndDelete(id).exec();
      
      if (deleted) {
        logger.info(`${this.model.modelName} deleted`, { 
          id,
          model: this.model.modelName 
        });
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete ${this.model.modelName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
      throw error;
    }
  }

  async find(
    filter: FilterQuery<T> = {},
    projection?: any,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      return await this.model.find(filter, projection, options).exec();
    } catch (error) {
      logger.error(`Failed to find ${this.model.modelName} documents`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filter 
      });
      throw error;
    }
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: any = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await this.model.updateOne(filter, update, options).exec();
      
      logger.info(`${this.model.modelName} updateOne completed`, { 
        modifiedCount: result.modifiedCount,
        model: this.model.modelName 
      });
      
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      logger.error(`Failed to updateOne ${this.model.modelName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
        update 
      });
      throw error;
    }
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: any = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await this.model.updateMany(filter, update, options).exec();
      
      logger.info(`${this.model.modelName} updateMany completed`, { 
        modifiedCount: result.modifiedCount,
        model: this.model.modelName 
      });
      
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      logger.error(`Failed to updateMany ${this.model.modelName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filter,
        update 
      });
      throw error;
    }
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const count = await this.model.countDocuments(filter);
      return count > 0;
    } catch (error) {
      logger.error(`Failed to check ${this.model.modelName} existence`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filter 
      });
      throw error;
    }
  }
}
