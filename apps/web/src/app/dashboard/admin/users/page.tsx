'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { Button } from '@vca/ui';
import { Badge } from '@vca/ui';
import { Modal } from '@vca/ui';
import { useUsers, User } from '@/lib/hooks/useUsers';
import { ConfirmModal } from '@vca/ui';
import { Toast } from '@vca/ui';
import styles from './users.module.css';

export default function UsersPage() {
  const { users, isLoaded, addUser, updateUser, deleteUser } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'COACH' | 'STUDENT'>('ALL');
  
  const [formData, setFormData] = useState({
    username: '',
    role: 'STUDENT',
    password: ''
  });

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        role: editingUser.role,
        password: '' // Don't show password
      });
    } else {
      setFormData({
        username: '',
        role: 'STUDENT',
        password: ''
      });
    }
  }, [editingUser, isModalOpen]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setToast({ message: 'User deleted successfully!', type: 'success' });
      setUserToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await updateUser(editingUser.id, { 
        username: formData.username, 
        role: formData.role as any,
        password: formData.password || undefined
      });
      setToast({ message: 'User updated successfully!', type: 'success' });
      setIsModalOpen(false);
      setEditingUser(null);
    } else {
      const newUserId = await addUser({ 
        username: formData.username, 
        role: formData.role as any,
        password: formData.password
      });
      if (newUserId) {
        setToast({ message: 'User created successfully!', type: 'success' });
        setIsModalOpen(false);
        setEditingUser(null);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isLoaded) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage all academy members and their roles.</p>
        </div>
        <Button className={styles.addBtn} onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
          <UserPlus size={18} />
          Add New User
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.roleFilterWrapper}>
          <select 
            className={styles.roleFilterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="COACH">Coaches</option>
            <option value="STUDENT">Students</option>
          </select>
          <Filter size={18} className={styles.filterIcon} />
        </div>
      </div>


      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {user.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.fullName}>
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No Name'}
                      </span>
                      <span className={styles.username}>{user.username}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={user.role === 'ADMIN' ? 'admin' : user.role === 'COACH' ? 'coach' : 'student'}>
                    {user.role}
                  </Badge>
                </td>
                <td>{user.createdAt}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.actionBtn} 
                      title="Edit"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className={styles.actionBtnDelete} 
                      title="Delete"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input 
              type="text" 
              placeholder="e.g. johndoe" 
              className={styles.input} 
              required 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <select 
              className={styles.select} 
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="STUDENT">Student</option>
              <option value="COACH">Coach</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{editingUser ? 'New Password (Optional)' : 'Password'}</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={styles.input} 
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <Button type="submit" className={styles.saveBtn}>
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </form>
      </Modal>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This will permanently remove their access to the platform."
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
}

