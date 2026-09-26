import { journalService } from './journal';

export const tradeService = {
  getTrades: journalService.getTrades,
  getTradeById: journalService.getTradeById,
  createTrade: journalService.createTrade,
  updateTrade: journalService.updateTrade,
  deleteTrade: journalService.deleteTrade,
};

export default tradeService;

