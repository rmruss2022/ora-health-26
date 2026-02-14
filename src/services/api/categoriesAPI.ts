import { apiClient } from './apiClient';
import type { PostCategory } from '../../types';

export class CategoriesAPI {
  async getCategories(): Promise<PostCategory[]> {
    const response = await apiClient.get<{ categories: PostCategory[] }>('/community/categories');
    return response.categories;
  }
}

export const categoriesAPI = new CategoriesAPI();
