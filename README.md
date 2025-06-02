# Ilé Legal Marketplace

A modern legal services marketplace connecting property developers with verified legal professionals across Africa.

## Features

- 🏢 **Property Developer Portal**
  - Post legal service requests
  - Manage active gigs
  - Review and accept bids
  - Secure payment processing
  - Document management

- ⚖️ **Legal Professional Portal**
  - Browse available gigs
  - Place competitive bids
  - Manage active projects
  - Submit deliverables
  - Track earnings

- 🛡️ **Admin Dashboard**
  - Verify legal professionals
  - Monitor transactions
  - Handle disputes
  - Manage platform settings

## Tech Stack

- **Frontend**: React 18.3 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **Real-time**: Socket.IO
- **UI Components**: Headless UI
- **Icons**: Lucide React
- **Payments**: Stripe

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ile-legal-marketplace.git
cd ile-legal-marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_SOCKET_URL=your_socket_url
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React context providers
├── hooks/           # Custom React hooks
├── layouts/         # Page layout components
├── lib/            # Third-party library configurations
├── pages/          # Page components
├── services/       # API service functions
├── store/          # Global state management
└── utils/          # Utility functions
```

## Key Features

### Authentication
- Role-based access control (Buyer/Seller/Admin)
- Secure session management
- Protected routes

### Real-time Features
- Live messaging system
- Instant notifications
- Typing indicators

### File Management
- Secure file upload/download
- Multiple file type support
- Progress tracking

### Payments
- Secure payment processing
- Escrow system
- Transaction history

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com)
- [React](https://reactjs.org)
- [Vite](https://vitejs.dev)
- [Lucide Icons](https://lucide.dev)