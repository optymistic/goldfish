class ApiClient {
  private baseUrl = ""

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login or refresh page to show auth guard
        window.location.reload()
        return
      }
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async getGuides() {
    return this.request("/guides")
  }

  async getGuide(id: string) {
    return this.request(`/guides/${id}`)
  }

  async createGuide(guideData: any) {
    return this.request("/guides", {
      method: "POST",
      body: JSON.stringify(guideData),
    })
  }

  async updateGuide(id: string, guideData: any) {
    return this.request(`/guides/${id}`, {
      method: "PUT",
      body: JSON.stringify(guideData),
    })
  }

  async deleteGuide(id: string) {
    return this.request(`/guides/${id}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient()
