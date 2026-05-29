import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'HAQMS - Hospital Appointment & Queue Management',
  description: 'Deliberately imperfect queue and scheduling application for assessment purposes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans min-h-screen gradient-bg">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
