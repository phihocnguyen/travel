// Landscape ticket: 12 × 7 cm, rounded to whole pixels at 300 DPI.
export const PRINT_WIDTH = 1417;
export const PRINT_HEIGHT = 827;
export const PRINT_DPI = 300;
export const MAX_PRINT_BYTES = 16 * 1024 * 1024;

// Both print pages use the requested physical size, independently of PNG density.
export const TICKET_PAPER_WIDTH_MM = 210;
export const TICKET_PAPER_HEIGHT_MM = 75;
export const TICKET_BACK_GAP_MM = 10;
export const TICKET_BACKS_PER_A4 = Math.floor((297 + TICKET_BACK_GAP_MM) / (TICKET_PAPER_HEIGHT_MM + TICKET_BACK_GAP_MM));
