'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Split pathname and filter out empty strings
  const paths = pathname.split('/').filter(p => p);
  
  // Skip the first 'dashboard' and 'admin' if present to simplify
  const displayPaths = paths.slice(2);
  
  if (displayPaths.length === 0) return null;

  return (
    <nav className={styles.breadcrumbs}>
      <Link href="/dashboard/admin" className={styles.homeLink}>
        <Home size={14} />
      </Link>
      
      {displayPaths.map((path, index) => {
        const href = `/${paths.slice(0, index + 3).join('/')}`;
        const isLast = index === displayPaths.length - 1;
        
        // Format label: capitalize and replace dashes with spaces
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        
        return (
          <React.Fragment key={path}>
            <ChevronRight size={14} className={styles.separator} />
            {isLast ? (
              <span className={styles.current}>{label}</span>
            ) : (
              <Link href={href} className={styles.link}>{label}</Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
