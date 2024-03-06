import typescript, {CompilerOptions} from 'typescript';
import {resolve} from 'pathe';
import fsExtra from 'fs-extra';

const {createCompilerHost, createProgram} = typescript;
const {outputFile} = fsExtra;

export function transpileFiles(paths: string[], options: CompilerOptions) {
  const createdFiles: Record<string, string> = {};
  // create the host
  const host = createCompilerHost(options);
  host.writeFile = (path: string, content: string) =>
    (createdFiles[path] = content);
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
      mapContent,
    };
  });
}

export async function transpileAndOutputFiles(
  paths: string[],
  options: CompilerOptions,
  outDir: string,
  filePathProcessor?: (path: string) => string,
  contentProcessor?: (content: string) => string
) {
  const transpiledResults = transpileFiles(paths, options);
  for (let i = 0; i < transpiledResults.length; i++) {
    const {path, jsContent, dtsContent, mapContent} = transpiledResults[i];
    const filePath = !filePathProcessor ? path : filePathProcessor(path);
    await outputFile(
      resolve(outDir, filePath.replace('.ts', '.js')),
      !contentProcessor ? jsContent : contentProcessor(jsContent)
    );
    await outputFile(
      resolve(outDir, filePath.replace('.ts', '.d.ts')),
      !contentProcessor ? dtsContent : contentProcessor(dtsContent)
    );
    await outputFile(
      resolve(outDir, filePath.replace('.ts', '.js.map')),
      !contentProcessor ? mapContent : contentProcessor(mapContent)
    );
  }
}
