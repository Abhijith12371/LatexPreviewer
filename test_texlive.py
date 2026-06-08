import requests

with open("backend/output/resume_user_123.tex", "r", encoding="utf-8") as f:
    latex = f.read()

url = "https://texlive.net/cgi-bin/latexcgi"
files = {
    "filecontents[]": (None, latex),
    "filename[]": (None, "document.tex"),
    "engine": (None, "pdflatex"),
    "return": (None, "pdf")
}

print("Posting to texlive.net as multipart...")
response = requests.post(url, files=files)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")

if response.status_code == 200:
    if response.headers.get('content-type') == 'application/pdf':
        print("Success! Got a PDF.")
    else:
        print("Error from texlive.net:")
        print(response.text[:2000])
else:
    print("HTTP Error:")
    print(response.text[:1000])
