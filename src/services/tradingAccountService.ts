import { tradingService } from './trading';

export const tradingAccountService = {
  getAccounts: tradingService.getAccounts,
  createAccount: tradingService.createAccount,
  updateAccount: tradingService.updateAccount,
  deleteAccount: tradingService.deleteAccount,
};

export default tradingAccountService;

