import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import ParentPortal from './ParentPortal';
import { FEE_DEFAULT, loadSettings, SCRIPT_URL_DEFAULT } from './helpers';
import { initFontCheck } from './fontCheck';

initFontCheck();

const saved = loadSettings();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ParentPortal
      scriptUrl={saved?.scriptUrl ?? SCRIPT_URL_DEFAULT}
      centerName={saved?.centerName ?? 'LỚP TOÁN NK'}
      baseTuition={saved?.baseTuition ?? FEE_DEFAULT}
      phone={saved?.phone ?? '0383634949'}
    />
  </StrictMode>,
);
