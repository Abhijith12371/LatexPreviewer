const latex = `\\documentclass{article}\\begin{document}Hello World\\end{document}`;

async function test() {
  console.log("Testing latexonline.cc direct CORS...");
  try {
    const url = `https://latexonline.cc/compile?text=${encodeURIComponent(latex)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log("Status:", response.status);
    console.log("CORS header:", response.headers.get('access-control-allow-origin'));
  } catch(e) {
    console.log("Error:", e.message);
  }
}

test();
