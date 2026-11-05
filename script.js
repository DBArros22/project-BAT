// Configuração da CDN do PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Estado Global da Aplicação
let currentTool = null;
let selectedFiles = [];

// Metadados das Ferramentas
const TOOLS_CONFIG = {
    'merge-pdf': {
        title: 'Juntar PDFs',
        desc: 'Combine múltiplos arquivos PDF em um único documento.',
        accept: '.pdf',
        acceptType: 'application/pdf',
        multiple: true,
        optionsHTML: ''
    },
    'split-pdf': {
        title: 'Dividir PDF',
        desc: 'Separe as páginas do seu documento PDF.',
        accept: '.pdf',
        acceptType: 'application/pdf',
        multiple: false,
        optionsHTML: `
            <div class="space-y-2">
                <label class="block text-xs font-semibold text-slate-700">Modo de Divisão:</label>
                <div class="flex gap-4">
                    <label class="inline-flex items-center text-sm text-slate-600">
                        <input type="radio" name="split-mode" value="all" checked class="text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2">Extrair todas as páginas separadas</span>
                    </label>
                </div>
            </div>
        `
    },
    'img-to-pdf': {
        title: 'Converter Imagens para PDF',
        desc: 'Transforme imagens JPG ou PNG em um documento PDF.',
        accept: 'image/png, image/jpeg, image/webp',
        acceptType: 'image/*',
        multiple: true,
        optionsHTML: ''
    },
    'pdf-to-img': {
        title: 'PDF para Imagens',
        desc: 'Extraia cada página do seu PDF como uma imagem PNG.',
        accept: '.pdf',
        acceptType: 'application/pdf',
        multiple: false,
        optionsHTML: ''
    },
    'convert-img': {
        title: 'Conversor de Formato de Imagem',
        desc: 'Altere o formato e a extensão das suas imagens.',
        accept: 'image/*',
        acceptType: 'image/*',
        multiple: true,
        optionsHTML: `
            <div class="flex items-center space-x-4">
                <label class="text-xs font-semibold text-slate-700">Converter para:</label>
                <select id="target-format" class="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPG / JPEG</option>
                    <option value="image/webp">WEBP</option>
                    <option value="image/bmp">BMP</option>
                </select>
            </div>
        `
    },
    'excel-to-pdf': {
        title: 'Excel / CSV para PDF',
        desc: 'Converta planilhas (.xlsx, .csv) em relatórios formatados em PDF.',
        accept: '.xlsx, .xls, .csv',
        acceptType: '.xlsx,.xls,.csv',
        multiple: false,
        optionsHTML: ''
    }
};

// Navegação de Telas
function switchTool(toolId) {
    currentTool = toolId;
    const viewDashboard = document.getElementById('view-dashboard');
    const viewWorkspace = document.getElementById('view-workspace');

    if (!toolId) {
        viewDashboard.classList.remove('hidden');
        viewWorkspace.classList.add('hidden');
        resetWorkspace();
        return;
    }

    const config = TOOLS_CONFIG[toolId];
    document.getElementById('tool-title').textContent = config.title;
    document.getElementById('tool-desc').textContent = config.desc;
    document.getElementById('accepted-formats').textContent = `Aceita: ${config.accept}`;
    
    const input = document.getElementById('file-input');
    input.accept = config.accept;
    input.multiple = config.multiple;

    const optionsBox = document.getElementById('tool-options');
    if (config.optionsHTML) {
        optionsBox.innerHTML = config.optionsHTML;
        optionsBox.classList.remove('hidden');
    } else {
        optionsBox.classList.add('hidden');
    }

    viewDashboard.classList.add('hidden');
    viewWorkspace.classList.remove('hidden');
    resetWorkspace();
}

// Manipulação do Drag & Drop e Input de Arquivos
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFiles(e.target.files);
    }
});

function handleFiles(files) {
    const config = TOOLS_CONFIG[currentTool];
    if (!config.multiple) {
        selectedFiles = [files[0]];
    } else {
        selectedFiles = [...selectedFiles, ...Array.from(files)];
    }
    updateFileList();
}

