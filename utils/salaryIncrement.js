const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const calculateNextIncrementDate = (teacherGrade, lastIncrementDate, rewards = []) => {
  if (!lastIncrementDate) {
    return new Date();
  }

  // Convert lastIncrementDate to Date object if it's a string
  const baseDate = new Date(lastIncrementDate);

  // Get base increment period in months based on teacher grade
  let incrementPeriodInMonths;
  switch (teacherGrade) {
    case 'V.07.01.01': // Grade I
      incrementPeriodInMonths = 60; // 5 years = 60 months
      break;
    case 'V.07.01.02': // Grade II
      incrementPeriodInMonths = 36; // 3 years = 36 months
      break;
    case 'V.07.01.03': // Grade III
      incrementPeriodInMonths = 24; // 2 years = 24 months
      break;
    default:
      incrementPeriodInMonths = 24;
  }

  // Calculate reduction in months based on rewards and competitions
  let reductionInMonths = 0;

  if (rewards && rewards.length > 0) {
    rewards.forEach((reward) => {
      if (reward.type === 'REWARD') {
        reductionInMonths += 3; // Each reward reduces 3 months
      } else if (reward.type === 'COMPETITION') {
        reductionInMonths += 1; // Each competition reduces 1 month
      }
    });
  }

  // Ensure minimum period is not less than 12 months
  const finalIncrementPeriod = Math.max(12, incrementPeriodInMonths - reductionInMonths);

  // Calculate next increment date
  const nextIncrementDate = new Date(baseDate);
  nextIncrementDate.setMonth(nextIncrementDate.getMonth() + finalIncrementPeriod);

  return nextIncrementDate;
};

module.exports = { calculateNextIncrementDate };
