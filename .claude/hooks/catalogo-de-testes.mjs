// Hook PostToolUse (Edit, Write, MultiEdit): mexeu num teste de ponta a ponta (frontend/e2e/*.spec.ts)
// ou na lista de personas, regrava o catálogo da galeria /testes na hora. Teste sem persona, ou com
// persona desconhecida, volta como bloqueio para o Claude corrigir antes de seguir.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATILHO = /frontend[\\/](e2e[\\/][^\\/]+\.spec\.ts|src[\\/]app[\\/]testes[\\/]personas\.ts)$/;

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const arquivo = entrada.tool_input?.file_path ?? entrada.tool_response?.filePath ?? '';
if (!GATILHO.test(arquivo)) process.exit(0);

try {
  const saida = execFileSync(process.execPath, [join('scripts', 'catalogo-de-testes.mjs')], {
    cwd: join(RAIZ, 'frontend'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          `Catálogo da galeria /testes regravado (${saida.trim()}); ` +
          'commitar frontend/src/app/testes/catalogo.ts junto.',
      },
    }),
  );
} catch (erro) {
  const detalhe = String(erro.stderr || erro.message).trim();
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        `O catálogo da galeria /testes não pôde ser regravado:\n${detalhe}\n` +
        'Cada teste precisa de tag de persona conhecida (frontend/src/app/testes/personas.ts).',
    }),
  );
}
