import axios from 'axios';

// Printify API service
export interface PrintifyConfig {
  apiKey: string;
  shopId: string;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  variants: PrintifyVariant[];
}

export interface PrintifyVariant {
  id: string;
  title: string;
  price: number;
  options: Record<string, string>;
}

export interface PrintifyOrderItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  print_areas: {
    [key: string]: {
      src: string;
    };
  };
}

export interface PrintifyOrder {
  line_items: PrintifyOrderItem[];
  shipping_method: number;
  shipping_address: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address1: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
}

class PrintifyService {
  private selectedShopId: string = '';
  private shops: any[] = [];
  private isInitialized: boolean = false;
  private isConfigured: boolean = false;

  constructor() {
    // Automatically try to initialize
    this.initialize();
  }

  async initialize() {
    try {
      // Check if API is configured server-side
      const response = await fetch('/api/printify/config');
      const data = await response.json();
      
      this.isConfigured = data.isConfigured;
      
      if (this.isConfigured) {
        this.isInitialized = true;
        // Fetch available shops
        await this.fetchShops();
      }
    } catch (error) {
      console.error("Error initializing Printify service:", error);
    }
  }

  isReady() {
    return this.isInitialized && this.isConfigured && this.shops.length > 0;
  }

  getSelectedShopId() {
    return this.selectedShopId;
  }

  async fetchShops() {
    try {
      const response = await fetch('/api/printify/shops');
      this.shops = await response.json();
      
      // Select the first shop by default
      if (this.shops.length > 0) {
        this.selectedShopId = this.shops[0].id.toString();
      }
      
      return this.shops;
    } catch (error) {
      console.error("Error fetching shops:", error);
      return [];
    }
  }

  getShops() {
    return this.shops;
  }

  setShop(shopId: string) {
    this.selectedShopId = shopId;
  }

  private checkInitialization() {
    if (!this.isInitialized) {
      throw new Error('Printify service is not initialized.');
    }
    
    if (!this.selectedShopId) {
      throw new Error('No Printify shop selected.');
    }
  }

  // Get available print providers
  async getPrintProviders() {
    this.checkInitialization();
    try {
      const response = await fetch(`/api/printify/shops/${this.selectedShopId}/print-providers`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching print providers:', error);
      throw error;
    }
  }

  // Get available product blueprints (catalog)
  async getBlueprints() {
    this.checkInitialization();
    try {
      const response = await fetch('/api/printify/blueprints');
      return await response.json();
    } catch (error) {
      console.error('Error fetching blueprints:', error);
      throw error;
    }
  }

  // Create a product in the shop
  async createProduct(productData: any) {
    this.checkInitialization();
    try {
      const response = await fetch('/api/printify/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: this.selectedShopId,
          productData
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Upload an image to Printify
  async uploadImage(imageUrl: string, filename: string) {
    this.checkInitialization();
    try {
      // First, request an upload URL through our API
      const uploadResponse = await fetch('/api/printify/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName: filename })
      });
      
      const uploadData = await uploadResponse.json();
      const { upload_url, id } = uploadData;
      
      // Handle both string URLs and base64 data
      if (imageUrl.startsWith('data:image')) {
        // For base64 images, convert to blob first
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Upload the blob to the provided URL
        await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png'
          },
          body: blob
        });
      } else {
        // For regular URLs, pass the URL directly
        await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: imageUrl })
        });
      }
      
      // Return the image ID to be used in product creation
      return { id };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Create an order
  async createOrder(orderData: PrintifyOrder) {
    this.checkInitialization();
    try {
      const response = await fetch('/api/printify/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: this.selectedShopId,
          orderData
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Get shipping methods
  async getShippingMethods(address: any) {
    this.checkInitialization();
    try {
      const response = await fetch(`/api/printify/shops/${this.selectedShopId}/shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(address)
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      throw error;
    }
  }
}

export const printifyService = new PrintifyService();