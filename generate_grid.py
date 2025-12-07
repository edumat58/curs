rows = 32
cols = 32
print('<table style="border-collapse: collapse;">')
for i in range(rows):
    print('<tr>')
    for j in range(cols):
        print('<td style="width: 10px; height: 10px; border: 1px solid black;">&nbsp;</td>')
    print('</tr>')
print('</table>')