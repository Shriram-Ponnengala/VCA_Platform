import { Request, Response } from 'express';
import { prisma } from '@vca/database';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

export class ClassroomController {
  async startClassroom(req: Request, res: Response) {
    try {
      const { batchId } = req.body;
      if (!batchId) {
        return res.status(400).json({ error: 'batchId is required' });
      }

      // 1. Coach logged in?
      const token = req.cookies['auth-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let payload;
      try {
        const { payload: jwtPayload } = await jose.jwtVerify(token, JWT_SECRET);
        payload = jwtPayload;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      if (payload.role !== 'COACH') {
        return res.status(403).json({ error: 'Only coaches can start a classroom' });
      }

      // 2. Owns batch?
      // First find the coach record for this user
      const coach = await prisma.coach.findUnique({
        where: { userId: payload.id as string }
      });

      if (!coach) {
        return res.status(403).json({ error: 'Coach profile not found' });
      }

      // Find the batch (Class)
      const batchIdStr = String(batchId);
      const batch = await prisma.class.findUnique({
        where: { id: batchIdStr }
      });

      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }

      if (batch.coachId !== coach.id) {
        return res.status(403).json({ error: 'You do not own this batch' });
      }

      // 3. Classroom already running?
      const existingClassroom = await prisma.classroom.findFirst({
        where: {
          batch_id: batchIdStr,
          status: 'ACTIVE'
        }
      });

      if (existingClassroom) {
        return res.status(400).json({ 
          error: 'Classroom already running', 
          classroomId: existingClassroom.id 
        });
      }

      // Create Classroom
      const classroom = await prisma.classroom.create({
        data: {
          batch_id: batchIdStr,
          status: 'ACTIVE',
          started_at: new Date()
        }
      });

      return res.json({ classroomId: classroom.id });
    } catch (e: any) {
      console.error('Error starting classroom:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async endClassroom(req: Request, res: Response) {
    try {
      const { batchId } = req.body;
      if (!batchId) return res.status(400).json({ error: 'batchId is required' });

      // 1. Coach/Admin logged in?
      const token = req.cookies['auth-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      let payload;
      try {
        const { payload: jwtPayload } = await jose.jwtVerify(token, JWT_SECRET);
        payload = jwtPayload;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      if (payload.role !== 'COACH' && payload.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only coaches or admins can end a classroom' });
      }

      // 2. Owns batch? (skip if Admin)
      const batchIdStr = String(batchId);
      if (payload.role !== 'ADMIN') {
        const coach = await prisma.coach.findUnique({ where: { userId: payload.id as string } });
        if (!coach) return res.status(403).json({ error: 'Coach profile not found' });

        const batch = await prisma.class.findUnique({ where: { id: batchIdStr } });
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        if (batch.coachId !== coach.id) return res.status(403).json({ error: 'You do not own this batch' });
      }

      // 3. Find active classroom
      const existingClassroom = await prisma.classroom.findFirst({
        where: { batch_id: batchIdStr, status: 'ACTIVE' }
      });

      if (!existingClassroom) {
        return res.status(404).json({ error: 'No active classroom found to end' });
      }

      // Update to ENDED
      await prisma.classroom.update({
        where: { id: existingClassroom.id },
        data: {
          status: 'ENDED',
          ended_at: new Date()
        }
      });

      // Call realtime server to destroy room and disconnect users
      try {
        await fetch(`http://socket:4001/internal/end-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId: batchIdStr })
        });
      } catch (e) {
        console.error('Failed to notify realtime server to end room:', e);
      }

      return res.json({ success: true });
    } catch (e: any) {
      console.error('Error ending classroom:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async validateJoin(req: Request, res: Response) {
    try {
      const { batchId } = req.params;

      // 1. Authenticated?
      const token = req.cookies['auth-token'];
      if (!token) {
        return res.status(401).json({ allowed: false, error: 'Unauthorized' });
      }

      let payload;
      try {
        const { payload: jwtPayload } = await jose.jwtVerify(token, JWT_SECRET);
        payload = jwtPayload;
      } catch (err) {
        return res.status(401).json({ allowed: false, error: 'Invalid token' });
      }

      const batchIdStr = String(batchId);
      let isMember = false;
      let userRole = typeof payload.role === 'string' ? payload.role.toLowerCase() : '';

      // 2. Batch membership?
      if (payload.role === 'ADMIN') {
        isMember = true;
      } else if (payload.role === 'COACH') {
        const coach = await prisma.coach.findUnique({ where: { userId: payload.id as string } });
        if (!coach) return res.status(403).json({ allowed: false, error: 'Coach profile not found' });
        
        const batch = await prisma.class.findUnique({ where: { id: batchIdStr } });
        if (batch && batch.coachId === coach.id) {
          isMember = true;
        }
      } else if (payload.role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId: payload.id as string } });
        if (!student) return res.status(403).json({ allowed: false, error: 'Student profile not found' });
        
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            classId: batchIdStr,
            studentId: student.id
          }
        });
        if (enrollment) {
          isMember = true;
        }
      }

      if (!isMember) {
        return res.status(403).json({ allowed: false, error: 'You are not a member of this batch' });
      }

      // 3. Classroom ACTIVE?
      const classroom = await prisma.classroom.findFirst({
        where: {
          batch_id: batchIdStr,
          status: 'ACTIVE'
        }
      });

      if (!classroom) {
        return res.status(404).json({ allowed: false, error: 'No active classroom found for this batch' });
      }

      return res.json({
        allowed: true,
        role: userRole,
        classroomId: classroom.id
      });
    } catch (e: any) {
      console.error('Error validating join:', e);
      return res.status(500).json({ allowed: false, error: 'Internal server error' });
    }
  }
}