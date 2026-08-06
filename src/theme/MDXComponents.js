import MDXComponents from '@theme-original/MDXComponents';
import {
  EduPasiFigure,
  EduPasiMedia,
  EduPasiTranscript,
} from '@site/src/components/EduPasiContent';
import {
  Alaturi,
  Operatii,
  Blocuri,
  CartonaseNumere,
  TabelAlunecare,
  OperatieAsezata,
  InmultireAsezata,
  SchimbRang,
  Gelosia,
  InmultireJaponeza,
  Bula,
  TabelDescompunere,
  TabelPozitional,
} from '@site/src/components/Lectie';
import ResurseParinti from '@site/src/components/ResurseParinti';

export default {
  ...MDXComponents,
  EduPasiFigure,
  EduPasiMedia,
  EduPasiTranscript,
  // Elementele grafice de lecție (vezi src/components/Lectie). Sunt globale ca
  // să nu mai fie nevoie de niciun import în fișierul lecției.
  TabelPozitional,
  TabelDescompunere,
  Bula,
  Blocuri,
  Alaturi,
  Operatii,
  CartonaseNumere,
  TabelAlunecare,
  OperatieAsezata,
  InmultireAsezata,
  SchimbRang,
  Gelosia,
  InmultireJaponeza,
  ResurseParinti,
};
