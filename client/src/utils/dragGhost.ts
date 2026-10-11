/**
 * Utility to generate a stacked cards preview for native HTML5 Drag and Drop
 * when multiple items (notes or folders) are dragged simultaneously.
 */
export const createStackedDragGhost = (
  count: number,
  title: string,
  type: 'note' | 'folder',
  color: string = '#CEEBFD'
): HTMLElement => {
  const ghost = document.createElement('div');
  ghost.style.position = 'absolute';
  ghost.style.top = '-1000px';
  ghost.style.left = '-1000px';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '9999';

  if (count > 1) {
    ghost.innerHTML = `
      <div style="position: relative; width: 140px; height: 110px;">
        <!-- Bottom stacked card -->
        <div style="position: absolute; inset: 0; transform: rotate(-5deg) translate(-4px, 4px); background: #E2E8F0; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.12);"></div>
        <!-- Middle stacked card -->
        <div style="position: absolute; inset: 0; transform: rotate(4deg) translate(4px, 2px); background: #CBD5E1; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.1); box-shadow: 0 6px 16px rgba(0,0,0,0.14);"></div>
        <!-- Top dragged card -->
        <div style="position: absolute; inset: 0; background: ${color}; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.12); padding: 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: space-between;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 110px;">
            ${title}
          </div>
          <!-- Stacked count badge -->
          <div style="align-self: flex-end; background: #0B57D0; color: white; font-weight: 700; font-size: 10px; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(11,87,208,0.4); display: flex; align-items: center; gap: 3px;">
            <span>${count} items</span>
          </div>
        </div>
      </div>
    `;
  } else {
    ghost.innerHTML = `
      <div style="width: 140px; height: 100px; background: ${color}; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.12); padding: 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: space-between;">
        <div style="font-weight: 700; font-size: 12px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${title}
        </div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">
          ${type}
        </div>
      </div>
    `;
  }

  document.body.appendChild(ghost);
  return ghost;
};
