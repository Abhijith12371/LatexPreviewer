import requests

with open("backend/output/resume_user_123.tex", "r", encoding="utf-8") as f:
    latex = f.read()

url = "https://latexonline.cc/compile"
data = {
    "text": latex,
    "command": "pdflatex"
}

print("Posting to latexonline.cc...")
response = requests.post(url, data=data)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")

if response.status_code == 200:
    print("Success! Got a PDF.")
else:
    print("HTTP Error:")
    print(response.text[:1000])
