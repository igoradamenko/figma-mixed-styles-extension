/* open-load all pages and then copy-paste into figma */
// function genStubAndCopy() {
//   const result = {};
//
//   traverseAndStore(figma.root, result, null);
//
//   copy(JSON.stringify(result));
//
//   console.log('Done');
//
//   function traverseAndStore(figmaNode, resultNode) {
//     resultNode.id = figmaNode.id;
//     resultNode.name = figmaNode.name;
//     resultNode.type = figmaNode.type;
//
//     if (figmaNode.children) {
//       resultNode.children = [];
//
//       figmaNode.children.forEach(figmaChild => {
//         const resultChild = {};
//         resultNode.children.push(resultChild);
//
//         traverseAndStore(figmaChild, resultChild);
//       });
//     }
//   }
// }

figmaFillParents(window.figmaGeneratedStubs, null);
figmaFillPagesSelection(window.figmaGeneratedStubs);

window.figmaStubs = window.figmaGeneratedStubs;


function figmaFillParents(figmaNode, parentNode) {
  figmaNode.parent = parentNode;

  if (figmaNode.children) {
    figmaNode.children.forEach(child => figmaFillParents(child, figmaNode));
  }
}

function figmaFillPagesSelection(figmaNode) {
  figmaNode.children.forEach(page => page.selection = []);
}
