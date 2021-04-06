# Figma Mixed Styles Extension

<img align="right"
     alt="Лого проекта: цветная иконка компонента"
     src="icon.svg"
     width="128"
     height="128">

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/fadeacofglmdopmolpaoaacijjfifcpe?label=Chrome%20Web%20Store) 
![Mozilla Add-on](https://img.shields.io/amo/v/figma-mixed-styles?label=Mozilla%20Add-ons)

Генератор CSS для текстовых нод Figma со сложной стилизацией. Работает даже в режиме «View only».

Поддерживаемые браузеры: Chrome, Firefox и любой браузер на основе Chromium (Edge, Opera, Yandex.Browser и другие).

[In English](./README.md)

[![Figma Mixed Styles в Chrome Web Store](./add-to-chrome.svg)](https://chrome.google.com/webstore/detail/figma-mixed-styles/fadeacofglmdopmolpaoaacijjfifcpe)
[![Figma Mixed Styles в Mozilla Add-ons](./add-to-firefox.svg)](https://addons.mozilla.org/en-US/firefox/addon/figma-mixed-styles/)

[![Демо видео на Ютубе](./youtube-demo.png)](https://youtu.be/mDQfaYA5ltA)

## Мотивация

В Figma нет встроенной возможности генерации CSS для текстовых нод со сложной стилизацией. Возможно можно использовать 
плагины, но они не работают в режиме «View only». 

Потому был создан этот плагин, как временное решение до тех пор, пока разработчики Фигмы не добавят функцию поиска.

## Установка

### Chrome Web Store

Пользователям Chrome или иного браузера на основе Chromium (Edge, Opera, Yandex.Browser, пр.) стоит устанавливать 
расширение из официального магазина Chrome:

**[Figma Mixed Styles](https://chrome.google.com/webstore/detail/figma-mixed-styles/fadeacofglmdopmolpaoaacijjfifcpe) в Chrome Web Store**

Нажмите на ссылку выше, и на открывшейся странице нажмите на «Add to Chrome».

### Firefox Add-ons

Пользователям Firefox стоит устанавливать расширение из официального магазина Firefox:

**[Figma Mixed Styles](https://addons.mozilla.org/en-US/firefox/addon/figma-mixed-styles/) в Firefox Browser Add-ons**

Нажмите на ссылку выше, и на открывшейся странице нажмите на «Add to Firefox».

### Ручная установка

#### Chrome и иные браузеры на основе Chromium

1. [Скачайте самый свежий релиз расширения](https://github.com/igoradamenko/figma-mixed-styles-extension/releases).
2. Распакуйте скаченный архив куда-то, где его данные не будут случайно удалены.
3. Откройте `chrome://extensions` в браузере.
4. Включите «Developer mode» (обычно кнопка для его включения находится где-то в углу страницы).
5. Нажмите «Load unpacked» (эта кнопка появляется только после включения режима разработчика).
6. Выберите папку с распакованным расширением (из п. 2).
7. Перезагрузите страницы Figma, которые были открыты до установки приложения, и можете начинать работу с расширением.

После перезагрузки браузер может предупредить о том, что установлено расширение к которому «нет доверия».
Но с этим ничего не поделаешь, это цена, которую приходится платить за установку расширений из исходников. 

#### Firefox

Пользователи Windows и macOS должны установить [Firefox Developer Edition](https://www.mozilla.org/ru/firefox/developer/)
или [Firefox Nightly](https://www.mozilla.org/ru/firefox/channel/desktop/#nightly). Увы, установить распакованное
расширение в обычный Firefox так, чтобы оно не удалилось после перезагрузки браузера, нельзя.

Пользователем Linux и тем, кто установил описанные выше браузеры, нужно:

1. [Скачать самый свежий релиз расширения](https://github.com/igoradamenko/figma-mixed-styles-extension/releases).
2. Открыть `about:config`, принять риск, найти переменную `xpinstall.signatures.required` и выставить её в `false`.
3. Открыть `about:addons`, нажать на иконку настроек и выбрать «Install Add-on From File...» из раскрывшегося меню.
4. Выбрать скаченный ZIP-файл с расширением (из п. 1).
5. Одобрить установку.

## Ещё

- **[Figma Search Extension](https://github.com/igoradamenko/figma-search-extension)**


[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
