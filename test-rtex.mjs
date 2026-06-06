const latex = `\\documentclass{article}\\begin{document}Hello World\\end{document}`;

async function testRtex() {
  console.log("Testing rtex...");
  try {
    const response = await fetch('https://rtex.probablyaweb.site/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({ code: latex, format: 'pdf' })
    });
    
    console.log("Status:", response.status);
    console.log("CORS header:", response.headers.get('access-control-allow-origin'));
    const data = await response.json();
    console.log("Response:", data);
  } catch(e) {
    console.log("Error:", e.message);
  }
}

testRtex();
