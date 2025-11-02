
// Fixed-frame version: automatically loads 'ring.png' (500x500 recommended) and locks it.
const canvas = new fabric.Canvas('pfp', {
  backgroundColor: 'transparent',
  selection: true,
  preserveObjectStacking: true,
});

let contentGroup = null;
let frameImg = null;

function setup() {
  const clip = new fabric.Circle({ left: 10, top: 10, radius: 240, absolutePositioned: true });
  contentGroup = new fabric.Group([], { clipPath: clip, selectable: false, evented: false, name: 'CONTENT_GROUP' });
  canvas.add(contentGroup);

  // preload fixed frame image
  fabric.Image.fromURL('ring.png', img => {
    img.set({ left: 0, top: 0, selectable: false, evented: false, name: 'RING_FRAME', objectCaching: false });
    img.scaleToWidth(500);
    img.set({ left: (500 - img.getScaledWidth())/2, top: (500 - img.getScaledHeight())/2 });
    frameImg = img;
    canvas.add(img);
    canvas.bringToFront(img);
    canvas.renderAll();
  }, { crossOrigin: 'anonymous' });

  // selection UI
  const delBtn = document.getElementById('deleteBtn');
  canvas.on('selection:created', e => { delBtn.disabled = !(e.selected?.[0]); });
  canvas.on('selection:updated', e => { delBtn.disabled = !(e.selected?.[0]); });
  canvas.on('selection:cleared', () => { delBtn.disabled = true; });

  const bringUp = () => { if (frameImg) { canvas.bringToFront(frameImg); canvas.renderAll(); } };
  canvas.on('object:added', bringUp);
  canvas.on('object:modified', bringUp);
}
setup();

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

document.getElementById('imgInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files || []);
  for (const f of files) {
    await addImageToGroup(URL.createObjectURL(f));
  }
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  const act = canvas.getActiveObject();
  if (act && contentGroup.contains(act)) {
    contentGroup.remove(act);
    canvas.discardActiveObject();
    canvas.renderAll();
    document.getElementById('deleteBtn').disabled = true;
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  const items = contentGroup._objects.slice();
  items.forEach(o => contentGroup.remove(o));
  canvas.discardActiveObject();
  canvas.renderAll();
  document.getElementById('deleteBtn').disabled = true;
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (frameImg) canvas.bringToFront(frameImg);
  const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'kindred-pfp-showshow.png';
  a.click();
});
