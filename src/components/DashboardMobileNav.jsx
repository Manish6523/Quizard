

// src/components/DashboardMobileNav.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Sparkles, FileText, BarChart3, Settings, CreditCard } from 'lucide-react'; // 1. Import all icons here
import { cn } from '@/lib/utils';

// 2. Create a mapping from string names to the actual components
const icons = {
  FileText,
  BarChart3,
  Settings,
  CreditCard,
};

export function DashboardMobileNav({ dashboardNav, className }) {
  const pathname = usePathname();

  return (
    <nav className={cn("grid items-start gap-2 text-sm font-medium", className)}>
      <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-3 text-lg font-semibold mb-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <span>Quizard</span>
      </Link>
      {dashboardNav.map((item) => {
        // 3. Look up the icon component from the mapping object
        const IconComponent = icons[item.icon];
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === item.href && "bg-muted text-primary"
            )}
          >
            {/* 4. Render the dynamically chosen icon component */}
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {item.name}
            {item.name === 'Analytics' && (
              <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                3
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  );
}