//+------------------------------------------------------------------+
//|                                              FynenceSyncEA.mq5   |
//|                        Fynence Institutional Trading Journal     |
//|                                      https://fynence.local       |
//+------------------------------------------------------------------+
#property copyright   "Copyright 2026, Fynence Analytics"
#property link        "https://fynence.local"
#property version     "1.00"
#property description "Read-Only MT5 Synchronizer for Fynence Trading Journal."
#property description "Securely transmits closed deals, balance, equity, and margin."
#property description "IMPORTANT: Fynence NEVER executes orders or modifies positions."
#property strict

//--- Input Parameters
input group "=== FYNENCE CREDENTIALS ==="
input string   InpEAToken              = "PASTE_YOUR_FYNENCE_EA_TOKEN_HERE"; // Fynence EA Token
input string   InpApiEndpoint          = "http://localhost:3000/api/mt5/ea/webhook"; // Fynence Webhook URL

input group "=== SYNC SETTINGS ==="
input int      InpSyncIntervalSeconds  = 60;   // Scheduled Sync Interval (Seconds)
input int      InpHistoryDays          = 30;   // History Lookback Window (Days)
input bool     InpSyncOnTradeClose     = true; // Instant Sync On Closed Trade

//--- Global State
datetime g_lastSyncTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("FynenceSyncEA: Initializing read-only bridge for account #", AccountInfoInteger(ACCOUNT_LOGIN));
   
   if(StringLen(InpEAToken) == 0 || InpEAToken == "PASTE_YOUR_FYNENCE_EA_TOKEN_HERE")
   {
      Alert("FynenceSyncEA Warning: Please configure your InpEAToken in EA Properties.");
   }
   
   // Start background periodic timer
   EventSetTimer(InpSyncIntervalSeconds > 5 ? InpSyncIntervalSeconds : 5);
   
   // Initial synchronization
   PushAccountAndTrades();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("FynenceSyncEA: Deinitialized.");
}

//+------------------------------------------------------------------+
//| Timer event function                                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   PushAccountAndTrades();
}

//+------------------------------------------------------------------+
//| Trade transaction event (Instant real-time sync on closed trade)  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   if(!InpSyncOnTradeClose) return;

   // Detect when a closed deal or balance transaction is committed
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      Print("FynenceSyncEA: Deal event detected. Triggering instant sync.");
      PushAccountAndTrades();
   }
}

//+------------------------------------------------------------------+
//| Build and transmit JSON payload to Fynence                       |
//+------------------------------------------------------------------+
void PushAccountAndTrades()
{
   if(StringLen(InpEAToken) == 0) return;

   long login       = AccountInfoInteger(ACCOUNT_LOGIN);
   string server    = AccountInfoString(ACCOUNT_SERVER);
   string currency  = AccountInfoString(ACCOUNT_CURRENCY);
   long leverage    = AccountInfoInteger(ACCOUNT_LEVERAGE);
   double balance   = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity    = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin    = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin= AccountInfoDouble(ACCOUNT_MARGIN_FREE);

   // Select deal history
   datetime fromTime = TimeCurrent() - (InpHistoryDays * 86400);
   datetime toTime   = TimeCurrent() + 60;
   HistorySelect(fromTime, toTime);

   int totalDeals = HistoryDealsTotal();
   string dealsJson = "[";
   int dealCount = 0;

   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long entryType = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long dealType  = HistoryDealGetInteger(ticket, DEAL_TYPE);

      // We focus on exit deals (closed positions)
      if(entryType != DEAL_ENTRY_OUT && entryType != DEAL_ENTRY_INOUT) continue;
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;

      string symbol     = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double price      = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap       = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      datetime time     = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      string comment    = HistoryDealGetString(ticket, DEAL_COMMENT);

      if(dealCount > 0) dealsJson += ",";

      dealsJson += StringFormat(
         "{\"ticket\":\"%I64u\",\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"price\":%.5f,\"commission\":%.2f,\"swap\":%.2f,\"profit\":%.2f,\"time\":%I64d,\"comment\":\"%s\"}",
         ticket,
         symbol,
         (dealType == DEAL_TYPE_BUY ? "buy" : "sell"),
         volume,
         price,
         commission,
         swap,
         profit,
         (long)time,
         comment
      );

      dealCount++;
   }
   dealsJson += "]";

   // Build main JSON payload
   string payload = StringFormat(
      "{\"eaToken\":\"%s\",\"account\":{\"login\":\"%I64u\",\"server\":\"%s\",\"currency\":\"%s\",\"leverage\":%d,\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"freeMargin\":%.2f},\"deals\":%s}",
      InpEAToken,
      login,
      server,
      currency,
      leverage,
      balance,
      equity,
      margin,
      freeMargin,
      dealsJson
   );

   // Transmit via HTTP POST WebRequest
   char postData[];
   char resultData[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1); // remove null terminator

   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + InpEAToken + "\r\n";

   ResetLastError();
   int res = WebRequest("POST", InpApiEndpoint, headers, 8000, postData, resultData, resultHeaders);

   if(res == 200 || res == 201)
   {
      g_lastSyncTime = TimeCurrent();
      PrintFormat("FynenceSyncEA: Successfully synced. Balance: %.2f | Equity: %.2f | Deals: %d", balance, equity, dealCount);
   }
   else
   {
      int err = GetLastError();
      PrintFormat("FynenceSyncEA Error: WebRequest failed HTTP %d (Error Code: %d). Ensure '%s' is added to MT5 Tools -> Options -> Expert Advisors -> Allow WebRequest.", res, err, InpApiEndpoint);
   }
}
//+------------------------------------------------------------------+
