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
        label: ('Marți 25.02: C1 – Funcția de gradul I și graficul acesteia'),
      },
      {
        id: '2',
        label: ('Joi 27.02: C2 – Intervale și comparații'),
      },
    ],
  },
  {
    id: 'grid2',
    label: 'Săptămâna 2 - 03.03.2024 - 07.03.2024',
    children: [
      {
        id: '3',
        label: ('Marți 04.03: C3 – Calcul cu radicali și proprietăți'),
      },
      {
        id: '4',
        label: ('Joi 06.03: C4 – Operații cu puteri și proprietăți'),
      },
    ],
  },
  {
    id: 'grid3',
    label: 'Săptămâna 3 - 10.03.2024 - 14.03.2024',
    children: [
      {
        id: '5',
        label: ('Marți 11.03: C5 – Trigonometrie. Funcții trigonometrice'),
      },
      {
        id: '6',
        label: ('Joi 13.03: C6 – Rădăcina pătrată a unui număr pozitiv'),
      },
    ],
  },
  {
    id: 'grid4',
    label: 'Săptămâna 4 - 17.03.2024 - 21.03.2024 (17.03 & 18.03 - SIMULARI NATIONALE)',
    children: [
      {
        id: '7',
        label: ('Miercuri 19.03: C7 – Modulul unui număr real'),
      },
    ],
  },
  {
    id: 'grid5',
    label: 'Săptămâna 5 - 24.03.2024 - 28.03.2024',
    children: [
      {
        id: '8',
        label: ('Marți 25.03: C8 - Regula de 3 simplă. Mărimi direct și invers proporționale'),
      },
      {
        id: '9',
        label: ('Joi 27.03: C9 – Ecuații si inecuații in multimea numerelor intregi'),
      },
    ],
  },
  {
    id: 'grid6',
    label: 'Săptămâna 6 - 31.03.2024 - 04.04.2024',
    children: [
      {
        id: '10',
        label: ('Marți 01.04: C10 – Calcul literal: reducere, dezvoltare, factorizare'),
      },
      {
        id: '11',
        label: ('Joi 03.04: C11 – Teorema lui Thales (I)'),
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
        id: '14',
        label: ('Marți 15.04: C12 – Ecuatia de gradul I cu o singura necunoscuta'),
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
        label: ('Marți 29.04: C13 – Probabilitați'),
      },
    ],
  },
  {
    id: 'grid11',
    label: 'Săptămâna 11 - 05.05.2024 - 09.05.2024',
    children: [
      {
        id: '18',
        label: ('Marți 06.05: C14'),
      },
      {
        id: '19',
        label: ('Joi 08.05: C15'),
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