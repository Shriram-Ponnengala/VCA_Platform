import { BatchesRepository } from './batches.repository';
import { prisma } from '@vca/database';

const repo = new BatchesRepository();

export class BatchesService {
  async getAll(user?: any) { return repo.findAll(user); }
  async getById(id: string) { return repo.findById(id); }
  
  async create(data: any) { 
    const allowedFields = [
      'className', 'coachId', 'program', 'type', 
      'startDate', 'days', 'startTime', 'endTime', 'status'
    ];
    
    const createData: any = {};
    if (data.name) createData.className = data.name;
    if (data.className) createData.className = data.className;

    // Resolve Coach ID if User ID was passed
    const userId = data.coachId;
    if (userId) {
      const coachByUserId = await prisma.coach.findUnique({ where: { userId } });
      if (coachByUserId) {
        createData.coachId = coachByUserId.id;
      } else {
        const coachById = await prisma.coach.findUnique({ where: { id: userId } });
        if (coachById) {
          createData.coachId = userId;
        } else {
          // Auto-create missing coach profile
          try {
            const newCoach = await prisma.coach.create({ data: { userId } });
            createData.coachId = newCoach.id;
          } catch (e) {
            throw new Error(`Invalid coach: No profile found and could not create one for ID ${userId}`);
          }
        }
      }
    }

    // Map other fields
    for (const field of allowedFields) {
      if (data[field] !== undefined && field !== 'className' && field !== 'coachId') {
        createData[field] = data[field];
      }
    }

    return repo.create(createData); 
  }

  async update(id: string, data: any) { 
    // Filter to only include fields present in the Class model
    const allowedFields = [
      'className', 'coachId', 'program', 'type', 
      'startDate', 'days', 'startTime', 'endTime', 'status'
    ];
    
    const updateData: any = {};
    
    if (data.name) updateData.className = data.name;
    if (data.className) updateData.className = data.className;

    // Resolve Coach ID if User ID was passed
    const userId = data.coachId;
    if (userId) {
      const coachByUserId = await prisma.coach.findUnique({ where: { userId } });
      if (coachByUserId) {
        updateData.coachId = coachByUserId.id;
      } else {
        const coachById = await prisma.coach.findUnique({ where: { id: userId } });
        if (coachById) {
          updateData.coachId = userId;
        } else {
          // Auto-create missing coach profile
          try {
            const newCoach = await prisma.coach.create({ data: { userId } });
            updateData.coachId = newCoach.id;
          } catch (e) {
            throw new Error(`Invalid coach: No profile found and could not create one for ID ${userId}`);
          }
        }
      }
    }

    // Map other fields
    for (const field of allowedFields) {
      if (data[field] !== undefined && field !== 'className' && field !== 'coachId') {
        updateData[field] = data[field];
      }
    }
    
    return repo.update(id, updateData); 
  }

  async delete(id: string) { return repo.delete(id); }
  
  async enroll(batchId: string, studentId: string) {
    return repo.enroll(batchId, studentId);
  }

  async unenroll(batchId: string, studentId: string) {
    return repo.unenroll(batchId, studentId);
  }

  async markAttendance(batchId: string, payload: any, user: any) {
    return repo.markAttendance(batchId, payload, user);
  }

  async rescheduleClass(batchId: string, payload: any) {
    return repo.rescheduleClass(batchId, payload);
  }
}
