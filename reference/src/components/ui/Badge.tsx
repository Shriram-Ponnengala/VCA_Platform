import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'active' | 'student' | 'coach' | 'admin' | 'program';
}

export function Badge({ 
  className = '', 
  children, 
  variant = 'active', 
  ...props 
}: BadgeProps) {
  const variantClass = styles[variant] || '';
  
  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
