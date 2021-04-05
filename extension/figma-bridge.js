(() => {
  const scriptNode = document.getElementById('figma-mixed-styles-extension-request');

  const type = scriptNode.dataset.type;

  const STYLES = {
    TEXT_ALIGN: 'TEXT_ALIGN',
    TEXT_INDENT: 'TEXT_INDENT',
    FONT: 'FONT',
    FONT_SIZE: 'FONT_SIZE',
    LINE_HEIGHT: 'LINE_HEIGHT',
    TEXT_TRANSFORM: 'TEXT_TRANSFORM',
    TEXT_DECORATION: 'TEXT_DECORATION',
    LETTER_SPACING: 'LETTER_SPACING',
    COLOR: 'COLOR',
  };

  const STYLE_TO_SINGLE_PROP = {
    [STYLES.TEXT_ALIGN]: 'textAlignHorizontal',
    [STYLES.TEXT_INDENT]: 'paragraphIndent',
  };

  // TODO: fillStyleId? textStyleId?
  const STYLE_TO_RANGE_PROP = {
    [STYLES.FONT_SIZE]: 'getRangeFontSize',
    [STYLES.FONT]: 'getRangeFontName',
    [STYLES.TEXT_TRANSFORM]: 'getRangeTextCase',
    [STYLES.TEXT_DECORATION]: 'getRangeTextDecoration',
    [STYLES.LETTER_SPACING]: 'getRangeLetterSpacing',
    [STYLES.LINE_HEIGHT]: 'getRangeLineHeight',
    [STYLES.COLOR]: 'getRangeFills',
  };

  const STYLE_TO_COMPARATOR = {
    [STYLES.TEXT_ALIGN]: areScalarsEqual,
    [STYLES.TEXT_INDENT]: areScalarsEqual,
    [STYLES.FONT]: areFontsEqual,
    [STYLES.FONT_SIZE]: areScalarsEqual,
    [STYLES.LINE_HEIGHT]: areLineHeightsEqual,
    [STYLES.TEXT_TRANSFORM]: areScalarsEqual,
    [STYLES.TEXT_DECORATION]: areScalarsEqual,
    [STYLES.LETTER_SPACING]: areLetterSpacingsEqual,
    [STYLES.COLOR]: arePaintsEqual,
  };

  switch (type) {
    case 'POPUP_OPEN':
      extractStyles();
      return;
  }

  function extractStyles() {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      sendMessage({ type: 'EXTRACTION_COMPLETED', data: { status: 'EMPTY' } });
      return;
    }

    if (selection.length > 1) {
      sendMessage({ type: 'EXTRACTION_COMPLETED', data: { status: 'MORE_THAN_ONE' } });
      return;
    }

    if (selection[0].type !== 'TEXT') {
      sendMessage({ type: 'EXTRACTION_COMPLETED', data: { status: 'NOT_TEXT_NODE' } });
      return;
    }

    const result = getNodeStyles(selection[0]);

    sendMessage({ type: 'EXTRACTION_COMPLETED', data: { status: 'OK', result } });
  }

  function getNodeStyles(node) {
    let commonStyles = getNodeCommonStyles(node);

    const { commonRangeStyles, rangeStylesStops } = getNodeRangeStyles(node);
    commonStyles = commonStyles.concat(commonRangeStyles);

    const stopsWithStyles = findStopsWithStyles(rangeStylesStops);

    return {
      commonStyles,
      stopsWithStyles,
      characters: node.characters,
    };
  }

  function getNodeCommonStyles(node) {
    const commonStyles = [];
    const singleStyles = Object.keys(STYLE_TO_SINGLE_PROP);

    for (let i = 0; i < singleStyles.length; i++) {
      const style = extractSingle(node, singleStyles[i]);
      commonStyles.push(style);
    }

    return commonStyles;
  }

  function getNodeRangeStyles(node) {
    const commonRangeStyles = [];
    const rangeStyles = Object.keys(STYLE_TO_RANGE_PROP);
    const rangeStylesStops = [];

    for (let i = 0; i < rangeStyles.length; i++) {
      const stops = divideAndExtract(node, rangeStyles[i], 0, node.characters.length);
      const optimizedStops = optimizeStops(stops, STYLE_TO_COMPARATOR[rangeStyles[i]]);

      if (optimizedStops.length === 1) {
        commonRangeStyles.push(optimizedStops[0]);
      } else {
        rangeStylesStops.push(optimizedStops);
      }
    }

    return { commonRangeStyles, rangeStylesStops };
  }

  function findStopsWithStyles(rangeStylesStops) {
    const minimalStops = findMinimalRangeStylesStops(rangeStylesStops);
    const stopsWithStyles = [];

    for (let i = 1; i < minimalStops.length; i++) {
      const start = minimalStops[i - 1];
      const end = minimalStops[i];

      const styles = rangeStylesStops.map(slice => {
        return slice.find(v => v.start <= start && v.end >= end);
      });

      stopsWithStyles.push({ start, end, styles });
    }

    return stopsWithStyles;
  }

  function findMinimalRangeStylesStops(slices) {
    return slices
      .reduce((acc, sliceValues) => {
        sliceValues.forEach(value => {
          if (!acc.includes(value.start)) {
            acc.push(value.start);
          }

          if (!acc.includes(value.end)) {
            acc.push(value.end);
          }
        });

        return acc;
      }, [])
      .sort((a, b) => a - b);
  }

  function optimizeStops(stops, areEqual) {
    if (stops.length === 0) return [];

    const resultStops = [stops[0]];
    let lastResultIndex = 0;

    for (let i = 1; i < stops.length; i++) {
      if (!areEqual(stops[i].value, resultStops[lastResultIndex].value)) {
        resultStops.push(stops[i]);
        lastResultIndex++;
        continue;
      }

      resultStops[lastResultIndex].end = stops[i].end;
    }

    return resultStops;
  }

  function divideAndExtract(node, style, start, end) {
    const result = extractRange(node, style, start, end);

    if (result.value !== figma.mixed) {
      return [{ start, end, ...result }];
    }

    const leftStart = start;
    const leftEnd = Math.floor((start + end) / 2);
    const rightStart = leftEnd;
    const rightEnd = end;

    return [...divideAndExtract(node, style, leftStart, leftEnd), ...divideAndExtract(node, style, rightStart, rightEnd)];
  }

  function extractRange(node, style, start, end) {
    return { style, value: node[STYLE_TO_RANGE_PROP[style]](start, end) };
  }

  function extractSingle(node, style) {
    return { style, value: node[STYLE_TO_SINGLE_PROP[style]] };
  }



  /* COMPARATORS */

  function areScalarsEqual(s1, s2) {
    return s1 === s2;
  }

  function areLineHeightsEqual(lh1, lh2) {
    return compareFields(['unit', 'value'], lh1, lh2);
  }

  function areLetterSpacingsEqual(ls1, ls2) {
    return compareFields(['unit', 'value'], ls1, ls2);
  }

  function arePaintsEqual(paints1, paints2) {
    if (paints1.length !== paints2.length) return false;

    return paints1.every((p1, i) => comparePaints(p1, paints2[i]));

    function comparePaints(paint1, paint2) {
      if (!compareFields(['visible', 'opacity', 'blendMode', 'type'], paint1, paint2)) {
        return false;
      }

      switch(paint1.type) {
        case 'SOLID':
          return compareFields(['color.r', 'color.g', 'color.b'], paint1, paint2);

        // TODO: implement others?
      }

      return false;
    }
  }

  function areFontsEqual(fn1, fn2) {
    return compareFields(['family', 'style'], fn1, fn2);
  }



  /* HELPERS */

  function compareFields(fields, el1, el2) {
    return fields.every(field => {
      const value1 = reduceField(field, el1);
      const value2 = reduceField(field, el2);

      return value1 === value2;
    });

    function reduceField(fieldPath, el) {
      const fields = fieldPath.split('.');
      let value = el;

      for (let i = 0; i < fields.length; i++) {
        value = value[fields[i]];
        if (typeof value === 'undefined') break;
      }

      return value;
    }
  }

  function sendMessage(message) {
    const event = new CustomEvent('figma-mixed-styles-event', {
      detail: message
    });
    scriptNode.dispatchEvent(event);
    log(`Sent message ${message.type} to bg`);
  }

  function log(...rest) {
    console.log('[FIGMA SEARCH: BRIDGE]', ...rest);
  }
})();
