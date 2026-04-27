/**
 * API Service - Centralized API request handling with error logging
 */

const API_BASE_URL = "http://localhost:8000/api";

export const apiService = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    const fetchOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`[API] ${options.method || "GET"} ${url}`, {
      body: fetchOptions.body ? JSON.parse(fetchOptions.body) : undefined,
    });

    try {
      const response = await fetch(url, fetchOptions);

      // Log response status
      console.log(`[API] Response Status: ${response.status}`, {
        statusText: response.statusText,
        headers: {
          "content-type": response.headers.get("content-type"),
        },
      });

      // Try to parse response
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        console.error(`[API] Error Response:`, data);
        const error = new Error(
          data.detail ||
            JSON.stringify(data) ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
        error.status = response.status;
        error.response = data;
        throw error;
      }

      console.log(`[API] Success:`, data);
      return data;
    } catch (err) {
      console.error(`[API] Request failed:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },

  // Specific endpoints for this app
  getTickets() {
    return this.get("/tickets/");
  },

  createTicket(ticketData) {
    return this.post("/tickets/", ticketData);
  },

  updateTicket(ticketId, ticketData) {
    return this.patch(`/tickets/${ticketId}/`, ticketData);
  },

  getVehicles() {
    return this.get("/vehicles/");
  },

  getDrivers() {
    return this.get("/drivers/");
  },
};
