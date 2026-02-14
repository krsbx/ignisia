import { $ } from 'bun';

type PackagePath = `packages/${string & {}}`;

const series: PackagePath[] = [
  'packages/utils',
  'packages/cli-core',
  'packages/encryption',
  'packages/nosql',
  'packages/sql',
  'packages/ignisia',
  'packages/securedb',
  'packages/replica',
];

function logBuild(dir: string | string[]) {
  const dirs = (Array.isArray(dir) ? dir : [dir]).map((dir) =>
    dir.replace('packages/', '')
  );

  const dirCount = dirs.length;

  if (dirCount === 1) {
    console.log(`\x1b[33mBuilding packages/${dirs[0]}...\x1b[0m`);
    return;
  }

  console.log(`\x1b[33mBuilding packages/{${dirs.join(', ')}}...\x1b[0m`);
}

async function build(
  path: string,
  retryCount: number = 0,
  maxRetryCount: number = 3
) {
  try {
    return $`cd ${path} && bun run build`.quiet();
  } catch (err) {
    await Bun.sleep(1000);

    if (retryCount < maxRetryCount) {
      return build(path, retryCount + 1, maxRetryCount);
    }

    throw err;
  }
}

async function buildAll(
  dirs: string[],
  mode: 'series' | 'parallel',
  context: string
) {
  console.log(`\x1b[34mBuilding ${context}...\x1b[0m\n`);

  logBuild(dirs);

  if (mode === 'series') {
    for (const dir of dirs) {
      await build(dir);
    }
  } else {
    await Promise.all(dirs.map((dir) => build(dir)));
  }

  console.log(
    `\x1b[32m\n${context[0].toUpperCase() + context.slice(1)} built.\x1b[0m\n`
  );
}

await buildAll(series, 'series', 'series');
