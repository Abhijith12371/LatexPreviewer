import os
import subprocess
from jinja2 import Environment, FileSystemLoader
from schemas import ResumeJSON

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def generate_pdf_from_json(resume_data: ResumeJSON, candidate_id: str) -> str:
    """
    Renders the Jinja LaTeX template with the generated JSON and compiles it to PDF.
    Returns the path to the generated PDF.
    """
    # LaTeX uses {#1} syntax for macro arguments which clashes with Jinja2's
    # default comment delimiter {# ... #}. We override the comment delimiters
    # to {## ... ##} which never appear in LaTeX, keeping {{ }} and {% %} as-is.
    # We also register a latex_escape filter to sanitize any user-supplied
    # text values that might contain LaTeX special characters or Unicode that
    # pdflatex cannot handle.
    def latex_escape(value: str) -> str:
        """Escape special LaTeX characters and normalize Unicode."""
        if not isinstance(value, str):
            return value
        
        # Replace common unicode dashes and quotes that pdflatex chokes on
        unicode_replacements = [
            ('\u2011', '-'),   # Non-breaking hyphen
            ('\u2013', '--'),  # En dash
            ('\u2014', '---'), # Em dash
            ('\u2018', "`"),   # Left single quote
            ('\u2019', "'"),   # Right single quote
            ('\u201c', "``"),  # Left double quote
            ('\u201d', "''"),  # Right double quote
            ('\u2022', "\\textbullet{}"), # Bullet
        ]
        for char, ascii_repl in unicode_replacements:
            value = value.replace(char, ascii_repl)

        replacements = [
            ('\\', r'\textbackslash{}'),
            ('&',  r'\&'),
            ('%',  r'\%'),
            ('$',  r'\$'),
            ('#',  r'\#'),
            ('_',  r'\_'),
            ('{',  r'\{'),
            ('}',  r'\}'),
            ('~',  r'\textasciitilde{}'),
            ('^',  r'\^{}'),
        ]
        for char, escaped in replacements:
            value = value.replace(char, escaped)
        return value

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=False,
        comment_start_string='{##',
        comment_end_string='##}',
    )
    env.filters['latex_escape'] = latex_escape

    template = env.get_template("resume_template.tex.jinja")
    
    # Render the LaTeX string
    # We need to escape special LaTeX characters in the JSON values, but we'll assume the LLM output is mostly clean
    # or we handle it in prompt.
    rendered_tex = template.render(
        personal=resume_data.personal,
        education=resume_data.education,
        skills=resume_data.skills,
        experiences=resume_data.experiences,
        projects=resume_data.projects,
        certifications=resume_data.certifications,
        achievements=resume_data.achievements
    )
    
    tex_filename = f"resume_{candidate_id}.tex"
    pdf_filename = f"resume_{candidate_id}.pdf"
    
    tex_filepath = os.path.join(OUTPUT_DIR, tex_filename)
    pdf_filepath = os.path.join(OUTPUT_DIR, pdf_filename)
    
    with open(tex_filepath, "w", encoding="utf-8") as f:
        f.write(rendered_tex)
        
    # Compile with pdflatex
    # Run twice for cross-references if necessary, but once is usually enough for simple resumes
    try:
        process = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", f"-output-directory={OUTPUT_DIR}", tex_filepath],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print("LaTeX Compilation Error:")
        print(e.stdout)
        # We will not raise an error, just return the tex filepath so frontend can render it
        print("Failed to compile LaTeX to PDF. Returning .tex file instead.")
        return tex_filepath
    except FileNotFoundError:
        print("pdflatex not found on the system. Returning .tex file instead.")
        return tex_filepath
        
    # Clean up auxiliary files
    for ext in [".aux", ".log", ".out"]:
        aux_file = os.path.join(OUTPUT_DIR, f"resume_{candidate_id}{ext}")
        if os.path.exists(aux_file):
            os.remove(aux_file)
            
    return pdf_filepath
