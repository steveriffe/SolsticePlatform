import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Leaf, Info, CheckCircle2 } from 'lucide-react';
import { formatCarbonFootprint, formatOffsetCost } from '@/lib/carbonUtils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface CarbonStats {
  totalCarbonKg: number;
  offsetCarbonKg: number;
  unOffsetCarbonKg: number;
  estimatedOffsetCost: number;
}

const CarbonOffset = () => {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<CarbonStats>({
    queryKey: ['/api/flights/carbon-stats'],
    enabled: !!user,
  });

  const offsetProviders = [
    {
      name: 'Gold Standard',
      description: 'Funds projects that reduce carbon emissions and contribute to sustainable development worldwide.',
      url: 'https://www.goldstandard.org/',
      focus: 'Renewable energy, reforestation, and community-focused projects',
      verification: 'Rigorous third-party verification and auditing',
      pros: ['High-quality certification', 'Sustainable development goals', 'Transparent tracking'],
      priceRange: '$15-25 per tonne',
    },
    {
      name: 'Climate Action Reserve',
      description: 'Focuses on North American carbon offset projects with rigorous protocols and verification.',
      url: 'https://www.climateactionreserve.org/',
      focus: 'Forestry, landfill methane capture, agricultural projects',
      verification: 'Independent verification by accredited bodies',
      pros: ['Strong scientific basis', 'Region-specific expertise', 'Regulatory compliance'],
      priceRange: '$12-22 per tonne',
    },
    {
      name: 'Atmosfair',
      description: 'A non-profit organization that actively contributes to CO₂ mitigation by promoting renewable energies.',
      url: 'https://www.atmosfair.de/en/',
      focus: 'Clean energy projects in developing countries',
      verification: 'CDM and Gold Standard methodologies',
      pros: ['Aviation focus', 'High environmental standards', 'Educational resources'],
      priceRange: '$25-30 per tonne',
    },
    {
      name: 'myclimate',
      description: 'A Swiss non-profit that helps individuals and companies reduce and offset carbon emissions.',
      url: 'https://www.myclimate.org/',
      focus: 'Climate education and carbon offset projects worldwide',
      verification: 'Gold Standard and CDM certified projects',
      pros: ['Educational initiatives', 'Wide range of projects', 'Corporate partnerships'],
      priceRange: '$20-35 per tonne',
    }
  ];

  const independentResources = [
    {
      name: 'Stockholm Environment Institute Carbon Offset Guide',
      url: 'https://www.sei.org/publications/carbon-offset-guide-for-consumers/'
    },
    {
      name: 'David Suzuki Foundation: Purchasing Carbon Offsets',
      url: 'https://davidsuzuki.org/what-you-can-do/carbon-offsets/'
    },
    {
      name: 'The Carbon Trust: Carbon Offsetting',
      url: 'https://www.carbontrust.com/resources/carbon-offsetting-guide'
    },
    {
      name: 'ICAO Carbon Emissions Calculator',
      url: 'https://www.icao.int/environmental-protection/Carbonoffset/Pages/default.aspx'
    }
  ];
  
  return (
    <div className="container py-8 max-w-5xl content-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Carbon Offset Program</h1>
          <p className="text-muted-foreground">
            Track and offset the environmental impact of your flights
          </p>
        </div>
        
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {!isLoading && stats && (
          <>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Carbon Footprint</CardTitle>
                <CardDescription>Total emissions from all flights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCarbonFootprint(stats.totalCarbonKg || 0)}</div>
                <p className="text-muted-foreground text-sm mt-1">Equivalent to {Math.round((stats.totalCarbonKg || 0) / 2.3)} trees planted</p>
              </CardContent>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Offset Needed</CardTitle>
                <CardDescription>Emissions not yet offset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCarbonFootprint(stats.unOffsetCarbonKg || 0)}</div>
                <p className="text-muted-foreground text-sm mt-1">Estimated cost: {formatOffsetCost(stats.estimatedOffsetCost || 0)}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Leaf className="mr-2 h-4 w-4" />
                  Offset Now
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Offset Progress</CardTitle>
                <CardDescription>Your contribution to climate action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(((stats.offsetCarbonKg || 0) / ((stats.totalCarbonKg || 0) || 1)) * 100)}%</div>
                <p className="text-muted-foreground text-sm mt-1">{formatCarbonFootprint(stats.offsetCarbonKg || 0)} already offset</p>
              </CardContent>
            </Card>
          </>
        )}
        
        {(!user || isLoading) && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Track Your Carbon Footprint</CardTitle>
              <CardDescription>Sign in to see your flight emissions and offset progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Solstice Navigator helps you track the carbon footprint of all your flights and provides options to offset your emissions through verified partners.</p>
            </CardContent>
            <CardFooter>
              {!user && (
                <Button asChild>
                  <a href="/api/login">Sign In to Track Emissions</a>
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">About Carbon Offsetting</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Carbon offsetting involves compensating for your carbon dioxide emissions by funding projects that reduce an equivalent amount of emissions elsewhere. 
            While reducing emissions should always be the primary goal, carbon offsetting provides a way to take responsibility for unavoidable emissions.
          </p>
          <p>
            At Solstice Navigator, we recognize that air travel contributes significantly to an individual's carbon footprint. 
            Our offset program provides a way to calculate your flight emissions accurately and connect you with verified offset providers.
          </p>
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="flex-1 border rounded-lg p-4">
              <h3 className="font-medium flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Verified Projects</h3>
              <p className="text-sm mt-2">We only recommend offset providers that meet international standards and have transparent verification processes.</p>
            </div>
            <div className="flex-1 border rounded-lg p-4">
              <h3 className="font-medium flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Accurate Calculations</h3>
              <p className="text-sm mt-2">Our carbon calculations consider flight distance, aircraft type, and additional factors that affect emissions.</p>
            </div>
            <div className="flex-1 border rounded-lg p-4">
              <h3 className="font-medium flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Track Progress</h3>
              <p className="text-sm mt-2">Keep track of your offset contributions and total footprint reduction over time.</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Recommended Offset Providers</h2>
      <p className="text-muted-foreground mb-6">
        We've selected these providers based on their verification standards, transparency, and project quality. 
        We don't receive any commission from these organizations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {offsetProviders.map((provider, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Focus:</span> {provider.focus}
                </div>
                <div>
                  <span className="font-medium">Verification:</span> {provider.verification}
                </div>
                <div>
                  <span className="font-medium">Price Range:</span> {provider.priceRange}
                </div>
                <div className="pt-2">
                  <span className="font-medium">Key Benefits:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {provider.pros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href={provider.url} target="_blank" rel="noopener noreferrer">
                  Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="bg-muted p-6 rounded-lg mb-12">
        <div className="flex items-start gap-4">
          <Info className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-medium mb-2">Independent Resources</h3>
            <p className="text-muted-foreground mb-4">
              We encourage you to research carbon offset options thoroughly. Here are some independent resources to help you make informed decisions:
            </p>
            <ul className="space-y-2">
              {independentResources.map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline flex items-center"
                  >
                    {resource.name} <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <div className="text-center text-muted-foreground">
        <p className="mb-4">
          Solstice Navigator is committed to providing accurate information about carbon offsetting.
          We regularly review and update our recommended providers based on the latest research and standards.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default CarbonOffset;