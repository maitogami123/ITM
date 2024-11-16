const generateRandomId = () => {
  return `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

module.exports = generateRandomId;
