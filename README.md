# FinTools - Financial Management Application

A comprehensive financial management application for tracking company finances, including expenses, revenue, profit, assets, cash flow, and founder contributions.

## Features

- **Dashboard Overview**: View key financial metrics at a glance
- **Expense Tracking**: Record and categorize company expenses
- **Revenue Management**: Track all sources of company income
- **Asset Management**: Keep track of company assets and their current values
- **Cash Flow Analysis**: Visualize your company's cash flow over time
- **Founder Contributions**: Track investments made by each founder
- **Transaction History**: Complete record of financial transactions
- **User Authentication**: Secure login and user management

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Mongoose ODM

### Frontend
- React
- Material UI
- React Router
- Chart.js
- Context API for state management
- Axios for API requests

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Setup Instructions

1. Clone the repository:
```
git clone https://github.com/yourusername/fintools.git
cd fintools
```

2. Install dependencies for both client and server:
```
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create a .env file in the config folder with your environment variables:
```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=30d
```

4. Start the development server:
```
# Start the backend server (from the server directory)
npm run dev

# Start the frontend development server (from the client directory)
npm start
```

## Usage

1. Register a new account (for first-time setup)
2. Log in with your credentials
3. Use the sidebar navigation to access different features of the application
4. Start by adding your company's current financial information

## Project Structure

```
fintools/
├── client/                  # Frontend React application
│   ├── public/              # Static files
│   └── src/                 # React source files
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── context/         # Context API for state management
│       ├── utils/           # Utility functions
│       └── assets/          # Images and other static assets
│
├── server/                  # Backend Node.js application
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   └── server.js            # Main server file
│
└── config/                  # Configuration files
    └── .env                 # Environment variables
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License 