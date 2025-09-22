"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  Menu,
  X,
  MapPin,
  Users,
  Shield,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const roleName =
    user?.role ||
    (user?.type === "admin" ? "ADMIN" : user ? "CITIZEN" : undefined);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Project Name */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-primary rounded-lg p-2">
              <MapPin className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                JanSamvedan
              </h1>
              <p className="text-xs text-muted-foreground">
                Smart India Hackathon
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <div className="flex items-center space-x-2">
                <Badge variant="default">
                  {roleName === "CITIZEN" && (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      Citizen
                    </>
                  )}
                  {roleName === "ADMIN" && (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </>
                  )}
                  {roleName === "NGO" && (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      NGO
                    </>
                  )}
                </Badge>
              </div>
            )}

            {user && roleName === "CITIZEN" && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/report"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Report Issue
                </Link>
                <Link
                  href="/my-reports"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  My Reports
                </Link>
                <Link
                  href="/map"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  City Map
                </Link>
              </div>
            )}

            {user && roleName === "NGO" && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/ngo/dashboard"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/map"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  City Map
                </Link>
              </div>
            )}

            {user && roleName === "ADMIN" && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/reports"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/map"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Map View
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Analytics
                </Link>
              </div>
            )}

            {/* Language Selector */}
            <Select defaultValue="en">
              <SelectTrigger className="w-32">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
              </SelectContent>
            </Select>

            {user ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/signout">Sign out</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>
                          {user.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/signout" className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-4">
              {user && roleName === "CITIZEN" && (
                <div className="space-y-2">
                  <Link
                    href="/report"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    Report Issue
                  </Link>
                  <Link
                    href="/my-reports"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    My Reports
                  </Link>
                  <Link
                    href="/map"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    City Map
                  </Link>
                </div>
              )}

              {user && roleName === "ADMIN" && (
                <div className="space-y-2">
                  <Link
                    href="/admin"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    Reports
                  </Link>
                  <Link
                    href="/admin/map"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    Map View
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    Analytics
                  </Link>
                </div>
              )}

              {/* Language Selector */}
              <Select defaultValue="en">
                <SelectTrigger>
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                </SelectContent>
              </Select>

              {user ? (
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="block text-sm font-medium text-foreground hover:text-primary"
                  >
                    Profile
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href="/signout">Logout</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="ghost" className="flex-1" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/signup">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
