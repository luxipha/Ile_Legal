# Ile Legal Platform - Routing and Components Documentation

## Table of Contents
1. [Overview](#overview)
2. [Application Architecture](#application-architecture)
3. [Routing Structure](#routing-structure)
4. [Component Hierarchy](#component-hierarchy)
5. [Authentication & Authorization](#authentication--authorization)
6. [Layout Components](#layout-components)
7. [Screen Components](#screen-components)
8. [UI Components](#ui-components)
9. [State Management](#state-management)
10. [Navigation Patterns](#navigation-patterns)

## Overview

The Ile Legal Platform is built with React, TypeScript, and React Router, featuring a role-based routing system with protected routes and dynamic layouts. The application follows a component-based architecture with clear separation of concerns.

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API + Local State
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Authentication**: Supabase Auth
- **Code Splitting**: React.lazy() for performance optimization

## Application Architecture

### Core Structure
```
src/
├── App.tsx                 # Main application component
├── index.tsx              # Application entry point
├── contexts/              # React Context providers
│   └── AuthContext.tsx    # Authentication context
├── screens/               # Page-level components
├── components/            # Reusable UI components
├── services/              # API and business logic
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
└── types/                 # TypeScript type definitions
```

### Application Flow
1. **Entry Point** (`index.tsx`) → Renders `App` component
2. **App Component** → Sets up providers and routing
3. **AuthProvider** → Manages authentication state
4. **Router** → Handles navigation and route protection
5. **Screens** → Render based on user role and permissions

## Routing Structure

### Main Router Configuration (`App.tsx`)

The application uses React Router v6 with the following structure:

```typescript
// App.tsx - Main routing configuration
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileCompletionHandler />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes with Role-Based Access */}
        <Route path="/seller-dashboard" element={
          <ProtectedRoute requiredRole="seller">
            <SellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute requiredRole="buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Additional Protected Routes */}
        {/* ... more routes */}
      </Routes>
    </Suspense>
  );
}
```

### Route Categories

#### 1. Public Routes
- `/` - Home page (landing)
- `/login` - Authentication page
- `/register` - User registration
- `/reset-password` - Password reset
- `/auth/callback` - OAuth callback handler
- `/test-accounts` - Test account access
- `/BlockchainDemo` - Blockchain demonstration

#### 2. Buyer Routes (Protected)
- `/buyer-dashboard` - Buyer main dashboard
- `/buyer-messages` - Buyer messaging interface
- `/buyer-profile` - Buyer profile management
- `/post-gig` - Create new legal service request
- `/MyGigs` - View posted gigs
- `/payments` - Payment management

#### 3. Seller Routes (Protected)
- `/seller-dashboard` - Seller main dashboard
- `/seller-messages` - Seller messaging interface
- `/find-gigs` - Browse available gigs
- `/active-bids` - Manage submitted bids
- `/earnings` - Earnings and financial overview
- `/profile` - Seller profile management

#### 4. Admin Routes (Protected)
- `/admin-dashboard` - Admin control panel
- `/admin-profile` - Admin profile management
- `/admin-settings` - Platform settings

#### 5. Universal Routes (Protected)
- `/wallet` - Wallet management
- `/wallet/transactions` - Transaction history
- `/wallet/funding` - Deposit/withdrawal
- `/messages` - Universal messaging
- `/profile` - Universal profile management

### Code Splitting Strategy

The application implements lazy loading for performance optimization:

```typescript
// Critical routes (loaded immediately)
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";

// Lazy-loaded routes (loaded on demand)
const SellerDashboard = lazy(() => import("./screens/SellerDashboard"));
const BuyerDashboard = lazy(() => import("./screens/BuyerDashboard"));
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));
// ... more lazy-loaded components
```

## Component Hierarchy

### 1. Application Level
```
App
├── ToastWrapper (Global notifications)
├── AuthProvider (Authentication context)
└── Router
    └── AppRoutes
        ├── ProfileCompletionHandler
        └── Routes (Route definitions)
```

### 2. Screen Level Components
```
Screen Component
├── Layout Component (Sidebar + Header)
├── Main Content Area
├── Modals/Dialogs
└── Toast Notifications
```

### 3. Layout Components
```
Layout
├── Sidebar (Navigation)
├── Header (Top navigation)
└── Main Content
    ├── Page Header
    ├── Content Cards
    └── Action Buttons
```

## Authentication & Authorization

### Protected Route Component

```typescript
// ProtectedRoute.tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### Authentication Context

The `AuthContext` provides authentication state management:

```typescript
// AuthContext.tsx
export interface AuthContextType {
  user: User | null;
  token: string | null;
  ethAddress: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithMetaMask: (role?: UserRole) => Promise<void>;
  // ... more methods
}
```

### User Roles and Permissions

```typescript
type UserRole = 'buyer' | 'seller' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  user_metadata: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    title?: string;
    about?: string;
    specializations?: string[];
    education?: Education[];
    profile_picture?: string;
    role_title?: string;
    clearance_level?: string;
    email_verified?: boolean;
    eth_address?: string;
    circle_wallet_id?: string;
    circle_wallet_address?: string;
    status?: string;
    verification_status?: string;
    real_email?: string;
  };
}
```

## Layout Components

### 1. Admin Layout (`AdminLayout.tsx`)

```typescript
export const AdminLayout = ({
  children,
  viewMode,
  onNavigate,
  title
}: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar viewMode={viewMode} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col">
        <AdminHeaderMenu title={title} onNavigate={onNavigate} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
```

### 2. Buyer Sidebar (`BuyerSidebar.tsx`)

```typescript
export const BuyerSidebar: React.FC<BuyerSidebarProps> = ({
  activePage = "dashboard",
}) => {
  const { user } = useAuth();
  
  return (
    <div className="w-64 bg-[#1B1828] text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <Link to="/" className="flex items-center gap-3">
          <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
          <div className="text-gray-300 text-sm">
            Legal<br />Marketplace
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link to="/buyer-dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === "dashboard" 
                ? "bg-gray-700 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            }`}>
              <BriefcaseIcon className="w-5 h-5" />
              Dashboard
            </Link>
          </li>
          {/* More navigation items */}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3. Seller Sidebar (`SellerSidebar.tsx`)

Similar structure to BuyerSidebar but with seller-specific navigation:

- Dashboard
- Find Gigs
- My Bids
- Messages
- Earnings
- Profile

### 4. Admin Sidebar (`AdminSidebar.tsx`)

Admin-specific navigation with view mode management:

- Dashboard
- Verify User
- Manage Gigs
- Disputes
- Settings
- Profile

## Screen Components

### 1. Home Screen (`Home.tsx`)

```typescript
export const Home = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-[#282536] border-b border-gray-700 py-4">
        {/* Navigation and branding */}
      </header>

      {/* Hero Section */}
      <section className="w-full py-20 bg-gradient-to-br from-[#1B1828] to-[#282536]">
        {/* Hero content */}
      </section>

      {/* Features Section */}
      <section className="w-full py-20 bg-white">
        {/* Feature cards */}
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 bg-[#1B1828]">
        {/* Call to action */}
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#282536] py-12">
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

### 2. Dashboard Screens

#### Buyer Dashboard (`BuyerDashboard.tsx`)
```typescript
export const BuyerDashboard = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGig, setSelectedGig] = useState<any>(null);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <BuyerSidebar activePage="dashboard" />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {viewMode === "dashboard" && (
            <div className="max-w-7xl mx-auto">
              {/* Dashboard content */}
            </div>
          )}
          {viewMode === "view-bids" && selectedGig && (
            <ViewBids gig={selectedGig} onBack={() => setViewMode("dashboard")} />
          )}
          {/* More view modes */}
        </main>
      </div>
    </div>
  );
};
```

#### Seller Dashboard (`SellerDashboard.tsx`)
Similar structure with seller-specific functionality:
- View available gigs
- Place bids
- Manage ongoing work
- Submit deliverables

#### Admin Dashboard (`AdminDashboard.tsx`)
Admin-specific functionality:
- User verification
- Gig management
- Dispute resolution
- Platform statistics

### 3. Authentication Screens

#### Login Screen (`Login.tsx`)
```typescript
export const Login = (): JSX.Element => {
  const { login, user, signInWithGoogle, signInWithMetaMask } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect logic based on user role
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from);
      } else {
        switch (user.role) {
          case 'admin':
            navigate('/admin-dashboard');
            break;
          case 'seller':
            navigate('/seller-dashboard');
            break;
          case 'buyer':
            navigate('/buyer-dashboard');
            break;
          default:
            navigate('/');
        }
      }
    }
  }, [user, navigate, location]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Login form */}
    </div>
  );
};
```

#### Register Screen (`Register.tsx`)
Similar structure with registration form and role selection.

### 4. Feature Screens

#### Post Gig (`PostGig.tsx`)
- Form for creating legal service requests
- File upload functionality
- Category and budget selection

#### Find Gigs (`FindGigs.tsx`)
- Browse available gigs
- Filter and search functionality
- Bid placement interface

#### Messages (`Messages.tsx`)
- Real-time messaging interface
- Conversation management
- File sharing capabilities

#### Wallet (`Wallet/index.tsx`)
- Wallet dashboard
- Transaction history
- Deposit/withdrawal functionality

## UI Components

### 1. Shadcn/ui Components

The application uses Shadcn/ui components for consistent design:

```typescript
// Button component
import { Button } from "../../components/ui/button";

// Card components
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

// Form components
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

// Dialog components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

// Toast notifications
import { useToast } from "../../components/ui/toast";
```

### 2. Custom UI Components

#### Header Component (`Header.tsx`)
```typescript
export const Header = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo and branding */}
        </div>
        <div className="flex items-center gap-4">
          {/* User menu and notifications */}
        </div>
      </div>
    </header>
  );
};
```

#### Modal Components
- `PaymentMethodModal` - Payment method selection
- `EditProfileModal` - Profile editing
- `ProfileCompletionModal` - Profile completion flow
- `WithdrawFundsModal` - Withdrawal functionality

#### Form Components
- `DisputeForm` - Dispute creation
- `LeaveFeedback` - Feedback submission
- `SecureLegalUpload` - File upload with blockchain verification

### 3. Specialized Components

#### Blockchain Components
- `HashUploader` - File hashing and blockchain upload
- `HashVerifier` - Blockchain verification
- `IPFSUploader` - IPFS file storage

#### Messaging Components
- `MessageContainer` - Main messaging interface
- `MessageThread` - Individual conversation
- `MessageInput` - Message composition
- `FileAttachmentPreview` - File attachment handling

#### Analytics Components
- `AnalyticsDashboard` - Data visualization
- `TransactionVolumeChart` - Transaction metrics
- `UserGrowthChart` - User growth analytics

## State Management

### 1. Context API Usage

```typescript
// AuthContext for authentication state
const { user, login, logout } = useAuth();

