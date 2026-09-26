import { newsService } from './news';

export const marketEventService = {
  getMarketEvents: newsService.getMarketEvents,
  createMarketEvent: newsService.createMarketEvent,
  seedMarketEvents: newsService.seedMarketEvents,
};

export default marketEventService;

