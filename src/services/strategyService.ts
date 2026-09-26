import { tradingService } from './trading';

export const strategyService = {
  getStrategies: tradingService.getStrategies,
  createStrategy: tradingService.createStrategy,
  updateStrategy: tradingService.updateStrategy,
  deleteStrategy: tradingService.deleteStrategy,
};

export default strategyService;

