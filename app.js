
// Fabric.js setup
const canvas = new fabric.Canvas('pfp', {
  backgroundColor: 'transparent',
  selection: true,
  preserveObjectStacking: true,
});

let contentGroup = null;     // group with circular clip
let frameImg = null;         // overlay frame

function setup() {
  // circular clip path (radius 240 at center 250,250)
  const clip = new fabric.Circle({ left: 10, top: 10, radius: 240, absolutePositioned: true });
  contentGroup = new fabric.Group([], {
    clipPath: clip,
    selectable: false,
    evented: false,
    name: 'CONTENT_GROUP',
  });
  canvas.add(contentGroup);

  // selection UI
  canvas.on('selection:created', e => {
    const t = e.selected?.[0];
    document.getElementById('deleteBtn').disabled = !t;
  });
  canvas.on('selection:updated', e => {
    const t = e.selected?.[0];
    document.getElementById('deleteBtn').disabled = !t;
  });
  canvas.on('selection:cleared', () => {
    document.getElementById('deleteBtn').disabled = true;
  });

  // keep frame on top
  const bringUp = () => { if (frameImg) { canvas.bringToFront(frameImg); canvas.renderAll(); } };
  canvas.on('object:added', bringUp);
  canvas.on('object:modified', bringUp);
}
setup();

// Helpers
function addImageToGroup(url) {
  return new Promise(resolve => {
    fabric.Image.fromURL(url, img => {
      img.set({
        left: 140 + Math.random() * 100,
        top: 140 + Math.random() * 100,
        cornerColor: '#7c3aed',
        transparentCorners: false,
        borderColor: '#7c3aed',
      });
      img.scaleToWidth(260);
      contentGroup.addWithUpdate(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      resolve();
    }, { crossOrigin: 'anonymous' });
  });
}

// Frame upload
document.getElementById('frameInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  fabric.Image.fromURL(url, img => {
    img.set({
      left: 0, top: 0,
      selectable: false, evented: false,
      name: 'RING_FRAME', objectCaching: false,
    });
    img.scaleToWidth(500);
    if (frameImg) canvas.remove(frameImg);
    frameImg = img;
    canvas.add(img);
    canvas.bringToFront(img);
    canvas.renderAll();
  }, { crossOrigin: 'anonymous' });
});

// Content upload
document.getElementById('imgInput').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  for (const f of files) {
    const url = URL.createObjectURL(f);
    await addImageToGroup(url);
  }
});

// Delete selected
document.getElementById('deleteBtn').addEventListener('click', () => {
  const act = canvas.getActiveObject();
  if (act && contentGroup.contains(act)) {
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

// Download
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (frameImg) canvas.bringToFront(frameImg);
  const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'kindred-pfp-showshow.png';
  a.click();
});
