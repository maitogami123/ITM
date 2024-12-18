const mongoose = require('mongoose');
const QualificationCode = require('./enum/QualificationCode'); // Import the enum
const Gender = require('./enum/Gender');
const TeacherGrade = require('./enum/TeacherGrade');

const staffSchema = new mongoose.Schema({
  mscb: { type: String, unique: true, required: true },
  name: { type: String },
  image: { type: String },
  gender: {
    type: String,
    enum: Object.values(Gender),
    default: Gender.NOT_DECLARE,
  },
  dateOfBirth: { type: String },
  phone: { type: String },
  qualificationCode: {
    type: String,
    enum: Object.values(QualificationCode),
    default: QualificationCode.ThS, // Use values from QualificationCode enum
  },
  isPermanent: { type: Boolean },
  startDate: {
    type: String,
    default: () => {
      const date = new Date(Date.now());
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    },
  },
  lastIncrementDate: { type: String },
  notes: { type: String },
  mainSpecialization: { type: String },
  positions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Position' }],
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
  competitions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competition' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tham chiếu tới User
  teacherGrade: {
    type: String,
    enum: Object.values(TeacherGrade),
    required: true,
  },
  salaryLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 9,
  },
  salaryCoefficent: {
    type: Number,
    default: function () {
      // Tính hệ số lương cơ bản dựa trên bậc 1
      switch (this.teacherGrade) {
        case TeacherGrade.GRADE_I:
          return 3.0; // Giả sử hệ số bậc 1 của hạng I là 3.00
        case TeacherGrade.GRADE_II:
          return 2.67; // Giả sử hệ số bậc 1 của hạng II là 2.67
        case TeacherGrade.GRADE_III:
          return 2.34; // Giả sử hệ số bậc 1 của hạng III là 2.34
        default:
          return 2.34;
      }
    },
  },
  salary: {
    type: Number,
    default: function () {
      return this.salaryCoefficent * 2340000; // Lương = hệ số * 2.340.000
    },
  },
  nextPromotionDate: {
    type: Date,
    default: function () {
      const today = new Date();
      switch (this.teacherGrade) {
        case TeacherGrade.GRADE_I:
          return new Date(today.setFullYear(today.getFullYear() + 5));
        case TeacherGrade.GRADE_II:
          return new Date(today.setFullYear(today.getFullYear() + 3));
        case TeacherGrade.GRADE_III:
          return new Date(today.setFullYear(today.getFullYear() + 2));
        default:
          return today;
      }
    },
  },
});

// Middleware để tự động cập nhật hệ số lương khi thay đổi bậc lương
staffSchema.pre('save', async function (next) {
  if (this.isModified('salaryLevel') || this.isModified('teacherGrade')) {
    let baseCoefficient;
    let incrementValue;

    switch (this.teacherGrade) {
      case TeacherGrade.GRADE_I:
        baseCoefficient = 3.0;
        incrementValue = 0.36;
        break;
      case TeacherGrade.GRADE_II:
        baseCoefficient = 2.67;
        incrementValue = 0.34;
        break;
      case TeacherGrade.GRADE_III:
        baseCoefficient = 2.34;
        incrementValue = 0.33;
        break;
      default:
        baseCoefficient = 2.34;
        incrementValue = 0.33;
    }

    this.salaryCoefficent = baseCoefficient + incrementValue * (this.salaryLevel - 1);
    this.salary = this.salaryCoefficent * 2340000;
  }

  // Calculate base promotion date
  let basePromotionDate = new Date();
  switch (this.teacherGrade) {
    case TeacherGrade.GRADE_I:
      basePromotionDate.setFullYear(basePromotionDate.getFullYear() + 5);
      break;
    case TeacherGrade.GRADE_II:
      basePromotionDate.setFullYear(basePromotionDate.getFullYear() + 3);
      break;
    case TeacherGrade.GRADE_III:
      basePromotionDate.setFullYear(basePromotionDate.getFullYear() + 2);
      break;
  }

  // Calculate reduction in months based on rewards and competitions
  const rewardsReduction = (this.rewards?.length || 0) * 3; // 3 months per reward
  const competitionsReduction = (this.competitions?.length || 0) * 1; // 1 month per competition
  let totalReductionMonths = rewardsReduction + competitionsReduction;

  // Get the total months between now and base promotion date
  const today = new Date();
  const monthsDifference =
    (basePromotionDate.getFullYear() - today.getFullYear()) * 12 + (basePromotionDate.getMonth() - today.getMonth());

  // Limit the reduction to not go below current date
  totalReductionMonths = Math.min(totalReductionMonths, monthsDifference - 1);

  this.nextPromotionDate = new Date(basePromotionDate.setMonth(basePromotionDate.getMonth() - totalReductionMonths));

  next();
});

module.exports = mongoose.model('Staff', staffSchema);
