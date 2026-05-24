export type MarketplaceEvent =
  | {
      name: "marketplace_filter_changed";
      payload: {
        source: "products";
        filter: string;
        value: string | boolean | null;
      };
    }
  | {
      name: "marketplace_search_submitted";
      payload: {
        source: "products";
        query: string;
      };
    }
  | {
      name: "product_report_started" | "product_report_submitted";
      payload: {
        productId: number;
        reason?: string;
      };
    }
  | {
      name: "product_primary_action_clicked";
      payload: {
        productId: number;
        action: "buy" | "trade" | "message" | "favorite";
        authenticated: boolean;
      };
    };

export function trackEvent(event: MarketplaceEvent) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent("barter:analytics", { detail: event }));
}
