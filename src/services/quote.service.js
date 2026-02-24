import pool from "../config/db.js";
import crypto from "crypto";

/**
 * Generate short public reference code
 */
function generatePublicCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Save quote + breakdown into DB
 */
export async function saveQuote(categoryId, data, quoteResult) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const publicCode = generatePublicCode();

    // Insert quote
    const quoteInsert = await client.query(
      `
      INSERT INTO quotes (category_id, area, currency, total, summary_text, public_code)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, public_code
      `,
      [
        categoryId,
        quoteResult.area,
        quoteResult.currency,
        quoteResult.total,
        null,
        publicCode
      ]
    );

    const quoteId = quoteInsert.rows[0].id;

    // Insert breakdown items
    for (let i = 0; i < quoteResult.breakdown.length; i++) {
      const item = quoteResult.breakdown[i];

      await client.query(
        `
        INSERT INTO quote_breakdown_items 
        (quote_id, label, calculation, amount, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          quoteId,
          item.label,
          item.calculation,
          item.amount,
          i + 1
        ]
      );
    }

    await client.query("COMMIT");

    return {
      quoteId,
      publicCode
    };

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Save quote error:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Fetch quote by public code
 */
export async function getQuoteByPublicCode(publicCode) {
  const quoteRes = await pool.query(
    "SELECT * FROM quotes WHERE public_code = $1",
    [publicCode]
  );

  if (quoteRes.rows.length === 0) {
    return null;
  }

  const quote = quoteRes.rows[0];

  const breakdownRes = await pool.query(
    "SELECT label, calculation, amount FROM quote_breakdown_items WHERE quote_id = $1 ORDER BY sort_order ASC",
    [quote.id]
  );

  return {
    ...quote,
    breakdown: breakdownRes.rows
  };
}