import { Markup } from 'telegraf';
import {
  BTN_HELP,
  BTN_POSITIONS,
  BTN_REFRESH,
  BTN_STATUS,
} from './menu.labels';

export { BTN_HELP, BTN_POSITIONS, BTN_REFRESH, BTN_STATUS };

export const mainMenuKeyboard = () =>
  Markup.keyboard([[BTN_POSITIONS, BTN_STATUS], [BTN_REFRESH, BTN_HELP]])
    .resize()
    .persistent();

export const mainMenuExtra = () => ({
  parse_mode: 'HTML' as const,
  ...mainMenuKeyboard(),
});
