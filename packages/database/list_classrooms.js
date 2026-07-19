const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classrooms = await prisma.classroom.findMany();
  console.log('Classrooms count:', classrooms.length);
  for (const cr of classrooms) {
    console.log('\n========================================');
    console.log('Batch ID:', cr.batch_id);
    console.log('Status:', cr.status);
    
    let state = cr.stateData;
    if (typeof state === 'string') {
      try {
        state = JSON.parse(state);
      } catch (e) {}
    }
    
    if (state) {
      console.log('Current Node ID:', state.currentNodeId);
      console.log('Is Locked:', state.isLocked);
      console.log('Is Freehand:', state.isFreehand);
      
      const nodes = state.nodes || {};
      const nodeKeys = Object.keys(nodes);
      console.log('Nodes count:', nodeKeys.length);
      
      // Print path from root to current node
      let path = [];
      let currId = state.currentNodeId;
      let depth = 0;
      while (currId && depth < 20) {
        const node = nodes[currId];
        if (!node) break;
        path.unshift({ id: currId, san: node.san, turn: node.turn, moveNumber: node.moveNumber, fen: node.fen });
        currId = node.parentId;
        depth++;
      }
      
      console.log('Path to current node:');
      path.forEach((p, index) => {
        console.log(`  ${index}. ID: ${p.id} | SAN: ${p.san} | Turn: ${p.turn} | MoveNo: ${p.moveNumber} | FEN: ${p.fen}`);
      });
    } else {
      console.log('No stateData found.');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
