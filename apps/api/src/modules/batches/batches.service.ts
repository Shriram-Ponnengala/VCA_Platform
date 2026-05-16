import { BatchesRepository } from './batches.repository';
import { prisma } from '@vca/database';

const repo = new BatchesRepository();

export class BatchesService {
  async getAll() { return repo.findAll(); }
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
      const coach = await prisma.coach.findUnique({
        where: { userId }
      });
      if (coach) {
        createData.coachId = coach.id;
      } else {
        createData.coachId = userId;
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
      const coach = await prisma.coach.findUnique({
        where: { userId }
      });
      if (coach) {
        updateData.coachId = coach.id;
      } else {
        updateData.coachId = userId;
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
}
