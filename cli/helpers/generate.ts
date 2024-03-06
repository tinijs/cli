import {resolve} from 'pathe';
import {camelCase, capitalCase, pascalCase, kebabCase} from 'change-case';

import {getTiniApp} from './tini.js';

interface Names {
  typeCapital: string;
  name: string;
  nameConst: string;
  nameCamel: string;
  namePascal: string;
  nameCapital: string;
  nameParam: string;
  className: string;
  classNameWithPrefix: string;
  tagName: string;
}

interface Template extends Names {
  path: string;
  fullPath: string;
  content: string;
}

export const SERVICE = 'service';
export const LAYOUT = 'layout';
export const PAGE = 'page';
export const COMPONENT = 'component';
export const PARTIAL = 'partial';
export const HELPER = 'helper';
export const CONST = 'const';
export const STORE = 'store';
export const TYPE = 'type';

export const DEFAULT_FOLDERS = {
  [SERVICE]: 'services',
  [LAYOUT]: 'layouts',
  [PAGE]: 'pages',
  [COMPONENT]: 'components',
  [PARTIAL]: 'partials',
  [HELPER]: 'helpers',
  [CONST]: 'consts',
  [STORE]: 'stores',
  [TYPE]: 'types',
} as Record<string, string>;

export async function generate(
  type: string,
  dest: string,
  typePrefixed = false,
  isNested = false
) {
  const templates: Template[] = [];
  // process
  const {
    config: {componentPrefix, srcDir},
  } = await getTiniApp();
  const destSplits = dest.replace(/\\/g, '/').split('/') as string[];
  const name = (destSplits.pop() as string).split('.')[0].toLowerCase();
  const typeCapital = type[0].toUpperCase() + type.substring(1);
  const nameConst = name.replace(/-/g, '_').toUpperCase();
  const nameCamel = camelCase(name);
  const namePascal = pascalCase(name);
  const nameCapital = capitalCase(name);
  const nameParam = kebabCase(name);
  const className =
    (type === COMPONENT || type === SERVICE ? '' : typeCapital) +
    nameCapital.replace(/ /g, '') +
    (type !== COMPONENT && type !== SERVICE ? '' : typeCapital);
  const classNameWithPrefix = capitalCase(componentPrefix) + className;
  const tagName =
    type === COMPONENT
      ? `${componentPrefix}-${nameParam}`
      : `${componentPrefix}-${type}-${nameParam}`;
  const names: Names = {
    typeCapital,
    name,
    nameConst,
    nameCamel,
    namePascal,
    nameCapital,
    nameParam,
    className,
    classNameWithPrefix,
    tagName,
  };
  const {path: mainPath, fullPath: mainFullPath} = buildPath(
    srcDir,
    nameParam,
    type,
    destSplits,
    typePrefixed,
    isNested,
    'ts'
  );
  // main
  const mainContent = buildMainContent(type, names);
  const mainTemplate = {
    ...names,
    path: mainPath,
    fullPath: mainFullPath,
    content: mainContent,
  };
  templates.push(mainTemplate);
  // result
  return templates;
}

function buildPath(
  src: string,
  name: string,
  type: string,
  destSplits: string[] = [],
  typePrefixed = false,
  isNested = false,
  ext = 'ts',
  extPrefix?: string
) {
  const filePaths = [...destSplits];
  if (isNested) {
    filePaths.push(name);
  }
  const defaultFolder = DEFAULT_FOLDERS[type];
  const path = [
    src,
    defaultFolder,
    ...filePaths,
    `${name}.${!typePrefixed ? '' : type + '.'}${
      !extPrefix ? '' : extPrefix + '.'
    }${ext}`,
  ]
    .join('/')
    .replace(`${defaultFolder}/${defaultFolder}`, defaultFolder);
  const fullPath = resolve(path);
  return {path, fullPath};
}

function buildMainContent(
  type: string,
  {
    typeCapital,
    className,
    classNameWithPrefix,
    tagName,
    nameCamel,
    namePascal,
    nameConst,
  }: Names
) {
  switch (type) {
    case SERVICE:
      return contentForService(className);
    case LAYOUT:
      return contentForLayout(classNameWithPrefix, tagName);
    case PAGE:
      return contentForPage(classNameWithPrefix, tagName);
    case COMPONENT:
      return contentForComponent(classNameWithPrefix, tagName);
    case PARTIAL:
      return contentForPartial(nameCamel, typeCapital);
    case HELPER:
      return contentForHelper(nameCamel);
    case CONST:
      return contentForConst(nameConst);
    case STORE:
      return contentForStore(nameCamel, typeCapital);
    case TYPE:
      return contentForType(namePascal);
    default:
      return '';
  }
}

function contentForService(className: string) {
  return `export class ${className} {
name = '${className}';
}

export default ${className};\n`;
}

function contentForLayout(className: string, tagName: string) {
  return `import {html, css} from 'lit';

import {Layout, TiniComponent} from '@tinijs/core';

@Layout({
name: '${tagName}',
})
export class ${className} extends TiniComponent {

protected render() {
  return html\`<div class="page"><slot></slot></div>\`;
}

static styles = css\`\`;
}\n`;
}

function contentForPage(className: string, tagName: string) {
  return `import {html, css} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';

@Page({
name: '${tagName}',
})
export class ${className} extends TiniComponent {

protected render() {
  return html\`<p>${className}</p>\`;
}

static styles = css\`\`;
}\n`;
}

function contentForComponent(className: string, tagName: string) {
  return `import {html, css} from 'lit';

import {Component, TiniComponent, OnCreate, Input, Output, EventEmitter} from '@tinijs/core';

@Component()
export class ${className} extends TiniComponent implements OnCreate {
static readonly defaultTagName = '${tagName}';

@Input() property?: string;
@Output() customEvent!: EventEmitter<{payload: any}>;

onCreate() {
  // element connected
}

emitCustomEvent() {
  customEvent.emit({payload: '...'});
}

protected render() {
  return html\`<p @click=\${emitCustomEvent}>${className}</p>\`;
}

static styles = css\`\`;
}\n`;
}

function contentForPartial(nameCamel: string, typeCapital: string) {
  return `import {html} from 'lit';

// Note: remember to registerComponents()
// if you use other components in this partial

export function ${nameCamel}${typeCapital}({
custom = 'foo'
}: {
custom?: string
} = {}) {
return html\`
  <p>Partial content: $\{custom}</p>
\`;
}\n`;
}

function contentForHelper(nameCamel: string) {
  return `export function ${nameCamel}(param: string) {
return param.toUpperCase();
}\n`;
}

function contentForConst(nameConst: string) {
  return `export const ${nameConst} = 'value';\n`;
}

function contentForStore(nameCamel: string, typeCapital: string) {
  return `import {createStore} from '@tinijs/store';

export const ${nameCamel}${typeCapital} = createStore({
name: '${nameCamel}',
});\n`;
}

function contentForType(namePascal: string) {
  return `export type ${namePascal} = any;\n`;
}
