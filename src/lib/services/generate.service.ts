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
  SERVICE = 'service';
  LAYOUT = 'layout';
  PAGE = 'page';
  COMPONENT = 'component';
  HELPER = 'helper';
  CONST = 'const';

  DEFAULT_FOLDERS = {
    [this.SERVICE]: 'services',
    [this.LAYOUT]: 'layouts',
    [this.PAGE]: 'pages',
    [this.COMPONENT]: 'components',
    [this.HELPER]: 'helpers',
    [this.CONST]: 'consts',
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
        : `${type}-${nameParam}`;
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
      '.',
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
    {className, tagName, nameCamel, nameCapital}: Names
  ) {
    switch (type) {
      case this.SERVICE:
        return this.contentForService(className);
      case this.LAYOUT:
        return this.contentForLayout(className, tagName);
      case this.PAGE:
        return this.contentForPage(className, tagName);
      case this.COMPONENT:
        return this.contentForComponent(className, tagName);
      case this.HELPER:
        return this.contentForHelper(nameCamel, nameCapital);
      case this.CONST:
        return this.contentForConst(nameCamel, nameCapital);
      default:
        return '';
    }
  }

  private contentForService(className: string) {
    return `
export class ${className} {
  name = '${className}';
}

export default ${className};
`;
  }

  private contentForLayout(className: string, tagName: string) {
    return `@Layout('${tagName}')
export class ${className} extends TiniComponent {
  static styles = [
    unistylus\`\`,
    css\`
      :host {
        margin: 0;
      }
    \`,
  ];

  protected render() {
    return html\`<div class="page"><slot></slot></div>\`;
  }
}
`;
  }

  private contentForPage(className: string, tagName: string) {
    return `import {States} from '../app/states';

@Page('${tagName}')
export class ${className} extends TiniComponent {
  @SubscribeStore() store!: StoreSubscription<States>;
  @Reactive() name!: string;

  static styles = [
    unistylus\`\`,
    css\`
      :host {
        margin: 0;
      }
    \`,
  ];

  protected render() {
    return html\`<p>${className}</p>\`;
  }

  onInit() {
    this.store.subscribe(states => {
      // do something with the states
      // this.name = states.name;
    });
  }
}
`;
  }

  private contentForComponent(className: string, tagName: string) {
    return `@Component('${tagName}')
export class ${className} extends TiniComponent {
  @Input() attr?: string;
  @Output() customEvent!: EventEmitter<string>;

  static styles = [
    unistylus\`\`,
    css\`
      :host {
        margin: 0;
      }
    \`,
  ];

  protected render() {
    return html\`<p @click=\${this.emitCustomEvent}>${className}</p>\`;
  }

  onCreate() {
    // element connected
  }

  emitCustomEvent() {
    this.customEvent.emit('any payload');
  }
}
`;
  }

  private contentForHelper(nameCamel: string, nameCapital: string) {
    const typeName = nameCapital.replace(/ /g, '');
    return `
function ${nameCamel}(param: string) {
  return param.toUpperCase();
}

export default ${nameCamel};
export type ${typeName} = typeof ${nameCamel};
`;
  }

  private contentForConst(nameCamel: string, nameCapital: string) {
    const typeName = nameCapital.replace(/ /g, '');
    return `
const ${nameCamel} = 'value';

export default ${nameCamel};
export type ${typeName} = typeof ${nameCamel};
`;
  }
}
