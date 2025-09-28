const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = '#ff7f50'; });
uploadArea.addEventListener('dragleave', e => { e.preventDefault(); uploadArea.style.borderColor = '#ccc'; });
uploadArea.addEventListener('drop', e => { e.preventDefault(); uploadArea.style.borderColor = '#ccc'; handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

let img;

function handleFile(file){
    if(!file) return;
    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img,0,0);
        removeBackground();
    }
    img.src = url;
}

async function removeBackground(){
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Loading model...';

    // Load ONNX model from public/models/u2netp.onnx
    const session = await ort.InferenceSession.create('models/u2netp.onnx');

    downloadBtn.textContent = 'Processing...';

    // Resize image to 320x320 for model
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 320;
    offCanvas.height = 320;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(img,0,0,320,320);
    const imageData = offCtx.getImageData(0,0,320,320);

    // Convert to Float32 tensor
    const data = Float32Array.from(imageData.data).filter((v,i)=>i%4!==3).map(v=>v/255.0);
    const transposed = new Float32Array(3*320*320);
    for(let y=0;y<320;y++){
        for(let x=0;x<320;x++){
            for(let c=0;c<3;c++){
                transposed[c*320*320 + y*320 + x] = data[(y*320 + x)*3 + c];
            }
        }
    }

    const input = new ort.Tensor('float32', transposed, [1,3,320,320]);
    const results = await session.run({ input });
    const maskData = results.output.data;

    // Resize mask to original image size
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;
    const maskCtx = maskCanvas.getContext('2d');
    const maskImageData = maskCtx.createImageData(img.width,img.height);

    for(let y=0;y<img.height;y++){
        for(let x=0;x<img.width;x++){
            const ix = Math.floor(x*320/img.width);
            const iy = Math.floor(y*320/img.height);
            const alpha = maskData[iy*320 + ix]*255;
            const p = (y*img.width + x)*4;
            maskImageData.data[p+0]=0;
            maskImageData.data[p+1]=0;
            maskImageData.data[p+2]=0;
            maskImageData.data[p+3]=alpha;
        }
    }

    // Draw original image
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);

    // Apply alpha mask
    const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let i=0;i<imgData.data.length;i+=4){
        imgData.data[i+3] = maskImageData.data[i+3]; // apply alpha from mask
    }
    ctx.putImageData(imgData,0,0);

    downloadBtn.textContent = 'Download PNG';
    downloadBtn.disabled = false;
}

// Download button
downloadBtn.addEventListener('click',()=>{
    if(!img) return;
    const link = document.createElement('a');
    link.download='bg-removed.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
});
