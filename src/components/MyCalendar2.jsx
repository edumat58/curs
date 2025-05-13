import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

const MUI_X_PRODUCTS = [
  {
    id: 'grid1',
    label: 'Săptămâna 1 - 24.02.2024 - 28.02.2024',
    children: [
      {
        id: '1',
        label: ('Luni 24.02: C1 – Mulțimi de numere'),
      },
      {
        id: '2',
        label: ('Miercuri 26.02: C2 – Intervale, comparații și aproximări'),
      },
    ],
  },
  {
    id: 'grid2',
    label: 'Săptămâna 2 - 03.03.2024 - 07.03.2024',
    children: [
      {
        id: '3',
        label: ('Luni 03.03: C3 – Proporții și procente'),
      },
      {
        id: '4',
        label: ('Miercuri 05.03: C4 - Grafice, tabele și interpretarea acestora'),
      },
    ],
  },
  {
    id: 'grid3',
    label: 'Săptămâna 3 - 10.03.2024 - 14.03.2024',
    children: [
      {
        id: '5',
        label: ('Luni 10.03: C5 – Numere raționale (I)'),
      },
      {
        id: '6',
        label: ('Joi 13.03: C6 – Modulul unui număr întreg (valoarea absolută)'),
      },
    ],
  },
  {
    id: 'grid4',
    label: 'Săptămâna 4 - 17.03.2024 - 21.03.2024 (17.03 & 18.03 - SIMULARI NATIONALE)',
    children: [
      {
        id: '7',
        label: ('Joi 20.03: C7 – Ecuatii si inecuatii in multimea numerelor intregi (I)'),
      },
    ],
  },
  {
    id: 'grid5',
    label: 'Săptămâna 5 - 24.03.2024 - 28.03.2024',
    children: [
      {
        id: '8',
        label: ('Miercuri 26.03: C8 – Ecuații si inecuații in multimea numerelor intregi (II)'),
      },
    ],
  },
  {
    id: 'grid6',
    label: 'Săptămâna 6 - 31.03.2024 - 04.04.2024',
    children: [
      {
        id: '9',
        label: ('Luni 31.03: C9 - Punct, dreaptă, plan'),
      },
      {
        id: '10',
        label: ('Miercuri 02.04: C10 – Fracții ireductibile și numere prime'),
      },
    ],
  },
  {
    id: 'grid7',
    label: 'Săptămâna 7 - 07.04.2024 - 11.04.2024 (SAPTAMANA VERDE)',
  },
  {
    id: 'grid8',
    label: 'Săptămâna 8: 14.04.2024 - 18.04.2024',
    children: [
    {
        id: '11',
        label: ('Luni 14.04: C11 –Unghiul. Clasificare si masurarea unghiurilor'),
        },
      {
        id: '12',
        label: ('Miercuri 16.04: C12 – Mărimi și unități de măsură'),
      },
    ],
  },
  {
    id: 'grid9',
    label: 'Săptămâna 9 - 21.04.2024 - 25.04.2024 (VACANTA DE PRIMAVARA)',
  },
  {
    id: 'grid10',
    label: 'Săptămâna 10 - 28.04.2024 - 02.05.2024 (01.05 & 02.05 - ZILE LIBERE)',
    children: [
      {
        id: '16',
        label: ('Luni 28.04: C13 - Operații cu puteri (Numere întregi și exponenți naturali)'),
      },
    ],
  },
  {
    id: 'grid11',
    label: 'Săptămâna 11 - 05.05.2024 - 09.05.2024',
    children: [
      {
        id: '18',
        label: ('Luni 05.05: C14 - Curbe, poligoane și triunghiuri'),
      },
      {
        id: '19',
        label: ('Miercuri 07.05: C15 - Ecuatia de gradul I cu o singura necunoscuta'),
      },
    ],
  }
];

const getAllItemsWithChildrenItemIds = () => {
  const itemIds = [];
  const registerItemId = (item) => {
    if (item.children?.length) {
      itemIds.push(item.id);
      item.children.forEach(registerItemId);
    }
  };

  MUI_X_PRODUCTS.forEach(registerItemId);

  return itemIds;
};

export default function ControlledExpansion() {
  const [expandedItems, setExpandedItems] = React.useState([]);

  const handleExpandedItemsChange = (event, itemIds) => {
    setExpandedItems(itemIds);
  };

  const handleExpandClick = () => {
    setExpandedItems((oldExpanded) =>
      oldExpanded.length === 0 ? getAllItemsWithChildrenItemIds() : [],
    );
  };

  return (
    <Stack spacing={2}>
      <div>
        <Button onClick={handleExpandClick}>
          {expandedItems.length === 0 ? 'Expand all' : 'Collapse all'}
        </Button>
      </div>
      <Box sx={{ minHeight: 352, minWidth: 250 }}>
        <RichTreeView
          items={MUI_X_PRODUCTS}
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
        />
      </Box>
    </Stack>
  );
}