import {resolve} from 'pathe';
import {camelCase, capitalCase, pascalCase, paramCase} from 'change-case';

import {ProjectService} from './project.service';

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

export class GenerateService {
  SERVICE = 'service';
  LAYOUT = 'layout';
  PAGE = 'page';
  COMPONENT = 'component';
  PARTIAL = 'partial';
  HELPER = 'helper';
  CONST = 'const';
  STORE = 'store';
  TYPE = 'type';

  DEFAULT_FOLDERS = {
    [this.SERVICE]: 'services',
    [this.LAYOUT]: 'layouts',
    [this.PAGE]: 'pages',
    [this.COMPONENT]: 'components',
    [this.PARTIAL]: 'partials',
    [this.HELPER]: 'helpers',
    [this.CONST]: 'consts',
    [this.STORE]: 'stores',
    [this.TYPE]: 'types',
  };

  constructor(private projectService: ProjectService) {}

  async generate(
    type: string,
    dest: string,
    typePrefixed = false,
    isNested = false
  ) {
    const templates: Template[] = [];
    // process
    const {componentPrefix, srcDir} = await this.projectService.getOptions();
    const destSplits = dest.replace(/\\/g, '/').split('/') as string[];
    const name = (destSplits.pop() as string).split('.')[0].toLowerCase();
    const typeCapital = type[0].toUpperCase() + type.substring(1);
    const nameConst = name.replace(/-/g, '_').toUpperCase();
    const nameCamel = camelCase(name);
    const namePascal = pascalCase(name);
    const nameCapital = capitalCase(name);
    const nameParam = paramCase(name);
    const className =
      (type === this.COMPONENT || type === this.SERVICE ? '' : typeCapital) +
      nameCapital.replace(/ /g, '') +
      (type !== this.COMPONENT && type !== this.SERVICE ? '' : typeCapital);
    const classNameWithPrefix = capitalCase(componentPrefix) + className;
    const tagName =
      type === this.COMPONENT
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
    const {path: mainPath, fullPath: mainFullPath} = this.buildPath(
      srcDir,
      nameParam,
      type,
      destSplits,
      typePrefixed,
      isNested,
      'ts'
    );
    // main
    const mainContent = this.buildMainContent(type, names);
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

  private buildPath(
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
    const defaultFolder = this.DEFAULT_FOLDERS[type];
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

  private buildMainContent(
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
      case this.SERVICE:
        return this.contentForService(className);
      case this.LAYOUT:
        return this.contentForLayout(classNameWithPrefix, tagName);
      case this.PAGE:
        return this.contentForPage(classNameWithPrefix, tagName);
      case this.COMPONENT:
        return this.contentForComponent(classNameWithPrefix, tagName);
      case this.PARTIAL:
        return this.contentForPartial(nameCamel, typeCapital);
      case this.HELPER:
        return this.contentForHelper(nameCamel);
      case this.CONST:
        return this.contentForConst(nameConst);
      case this.STORE:
        return this.contentForStore(nameCamel, typeCapital);
      case this.TYPE:
        return this.contentForType(namePascal);
      default:
        return '';
    }
  }

  private contentForService(className: string) {
    return `export class ${className} {
  name = '${className}';
}

export default ${className};\n`;
  }

  private contentForLayout(className: string, tagName: string) {
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

  private contentForPage(className: string, tagName: string) {
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

  private contentForComponent(className: string, tagName: string) {
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
    this.customEvent.emit({payload: '...'});
  }

  protected render() {
    return html\`<p @click=\${this.emitCustomEvent}>${className}</p>\`;
  }

  static styles = css\`\`;
}\n`;
  }

  private contentForPartial(nameCamel: string, typeCapital: string) {
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

  private contentForHelper(nameCamel: string) {
    return `export function ${nameCamel}(param: string) {
  return param.toUpperCase();
}\n`;
  }

  private contentForConst(nameConst: string) {
    return `export const ${nameConst} = 'value';\n`;
  }

  private contentForStore(nameCamel: string, typeCapital: string) {
    return `import {createStore} from '@tinijs/store';

export const ${nameCamel}${typeCapital} = createStore({
  name: '${nameCamel}',
});\n`;
  }

  private contentForType(namePascal: string) {
    return `export type ${namePascal} = any;\n`;
  }
}
