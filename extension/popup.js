// we need it for tests
// but it's safe for users because window.parent in extension is its window itself
if (window.parent.__PATCH_WINDOW_FOR_TESTS__) {
  window.parent.__PATCH_WINDOW_FOR_TESTS__(window);
}

const contentNode = $('#content');

const CSS_PROPS_STYLES = {
  UNIT: 'UNIT',
  STRING: 'STRING',
  KEYWORD: 'KEYWORD',
  COLOR: 'COLOR',
};

run();

function run() {
  chrome.runtime.onMessage.addListener(onMessageGet);
  sendMessage({ type: 'POPUP_OPEN' });
}



/* COMMUNICATION */

function onMessageGet(message) {
  console.log(`Popup got ${message.type}`);

  switch (message.type) {
    case 'EXTRACTION_COMPLETED':
      showResult(message.data);
      return;
  }
}

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
    console.log(`Popup sent ${message.type}`);
  });
}



/* MARKUP */

function showResult(data) {
  switch (data.status) {
    case 'EMPTY':
      contentNode.innerHTML = buildErrorMarkup('Nothing selected');
      return;

    case 'MORE_THAN_ONE':
      contentNode.innerHTML = buildErrorMarkup('More than one node selected');
      return;

    case 'NOT_TEXT_NODE':
      contentNode.innerHTML = buildErrorMarkup('Non-text node selected');
      return;

    case 'OK':
      contentNode.innerHTML = buildCSSMarkup(data.result);
      initCopyButtons();
      return;
  }
}

function buildErrorMarkup(text) {
  return `<div class="error">${text}</div>`;
}

function buildCSSMarkup({ commonStyles, stopsWithStyles, characters }) {
  const STYLE_TO_BUILDER = {
    TEXT_ALIGN: buildTextAlign,
    TEXT_DECORATION: buildTextDecoration,
    TEXT_INDENT: buildTextIndent,
    TEXT_TRANSFORM: buildTextTransform,
    LETTER_SPACING: buildLetterSpacing,
    X_FONT_FAMILY: buildFontFamily,
    FONT_SIZE: buildFontSize,
    X_FONT_WEIGHT: buildFontWeight,
    X_FONT_STYLE: buildFontStyle,
    LINE_HEIGHT: buildLineHeight,
    COLOR: buildColor,

    FONT: () => {
      // dont need it, because we split FONT to X_FONT_* in bridge
      throw new Error('Something went wrong!');
    },
  };

  const styles = Object.keys(STYLE_TO_BUILDER);

  let result = [];

  if (commonStyles.length) {
    let block = '<div class="css-block"><p class="comment">/* COMMON */</p>'
    block += `<code class="ruleset">${stylesArrayToCSS(commonStyles)}</code><button class="copy-button">Copy</button></div>`;
    result.push(block);
  }

  for (let i = 0; i < stopsWithStyles.length; i++) {
    const stops = stopsWithStyles[i];
    const string = characters.substring(stops.start, stops.end);

    if (string.trim().length === 0) continue;

    let block = `<div class="css-block"><p class="comment">/* ${characters.substring(stops.start, stops.end)} */</p>`;
    block += `<code class="ruleset">${stylesArrayToCSS(stops.styles)}</code><button class="copy-button">Copy</button></div>`;
    result.push(block);
  }

  return result.join('<br><br>'); // use br instead of styles to make it better when copying

  function stylesArrayToCSS(arr) {
    return styles
      .reduce((acc, styleName) => {
        const found = arr.find(i => i.style === styleName);

        if (!found) return acc;

        acc = acc.concat(STYLE_TO_BUILDER[styleName](found.value));

        return acc;
      }, [])
      .join('<br>');
  }
}

function buildTextAlign(value) {
  if (value === 'LEFT') {
    return [];
  }

  return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'text-align', value.toLowerCase())];
}

function buildTextIndent(value) {
  if (value === 0) {
    return [];
  }

  return [buildCSSProp(CSS_PROPS_STYLES.UNIT, 'text-indent', value, 'px')];
}

function buildFontFamily(value) {
  return [buildCSSProp(CSS_PROPS_STYLES.STRING, 'font-family', `'${value}'`)];
}

function buildFontWeight(value) {
  return [buildCSSProp(CSS_PROPS_STYLES.UNIT, 'font-weight', value)];
}

function buildFontStyle(value) {
  if (value === 'normal') {
    return [];
  }

  return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'font-style', value)];
}

