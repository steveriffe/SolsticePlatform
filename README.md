# Solstice Navigator

A comprehensive flight route visualization web application that empowers aviation enthusiasts to log, analyze, and share their global travel experiences, with advanced map export capabilities.

## Features

- **Interactive Flight Map**: Visualize your flight routes on an interactive map using OpenLayers
- **Flight Logging**: Record detailed information about each flight including airports, airlines, aircraft type, dates, and trip costs
- **Cost Tracking**: Track trip costs with multi-currency support
- **Carbon Footprint**: Calculate and track your carbon footprint from flights
- **Data Analysis**: View statistics and KPIs about your flights
- **Trip Journal**: Write and save journal entries for each flight

## Tech Stack

- **Frontend**: TypeScript, React, TailwindCSS, Shadcn UI components
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL
- **Mapping**: OpenLayers
- **State Management**: React Query
- **Form Handling**: React Hook Form

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/YOUR_USERNAME/SolsticeNavigator.git
   cd SolsticeNavigator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a PostgreSQL database and update the `DATABASE_URL` in your environment.

4. Run the database migrations:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Register/login to the application
2. Add your flights with details like departure/arrival airports, airline, aircraft, etc.
3. View your flights on the interactive map
4. Analyze your travel statistics in the dashboard
5. Track your carbon footprint and trip costs over time

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.