// Custom hooks for specific functionality
const { hasPermission } = usePermissions();
const { sendMessage, conversations } = useMessageService();
```

### 2. Local State Management

```typescript
// Screen-level state
const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
const [selectedItem, setSelectedItem] = useState<any>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 3. Form State Management

```typescript
// Form state with validation
const [formData, setFormData] = useState({
  title: "",
  description: "",
  budget: 0,
  deadline: "",
  categories: []
});

const [errors, setErrors] = useState<Record<string, string>>({});
```

## Navigation Patterns

### 1. Role-Based Navigation

```typescript
// Automatic redirection based on user role
useEffect(() => {
  if (user) {
    switch (user.role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'seller':
        navigate('/seller-dashboard');
        break;
      case 'buyer':
        navigate('/buyer-dashboard');
        break;
      default:
        navigate('/');
    }
  }
}, [user, navigate]);
```

### 2. Protected Route Navigation

```typescript
// Redirect to login with return path
if (!user) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}

// Redirect after login
const from = (location.state as any)?.from?.pathname;
if (from) {
  navigate(from);
}
```

### 3. View Mode Navigation

```typescript
// Internal navigation within screens
const handleViewChange = (newView: ViewMode) => {
  setViewMode(newView);
  setSelectedItem(null);
};

// Conditional rendering based on view mode
{viewMode === "dashboard" && <DashboardContent />}
{viewMode === "view-details" && selectedItem && <DetailsView item={selectedItem} />}
```

