export const TIME_BOUNDARIES = {
  morningLatest: '12:00',
  afternoonEarliest: '12:01',
  afternoonLatest: '17:59',
  nightEarliest: '18:00',
};

const toMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return (hours * 60) + minutes;
};

const formatBoundaryMessage = (label, expected) => `${label} time must be ${expected}.`;

export const validateTimeSlot = (label, timeValue) => {
  if (!timeValue) {
    return { valid: true, message: '' };
  }

  const minutes = toMinutes(timeValue);
  if (minutes === null) {
    return { valid: false, message: `${label} time is not valid.` };
  }

  if (label === 'Morning') {
    if (minutes > (12 * 60)) {
      return { valid: false, message: formatBoundaryMessage('Morning', 'at or before 12:00 PM') };
    }
  }

  if (label === 'Afternoon') {
    if (minutes <= (12 * 60) || minutes >= (18 * 60)) {
      return { valid: false, message: formatBoundaryMessage('Afternoon', 'after 12:00 PM and before 6:00 PM') };
    }
  }

  if (label === 'Night') {
    if (minutes < (18 * 60)) {
      return { valid: false, message: formatBoundaryMessage('Night', '6:00 PM or later') };
    }
  }

  return { valid: true, message: '' };
};

export const validateTimeAllocation = ({ morningTime, afternoonTime, nightTime }) => {
  const morning = validateTimeSlot('Morning', morningTime);
  if (!morning.valid) return morning;

  const afternoon = validateTimeSlot('Afternoon', afternoonTime);
  if (!afternoon.valid) return afternoon;

  const night = validateTimeSlot('Night', nightTime);
  if (!night.valid) return night;

  return { valid: true, message: '' };
};
