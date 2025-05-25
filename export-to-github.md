# Exporting to GitHub

Follow these steps to export your Solstice Navigator project to your GitHub repository:

## Step 1: Download Your Project Files

1. In the Replit interface, click on the three dots menu (⋮) in the Files panel
2. Select "Download as zip"
3. Save the ZIP file to your local machine and extract it

## Step 2: Initialize Git and Connect to GitHub

1. Open a terminal/command prompt on your local machine
2. Navigate to the extracted project folder:
   ```
   cd path/to/extracted/project
   ```

3. Initialize a Git repository:
   ```
   git init
   ```

4. Add all files to the staging area:
   ```
   git add .
   ```

5. Commit the files:
   ```
   git commit -m "Initial commit: Solstice Navigator flight tracking application"
   ```

6. Connect to your GitHub repository:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/SolsticeNavigator.git
   ```

7. Push your code to GitHub:
   ```
   git push -u origin main
   ```
   (If your default branch is "master" instead of "main", use that instead)

## Step 3: Setting Up Your Repository

Once your code is on GitHub, you can:

1. Add collaborators if needed
2. Set up GitHub Actions for CI/CD
3. Configure branch protection rules
4. Add project description and topics

## Step 4: Continuing Development

For future development:

1. Clone the repository to your development environment:
   ```
   git clone https://github.com/YOUR_USERNAME/SolsticeNavigator.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your database connection in a `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/solstice_navigator
   ```

4. Run the application:
   ```
   npm run dev
   ```

## Important Notes

- Remember to replace `YOUR_USERNAME` with your actual GitHub username
- If you're using a different database setup, adjust the connection string accordingly
- The `.gitignore` file is set up to exclude node_modules and environment files