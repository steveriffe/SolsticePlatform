import { Express, Request, Response } from "express";
import { isAuthenticated } from "./replitAuth";

// Printify API utility functions
async function printifyRequest(endpoint: string, method = 'GET', body?: any) {
  const apiToken = process.env.PRINTIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error('Printify API token not found');
  }

  const url = `https://api.printify.com/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Printify API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Printify API request failed:', error);
    throw error;
  }
}

// Register Printify API routes
export function registerPrintifyRoutes(app: Express) {
  // Check if Printify is configured
  app.get('/api/printify/config', async (req: Request, res: Response) => {
    const apiToken = process.env.PRINTIFY_API_TOKEN;
    res.json({ 
      isConfigured: !!apiToken 
    });
  });
  
  // Get all shops
  app.get('/api/printify/shops', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const shops = await printifyRequest('/shops');
      res.json(shops);
    } catch (error: any) {
      console.error("Error fetching Printify shops:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a specific shop by ID
  app.get('/api/printify/shops/:shopId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const shop = await printifyRequest(`/shops/${shopId}`);
      res.json(shop);
    } catch (error: any) {
      console.error(`Error fetching Printify shop ${req.params.shopId}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get shop print providers
  app.get('/api/printify/shops/:shopId/print-providers', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const printProviders = await printifyRequest(`/shops/${shopId}/print_providers`);
      res.json(printProviders);
    } catch (error: any) {
      console.error(`Error fetching print providers for shop ${req.params.shopId}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get blueprint catalog
  app.get('/api/printify/blueprints', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const blueprints = await printifyRequest('/catalog/blueprints');
      res.json(blueprints);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Request upload URL for images
  app.post('/api/printify/images/upload', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Create the upload URL from Printify
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }
      
      const uploadUrlData = await printifyRequest('/uploads/images', 'POST', { 
        file_name: fileName 
      });
      
      res.json(uploadUrlData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create a product
  app.post('/api/printify/products', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { shopId, productData } = req.body;
      if (!shopId || !productData) {
        return res.status(400).json({ error: 'Shop ID and product data are required' });
      }
      
      const product = await printifyRequest(`/shops/${shopId}/products`, 'POST', productData);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create an order
  app.post('/api/printify/orders', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { shopId, orderData } = req.body;
      if (!shopId || !orderData) {
        return res.status(400).json({ error: 'Shop ID and order data are required' });
      }
      
      const order = await printifyRequest(`/shops/${shopId}/orders`, 'POST', orderData);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get blueprint print providers
  app.get('/api/printify/blueprint/:blueprintId/print-providers', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { blueprintId } = req.params;
      const printProviders = await printifyRequest(`/catalog/blueprints/${blueprintId}/print_providers`);
      res.json(printProviders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get blueprint variants
  app.get('/api/printify/blueprint/:blueprintId/variants', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { blueprintId } = req.params;
      const { printProviderId } = req.query;
      
      if (!printProviderId) {
        return res.status(400).json({ error: 'Print provider ID is required' });
      }
      
      const variants = await printifyRequest(
        `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants`
      );
      
      res.json(variants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}