const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const calculateNextIncrementDate = (qualificationCode, lastIncrementDate, rewards) => {
  const incrementPeriod = 36; // Default 3 years in months
  let adjustment = 0;

  // Calculate reduction based on rewards
  rewards.forEach((reward) => {
    // Adjust 1 month per reward
    adjustment -= 1;
  });

  return addMonths(lastIncrementDate, incrementPeriod + adjustment);
};

module.exports = { calculateNextIncrementDate };
