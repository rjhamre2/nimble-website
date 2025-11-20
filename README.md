# NimbleAI Website - Complete Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Architecture Overview](#architecture-overview)
7. [Authentication System](#authentication-system)
8. [Key Features](#key-features)
9. [API Configuration](#api-configuration)
10. [Component Documentation](#component-documentation)
11. [Services Documentation](#services-documentation)
12. [Routing](#routing)
13. [State Management](#state-management)
14. [Deployment](#deployment)
15. [Development Guidelines](#development-guidelines)
16. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

NimbleAI is a comprehensive customer engagement platform that enables businesses to manage customer interactions through WhatsApp, live chat, and other communication channels. The platform provides AI-powered agents, team management, contact management, analytics, and integrations with popular business tools.

### Main Capabilities

- **WhatsApp Integration**: Connect and manage WhatsApp Business accounts
- **AI Agents**: Create and manage AI-powered customer service agents
- **Live Chat**: Real-time customer support through web chat
- **Team Management**: Invite and manage team members with role-based access
- **Contact Management**: Store and manage customer contacts
- **Analytics & Reports**: Track performance metrics and generate reports
- **Integrations**: Connect with HubSpot, Shopify, Mailchimp, Zendesk, and more
- **Subscription Management**: Handle pricing plans and billing

---

## 🛠 Tech Stack

### Frontend Framework
- **React 19.1.0**: Modern UI library for building user interfaces
- **React Router DOM 7.7.0**: Client-side routing
- **React Scripts 5.0.1**: Build tooling and development server

### Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Heroicons**: Icon library for React

### State Management
- **React Hooks**: useState, useEffect, useContext for state management
- **Custom Hooks**: useAuth, useChat, useFacebookAuth

### Authentication
- **Google Identity Services**: OAuth 2.0 authentication
- **JWT Tokens**: Token-based authentication stored in localStorage

### Real-time Communication
- **Socket.IO Client 4.8.1**: WebSocket connections for real-time features
- **Firebase**: Backend services integration

### Additional Libraries
- **Axios 1.11.0**: HTTP client for API requests
- **QRCode.react 4.2.0**: QR code generation
- **Lucide React**: Additional icon library

---

## 📁 Project Structure

```
nimble-website/
├── public/                 # Static assets
│   ├── index.html         # HTML template
│   ├── favicon.ico        # Site favicon
│   └── _redirects         # Netlify/Vercel redirect rules
│
├── src/
│   ├── components/        # React components
│   │   ├── Dashboard/    # Dashboard-specific components
│   │   │   ├── Dashboard.js          # Main dashboard component
│   │   │   ├── Sidebar.js            # Navigation sidebar
│   │   │   ├── OverviewCards.js      # Overview statistics
│   │   │   ├── RecentChats.js        # Recent conversations
│   │   │   ├── IntegrationsPage.js   # Integrations management
│   │   │   ├── KnowledgeBase.js      # Knowledge base management
│   │   │   ├── PlanBilling.js        # Subscription & billing
│   │   │   ├── Settings.js           # User settings
│   │   │   ├── AnalyticsReports.js   # Analytics dashboard
│   │   │   └── LiveAgentPreview.js   # Live agent preview
│   │   │
│   │   ├── AcceptInvite.js          # Team invitation acceptance
│   │   ├── ChatWidget.js             # Chat widget component
│   │   ├── HeroSection.js            # Landing page hero
│   │   ├── FeaturesSection.js       # Features showcase
│   │   ├── LoginPage.js             # Login page
│   │   ├── StartNowPage.js         # Signup page
│   │   ├── LiveChat.js              # Live chat interface
│   │   └── ...                      # Other utility components
│   │
│   ├── config/
│   │   └── api.js                   # API configuration & endpoints
│   │
│   ├── hooks/
│   │   ├── useAuth.js               # Authentication hook
│   │   ├── useChat.js               # Chat functionality hook
│   │   ├── useFacebookAuth.js      # Facebook authentication hook
│   │   └── useIntersectionObserver.js # Scroll animations
│   │
│   ├── services/
│   │   ├── authService.js          # Authentication services
│   │   ├── userService.js          # User data services
│   │   ├── chatService.js          # Chat services
│   │   ├── firebaseService.js      # Firebase integration
│   │   ├── websocketService.js     # WebSocket connections
│   │   └── onboardingService.js    # Onboarding flow
│   │
│   ├── images/                     # Image assets
│   ├── integrations/               # Integration logos
│   │
│   ├── App.js                      # Main app component
│   ├── App.css                     # Global styles
│   ├── index.js                    # Application entry point
│   └── index.css                   # Base styles
│
├── package.json                    # Dependencies & scripts
├── tailwind.config.js             # Tailwind configuration
├── vercel.json                    # Vercel deployment config
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 14.x or higher
- **npm** or **yarn**: Package manager
- **Git**: Version control

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nimble-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start`: Start development server (runs on port 3000)
- `npm build`: Build production bundle
- `npm test`: Run test suite
- `npm eject`: Eject from Create React App (irreversible)

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Google Authentication
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# API Endpoints
REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL=https://your-lambda-function-url.amazonaws.com
REACT_APP_AUTH_LAMBDA_BASE_URL=https://your-auth-lambda-url.amazonaws.com
REACT_APP_WA_ES_LAMBDA=https://your-wa-es-lambda-url.amazonaws.com
REACT_APP_FRONTEND2FIREBASE=https://your-firebase-lambda-url.amazonaws.com
REACT_APP_PRICING_LAMBDA=https://your-pricing-lambda-url.amazonaws.com
REACT_APP_CONTACTS_API=https://your-contacts-api-url.amazonaws.com
REACT_APP_DB_SERVER_URL=https://your-db-server-url.com

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=nimbleai-firebase.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nimbleai-firebase
```

### Environment Variable Notes

- All variables must start with `REACT_APP_` to be accessible in the React app
- Restart the development server after adding/changing environment variables
- Never commit `.env` files to version control
- Use different values for development and production environments

---

## 🏗 Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  App.js  │→ │ Dashboard│→ │ Components│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│       │              │              │                  │
│       └──────────────┼──────────────┘                  │
│                      │                                  │
│              ┌───────▼───────┐                         │
│              │  useAuth Hook │                         │
│              └───────┬───────┘                         │
└──────────────────────┼──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Auth Lambda  │ │ DB Server │ │ Firebase  │
│              │ │           │ │           │
└──────────────┘ └───────────┘ └───────────┘
```

### Data Flow

1. **User Interaction** → Component triggers action
2. **Service Layer** → Service function makes API call
3. **API Configuration** → Routes to correct endpoint
4. **Backend Service** → Processes request
5. **Response** → Returns data to frontend
6. **State Update** → Component updates UI

---

## 🔑 Authentication System

### Authentication Flow

1. **User clicks "Sign in with Google"**
   - Component: `SignInButton.js` or `LoginPage.js`
   - Service: `authService.signInWithGoogleLambda()`

2. **Google OAuth Flow**
   - Google Identity Services handles OAuth
   - Returns access token to frontend

3. **Token Exchange**
   - Frontend sends user info (not token) to Auth Lambda
   - Auth Lambda validates and creates/updates user
   - Returns JWT token to frontend

4. **Token Storage**
   - JWT stored in `localStorage` as `authToken`
   - User data stored as `userData`
   - Custom event `authStateChanged` dispatched

5. **Authentication Check**
   - `useAuth` hook checks for token on mount
   - Verifies token with Auth Lambda
   - Updates user state accordingly

### Key Files

- **`src/hooks/useAuth.js`**: Main authentication hook
- **`src/services/authService.js`**: Authentication service functions
- **`src/components/SignInButton.js`**: Sign-in button component
- **`src/components/LoginPage.js`**: Login page component

### Protected Routes

Routes are protected using the `ProtectedRoute` component:

```javascript
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Authentication Methods

#### Google Sign-In
```javascript
import { signInWithGoogleLambda } from './services/authService';

// Trigger Google sign-in
await signInWithGoogleLambda();
```

#### Logout
```javascript
import { logoutLambda } from './services/authService';

// Logout user
await logoutLambda();
```

#### Check Authentication Status
```javascript
import { useAuth } from './hooks/useAuth';

const { user, isAuthenticated, loading } = useAuth();
```

---

## ✨ Key Features

### 1. Dashboard Overview

**Location**: `src/components/Dashboard/Dashboard.js`

The main dashboard provides:
- Overview cards with key metrics
- Recent chats and conversations
- Quick access to all features
- Navigation sidebar

**Key State Variables**:
- `activeTab`: Current dashboard tab (overview, chats, contacts, etc.)
- `userData`: Current user information
- Various feature-specific states

### 2. Team Management

**Features**:
- Create teams with multiple members
- Invite team members via email
- Assign roles (Admin, Agent, Viewer, etc.)
- Edit and delete team members
- View invitation status

**API Endpoints**:
- `POST /api/teams`: Create new team
- `GET /api/teams/:dbId`: Get user's teams
- `POST /api/teams/:teamId/members`: Add team member
- `DELETE /api/teams/:teamId/members/:memberId`: Remove member
- `DELETE /api/invitations/:invitationId`: Cancel invitation

**Key Functions**:
- `handleSaveNewMember()`: Add member to existing team
- `handleDeleteMember()`: Remove team member
- `handleDeleteInvitation()`: Cancel pending invitation
- `fetchTeams()`: Load teams data

### 3. Contact Management

**Features**:
- Create, read, update, delete contacts
- Store contact information (name, email, phone, address, etc.)
- Lead stage tracking
- Contact search and filtering

**API Endpoints**:
- `POST /api/contacts/create_contact`: Create contact
- `GET /api/contacts/user/:dbId`: Get user's contacts
- `PUT /api/contacts/:contactId`: Update contact
- `DELETE /api/contacts/:contactId`: Delete contact

### 4. WhatsApp Integration

**Features**:
- Connect WhatsApp Business account
- QR code generation for connection
- Status checking
- Message management

**Key Components**:
- `WhatsAppEmbeddedSignup.js`: WhatsApp signup flow
- `WhatsAppAIAgentSection.js`: AI agent configuration

### 5. Live Chat

**Features**:
- Real-time chat interface
- WebSocket connections
- Chat history
- Agent assignment

**Key Files**:
- `src/components/LiveChat.js`: Main chat component
- `src/services/websocketService.js`: WebSocket management
- `src/services/chatService.js`: Chat API calls

### 6. Integrations

**Supported Platforms**:
- HubSpot
- Shopify
- Mailchimp
- Zendesk
- WordPress
- Squarespace

**Component**: `src/components/Dashboard/IntegrationsPage.js`

### 7. Knowledge Base

**Features**:
- Create and manage knowledge articles
- Organize by categories
- Search functionality

**Component**: `src/components/Dashboard/KnowledgeBase.js`

### 8. Analytics & Reports

**Features**:
- Performance metrics
- Conversation analytics
- Custom report generation

**Component**: `src/components/Dashboard/AnalyticsReports.js`

### 9. Subscription & Billing

**Features**:
- View current plan
- Upgrade/downgrade plans
- Payment management
- Billing history

**Component**: `src/components/Dashboard/PlanBilling.js`

**API Endpoints**:
- `POST /api/pricing/fetch_products_and_pricing`: Get plans
- `POST /api/pricing/subscribe`: Subscribe to plan
- `POST /api/pricing/fetch_subscription_status`: Get subscription status

---

## 🔌 API Configuration

### Configuration File

**Location**: `src/config/api.js`

This file centralizes all API endpoint configurations and provides helper functions to build URLs.

### Available Configurations

1. **Main API Config** (`API_CONFIG`)
   - Base URL: `REACT_APP_DASHBOARD2EC2LAMBDA_BASE_URL`
   - Endpoints: WhatsApp, health, onboard, auth proxy

2. **Auth Config** (`AUTH_CONFIG`)
   - Base URL: `REACT_APP_AUTH_LAMBDA_BASE_URL`
   - Endpoints: Google auth, logout, verify, health

3. **WhatsApp Embedded Signup** (`WA_ES_CONFIG`)
   - Base URL: `REACT_APP_WA_ES_LAMBDA`
   - Endpoints: WhatsApp code exchange

4. **Firebase Lambda** (`FIREBASE_LAMBDA_CONFIG`)
   - Base URL: `REACT_APP_FRONTEND2FIREBASE`
   - Endpoints: WhatsApp status, dashboard status, training status

5. **Pricing Lambda** (`PRICING_LAMBDA_CONFIG`)
   - Base URL: `REACT_APP_PRICING_LAMBDA`
   - Endpoints: Products, subscription, status

6. **Contacts API** (`CONTACTS_CONFIG`)
   - Base URL: `REACT_APP_CONTACTS_API`
   - Endpoints: CRUD operations for contacts

7. **DB Server** (`DB_SERVER_CONFIG`)
   - Base URL: `REACT_APP_DB_SERVER_URL`
   - Endpoints: User management, teams, invitations

### Using API Configuration

```javascript
import { apiConfig } from './config/api';

// Build URL for endpoint
const url = apiConfig.endpoints.auth.google();

// Or use helper functions
const authUrl = apiConfig.buildAuthUrl('google');
const firebaseUrl = apiConfig.buildFirebaseLambdaUrl('checkWhatsappStatus');
```

### Environment Detection

The configuration automatically detects the environment:
- **Development**: `localhost` or `127.0.0.1`
- **Production**: Any other hostname

---

## 📦 Component Documentation

### Main Components

#### App.js
**Purpose**: Root component, handles routing and global state

**Key Features**:
- Route definitions
- Protected route wrapper
- Public route wrapper (redirects if authenticated)
- Dark mode management
- Global event listeners

**Routes**:
- `/`: Landing page (public)
- `/start-now`: Signup page (public)
- `/login`: Login page (public)
- `/dashboard`: Main dashboard (protected)
- `/accept-invite/:token`: Team invitation acceptance (public)

#### Dashboard.js
**Purpose**: Main dashboard component with all features

**Tabs**:
- `overview`: Dashboard overview
- `chats`: Chat management
- `contacts`: Contact management
- `broadcast`: Broadcast messages
- `automation`: Automation rules
- `team-management`: Team and user management
- `integrations`: Third-party integrations
- `knowledge-base`: Knowledge base management
- `analytics`: Analytics and reports
- `plan-billing`: Subscription management
- `settings`: User settings

**Key State Management**:
- Uses `useAuth` hook for user data
- Manages multiple feature-specific states
- Handles real-time updates via WebSockets

#### Sidebar.js
**Purpose**: Navigation sidebar for dashboard

**Features**:
- Tab navigation
- User profile section
- Logout functionality
- Responsive design

### Authentication Components

#### SignInButton.js
**Purpose**: Google sign-in button

**Features**:
- Google Identity Services integration
- Handles OAuth flow
- Updates authentication state

#### LoginPage.js
**Purpose**: Full login page

**Features**:
- Google sign-in option
- Email/password login (if implemented)
- Redirects to dashboard on success

#### StartNowPage.js
**Purpose**: User registration page

**Features**:
- Google sign-up
- Email/password signup
- Handles invitation tokens
- Pre-fills email from invitation

#### AcceptInvite.js
**Purpose**: Team invitation acceptance

**Features**:
- Validates invitation token
- Stores token in sessionStorage
- Redirects to signup/login

### Feature Components

#### RecentChats.js
**Purpose**: Display recent conversations

**Features**:
- Lists recent chats
- Click to open chat
- Real-time updates

#### IntegrationsPage.js
**Purpose**: Manage third-party integrations

**Features**:
- List available integrations
- Connect/disconnect integrations
- Integration status

#### KnowledgeBase.js
**Purpose**: Manage knowledge base articles

**Features**:
- Create/edit/delete articles
- Categorize articles
- Search functionality

#### PlanBilling.js
**Purpose**: Subscription management

**Features**:
- View current plan
- Upgrade/downgrade options
- Billing history
- Payment methods

#### Settings.js
**Purpose**: User settings

**Features**:
- Profile management
- Account settings
- Preferences

---

## 🔧 Services Documentation

### authService.js

**Purpose**: Authentication-related API calls

**Functions**:

```javascript
// Initialize Google Sign-In
initializeGoogleSignIn()

// Sign in with Google
signInWithGoogleLambda()

// Logout
logoutLambda()

// Verify token
verifyTokenLambda()

// Get current user
getCurrentUser()

// Check if authenticated
isAuthenticated()
```

### userService.js

**Purpose**: User data management

**Functions**:

```javascript
// Get current user data
getCurrentUserData()

// Update user data
updateUserData(updates)
```

### chatService.js

**Purpose**: Chat-related API calls

**Functions**:
- Send messages
- Get chat history
- Manage conversations

### firebaseService.js

**Purpose**: Firebase integration

**Functions**:

```javascript
// Check WhatsApp status
checkWhatsAppStatus()

// Get dashboard status
getUserDashboardStatus()

// Get WhatsApp link
getWhatsappLink()
```

### websocketService.js

**Purpose**: WebSocket connection management

**Features**:
- Real-time message updates
- Connection management
- Reconnection handling

### onboardingService.js

**Purpose**: User onboarding flow

**Features**:
- Welcome modal
- Setup wizard
- Initial configuration

---

## 🛣 Routing

### Route Structure

```javascript
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/start-now" element={<PublicRoute><StartNowPage /></PublicRoute>} />
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/accept-invite/:token" element={<AcceptInvite />} />
  
  {/* Protected Routes */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
</Routes>
```

### Route Protection

**ProtectedRoute**: Requires authentication
- Shows loading spinner while checking
- Redirects to home if not authenticated

**PublicRoute**: Redirects if already authenticated
- Prevents logged-in users from accessing login/signup pages
- Redirects to dashboard

---

## 📊 State Management

### Global State

**Authentication State**:
- Managed by `useAuth` hook
- Stored in localStorage
- Updates via custom events

**User Data**:
- Fetched on authentication
- Cached in component state
- Updated via API calls

### Component State

**Local State**:
- Uses React `useState` hook
- Component-specific data
- UI state (modals, tabs, etc.)

**Shared State**:
- Passed via props
- Context API (if needed)
- Custom hooks

### State Flow Example

```
User Action
    ↓
Component Handler
    ↓
Service Function
    ↓
API Call
    ↓
Response
    ↓
State Update
    ↓
UI Re-render
```

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Deployment Options

#### Vercel

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

**Configuration**: `vercel.json`

#### Netlify

1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables

**Configuration**: `public/_redirects` for routing

#### AWS S3 + CloudFront

1. Build the project
2. Upload `build/` contents to S3 bucket
3. Configure CloudFront distribution
4. Set up environment variables

### Environment Variables in Production

Ensure all `REACT_APP_*` variables are set in your deployment platform's environment settings.

---

## 💻 Development Guidelines

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep components focused and small

### File Naming

- Components: PascalCase (e.g., `Dashboard.js`)
- Services: camelCase (e.g., `authService.js`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.js`)
- Utilities: camelCase (e.g., `apiConfig.js`)

### Component Structure

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';

// 2. Component definition
const MyComponent = () => {
  // 3. State declarations
  const [state, setState] = useState(null);
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 5. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 7. Export
export default MyComponent;
```

### API Calls

Always use the `apiConfig` helper functions:

```javascript
import { apiConfig } from '../config/api';

// Good
const response = await fetch(apiConfig.endpoints.auth.google(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Bad - Don't hardcode URLs
const response = await fetch('https://hardcoded-url.com/api');
```

### Error Handling

```javascript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly error message
  alert('Something went wrong. Please try again.');
}
```

### Adding New Features

1. Create component in appropriate directory
2. Add route in `App.js` if needed
3. Create service functions if API calls required
4. Update API config if new endpoints needed
5. Add to navigation if needed
6. Test thoroughly

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Problem**: Environment variables are `undefined`

**Solutions**:
- Ensure variable names start with `REACT_APP_`
- Restart development server after adding variables
- Check `.env` file is in root directory
- Verify no typos in variable names

#### 2. Authentication Not Working

**Problem**: Can't sign in or token invalid

**Solutions**:
- Check `REACT_APP_GOOGLE_CLIENT_ID` is set correctly
- Verify Auth Lambda URL is correct
- Check browser console for errors
- Clear localStorage and try again

#### 3. API Calls Failing

**Problem**: 404 or CORS errors

**Solutions**:
- Verify API URLs in `.env` file
- Check API configuration in `api.js`
- Ensure backend services are running
- Check CORS settings on backend

#### 4. Build Fails

**Problem**: Build errors during `npm run build`

**Solutions**:
- Check for syntax errors
- Verify all imports are correct
- Ensure all environment variables are set
- Check for missing dependencies

#### 5. Routing Issues

**Problem**: Routes not working after deployment

**Solutions**:
- Check `_redirects` file for SPA routing
- Verify Vercel/Netlify routing configuration
- Ensure all routes redirect to `index.html`

### Debugging Tips

1. **Use Browser DevTools**
   - Console for errors and logs
   - Network tab for API calls
   - Application tab for localStorage

2. **Add Console Logs**
   ```javascript
   console.log('Debug info:', { variable1, variable2 });
   ```

3. **Check React DevTools**
   - Install React DevTools extension
   - Inspect component state and props

4. **Verify API Responses**
   - Check Network tab
   - Verify response status codes
   - Inspect response data

---

## 📚 Additional Resources

### React Documentation
- [React Official Docs](https://react.dev/)
- [React Router Docs](https://reactrouter.com/)

### Tailwind CSS
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Google Identity Services
- [Google Sign-In Docs](https://developers.google.com/identity/gsi/web)

### Socket.IO
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)

---

## 🤝 Contributing

### Before Making Changes

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Follow code style guidelines
5. Submit pull request

### Code Review Checklist

- [ ] Code follows project style
- [ ] No console errors
- [ ] All features tested
- [ ] Environment variables documented
- [ ] API endpoints verified
- [ ] No hardcoded values

---

## 📝 License

[Add your license information here]

---

## 👥 Support

For questions or issues:
- Check this documentation
- Review code comments
- Contact development team
- Open an issue in repository

---

**Last Updated**: [Current Date]
**Version**: 0.0.1-dev

