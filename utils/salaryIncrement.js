const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const calculateNextIncrementDate = (
  qualificationCode,
  lastIncrementDate = new Date(),
  rewards
) => {
  const incrementPeriod = 36;
  let adjustment = 0;

  // Calculate reduction based on rewards
  rewards.forEach((reward) => {
    adjustment -= 1;
  });

  return addMonths(lastIncrementDate, incrementPeriod + adjustment);
};

module.exports = { calculateNextIncrementDate };
