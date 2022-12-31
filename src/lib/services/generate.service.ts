import {resolve} from 'path';
import {camelCase, capitalCase, pascalCase, paramCase} from 'change-case';

import {ProjectService} from './project.service';

interface Names {
  name: string;
  nameCamel: string;
  namePascal: string;
  nameCapital: string;
  nameParam: string;
  className: string;
  tagName: string;
}

interface Template extends Names {
  path: string;
  fullPath: string;
  content: string;
}

export class GenerateService {
  private SERVICE = 'service';
  private LAYOUT = 'layout';
  private PAGE = 'page';
  private COMPONENT = 'component';

  private DEFAULT_FOLDERS = {
    [this.SERVICE]: 'services',
    [this.LAYOUT]: 'layouts',
    [this.PAGE]: 'pages',
    [this.COMPONENT]: 'components',
  };

  SUPPORTED_TYPES = [this.SERVICE, this.LAYOUT, this.PAGE, this.COMPONENT];

  constructor(private projectService: ProjectService) {}

  async generate(type: string, dest: string, isNested = false) {
    const templates: Template[] = [];
    // process
    const options = await this.projectService.getOptions();
    const destSplits = dest.replace(/\\/g, '/').split('/') as string[];
    const name = (destSplits.pop() as string).split('.')[0].toLowerCase();
    const nameCamel = camelCase(name);
    const namePascal = pascalCase(name);
    const nameCapital = capitalCase(name);
    const nameParam = paramCase(name);
    const className =
      nameCapital.replace(/ /g, '') + type[0].toUpperCase() + type.substring(1);
    const tagName =
      type === this.COMPONENT
        ? `${options.componentPrefix}-${nameParam}`
        : `${nameParam}-${type}`;
    const names: Names = {
      name,
      nameCamel,
      namePascal,
      nameCapital,
      nameParam,
      className,
      tagName,
    };
    const {path: mainPath, fullPath: mainFullPath} = this.buildPath(
      options.source,
      nameParam,
      type,
      destSplits,
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
    nested = false,
    ext = 'ts',
    extPrefix?: string
  ) {
    const filePaths = [...destSplits];
    if (nested) {
      filePaths.push(name);
    }
    const defaultFolder = this.DEFAULT_FOLDERS[type];
    const path = [
      src,
      defaultFolder,
      ...filePaths,
      `${name}.${type}.${extPrefix ? extPrefix + '.' : ''}${ext}`,
    ]
      .join('/')
      .replace(`${defaultFolder}/${defaultFolder}`, defaultFolder);
    const fullPath = resolve(path);
    return {path, fullPath};
  }

  private buildMainContent(type: string, {className, tagName}: Names) {
    switch (type) {
      case this.SERVICE:
        return this.contentForService(className);
      case this.LAYOUT:
        return this.contentForLayout(className, tagName);
      case this.PAGE:
        return this.contentForPage(className, tagName);
      case this.COMPONENT:
        return this.contentForComponent(className, tagName);
      default:
        return '';
    }
  }

  private contentForService(className: string) {
    return `
export class ${className} {
  name = '${className}';
}
    `;
  }

  private contentForLayout(className: string, tagName: string) {
    return `
import {TiniComponent, Layout, html} from '@tinijs/core';

@Layout('${tagName}')
export class ${className} extends TiniComponent {
  protected render() {
    return html\`
      <div class="${tagName}">
        <div class="page"><slot></slot></div>
      </div>
    \`;
  }

  static styles = css\`
    :host {
      margin: 0;
    }
  \`;
}

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': ${className};
  }
}
    `;
  }

  private contentForPage(className: string, tagName: string) {
    return `
import {TiniComponent, Page, State, html, css} from '@tinijs/core';
import {SubscribeStore, StoreSubscription} from '@tinijs/store';

import {States} from '../app/states';

@Page('${tagName}')
export class ${className} extends TiniComponent {
  @SubscribeStore() storeSubscription!: StoreSubscription<States>;

  @State() name!: string;

  onInit() {
    this.storeSubscription.subscribe(states => {
      this.name = states.name;
    });
  }

  protected render() {
    return html\`
      <div class="${tagName}">${className}</div>
    \`;
  }

  static styles = css\`
    :host {
      margin: 0;
    }
  \`;
}

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': ${className};
  }
}
    `;
  }

  private contentForComponent(className: string, tagName: string) {
    return `
import {TiniComponent, Component, Property, html} from '@tinijs/core';
import {SubscribeStore, StoreSubscription} from '@tinijs/store';

import {States} from '../app/states';

@Component('${tagName}')
export class ${className} extends TiniComponent {
  @Property({ type: String }) attr: string;

  onCreate() {
    
  }

  protected render() {
    return html\`
      <div class="${tagName}">${className}</div>
    \`;
  }

  static styles = css\`
    :host {
      margin: 0;
    }
  \`;
}

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': ${className};
  }
}
    `;
  }
}
