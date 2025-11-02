
// Option B + cover fit (no manual fit button): Edit shows full images; export crops to circle with fixed ring.png on top.
// Upload automatically scales image to fully cover the circle (diameter 480) and centers it.
const CANVAS_SIZE = 500;
const CENTER = 250;
const RADIUS = 240;
const DIAM = RADIUS * 2;
const BLEED = 1.02; // tiny oversize to avoid edge seams

const canvas = new fabric.Canvas('pfp', {
  backgroundColor: 'transparent',
  selection: true,
  preserveObjectStacking: true,
});

let contentGroup = null;
let frameImg = null;

function setup() {
  // Editing group (no live clip)
  contentGroup = new fabric.Group([], {
    selectable: false,
    evented: false,
    name: 'CONTENT_GROUP',
    originX: 'center',
    originY: 'center',
    left: CENTER,
    top: CENTER,
  });
  canvas.add(contentGroup);

  // Load fixed frame
  fabric.Image.fromURL('ring.png?v=1', img => {
    img.set({
      originX: 'center',
      originY: 'center',
      left: CENTER,
      top: CENTER,
      selectable: false,
      evented: false,
      name: 'RING_FRAME',
      objectCaching: false,
    });
    img.scaleToWidth(CANVAS_SIZE);
    frameImg = img;
    canvas.add(img);
    canvas.bringToFront(img);
    canvas.renderAll();
  }, { crossOrigin: 'anonymous' });

  // Selection UI
  const delBtn = document.getElementById('deleteBtn');
  canvas.on('selection:created', e => { delBtn.disabled = !(e.selected?.[0]); });
  canvas.on('selection:updated', e => { delBtn.disabled = !(e.selected?.[0]); });
  canvas.on('selection:cleared', () => { delBtn.disabled = true; });

  // Keep frame on top
  const bringUp = () => { if (frameImg) { canvas.bringToFront(frameImg); canvas.renderAll(); } };
  canvas.on('object:added', bringUp);
  canvas.on('object:modified', bringUp);
}
setup();

function coverFit(obj) {
  if (!obj.width || !obj.height) return;
  const sx = DIAM / obj.width;
  const sy = DIAM / obj.height;
  const scale = Math.max(sx, sy) * BLEED;
  obj.set({ originX: 'center', originY: 'center', left: CENTER, top: CENTER });
  obj.scale(scale);
}

// Upload handler with cover-fit
function addImageToGroup(url) {
  return new Promise(resolve => {
    fabric.Image.fromURL(url, img => {
      img.set({
        left: CENTER,
        top: CENTER,
        originX: 'center',
        originY: 'center',
        cornerColor: '#7c3aed',
        transparentCorners: false,
        borderColor: '#7c3aed',
      });
      coverFit(img);
      contentGroup.addWithUpdate(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      resolve();
    }, { crossOrigin: 'anonymous' });
  });
}

document.getElementById('imgInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files || []);
  for (const f of files) { await addImageToGroup(URL.createObjectURL(f)); }
});

// Delete selected (only from contentGroup)
document.getElementById('deleteBtn').addEventListener('click', () => {
  const act = canvas.getActiveObject();
  if (!act) return;
  if (contentGroup.contains(act)) {
    contentGroup.remove(act);
    canvas.discardActiveObject();
    canvas.renderAll();
    document.getElementById('deleteBtn').disabled = true;
  }
});

// Reset content
document.getElementById('resetBtn').addEventListener('click', () => {
  const items = contentGroup._objects.slice();
  items.forEach(o => contentGroup.remove(o));
  canvas.discardActiveObject();
  canvas.renderAll();
  document.getElementById('deleteBtn').disabled = true;
});

// Helper to clone Fabric objects (images async)
function cloneAsync(obj) {
  return new Promise(resolve => obj.clone(clone => resolve(clone)));
}

// Export: crop to circle on a separate canvas, then add frame on top
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const el = document.createElement('canvas');
  el.width = CANVAS_SIZE; el.height = CANVAS_SIZE;
  const temp = new fabric.Canvas(el, { backgroundColor: 'transparent', selection: false });

  const cg = await cloneAsync(contentGroup);
  const clip = new fabric.Circle({
    radius: RADIUS,
    originX: 'center',
    originY: 'center',
    left: CENTER,
    top: CENTER,
    absolutePositioned: true,
  });
  cg.set({
    left: CENTER,
    top: CENTER,
    originX: 'center',
    originY: 'center',
    clipPath: clip,
  });
  temp.add(cg);

  if (frameImg) {
    const fi = await cloneAsync(frameImg);
    fi.set({ left: CENTER, top: CENTER, originX: 'center', originY: 'center' });
    temp.add(fi); temp.bringToFront(fi);
  }

  temp.renderAll();

  const dataURL = el.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'kindred-pfp-showshow.png';
  a.click();
});
