
exports.handler = async function(event) {
  try {
    const input = JSON.parse(event.body);
    const { invoiceAmount, endDate, preferredPaymentDate } = input;

    if (invoiceAmount <= 0) {
      return responseWithError("Invoice amount must be greater than 0", invoiceAmount);
    }

    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      return responseWithError("Invalid end date", invoiceAmount);
    }

    const today = new Date();
    const invoiceYear = endDateObj.getFullYear();
    const invoiceMonth = endDateObj.getMonth();
    const lastPossiblePaymentDate = new Date(invoiceYear, invoiceMonth - 2, preferredPaymentDate);

    const monthsDiff = Math.floor((lastPossiblePaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const numberOfPayments = Math.min(10, Math.max(1, monthsDiff));

    const basePaymentAmount = Math.floor((invoiceAmount / numberOfPayments) * 100) / 100;
    const remainder = invoiceAmount - (basePaymentAmount * numberOfPayments);

    const payments = [];
    let currentDate = new Date();
    currentDate.setDate(preferredPaymentDate);

    const minFirstPaymentDate = new Date(today);
    minFirstPaymentDate.setDate(minFirstPaymentDate.getDate() + 7);

    if (currentDate <= minFirstPaymentDate) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    for (let i = 0; i < numberOfPayments; i++) {
      const amount = i === 0 
        ? basePaymentAmount + remainder 
        : basePaymentAmount;

      payments.push({
        amount: Number(amount.toFixed(2)),
        date: currentDate.toISOString().split('T')[0]
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalAmount: invoiceAmount,
        numberOfPayments,
        payments
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  function responseWithError(message, invoiceAmount) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        totalAmount: invoiceAmount,
        numberOfPayments: 0,
        payments: [],
        error: message
      })
    };
  }
};
