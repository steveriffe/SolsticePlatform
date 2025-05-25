/**
 * Comprehensive list of passenger aircraft from 1960 to present day
 * Organized by manufacturer and includes historical and modern models
 */

interface AircraftGroup {
  label: string;
  options: string[];
}

export const aircraftGroups: AircraftGroup[] = [
  {
    label: "Airbus",
    options: [
      "Airbus A300",
      "Airbus A310",
      "Airbus A318",
      "Airbus A319",
      "Airbus A320",
      "Airbus A321",
      "Airbus A330-200",
      "Airbus A330-300",
      "Airbus A330-800neo",
      "Airbus A330-900neo",
      "Airbus A340-200",
      "Airbus A340-300",
      "Airbus A340-500",
      "Airbus A340-600",
      "Airbus A350-900",
      "Airbus A350-1000",
      "Airbus A380-800",
    ]
  },
  {
    label: "Boeing - Modern",
    options: [
      "Boeing 717-200",
      "Boeing 737-600",
      "Boeing 737-700",
      "Boeing 737-800",
      "Boeing 737-900",
      "Boeing 737 MAX 7",
      "Boeing 737 MAX 8",
      "Boeing 737 MAX 9",
      "Boeing 737 MAX 10",
      "Boeing 747-400",
      "Boeing 747-8",
      "Boeing 757-200",
      "Boeing 757-300",
      "Boeing 767-200",
      "Boeing 767-300",
      "Boeing 767-400",
      "Boeing 777-200",
      "Boeing 777-300",
      "Boeing 777-200LR",
      "Boeing 777-300ER",
      "Boeing 777X",
      "Boeing 787-8",
      "Boeing 787-9",
      "Boeing 787-10",
    ]
  },
  {
    label: "Boeing - Classic & Historical",
    options: [
      "Boeing 707",
      "Boeing 720",
      "Boeing 727-100",
      "Boeing 727-200",
      "Boeing 737-100",
      "Boeing 737-200",
      "Boeing 737-300",
      "Boeing 737-400",
      "Boeing 737-500",
      "Boeing 747-100",
      "Boeing 747-200",
      "Boeing 747-300",
      "Boeing 747SP",
    ]
  },
  {
    label: "McDonnell Douglas (Historical)",
    options: [
      "Douglas DC-8",
      "Douglas DC-9",
      "Douglas DC-10",
      "McDonnell Douglas MD-80",
      "McDonnell Douglas MD-81",
      "McDonnell Douglas MD-82",
      "McDonnell Douglas MD-83",
      "McDonnell Douglas MD-87",
      "McDonnell Douglas MD-88",
      "McDonnell Douglas MD-90",
      "McDonnell Douglas MD-11",
    ]
  },
  {
    label: "Embraer",
    options: [
      "Embraer ERJ-135",
      "Embraer ERJ-140",
      "Embraer ERJ-145",
      "Embraer E170",
      "Embraer E175",
      "Embraer E190",
      "Embraer E195",
      "Embraer E190-E2",
      "Embraer E195-E2",
    ]
  },
  {
    label: "Bombardier",
    options: [
      "Bombardier CRJ100/200",
      "Bombardier CRJ700",
      "Bombardier CRJ900",
      "Bombardier CRJ1000",
      "Bombardier Dash 8 Q100",
      "Bombardier Dash 8 Q200",
      "Bombardier Dash 8 Q300",
      "Bombardier Dash 8 Q400",
      "Bombardier CS100/A220-100",
      "Bombardier CS300/A220-300",
    ]
  },
  {
    label: "ATR",
    options: [
      "ATR 42-300",
      "ATR 42-500",
      "ATR 42-600",
      "ATR 72-200",
      "ATR 72-500",
      "ATR 72-600",
    ]
  },
  {
    label: "Fokker (Historical)",
    options: [
      "Fokker F27 Friendship",
      "Fokker F28 Fellowship",
      "Fokker 50",
      "Fokker 70",
      "Fokker 100",
    ]
  },
  {
    label: "British Aircraft (Historical)",
    options: [
      "BAC One-Eleven",
      "British Aerospace 146",
      "British Aerospace Jetstream 31",
      "British Aerospace Jetstream 41",
      "Hawker Siddeley Trident",
      "Vickers VC10",
      "Concorde",
    ]
  },
  {
    label: "Russian/Soviet Aircraft",
    options: [
      "Antonov An-24",
      "Antonov An-140",
      "Antonov An-148",
      "Ilyushin Il-62",
      "Ilyushin Il-76",
      "Ilyushin Il-86",
      "Ilyushin Il-96",
      "Sukhoi Superjet 100",
      "Tupolev Tu-134",
      "Tupolev Tu-154",
      "Tupolev Tu-204",
      "Yakovlev Yak-40",
      "Yakovlev Yak-42",
    ]
  },
  {
    label: "Other Commercial Aircraft",
    options: [
      "Aerospatiale/BAC Concorde",
      "Convair 880",
      "Convair 990",
      "COMAC C919",
      "de Havilland Canada DHC-6 Twin Otter",
      "de Havilland Canada DHC-8 Dash 8",
      "Lockheed L-1011 TriStar",
      "Lockheed L-188 Electra",
      "Saab 340",
      "Saab 2000",
      "Other Passenger Jet",
      "Other Passenger Propeller",
    ]
  }
];

