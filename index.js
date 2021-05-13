const fs = require("fs");

const fileNames = process.argv.splice(2);
const fileName = fileNames[0];
const data = JSON.parse(fs.readFileSync(fileName, "utf-8"));

const CASH_IN_CONFIG = {
  percents: 0.03,
  max: {
    amount: 5,
    currency: "EUR",
  },
};
const CASH_OUT_CONFIG_NATURAL = {
  percents: 0.3,
  week_limit: {
    amount: 1000,
    currency: "EUR",
  },
};
const CASH_OUT_CONFIG_JURIDICAL = {
  percents: 0.3,
  min: {
    amount: 0.5,
    currency: "EUR",
  },
};

// utility function
const diffBetweenDates = function findDayDifferenceBetweenDates(date1, date2) {
  const date_1 = new Date(date1);
  const date_2 = new Date(date2);
  const diffTime = Math.abs(date_2 - date_1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const cashInCommission = function calculateCashInCommission(amount) {
  let commission = parseFloat((amount * CASH_IN_CONFIG.percents) / 100).toFixed(
    2
  );

  if (commission > CASH_IN_CONFIG.max.amount) {
    commission = parseFloat(CASH_IN_CONFIG.max.amount).toFixed(2);
  }

  return commission;
};

const cashOutCommissionNatural = function calculateNaturalCashOutCommission(
  amount
) {
  let commission = parseFloat(
    (amount * CASH_OUT_CONFIG_NATURAL.percents) / 100
  ).toFixed(2);

  return commission;
};

const cashOutCommissionJuridical = function calculateJuridicalCashOutCommission(
  amount
) {
  let commission;

  commission = parseFloat(
    (amount * CASH_OUT_CONFIG_JURIDICAL.percents) / 100
  ).toFixed(2);

  if (commission < CASH_OUT_CONFIG_JURIDICAL.min.amount) {
    commission = parseFloat(CASH_OUT_CONFIG_JURIDICAL.min.amount).toFixed(2);
  }

  return commission;
};

let previousWeeklyExceededItem = {}; // to keep track of weekly transaction of natural users

data.map((item) => {
  let commission;

  if (item.type === "cash_in") {
    commission = cashInCommission(item.operation.amount);

    console.log(commission);
  }

  if (item.type === "cash_out") {
    if (item.user_type === "natural") {
      if (
        previousWeeklyExceededItem.date &&
        previousWeeklyExceededItem.user_id === item.user_id
      ) {
        const dateDiff = diffBetweenDates(
          previousWeeklyExceededItem.date,
          item.date
        );

        if (dateDiff <= 7) {
          commission = cashOutCommissionNatural(item.operation.amount);
          previousWeeklyExceededItem = item;

          console.log(commission);
        } else {
          commission = parseFloat(0).toFixed(2);
          previousWeeklyExceededItem = {};

          console.log(commission);
        }
      } else {
        if (item.operation.amount > CASH_OUT_CONFIG_NATURAL.week_limit.amount) {
          const exceedAmount =
            item.operation.amount - CASH_OUT_CONFIG_NATURAL.week_limit.amount;
          commission = cashOutCommissionNatural(exceedAmount);
          previousWeeklyExceededItem = item;

          console.log(commission);
        } else {
          commission = parseFloat(0).toFixed(2);

          console.log(commission);
        }
      }
    }

    if (item.user_type === "juridical") {
      commission = cashOutCommissionJuridical(item.operation.amount);
      console.log(commission);
    }
  }
});
