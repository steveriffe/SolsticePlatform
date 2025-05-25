import { FlightKPIs } from "@shared/schema";
import { formatCarbonFootprint } from "@/lib/carbonUtils";
import { formatCurrency } from "@/lib/currencyUtils";
import { Link } from "wouter";
import { Leaf, CreditCard } from "lucide-react";

interface KPISectionProps {
  kpis?: FlightKPIs;
}

const KPISection = ({ kpis }: KPISectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
      {/* KPI Card: Airlines */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Airlines Flown</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {kpis?.totalAirlines || 0}
            </h2>
          </div>
          <div className="bg-primary-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            <span className="text-success-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {kpis?.newAirlinesThisYear || 0} new this year
            </span>
          </p>
        </div>
      </div>
      
      {/* KPI Card: Miles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Miles</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {kpis?.totalMiles.toLocaleString() || 0}
            </h2>
          </div>
          <div className="bg-primary-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="M2 12h20"></path>
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            <span className="text-success-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {kpis?.milesThisMonth.toLocaleString() || 0} miles this month
            </span>
          </p>
        </div>
      </div>
      
      {/* KPI Card: Hours */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Hours in Air</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {kpis?.totalHours.toFixed(1) || 0}
            </h2>
          </div>
          <div className="bg-primary-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            <span className="text-success-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {kpis?.hoursThisMonth.toFixed(1) || 0} hours this month
            </span>
          </p>
        </div>
      </div>

      {/* KPI Card: Carbon Footprint */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Carbon Footprint</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {kpis?.totalCarbonKg ? formatCarbonFootprint(kpis.totalCarbonKg) : '0 kg CO₂e'}
            </h2>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <Leaf className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            <span className={kpis?.offsetPercentage && kpis.offsetPercentage > 0 ? "text-success-500 flex items-center" : "text-gray-500 flex items-center"}>
              {kpis?.offsetPercentage && kpis.offsetPercentage > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : null}
              {kpis?.offsetPercentage || 0}% offset
            </span>
            <Link href="/carbon-offset">
              <span className="text-primary hover:underline cursor-pointer float-right">Details →</span>
            </Link>
          </p>
        </div>
      </div>

      {/* KPI Card: Trip Costs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Trip Costs</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {kpis?.totalTripCost 
                ? formatCurrency(kpis.totalTripCost, kpis.primaryCurrency || 'USD') 
                : '$0.00'}
            </h2>
          </div>
          <div className="bg-amber-100 p-3 rounded-full">
            <CreditCard className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            <span className="text-success-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {kpis?.tripCostThisMonth 
                ? formatCurrency(kpis.tripCostThisMonth, kpis.primaryCurrency || 'USD') 
                : '$0'} this month
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default KPISection;