/**
 * Returns a flat array of all aircraft types
 */
export const getAllAircraftTypes = (): string[] => {
  return aircraftGroups.flatMap(group => group.options);
};

/**
 * Get grouped aircraft options suitable for a grouped select component
 */
export const getGroupedAircraftOptions = () => {
  return aircraftGroups.map(group => ({
    label: group.label,
    options: group.options.map(option => ({
      value: option,
      label: option
    }))
  }));
};

/**
 * Checks if an aircraft type belongs to a specific manufacturer or category
 * 
 * @param aircraftType The specific aircraft type from the database
 * @param manufacturerFilter The manufacturer or category filter from the dropdown
 * @returns True if aircraft belongs to the manufacturer group
 */
export const aircraftMatchesFilter = (aircraftType: string | null, manufacturerFilter: string): boolean => {
  if (!aircraftType) return false;
  if (!manufacturerFilter) return true; // No filter means it matches
  
  // Special case: exact match
  if (aircraftType === manufacturerFilter) return true;
  
  const normalizedAircraftType = aircraftType.toLowerCase();
  const normalizedFilter = manufacturerFilter.toLowerCase();
  
  // Handle manufacturer filters (partial matching)
  switch(normalizedFilter) {
    case 'airbus':
      return normalizedAircraftType.includes('airbus') || normalizedAircraftType.includes('a3') || normalizedAircraftType.includes('a2');
    case 'boeing':
      return normalizedAircraftType.includes('boeing') || normalizedAircraftType.includes('b7') || normalizedAircraftType.includes('b-7');
    case 'embraer':
      return normalizedAircraftType.includes('embraer') || normalizedAircraftType.includes('e1') || normalizedAircraftType.includes('e2') || normalizedAircraftType.includes('erj');
    case 'bombardier':
      return normalizedAircraftType.includes('bombardier') || normalizedAircraftType.includes('crj') || normalizedAircraftType.includes('dash 8') || normalizedAircraftType.includes('a220');
    // Common types
    case 'boeing 737':
      return normalizedAircraftType.includes('737');
    case 'boeing 787':
      return normalizedAircraftType.includes('787') || normalizedAircraftType.includes('dreamliner');
    case 'airbus a320':
      return normalizedAircraftType.includes('a320') || normalizedAircraftType.includes('a-320');
    case 'airbus a330':
      return normalizedAircraftType.includes('a330') || normalizedAircraftType.includes('a-330');
    case 'airbus a350':
      return normalizedAircraftType.includes('a350') || normalizedAircraftType.includes('a-350');
    // Historical
    case 'concorde':
      return normalizedAircraftType.includes('concorde');
    case 'dc-10':
      return normalizedAircraftType.includes('dc-10') || normalizedAircraftType.includes('dc10');
    case 'boeing 707':
      return normalizedAircraftType.includes('707');
    case 'boeing 727':
      return normalizedAircraftType.includes('727');
    default:
      // For any other filter, check if the filter text is included in the aircraft type
      return normalizedAircraftType.includes(normalizedFilter);
  }
};