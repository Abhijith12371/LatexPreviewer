const latex = `\\documentclass{article}\\begin{document}Hello World\\end{document}`;

async function testCorsProxy() {
  console.log("Testing corsproxy.io...");
  try {
    const formData = new FormData();
    formData.append('filecontents[]', latex);
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');
    
    const targetUrl = 'https://texlive.net/cgi-bin/latexcgi';
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      body: formData
    });
    
    console.log("corsproxy.io status:", response.status);
    console.log("corsproxy.io headers:", response.headers.get('content-type'));
    if (response.ok) {
      console.log("corsproxy.io works!");
    } else {
      console.log("corsproxy.io failed", await response.text());
    }
  } catch(e) {
    console.log("corsproxy error:", e.message);
  }
}

testCorsProxy();