function updateFileList() {
    const container = document.getElementById('file-list-container');
    const list = document.getElementById('file-list');
    const actionBtn = document.getElementById('action-btn');
    const clearBtn = document.getElementById('clear-btn');

    list.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        container.classList.add('hidden');
        clearBtn.classList.add('hidden');
        actionBtn.disabled = true;
        actionBtn.className = "px-6 py-2.5 rounded-xl font-semibold text-sm bg-slate-200 text-slate-400 cursor-not-allowed transition shadow-sm";
        return;
    }

    container.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    actionBtn.disabled = false;
    actionBtn.className = "px-6 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md shadow-indigo-200 cursor-pointer";

    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm";
        item.innerHTML = `
            <div class="flex items-center space-x-3 overflow-hidden">
                <i class="fa-solid fa-file text-slate-400"></i>
                <span class="truncate font-medium text-slate-700">${file.name}</span>
                <span class="text-xs text-slate-400">(${formatBytes(file.size)})</span>
            </div>
            <button onclick="removeFile(${index})" class="text-slate-400 hover:text-red-500 transition">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

function resetWorkspace() {
    selectedFiles = [];
    document.getElementById('file-input').value = '';
    document.getElementById('progress-container').classList.add('hidden');
    updateFileList();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Processador Principal de Conversões
async function processFiles() {
    if (!selectedFiles.length) return;

    const progressBox = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    
    progressBox.classList.remove('hidden');
    progressBar.style.width = '10%';
    progressPercent.textContent = '10%';

    try {
        switch (currentTool) {
            case 'merge-pdf':
                await processMergePDF();
                break;
            case 'split-pdf':
                await processSplitPDF();
                break;
            case 'img-to-pdf':
                await processImgToPDF();
                break;
            case 'pdf-to-img':
                await processPDFToImg();
                break;
            case 'convert-img':
                await processConvertImg();
                break;
            case 'excel-to-pdf':
                await processExcelToPDF();
                break;
        }

        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        setTimeout(() => progressBox.classList.add('hidden'), 1500);

    } catch (err) {
        alert('Ocorreu um erro no processamento: ' + err.message);
        progressBox.classList.add('hidden');
    }
}

// 1. Lógica para Juntar PDFs
async function processMergePDF() {
    const mergedPdf = await PDFLib.PDFDocument.create();
    
    for (let file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged_document.pdf');
}

// 2. Lógica para Dividir PDF
async function processSplitPDF() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const zip = new JSZip();

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const newPdf = await PDFLib.PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(page);
        const bytes = await newPdf.save();
        zip.file(`pagina_${i + 1}.pdf`, bytes);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipContent, `${file.name.replace('.pdf', '')}_paginas.zip`);
}

// 3. Lógica para Imagem para PDF
async function processImgToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const dataUrl = await readFileAsDataURL(file);
        
        if (i > 0) doc.addPage();
        
        const imgProps = doc.getImageProperties(dataUrl);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    doc.save('imagens_convertidas.pdf');
}

// 4. Lógica para PDF para Imagens
async function processPDFToImg() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const zip = new JSZip();

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        zip.file(`pagina_${i}.png`, blob);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipContent, `${file.name.replace('.pdf', '')}_imagens.zip`);
}

// 5. Lógica para Converter Formato de Imagem
async function processConvertImg() {
    const format = document.getElementById('target-format').value;
    const ext = format.split('/')[1];

    if (selectedFiles.length === 1) {
        const blob = await convertImageFile(selectedFiles[0], format);
        downloadBlob(blob, `convertido.${ext}`);
    } else {
        const zip = new JSZip();
        for (let i = 0; i < selectedFiles.length; i++) {
            const blob = await convertImageFile(selectedFiles[i], format);
            zip.file(`imagem_${i + 1}.${ext}`, blob);
        }
        const zipContent = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipContent, 'imagens_convertidas.zip');
    }
}

function convertImageFile(file, targetFormat) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => resolve(blob), targetFormat);
        };
        img.src = URL.createObjectURL(file);
    });
}

// 6. Lógica para Excel para PDF
async function processExcelToPDF() {
    const file = selectedFiles[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    if (jsonData.length > 0) {
        doc.autoTable({
            head: [jsonData[0]],
            body: jsonData.slice(1),
            styles: { fontSize: 8 },
            theme: 'grid'
        });
    }

    doc.save(`${file.name.split('.')[0]}.pdf`);
}

// Utilitários de Download
function downloadBlob(blob, filename) {
    saveAs(blob, filename);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
