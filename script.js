const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
let img;

// Drag & Drop
const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = '#ff7f50'; });
uploadArea.addEventListener('dragleave', e => { e.preventDefault(); uploadArea.style.borderColor = '#ccc'; });
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.style.borderColor = '#ccc';
  handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

function handleFile(file) {
  if(!file) return;
  const url = URL.createObjectURL(file);
  img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0);
    removeBackground();
  };
  img.src = url;
}

// Load model & remove background
async function removeBackground() {
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Loading model...';
  
  const net = await bodyPix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75
  });

  downloadBtn.textContent = 'Processing...';

  const segmentation = await net.segmentPerson(img, { segmentationThreshold: 0.7 });

  const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0, p=0; i<segmentation.data.length; i++, p+=4){
    if(!segmentation.data[i]) imageData.data[p+3] = 0; // make background transparent
  }
  ctx.putImageData(imageData,0,0);

  downloadBtn.textContent = 'Download PNG';
  downloadBtn.disabled = false;
}

// Download result
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'background-removed.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
