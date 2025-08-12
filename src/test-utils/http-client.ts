/**
 * HTTP client utility for testing
 * Provides convenient methods for making API requests
 *
 * Needs an API KEY and auth: { useAPIKey: true, } on Users
 */

import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface RequestOptions {
  headers?: Record<string, string>
  body?: any
}

interface ApiResponse<T = any> {
  data: T
  status: number
  ok: boolean
  error?: string
}

class HttpClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = 'http://localhost:3000', apiKey?: string) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      this.defaultHeaders['Authorization'] = `users API-Key ${apiKey}`
    }
  }

  async get<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, options)
  }

  async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, { ...options, body })
  }

  async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, { ...options, body })
  }

  async patch<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, { ...options, body })
  }

  async delete<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, options)
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
    }

    if (options?.body && method !== 'GET') {
      fetchOptions.body =
        typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
    }

    try {
      console.log(`[HTTP ${method}] ${url}`)

      const response = await fetch(url, fetchOptions)
      const text = await response.text()

      let data: T
      try {
        data = JSON.parse(text)
      } catch {
        data = text as any
      }

      const result: ApiResponse<T> = {
        data,
        status: response.status,
        ok: response.ok,
      }

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`
        console.error(`[HTTP Error] ${result.error}`)
      }

      return result
    } catch (error: any) {
      console.error(`[HTTP Error] ${error.message}`)
      return {
        data: null as any,
        status: 0,
        ok: false,
        error: error.message,
      }
    }
  }
}

// Export a singleton instance with API key
export const apiClient = new HttpClient('http://localhost:3000', process.env.SERVICE_API_KEY)

// Also export the class for custom instances
export { HttpClient }

// Convenience functions for common operations
export async function getActivity(id: number | string, depth: number = 0) {
  return apiClient.get(`/api/activities/${id}?depth=${depth}`)
}

export async function getDocument(id: number | string) {
  return apiClient.get(`/api/documents/${id}`)
}

export async function cloneDocument(sourceId: number | string, targetOrgId: number) {
  return apiClient.post(`/api/documents/test-clone/${sourceId}`, {
    targetOrganisationId: targetOrgId,
  })
}

export async function testTransaction(
  activityId: number | string,
  targetOrgId: number,
  shouldFail: boolean = true,
) {
  return apiClient.post(`/api/activities/test-transaction/${activityId}`, {
    targetOrganisationId: targetOrgId,
    shouldFail,
  })
}

export async function findActivitiesWithFiles(limit: number = 10) {
  const response = await apiClient.get(`/api/activities?limit=${limit}&depth=1`)
  if (response.ok && response.data.docs) {
    return response.data.docs.filter((activity: any) => activity.files && activity.files.length > 0)
  }
  return []
}

export async function getLatestDocuments(limit: number = 5, orgId?: number) {
  let query = `/api/documents?limit=${limit}&sort=-createdAt`
  if (orgId) {
    query += `&where[organisation][equals]=${orgId}`
  }
  return apiClient.get(query)
}
