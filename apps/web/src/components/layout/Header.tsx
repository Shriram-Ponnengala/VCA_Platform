import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  userName?: string;
}

export function Header({ title, userName = 'User' }: HeaderProps) {
  const initials = userName.substring(0, 2).toUpperCase();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.userInfo}>
        <span className={styles.userName}>{userName}</span>
        <div className={styles.avatar}>
          {initials}
        </div>
      </div>
    </header>
  );
}
