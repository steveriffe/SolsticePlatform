import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { printifyService } from "@/services/printify";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Flight } from "@shared/schema";

// Define form schema
const formSchema = z.object({
  productType: z.enum(["poster", "tshirt", "mug", "canvas", "phonecase"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  size: z.string().min(1, "Please select a size"),
  color: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Minimum quantity is 1"),
});

interface PrintifyProductFormProps {
  imageUrl: string;
  flights: Flight[];
}

const PRODUCT_TEMPLATES = {
  poster: {
    blueprintId: "4599", // Example poster blueprint ID
    title: "Flight Map Poster",
    description: "Custom poster featuring my flight routes",
    sizes: ["18x24", "24x36"],
    colors: [],
  },
  tshirt: {
    blueprintId: "4563", // Example t-shirt blueprint ID
    title: "Flight Map T-Shirt",
    description: "Custom t-shirt featuring my flight routes",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["White", "Black", "Navy"],
  },
  mug: {
    blueprintId: "4421", // Example mug blueprint ID
    title: "Flight Map Mug",
    description: "Custom mug featuring my flight routes",
    sizes: ["11oz", "15oz"],
    colors: ["White", "Black"],
  },
  canvas: {
    blueprintId: "4603", // Example canvas blueprint ID
    title: "Flight Map Canvas",
    description: "Custom canvas featuring my flight routes",
    sizes: ["12x12", "16x16", "20x20", "24x24"],
    colors: [],
  },
  phonecase: {
    blueprintId: "4742", // Example phone case blueprint ID
    title: "Flight Map Phone Case",
    description: "Custom phone case featuring my flight routes",
    sizes: ["iPhone 13", "iPhone 14", "iPhone 15", "Galaxy S21", "Galaxy S22"],
    colors: ["Clear", "Black", "White"],
  }
};

const PrintifyProductForm = ({ imageUrl, flights }: PrintifyProductFormProps) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [selectedProductType, setSelectedProductType] = useState<keyof typeof PRODUCT_TEMPLATES>("poster");
  const [isLoadingShops, setIsLoadingShops] = useState(true);

  // Fetch shops when component mounts
  useEffect(() => {
    async function fetchShops() {
      try {
        setIsLoadingShops(true);
        const response = await fetch('/api/printify/shops');
        if (response.ok) {
          const shopsData = await response.json();
          setShops(shopsData);
          if (shopsData.length > 0) {
            setSelectedShopId(shopsData[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        toast({
          title: "Error",
          description: "Failed to fetch Printify shops. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingShops(false);
      }
    }
    
    fetchShops();
  }, [toast]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productType: "poster",
      title: "My Flight Map",
      description: `Flight map featuring ${flights.length} flights`,
      size: "",
      color: "",
      quantity: 1,
    },
  });

  // Update form defaults when product type changes
  useEffect(() => {
    const template = PRODUCT_TEMPLATES[selectedProductType];
    form.setValue("title", template.title);
    form.setValue("description", template.description || "");
    form.setValue("size", template.sizes[0] || "");
    form.setValue("color", template.colors[0] || "");
    
    // Generate a preview image for the product type
    generateProductPreview();
  }, [selectedProductType, form]);

  // Watch for product type changes
  const productType = form.watch("productType");
  
  // Update selected product type when it changes in the form
  useEffect(() => {
    setSelectedProductType(productType as keyof typeof PRODUCT_TEMPLATES);
  }, [productType]);

  // Generate a preview image of the product with the map on it
  const generateProductPreview = () => {
    // In a real implementation, this would use a canvas to generate a preview
    // For now, just use the original image as a placeholder
    setProductPreview(imageUrl);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedShopId) {
      toast({
        title: "Error",
        description: "No Printify shop available. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Upload the image to Printify
      toast({
        title: "Uploading image",
        description: "Preparing your design...",
        variant: "default",
      });
      
      const filename = `flight_map_${Date.now()}.png`;
      
      // Request upload URL from our server
      const uploadResponse = await fetch('/api/printify/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName: filename })
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to get image upload URL");
      }
      
      const uploadData = await uploadResponse.json();
      const { upload_url, id } = uploadData;
      
      // Upload the image to Printify's URL
      // Convert base64 to blob
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      
      // Upload to the provided URL
      const uploadResult = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png'
        },
        body: blob
      });
      
      if (!uploadResult.ok) {
        throw new Error("Failed to upload image to Printify");
      }
      
      // Create the product on Printify
      toast({
        title: "Creating product",
        description: "Setting up your custom product...",
        variant: "default",
      });
      
      const template = PRODUCT_TEMPLATES[values.productType as keyof typeof PRODUCT_TEMPLATES];
      
      // Build the product data
      const productData = {
        blueprint_id: template.blueprintId,
        title: values.title,
        description: values.description,
        variants: [
          {
            options: {
              size: values.size,
              color: values.color || undefined
            }
          }
        ],
        print_areas: {
          front: {
            src: id
          }
        }
      };
      
      // Send to our server endpoint
      const createResponse = await fetch('/api/printify/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: selectedShopId,
          productData
        })
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create product");
      }
      
      const createdProduct = await createResponse.json();
      
      toast({
        title: "Product Created",
        description: "Your custom product has been created successfully!",
        variant: "default",
      });
      
      // Reset form and preview
      form.reset();
      setProductPreview(null);
      
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-2"
                    >
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="poster" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">Poster</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="tshirt" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">T-Shirt</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mug" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">Mug</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="canvas" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">Canvas</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="phonecase" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">Phone Case</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your product" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will appear on your product listing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_TEMPLATES[selectedProductType].sizes.map((size) => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {PRODUCT_TEMPLATES[selectedProductType].colors.length > 0 && (
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_TEMPLATES[selectedProductType].colors.map((color) => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </form>
        </Form>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Product Preview</h3>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-muted">
              {productPreview ? (
                <img
                  src={productPreview}
                  alt="Product preview"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Preview not available
                </div>
              )}
              
              {/* Mock product overlay based on product type */}
              {selectedProductType === "tshirt" && (
                <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-50"
                  style={{ backgroundImage: "url('https://cdn.printify.com/static/images/product-templates/tshirt.png')" }}
                />
              )}
              {selectedProductType === "mug" && (
                <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-50"
                  style={{ backgroundImage: "url('https://cdn.printify.com/static/images/product-templates/mug.png')" }}
                />
              )}
              {selectedProductType === "phonecase" && (
                <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-50"
                  style={{ backgroundImage: "url('https://cdn.printify.com/static/images/product-templates/phonecase.png')" }}
                />
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Product Information</h4>
          <ul className="space-y-1 text-sm">
            <li><strong>Type:</strong> {PRODUCT_TEMPLATES[selectedProductType].title}</li>
            <li><strong>Print Area:</strong> Front</li>
            <li><strong>Price:</strong> $29.99 (estimated)</li>
            <li><strong>Production Time:</strong> 3-5 business days</li>
          </ul>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Your image will be printed exactly as shown. Make sure your map visualization looks how you want it to appear on the product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintifyProductForm;