import { addCommand } from './commands/add.js';
import { initCommand } from './commands/init.js';
import { listCommand } from './commands/list.js';
import { exportCommand } from './commands/export.js';
import { syncCommand } from './commands/sync.js';

const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const WHITE = '\x1b[37m';
const GRAY = '\x1b[90m';

const HELP = `
${YELLOW}    ╔═╗╦╔═╦╦  ╦  ╔═╗╔╦╗╦╔╦╗╦ ╦${RESET}
${YELLOW}    ╚═╗╠╩╗║║  ║  ╚═╗║║║║ ║ ╠═╣${RESET}
${YELLOW}    ╚═╝╩ ╩╩╩═╝╩═╝╚═╝╩ ╩╩ ╩ ╩ ╩${RESET}
${DIM}    Forge once, export everywhere${RESET}

${BOLD}${WHITE}USAGE${RESET}

  ${CYAN}$${RESET} skillsmith ${GREEN}<command>${RESET} [options]

${BOLD}${WHITE}COMMANDS${RESET}

  ${GREEN}add${RESET} <skillpath> -a <vendor>   Install a skill and track it
  ${GREEN}sync${RESET}                          Re-export all tracked skills
  ${GREEN}init${RESET} [name]                   Scaffold a new skill template
  ${GREEN}list${RESET}                          List installed skills
  ${GREEN}export${RESET} <skillpath> [...]       Export skill(s) to all vendors

${BOLD}${WHITE}VENDORS${RESET}

  claude ${GRAY}│${RESET} cursor ${GRAY}│${RESET} windsurf ${GRAY}│${RESET} copilot ${GRAY}│${RESET} codex ${GRAY}│${RESET} all

${BOLD}${WHITE}EXAMPLES${RESET}

  ${GRAY}# Create a new skill${RESET}
  ${CYAN}$${RESET} skillsmith init typescript-standards

  ${GRAY}# Export to a single vendor${RESET}
  ${CYAN}$${RESET} skillsmith add ./my-skill -a claude

  ${GRAY}# Export to all vendors at once${RESET}
  ${CYAN}$${RESET} skillsmith add ./my-skill -a all

  ${GRAY}# Update all tracked skills from source${RESET}
  ${CYAN}$${RESET} skillsmith sync
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'add':
      await addCommand(commandArgs);
      break;
    case 'sync':
      await syncCommand();
      break;
    case 'init':
      await initCommand(commandArgs);
      break;
    case 'list':
      await listCommand();
      break;
    case 'export':
      await exportCommand(commandArgs);
      break;
    case '--help':
    case '-h':
    case 'help':
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
