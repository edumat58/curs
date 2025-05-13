Metacomenzi (scrise sus, înainte de blocurile de cod)
Comandă	Efect
inline: N	Așază N desene pe un rând (ex: inline: 3)
flabel: 'text'	Afișează text centrat/sub fiecare box cu bold
maxsize: 700px	Setează dimensiunea maximă pentru un singur desen (fără inline)
`align: center	left

Blocuri de desen (între paranteze pătrate)
Scrii unul sau mai multe blocuri de tip:

csharp
Copiază
Editează
[
AB;AC{dash};BC
A(0,0)
B(5,0)
C(3,4)
label{'Bravo!';(8,8)}
]
🧷 Comenzi disponibile în blocul fiecărui desen
Comandă	Efect
A(x,y)	Definește un punct A la coordonatele (x,y)
AB	Trasează segmentul de la A la B
AB{dash}	Trasează segmentul AB cu linie punctată
A(x,y){hide}	Ascunde punctul A complet (nu apare nici cerculeț, nici etichetă)
label{'text';(x,y)}	Adaugă o etichetă personalizată la coordonata dată