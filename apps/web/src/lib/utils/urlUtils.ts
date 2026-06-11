export function generateBatchSlug(batchId: string, batchName: string, allBatches: { id: string; name: string }[]): string {
  const baseSlug = batchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  // Find all batches with the EXACT same name
  const matches = allBatches.filter(b => b.name === batchName);
  
  // If there's only one, just return the base slug
  if (matches.length <= 1) return baseSlug;
  
  // If there are duplicates, sort them deterministically (e.g., by ID to keep it stable)
  // Or we can just use their index in the matches array. Since useBatches might fetch in order of creation,
  // this will roughly map to testbatch, testbatch1, testbatch2.
  matches.sort((a, b) => a.id.localeCompare(b.id)); // stable sort to prevent shifting slugs
  
  const index = matches.findIndex(b => b.id === batchId);
  
  if (index === 0) return baseSlug; // First one gets no number
  return `${baseSlug}${index}`; // Subsequent get 1, 2, 3...
}

export function extractBatchId(slug: string, allBatches: { id: string; name: string }[]): string {
  // Try exact UUID match first (if someone navigates with an old UUID link)
  const exact = allBatches.find(b => b.id === slug);
  if (exact) return exact.id;

  // Re-generate slug for each batch and match
  for (const b of allBatches) {
    if (generateBatchSlug(b.id, b.name, allBatches) === slug) {
      return b.id;
    }
  }

  // Fallback to returning the slug itself (e.g. for API error handling)
  return slug;
}
