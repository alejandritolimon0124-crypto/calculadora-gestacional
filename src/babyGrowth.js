const EARLY_COMPARISONS = {
  4: ['una semilla de amapola', '🌱'],
  5: ['una semilla de ajonjolí', '🌱'],
  6: ['una lenteja', '🫘'],
  7: ['un arándano', '🫐'],
  8: ['un arándano grande', '🫐'],
  9: ['una nuez', '🌰'],
  10: ['un chabacano', '🍑'],
  11: ['un limón pequeño', '🍋'],
  12: ['un limón', '🍋'],
  13: ['un limón grande', '🍋'],
  14: ['una naranja pequeña', '🍊'],
  15: ['una naranja', '🍊'],
  16: ['un aguacate', '🥑'],
  17: ['una pera', '🍐'],
  18: ['un pimiento', '🫑'],
  19: ['un mango', '🥭'],
};

// 6–8 semanas: NHS Best Start in Life (longitud cabeza a nalgas).
// 9–14 semanas: percentil 50 de INTERGROWTH-21st, tamaño fetal temprano.
// 15–19 semanas: NHS Best Start in Life (longitud cabeza a nalgas).
// https://intergrowth21.com/sites/default/files/2023-01/03_fetal_size_zn9jyim.pdf
// https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/
const EARLY_LENGTH_CM = [
  [6, 0.6], [7, 1.0], [8, 1.6], [9, 2.19], [10, 3.26],
  [11, 4.38], [12, 5.56], [13, 6.78], [14, 8.06],
  [15, 10.1], [16, 11.6], [17, 12.0], [18, 14.2], [19, 15.3],
];

// NHS Best Start in Life: longitud aproximada de cabeza a talón.
// Las semanas intermedias se interpolan y se redondean a 0,1 cm.
const LATE_LENGTH_CM = [
  [20, 25.6], [24, 30], [28, 37.6], [32, 42.4], [36, 47.4], [40, 51.2],
];
const LATE_COMPARISONS = [
  [20, 'un plátano', '🍌'],
  [24, 'una mazorca', '🌽'],
  [28, 'una berenjena', '🍆'],
  [32, 'una lechuga', '🥬'],
  [36, 'una lechuga romana', '🥬'],
  [40, 'una calabaza', '🎃'],
];

function interpolate(anchors, position) {
  if (position <= anchors[0][0]) return anchors[0][1];
  for (let index = 1; index < anchors.length; index += 1) {
    const [endWeek, endLength] = anchors[index];
    if (position <= endWeek) {
      const [startWeek, startLength] = anchors[index - 1];
      return startLength + (endLength - startLength) * (position - startWeek) / (endWeek - startWeek);
    }
  }
  return anchors[anchors.length - 1][1];
}

function approximateLength(week, days) {
  if (week < 6 || week > 40) return null;
  const position = week + days / 7;
  const anchors = week < 20 ? EARLY_LENGTH_CM : LATE_LENGTH_CM;
  // No interpolar a través de la semana 20: cambia la forma de medir.
  const boundedPosition = week === 19 ? 19 : Math.min(position, 40);
  return Math.round(interpolate(anchors, boundedPosition) * 10) / 10;
}

export function babyGrowthAtWeek(week, days = 0) {
  if (week < 4) return {
    comparisonName: 'un pequeño comienzo',
    visual: '✳',
    image: null,
    imageStage: null,
    length: null,
    lengthBasis: null,
  };
  if (week < 20) {
    const [comparisonName, visual] = EARLY_COMPARISONS[week];
    return {
      comparisonName,
      visual,
      image: week < 6 ? null : week < 11 ? `${import.meta.env.BASE_URL}baby-week-8.jpg` : `${import.meta.env.BASE_URL}baby-week-14.jpg`,
      imageStage: week < 6 ? null : week < 11 ? 'primeras semanas' : 'segundo trimestre temprano',
      length: approximateLength(week, days),
      lengthBasis: week < 6 ? null : 'de cabeza a nalgas',
    };
  }
  let comparison = LATE_COMPARISONS[0];
  for (const item of LATE_COMPARISONS) {
    if (week >= item[0]) comparison = item;
  }
  return {
    comparisonName: comparison[1],
    visual: comparison[2],
    image: week < 32 ? `${import.meta.env.BASE_URL}baby-week-20.jpg` : `${import.meta.env.BASE_URL}baby-week-40.jpg`,
    imageStage: week < 32 ? 'segundo trimestre' : 'tercer trimestre',
    length: approximateLength(week, days),
    lengthBasis: week > 40 ? null : 'de cabeza a talón',
  };
}
