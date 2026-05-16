import { prisma } from '@vca/database';

export class ProgramsRepository {
  async findAll() { return prisma.program.findMany({ include: { topics: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } }); }
  async findById(id: string) { return prisma.program.findUnique({ where: { id }, include: { topics: { orderBy: { order: 'asc' } } } }); }
  async create(data: any) { 
    const { topics, ...rest } = data;
    return prisma.program.create({ 
      data: {
        ...rest,
        topics: topics ? {
          create: topics.map((t: any, index: number) => ({
            title: t.title || t,
            description: t.description || '',
            order: t.order ?? index
          }))
        } : undefined
      },
      include: { topics: true }
    }); 
  }
  async update(id: string, data: any) { 
    console.log(`[ProgramsRepository] Updating program ${id}`, data);
    const { topics, ...rest } = data;
    
    try {
      return await prisma.$transaction(async (tx) => {
        // If topics are provided, we'll replace them
        if (topics) {
          console.log(`[ProgramsRepository] Deleting existing topics for program ${id}`);
          await tx.programTopic.deleteMany({ where: { programId: id } });
          
          console.log(`[ProgramsRepository] Creating ${topics.length} new topics`);
          rest.topics = {
            create: topics.map((t: any, index: number) => ({
              title: t.title || t,
              description: t.description || '',
              order: t.order ?? index
            }))
          };
        }

        const updated = await tx.program.update({ 
          where: { id }, 
          data: rest,
          include: { topics: true }
        });
        console.log(`[ProgramsRepository] Program ${id} updated successfully`);
        return updated;
      });
    } catch (error: any) {
      console.error(`[ProgramsRepository] Update failed for program ${id}:`, error.message);
      throw error;
    }
  }
  async delete(id: string) { return prisma.program.delete({ where: { id } }); }
}
