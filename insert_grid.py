import re

with open('docs/c5/modul-2/text.mdx', 'r') as f:
    content = f.read()

# Find the position after the first **(8p)**
pattern = r'\*\*\(8p\)\*\*'
matches = list(re.finditer(pattern, content))

if len(matches) >= 1:
    pos = matches[0].end()
    # Insert the grid after this.
    grid = '<table style="border-collapse: collapse;">'
    for i in range(32):
        grid += '<tr>'
        for j in range(32):
            grid += '<td style="width: 10px; height: 10px; border: 1px solid black;">&nbsp;</td>'
        grid += '</tr>'
    grid += '</table>'
    new_content = content[:pos] + '\n\n' + grid + '\n\n' + content[pos:]
    with open('docs/c5/modul-2/text.mdx', 'w') as f:
        f.write(new_content)