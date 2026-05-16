import { UsersRepository } from './users.repository';
import bcrypt from 'bcryptjs';
import { prisma } from '@vca/database';

const repo = new UsersRepository();

export class UsersService {
  async getAll(role?: string) { return repo.findAll(role); }
  
  private async resolveUserId(id: string): Promise<string> {
    // 1. Try finding as User ID
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return id;

    // 2. Try finding as Student ID
    const student = await prisma.student.findUnique({ where: { id } });
    if (student) return student.userId;

    // 3. Try finding as Coach ID
    const coach = await prisma.coach.findUnique({ where: { id } });
    if (coach) return coach.userId;

    return id; // Fallback
  }

  async getById(id: string) { 
    const resolvedId = await this.resolveUserId(id);
    return repo.findById(resolvedId); 
  }
  
  async create(data: any) { 
    // Filter to only include fields present in the User model
    const allowedUserFields = [
      'username', 'passwordHash', 'role', 'firstName', 'middleName', 
      'lastName', 'email', 'mobile', 'countryCode', 'dob', 'country', 'city'
    ];

    // Handle password hashing
    const password = data.password || 'welcome123'; // Default password if none provided
    const passwordHash = await bcrypt.hash(password, 10);
    
    const createData: any = {
      passwordHash,
    };

    // Map allowed user fields
    allowedUserFields.forEach(field => {
      if (data[field] !== undefined && field !== 'passwordHash') {
        createData[field] = data[field];
      }
    });

    // Handle profile-specific data separately for nested creation
    const { 
      parentFirstName, parentMiddleName, parentLastName,
      secParentFirstName, secParentMiddleName, secParentLastName,
      specialization, bio
    } = data;

    // If it's a student, prepare the student relation
    if (data.role === 'STUDENT') {
      createData.student = {
        create: {
          parentFirstName: parentFirstName || '',
          parentMiddleName: parentMiddleName || '',
          parentLastName: parentLastName || '',
          secParentFirstName: secParentFirstName || '',
          secParentMiddleName: secParentMiddleName || '',
          secParentLastName: secParentLastName || '',
        }
      };
    } else if (data.role === 'COACH') {
      createData.coach = {
        create: {
          specialization: specialization || '',
          bio: bio || ''
        }
      };
    }

    return repo.create(createData); 
  }

  async update(id: string, data: any) { 
    const resolvedId = await this.resolveUserId(id);
    
    // Filter to only include fields present in the User model
    const allowedUserFields = [
      'username', 'passwordHash', 'role', 'firstName', 'middleName', 
      'lastName', 'email', 'mobile', 'countryCode', 'dob', 'country', 'city'
    ];

    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }

    const updateData: any = {};
    
    // Map allowed user fields
    allowedUserFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Handle profile-specific data separately for nested update
    const { 
      parentFirstName, parentMiddleName, parentLastName,
      secParentFirstName, secParentMiddleName, secParentLastName,
      specialization, bio
    } = data;

    // Find the user first to check their role
    const user = await repo.findById(resolvedId);
    if (!user) throw new Error('User not found');

    if (user.role === 'STUDENT') {
      const studentUpdate: any = {};
      if (parentFirstName !== undefined) studentUpdate.parentFirstName = parentFirstName;
      if (parentMiddleName !== undefined) studentUpdate.parentMiddleName = parentMiddleName;
      if (parentLastName !== undefined) studentUpdate.parentLastName = parentLastName;
      if (secParentFirstName !== undefined) studentUpdate.secParentFirstName = secParentFirstName;
      if (secParentMiddleName !== undefined) studentUpdate.secParentMiddleName = secParentMiddleName;
      if (secParentLastName !== undefined) studentUpdate.secParentLastName = secParentLastName;

      if (Object.keys(studentUpdate).length > 0) {
        updateData.student = { update: studentUpdate };
      }
    } else if (user.role === 'COACH') {
      const coachUpdate: any = {};
      if (specialization !== undefined) coachUpdate.specialization = specialization;
      if (bio !== undefined) coachUpdate.bio = bio;

      if (Object.keys(coachUpdate).length > 0) {
        updateData.coach = { update: coachUpdate };
      }
    }

    return repo.update(resolvedId, updateData); 
  }

  async delete(id: string) { 
    const resolvedId = await this.resolveUserId(id);
    return repo.delete(resolvedId); 
  }
}
