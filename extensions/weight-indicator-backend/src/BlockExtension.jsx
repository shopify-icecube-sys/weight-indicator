// @ts-nocheck
import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [weightInKg, setWeightInKg] = useState(null);

  const fetchWeight = async () => {
    try {
      const resourceId = shopify.data.selected[0].id;
      const result = await shopify.query(
        `query ($id: ID!) { draftOrder(id: $id) { totalWeight } }`,
        { variables: { id: resourceId } }
      );
      if (result?.data?.draftOrder) {
        setWeightInKg(result.data.draftOrder.totalWeight / 22000);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchWeight();
    const interval = setInterval(fetchWeight, 5000);
    return () => clearInterval(interval);
  }, []);

  const isOverLimit = weightInKg > 22000;

  return (
    <s-admin-block
      heading={isOverLimit ? "🛑 ATTENTION: ORDER IS OVERWEIGHT" : "Order Weight Monitor"}
    >
      <s-stack direction="block" gap="base">
        <s-box padding="base" background={isOverLimit ? "critical-subdued" : "subdued"} borderRadius="base">
          <s-stack direction="inline" align="center" gap="base">
            <s-text size="extra-large" type="strong">Current Weight:</s-text>
            <s-text
              tone={isOverLimit ? "critical" : "success"}
              size="extra-large"
              type="strong"
            >
              {weightInKg?.toFixed(2)} kg
            </s-text>
          </s-stack>
        </s-box>

        {isOverLimit && (
          <s-banner tone="critical">
            <s-stack direction="block" gap="extra-tight">
              <s-text type="strong">CRITICAL ALERT</s-text>
              <s-text>
                This order is <b>{weightInKg?.toFixed(2)} kg</b>. This exceeds the 22,000kg limit.
              </s-text>
            </s-stack>
          </s-banner>
        )}

        {!isOverLimit && weightInKg !== null && (
          <s-stack direction="inline" gap="tight" align="center">
            <s-text tone="success">✅ Weight is safe for standard shipping.</s-text>
          </s-stack>
        )}
      </s-stack>
    </s-admin-block>
  );
}