function buildFontSize(value) {
  return [buildCSSProp(CSS_PROPS_STYLES.UNIT, 'font-size', value, 'px')];
}

function buildLineHeight(value) {
  if (value.unit === 'AUTO') {
    return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'line-height', 'normal')];
  }

  let cssValue = value.value;
  let cssUnit = 'px';

  if (value.unit === 'PERCENT') {
    cssValue = +(cssValue / 100).toFixed(2);
    cssUnit = '';
  }

  return [buildCSSProp(CSS_PROPS_STYLES.UNIT, 'line-height', cssValue, cssUnit)];
}

function buildTextTransform(value) {
  switch(value) {
    // TODO: show default values only when they are redefined by parent?
    case 'ORIGINAL':
      return [];

    case 'UPPER':
    case 'LOWER':
      return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'text-transform', (value + 'case').toLowerCase())];

    case 'TITLE':
      return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'text-transform', 'capitalize')];
  }
}

function buildTextDecoration(value) {
  switch(value) {
    case 'NONE':
      return [];

    case 'UNDERLINE':
      return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'text-decoration', 'underline')];

    case 'STRIKETHROUGH':
      return [buildCSSProp(CSS_PROPS_STYLES.KEYWORD, 'text-decoration', 'line-through')];
  }
}

function buildLetterSpacing(value) {
  if (value.value === 0) {
    return [];
  }

  let cssValue = +value.value.toFixed(2);
  let cssUnit = 'px';

  if (value.unit === 'PERCENT') {
    cssValue = cssValue / 100;
    cssUnit = 'em';
  }

  return [buildCSSProp(CSS_PROPS_STYLES.UNIT, 'letter-spacing', cssValue, cssUnit)];
}

function buildColor(value) {
  const paint = value[0];

  if (paint.type !== 'SOLID') {
    console.warn('Got paint type that is not SOLID:', paint);
    return [];
  }

  const color = paint.color;
  const opacity = paint.opacity;

  return [
    buildCSSProp(CSS_PROPS_STYLES.COLOR, 'color', opacity !== 1 ? colorToRGBA(color, opacity) : colorToHex(color))
  ];

  function colorToHex({ r, g, b }) {
    let value = [toHex(r), toHex(g), toHex(b)].join('');

    if (value[0] === value[1] && value[2] === value[3] && value[4] === value[5]) {
      value = value[0] + value[2] + value[4];
    }

    return `#${value}`;

    function toHex(v) {
      return `0${Math.floor(v * 255).toString(16)}`.slice(-2);
    }
  }

  function colorToRGBA({ r, g, b }, opacity) {
    return ['rgba(', toRGB(r), ', ', toRGB(g), ', ', toRGB(b), ', ', toA(opacity), ')'].join('');

    function toRGB(v) {
      return Math.floor(v * 255);
    }

    function toA(v) {
      return +(v).toFixed(2);
    }
  }
}

function buildCSSProp(type, prop, value, unit = '') {
  let valueSuffix = '';

  if (type === CSS_PROPS_STYLES.COLOR) {
    valueSuffix = `<span class="color-preview" aria-hidden="true" style="background: ${value}"></span>`
  }

  return [
    prop,
    '<span class="punctuation">: </span>',
    `<span class="value value_type_${type.toLowerCase()}">${value}</span>`,
    `<span class="value value_type_keyword">${unit}</span>`,
    valueSuffix,
    '<span class="punctuation">;</span>',
  ].join('');
}

function initCopyButtons() {
  $$('.copy-button').forEach(button => {
    const rulesetNode = button.closest('.css-block').querySelector('.ruleset');
    let cooldownTimeout;

    button.addEventListener('click', () => {
      const css = rulesetNode.textContent.replace(/;(.)/g, ';\n$1');

      navigator.clipboard.writeText(css)
        .then(() => {
          button.innerHTML = 'Copied';

          clearTimeout(cooldownTimeout);
          cooldownTimeout = setTimeout(() => {
            button.innerHTML = 'Copy';
          }, 2000);
        })
        .catch(err => {
          console.error(err);
          button.innerHTML = `Can't :(`;
        });
    });

    button.addEventListener('mouseover', () => {
      rulesetNode.classList.add('ruleset_highlighted');
    });

    button.addEventListener('mouseleave', () => {
      rulesetNode.classList.remove('ruleset_highlighted');
    });
  });
}
