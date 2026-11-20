import zipfile
import re
import html
import os

DOCX_IN = '/Users/nitheshkumar/Downloads/Aligned_Index_Final.docx'
DOCX_OUT = '/Users/nitheshkumar/Downloads/Aligned_Index_Final_With_Appendix_Code.docx'
MD_PATH = '/Users/nitheshkumar/Documents/MIRA/docs/APPENDIX_SOURCE_CODE.md'

with open(MD_PATH, 'r', encoding='utf-8') as f:
    md_content = f.read()

def xml_escape(text):
    return html.escape(text).replace("'", "&apos;").replace('"', '&quot;')

def make_heading(text, level=2):
    sz = "26" if level == 1 else "22"
    before = "280" if level == 1 else "200"
    return f"""<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading3"/>
    <w:spacing w:before="{before}" w:after="100"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Aptos"/>
      <w:b/>
      <w:sz w:val="{sz}"/>
    </w:rPr>
    <w:t>{xml_escape(text)}</w:t>
  </w:r>
</w:p>"""

def make_para(text, bold_prefix=None):
    r_elements = ""
    if bold_prefix:
        r_elements += f"""<w:r>
    <w:rPr>
      <w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Aptos"/>
      <w:b/>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t xml:space="preserve">{xml_escape(bold_prefix)} </w:t>
  </w:r>"""
    r_elements += f"""<w:r>
    <w:rPr>
      <w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Aptos"/>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t>{xml_escape(text)}</w:t>
  </w:r>"""
    return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="60" w:after="80"/>
  </w:pPr>
  {r_elements}
</w:p>"""

def make_code_line(line):
    return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="0" w:after="0" w:line="220" w:lineRule="exact"/>
    <w:ind w:left="240"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
      <w:sz w:val="17"/>
      <w:color w:val="1E1E1E"/>
    </w:rPr>
    <w:t xml:space="preserve">{xml_escape(line)}</w:t>
  </w:r>
</w:p>"""

def parse_md_to_docx_xml(md_text):
    xml_parts = []
    lines = md_text.split('\n')
    in_code_block = False
    
    # Add top divider / Section heading
    xml_parts.append(make_heading("I. CORE SOURCE CODE IMPLEMENTATION", level=1))
    xml_parts.append(make_para("This section presents the primary source code listings, algorithmic implementations, and architectural modules of the developed MIRA platform, corresponding to the design and methodology discussed in Chapters 2, 3, and 4."))

    i = 0
    while i < len(lines):
        line = lines[i]
        
        if line.startswith('```'):
            in_code_block = not in_code_block
            i += 1
            continue
            
        if in_code_block:
            xml_parts.append(make_code_line(line))
            i += 1
            continue
            
        if line.startswith('### APPENDIX'):
            title = line.replace('### ', '').strip()
            xml_parts.append(make_heading(title, level=2))
        elif line.startswith('**Primary File:**') or line.startswith('**Primary Module:**') or line.startswith('**Primary Modules:**'):
            parts = line.split('**', 2)
            prefix = parts[1] + ':' if len(parts) > 1 else ''
            rest = parts[2].replace(':', '').strip() if len(parts) > 2 else line
            xml_parts.append(make_para(rest, bold_prefix=prefix))
        elif line.startswith('**Purpose:**') or line.startswith('**Description:**'):
            parts = line.split('**', 2)
            prefix = parts[1] + ':' if len(parts) > 1 else ''
            rest = parts[2].replace(':', '').strip() if len(parts) > 2 else line
            xml_parts.append(make_para(rest, bold_prefix=prefix))
        elif line.strip() and not line.startswith('#') and not line.startswith('---'):
            xml_parts.append(make_para(line.strip()))
            
        i += 1
        
    return '\n'.join(xml_parts)

print("Reading input document...")
with zipfile.ZipFile(DOCX_IN, 'r') as z_in:
    xml_content = z_in.read('word/document.xml').decode('utf-8')
    all_files = {name: z_in.read(name) for name in z_in.namelist()}

new_xml_code = parse_md_to_docx_xml(md_content)

# Insert right before <w:sectPr
pos = xml_content.rfind('<w:sectPr')
if pos == -1:
    raise ValueError("Could not find <w:sectPr in document.xml")

updated_xml = xml_content[:pos] + '\n' + new_xml_code + '\n' + xml_content[pos:]
all_files['word/document.xml'] = updated_xml.encode('utf-8')

print(f"Writing updated document with appendix code to {DOCX_OUT}...")
with zipfile.ZipFile(DOCX_OUT, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
    for name, data in all_files.items():
        z_out.writestr(name, data)

print("Done! File generated successfully.")
