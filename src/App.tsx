import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from "@/lib/DataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Profile from "@/pages/Profile";
import Upload from "@/pages/Upload";
import Chat from "@/pages/Chat";
import Dashboard from "@/pages/Dashboard";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <Router>
        <DataProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background" data-background="true">
              <Layout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute>
                        <Upload />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Redirect root to dashboard if authenticated, otherwise to signin */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
              <Toaster />
            </div>
          </AuthProvider>
        </DataProvider>
      </Router>
    </ThemeProvider>
  );
}
