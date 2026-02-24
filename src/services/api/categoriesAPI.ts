import { apiClient } from './apiClient';
import type { PostCategory } from '../../types';

export class CategoriesAPI {
  async getCategories(): Promise<PostCategory[]> {
    const response = await apiClient.get<any>('/community/categories');
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.categories)) return response.categories;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.categories)) return response.data.categories;
    return [];
  }
}

export const categoriesAPI = new CategoriesAPI();
