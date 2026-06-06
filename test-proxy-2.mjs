const latex = `\\documentclass{article}\\begin{document}Hello World\\end{document}`;

async function testViteProxy() {
  console.log("Testing Vite proxy without rewrite...");
  try {
    const formData = new FormData();
    formData.append('filecontents[]', latex);
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');
    
    const response = await fetch('http://localhost:5174/cgi-bin/latexcgi', {
      method: 'POST',
      body: formData
    });
    
    console.log("Vite proxy status:", response.status);
    console.log("Vite proxy headers:", response.headers.get('content-type'));
    const text = await response.text();
    console.log("Vite proxy response text preview:", text.substring(0, 100));
  } catch(e) {
    console.log("error:", e.message);
  }
}

testViteProxy();
