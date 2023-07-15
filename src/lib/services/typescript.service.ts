import {createCompilerHost, createProgram, CompilerOptions} from 'typescript';

export class TypescriptService {
  constructor() {}

  transpileFiles(paths: string[], options: CompilerOptions) {
    const createdFiles: Record<string, string> = {};
    // create the host
    const host = createCompilerHost(options);
    host.writeFile = (path: string, content: string) => createdFiles[path] = content;
    // emit the files
    const program = createProgram(paths, options, host);
    program.emit();
    // result
    return paths.map(path => {
      const jsContent = createdFiles[path.replace('.ts', '.js')];
      const dtsContent = createdFiles[path.replace('.ts', '.d.ts')];
      const mapContent = createdFiles[path.replace('.ts', '.js.map')];
      return {
        path,
        jsContent,
        dtsContent,
        mapContent
      };
    })
  }
}
