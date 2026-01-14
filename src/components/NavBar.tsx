'use client';

/**
 * NavBar - Main navigation component
 * Modern design with Oxford Blue background and Gold accents
 */

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './ClientSessionProvider';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Network, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

// Add dropdown menu component
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

interface NavBarProps {
  onModelerClick?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onModelerClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleSignOut = async () => {
    await signOut();
  };
  
  const toggleNavbar = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  const handleModelerClick = () => {
    if (pathname === '/modeler' && onModelerClick) {
      onModelerClick();
    } else {
      router.push('/modeler');
    }
    setIsNavExpanded(false);
  };

  const NavLink = ({ href, isActive, children, onClick }: { 
    href?: string; 
    isActive: boolean; 
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const baseClasses = "px-3 py-2 rounded-md font-medium flex items-center gap-2 transition-colors";
    const activeClasses = isActive 
      ? "text-gold bg-white/10" 
      : "text-white/90 hover:bg-white/10 hover:text-gold";
    
    if (onClick) {
      return (
        <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
          {children}
        </button>
      );
    }
    
    return (
      <Link href={href || '#'} className={`${baseClasses} ${activeClasses}`}>
        {children}
      </Link>
    );
  };

  return (
    <header 
      className={`fixed top-0 z-50 w-full transition-all duration-300 ease-in-out ${
        scrolled 
          ? 'shadow-lg bg-oxford-blue/95 backdrop-blur-md' 
          : 'bg-oxford-blue'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image 
                src="/rose-logo.png"
                alt="ROSE Playbook"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </motion.div>
            <span className="text-xl font-bold text-gold group-hover:text-gold-light transition-colors hidden sm:block">
              ROSE Playbook
            </span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={toggleNavbar}
            aria-expanded={isNavExpanded}
            aria-label="Toggle navigation"
          >
            {isNavExpanded ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Navigation Menu */}
          <div 
            className={`${
              isNavExpanded 
                ? 'block absolute top-16 left-0 right-0 bg-oxford-blue shadow-lg p-4 border-t border-white/10' 
                : 'hidden'
            } md:flex md:items-center md:static md:p-0 md:bg-transparent md:shadow-none md:border-none`}
          >
            <nav className="flex flex-col md:flex-row md:items-center gap-1">
              {user ? (
                <>
                  <NavLink href="/dashboard" isActive={pathname === '/dashboard' || pathname?.startsWith('/dashboard/')}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                  
                  <NavLink isActive={pathname === '/modeler'} onClick={handleModelerClick}>
                    <Network className="h-4 w-4" />
                    Modeler
                  </NavLink>
                  
                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors ml-2">
                        <div className="w-8 h-8 rounded-full bg-gold text-oxford-blue flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="hidden md:block max-w-[100px] truncate text-sm">
                          {user.email?.split('@')[0]}
                        </span>
                        <ChevronDown className="h-4 w-4 text-white/70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Signed in as</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <NavLink href="/login" isActive={pathname === '/login'}>
                    <LogIn className="h-4 w-4" />
                    Login
                  </NavLink>
                  
                  <Button 
                    asChild
                    className="bg-gold text-oxford-blue hover:bg-gold-light ml-2"
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
