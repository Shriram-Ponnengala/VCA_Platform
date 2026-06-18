'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useBatches } from '@/lib/hooks/useBatches';
import { extractBatchId } from '@/lib/utils/urlUtils';
import styles from './Breadcrumbs.module.css';

function DynamicLabel({ path, defaultLabel, prevPath }: { path: string, defaultLabel: string, prevPath?: string }) {
  const [label, setLabel] = React.useState(defaultLabel);
  const { batches } = useBatches();

  React.useEffect(() => {
    if (prevPath === 'batches' && batches.length > 0) {
      const batchId = extractBatchId(path, batches);
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        setLabel(batch.name);
        return;
      }
    }

    if (path.length >= 20 && prevPath) {
      let endpoint = '';
      if (prevPath === 'students') endpoint = `/api/students/${path}`;
      else if (prevPath === 'coaches') endpoint = `/api/coaches/${path}`;
      else if (prevPath === 'users') endpoint = `/api/users/${path}`;

      if (endpoint) {
        fetch(endpoint)
          .then(res => {
            if (!res.ok) throw new Error('Not found');
            return res.json();
          })
          .then(data => {
            if (data) {
              const name = data.name || data.className || (data.user ? `${data.user.firstName} ${data.user.lastName}` : null) || data.username;
              if (name) setLabel(name);
            }
          })
          .catch(() => {}); // silently fail and keep default label
      }
    }
  }, [path, prevPath, batches]);

  return <>{label}</>;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Split pathname and filter out empty strings
  const paths = pathname.split('/').filter(p => p);
  
  // Skip the first 'dashboard' and 'admin' if present to simplify
  const displayPaths = paths.slice(2);
  
  if (displayPaths.length === 0) return null;

  return (
    <nav className={styles.breadcrumbs}>
      <Link href="/dashboard/coach" className={styles.homeLink}>
        <Home size={14} />
      </Link>
      
      {displayPaths.map((path, index) => {
        const encodedPaths = paths.map(p => encodeURIComponent(p));
        const href = `/${encodedPaths.slice(0, index + 3).join('/')}`;
        const isLast = index === displayPaths.length - 1;
        const prevPath = index > 0 ? displayPaths[index - 1] : undefined;
        
        // Format label: capitalize and replace dashes with spaces
        const defaultLabel = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
        
        let finalHref = href;
        if (path === 'sessions' || path === 'students') {
          // Point these intermediate plural folders back to their parent context
          finalHref = `/${encodedPaths.slice(0, index + 2).join('/')}`;
        }
        
        return (
          <React.Fragment key={path}>
            <ChevronRight size={14} className={styles.separator} />
            {isLast ? (
              <span className={styles.current}>
                <DynamicLabel path={path} defaultLabel={defaultLabel} prevPath={prevPath} />
              </span>
            ) : (
              <Link href={finalHref} className={styles.link}>
                <DynamicLabel path={path} defaultLabel={defaultLabel} prevPath={prevPath} />
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
