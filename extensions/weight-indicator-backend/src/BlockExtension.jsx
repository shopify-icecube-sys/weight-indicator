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
        `query ($id: ID!) {
          draftOrder(id: $id) {
            lineItems(first: 100) {
              nodes {
                quantity
                variant {
                  weight
                  weightUnit
                }
              }
            }
          }
        }`,
        { variables: { id: resourceId } }
      );

      const items = result?.data?.draftOrder?.lineItems?.nodes || [];

      let totalKg = 0;

      items.forEach((item) => {
        const weight = item?.variant?.weight || 0;
        const unit = item?.variant?.weightUnit || "KILOGRAMS";
        const qty = item?.quantity || 0;

        let weightInKg = 0;
        // Convert to KG based on the unit returned
        if (unit === "KILOGRAMS" || unit === "KG") {
          weightInKg = weight;
        } else if (unit === "GRAMS" || unit === "G") {
          weightInKg = weight / 1000;
        } else if (unit === "POUNDS" || unit === "LB") {
          weightInKg = weight * 0.453592;
        } else if (unit === "OUNCES" || unit === "OZ") {
          weightInKg = weight * 0.0283495;
        }

        totalKg += weightInKg * qty;
      });

      setWeightInKg(totalKg);
    } catch (err) {
      console.error("Weight fetch error:", err);
    }
  };

  useEffect(() => {
    fetchWeight();

    const interval = setInterval(fetchWeight, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const isOverLimit =
    weightInKg !== null && weightInKg > 22000; // 22,000 kg limit

  return (
    <s-admin-block
      heading={
        isOverLimit
          ? "ATTENTION: ORDER IS OVERWEIGHT"
          : "Order Weight Monitor"
      }
    >
      <s-stack direction="block" gap="base">
        <s-box
          padding="base"
          background={isOverLimit ? "critical-subdued" : "subdued"}
          borderRadius="base"
        >
          <s-stack direction="inline" align="center" gap="base">
            <s-text size="extra-large" type="strong">
              Current Weight:
            </s-text>

            <s-text
              tone={isOverLimit ? "critical" : "success"}
              size="extra-large"
              type="strong"
            >
              {weightInKg !== null
                ? `${weightInKg.toFixed(2)} kg`
                : "Loading..."}
            </s-text>
          </s-stack>
        </s-box>

        {isOverLimit && (
          <s-banner tone="critical">
            <s-stack direction="block" gap="extra-tight">
              <s-text type="strong">CRITICAL ALERT</s-text>
              <s-text>
                You've hit the weight limit for a container. Please create
                another order to proceed.
              </s-text>
            </s-stack>
          </s-banner>
        )}

        {!isOverLimit && weightInKg !== null && (
          <s-stack direction="inline" gap="tight" align="center">
            <s-text tone="success">
              ✅ Weight is safe for standard shipping.
            </s-text>
          </s-stack>
        )}
      </s-stack>
    </s-admin-block>
  );
}