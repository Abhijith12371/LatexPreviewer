const latex = `\\documentclass{article}\\begin{document}Hello World\\end{document}`;

async function testCustomProxy() {
  console.log("Testing custom proxy plugin...");
  try {
    const formData = new FormData();
    formData.append('filecontents[]', latex);
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');
    
    const response = await fetch('http://localhost:5174/api/latex', {
      method: 'POST',
      body: formData
    });
    
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get('content-type'));
    if (response.headers.get('content-type') === 'application/pdf') {
       console.log("SUCCESS! Got PDF.");
    } else {
       console.log("Failed. Body:", await response.text());
    }
  } catch(e) {
    console.log("error:", e.message);
  }
}

testCustomProxy();
