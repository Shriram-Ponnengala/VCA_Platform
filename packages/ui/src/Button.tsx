import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'default' | 'icon';
}

export function Button({ 
  className = '', 
  variant = 'primary', 
  size = 'default',
  children, 
  ...props 
}: ButtonProps) {
  const rootClass = [
    styles.button,
    styles[variant],
    size === 'icon' ? styles.icon : '',
    props.disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={rootClass} {...props}>
      {children}
    </button>
  );
}
