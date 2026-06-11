export const applyContextMenuPosition = (
  el: HTMLElement | null,
  clickX: number,
  clickY: number
) => {
  if (!el) return;
  const rect = el.getBoundingClientRect();

  let newX = clickX;
  let newY = clickY;

  // Flip horizontally if not enough space to the right
  if (newX + rect.width > window.innerWidth) {
    newX = newX - rect.width;
  }
  
  // Flip vertically if not enough space below
  if (newY + rect.height > window.innerHeight) {
    newY = newY - rect.height;
  }

  // Clamp to ensure it never renders outside the viewport
  newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
  newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));

  el.style.left = `${newX}px`;
  el.style.top = `${newY}px`;
  el.style.visibility = 'visible';
};
