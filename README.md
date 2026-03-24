# AEGIS - Intelligent Vision System Dashboard

A comprehensive security monitoring dashboard built with React, TypeScript, and Tailwind CSS. Features real-time camera monitoring, advanced AI detection capabilities, and a modern dark mode interface.

## 🚀 Features

### Core Functionality
- **Real-time Camera Monitoring**: Live video feeds with multiple layout options
- **AI-Powered Detection**: Object, weapon, face, running, loitering, and crowd detection
- **Alert Management**: Real-time alerts with filtering and detailed information
- **Analytics Dashboard**: Comprehensive statistics and trend analysis
- **Camera Configuration**: Easy camera setup and management
- **Face Recognition**: User database with facial recognition capabilities

### User Experience
- **Persistent Dark Mode**: User preference saved across sessions
- **Responsive Design**: Optimized for desktop and tablet viewing
- **Professional UI**: Modern, clean interface with smooth transitions
- **Custom Modals**: Professional confirmation dialogs and user interactions
- **Real-time Updates**: Live data updates without page refreshes

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom AEGIS theme
- **State Management**: React Context API
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Charts**: D3.js for data visualization

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aegis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## 🏗 Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   ├── Dashboard.tsx    # Dashboard overview
│   │   ├── LiveMonitoring.tsx # Live camera feeds
│   │   ├── FaceRecognition.tsx # Face recognition
│   │   ├── Alerts.tsx       # Alert management
│   │   ├── Analytics.tsx    # Data analytics
│   │   ├── CameraConfig.tsx # Camera configuration
│   │   ├── AddCamera.tsx    # Add new camera
│   │   └── Settings.tsx     # System settings
│   ├── hooks/               # Custom React hooks
│   │   ├── useSharedDarkMode.tsx # Persistent dark mode
│   │   └── useDarkMode.tsx  # Dark mode management
│   ├── context/             # React context providers
│   │   └── UserContext.tsx  # User authentication context
│   └── App.tsx              # Main application component
├── styles/
│   ├── index.css            # Main stylesheet
│   ├── theme.css            # AEGIS theme variables
│   └── fonts.css            # Font definitions
└── main.tsx                 # Application entry point
```

## 🎨 Theme System

### Dark Mode Implementation
AEGIS features a comprehensive dark mode system with:

- **Persistent Storage**: User preference saved in localStorage
- **Instant Application**: No flash of incorrect theme on page load
- **Component Integration**: All components support dark mode
- **Professional Design**: Carefully crafted color schemes for both modes

### Theme Variables
```css
/* Light Mode */
--aegis-bg-primary: #ffffff;
--aegis-text-primary: #0f172a;
--aegis-primary: #3b82f6;

/* Dark Mode */
--aegis-bg-primary: #0f172a;
--aegis-text-primary: #f8fafc;
--aegis-primary: #3b82f6;
```

## 🔧 Configuration

### Environment Setup
The application supports both development and production configurations:

1. **Development**: Uses local mock data
2. **Production**: Connects to backend API

### Backend Integration
Configure the backend connection in the environment files:
- `.env.example` - Template configuration
- `.env` - Active configuration (not tracked in git)

## 📱 Pages & Features

### Dashboard
- System overview with key metrics
- Recent activity summary
- Quick access to all features
- Real-time status indicators

### Live Monitoring
- Multi-camera grid view
- Layout options (1, 2, 4, 6 cameras)
- Real-time event feed
- Camera controls and settings

### Face Recognition
- User database management
- Face detection and matching
- User profile management
- Recognition history

### Alerts
- Real-time alert notifications
- Alert filtering and search
- Detailed alert information
- Alert acknowledgment system

### Analytics
- Detection statistics
- Trend analysis
- Performance metrics
- Export capabilities

### Camera Configuration
- Camera list and status
- Individual camera settings
- Detection feature toggles
- Camera deletion with confirmation

### Add Camera
- Predefined configuration templates
- Custom configuration builder
- Previously used configurations
- Real-time validation

### Settings
- Detection thresholds
- Alert preferences
- System configuration
- Dark mode toggle

## 🔄 State Management

### Dark Mode Hook
```typescript
const { darkMode, setDarkMode } = useSharedDarkMode();
```

Features:
- Automatic localStorage persistence
- Cross-component synchronization
- Initial load from stored preference
- Real-time document class updates

### User Context
```typescript
const { user, login, logout } = useUser();
```

Handles:
- User authentication
- Session management
- User profile data
- Logout functionality

## 🎯 Key Improvements

### UI/UX Enhancements
- **Professional Modals**: Replaced browser alerts with custom confirmations
- **Dark Mode**: Complete theme system with persistence
- **Responsive Design**: Optimized for various screen sizes
- **Smooth Transitions**: Professional animations and hover states

### Technical Improvements
- **TypeScript**: Full type safety across the application
- **Component Architecture**: Modular, reusable components
- **State Management**: Efficient state handling with hooks
- **Performance**: Optimized rendering and data handling

### Code Quality
- **Clean Architecture**: Well-organized file structure
- **Reusable Components**: Consistent design patterns
- **Error Handling**: Robust error management
- **Documentation**: Clear code comments and structure

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Environment Variables
Ensure all required environment variables are set before deployment:
- API endpoints
- Authentication tokens
- Feature flags

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Original Design

The original design concept is available at:
[Figma Design](https://www.figma.com/design/tv7o54EW674EQkgSkaZWOn/Intelligent-Vision-System-Dashboard)

## 📞 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue for bugs or feature requests

---

**AEGIS Vision System** - Advanced Security Monitoring Solution