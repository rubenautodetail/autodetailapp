"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types for Strapi authentication
export interface User {
  id: string;
  username: string;
  email: string;
  role: "customer" | "contractor" | "admin";
  firstName?: string;
  lastName?: string;
  phone?: string;
  locale?: "en" | "es";
}

interface AuthContextType {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: "customer" | "contractor",
    additionalData?: Partial<User>
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount (check Strapi JWT)
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Validate token with Strapi
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear it
        localStorage.removeItem("jwt");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("jwt");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Login with Strapi
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: email,
            password: password,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Login failed");
      }

      const data = await response.json();

      // Store JWT token
      localStorage.setItem("jwt", data.jwt);

      // Set user
      setUser(data.user);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Action: Register with Strapi
  const register = async (
    email: string,
    password: string,
    role: "customer" | "contractor",
    additionalData?: Partial<User>
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email.split("@")[0], // Use email prefix as username
            email: email,
            password: password,
            role: role,
            ...additionalData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Registration failed");
      }

      const data = await response.json();

      // Store JWT token
      localStorage.setItem("jwt", data.jwt);

      // Set user
      setUser(data.user);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Action: Logout
  const logout = async () => {
    localStorage.removeItem("jwt");
    setUser(null);
  };

  // Action: Update user profile
  const updateUser = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token || !user) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