### 4. Breadcrumb Navigation

```typescript
// Breadcrumb component for complex navigation
const Breadcrumbs = ({ path }: { path: string[] }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500">
      {path.map((item, index) => (
        <React.Fragment key={index}>
          <Link to={item.path} className="hover:text-gray-700">
            {item.label}
          </Link>
          {index < path.length - 1 && <ChevronRightIcon className="w-4 h-4" />}
        </React.Fragment>
      ))}
    </nav>
  );
};
```

## Performance Optimizations

### 1. Code Splitting

```typescript
// Lazy loading for heavy components
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));
const WalletIndex = lazy(() => import("./screens/Wallet"));

// Suspense fallback
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    {/* Routes */}
  </Routes>
</Suspense>
```

### 2. Component Memoization

```typescript
// Memoized components for performance
const MemoizedSidebar = React.memo(SellerSidebar);
const MemoizedHeader = React.memo(Header);
```

### 3. Optimized Re-renders

```typescript
// Custom hooks for optimized state management
const useOptimisticMessages = () => {
  // Optimistic updates for messaging
};

const useMessageSubscriptions = () => {
  // Real-time message subscriptions
};
```

## Error Handling

### 1. Error Boundaries

```typescript
// Error boundary for component error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 2. Loading States

```typescript
// Loading states for async operations
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return <LoadingSpinner />;
}
```

### 3. Error Notifications

```typescript
// Toast notifications for errors
const { toast } = useToast();

const handleError = (error: Error) => {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  });
};
```

## Development Guidelines

### 1. Component Structure

```typescript
// Standard component structure
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handleClick = () => {
    // Event handling
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### 2. File Organization

```
components/
├── ComponentName/
│   ├── ComponentName.tsx
│   ├── index.ts
│   └── types.ts (if needed)
```

### 3. Naming Conventions

- Components: PascalCase (`SellerDashboard`)
- Files: PascalCase (`SellerDashboard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Types: PascalCase (`UserRole`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

---

*This documentation is maintained by the Ile Legal development team. Last updated: January 2024*
